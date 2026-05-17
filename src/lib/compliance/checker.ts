import { getJurisdiction, type JurisdictionCode, type JurisdictionRules } from "./jurisdictions";

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export type CheckId =
  | "pay_range"
  | "ai_disclosure"
  | "vacancy_disclosure"
  | "prohibited_clauses"
  | "compensation_currency";

/**
 * Per-jurisdiction citation strings. Falls back to a generic citation when
 * a jurisdiction/check pair isn't explicitly mapped.
 */
const CITATIONS: Partial<Record<JurisdictionCode, Partial<Record<CheckId, string>>>> = {
  ca_on: {
    pay_range: "ESA, s. 8.1 · Pay transparency in postings",
    ai_disclosure: "ESA, s. 8.4 · Disclosure of AI in posting",
    vacancy_disclosure: "ESA, s. 8.2 · Existing-vacancy disclosure",
    prohibited_clauses: "ESA, s. 8.3 · Prohibited information requests",
    compensation_currency: "ESA, s. 8.1 · Pay transparency in postings",
  },
  ca_bc: {
    pay_range: "BC Pay Transparency Act, s. 2 · Pay information in postings",
    compensation_currency: "BC Pay Transparency Act, s. 2 · Pay information in postings",
  },
  ca_fed: {
    pay_range: "Canada Labour Code · pay-transparency proposals (advisory)",
    prohibited_clauses: "Canadian Human Rights Act, s. 11 · Discriminatory hiring practices",
  },
};

function citationFor(jurisdiction: JurisdictionCode, check: CheckId, fallback: string): string {
  return CITATIONS[jurisdiction]?.[check] ?? fallback;
}

export type CheckResult = {
  id: CheckId;
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
  citation: string;
  suggestion?: string;
};

export type PostingInput = {
  title: string;
  rawText: string;
  jurisdiction: JurisdictionCode;
  vacancyStatus: "existing_vacancy" | "pipeline" | "not_disclosed" | null;
  aiUsed: boolean;
  aiDisclosureText?: string | null;
  compensationMin?: number | null;
  compensationMax?: number | null;
  compensationCurrency?: "CAD" | "USD" | "EUR" | null;
};

export type ComplianceReport = {
  jurisdiction: JurisdictionRules;
  score: number;
  riskTier: "low" | "moderate" | "high";
  results: CheckResult[];
  summary: { pass: number; warn: number; fail: number; info: number };
};

