"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  candidateNotifications,
  candidates as candidatesT,
  organizations,
  retentionVaultItems,
  auditLog,
  users,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { getActiveOrg, getCurrentSession } from "@/lib/auth/context";
import { getResend, FROM_EMAIL, FROM_NAME } from "@/lib/email/resend";
import { renderDecisionEmail } from "@/lib/email/templates/decision-notification";

export type SendNotificationInput = {
  candidateId: string;
  postingId: string;
  decision: "made" | "not_made" | "no_hire";
  method: "email" | "in_person" | "written";
  body: string;
  senderName?: string;
  senderTitle?: string;
};

export type SendNotificationResult = {
  ok: boolean;
  demo: boolean;
  emailSent?: boolean;
  emailMessageId?: string;
  reason?: string;
};

/**
 * Mark a 45-day notification as sent and (when method=email) actually deliver
 * the email via Resend. The Resend message id is persisted as the
 * delivery_proof_url so an ESA officer can be shown a verifiable artifact.
 *
 * Live mode: updates DB row, inserts retention_vault_items + audit_log,
 *            sends Resend email when configured + method=email.
 * Demo mode: optimistic UI only (the inbox component handles the visual flip).
 */
export async function sendNotificationAction(
  input: SendNotificationInput
): Promise<SendNotificationResult> {
  if (isDemoMode()) {
    revalidatePath("/app/notifications");
    return { ok: true, demo: true };
  }

  const org = await getActiveOrg();
  if (!org) redirect("/login");

  const session = await getCurrentSession();
  const supabaseUid = session.user?.id;
  const [actor] = supabaseUid
    ? await db.select().from(users).where(eq(users.supabaseUid, supabaseUid)).limit(1)
    : [];

  const [notification] = await db
    .select()
    .from(candidateNotifications)
    .where(
      and(
        eq(candidateNotifications.candidateId, input.candidateId),
        eq(candidateNotifications.orgId, org.id)
      )
    )
    .limit(1);
  if (!notification) return { ok: false, demo: false, reason: "notification_not_found" };

  const [candidate] = await db
    .select()
    .from(candidatesT)
    .where(eq(candidatesT.id, input.candidateId))
    .limit(1);
  const [orgRow] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  const now = new Date();
  const retentionUntil = new Date(now);
  retentionUntil.setUTCFullYear(retentionUntil.getUTCFullYear() + 3);

  // ---------------- Send via Resend (only when method=email + configured) ----------------
  let emailSent = false;
  let emailMessageId: string | undefined;
  if (input.method === "email" && candidate?.email) {
    const resend = getResend();
    if (resend) {
      const { subject, html, text } = renderDecisionEmail({
        candidateName: candidate.name,
        postingTitle: "Your role", // resolved below via posting if needed
        orgName: orgRow?.name ?? "Our People Team",
        senderName: input.senderName ?? actor?.name ?? "People Team",
        senderTitle: input.senderTitle ?? "Recruiting",
        decision: input.decision,
        body: input.body,
        token: notification.token,
      });

      try {
        const res = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: candidate.email,
          subject,
          html,
          text,
          tags: [
            { name: "type", value: "decision_notification" },
            { name: "notification_id", value: notification.id },
            { name: "org_id", value: org.id },
          ],
        });
        if (res.data?.id) {
          emailSent = true;
          emailMessageId = res.data.id;
        }
      } catch (err) {
        // Record send failure on the audit log; the row stays in `pending`
        // so the daily digest still flags it as outstanding.
        await db.insert(auditLog).values({
          orgId: org.id,
          actorUserId: actor?.id ?? null,
          action: "notification.send_failed",
          entityType: "candidate_notification",
          entityId: notification.id,
          payload: { error: String(err), candidateId: input.candidateId },
        });
        return { ok: false, demo: false, reason: "resend_send_failed" };
      }
    }
  }

  // ---------------- Persist the notification ----------------
  await db
    .update(candidateNotifications)
    .set({
      status: "sent",
      notificationSentAt: now,
      notificationMethod: input.method,
      decision: input.decision,
      deliveryProofUrl: emailMessageId
        ? `resend:${emailMessageId}`
        : input.method === "email"
        ? "resend:not_configured"
        : `${input.method}:manual:${now.toISOString()}`,
    })
    .where(eq(candidateNotifications.id, notification.id));

  await db.insert(retentionVaultItems).values({
    orgId: org.id,
    itemType: "notification",
    sourceId: notification.id,
    expiresAt: retentionUntil,
  });

  await db.insert(auditLog).values({
    orgId: org.id,
    actorUserId: actor?.id ?? null,
    action: emailSent ? "notification.sent" : "notification.recorded",
    entityType: "candidate_notification",
    entityId: notification.id,
    payload: {
      candidateId: input.candidateId,
      postingId: input.postingId,
      decision: input.decision,
      method: input.method,
      bodyPreview: input.body.slice(0, 280),
      resendMessageId: emailMessageId ?? null,
    },
  });

  revalidatePath("/app/notifications");
  revalidatePath("/app");
  revalidatePath("/app/vault");
  return { ok: true, demo: false, emailSent, emailMessageId };
}

/**
 * Called by /n/[token] when a candidate opens their notification link.
 * Logs the view to audit_log — this becomes part of the delivery proof
 * shown to an ESA officer.
 */
export async function confirmNotificationViewedAction(token: string) {
  if (isDemoMode()) return { ok: true, demo: true };

  const [notification] = await db
    .select()
    .from(candidateNotifications)
    .where(eq(candidateNotifications.token, token))
    .limit(1);
  if (!notification) return { ok: false, demo: false, reason: "not_found" };

  await db.insert(auditLog).values({
    orgId: notification.orgId,
    action: "notification.viewed",
    entityType: "candidate_notification",
    entityId: notification.id,
    payload: { viewedAt: new Date().toISOString(), token },
  });

  return { ok: true, demo: false };
}
