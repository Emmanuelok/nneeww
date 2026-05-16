import { db } from "@/lib/db";
import { candidates as candidatesT, interviews, candidateNotifications, jobPostings } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { demoCandidates, type DemoCandidate } from "@/lib/demo/data";

export type Candidate = DemoCandidate;

export async function listCandidates(orgId: string): Promise<Candidate[]> {
  if (isDemoMode()) return demoCandidates;

  const rows = await db
    .select({
      c: candidatesT,
      i: interviews,
      n: candidateNotifications,
      postingTitle: jobPostings.title,
    })
    .from(candidatesT)
    .leftJoin(interviews, eq(interviews.candidateId, candidatesT.id))
    .leftJoin(candidateNotifications, eq(candidateNotifications.candidateId, candidatesT.id))
    .leftJoin(jobPostings, eq(jobPostings.id, candidatesT.postingId))
    .where(eq(candidatesT.orgId, orgId));

  // Collapse to one row per candidate using the most-recent interview.
  const grouped = new Map<string, Candidate>();
  for (const r of rows) {
    const existing = grouped.get(r.c.id);
    const interviewDate = r.i?.interviewDate ?? null;
    if (existing && interviewDate && existing.lastInterviewDate >= interviewDate) continue;
    if (!interviewDate || !r.n) continue;

    const daysToDeadline = Math.ceil(
      (r.n.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const notificationStatus: Candidate["notificationStatus"] =
      r.n.status === "sent" ? "sent" : daysToDeadline < 0 ? "overdue" : "pending";

    grouped.set(r.c.id, {
      id: r.c.id,
      name: r.c.name,
      postingId: r.c.postingId,
      postingTitle: r.postingTitle ?? "",
      source: r.c.source ?? "Direct",
      lastInterviewDate: interviewDate,
      isFinal: r.i?.isFinal ?? false,
      deadlineDate: r.n.deadlineDate,
      daysToDeadline,
      notificationStatus,
      decision: r.n.decision,
    });
  }
  return Array.from(grouped.values());
}

export async function listCandidatesForPosting(orgId: string, postingId: string): Promise<Candidate[]> {
  const all = await listCandidates(orgId);
  return all.filter((c) => c.postingId === postingId);
}
