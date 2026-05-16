import { db } from "@/lib/db";
import { jobPostings, complianceChecks } from "@/lib/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { demoPostings, type DemoPosting } from "@/lib/demo/data";
import { runComplianceChecks } from "@/lib/compliance/checker";
import type { JurisdictionCode } from "@/lib/compliance/jurisdictions";

export type Posting = {
  id: string;
  orgId: string;
  title: string;
  department: string;
  location: string;
  postingUrl: string | null;
  jurisdiction: JurisdictionCode;
  vacancyStatus: "existing_vacancy" | "pipeline" | "not_disclosed";
  aiUsed: boolean;
  compensationMin: number | null;
  compensationMax: number | null;
  compensationCurrency: "CAD" | "USD";
  rawText: string;
  postedAt: Date | null;
  status: "live" | "taken_down" | "draft" | "archived";
  retentionUntil: Date | null;
  complianceScore: number;
  failedChecks: number;
};

function fromDemo(p: DemoPosting, orgId: string): Posting {
  return {
    id: p.id,
    orgId,
    title: p.title,
    department: p.department,
    location: p.location,
    postingUrl: p.postingUrl,
    jurisdiction: p.jurisdiction,
    vacancyStatus: p.vacancyStatus,
    aiUsed: p.aiUsed,
    compensationMin: p.compensationMin,
    compensationMax: p.compensationMax,
    compensationCurrency: p.compensationCurrency,
    rawText: p.rawText,
    postedAt: p.postedAt,
    status: p.status,
    retentionUntil: p.retentionUntil,
    complianceScore: p.complianceScore,
    failedChecks: p.failedChecks,
  };
}

export async function listPostings(orgId: string): Promise<Posting[]> {
  if (isDemoMode()) {
    return demoPostings.map((p) => fromDemo(p, orgId));
  }

  // Live: join compliance_checks aggregate per posting for the score/fail-count.
  const rows = await db
    .select({
      p: jobPostings,
      failed:
        sql<number>`(SELECT count(*) FROM ${complianceChecks} c WHERE c.posting_id = ${jobPostings.id} AND c.status = 'fail')`.as(
          "failed"
        ),
      total:
        sql<number>`(SELECT count(*) FROM ${complianceChecks} c WHERE c.posting_id = ${jobPostings.id})`.as(
          "total"
        ),
      passed:
        sql<number>`(SELECT count(*) FROM ${complianceChecks} c WHERE c.posting_id = ${jobPostings.id} AND c.status = 'pass')`.as(
          "passed"
        ),
    })
    .from(jobPostings)
    .where(eq(jobPostings.orgId, orgId))
    .orderBy(desc(jobPostings.postedAt));

  return rows.map((r) => ({
    id: r.p.id,
    orgId: r.p.orgId,
    title: r.p.title,
    department: "",
    location: "",
    postingUrl: r.p.postingUrl,
    jurisdiction: r.p.jurisdiction as JurisdictionCode,
    vacancyStatus: r.p.vacancyStatus,
    aiUsed: r.p.aiUsed,
    compensationMin: r.p.compensationMin,
    compensationMax: r.p.compensationMax,
    compensationCurrency: r.p.compensationCurrency as "CAD" | "USD",
    rawText: r.p.rawText ?? "",
    postedAt: r.p.postedAt,
    status: r.p.status,
    retentionUntil: r.p.retentionUntil,
    complianceScore: Number(r.total) === 0 ? 100 : Math.round((Number(r.passed) / Number(r.total)) * 100),
    failedChecks: Number(r.failed),
  }));
}

export async function getPosting(id: string, orgId: string): Promise<Posting | null> {
  if (isDemoMode()) {
    const p = demoPostings.find((p) => p.id === id);
    return p ? fromDemo(p, orgId) : null;
  }

  const [row] = await db
    .select()
    .from(jobPostings)
    .where(and(eq(jobPostings.id, id), eq(jobPostings.orgId, orgId)))
    .limit(1);
  if (!row) return null;

  // Run the checker live to get score + failed count without an extra query.
  const report = runComplianceChecks({
    title: row.title,
    rawText: row.rawText ?? "",
    jurisdiction: row.jurisdiction as JurisdictionCode,
    vacancyStatus: row.vacancyStatus,
    aiUsed: row.aiUsed,
    compensationMin: row.compensationMin,
    compensationMax: row.compensationMax,
    compensationCurrency: row.compensationCurrency as "CAD" | "USD",
  });

  return {
    id: row.id,
    orgId: row.orgId,
    title: row.title,
    department: "",
    location: "",
    postingUrl: row.postingUrl,
    jurisdiction: row.jurisdiction as JurisdictionCode,
    vacancyStatus: row.vacancyStatus,
    aiUsed: row.aiUsed,
    compensationMin: row.compensationMin,
    compensationMax: row.compensationMax,
    compensationCurrency: row.compensationCurrency as "CAD" | "USD",
    rawText: row.rawText ?? "",
    postedAt: row.postedAt,
    status: row.status,
    retentionUntil: row.retentionUntil,
    complianceScore: report.score,
    failedChecks: report.summary.fail,
  };
}
