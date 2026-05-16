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
    active: false,
    statuteUrl:
      "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/23018",
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
    effectiveDate: "2026-01-01",
    active: false,
    statuteUrl: "https://laws-lois.justice.gc.ca/eng/acts/l-2/",
    rules: {
      employeeThreshold: null,
      payTransparency: { required: true, maxRangeSpread: null, upperBoundExemption: null, currency: "CAD" },
      aiDisclosure: { required: false },
      vacancyDisclosure: { required: false },
      prohibitedClauses: [],
      candidateNotificationDays: null,
      recordRetentionYears: null,
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
