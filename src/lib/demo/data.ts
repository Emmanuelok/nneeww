/**
 * Demo dataset that powers /app/* until a real Supabase connection is wired.
 * Deterministic relative to "today" so the deployed preview always looks live.
 */

import type { JurisdictionCode } from "@/lib/compliance/jurisdictions";

const NOW = new Date();

function addDays(days: number) {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export type DemoPosting = {
  id: string;
  title: string;
  department: string;
  location: string;
  postingUrl: string;
  jurisdiction: JurisdictionCode;
  vacancyStatus: "existing_vacancy" | "pipeline" | "not_disclosed";
  aiUsed: boolean;
  compensationMin: number | null;
  compensationMax: number | null;
  compensationCurrency: "CAD" | "USD";
  rawText: string;
  postedAt: Date;
  status: "live" | "taken_down" | "draft";
  retentionUntil: Date | null;
  complianceScore: number;
  failedChecks: number;
};

export const demoPostings: DemoPosting[] = [
  {
    id: "p_001",
    title: "Senior Accountant",
    department: "Finance",
    location: "Toronto, ON · Hybrid",
    postingUrl: "https://careers.acme.ca/postings/senior-accountant",
    jurisdiction: "ca_on",
    vacancyStatus: "existing_vacancy",
    aiUsed: true,
    compensationMin: 95_000,
    compensationMax: 125_000,
    compensationCurrency: "CAD",
    rawText: `Acme Manufacturing is hiring a Senior Accountant for our Toronto finance team.
This posting is for an existing vacancy. Expected compensation: $95,000–$125,000 CAD.
We use an applicant tracking system that applies automated scoring to rank applications;
a recruiter reviews the top-ranked candidates.

Responsibilities: month-end close, audit support, IFRS reporting.
Requirements: CPA designation, 5+ years in industry.`,
    postedAt: addDays(-3),
    status: "live",
    retentionUntil: addDays(-3 + 365 * 3),
    complianceScore: 100,
    failedChecks: 0,
  },
  {
    id: "p_002",
    title: "Registered Nurse (Full-Time)",
    department: "Clinical",
    location: "Mississauga, ON",
    postingUrl: "https://careers.acme.ca/postings/rn-full-time",
    jurisdiction: "ca_on",
    vacancyStatus: "not_disclosed",
    aiUsed: true,
    compensationMin: null,
    compensationMax: null,
    compensationCurrency: "CAD",
    rawText: `Join our care team as a Registered Nurse. Competitive salary commensurate with experience.
Canadian experience required. CNO registration in good standing required.`,
    postedAt: addDays(-9),
    status: "live",
    retentionUntil: addDays(-9 + 365 * 3),
    complianceScore: 25,
    failedChecks: 3,
  },
  {
    id: "p_003",
    title: "Sales Manager — GTA",
    department: "Sales",
    location: "Ottawa, ON · Remote",
    postingUrl: "https://careers.acme.ca/postings/sales-manager",
    jurisdiction: "ca_on",
    vacancyStatus: "existing_vacancy",
    aiUsed: true,
    compensationMin: 110_000,
    compensationMax: 180_000,
    compensationCurrency: "CAD",
    rawText: `Acme is looking for a Sales Manager to lead our GTA team (existing vacancy).
Compensation range: $110,000–$180,000 plus commission.
Applications are reviewed using our ATS, which scores candidates against role criteria.`,
    postedAt: addDays(-14),
    status: "live",
    retentionUntil: addDays(-14 + 365 * 3),
    complianceScore: 60,
    failedChecks: 1,
  },
  {
    id: "p_004",
    title: "Software Engineer — Platform",
    department: "Engineering",
    location: "Toronto, ON · Hybrid",
    postingUrl: "https://careers.acme.ca/postings/swe-platform",
    jurisdiction: "ca_on",
    vacancyStatus: "pipeline",
    aiUsed: true,
    compensationMin: 140_000,
    compensationMax: 210_000,
    compensationCurrency: "CAD",
    rawText: `Acme is building a pipeline of platform engineers for upcoming roles.
This posting is for our future-opportunities pipeline rather than a single existing vacancy.
Total compensation: $140,000–$210,000 CAD plus equity. AI-assisted screening is used.`,
    postedAt: addDays(-22),
    status: "live",
    retentionUntil: addDays(-22 + 365 * 3),
    complianceScore: 100,
    failedChecks: 0,
  },
  {
    id: "p_005",
    title: "Warehouse Associate",
    department: "Operations",
    location: "Brampton, ON",
    postingUrl: "https://careers.acme.ca/postings/warehouse-associate",
    jurisdiction: "ca_on",
    vacancyStatus: "existing_vacancy",
    aiUsed: false,
    compensationMin: 42_000,
    compensationMax: 47_000,
    compensationCurrency: "CAD",
    rawText: `Acme is hiring Warehouse Associates for our Brampton distribution centre (existing vacancy).
Hourly rate translates to $42,000–$47,000 annualized. No AI screening is used; applications
are reviewed manually by our hiring team.`,
    postedAt: addDays(-30),
    status: "taken_down",
    retentionUntil: addDays(-30 + 365 * 3),
    complianceScore: 100,
    failedChecks: 0,
  },
  {
    id: "p_006",
    title: "Plant Operations Lead",
    department: "Operations",
    location: "Burnaby, BC",
    postingUrl: "https://careers.acme.ca/postings/plant-ops-lead-bc",
    jurisdiction: "ca_bc",
    vacancyStatus: "not_disclosed",
    aiUsed: true,
    compensationMin: 105_000,
    compensationMax: 145_000,
    compensationCurrency: "CAD",
    rawText: `Acme is hiring a Plant Operations Lead at our Burnaby facility.
Expected total compensation: $105,000–$145,000 CAD.
Reporting to the VP Operations, you'll oversee shift scheduling, safety, and continuous-improvement initiatives.`,
    postedAt: addDays(-6),
    status: "live",
    retentionUntil: addDays(-6 + 365 * 3),
    complianceScore: 100,
    failedChecks: 0,
  },
  {
    id: "p_007",
    title: "Customer Service Representative (Federal)",
    department: "Member Services",
    location: "Toronto, ON · Federally regulated",
    postingUrl: "https://careers.acme.ca/postings/csr-federal",
    jurisdiction: "ca_fed",
    vacancyStatus: "existing_vacancy",
    aiUsed: false,
    compensationMin: 52_000,
    compensationMax: 62_000,
    compensationCurrency: "CAD",
    rawText: `Federally regulated employer hiring a Customer Service Representative.
Compensation range: $52,000–$62,000 CAD.
Must be a Canadian citizen.`,
    postedAt: addDays(-11),
    status: "live",
    retentionUntil: addDays(-11 + 365 * 3),
    complianceScore: 0,
    failedChecks: 1,
  },
];

export type DemoCandidate = {
  id: string;
  name: string;
  postingId: string;
  postingTitle: string;
  source: string;
  lastInterviewDate: Date;
  isFinal: boolean;
  deadlineDate: Date;
  daysToDeadline: number;
  notificationStatus: "pending" | "sent" | "overdue";
  decision: "made" | "not_made" | "no_hire" | null;
};

const candidatesRaw: Omit<DemoCandidate, "deadlineDate" | "daysToDeadline" | "notificationStatus">[] =
  [
    {
      id: "c_001",
      name: "Anika Singh",
      postingId: "p_001",
      postingTitle: "Senior Accountant",
      source: "Indeed",
      lastInterviewDate: addDays(-47),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_002",
      name: "Marc Tremblay",
      postingId: "p_002",
      postingTitle: "Registered Nurse (Full-Time)",
      source: "LinkedIn",
      lastInterviewDate: addDays(-41),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_003",
      name: "Jadesola Okafor",
      postingId: "p_003",
      postingTitle: "Sales Manager — GTA",
      source: "Referral",
      lastInterviewDate: addDays(-34),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_004",
      name: "Priya Cohen",
      postingId: "p_004",
      postingTitle: "Software Engineer — Platform",
      source: "Direct",
      lastInterviewDate: addDays(-23),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_005",
      name: "Daniel Park",
      postingId: "p_001",
      postingTitle: "Senior Accountant",
      source: "Indeed",
      lastInterviewDate: addDays(-15),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_006",
      name: "Riley Thompson",
      postingId: "p_003",
      postingTitle: "Sales Manager — GTA",
      source: "Referral",
      lastInterviewDate: addDays(-7),
      isFinal: true,
      decision: null,
    },
    {
      id: "c_007",
      name: "Hassan El-Sayed",
      postingId: "p_005",
      postingTitle: "Warehouse Associate",
      source: "Indeed",
      lastInterviewDate: addDays(-60),
      isFinal: true,
      decision: "no_hire",
    },
    {
      id: "c_008",
      name: "Elena Volkov",
      postingId: "p_005",
      postingTitle: "Warehouse Associate",
      source: "Walk-in",
      lastInterviewDate: addDays(-58),
      isFinal: true,
      decision: "made",
    },
  ];

export const demoCandidates: DemoCandidate[] = candidatesRaw.map((c) => {
  const deadlineDate = new Date(c.lastInterviewDate);
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 45);
  const daysToDeadline = Math.ceil(
    (deadlineDate.getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24)
  );
  const notificationStatus: DemoCandidate["notificationStatus"] = c.decision
    ? "sent"
    : daysToDeadline < 0
    ? "overdue"
    : "pending";
  return { ...c, deadlineDate, daysToDeadline, notificationStatus };
});