const PAY_RANGE_REGEX =
  /\$\s?(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(?:[-–—to]+\s*)\$?\s?(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)/i;

const SINGLE_AMOUNT_REGEX = /\$\s?(\d{1,3}(?:[,\s]?\d{3})*(?:\.\d{1,2})?)\s*(?:k|K)?/;

const AI_HINT_REGEX =
  /\b(ai|artificial intelligence|machine learning|algorithmic|automated decision|resume scoring|candidate ranking|screen.{0,15}applic|ats.{0,10}rank)\b/i;

const VACANCY_REGEX =
  /\b(existing vacancy|active vacancy|currently hiring|filling (a|this) (role|position|vacancy)|pipeline (build|hiring)|talent pipeline|future opportunit|building (our|a) pipeline)\b/i;

const PIPELINE_REGEX = /\b(pipeline|future opportunit|building (our|a) pipeline)\b/i;

function parseAmount(s: string): number {
  const cleaned = s.replace(/[\s,]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function detectPayRange(text: string, explicit?: { min?: number | null; max?: number | null }) {
  if (explicit?.min && explicit?.max) {
    return { min: explicit.min, max: explicit.max, source: "explicit" as const };
  }
  const m = text.match(PAY_RANGE_REGEX);
  if (m) {
    let min = parseAmount(m[1]);
    let max = parseAmount(m[2]);
    // Heuristic: "$120k - $150k" should be ×1000
    const tail = text.slice(m.index ?? 0, (m.index ?? 0) + m[0].length + 2).toLowerCase();
    if (tail.includes("k") && min < 1000) {
      min *= 1000;
      max *= 1000;
    }
    if (min > max) [min, max] = [max, min];
    return { min, max, source: "parsed" as const };
  }
  return null;
}

function statusToScore(s: CheckStatus): number {
  return s === "fail" ? 0 : s === "warn" ? 1 : s === "info" ? 2 : 2;
}

export function runComplianceChecks(input: PostingInput): ComplianceReport {
  const j = getJurisdiction(input.jurisdiction);
  const text = (input.rawText ?? "").trim();
  const results: CheckResult[] = [];

  // -------------------- Pay range --------------------
  if (j.rules.payTransparency.required) {
    const found = detectPayRange(text, {
      min: input.compensationMin,
      max: input.compensationMax,
    });
    const exemption = j.rules.payTransparency.upperBoundExemption;
    const maxSpread = j.rules.payTransparency.maxRangeSpread;

    const cite = citationFor(input.jurisdiction, "pay_range", "Pay-transparency rule");
    if (!found) {
      results.push({
        id: "pay_range",
        label: "Pay transparency",
        status: "fail",
        message: "No pay range detected in this posting.",
        detail:
          exemption
            ? `Postings must disclose expected compensation or a range${exemption ? `, unless the upper end exceeds ${formatMoney(exemption)}` : ""}.`
            : "Postings must disclose expected compensation or a range.",
        citation: cite,
        suggestion: maxSpread
          ? `Add a clearly stated range, e.g. "Expected compensation: $85,000–$115,000 CAD." Keep the spread at or under ${formatMoney(maxSpread)}.`
          : `Add a clearly stated range, e.g. "Expected compensation: $85,000–$115,000 CAD."`,
      });
    } else if (exemption && found.max >= exemption) {
      results.push({
        id: "pay_range",
        label: "Pay transparency",
        status: "info",
        message: `Upper end ($${found.max.toLocaleString("en-CA")}) exceeds the ${formatMoney(
          exemption
        )} exemption threshold — pay disclosure is not required.`,
        citation: cite,
      });
    } else if (maxSpread && found.max - found.min > maxSpread) {
      results.push({
        id: "pay_range",
        label: "Pay transparency",
        status: "fail",
        message: `Range spread is ${formatMoney(
          found.max - found.min
        )}, which exceeds the ${formatMoney(maxSpread)} cap.`,
        detail: `Detected $${found.min.toLocaleString(
          "en-CA"
        )} – $${found.max.toLocaleString("en-CA")}.`,
        citation: cite,
        suggestion: `Narrow the range to a maximum spread of ${formatMoney(maxSpread)}. If you must keep it wider, split the posting by seniority.`,
      });
    } else {
      results.push({
        id: "pay_range",
        label: "Pay transparency",
        status: "pass",
        message: maxSpread
          ? `Range $${found.min.toLocaleString("en-CA")} – $${found.max.toLocaleString("en-CA")} is within the ${formatMoney(maxSpread)} spread cap.`
          : `Range $${found.min.toLocaleString("en-CA")} – $${found.max.toLocaleString("en-CA")} disclosed.`,
        citation: cite,
      });
    }
  }

  // -------------------- AI disclosure --------------------
  if (j.rules.aiDisclosure.required) {
    const mentionsAi = AI_HINT_REGEX.test(text) || !!input.aiDisclosureText;
    const aiUsed = input.aiUsed;
    const cite = citationFor(input.jurisdiction, "ai_disclosure", "AI-disclosure rule");

    if (aiUsed && !mentionsAi) {
      results.push({
        id: "ai_disclosure",
        label: "AI disclosure",
        status: "fail",
        message:
          "Your organization uses AI in screening but this posting does not disclose it.",
        detail:
          "Algorithmic ranking, automated resume scoring, and most ATS scoring qualify as 'AI used to screen, assess or select.'",
        citation: cite,
        suggestion:
          "Add: “We use an applicant tracking system that applies automated scoring to rank applications. A recruiter reviews the highest-ranked applications.”",
      });
    } else if (aiUsed && mentionsAi) {
      results.push({
        id: "ai_disclosure",
        label: "AI disclosure",
        status: "pass",
        message: "AI use is disclosed in the posting text.",
        citation: cite,
      });
    } else if (!aiUsed && mentionsAi) {
      results.push({
        id: "ai_disclosure",
        label: "AI disclosure",
        status: "warn",
        message:
          "The posting references AI/automated screening, but your org profile says AI is not used. Reconcile this.",
        citation: cite,
      });
    } else {
      results.push({
        id: "ai_disclosure",
        label: "AI disclosure",
        status: "info",
        message: "AI screening not used — no disclosure required.",
        citation: cite,
      });
    }
  }

  // -------------------- Vacancy disclosure --------------------
  if (j.rules.vacancyDisclosure.required) {
    const declared = input.vacancyStatus && input.vacancyStatus !== "not_disclosed";
    const found = VACANCY_REGEX.test(text);
    const cite = citationFor(input.jurisdiction, "vacancy_disclosure", "Vacancy-disclosure rule");
    if (declared || found) {
      const isPipeline =
        input.vacancyStatus === "pipeline" || (!declared && PIPELINE_REGEX.test(text));
      results.push({
        id: "vacancy_disclosure",
        label: "Vacancy disclosure",
        status: "pass",
        message: isPipeline
          ? "Posting is disclosed as a pipeline build."
          : "Posting is disclosed as an existing vacancy.",
        citation: cite,
      });
    } else {
      results.push({
        id: "vacancy_disclosure",
        label: "Vacancy disclosure",
        status: "fail",
        message:
          "The posting does not state whether this is an existing vacancy or a pipeline build.",
        citation: cite,
        suggestion:
          "Add a one-sentence disclosure, e.g. “This posting is for an existing vacancy on our Toronto team.”",
      });
    }
  }

  // -------------------- Prohibited 'Canadian experience' clauses --------------------
  const prohibited = j.rules.prohibitedClauses
    .map((c) => c.toLowerCase())
    .filter((c) => text.toLowerCase().includes(c));

  if (j.rules.prohibitedClauses.length > 0) {
    const cite = citationFor(input.jurisdiction, "prohibited_clauses", "Prohibited-information rule");
    if (prohibited.length > 0) {
      results.push({
        id: "prohibited_clauses",
        label: "Prohibited language",
        status: "fail",
        message: `Prohibited phrase${prohibited.length > 1 ? "s" : ""} detected: ${prohibited
          .map((p) => `“${p}”`)
          .join(", ")}.`,
        detail:
          input.jurisdiction === "ca_fed"
            ? "Citizenship-required language attracts scrutiny under the Canadian Human Rights Act for non-NOC-restricted roles."
            : "Requiring Canadian work experience is prohibited in both postings and application forms.",
        citation: cite,
        suggestion:
          input.jurisdiction === "ca_fed"
            ? 'Replace with: "Must be legally authorized to work in Canada" — or describe the underlying authorization need directly.'
            : 'Replace with: "Experience working in a regulated North American environment is an asset" — or describe the underlying competency directly.',
      });
    } else {
      results.push({
        id: "prohibited_clauses",
        label: "Prohibited language",
        status: "pass",
        message:
          input.jurisdiction === "ca_fed"
            ? "No prohibited citizenship-required language detected."
            : "No prohibited 'Canadian experience' language detected.",
        citation: cite,
      });
    }
  }

  // -------------------- Currency hygiene --------------------
  if (
    input.compensationCurrency &&
    input.compensationCurrency !== j.rules.payTransparency.currency
  ) {
    results.push({
      id: "compensation_currency",
      label: "Compensation currency",
      status: "warn",
      message: `Posting compensation is in ${input.compensationCurrency} but ${j.name} expects ${j.rules.payTransparency.currency}.`,
      citation: "ESA, s. 8.1 · Pay transparency in postings",
    });
  }

  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const r of results) summary[r.status] += 1;

  const totalScored = results.filter((r) => r.status !== "info").length || 1;
  const maxScore = totalScored * 2;
  const earned = results
    .filter((r) => r.status !== "info")
    .reduce((sum, r) => sum + statusToScore(r.status), 0);
  const score = Math.round((earned / maxScore) * 100);

  const riskTier: ComplianceReport["riskTier"] =
    summary.fail >= 2 ? "high" : summary.fail === 1 || summary.warn >= 2 ? "moderate" : "low";

  return { jurisdiction: j, score, riskTier, results, summary };
}

function formatMoney(n: number) {
  return `$${n.toLocaleString("en-CA")}`;
}
