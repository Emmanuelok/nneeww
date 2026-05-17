import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, like } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { demoPostings, demoCandidates, demoVaultItems } from "@/lib/demo/data";

export type AuditEventCategory =
  | "postings"
  | "compliance"
  | "candidates"
  | "notifications"
  | "csv_imports"
  | "reports"
  | "billing"
  | "organization";

export type AuditEvent = {
  id: string;
  action: string;
  category: AuditEventCategory;
  entityType: string;
  entityId: string | null;
  actor: { name: string | null; email: string | null } | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
};

export type AuditFilter = {
  category?: AuditEventCategory;
  from?: Date;
  to?: Date;
  search?: string;
  limit?: number;
  offset?: number;
};

export function categoryFor(action: string): AuditEventCategory {
  if (action.startsWith("posting.")) return "postings";
  if (action.startsWith("compliance.")) return "compliance";
  if (action.startsWith("notification.") || action.startsWith("email.")) return "notifications";
  if (action.startsWith("digest.")) return "notifications";
  if (action.startsWith("candidate.") || action.startsWith("interview.")) return "candidates";
  if (action.startsWith("csv.")) return "csv_imports";
  if (action.startsWith("report.")) return "reports";
  if (action.startsWith("billing.")) return "billing";
  return "organization";
}

export async function listAuditEvents(
  orgId: string,
  filter: AuditFilter = {}
): Promise<AuditEvent[]> {
  const limit = filter.limit ?? 250;
  const offset = filter.offset ?? 0;

  if (isDemoMode()) {
    let all = synthesizeDemoEvents(orgId);
    if (filter.category) all = all.filter((e) => e.category === filter.category);
    if (filter.from) all = all.filter((e) => e.createdAt >= filter.from!);
    if (filter.to) all = all.filter((e) => e.createdAt <= filter.to!);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      all = all.filter((e) =>
        e.action.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        JSON.stringify(e.payload ?? {}).toLowerCase().includes(q)
      );
    }
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
  }

  const whereClauses = [eq(auditLog.orgId, orgId)];
  if (filter.from) whereClauses.push(gte(auditLog.createdAt, filter.from));
  if (filter.to) whereClauses.push(lte(auditLog.createdAt, filter.to));
  if (filter.search) whereClauses.push(like(auditLog.action, `%${filter.search}%`));

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      payload: auditLog.payload,
      createdAt: auditLog.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .where(and(...whereClauses))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset(offset);

  let mapped: AuditEvent[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    category: categoryFor(r.action),
    entityType: r.entityType,
    entityId: r.entityId,
    actor:
      r.actorName || r.actorEmail ? { name: r.actorName, email: r.actorEmail } : null,
    payload: (r.payload as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt,
  }));
  if (filter.category) mapped = mapped.filter((e) => e.category === filter.category);
  return mapped;
}

export async function auditCategoryCounts(orgId: string): Promise<Record<AuditEventCategory, number>> {
  const events = await listAuditEvents(orgId, { limit: 5000 });
  const counts: Record<AuditEventCategory, number> = {
    postings: 0,
    compliance: 0,
    candidates: 0,
    notifications: 0,
    csv_imports: 0,
    reports: 0,
    billing: 0,
    organization: 0,
  };
  for (const e of events) counts[e.category] += 1;
  return counts;
}

// -----------------------------------------------------------------------------
// Demo-mode synthesis: derive a believable timeline from the seeded dataset.
// -----------------------------------------------------------------------------

function synthesizeDemoEvents(orgId: string): AuditEvent[] {
  const events: AuditEvent[] = [];
  const ACTOR = { name: "Sara Chen", email: "sara.chen@acme.ca" };

  let n = 0;
  const mk = (
    action: string,
    entityType: string,
    entityId: string | null,
    createdAt: Date,
    payload: Record<string, unknown> | null = null,
    actor: { name: string; email: string } | null = ACTOR
  ): AuditEvent => ({
    id: `demo_${n++}`,
    action,
    category: categoryFor(action),
    entityType,
    entityId,
    actor,
    payload,
    createdAt,
  });

  const today = new Date();
  const minutesAfter = (d: Date, mins: number) => new Date(d.getTime() + mins * 60_000);

  for (const p of demoPostings) {
    events.push(
      mk("posting.created", "job_posting", p.id, p.postedAt, {
        title: p.title,
        location: p.location,
        score: p.complianceScore,
        failedChecks: p.failedChecks,
      })
    );
    if (p.failedChecks > 0) {
      events.push(
        mk(
          "compliance.checks_failed",
          "job_posting",
          p.id,
          minutesAfter(p.postedAt, 1),
          { failed: p.failedChecks, score: p.complianceScore },
          null
        )
      );
    }
    if (p.status === "taken_down" && p.retentionUntil) {
      const takeDownDate = new Date(p.retentionUntil);
      takeDownDate.setUTCFullYear(takeDownDate.getUTCFullYear() - 3);
      events.push(
        mk("posting.taken_down", "job_posting", p.id, takeDownDate, { title: p.title })
      );
    }
  }

  for (const c of demoCandidates) {
    events.push(
      mk("interview.logged", "candidate", c.id, c.lastInterviewDate, {
        candidateName: c.name,
        postingTitle: c.postingTitle,
        isFinal: c.isFinal,
      })
    );
    if (c.notificationStatus === "sent") {
      const sentAt = new Date(c.deadlineDate);
      sentAt.setUTCDate(sentAt.getUTCDate() - 3);
      events.push(
        mk("notification.sent", "candidate_notification", c.id, sentAt, {
          candidateName: c.name,
          postingTitle: c.postingTitle,
          decision: c.decision,
          method: "email",
          resendMessageId: `re_demo_${c.id}`,
        })
      );
      events.push(
        mk("email.delivered", "candidate_notification", c.id, minutesAfter(sentAt, 4), {
          resendEventType: "email.delivered",
        }, null)
      );
      events.push(
        mk("notification.viewed", "candidate_notification", c.id, minutesAfter(sentAt, 38), {
          token: `demo_${c.id}`,
        }, null)
      );
    }
  }

  for (const v of demoVaultItems) {
    events.push(
      mk("vault.item_archived", "retention_vault_item", v.id, v.archivedAt, {
        type: v.type,
        title: v.title,
      }, null)
    );
  }

  // Daily digests for the last 5 weekdays.
  for (let i = 5; i >= 1; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(13, 2, 0, 0);
    events.push(
      mk("digest.sent", "user", null, d, {
        flagged: i % 2 === 0 ? 5 : 3,
        overdue: i % 2 === 0 ? 1 : 0,
        dueSoon: i % 2 === 0 ? 4 : 3,
      })
    );
  }

  // Compliance report generated yesterday.
  const reportedAt = new Date(today);
  reportedAt.setUTCDate(reportedAt.getUTCDate() - 1);
  reportedAt.setUTCHours(10, 23, 0, 0);
  events.push(
    mk("report.generated", "organization", orgId, reportedAt, {
      filename: "clearpost-compliance-acme-manufacturing-ltd-2026-01-01_to_today.zip",
      bytes: 14396,
      from: "2026-01-01",
      to: today.toISOString().slice(0, 10),
    })
  );

  return events;
}