export type DemoVaultItem = {
  id: string;
  type: "posting" | "form" | "notification";
  title: string;
  relatedTo: string;
  archivedAt: Date;
  expiresAt: Date;
};

export const demoVaultItems: DemoVaultItem[] = [
  {
    id: "v_001",
    type: "posting",
    title: "Warehouse Associate — taken down 30 days ago",
    relatedTo: "p_005",
    archivedAt: addDays(-30),
    expiresAt: addDays(-30 + 365 * 3),
  },
  {
    id: "v_002",
    type: "form",
    title: "Application form — Warehouse Associate v2",
    relatedTo: "p_005",
    archivedAt: addDays(-30),
    expiresAt: addDays(-30 + 365 * 3),
  },
  {
    id: "v_003",
    type: "notification",
    title: "Decision notification — Hassan El-Sayed",
    relatedTo: "c_007",
    archivedAt: addDays(-26),
    expiresAt: addDays(-26 + 365 * 3),
  },
  {
    id: "v_004",
    type: "notification",
    title: "Decision notification — Elena Volkov",
    relatedTo: "c_008",
    archivedAt: addDays(-24),
    expiresAt: addDays(-24 + 365 * 3),
  },
];

export function dashboardStats() {
  const overdue = demoCandidates.filter((c) => c.notificationStatus === "overdue").length;
  const upcomingWeek = demoCandidates.filter(
    (c) => c.notificationStatus === "pending" && c.daysToDeadline <= 7
  ).length;
  const live = demoPostings.filter((p) => p.status === "live").length;
  const failingPostings = demoPostings.filter((p) => p.failedChecks > 0 && p.status === "live").length;
  const avgScore = Math.round(
    demoPostings.filter((p) => p.status === "live").reduce((s, p) => s + p.complianceScore, 0) /
      Math.max(1, demoPostings.filter((p) => p.status === "live").length)
  );
  return { overdue, upcomingWeek, live, failingPostings, avgScore, vaultCount: demoVaultItems.length };
}

export function getDemoPosting(id: string) {
  return demoPostings.find((p) => p.id === id);
}

export function getCandidatesForPosting(postingId: string) {
  return demoCandidates.filter((c) => c.postingId === postingId);
}

export function getDemoCandidate(id: string) {
  return demoCandidates.find((c) => c.id === id);
}
