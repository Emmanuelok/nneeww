import type { CsvSchema, CsvFieldSchema } from "./schema";

export type CellError = { field: string; message: string };

export type ValidatedRow = {
  rowNumber: number;
  values: Record<string, string | number | boolean | Date | null>;
  errors: CellError[];
};

export type ValidationResult = {
  rows: ValidatedRow[];
  validCount: number;
  errorCount: number;
  summary: string;
};

/**
 * Normalize, type-coerce, and validate a single CSV cell against a schema.
 * Returns the coerced value (or null for empty optional cells) and an error
 * message if validation fails.
 */
function coerceCell(
  raw: string,
  field: CsvFieldSchema
): { value: string | number | boolean | Date | null; error: string | null } {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") {
    if (field.required) return { value: null, error: `${field.label} is required` };
    return { value: null, error: null };
  }

  switch (field.type) {
    case "string":
      return { value: trimmed, error: null };

    case "number": {
      const cleaned = trimmed.replace(/[$,\s]/g, "");
      const n = Number(cleaned);
      if (!Number.isFinite(n)) return { value: null, error: `${field.label}: not a number` };
      return { value: n, error: null };
    }

    case "boolean": {
      const v = trimmed.toLowerCase();
      if (["true", "yes", "y", "1"].includes(v)) return { value: true, error: null };
      if (["false", "no", "n", "0"].includes(v)) return { value: false, error: null };
      return { value: null, error: `${field.label}: not a boolean (true/false/yes/no)` };
    }

    case "date": {
      // Accept ISO YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS or common D/M/Y / M/D/Y.
      const d = parseDate(trimmed);
      if (!d) return { value: null, error: `${field.label}: not a date (use YYYY-MM-DD)` };
      return { value: d, error: null };
    }

    case "enum": {
      const lowered = trimmed.toLowerCase().replace(/\s+/g, "_");
      const enumValues = field.enumValues ?? [];
      if (enumValues.includes(lowered)) return { value: lowered, error: null };
      return {
        value: null,
        error: `${field.label}: must be one of ${enumValues.join(", ")}`,
      };
    }

    default:
      return { value: trimmed, error: null };
  }
}

function parseDate(s: string): Date | null {
  // YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(s);
  if (iso) {
    const [, y, m, d, hh = "0", mm = "0"] = iso;
    const date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm));
    return Number.isFinite(date.getTime()) ? date : null;
  }
  // Common North American formats; try Date constructor as a fallback.
  const fallback = new Date(s);
  return Number.isFinite(fallback.getTime()) ? fallback : null;
}

/**
 * Validate every parsed CSV row against a schema using the user's column
 * mapping. `mapping[fieldKey]` tells us which header index supplies each
 * target field; null skips the field.
 */
export function validateRows({
  schema,
  headers,
  rows,
  mapping,
}: {
  schema: CsvSchema;
  headers: string[];
  rows: string[][];
  mapping: Record<string, number | null>;
}): ValidationResult {
  const validated: ValidatedRow[] = rows
    .map((row, i) => {
      // Skip comment rows (Excel-friendly: starts with "#").
      if (row[0]?.trim().startsWith("#")) return null;
      // Skip wholly empty rows.
      if (row.every((cell) => (cell ?? "").trim() === "")) return null;

      const values: ValidatedRow["values"] = {};
      const errors: CellError[] = [];
      for (const field of schema.fields) {
        const idx = mapping[field.key];
        const raw = idx != null ? row[idx] ?? "" : "";
        const { value, error } = coerceCell(raw, field);
        values[field.key] = value;
        if (error) errors.push({ field: field.key, message: error });
      }
      return { rowNumber: i + 2 /* +1 for header, +1 for 1-indexed */, values, errors };
    })
    .filter((r): r is ValidatedRow => r !== null);

  const errorCount = validated.filter((r) => r.errors.length > 0).length;
  const validCount = validated.length - errorCount;
  void headers; // currently unused, but kept on the interface for future per-header diagnostics

  return {
    rows: validated,
    validCount,
    errorCount,
    summary:
      errorCount === 0
        ? `All ${validCount} row${validCount === 1 ? "" : "s"} valid.`
        : `${validCount} valid · ${errorCount} with errors`,
  };
}
