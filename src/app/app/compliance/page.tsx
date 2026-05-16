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
import { Download, ExternalLink, ShieldCheck, FileBadge } from "lucide-react";
import Link from "next/link";
import { JURISDICTIONS } from "@/lib/compliance/jurisdictions";
import { demoPostings, dashboardStats } from "@/lib/demo/data";

export const metadata = { title: "Compliance" };

export default function CompliancePage() {
  const stats = dashboardStats();
  const failingPostings = demoPostings.filter((p) => p.failedChecks > 0 && p.status === "live");

  return (
    <AppShell
      active="/app/compliance"
      pageTitle="Compliance"
      pageDescription="Per-jurisdiction status across all postings, with statute citations and a one-click audit report."
      actions={
        <Button>
          <Download className="h-4 w-4" /> Generate report (PDF + ZIP)
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Average compliance score
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{stats.avgScore}%</div>
            <p className="mt-1 text-xs text-muted-foreground">Across {stats.live} live postings.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileBadge className="h-3.5 w-3.5" /> Postings with failing checks
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{failingPostings.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Open each one for the per-clause breakdown.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-medium text-muted-foreground">45-day deadline backlog</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{stats.overdue + stats.upcomingWeek}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.overdue} overdue · {stats.upcomingWeek} this week
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Jurisdiction coverage</CardTitle>
          <CardDescription>
            Adding a new province is a config entry — no schema migration required.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {Object.values(JURISDICTIONS).map((j) => (
              <li key={j.code} className="flex items-center justify-between gap-3 px-6 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{j.name}</span>
                    {j.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Coming soon</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Effective {new Date(j.effectiveDate).toLocaleDateString("en-CA")} ·{" "}
                    {j.rules.candidateNotificationDays
                      ? `${j.rules.candidateNotificationDays}-day notification · `
                      : ""}
                    {j.rules.recordRetentionYears
                      ? `${j.rules.recordRetentionYears}-yr retention`
                      : "no retention rule"}
                  </div>
                </div>
                <a
                  href={j.statuteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Statute <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {failingPostings.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Postings to fix</CardTitle>
            <CardDescription>Sorted by number of failing checks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {failingPostings
                .sort((a, b) => b.failedChecks - a.failedChecks)
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                    <div className="min-w-0">
                      <Link href={`/app/postings/${p.id}`} className="text-sm font-medium hover:text-primary">
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.location} · posted {p.postedAt.toLocaleDateString("en-CA")}
                      </div>
                    </div>
                    <Badge variant={p.failedChecks >= 2 ? "danger" : "warning"}>
                      {p.failedChecks} failing
                    </Badge>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        The audit report bundles every live posting's compliance check, every notification proof, every retained
        form, the jurisdiction coverage summary, and the statute citations into one PDF + ZIP — the document you
        hand to a Ministry of Labour officer if asked.
      </p>
    </AppShell>
  );
}
