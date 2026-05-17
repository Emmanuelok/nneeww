/**
 * Typed jurisdiction rules engine. Adding a province = adding an entry here.
 * Not user-editable; the compliance checker dispatches against this config.
 */

export type JurisdictionCode =
  | "ca_on"
  | "ca_bc"
  | "ca_ab"
  | "ca_qc"
  | "ca_fed"
  | "us_ny"
  | "us_co"
  | "us_il"
  | "eu";

export type JurisdictionRules = {
  code: JurisdictionCode;
  name: string;
  effectiveDate: string; // ISO
  active: boolean; // whether the product enforces this jurisdiction today
  statuteUrl: string;
  /**
   * One-line tagline for the marketing + compliance page.
   */
  tagline?: string;
  /**
   * Non-checkable regulatory context shown on the compliance page and
   * methodology pages. Each entry should reference a statute section.
   */
  notes?: string[];
  rules: {
    employeeThreshold: number | null;
    payTransparency: {
      required: boolean;
      maxRangeSpread: number | null; // CAD/USD as appropriate
      upperBoundExemption: number | null; // postings above this don't need a range
      currency: "CAD" | "USD" | "EUR";
    };
    aiDisclosure: { required: boolean };
    vacancyDisclosure: { required: boolean };
    prohibitedClauses: string[]; // phrases / regex sources
    candidateNotificationDays: number | null;
    recordRetentionYears: number | null;
  };
};

export const JURISDICTIONS: Record<JurisdictionCode, JurisdictionRules> = {
  ca_on: {
    code: "ca_on",
    name: "Ontario",
    effectiveDate: "2026-01-01",
    active: true,
    statuteUrl: "https://www.ontario.ca/laws/statute/00e41",
    tagline:
      "Pay transparency, AI disclosure, vacancy disclosure, 45-day candidate notification, 3-year retention.",
    notes: [
      "Working for Workers Four / Five / Seven Acts amended the ESA effective Jan 1, 2026.",
      "Maximum administrative monetary penalties were doubled in the 2026 amendments.",
      "Enforcement typically begins with a candidate complaint to the Ministry of Labour.",
    ],
    rules: {
      employeeThreshold: 25,
      payTransparency: {
        required: true,
        maxRangeSpread: 50_000,
        upperBoundExemption: 200_000,
        currency: "CAD",
      },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: true },
      prohibitedClauses: [
        "canadian experience",
        "canadian work experience",
        "canadian-based experience",
      ],
      candidateNotificationDays: 45,
      recordRetentionYears: 3,
    },
  },
  ca_bc: {
    code: "ca_bc",
    name: "British Columbia",
    effectiveDate: "2023-11-01",
    active: true,
    statuteUrl:
      "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/23018",
    tagline:
      "Pay transparency required on all public postings — no employee threshold, no spread cap.",
    notes: [
      "BC Pay Transparency Act applies to all employers in BC, with no minimum-employee threshold.",
      "Section 2: postings must include expected pay or pay range. Vague terms like 'competitive' do not satisfy the requirement.",
      "No statutory maximum on range spread (unlike Ontario's $50,000 cap) — but unreasonably wide ranges may attract scrutiny.",
      "Annual pay-transparency reporting obligations begin at the 1,000-employee threshold (Nov 2024), then 300 (Nov 2025), then 50 (Nov 2026).",
    ],
    rules: {
      employeeThreshold: null,
      payTransparency: {
        required: true,
        maxRangeSpread: null,
        upperBoundExemption: null,
        currency: "CAD",
      },
      aiDisclosure: { required: false },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  ca_ab: {
    code: "ca_ab",
    name: "Alberta",
    effectiveDate: "2026-01-01",
    active: false,
    statuteUrl: "https://kings-printer.alberta.ca/",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "CAD" },
      aiDisclosure: { required: false },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  ca_qc: {
    code: "ca_qc",
    name: "Quebec",
    effectiveDate: "2024-09-22",
    active: false,
    statuteUrl: "https://www.legisquebec.gouv.qc.ca/en/document/cs/p-39.1",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "CAD" },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  ca_fed: {
    code: "ca_fed",
    name: "Canada (federal)",
    effectiveDate: "2021-08-31",
    active: true,
    statuteUrl: "https://laws-lois.justice.gc.ca/eng/acts/l-2/",
    tagline:
      "Federally regulated employers: anti-discrimination posting scan + record retention. Pay-posting transparency pending federally.",
    notes: [
      "Applies to federally regulated workplaces — banks, telecoms, inter-provincial transport, federal Crown corporations.",
      "Canada Labour Code Part III requires employment records be kept for 36 months.",
      "Federal Pay Equity Act (in force Aug 2021) requires employers with 10+ employees to establish a pay equity plan; this is separate from posting-side transparency.",
      "Federal posting-transparency rules analogous to Ontario's are under consultation but not yet in force; ClearPost surfaces a warning when a posting omits expected pay so federally regulated employers can stay ahead.",
      "Section 11 of the Canadian Human Rights Act and the Employment Equity Act both bear on prohibited-information requests in postings.",
    ],
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "CAD" },
      aiDisclosure: { required: false },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [
        "canadian citizen required",
        "must be a canadian citizen",
        "canadian citizenship required",
        "citizens only",
      ],
      candidateNotificationDays: null,
      recordRetentionYears: 3,
    },
  },
  us_ny: {
    code: "us_ny",
    name: "New York City (Local Law 144)",
    effectiveDate: "2023-07-05",
    active: false,
    statuteUrl: "https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "USD" },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  us_co: {
    code: "us_co",
    name: "Colorado AI Act",
    effectiveDate: "2026-02-01",
    active: false,
    statuteUrl: "https://leg.colorado.gov/bills/sb24-205",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "USD" },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  us_il: {
    code: "us_il",
    name: "Illinois HB 3773",
    effectiveDate: "2026-01-01",
    active: false,
    statuteUrl: "https://www.ilga.gov/legislation/103/HB/PDF/10300HB3773.pdf",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "USD" },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
  eu: {
    code: "eu",
    name: "EU AI Act",
    effectiveDate: "2026-08-02",
    active: false,
    statuteUrl: "https://artificialintelligenceact.eu/",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: false, maxRangeSpread: null, upperBoundExemption: null, currency: "EUR" },
      aiDisclosure: { required: true },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
    },
  },
};

export function getJurisdiction(code: JurisdictionCode): JurisdictionRules {
  return JURISDICTIONS[code];
}
