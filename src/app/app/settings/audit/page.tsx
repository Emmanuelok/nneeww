import Link from "next/link";
import { redirect } from "next/navigation";
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
import { getActiveOrg } from "@/lib/auth/context";
import {
  listAuditEvents,
  auditCategoryCounts,
  type AuditEvent,
  type AuditEventCategory,
} from "@/lib/repositories/audit";
import {
  ArrowLeft,
  ClipboardList,
  ShieldCheck,
  Users,
  AlarmClock,
  Upload,
  FileBadge,
  CreditCard,
  Building,
  Mail,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Archive,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Audit log" };

const CATEGORY_META: Record<
  AuditEventCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  postings: { label: "Postings", icon: ClipboardList, tone: "text-primary" },
  compliance: { label: "Compliance", icon: ShieldCheck, tone: "text-amber-700" },
  candidates: { label: "Candidates", icon: Users, tone: "text-blue-700" },
  notifications: { label: "Notifications", icon: AlarmClock, tone: "text-rose-700" },
  csv_imports: { label: "Imports", icon: Upload, tone: "text-indigo-700" },
  reports: { label: "Reports", icon: FileBadge, tone: "text-emerald-700" },
  billing: { label: "Billing", icon: CreditCard, tone: "text-slate-700" },
  organization: { label: "Organization", icon: Building, tone: "text-slate-700" },
};

const ACTION_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "posting.created": ClipboardList,
  "posting.taken_down": Archive,
  "compliance.checks_failed": AlertTriangle,
  "interview.logged": Users,
  "notification.sent": Send,
  "notification.viewed": Eye,
  "email.delivered": Mail,
  "email.bounced": XCircle,
  "digest.sent": Mail,
  "report.generated": Download,
  "csv.postings_imported": Upload,
  "csv.candidates_imported": Upload,
  "vault.item_archived": Archive,
  "billing.checkout_started": CreditCard,
  "billing.checkout_completed": CheckCircle2,
  "billing.subscription_created": CreditCard,
  "billing.subscription_updated": CreditCard,
  "billing.subscription_deleted": CreditCard,
  "billing.payment_failed": AlertTriangle,
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const params = await searchParams;
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const category = params.cat as AuditEventCategory | undefined;
  const q = params.q?.trim() || undefined;

  const [events, counts] = await Promise.all([
    listAuditEvents(org.id, { category, search: q, limit: 250 }),
    auditCategoryCounts(org.id),
  ]);

  return (
    <AppShell
      active="/app/settings"
      pageTitle="Audit log"
      pageDescription="Every state-changing action on this workspace. Filterable, searchable, exportable as part of the compliance report."
      actions={
        <Button asChild variant="outline">
          <Link href="/app/settings">
            <ArrowLeft className="h-4 w-4" /> Back to settings
          </Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CategoryChip href="/app/settings/audit" active={!category} count={Object.values(counts).reduce((a, b) => a + b, 0)}>
          All
        </CategoryChip>
        {(Object.keys(CATEGORY_META) as AuditEventCategory[]).map((c) => (
          <CategoryChip
            key={c}
            href={`/app/settings/audit?cat=${c}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={category === c}
            count={counts[c] ?? 0}
          >
            {CATEGORY_META[c].label}
          </CategoryChip>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>
              {events.length} event{events.length === 1 ? "" : "s"}
              {category && ` · ${CATEGORY_META[category].label}`}
              {q && ` · search "${q}"`}
            </CardTitle>
            <CardDescription>
              Newest first. Click a row to expand the structured payload.
            </CardDescription>
          </div>
          <form action="/app/settings/audit" method="get" className="flex items-center gap-2">
            {category && <input type="hidden" name="cat" value={category} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Search action, entity, payload…"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No events match this filter.
            </p>
          ) : (
            <ol className="divide-y divide-border/60">
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        The audit log is preserved indefinitely. A flattened export is included in the
        compliance package generated from{" "}
        <Link href="/app/compliance" className="text-primary hover:underline">
          /app/compliance
        </Link>
        .
      </p>
    </AppShell>
  );
}

function CategoryChip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {children}
      <span
        className={cn(
          "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]",
          active
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function EventRow({ event }: { event: AuditEvent }) {
  const meta = CATEGORY_META[event.category];
  const Icon = ACTION_ICON[event.action] ?? meta.icon;
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer items-start justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-secondary/30 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary",
                meta.tone
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xs uppercase tracking-wide text-foreground">
                  {event.action}
                </span>
                <Badge variant="muted" className="text-[10px]">
                  {event.entityType}
                </Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {event.actor ? (
                  <>
                    {event.actor.name ?? event.actor.email} ·{" "}
                  </>
                ) : (
                  <>system · </>
                )}
                {formatStamp(event.createdAt)}
                {event.entityId && (
                  <>
                    {" · "}
                    <span className="font-mono">{event.entityId.slice(0, 8)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
        </summary>
        {event.payload && Object.keys(event.payload).length > 0 && (
          <pre className="mx-6 mb-4 max-h-72 overflow-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        )}
      </details>
    </li>
  );
}

function formatStamp(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

// Suppress unused-import warning for icons referenced only via ACTION_ICON map.
void [FileText];
