"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Choice = "yes" | "no" | "unsure";

type Question = {
  id: string;
  prompt: string;
  context: string;
  /** weight of a "no" answer toward risk score (higher = more exposure) */
  riskWeight: number;
  /** statute citation shown after completion */
  citation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "size",
    prompt: "Does your organization employ 25 or more people in Ontario?",
    context:
      "The Working for Workers Four/Five Act obligations apply at the 25-employee threshold. Below that, most new posting rules don't apply yet.",
    riskWeight: 0,
    citation: "ESA, Part III.1 (Job Postings) — 25-employee threshold",
  },
  {
    id: "payRange",
    prompt:
      "Does every public job posting include expected pay or a pay range (spread ≤ $50,000)?",
    context:
      "Postings must disclose expected compensation. The range cannot exceed $50,000. Postings where the upper end exceeds $200,000 are exempt.",
    riskWeight: 3,
    citation: "ESA, s. 8.1 (Pay transparency in postings)",
  },
  {
    id: "aiDisclosure",
    prompt:
      "If you use an ATS that ranks, scores, or filters applicants, does the posting say so?",
    context:
      "Algorithmic ranking, resume screening, and most ATS scoring tools qualify as 'AI used to screen, assess or select.' Disclosure is required.",
    riskWeight: 3,
    citation: "ESA, s. 8.4 (Disclosure of AI in posting)",
  },
  {
    id: "canadianExp",
    prompt:
      "Are your postings and application forms free of any 'Canadian experience required' language?",
    context:
      "Requiring Canadian work experience is prohibited in both job postings and application forms.",
    riskWeight: 2,
    citation: "ESA, s. 8.3 (Prohibited information requests)",
  },
  {
    id: "fortyFive",
    prompt:
      "Do you notify every interviewed candidate of a hiring decision within 45 days of their final interview — with a record you can prove?",
    context:
      "This is the single largest unsolved obligation. The deadline applies whether the candidate was hired, not hired, or the role is paused.",
    riskWeight: 4,
    citation: "ESA, s. 8.5 (45-day candidate notification)",
  },
  {
    id: "retention",
    prompt:
      "Do you retain each posting, application form, and notification record for 3 years after the posting is taken down?",
    context:
      "Records must be kept for 3 years after takedown and produced on request from a Ministry of Labour officer.",
    riskWeight: 3,
    citation: "ESA, s. 8.6 (Record retention)",
  },
];

