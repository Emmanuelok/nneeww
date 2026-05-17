"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  jobPostings,
  complianceChecks,
  auditLog,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { getActiveOrg, getCurrentSession } from "@/lib/auth/context";
import {
  runComplianceChecks,
  type PostingInput,
} from "@/lib/compliance/checker";
import type { JurisdictionCode } from "@/lib/compliance/jurisdictions";
import { provinceToJurisdiction } from "@/lib/compliance/province";
import { users } from "@/lib/db/schema";

export type SavePostingInput = {
  title: string;
  postingUrl?: string;
  rawText: string;
  vacancyStatus: "existing_vacancy" | "pipeline" | "not_disclosed";
  aiUsed: boolean;
  compensationMin: number | null;
  compensationMax: number | null;
  jurisdiction?: JurisdictionCode;
};

/**
 * Persist a posting + its compliance check results.
 *
 * In demo mode this is a no-op that returns a fake id so the UI flow still
 * completes (used by the marketing-side wizard preview). In live mode, this
 * inserts into job_postings + compliance_checks + audit_log, then redirects
 * to /app/postings/[id].
 */
export async function savePostingAction(input: SavePostingInput) {
  if (isDemoMode()) {
    // Demo: jump back into the postings list so the user sees the seeded data
    // refreshed against their just-checked posting in a non-persistent way.
    redirect("/app/postings");
  }

  const org = await getActiveOrg();
  if (!org) redirect("/login");

  const session = await getCurrentSession();
  const supabaseUid = session.user?.id;

  const [actor] = supabaseUid
    ? await db.select().from(users).where(eq(users.supabaseUid, supabaseUid)).limit(1)
    : [];

  const jurisdiction: JurisdictionCode = input.jurisdiction ?? provinceToJurisdiction(org.province);

  const report = runComplianceChecks({
    title: input.title,
    rawText: input.rawText,
    jurisdiction,
    vacancyStatus: input.vacancyStatus,
    aiUsed: input.aiUsed,
    compensationMin: input.compensationMin,
    compensationMax: input.compensationMax,
    compensationCurrency: "CAD",
  });

  const now = new Date();
  const retentionUntil = new Date(now);
  retentionUntil.setUTCFullYear(retentionUntil.getUTCFullYear() + 3);

  const [posting] = await db
    .insert(jobPostings)
    .values({
      orgId: org.id,
      title: input.title,
      postingUrl: input.postingUrl ?? null,
      rawText: input.rawText,
      vacancyStatus: input.vacancyStatus,
      aiUsed: input.aiUsed,
      compensationMin: input.compensationMin,
      compensationMax: input.compensationMax,
      compensationCurrency: "CAD",
      jurisdiction,
      postedAt: now,
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

  await db.insert(auditLog).values({
    orgId: org.id,
    actorUserId: actor?.id ?? null,
    action: "posting.created",
    entityType: "job_posting",
    entityId: posting.id,
    payload: { score: report.score, riskTier: report.riskTier },
  });

  revalidatePath("/app");
  revalidatePath("/app/postings");
  redirect(`/app/postings/${posting.id}`);
}

export async function takedownPostingAction(postingId: string) {
  if (isDemoMode()) {
    revalidatePath("/app/postings");
    return;
  }
  const org = await getActiveOrg();
  if (!org) redirect("/login");

  await db
    .update(jobPostings)
    .set({ status: "taken_down", takenDownAt: new Date() })
    .where(and(eq(jobPostings.id, postingId), eq(jobPostings.orgId, org.id)));

  await db.insert(auditLog).values({
    orgId: org.id,
    action: "posting.taken_down",
    entityType: "job_posting",
    entityId: postingId,
  });

  revalidatePath("/app/postings");
  revalidatePath("/app/vault");
}
