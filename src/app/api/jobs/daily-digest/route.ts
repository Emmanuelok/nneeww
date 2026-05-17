/**
 * Daily 45-day deadline digest.
 *
 * Triggered by Vercel Cron at 13:00 UTC (≈ 09:00 ET) — see vercel.json.
 * Vercel Cron calls this with an Authorization: Bearer <CRON_SECRET> header.
 *
 * For each organization that has any candidates with overdue or due-soon
 * notifications, sends one digest email per owner/admin member. Each send
 * is recorded in audit_log.
 *
 * Manual trigger (for testing):
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *        https://your-app.vercel.app/api/jobs/daily-digest
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/mode";
import { db } from "@/lib/db";
import {
  organizations as organizationsT,
  memberships,
  users,
  auditLog,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listCandidates } from "@/lib/repositories/candidates";
import { renderDigestEmail } from "@/lib/email/templates/daily-digest";
import { getResend, FROM_EMAIL, FROM_NAME } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RunResult = {
  ok: boolean;
  demo: boolean;
  orgsProcessed: number;
  digestsSent: number;
  candidatesFlagged: number;
  skipped: { reason: string; orgId?: string }[];
};

async function handle(req: NextRequest): Promise<NextResponse<RunResult>> {
  // ----- Auth: Bearer CRON_SECRET (skipped when no secret configured) -----
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json(
        {
          ok: false,
          demo: isDemoMode(),
          orgsProcessed: 0,
          digestsSent: 0,
          candidatesFlagged: 0,
          skipped: [{ reason: "unauthorized" }],
        },
        { status: 401 }
      );
    }
  }

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      orgsProcessed: 0,
      digestsSent: 0,
      candidatesFlagged: 0,
      skipped: [{ reason: "demo_mode_no_send" }],
    });
  }

  const resend = getResend();
  const inboxBase =
    (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/app/notifications";
  const today = new Date().toISOString().slice(0, 10);

  const result: RunResult = {
    ok: true,
    demo: false,
    orgsProcessed: 0,
    digestsSent: 0,
    candidatesFlagged: 0,
    skipped: [],
  };

  const orgs = await db.select().from(organizationsT);
  if (orgs.length === 0) {
    result.skipped.push({ reason: "no_orgs" });
    return NextResponse.json(result);
  }

  for (const org of orgs) {
    result.orgsProcessed += 1;
    const candidates = await listCandidates(org.id);
    const overdue = candidates.filter((c) => c.notificationStatus === "overdue");
    const dueSoon = candidates.filter(
      (c) => c.notificationStatus === "pending" && c.daysToDeadline >= 0 && c.daysToDeadline <= 7
    );
    const flagged = overdue.length + dueSoon.length;
    if (flagged === 0) {
      result.skipped.push({ orgId: org.id, reason: "no_actionable_candidates" });
      continue;
    }
    result.candidatesFlagged += flagged;

    const recipients = await db
      .select({
        email: users.email,
        name: users.name,
        userId: users.id,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.orgId, org.id));

    const admins = recipients.filter((r) => r.role === "owner" || r.role === "admin");
    if (admins.length === 0) {
      result.skipped.push({ orgId: org.id, reason: "no_admins" });
      await db.insert(auditLog).values({
        orgId: org.id,
        action: "digest.skipped",
        entityType: "organization",
        entityId: org.id,
        payload: { reason: "no_admins", flagged },
      });
      continue;
    }

    if (!resend) {
      // Resend not configured — still write to audit_log so the digest run
      // is observable, but we can't actually deliver.
      result.skipped.push({ orgId: org.id, reason: "resend_not_configured" });
      await db.insert(auditLog).values({
        orgId: org.id,
        action: "digest.skipped",
        entityType: "organization",
        entityId: org.id,
        payload: { reason: "resend_not_configured", flagged, admins: admins.length },
      });
      continue;
    }

    for (const admin of admins) {
      const firstName = (admin.name ?? admin.email).split(/\s+/)[0];
      const { subject, html, text } = renderDigestEmail({
        orgName: org.name,
        recipientFirstName: firstName,
        overdue,
        dueSoon,
        inboxUrl: inboxBase,
        generatedDate: today,
      });

      try {
        const res = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: admin.email,
          subject,
          html,
          text,
          tags: [
            { name: "type", value: "daily_digest" },
            { name: "org_id", value: org.id },
            { name: "user_id", value: admin.userId },
          ],
        });
        if (res.data?.id) {
          result.digestsSent += 1;
          await db.insert(auditLog).values({
            orgId: org.id,
            actorUserId: admin.userId,
            action: "digest.sent",
            entityType: "user",
            entityId: admin.userId,
            payload: {
              messageId: res.data.id,
              flagged,
              overdue: overdue.length,
              dueSoon: dueSoon.length,
              date: today,
            },
          });
        }
      } catch (err) {
        result.skipped.push({ orgId: org.id, reason: `send_failed:${admin.email}` });
        await db.insert(auditLog).values({
          orgId: org.id,
          actorUserId: admin.userId,
          action: "digest.send_failed",
          entityType: "user",
          entityId: admin.userId,
          payload: { error: String(err), date: today },
        });
      }
    }
  }

  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

// Allow manual trigger via POST too (curl-friendly).
export async function POST(req: NextRequest) {
  return handle(req);
}
