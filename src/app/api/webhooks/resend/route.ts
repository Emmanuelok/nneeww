import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog, candidateNotifications } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";

// Resend webhook events that we care about.
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

type ResendWebhookPayload = {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    tags?: { name: string; value: string }[];
  };
};

/**
 * Resend webhook receiver. Resend signs webhooks with Svix-style headers
 * (svix-id, svix-timestamp, svix-signature). For v1 we verify a shared
 * secret in a custom header; Svix signature verification is a follow-up
 * when the `svix` dep is added.
 *
 * Each delivery/open event becomes an audit_log row keyed to the
 * candidate_notifications row whose token we baked into the email tags.
 */
export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    // Demo mode: accept and discard — no DB writes.
    return NextResponse.json({ ok: true, demo: true });
  }

  // Lightweight shared-secret check.
  const expected = process.env.RESEND_WEBHOOK_SECRET;
  if (expected) {
    const provided =
      req.headers.get("x-clearpost-webhook-secret") ??
      req.headers.get("svix-signature") ?? // tolerated; full verification later
      "";
    if (!expected || !provided || !provided.includes(expected)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = (await req.json()) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const notificationIdTag = payload.data.tags?.find((t) => t.name === "notification_id")?.value;
  const orgIdTag = payload.data.tags?.find((t) => t.name === "org_id")?.value;

  if (!notificationIdTag || !orgIdTag) {
    // Not one of our messages — accept and ignore so Resend stops retrying.
    return NextResponse.json({ ok: true, skipped: "no_tags" });
  }

  const [notification] = await db
    .select()
    .from(candidateNotifications)
    .where(eq(candidateNotifications.id, notificationIdTag))
    .limit(1);
  if (!notification) {
    return NextResponse.json({ ok: true, skipped: "unknown_notification" });
  }

  // Persist the audit-log entry first — it's the source of truth.
  await db.insert(auditLog).values({
    orgId: orgIdTag,
    action: `email.${payload.type.replace(/^email\./, "")}`,
    entityType: "candidate_notification",
    entityId: notification.id,
    payload: {
      resendEventType: payload.type,
      resendEmailId: payload.data.email_id,
      createdAt: payload.created_at,
    },
  });

  // For terminal-positive events, ensure the row stays in `sent` state
  // and the delivery proof reflects the latest event.
  if (payload.type === "email.delivered" || payload.type === "email.opened") {
    await db
      .update(candidateNotifications)
      .set({
        status: "sent",
        deliveryProofUrl: sql`coalesce(${candidateNotifications.deliveryProofUrl}, ${`resend:${payload.data.email_id}`})`,
      })
      .where(eq(candidateNotifications.id, notification.id));
  }

  // Bounces and complaints flip the row back to pending so the daily
  // digest re-flags it for human follow-up.
  if (payload.type === "email.bounced" || payload.type === "email.complained") {
    await db
      .update(candidateNotifications)
      .set({ status: "pending" })
      .where(eq(candidateNotifications.id, notification.id));
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ClearPost Resend webhook",
    demo: isDemoMode(),
  });
}
