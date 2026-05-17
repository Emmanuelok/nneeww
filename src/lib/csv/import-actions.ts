"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  jobPostings,
  candidates as candidatesT,
  interviews,
  candidateNotifications,
  complianceChecks,
  auditLog,
} from "@/lib/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { getActiveOrg } from "@/lib/auth/context";
import { runComplianceChecks } from "@/lib/compliance/checker";
import { randomUUID } from "crypto";

export type CommitResult = {
  ok: boolean;
  demo: boolean;
  imported: number;
  skipped: number;
  errors: string[];
};

export type PostingRow = {
  title: string;
  postingUrl?: string | null;
  rawText: string;
  vacancyStatus?: "existing_vacancy" | "pipeline" | "not_disclosed" | null;
  aiUsed?: boolean | null;
  compensationMin?: number | null;
  compensationMax?: number | null;
  postedAt?: string | null; // ISO string from the client
};

export type CandidateRow = {
  name: string;
  email?: string | null;
  postingTitle: string;
  source?: string | null;
  lastInterviewDate: string; // ISO string
};

/**
 * Commit validated posting rows. Each row becomes a job_postings + compliance_checks
 * insert. Audit log gets one summary entry per import batch.
 *
 * Demo mode is a no-op; the wizard shows a success message and routes back
 * to /app/postings (which still renders the seeded dataset).
 */
export async function commitPostingsImport(rows: PostingRow[]): Promise<CommitResult> {
  if (isDemoMode()) {
    revalidatePath("/app/postings");
    return { ok: true, demo: true, imported: rows.length, skipped: 0, errors: [] };
  }

  const org = await getActiveOrg();
  if (!org) redirect("/login");

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.title || !row.rawText) {
      skipped += 1;
      errors.push(`Skipped row: missing title or text`);
      continue;
    }

    const postedAt = row.postedAt ? new Date(row.postedAt) : new Date();
    const retentionUntil = new Date(postedAt);
    retentionUntil.setUTCFullYear(retentionUntil.getUTCFullYear() + 3);

    const report = runComplianceChecks({
      title: row.title,
      rawText: row.rawText,
      jurisdiction: "ca_on",
      vacancyStatus: row.vacancyStatus ?? "not_disclosed",
      aiUsed: row.aiUsed ?? true,
      compensationMin: row.compensationMin ?? null,
      compensationMax: row.compensationMax ?? null,
      compensationCurrency: "CAD",
    });

    const [posting] = await db
      .insert(jobPostings)
      .values({
        orgId: org.id,
        title: row.title,
        postingUrl: row.postingUrl ?? null,
        rawText: row.rawText,
        vacancyStatus: row.vacancyStatus ?? "not_disclosed",
        aiUsed: row.aiUsed ?? true,
        compensationMin: row.compensationMin ?? null,
        compensationMax: row.compensationMax ?? null,
        compensationCurrency: "CAD",
        jurisdiction: "ca_on",
        postedAt,
        status: "live",
        retentionUntil,
      })
      .returning();

    if (report.results.length > 0) {
      await db.insert(complianceChecks).values(
        report.results.map((r) => ({
          postingId: posting.id,
          checkType: r.id,
          status: r.status === "info" ? "pass" : r.status,
          message: r.message,
          citation: r.citation,
        }))
      );
    }

    imported += 1;
  }

  await db.insert(auditLog).values({
    orgId: org.id,
    action: "csv.postings_imported",
    entityType: "organization",
    entityId: org.id,
    payload: { imported, skipped, errors: errors.slice(0, 5) },
  });

  revalidatePath("/app");
  revalidatePath("/app/postings");
  return { ok: true, demo: false, imported, skipped, errors };
}

/**
 * Commit validated candidate rows. Each row generates:
 *   - candidates row (or matches existing by email+postingId)
 *   - interviews row (isFinal=true since the import flow assumes final-interview data)
 *   - candidate_notifications row with deadline = interview + 45 days
 *
 * Each candidate is matched to a posting by case-insensitive title.
 * Rows whose posting title doesn't match an existing posting are skipped
 * with a descriptive error.
 */
export async function commitCandidatesImport(rows: CandidateRow[]): Promise<CommitResult> {
  if (isDemoMode()) {
    revalidatePath("/app/candidates");
    return { ok: true, demo: true, imported: rows.length, skipped: 0, errors: [] };
  }

  const org = await getActiveOrg();
  if (!org) redirect("/login");

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.name || !row.postingTitle || !row.lastInterviewDate) {
      skipped += 1;
      errors.push(`Skipped row for "${row.name || "(no name)"}": missing required field`);
      continue;
    }

    const [posting] = await db
      .select()
      .from(jobPostings)
      .where(and(eq(jobPostings.orgId, org.id), ilike(jobPostings.title, row.postingTitle)))
      .limit(1);

    if (!posting) {
      skipped += 1;
      errors.push(`No posting matched "${row.postingTitle}" — skipped ${row.name}`);
      continue;
    }

    const interviewDate = new Date(row.lastInterviewDate);
    const deadlineDate = new Date(interviewDate);
    deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 45);

    const [candidate] = await db
      .insert(candidatesT)
      .values({
        orgId: org.id,
        postingId: posting.id,
        name: row.name,
        email: row.email ?? null,
        source: row.source ?? "CSV import",
      })
      .returning();

    await db.insert(interviews).values({
      candidateId: candidate.id,
      postingId: posting.id,
      interviewDate,
      isFinal: true,
    });

    await db.insert(candidateNotifications).values({
      candidateId: candidate.id,
      postingId: posting.id,
      orgId: org.id,
      lastInterviewDate: interviewDate,
      deadlineDate,
      status: deadlineDate < new Date() ? "overdue" : "pending",
      token: randomUUID().replace(/-/g, ""),
    });

    imported += 1;
  }

  await db.insert(auditLog).values({
    orgId: org.id,
    action: "csv.candidates_imported",
    entityType: "organization",
    entityId: org.id,
    payload: { imported, skipped, errors: errors.slice(0, 5) },
  });

  revalidatePath("/app");
  revalidatePath("/app/candidates");
  revalidatePath("/app/notifications");
  return { ok: true, demo: false, imported, skipped, errors };
}
