"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations, users, auditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveOrg, getCurrentSession } from "@/lib/auth/context";
import { isDemoMode } from "@/lib/mode";
import { getStripe, appBaseUrl } from "./stripe";
import { PLANS, type PlanId } from "./plans";

/**
 * Create a Stripe Checkout Session for the requested plan and redirect the
 * user to Stripe's hosted page. On success Stripe redirects back to
 * /app/settings?billing=success; on cancel to /app/settings?billing=cancel.
 *
 * Demo mode shows a friendly notice instead of attempting a real checkout.
 */
export async function startCheckoutAction(planId: PlanId) {
  if (isDemoMode()) redirect("/app/settings?billing=demo");
  if (planId === "trial") redirect("/app/settings");

  const stripe = getStripe();
  if (!stripe) redirect("/app/settings?billing=not_configured");

  const plan = PLANS[planId];
  if (!plan.stripePriceId) redirect("/app/settings?billing=price_missing");

  const org = await getActiveOrg();
  if (!org) redirect("/login");
  const session = await getCurrentSession();
  if (!session.user) redirect("/login");

  const [orgRow] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);

  // Ensure a Stripe Customer exists for this org.
  let customerId = orgRow?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: orgRow?.name,
      metadata: { org_id: org.id },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, org.id));
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    billing_address_collection: "required",
    success_url: `${appBaseUrl()}/app/settings?billing=success&plan=${planId}`,
    cancel_url: `${appBaseUrl()}/app/settings?billing=cancel`,
    metadata: { org_id: org.id, plan_id: planId },
    subscription_data: { metadata: { org_id: org.id, plan_id: planId } },
  });

  if (!checkout.url) redirect("/app/settings?billing=checkout_url_missing");

  await db.insert(auditLog).values({
    orgId: org.id,
    action: "billing.checkout_started",
    entityType: "organization",
    entityId: org.id,
    payload: { planId, checkoutId: checkout.id },
  });

  redirect(checkout.url);
}

/**
 * Open the Stripe Customer Portal for the active org. Used by the
 * "Manage billing" button in /app/settings.
 */
export async function openCustomerPortalAction() {
  if (isDemoMode()) redirect("/app/settings?billing=demo");
  const stripe = getStripe();
  if (!stripe) redirect("/app/settings?billing=not_configured");

  const org = await getActiveOrg();
  if (!org) redirect("/login");

  const [orgRow] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, org.id))
    .limit(1);
  if (!orgRow?.stripeCustomerId) redirect("/app/settings?billing=no_customer");

  const portal = await stripe.billingPortal.sessions.create({
    customer: orgRow.stripeCustomerId,
    return_url: `${appBaseUrl()}/app/settings`,
  });

  redirect(portal.url);
}
