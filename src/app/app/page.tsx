import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlarmClock, Archive, ClipboardList, FileBadge, Leaf } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default function AppHomePage() {
  return (
    <div className="min-h-screen bg-secondary/20">
      <header className="border-b border-border/60 bg-background">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-3.5 w-3.5" />
            </span>
            ClearPost
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/app" className="text-foreground">Dashboard</Link>
            <Link href="/app/postings" className="hover:text-foreground">Postings</Link>
            <Link href="/app/notifications" className="hover:text-foreground">45-day inbox</Link>
            <Link href="/app/vault" className="hover:text-foreground">Vault</Link>
            <Link href="/app/settings" className="hover:text-foreground">Settings</Link>
          </nav>
        </div>
      </header>

      <main className="container py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compliance dashboard</h1>
            <p className="text-sm text-muted-foreground">
              You're on a 14-day trial. Ontario rules engine active.
            </p>
          </div>
          <Badge variant="success">Trial active</Badge>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <KPI title="Compliance score" value="84%" hint="3 postings need review" tone="success" />
          <KPI title="Deadlines this week" value="7" hint="2 overdue" tone="warning" />
          <KPI title="Postings live" value="12" hint="2 missing pay range" tone="muted" />
          <KPI title="Vault items" value="38" hint="oldest expires 2028" tone="muted" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Welcome to ClearPost</CardTitle>
              <CardDescription>
                Three things to do today to get fully set up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Todo
                icon={ClipboardList}
                title="Import your active postings"
                body="Paste a URL or upload a CSV. We'll run each through the Ontario compliance checker."
                href="/app/postings/new"
                cta="Add a posting"
              />
              <Todo
                icon={AlarmClock}
                title="Log your recent interviews"
                body="Every candidate gets a 45-day countdown so you'll never miss a notification deadline."
                href="/app/candidates"
                cta="Log interviews"
              />
              <Todo
                icon={FileBadge}
                title="Invite a teammate"
                body="Bring your HR coordinator or recruiter into the workspace."
                href="/app/settings"
                cta="Invite teammate"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retention vault</CardTitle>
              <CardDescription>3-year archive, auto-managed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/30 p-3">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <div className="font-medium">Nothing archived yet</div>
                  <div className="text-xs text-muted-foreground">
                    Items move here automatically when a posting is taken down.
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/app/vault">Open vault</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          ClearPost is a compliance operations tool. Not legal advice. Confirm with HR counsel.
        </p>
      </main>
    </div>
  );
}

function KPI({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "success" | "warning" | "muted";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        <div
          className={
            "mt-1 text-xs " +
            (tone === "success"
              ? "text-emerald-700"
              : tone === "warning"
              ? "text-amber-700"
              : "text-muted-foreground")
          }
        >
          {hint}
        </div>
      </CardContent>
    </Card>
  );
}

function Todo({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border p-4">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
