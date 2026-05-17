import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/lib/auth/actions";
import { startCheckoutAction, openCustomerPortalAction } from "@/lib/billing/actions";
import { PLANS, trialDaysRemaining, type PlanId } from "@/lib/billing/plans";
import { getActiveOrg } from "@/lib/auth/context";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { ExternalLink, Mail, Check, CreditCard, AlertCircle, FileBadge } from "lucide-react";
import { formatCAD, cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  // Resolve current plan + trial state from the DB (demo: synthesize defaults).
  let currentPlan: PlanId = "trial";
  let createdAt: Date = new Date();
  if (!isDemoMode()) {
    const [row] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, org.id))
      .limit(1);
    if (row) {
      currentPlan = row.plan as PlanId;
      createdAt = row.createdAt;
    }
  }
  const plan = PLANS[currentPlan];
  const daysLeft = trialDaysRemaining(createdAt);
  const trialExpired = currentPlan === "trial" && daysLeft === 0;

  return (
    <AppShell
      active="/app/settings"
      pageTitle="Settings"
      pageDescription="Organization, members, billing, and jurisdiction preferences."
    >
      {params.billing && <BillingFlash status={params.billing} planId={params.plan} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Visible to your team and on audit-report headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Legal name</Label>
                <Input id="orgName" defaultValue={org.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgProvince">Primary province</Label>
                <Input id="orgProvince" defaultValue={org.province} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgSize">Employee count bucket</Label>
                <Input id="orgSize" defaultValue={org.employeeCountBucket} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgRecruiter">Sender email (Resend)</Label>
                <Input id="orgRecruiter" defaultValue="people@acme.ca" />
              </div>
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan &amp; billing</CardTitle>
            <CardDescription>Stripe (CAD) — GST/HST applied at checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{plan.name} plan</div>
                  <div className="text-xs text-muted-foreground">
                    {plan.priceCAD === 0 ? "Free during trial" : `${formatCAD(plan.priceCAD)} CAD / month`}
                  </div>
                </div>
                {currentPlan === "trial" ? (
                  trialExpired ? (
                    <Badge variant="danger">Trial expired</Badge>
                  ) : (
                    <Badge variant="success">{daysLeft}d left</Badge>
                  )
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            </div>

            {currentPlan === "trial" || trialExpired ? (
              <form action={startCheckoutAction.bind(null, "team")}>
                <Button type="submit" className="w-full">
                  <CreditCard className="h-4 w-4" /> Upgrade to Team
                </Button>
              </form>
            ) : (
              <form action={openCustomerPortalAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Manage billing <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Choose a plan</CardTitle>
          <CardDescription>14-day free trial on every plan. Annual billing saves two months.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {(["solo", "team", "multi"] as PlanId[]).map((id) => {
              const p = PLANS[id];
              const isCurrent = currentPlan === id;
              return (
                <div
                  key={id}
                  className={cn(
                    "flex flex-col rounded-lg border p-5",
                    id === "team" ? "border-primary/60 bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="font-semibold">{p.name}</div>
                    {id === "team" && !isCurrent && <Badge variant="default">Recommended</Badge>}
                    {isCurrent && <Badge variant="success">Current</Badge>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold">{formatCAD(p.priceCAD)}</span>
                    <span className="text-xs text-muted-foreground">CAD / month</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                    <PlanFeatureLine label="Postings" value={p.postingLimitPerYear == null ? "Unlimited" : `${p.postingLimitPerYear} / year`} />
                    <PlanFeatureLine label="Users" value={p.seats == null ? "Unlimited" : String(p.seats)} />
                    <PlanFeatureLine label="CSV import" value={p.features.csv_import ? "Yes" : "—"} />
                    <PlanFeatureLine label="Compliance report" value={p.features.compliance_report ? "Yes" : "—"} />
                    <PlanFeatureLine label="Multi-province" value={p.features.multi_province ? "Yes" : "—"} />
                    <PlanFeatureLine label="Priority support" value={p.features.priority_support ? "Yes" : "—"} />
                  </ul>
                  <form action={startCheckoutAction.bind(null, id)} className="mt-5">
                    <Button
                      type="submit"
                      variant={id === "team" ? "default" : "outline"}
                      className="w-full"
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current plan" : `Switch to ${p.name}`}
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Invite recruiters, HR coordinators, and admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {[
              { name: "You (Owner)", email: "you@acme.ca", role: "owner" },
              { name: "Sara Chen", email: "sara.chen@acme.ca", role: "admin" },
              { name: "Devon Walsh", email: "devon.walsh@acme.ca", role: "recruiter" },
            ].map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "muted"}>{m.role}</Badge>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex gap-2">
            <Input placeholder="invite@example.ca" />
            <Button variant="outline">
              <Mail className="h-4 w-4" /> Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>
            Every state-changing action on this workspace — postings, notifications, imports, reports, billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/app/settings/audit">
              <FileBadge className="h-4 w-4" /> Open audit log
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function PlanFeatureLine({ label, value }: { label: string; value: string }) {
  const yes = value !== "—";
  return (
    <li className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", yes ? "text-foreground" : "text-muted-foreground")}>
        {yes && value === "Yes" ? <Check className="h-3.5 w-3.5 text-primary" /> : value}
      </span>
    </li>
  );
}

function BillingFlash({ status, planId }: { status: string; planId?: string }) {
  const map: Record<string, { tone: "success" | "warning" | "danger"; title: string; body: string }> = {
    success: {
      tone: "success",
      title: `You're on the ${planId ?? "new"} plan`,
      body: "Stripe has confirmed your subscription. Your trial is over and your workspace is fully unlocked.",
    },
    cancel: {
      tone: "warning",
      title: "Checkout cancelled",
      body: "No charges were made. Your trial continues for the remaining days.",
    },
    demo: {
      tone: "warning",
      title: "Demo mode",
      body: "Billing is disabled in demo mode. Configure Stripe + flip CLEARPOST_DEMO_MODE=false to take real payments.",
    },
    not_configured: {
      tone: "warning",
      title: "Stripe not configured",
      body: "Set STRIPE_SECRET_KEY and the NEXT_PUBLIC_STRIPE_PRICE_* env vars to enable checkout.",
    },
    price_missing: {
      tone: "warning",
      title: "Missing price id for this plan",
      body: "Add the Stripe price id env var for this plan and redeploy.",
    },
    no_customer: {
      tone: "warning",
      title: "No Stripe customer yet",
      body: "Complete checkout first; the customer portal opens after your first subscription.",
    },
    checkout_url_missing: {
      tone: "danger",
      title: "Stripe didn't return a checkout URL",
      body: "Please try again. If this keeps happening, contact support.",
    },
  };
  const flash = map[status];
  if (!flash) return null;
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg border p-3 text-sm",
        flash.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        flash.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        flash.tone === "danger" && "border-red-200 bg-red-50 text-red-900"
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-medium">{flash.title}</div>
        <div className="text-xs">{flash.body}</div>
      </div>
    </div>
  );
}
