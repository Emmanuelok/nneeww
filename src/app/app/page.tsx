import Link from "next/link";
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
import {
  AlarmClock,
  Archive,
  ClipboardList,
  FileBadge,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { dashboardStats, demoCandidates, demoPostings } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default function AppHomePage() {
  const stats = dashboardStats();

  const urgent = demoCandidates
    .filter((c) => c.notificationStatus !== "sent")
    .sort((a, b) => a.daysToDeadline - b.daysToDeadline)
    .slice(0, 5);

  const flaggedPostings = demoPostings.filter((p) => p.failedChecks > 0 && p.status === "live");

  return (
    <AppShell
      active="/app"
      pageTitle="Compliance dashboard"
      pageDescription="Ontario (Employment Standards Act) is active. You're on a 14-day trial."
      actions={
        <Button asChild>
          <Link href="/app/postings/new">
            <Plus className="h-4 w-4" /> New posting check
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <KPI title="Compliance score" value={`${stats.avgScore}%`} hint={`${stats.failingPostings} posting${stats.failingPostings === 1 ? "" : "s"} need review`} tone={stats.avgScore >= 80 ? "success" : "warning"} />
        <KPI title="45-day deadlines" value={String(stats.overdue + stats.upcomingWeek)} hint={`${stats.overdue} overdue · ${stats.upcomingWeek} this week`} tone={stats.overdue > 0 ? "danger" : "warning"} />
        <KPI title="Postings live" value={String(stats.live)} hint="Across Ontario" tone="muted" />
        <KPI title="Vault items" value={String(stats.vaultCount)} hint="Auto-archive enabled" tone="muted" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>45-day inbox</CardTitle>
              <CardDescription>Candidates approaching or past their notification deadline.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/notifications">Open inbox</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {urgent.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {c.postingTitle} · final interview {c.lastInterviewDate.toLocaleDateString("en-CA")}
                    </div>
                  </div>
                  <DeadlinePill days={c.daysToDeadline} status={c.notificationStatus} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Postings flagged
            </CardTitle>
            <CardDescription>Live postings with failing compliance checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedPostings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flagged postings. Nice.</p>
            ) : (
              flaggedPostings.map((p) => (
                <Link
                  key={p.id}
                  href={`/app/postings/${p.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-foreground/30 hover:bg-secondary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">{p.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.location}</div>
                    </div>
                    <Badge variant={p.failedChecks >= 2 ? "danger" : "warning"} className="shrink-0">
                      {p.failedChecks} failing
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Todo
          icon={ClipboardList}
          title="Run a posting through the checker"
          body="Paste a URL or text and we'll return a per-clause compliance report in 5 seconds."
          href="/app/postings/new"
          cta="Check a posting"
        />
        <Todo
          icon={AlarmClock}
          title="Log your recent interviews"
          body="Every interview starts a 45-day countdown so you'll never miss a notification deadline."
          href="/app/candidates"
          cta="Log interviews"
        />
        <Todo
          icon={FileBadge}
          title="Generate a compliance report"
          body="Audit-ready PDF + ZIP — the document you hand to an ESA officer if asked."
          href="/app/compliance"
          cta="Open compliance"
        />
      </div>
    </AppShell>
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
  tone: "success" | "warning" | "danger" | "muted";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
        <div
          className={cn(
            "mt-1 text-xs",
            tone === "success" && "text-emerald-700",
            tone === "warning" && "text-amber-700",
            tone === "danger" && "text-red-700",
            tone === "muted" && "text-muted-foreground"
          )}
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
    <Card>
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{body}</div>
        </div>
        <Button asChild size="sm" variant="outline" className="self-start">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DeadlinePill({ days, status }: { days: number; status: "pending" | "sent" | "overdue" }) {
  if (status === "sent") {
    return <Badge variant="success" className="shrink-0">Notified</Badge>;
  }
  if (days < 0) {
    return (
      <Badge variant="danger" className="shrink-0">
        {Math.abs(days)}d overdue
      </Badge>
    );
  }
  if (days <= 5) {
    return (
      <Badge variant="danger" className="shrink-0">
        {days}d left
      </Badge>
    );
  }
  if (days <= 15) {
    return (
      <Badge variant="warning" className="shrink-0">
        {days}d left
      </Badge>
    );
  }
  return (
    <Badge variant="muted" className="shrink-0">
      {days}d left
    </Badge>
  );
}
