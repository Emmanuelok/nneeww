"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  candidateNotifications,
  retentionVaultItems,
  auditLog,
  users,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { getActiveOrg, getCurrentSession } from "@/lib/auth/context";

export type SendNotificationInput = {
  candidateId: string;
  postingId: string;
  decision: "made" | "not_made" | "no_hire";
  method: "email" | "in_person" | "written";
  body: string;
};

/**
 * Mark a 45-day notification as sent.
 *
 * Live mode:
 *  - update candidate_notifications row: status=sent, notification_sent_at=now,
 *    decision, method, body archived as delivery proof.
 *  - insert retention_vault_items row (type=notification, 3-year expiry).
 *  - insert audit_log row.
 *  - TODO (next slice): trigger Resend email; persist Resend message-id as
 *    delivery_proof_url.
 *
 * Demo mode: silent no-op so the UI's optimistic update is the source of truth.
 */
export async function sendNotificationAction(input: SendNotificationInput) {
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

  const now = new Date();
  const retentionUntil = new Date(now);
  retentionUntil.setUTCFullYear(retentionUntil.getUTCFullYear() + 3);

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
  if (!notification) return { ok: false, demo: false };

  await db
    .update(candidateNotifications)
    .set({
      status: "sent",
      notificationSentAt: now,
      notificationMethod: input.method,
      decision: input.decision,
      deliveryProofUrl: null, // populated when Resend webhook lands
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
    action: "notification.sent",
    entityType: "candidate_notification",
    entityId: notification.id,
    payload: {
      candidateId: input.candidateId,
      postingId: input.postingId,
      decision: input.decision,
      method: input.method,
      bodyPreview: input.body.slice(0, 280),
    },
  });

  revalidatePath("/app/notifications");
  revalidatePath("/app");
  revalidatePath("/app/vault");
  return { ok: true, demo: false };
}