export function Quiz() {
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const isLast = step === QUESTIONS.length - 1;
  const current = QUESTIONS[step];

  const score = useMemo(() => {
    let exposure = 0;
    let max = 0;
    let unknown = 0;
    for (const q of QUESTIONS) {
      max += q.riskWeight;
      const a = answers[q.id];
      if (q.id === "size" && a === "no") {
        // Below threshold — exposure not zero but materially lower
        return { exposure: 0, max, unknown: 0, belowThreshold: true };
      }
      if (a === "no") exposure += q.riskWeight;
      if (a === "unsure") {
        exposure += Math.ceil(q.riskWeight * 0.6);
        unknown += 1;
      }
    }
    return { exposure, max, unknown, belowThreshold: false };
  }, [answers]);

  function setAnswer(c: Choice) {
    setAnswers((prev) => ({ ...prev, [current.id]: c }));
  }

  function next() {
    if (!answers[current.id]) return;
    if (isLast) {
      setSubmitted(true);
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setSubmitted(false);
  }

  return (
    <section id="quiz" className="border-t border-border/60">
      <div className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Are you compliant?</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            60-second compliance check
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            Six questions. No signup, no data captured. We'll tell you where the exposure is —
            not legal advice, but a useful starting point.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          {!submitted ? (
            <Card className="border-border/80 shadow-lg shadow-primary/5">
              <CardHeader className="border-b border-border/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Question {step + 1} of {QUESTIONS.length}
                  </span>
                  <span>Ontario (ESA)</span>
                </div>
                <div className="mt-3 h-1 w-full rounded-full bg-secondary">
                  <div
                    className="h-1 rounded-full bg-primary transition-all"
                    style={{
                      width: `${((step + (answers[current.id] ? 1 : 0)) / QUESTIONS.length) * 100}%`,
                    }}
                  />
                </div>
                <CardTitle className="mt-5 text-xl">{current.prompt}</CardTitle>
                <CardDescription className="leading-relaxed">{current.context}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-2">
                  {(
                    [
                      { value: "yes", label: "Yes, consistently" },
                      { value: "no", label: "No, or not consistently" },
                      { value: "unsure", label: "I'm not sure" },
                    ] as { value: Choice; label: string }[]
                  ).map((opt) => {
                    const selected = answers[current.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(opt.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border hover:border-foreground/30 hover:bg-secondary/60"
                        )}
                      >
                        <span>{opt.label}</span>
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border transition-colors",
                            selected ? "border-primary bg-primary" : "border-border"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={back} disabled={step === 0}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={next} disabled={!answers[current.id]}>
                    {isLast ? "See my results" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Results
              score={score}
              answers={answers}
              questions={QUESTIONS}
              onReset={reset}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Results({
  score,
  answers,
  questions,
  onReset,
}: {
  score: { exposure: number; max: number; unknown: number; belowThreshold: boolean };
  answers: Record<string, Choice>;
  questions: Question[];
  onReset: () => void;
}) {
  const pct = score.max === 0 ? 0 : Math.round((score.exposure / score.max) * 100);
  const tier =
    score.belowThreshold
      ? { label: "Likely below threshold", tone: "muted" as const }
      : pct >= 60
      ? { label: "High exposure", tone: "danger" as const }
      : pct >= 30
      ? { label: "Material exposure", tone: "warning" as const }
      : { label: "Low exposure", tone: "success" as const };

  const Icon =
    tier.tone === "danger" ? ShieldAlert : tier.tone === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <Card className="border-border/80 shadow-lg shadow-primary/5">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full",
              tier.tone === "danger" && "bg-red-50 text-red-700",
              tier.tone === "warning" && "bg-amber-50 text-amber-800",
              tier.tone === "success" && "bg-emerald-50 text-emerald-700",
              tier.tone === "muted" && "bg-secondary text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-xl">
              {score.belowThreshold ? "Below the 25-employee threshold" : `${tier.label}`}
            </CardTitle>
            <CardDescription>
              {score.belowThreshold
                ? "Most posting obligations don't yet apply. You should still keep records and watch for federal/provincial expansion."
                : `Estimated exposure score: ${pct}%${score.unknown ? ` · ${score.unknown} answer${score.unknown > 1 ? "s" : ""} marked unsure` : ""}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="divide-y divide-border/60">
          {questions.map((q) => {
            const a = answers[q.id];
            const flag =
              q.id === "size" && a === "no"
                ? "info"
                : a === "no"
                ? "fail"
                : a === "unsure"
                ? "warn"
                : "pass";
            return (
              <li key={q.id} className="flex items-start gap-3 py-3">
                <Badge
                  variant={
                    flag === "fail"
                      ? "danger"
                      : flag === "warn"
                      ? "warning"
                      : flag === "info"
                      ? "muted"
                      : "success"
                  }
                  className="mt-0.5 shrink-0"
                >
                  {flag === "fail" ? "Gap" : flag === "warn" ? "Check" : flag === "info" ? "N/A" : "OK"}
                </Badge>
                <div className="text-sm">
                  <div className="font-medium">{q.prompt}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{q.citation}</div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="text-sm font-semibold">Get the full assessment</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a posting, upload a candidate CSV, and ClearPost will return a per-posting compliance
            report and turn on the 45-day candidate inbox. 14-day free trial. No credit card.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/signup">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Retake the quiz
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This check is a guide, not legal advice. Confirm specifics with your HR counsel.
        </p>
      </CardContent>
    </Card>
  );
}
