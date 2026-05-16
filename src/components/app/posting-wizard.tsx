"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { savePostingAction } from "@/lib/postings/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Sparkles,
  ArrowRight,
  Copy,
  Clipboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  runComplianceChecks,
  type CheckResult,
  type ComplianceReport,
  type PostingInput,
} from "@/lib/compliance/checker";

const SAMPLE_TEXT = `Acme Manufacturing is hiring a Senior Accountant for our Toronto finance team.
This posting is for an existing vacancy. Expected compensation: $95,000–$125,000 CAD.

Responsibilities: month-end close, audit support, IFRS reporting.
Requirements: CPA designation, 5+ years of Canadian experience preferred.`;

export function PostingWizard() {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [postingUrl, setPostingUrl] = useState("");
  const [vacancyStatus, setVacancyStatus] = useState<"existing_vacancy" | "pipeline" | "not_disclosed">("not_disclosed");
  const [aiUsed, setAiUsed] = useState(true);
  const [compensationMin, setCompensationMin] = useState<string>("");
  const [compensationMax, setCompensationMax] = useState<string>("");
  const [hasChecked, setHasChecked] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function save() {
    startSaving(async () => {
      await savePostingAction({
        title: title.trim() || "Untitled posting",
        postingUrl: postingUrl || undefined,
        rawText,
        vacancyStatus,
        aiUsed,
        compensationMin: compensationMin ? parseInt(compensationMin, 10) : null,
        compensationMax: compensationMax ? parseInt(compensationMax, 10) : null,
      });
    });
  }

  const report: ComplianceReport | null = useMemo(() => {
    if (!hasChecked || !rawText.trim()) return null;
    return runComplianceChecks({
      title: title.trim() || "Untitled posting",
      rawText,
      jurisdiction: "ca_on",
      vacancyStatus,
      aiUsed,
      compensationMin: compensationMin ? parseInt(compensationMin, 10) : null,
      compensationMax: compensationMax ? parseInt(compensationMax, 10) : null,
      compensationCurrency: "CAD",
    });
  }, [hasChecked, title, rawText, vacancyStatus, aiUsed, compensationMin, compensationMax]);

  function loadSample() {
    setTitle("Senior Accountant");
    setRawText(SAMPLE_TEXT);
    setVacancyStatus("existing_vacancy");
    setAiUsed(true);
    setCompensationMin("95000");
    setCompensationMax("125000");
    setHasChecked(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Paste a posting</CardTitle>
              <CardDescription>
                The checker runs locally in your browser — no posting text leaves your device.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadSample}>
              <Sparkles className="h-4 w-4" /> Load sample
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Job title</Label>
              <Input
                id="title"
                placeholder="Senior Accountant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postingUrl">Posting URL (optional)</Label>
              <Input
                id="postingUrl"
                placeholder="https://careers.acme.ca/postings/..."
                value={postingUrl}
                onChange={(e) => setPostingUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rawText">Posting text</Label>
            <Textarea
              id="rawText"
              rows={12}
              placeholder="Paste the full text of your job posting here…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="font-mono text-[13px] leading-relaxed"
            />
          </div>

          <Separator />

          <fieldset className="space-y-3">
            <Label>Vacancy disclosure</Label>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                { v: "existing_vacancy", l: "Existing vacancy" },
                { v: "pipeline", l: "Pipeline build" },
                { v: "not_disclosed", l: "Not stated" },
              ].map((opt) => (
                <label
                  key={opt.v}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors",
                    vacancyStatus === opt.v
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <span>{opt.l}</span>
                  <input
                    type="radio"
                    name="vacancyStatus"
                    value={opt.v}
                    checked={vacancyStatus === opt.v}
                    onChange={() => setVacancyStatus(opt.v as "existing_vacancy" | "pipeline" | "not_disclosed")}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <Label>Does your ATS use AI / algorithmic ranking?</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { v: true, l: "Yes — most ATS scoring counts" },
                { v: false, l: "No — manual review only" },
              ].map((opt) => (
                <label
                  key={String(opt.v)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-colors",
                    aiUsed === opt.v
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <span>{opt.l}</span>
                  <input
                    type="radio"
                    name="aiUsed"
                    checked={aiUsed === opt.v}
                    onChange={() => setAiUsed(opt.v)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="compensationMin">Comp min (CAD, optional)</Label>
              <Input
                id="compensationMin"
                type="number"
                inputMode="numeric"
                placeholder="95000"
                value={compensationMin}
                onChange={(e) => setCompensationMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compensationMax">Comp max (CAD, optional)</Label>
              <Input
                id="compensationMax"
                type="number"
                inputMode="numeric"
                placeholder="125000"
                value={compensationMax}
                onChange={(e) => setCompensationMax(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <Button
            onClick={() => setHasChecked(true)}
            disabled={!rawText.trim()}
            size="lg"
            className="w-full"
          >
            Run compliance check
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Jurisdiction: Ontario (Employment Standards Act). Ontario is fully active in v1; BC, Alberta, federal, and Quebec ship through 2026.
          </p>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <ResultsPanel report={report} hasChecked={hasChecked} onSave={save} isSaving={isSaving} />
      </div>
    </div>
  );
}

function ResultsPanel({
  report,
  hasChecked,
  onSave,
  isSaving,
}: {
  report: ComplianceReport | null;
  hasChecked: boolean;
  onSave: () => void;
  isSaving: boolean;
}) {
  if (!hasChecked || !report) {
    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>Compliance report</CardTitle>
          <CardDescription>
            Add posting text, fill in the basics, then run the check.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 text-sm">
            {[
              "Pay transparency: range present, spread ≤ $50,000, $200,000+ exemption",
              "AI disclosure: algorithmic ranking acknowledged when used",
              "Vacancy disclosure: existing vs. pipeline build stated",
              "Prohibited language: 'Canadian experience' and variants",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    );
  }

  const tier =
    report.riskTier === "high"
      ? { label: "High exposure", tone: "danger" as const }
      : report.riskTier === "moderate"
      ? { label: "Moderate exposure", tone: "warning" as const }
      : { label: "Compliant", tone: "success" as const };

  return (
    <Card className="sticky top-6">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compliance report</CardTitle>
            <CardDescription>{report.jurisdiction.name}</CardDescription>
          </div>
          <Badge variant={tier.tone}>{tier.label}</Badge>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-4xl font-semibold tracking-tight">{report.score}</div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{report.summary.pass} passing</div>
            <div>{report.summary.warn} warnings</div>
            <div>{report.summary.fail} failing</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-secondary">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              tier.tone === "danger" && "bg-destructive",
              tier.tone === "warning" && "bg-amber-500",
              tier.tone === "success" && "bg-emerald-500"
            )}
            style={{ width: `${report.score}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {report.results.map((r) => (
          <CheckRow key={r.id} result={r} />
        ))}

        <Separator />

        <div className="flex flex-col gap-2">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save this posting"} <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Saved postings appear in your retention vault and stay searchable for 3 years.
          </p>
        </div>
      </CardContent>
    </Card>
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
            <SuggestionBlock text={result.suggestion} />
          )}
          <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
            {result.citation}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuggestionBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs leading-relaxed">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-primary">
        <span>Suggested fix</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="inline-flex items-center gap-1 rounded text-[10px] hover:text-primary/80"
        >
          {copied ? <Clipboard className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-foreground/90">{text}</p>
    </div>
  );
}
