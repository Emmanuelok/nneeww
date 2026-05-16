import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDemoPosting, getCandidatesForPosting } from "@/lib/demo/data";
import { runComplianceChecks, type CheckResult } from "@/lib/compliance/checker";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getDemoPosting(id);
  return { title: p?.title ?? "Posting" };
}

export default async function PostingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posting = getDemoPosting(id);
  if (!posting) notFound();

  const report = runComplianceChecks({
    title: posting.title,
    rawText: posting.rawText,
    jurisdiction: posting.jurisdiction,
    vacancyStatus: posting.vacancyStatus,
    aiUsed: posting.aiUsed,
    compensationMin: posting.compensationMin,
    compensationMax: posting.compensationMax,
    compensationCurrency: posting.compensationCurrency,
  });

  const candidates = getCandidatesForPosting(posting.id);

  return (
    <AppShell
      active="/app/postings"
      pageTitle={posting.title}
      pageDescription={`${posting.department} · ${posting.location} · posted ${posting.postedAt.toLocaleDateString("en-CA")}`}
      actions={
        <Button asChild variant="outline">
          <Link href="/app/postings">
            <ArrowLeft className="h-4 w-4" /> All postings
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Compliance report</CardTitle>
                <CardDescription>{report.jurisdiction.name} · re-runs each time you update the posting</CardDescription>
              </div>
              <Badge
                variant={
                  report.riskTier === "high"
                    ? "danger"
                    : report.riskTier === "moderate"
                    ? "warning"
                    : "success"
                }
              >
                Score {report.score}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.results.map((r) => (
                <CheckRow key={r.id} result={r} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posting text</CardTitle>
              <CardDescription>
                Archived for 3 years from takedown ({posting.retentionUntil?.toLocaleDateString("en-CA")}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-secondary/30 p-4 font-mono text-[13px] leading-relaxed">
                {posting.rawText}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Posting details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Status">
                <Badge variant={posting.status === "live" ? "success" : "muted"}>{posting.status}</Badge>
              </Row>
              <Row label="Department">{posting.department}</Row>
              <Row label="Location">{posting.location}</Row>
              <Row label="Vacancy">
                {posting.vacancyStatus === "existing_vacancy"
                  ? "Existing vacancy"
                  : posting.vacancyStatus === "pipeline"
                  ? "Pipeline build"
                  : "Not stated"}
              </Row>
              <Row label="AI screening">{posting.aiUsed ? "Disclosed (used)" : "Not used"}</Row>
              <Row label="Compensation">
                {posting.compensationMin && posting.compensationMax
                  ? `$${posting.compensationMin.toLocaleString("en-CA")} – $${posting.compensationMax.toLocaleString("en-CA")} ${posting.compensationCurrency}`
                  : "Not disclosed"}
              </Row>
              <Row label="Posted">{posting.postedAt.toLocaleDateString("en-CA")}</Row>
              <Separator />
              <a
                href={posting.postingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View original <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidates ({candidates.length})</CardTitle>
              <CardDescription>Tied to this posting via interview log.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {candidates.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  No interviews logged for this posting yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {candidates.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-6 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.source} · final interview {c.lastInterviewDate.toLocaleDateString("en-CA")}
                        </div>
                      </div>
                      {c.notificationStatus === "sent" ? (
                        <Badge variant="success">Notified</Badge>
                      ) : c.daysToDeadline < 0 ? (
                        <Badge variant="danger">{Math.abs(c.daysToDeadline)}d overdue</Badge>
                      ) : (
                        <Badge variant={c.daysToDeadline <= 5 ? "danger" : c.daysToDeadline <= 15 ? "warning" : "muted"}>
                          {c.daysToDeadline}d left
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function CheckRow({ result }: { result: CheckResult }) {
  const Icon =
    result.status === "pass"
      ? CheckCircle2
      : result.status === "warn"
      ? AlertTriangle
      : result.status === "fail"
      ? XCircle
      : Info;
  const tint =
    result.status === "pass"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : result.status === "warn"
      ? "text-amber-800 bg-amber-50 border-amber-100"
      : result.status === "fail"
      ? "text-red-700 bg-red-50 border-red-100"
      : "text-muted-foreground bg-secondary/60 border-border";

  return (
    <div className="rounded-lg border border-border/60 p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            tint
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">{result.label}</div>
            <Badge
              variant={
                result.status === "pass"
                  ? "success"
                  : result.status === "warn"
                  ? "warning"
                  : result.status === "fail"
                  ? "danger"
                  : "muted"
              }
              className="shrink-0 text-[10px] uppercase tracking-wide"
            >
              {result.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{result.message}</p>
          {result.detail && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">
              {result.detail}
            </p>
          )}
          {result.suggestion && (
            <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs leading-relaxed">
              <div className="mb-1 text-[10px] uppercase tracking-wide text-primary">Suggested fix</div>
              <p className="text-foreground/90">{result.suggestion}</p>
            </div>
          )}
          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            {result.citation}
          </p>
        </div>
      </div>
    </div>
  );
}
