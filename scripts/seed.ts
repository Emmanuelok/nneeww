/**
 * Seed a real Supabase Postgres with the same demo dataset that powers
 * the in-memory demo mode. Run with:
 *
 *   DATABASE_URL=... npx tsx scripts/seed.ts
 *
 * Safe to re-run: clears the demo org's rows before re-inserting.
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import {
  organizations,
  users,
  memberships,
  jobPostings,
  candidates,
  interviews,
  candidateNotifications,
  retentionVaultItems,
} from "../src/lib/db/schema";
import { demoPostings, demoCandidates, demoVaultItems } from "../src/lib/demo/data";
import { DEMO_ORG } from "../src/lib/mode";
import { randomUUID } from "crypto";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const sql = postgres(url, { prepare: false });
  const db = drizzle(sql);

  console.log("⏳ Wiping previous demo data for org", DEMO_ORG.id);
  await db.delete(retentionVaultItems).where(eq(retentionVaultItems.orgId, DEMO_ORG.id));
  await db.delete(candidateNotifications).where(eq(candidateNotifications.orgId, DEMO_ORG.id));
  await db.delete(candidates).where(eq(candidates.orgId, DEMO_ORG.id));
  await db.delete(jobPostings).where(eq(jobPostings.orgId, DEMO_ORG.id));
  await db.delete(memberships).where(eq(memberships.orgId, DEMO_ORG.id));
  await db.delete(organizations).where(eq(organizations.id, DEMO_ORG.id));

  console.log("⏳ Inserting demo organization");
  await db.insert(organizations).values({
    id: DEMO_ORG.id,
    name: DEMO_ORG.name,
    slug: "acme-manufacturing-demo",
    plan: "team",
    province: DEMO_ORG.province,
    employeeCountBucket: DEMO_ORG.employeeCountBucket,
  });

  console.log("⏳ Inserting demo postings");
  const postingIdMap = new Map<string, string>();
  for (const p of demoPostings) {
    const newId = randomUUID();
    postingIdMap.set(p.id, newId);
    await db.insert(jobPostings).values({
      id: newId,
      orgId: DEMO_ORG.id,
      title: p.title,
      postingUrl: p.postingUrl,
      rawText: p.rawText,
      vacancyStatus: p.vacancyStatus,
      aiUsed: p.aiUsed,
      compensationMin: p.compensationMin,
      compensationMax: p.compensationMax,
      compensationCurrency: p.compensationCurrency,
      jurisdiction: p.jurisdiction,
      postedAt: p.postedAt,
      status: p.status,
      retentionUntil: p.retentionUntil,
    });
  }

  console.log("⏳ Inserting demo candidates + interviews + notifications");
  for (const c of demoCandidates) {
    const candidateId = randomUUID();
    const postingId = postingIdMap.get(c.postingId)!;

    await db.insert(candidates).values({
      id: candidateId,
      orgId: DEMO_ORG.id,
      postingId,
      name: c.name,
      source: c.source,
    });

    await db.insert(interviews).values({
      candidateId,
      postingId,
      interviewDate: c.lastInterviewDate,
      isFinal: c.isFinal,
    });

    await db.insert(candidateNotifications).values({
      candidateId,
      postingId,
      orgId: DEMO_ORG.id,
      lastInterviewDate: c.lastInterviewDate,
      deadlineDate: c.deadlineDate,
      status: c.notificationStatus,
      decision: c.decision,
      token: randomUUID().replace(/-/g, ""),
    });
  }

  console.log("⏳ Inserting demo vault items");
  for (const v of demoVaultItems) {
    await db.insert(retentionVaultItems).values({
      orgId: DEMO_ORG.id,
      itemType: v.type,
      sourceId: postingIdMap.get(v.relatedTo) ?? randomUUID(),
      archivedAt: v.archivedAt,
      expiresAt: v.expiresAt,
    });
  }

  console.log("✅ Demo seed complete");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
