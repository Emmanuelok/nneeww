/**
 * Schema descriptions for CSV imports. Each schema lists target fields with
 * header aliases (used for auto-mapping), types, and per-cell validators.
 *
 * Two import types in v1:
 *   - postings: job posting records (one row = one posting)
 *   - candidates: candidate + their final interview + 45-day deadline
 *     (one row = one candidate, posting referenced by title)
 */

export type CsvFieldType = "string" | "number" | "date" | "boolean" | "enum";

export type CsvFieldSchema = {
  key: string;
  label: string;
  type: CsvFieldType;
  required: boolean;
  aliases: string[]; // lowercase, no punctuation
  enumValues?: string[];
  example: string;
  help?: string;
};

export type CsvImportType = "postings" | "candidates";

export type CsvSchema = {
  type: CsvImportType;
  title: string;
  description: string;
  fields: CsvFieldSchema[];
};

const POSTING_FIELDS: CsvFieldSchema[] = [
  {
    key: "title",
    label: "Job title",
    type: "string",
    required: true,
    aliases: ["title", "job title", "role", "position", "job name"],
    example: "Senior Accountant",
  },
  {
    key: "postingUrl",
    label: "Posting URL",
    type: "string",
    required: false,
    aliases: ["url", "posting url", "link", "job url", "posting link"],
    example: "https://careers.acme.ca/postings/senior-accountant",
  },
  {
    key: "rawText",
    label: "Posting text",
    type: "string",
    required: true,
    aliases: ["text", "posting text", "description", "body", "content", "job description"],
    example: "Acme Manufacturing is hiring a Senior Accountant…",
    help: "Paste the full body text of the posting. The compliance checker runs against this.",
  },
  {
    key: "vacancyStatus",
    label: "Vacancy status",
    type: "enum",
    required: false,
    aliases: ["vacancy", "vacancy status", "type", "posting type"],
    enumValues: ["existing_vacancy", "pipeline", "not_disclosed"],
    example: "existing_vacancy",
    help: "One of: existing_vacancy, pipeline, not_disclosed",
  },
  {
    key: "aiUsed",
    label: "AI screening used",
    type: "boolean",
    required: false,
    aliases: ["ai", "ai used", "ai screening", "uses ai", "algorithmic screening"],
    example: "true",
    help: "true/false. Defaults to true (most ATSs score applicants).",
  },
  {
    key: "compensationMin",
    label: "Compensation min (CAD)",
    type: "number",
    required: false,
    aliases: ["comp min", "compensation min", "salary min", "min", "min salary", "min compensation"],
    example: "95000",
  },
  {
    key: "compensationMax",
    label: "Compensation max (CAD)",
    type: "number",
    required: false,
    aliases: ["comp max", "compensation max", "salary max", "max", "max salary", "max compensation"],
    example: "125000",
  },
  {
    key: "postedAt",
    label: "Posted at",
    type: "date",
    required: false,
    aliases: ["posted", "posted at", "posting date", "date posted"],
    example: "2026-04-15",
    help: "ISO date (YYYY-MM-DD). Defaults to today if omitted.",
  },
];

const CANDIDATE_FIELDS: CsvFieldSchema[] = [
  {
    key: "name",
    label: "Candidate name",
    type: "string",
    required: true,
    aliases: ["name", "candidate", "candidate name", "full name", "applicant", "applicant name"],
    example: "Anika Singh",
  },
  {
    key: "email",
    label: "Candidate email",
    type: "string",
    required: false,
    aliases: ["email", "e-mail", "contact email", "candidate email", "applicant email"],
    example: "anika.singh@example.ca",
    help: "Required if you plan to send the 45-day notification via email.",
  },
  {
    key: "postingTitle",
    label: "Posting title",
    type: "string",
    required: true,
    aliases: ["posting", "posting title", "role", "job title", "applied to"],
    example: "Senior Accountant",
    help: "Must match an existing posting in your workspace (exact match, case-insensitive).",
  },
  {
    key: "source",
    label: "Application source",
    type: "string",
    required: false,
    aliases: ["source", "via", "channel", "applied via", "application source"],
    example: "Indeed",
  },
  {
    key: "lastInterviewDate",
    label: "Final interview date",
    type: "date",
    required: true,
    aliases: [
      "interview",
      "final interview",
      "interview date",
      "last interview",
      "last interview date",
      "final interview date",
      "interviewed on",
    ],
    example: "2026-04-09",
    help: "ISO date. The 45-day notification deadline is calculated from this.",
  },
];

export const SCHEMAS: Record<CsvImportType, CsvSchema> = {
  postings: {
    type: "postings",
    title: "Postings",
    description:
      "Import your active and historical job postings. ClearPost runs each posting through the compliance checker on save.",
    fields: POSTING_FIELDS,
  },
  candidates: {
    type: "candidates",
    title: "Candidates",
    description:
      "Import every candidate you interviewed. Each row generates a 45-day notification deadline counted from the final-interview date.",
    fields: CANDIDATE_FIELDS,
  },
};

export function getSchema(type: CsvImportType): CsvSchema {
  return SCHEMAS[type];
}

const PUNCT = /[^a-z0-9]+/g;
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(PUNCT, " ").trim();
}

/**
 * Returns the best-matching field key for a CSV header by checking aliases.
 * Used to pre-populate the column-mapping step of the importer wizard.
 */
export function autoMapHeader(header: string, schema: CsvSchema): string | null {
  const h = normalize(header);
  for (const f of schema.fields) {
    if (normalize(f.key) === h) return f.key;
    if (normalize(f.label) === h) return f.key;
    if (f.aliases.some((a) => normalize(a) === h)) return f.key;
  }
  return null;
}

export function buildTemplateCsv(schema: CsvSchema): string {
  const headers = schema.fields.map((f) => f.label);
  const example = schema.fields.map((f) => f.example);
  const guidance = schema.fields.map((f) =>
    f.required ? `[required] ${f.help ?? ""}` : f.help ?? ""
  );
  // Two example rows + one guidance row commented out (Excel ignores leading #).
  return [
    headers.join(","),
    example.map(csvEscape).join(","),
    guidance.map((g) => csvEscape("# " + g)).join(","),
  ].join("\n");
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
