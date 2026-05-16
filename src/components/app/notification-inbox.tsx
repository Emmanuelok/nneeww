"use client";

import { useMemo, useState, useTransition } from "react";
import { sendNotificationAction } from "@/lib/notifications/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Search,
  CheckCircle2,
  Mail,
  User,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoCandidate } from "@/lib/demo/data";

type Filter = "all" | "overdue" | "this_week" | "later" | "notified";

const DEFAULT_TEMPLATE = (name: string, role: string, decision: string) =>
  `Hello ${name.split(" ")[0]},

Thank you for taking the time to interview with us for the ${role} role. We wanted to follow up to let you know that ${decision}.

We sincerely appreciated the chance to meet you and learn about your background.

Best regards,
Acme Manufacturing — People Team`;

export function NotificationInbox({ candidates }: { candidates: DemoCandidate[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DemoCandidate | null>(candidates[0] ?? null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates
      .filter((c) => {
        const isSent = c.notificationStatus === "sent" || sentIds.has(c.id);
        if (filter === "overdue") return !isSent && c.daysToDeadline < 0;
        if (filter === "this_week") return !isSent && c.daysToDeadline >= 0 && c.daysToDeadline <= 7;
        if (filter === "later") return !isSent && c.daysToDeadline > 7;
        if (filter === "notified") return isSent;
        return true;
      })
      .filter((c) =>
        !q
          ? true
          : c.name.toLowerCase().includes(q) || c.postingTitle.toLowerCase().includes(q)
      )
      .sort((a, b) => a.daysToDeadline - b.daysToDeadline);
  }, [candidates, filter, query, sentIds]);

  const counts = useMemo(() => {
    let overdue = 0, thisWeek = 0, later = 0, notified = 0;
    for (const c of candidates) {
      const isSent = c.notificationStatus === "sent" || sentIds.has(c.id);
      if (isSent) notified++;
      else if (c.daysToDeadline < 0) overdue++;
      else if (c.daysToDeadline <= 7) thisWeek++;
      else later++;
    }
    return { overdue, thisWeek, later, notified, all: candidates.length };
  }, [candidates, sentIds]);

  function markSent(id: string) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-5">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
              All
            </FilterButton>
            <FilterButton active={filter === "overdue"} onClick={() => setFilter("overdue")} count={counts.overdue} tone="danger">
              Overdue
            </FilterButton>
            <FilterButton active={filter === "this_week"} onClick={() => setFilter("this_week")} count={counts.thisWeek} tone="warning">
              This week
            </FilterButton>
            <FilterButton active={filter === "later"} onClick={() => setFilter("later")} count={counts.later}>
              Later
            </FilterButton>
            <FilterButton active={filter === "notified"} onClick={() => setFilter("notified")} count={counts.notified} tone="success">
              Notified
            </FilterButton>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidate or posting…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="max-h-[640px] divide-y divide-border/60 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-6 py-10 text-center text-sm text-muted-foreground">
                No candidates match this filter.
              </li>
            ) : (
              filtered.map((c) => {
                const isSent = c.notificationStatus === "sent" || sentIds.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelected(c)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-6 py-3.5 text-left transition-colors",
                        selected?.id === c.id ? "bg-primary/5" : "hover:bg-secondary/40"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.postingTitle}</div>
                      </div>
                      {isSent ? (
                        <Badge variant="success" className="shrink-0">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Sent
                        </Badge>
                      ) : c.daysToDeadline < 0 ? (
                        <Badge variant="danger" className="shrink-0">{Math.abs(c.daysToDeadline)}d overdue</Badge>
                      ) : (
                        <Badge variant={c.daysToDeadline <= 5 ? "danger" : c.daysToDeadline <= 15 ? "warning" : "muted"} className="shrink-0">
                          {c.daysToDeadline}d left
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="lg:col-span-7">
        {selected ? (
          <CandidatePanel
            candidate={selected}
            isSent={selected.notificationStatus === "sent" || sentIds.has(selected.id)}
            onSent={() => markSent(selected.id)}
          />
        ) : (
          <Card>
            <CardContent className="py-20 text-center text-sm text-muted-foreground">
              Select a candidate to draft a decision notification.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
  count,
  tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  tone?: "danger" | "warning" | "success";
}) {
  return (
    <button
      onClick={onClick}
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
            : tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : tone === "warning"
            ? "bg-amber-100 text-amber-800"
            : tone === "success"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CandidatePanel({
  candidate,
  isSent,
  onSent,
}: {
  candidate: DemoCandidate;
  isSent: boolean;
  onSent: () => void;
}) {
  const [decision, setDecision] = useState<"made" | "not_made" | "no_hire">("no_hire");
  const [method, setMethod] = useState<"email" | "in_person" | "written">("email");
  const [body, setBody] = useState(() =>
    DEFAULT_TEMPLATE(candidate.name, candidate.postingTitle, "we have decided to move forward with another candidate")
  );
  const [justSent, setJustSent] = useState(false);
  const [isSending, startSending] = useTransition();

  function handleDecisionChange(next: "made" | "not_made" | "no_hire") {
    setDecision(next);
    const phrase =
      next === "no_hire"
        ? "we have decided to move forward with another candidate"
        : next === "made"
        ? "we have made an offer to a candidate"
        : "we have not yet finalized our hiring decision for this role";
    setBody(DEFAULT_TEMPLATE(candidate.name, candidate.postingTitle, phrase));
  }

  function send() {
    // Optimistic UI: mark sent locally, then persist server-side.
    onSent();
    setJustSent(true);
    startSending(async () => {
      await sendNotificationAction({
        candidateId: candidate.id,
        postingId: candidate.postingId,
        decision,
        method,
        body,
      });
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border/60">
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> {candidate.name}
          </CardTitle>
          <CardDescription>
            {candidate.postingTitle} · final interview {candidate.lastInterviewDate.toLocaleDateString("en-CA")} · source {candidate.source}
          </CardDescription>
        </div>
        <div className="text-right text-xs">
          <div className="text-muted-foreground">Deadline</div>
          <div className="font-medium">{candidate.deadlineDate.toLocaleDateString("en-CA")}</div>
          {isSent ? (
            <Badge variant="success" className="mt-1">Notified</Badge>
          ) : candidate.daysToDeadline < 0 ? (
            <Badge variant="danger" className="mt-1">{Math.abs(candidate.daysToDeadline)}d overdue</Badge>
          ) : (
            <Badge
              variant={candidate.daysToDeadline <= 5 ? "danger" : candidate.daysToDeadline <= 15 ? "warning" : "muted"}
              className="mt-1"
            >
              {candidate.daysToDeadline}d left
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {(isSent || justSent) && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div className="text-emerald-900">
              <div className="font-medium">Notification recorded</div>
              <div className="text-xs">Saved to audit log · stored in retention vault for 3 years.</div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Decision</Label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {[
              { v: "no_hire", l: "Not moving forward" },
              { v: "made", l: "Hired someone" },
              { v: "not_made", l: "Still deciding" },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                disabled={isSent}
                onClick={() => handleDecisionChange(opt.v as typeof decision)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-50",
                  decision === opt.v
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30"
                )}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Delivery method</Label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {[
              { v: "email", l: "Email (Resend)" },
              { v: "in_person", l: "In-person note" },
              { v: "written", l: "Written letter" },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                disabled={isSent}
                onClick={() => setMethod(opt.v as typeof method)}
                className={cn(
                  "rounded-md border px-3 py-2 text-left transition-colors disabled:opacity-50",
                  method === opt.v
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/30"
                )}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSent}
            className="font-mono text-[13px] leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            <Mail className="mr-1 inline h-3 w-3" />
            Sent from people@acme.ca via Resend. Delivery confirmation is logged when the candidate opens the
            confirmation link.
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            ESA s. 8.5 · 45-day candidate notification
          </div>
          <Button onClick={send} disabled={isSent || isSending}>
            <Send className="h-4 w-4" />
            {isSent ? "Notification sent" : isSending ? "Sending…" : "Send notification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
