import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { getStripe } from "@/lib/billing/stripe";
import type Stripe from "stripe";
import type { PlanId } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_FROM_PRICE: Record<string, PlanId> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO ?? "_solo"]: "solo",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM ?? "_team"]: "team",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI ?? "_multi"]: "multi",
};

function inferPlan(sub: Stripe.Subscription): PlanId | null {
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id;
  if (!priceId) return null;
  return PLAN_FROM_PRICE[priceId] ?? null;
}

/**
 * Stripe webhook handler. Configure in Stripe → Developers → Webhooks:
 *   endpoint: https://<app>.vercel.app/api/webhooks/stripe
 *   events:
 *     checkout.session.completed
 *     customer.subscription.created
 *     customer.subscription.updated
 *     customer.subscription.deleted
 *     invoice.payment_failed
 *
 * The webhook signing secret goes in STRIPE_WEBHOOK_SECRET. Stripe signs
 * the body with HMAC-SHA256; we verify with stripe.webhooks.constructEvent.
 */
export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "missing_webhook_secret" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  // Stripe verification requires the raw request body — text(), not json().
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `signature_invalid:${String(err)}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;
      if (!orgId) break;
      await db
        .update(organizations)
        .set({
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
        })
        .where(eq(organizations.id, orgId));
      await db.insert(auditLog).values({
        orgId,
        action: "billing.checkout_completed",
        entityType: "organization",
        entityId: orgId,
        payload: {
          checkoutId: session.id,
          planId: session.metadata?.plan_id ?? null,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        },
      });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.org_id as string | undefined) ?? null;
      const planId = inferPlan(sub) ?? ((sub.metadata?.plan_id as PlanId | undefined) ?? null);
      if (!orgId || !planId) break;
      // sub.status: trialing | active | past_due | canceled | unpaid | incomplete*
      const effectivePlan: PlanId = sub.status === "active" || sub.status === "trialing" ? planId : "trial";
      await db
        .update(organizations)
        .set({ plan: effectivePlan })
        .where(eq(organizations.id, orgId));
      await db.insert(auditLog).values({
        orgId,
        action: `billing.${event.type.replace("customer.subscription.", "subscription_")}`,
        entityType: "organization",
        entityId: orgId,
        payload: { subscriptionId: sub.id, status: sub.status, planId, effectivePlan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = (sub.metadata?.org_id as string | undefined) ?? null;
      if (!orgId) break;
      await db
        .update(organizations)
        .set({ plan: "trial" })
        .where(eq(organizations.id, orgId));
      await db.insert(auditLog).values({
        orgId,
        action: "billing.subscription_deleted",
        entityType: "organization",
        entityId: orgId,
        payload: { subscriptionId: sub.id },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.stripeCustomerId, customerId))
        .limit(1);
      if (!org) break;
      await db.insert(auditLog).values({
        orgId: org.id,
        action: "billing.payment_failed",
        entityType: "organization",
        entityId: org.id,
        payload: { invoiceId: invoice.id, amountDue: invoice.amount_due, currency: invoice.currency },
      });
      break;
    }

    default:
      // Acknowledge unknown events so Stripe stops retrying them.
      break;
  }

  return NextResponse.json({ ok: true, received: event.type });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ClearPost Stripe webhook",
    demo: isDemoMode(),
  });
}
