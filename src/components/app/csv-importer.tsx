"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { autoMapHeader, type CsvImportType, type CsvSchema } from "@/lib/csv/schema";
import { validateRows, type ValidationResult } from "@/lib/csv/validate";
import {
  commitPostingsImport,
  commitCandidatesImport,
  type PostingRow,
  type CandidateRow,
  type CommitResult,
} from "@/lib/csv/import-actions";

type Stage = "upload" | "map" | "preview" | "done";

export function CsvImporter({ schema }: { schema: CsvSchema }) {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [isCommitting, startCommit] = useTransition();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStage("upload");
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setValidation(null);
    setCommitResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data as string[][];
        const detectedHeaders = data[0] ?? [];
        const detectedRows = data.slice(1);
        setHeaders(detectedHeaders);
        setRows(detectedRows);
        const auto: Record<string, number | null> = {};
        for (const f of schema.fields) {
          const matchIdx = detectedHeaders.findIndex(
            (h) => autoMapHeader(h, schema) === f.key
          );
          auto[f.key] = matchIdx >= 0 ? matchIdx : null;
        }
        setMapping(auto);
        setStage("map");
      },
    });
  }

  function runValidation() {
    const result = validateRows({ schema, headers, rows, mapping });
    setValidation(result);
    setStage("preview");
  }

  function commit() {
    if (!validation) return;
    const validRows = validation.rows
      .filter((r) => r.errors.length === 0)
      .map((r) => normalizeForCommit(r.values, schema.type));

    startCommit(async () => {
      const result =
        schema.type === "postings"
          ? await commitPostingsImport(validRows as PostingRow[])
          : await commitCandidatesImport(validRows as CandidateRow[]);
      setCommitResult(result);
      setStage("done");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Stepper stage={stage} />

      {stage === "upload" && <UploadStage fileRef={fileRef} onFile={handleFile} schema={schema} />}

      {stage === "map" && (
        <MapStage
          headers={headers}
          mapping={mapping}
          setMapping={setMapping}
          schema={schema}
          fileName={fileName}
          rowCount={rows.length}
          onBack={() => setStage("upload")}
          onNext={runValidation}
        />
      )}

      {stage === "preview" && validation && (
        <PreviewStage
          validation={validation}
          schema={schema}
          onBack={() => setStage("map")}
          onCommit={commit}
          isCommitting={isCommitting}
        />
      )}

      {stage === "done" && commitResult && (
        <DoneStage result={commitResult} schema={schema} onAnother={reset} />
      )}
    </div>
  );
}

function Stepper({ stage }: { stage: Stage }) {
  const steps: { id: Stage; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "map", label: "Map columns" },
    { id: "preview", label: "Preview" },
    { id: "done", label: "Done" },
  ];
  const idx = steps.findIndex((s) => s.id === stage);
  return (
    <ol className="flex items-center gap-1 text-xs">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-1">
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded-full font-medium",
              i < idx
                ? "bg-primary text-primary-foreground"
                : i === idx
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {i + 1}
          </span>
          <span className={cn(i === idx ? "text-foreground font-medium" : "text-muted-foreground")}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="mx-2 h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

function UploadStage({
  fileRef,
  onFile,
  schema,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
  schema: CsvSchema;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload your {schema.title.toLowerCase()} CSV</CardTitle>
        <CardDescription>{schema.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <label
          htmlFor="csv-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors",
            drag
              ? "border-primary bg-primary/5"
              : "border-border bg-secondary/30 hover:border-foreground/30"
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </span>
          <div className="text-sm">
            <span className="font-medium text-foreground">Click to choose a file</span> or drag and drop a CSV
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum 10MB · UTF-8 · Excel, Google Sheets, or any ATS export
          </p>
          <input
            ref={fileRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        <Separator className="my-6" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Don't have a file ready?</div>
            <p className="text-xs text-muted-foreground">
              Download the template, fill it in, and re-upload.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href={`/api/csv-templates/${schema.type}`}>
              <Download className="h-4 w-4" /> Template
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MapStage({
  headers,
  mapping,
  setMapping,
  schema,
  fileName,
  rowCount,
  onBack,
  onNext,
}: {
  headers: string[];
  mapping: Record<string, number | null>;
  setMapping: (m: Record<string, number | null>) => void;
  schema: CsvSchema;
  fileName: string | null;
  rowCount: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const missingRequired = schema.fields
    .filter((f) => f.required && (mapping[f.key] === null || mapping[f.key] === undefined));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match your columns to ClearPost fields</CardTitle>
        <CardDescription>
          <FileSpreadsheet className="mr-1 inline h-3.5 w-3.5" />
          {fileName} · {rowCount} row{rowCount === 1 ? "" : "s"} detected · {headers.length} columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {schema.fields.map((f) => (
            <div key={f.key} className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{f.label}</span>
                  {f.required && <Badge variant="muted" className="text-[10px]">Required</Badge>}
                </div>
                {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
              </div>
              <div className="col-span-7">
                <select
                  value={mapping[f.key] === null || mapping[f.key] === undefined ? "" : String(mapping[f.key])}
                  onChange={(e) =>
                    setMapping({
                      ...mapping,
                      [f.key]: e.target.value === "" ? null : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Don't import —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {missingRequired.length > 0 && (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
            Required field{missingRequired.length === 1 ? "" : "s"} not yet mapped:{" "}
            {missingRequired.map((f) => f.label).join(", ")}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            Choose a different file
          </Button>
          <Button onClick={onNext} disabled={missingRequired.length > 0}>
            Preview <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewStage({
  validation,
  schema,
  onBack,
  onCommit,
  isCommitting,
}: {
  validation: ValidationResult;
  schema: CsvSchema;
  onBack: () => void;
  onCommit: () => void;
  isCommitting: boolean;
}) {
  const preview = validation.rows.slice(0, 8);
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Preview</CardTitle>
          <CardDescription>{validation.summary}</CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="success">{validation.validCount} valid</Badge>
          {validation.errorCount > 0 && (
            <Badge variant="warning">{validation.errorCount} with errors</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Row</th>
                {schema.fields.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-left font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r) => (
                <tr key={r.rowNumber} className="border-t border-border/60">
                  <td className="px-3 py-2 text-muted-foreground">{r.rowNumber}</td>
                  {schema.fields.map((f) => {
                    const v = r.values[f.key];
                    return (
                      <td key={f.key} className="max-w-[180px] px-3 py-2">
                        <span className="line-clamp-2 break-words">{formatCellValue(v)}</span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {r.errors.length === 0 ? (
                      <Badge variant="success" className="text-[10px]">OK</Badge>
                    ) : (
                      <Badge variant="danger" className="text-[10px]" title={r.errors.map((e) => e.message).join(", ")}>
                        {r.errors.length} error{r.errors.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {validation.rows.length > preview.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing first {preview.length} of {validation.rows.length}. Rows with errors are skipped on commit.
          </p>
        )}

        {validation.errorCount > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              View all {validation.errorCount} error{validation.errorCount === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {validation.rows
                .filter((r) => r.errors.length > 0)
                .slice(0, 50)
                .map((r) => (
                  <li key={r.rowNumber}>
                    <span className="font-mono text-foreground">Row {r.rowNumber}:</span>{" "}
                    {r.errors.map((e) => e.message).join(" · ")}
                  </li>
                ))}
            </ul>
          </details>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back to mapping
          </Button>
          <Button onClick={onCommit} disabled={isCommitting || validation.validCount === 0}>
            {isCommitting ? "Importing…" : `Import ${validation.validCount} row${validation.validCount === 1 ? "" : "s"}`}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DoneStage({
  result,
  schema,
  onAnother,
}: {
  result: CommitResult;
  schema: CsvSchema;
  onAnother: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              result.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            )}
          >
            {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div>
            <CardTitle>
              {result.ok
                ? `Imported ${result.imported} ${schema.title.toLowerCase()}`
                : "Import finished with issues"}
            </CardTitle>
            <CardDescription>
              {result.demo
                ? "Demo mode: rows were validated but not persisted. Configure DATABASE_URL to write to your Supabase project."
                : `${result.imported} written · ${result.skipped} skipped`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.errors.length > 0 && (
          <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            {result.errors.slice(0, 8).map((e, i) => (
              <li key={i}>· {e}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Button onClick={onAnother} variant="outline">
            <RefreshCw className="h-4 w-4" /> Import another file
          </Button>
          <Button asChild>
            <a href={schema.type === "postings" ? "/app/postings" : "/app/candidates"}>
              View {schema.title.toLowerCase()}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCellValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (v instanceof Date) return v.toLocaleDateString("en-CA");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString("en-CA");
  return String(v);
}

function normalizeForCommit(
  values: Record<string, string | number | boolean | Date | null>,
  type: CsvImportType
): PostingRow | CandidateRow {
  const dateAsString = (v: unknown) => (v instanceof Date ? v.toISOString() : null);
  if (type === "postings") {
    return {
      title: String(values.title ?? ""),
      postingUrl: (values.postingUrl as string | null) ?? null,
      rawText: String(values.rawText ?? ""),
      vacancyStatus:
        (values.vacancyStatus as "existing_vacancy" | "pipeline" | "not_disclosed" | null) ?? null,
      aiUsed: typeof values.aiUsed === "boolean" ? values.aiUsed : null,
      compensationMin:
        typeof values.compensationMin === "number" ? values.compensationMin : null,
      compensationMax:
        typeof values.compensationMax === "number" ? values.compensationMax : null,
      postedAt: dateAsString(values.postedAt),
    };
  }
  return {
    name: String(values.name ?? ""),
    email: (values.email as string | null) ?? null,
    postingTitle: String(values.postingTitle ?? ""),
    source: (values.source as string | null) ?? null,
    lastInterviewDate: dateAsString(values.lastInterviewDate) ?? "",
  };
}
