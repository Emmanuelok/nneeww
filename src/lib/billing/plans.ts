/**
 * Plan catalog. Single source of truth for what each plan includes,
 * the Stripe price id mapping, and gating helpers. Marketing pricing
 * page and /app/settings both read from here.
 */

export type PlanId = "trial" | "solo" | "team" | "multi";

export type PlanFeature =
  | "compliance_checker"
  | "candidate_workflow"
  | "retention_vault"
  | "csv_import"
  | "compliance_report"
  | "multi_province"
  | "audit_log"
  | "priority_support";

export type Plan = {
  id: PlanId;
  name: string;
  priceCAD: number; // monthly, CAD
  postingLimitPerYear: number | null; // null = unlimited
  seats: number | null; // null = unlimited
  features: Record<PlanFeature, boolean>;
  jurisdictions: ("ca_on" | "ca_bc" | "ca_ab" | "ca_qc" | "ca_fed")[];
  stripePriceId?: string;
};

export const TRIAL_DAYS = 14;

const ALL_FEATURES_TRUE: Record<PlanFeature, boolean> = {
  compliance_checker: true,
  candidate_workflow: true,
  retention_vault: true,
  csv_import: true,
  compliance_report: true,
  multi_province: true,
  audit_log: true,
  priority_support: true,
};

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    name: "Trial",
    priceCAD: 0,
    postingLimitPerYear: null,
    seats: null,
    features: ALL_FEATURES_TRUE,
    jurisdictions: ["ca_on", "ca_fed", "ca_bc", "ca_ab", "ca_qc"],
  },
  solo: {
    id: "solo",
    name: "Solo",
    priceCAD: 79,
    postingLimitPerYear: 25,
    seats: 1,
    features: {
      compliance_checker: true,
      candidate_workflow: true,
      retention_vault: true,
      csv_import: false,
      compliance_report: false,
      multi_province: false,
      audit_log: false,
      priority_support: false,
    },
    jurisdictions: ["ca_on"],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO,
  },
  team: {
    id: "team",
    name: "Team",
    priceCAD: 179,
    postingLimitPerYear: null,
    seats: 5,
    features: {
      compliance_checker: true,
      candidate_workflow: true,
      retention_vault: true,
      csv_import: true,
      compliance_report: true,
      multi_province: false,
      audit_log: true,
      priority_support: true,
    },
    jurisdictions: ["ca_on", "ca_fed"],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
  },
  multi: {
    id: "multi",
    name: "Multi-province",
    priceCAD: 349,
    postingLimitPerYear: null,
    seats: null,
    features: ALL_FEATURES_TRUE,
    jurisdictions: ["ca_on", "ca_fed", "ca_bc", "ca_ab", "ca_qc"],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MULTI,
  },
};

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

export function canUseFeature(planId: PlanId, feature: PlanFeature): boolean {
  return PLANS[planId].features[feature] === true;
}

export function trialDaysRemaining(orgCreatedAt: Date): number {
  const elapsed = Math.floor((Date.now() - orgCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - elapsed);
}

export function isTrialActive(orgCreatedAt: Date, plan: PlanId): boolean {
  return plan === "trial" && trialDaysRemaining(orgCreatedAt) > 0;
}
