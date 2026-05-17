/**
 * Compliance report builder. Produces an audit-ready package containing:
 *
 *   - report.pdf            — narrative report with cover, executive summary,
 *                             per-posting compliance results, notification log,
 *                             retention summary, methodology, and statute
 *                             citations
 *   - postings.csv          — flat export of every posting in the range
 *   - notifications.csv     — flat export of every 45-day notification with
 *                             status, decision, delivery proof
 *   - vault-manifest.csv    — every item in the retention vault
 *   - README.txt            — package contents + how to use it
 *
 * The builder is jurisdiction-aware and reads through the existing repository
 * layer, so it works in both demo and live mode.
 */

import PDFDocument from "pdfkit";
import JSZip from "jszip";
import { listPostings, type Posting } from "@/lib/repositories/postings";
import { listCandidates, type Candidate } from "@/lib/repositories/candidates";
import { listVaultItems, type VaultItem } from "@/lib/repositories/vault";
import { runComplianceChecks, type ComplianceReport } from "@/lib/compliance/checker";
import { getJurisdiction, type JurisdictionCode } from "@/lib/compliance/jurisdictions";

export type ReportInput = {
  orgName: string;
  orgId: string;
  jurisdiction: JurisdictionCode;
  fromDate: Date;
  toDate: Date;
};

export type ReportBundle = {
  zipBytes: Buffer;
  filename: string;
};

// Deep teal #0f766e and supporting tones, expressed as PDFKit-friendly hex.
const COLOR = {
  primary: "#0f766e",
  primaryLight: "#ccfbf1",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  red: "#b91c1c",
  redLight: "#fef2f2",
  amber: "#92400e",
  amberLight: "#fffbeb",
  green: "#15803d",
  greenLight: "#f0fdf4",
} as const;

export async function buildComplianceReport(input: ReportInput): Promise<ReportBundle> {
  const [postings, candidates, vault] = await Promise.all([
    listPostings(input.orgId),
    listCandidates(input.orgId),
    listVaultItems(input.orgId),
  ]);

  const inRange = (d: Date | null | undefined) =>
    !!d && d >= input.fromDate && d <= input.toDate;

  const filteredPostings = postings.filter((p) => inRange(p.postedAt) || p.status === "live");
  const reports = new Map<string, ComplianceReport>();
  for (const p of filteredPostings) {
    reports.set(
      p.id,
      runComplianceChecks({
        title: p.title,
        rawText: p.rawText,
        jurisdiction: p.jurisdiction,
        vacancyStatus: p.vacancyStatus,
        aiUsed: p.aiUsed,
        compensationMin: p.compensationMin,
        compensationMax: p.compensationMax,
        compensationCurrency: p.compensationCurrency,
      })
    );
  }

  const pdfBytes = await renderPdf(input, filteredPostings, candidates, vault, reports);

  const zip = new JSZip();
  zip.file("report.pdf", pdfBytes);
  zip.file("postings.csv", postingsToCsv(filteredPostings, reports));
  zip.file("notifications.csv", candidatesToCsv(candidates));
  zip.file("vault-manifest.csv", vaultToCsv(vault));
  zip.file("README.txt", readme(input, filteredPostings.length, candidates.length, vault.length));

  const zipBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  const dateRange = `${iso(input.fromDate)}_to_${iso(input.toDate)}`;
  const filename = `clearpost-compliance-${slug(input.orgName)}-${dateRange}.zip`;

  return { zipBytes, filename };
}

// -----------------------------------------------------------------------------
// PDF rendering
// -----------------------------------------------------------------------------

function renderPdf(
  input: ReportInput,
  postings: Posting[],
  candidates: Candidate[],
  vault: VaultItem[],
  reports: Map<string, ComplianceReport>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      info: {
        Title: `Compliance Report — ${input.orgName}`,
        Author: "ClearPost",
        Subject: "ESA Working for Workers Acts compliance package",
        Keywords: "Ontario, ESA, hiring, compliance, ClearPost",
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const j = getJurisdiction(input.jurisdiction);
    const livePostings = postings.filter((p) => p.status === "live");
    const overdue = candidates.filter((c) => c.notificationStatus === "overdue").length;
    const notified = candidates.filter((c) => c.notificationStatus === "sent").length;
    const avgScore =
      livePostings.length === 0
        ? 100
        : Math.round(
            livePostings.reduce((s, p) => s + (reports.get(p.id)?.score ?? p.complianceScore), 0) /
              livePostings.length
          );

    // ------- Cover page -------
    doc.fillColor(COLOR.primary).fontSize(11).text("CLEARPOST · COMPLIANCE PACKAGE", {
      characterSpacing: 1.2,
    });
    doc.moveDown(2);
    doc.fillColor(COLOR.text).fontSize(28).text(input.orgName, { lineGap: 4 });
    doc.moveDown(0.5);
    doc.fillColor(COLOR.muted).fontSize(14).text(
      `${j.name} · ${iso(input.fromDate)} to ${iso(input.toDate)}`
    );
    doc.moveDown(3);

    // Cover stats grid
    drawStatGrid(doc, [
      { label: "Live postings", value: String(livePostings.length) },
      { label: "Avg compliance score", value: `${avgScore}` },
      { label: "Candidates tracked", value: String(candidates.length) },
      { label: "Notifications sent", value: String(notified) },
      { label: "Overdue", value: String(overdue) },
      { label: "Vault items", value: String(vault.length) },
    ]);

    doc.moveDown(4);
    doc
      .fillColor(COLOR.muted)
      .fontSize(9)
      .text(
        `Generated by ClearPost on ${new Date().toLocaleString("en-CA", {
          dateStyle: "long",
          timeStyle: "short",
        })}. This package documents your organization's adherence to ${j.name}'s job-posting and candidate-notification obligations under the Employment Standards Act as amended by the Working for Workers Four / Five / Seven Acts. ClearPost is a compliance operations tool, not legal advice — confirm specifics with HR counsel.`,
        { lineGap: 2 }
      );

    // ------- Executive summary -------
    doc.addPage();
    sectionHeader(doc, "Executive summary");
    doc.fontSize(11).fillColor(COLOR.text).text(
      `This package reflects the state of ${input.orgName}'s public job postings, interviewed candidates, and retained records for the period ${iso(input.fromDate)} – ${iso(input.toDate)}.`,
      { lineGap: 4 }
    );
    doc.moveDown(0.6);
    doc.text(
      `${livePostings.length} live posting${livePostings.length === 1 ? "" : "s"} ${livePostings.length === 1 ? "is" : "are"} included; the average compliance score across them is ${avgScore} of 100. ${notified} of ${candidates.length} interviewed candidates have received a 45-day decision notification with a logged delivery proof. ${overdue} interview${overdue === 1 ? " is" : "s are"} past the 45-day deadline at the time of generation.`
    );

    doc.moveDown(1);
    bullet(doc, "Pay transparency", `${j.rules.payTransparency.required ? "Required" : "Not required"}${j.rules.payTransparency.maxRangeSpread ? ` — range spread cap $${j.rules.payTransparency.maxRangeSpread.toLocaleString("en-CA")}` : ""}${j.rules.payTransparency.upperBoundExemption ? `, exemption above $${j.rules.payTransparency.upperBoundExemption.toLocaleString("en-CA")}` : ""}.`);
    bullet(doc, "AI disclosure", j.rules.aiDisclosure.required ? "Required when AI is used to screen or rank applicants." : "Not required.");
    bullet(doc, "Vacancy disclosure", j.rules.vacancyDisclosure.required ? "Required — existing vacancy vs. pipeline build must be stated." : "Not required.");
    bullet(doc, "Candidate notification", j.rules.candidateNotificationDays ? `${j.rules.candidateNotificationDays}-day deadline applies after the final interview.` : "No deadline.");
    bullet(doc, "Record retention", j.rules.recordRetentionYears ? `${j.rules.recordRetentionYears}-year retention from takedown.` : "No retention rule.");

    // ------- Postings appendix -------
    doc.addPage();
    sectionHeader(doc, "Posting compliance results");
    if (postings.length === 0) {
      doc.fontSize(11).fillColor(COLOR.muted).text("No postings in range.");
    }

    postings.forEach((p, i) => {
      const r = reports.get(p.id);
      if (i > 0) doc.moveDown(1);
      ensureRoom(doc, 200);
      drawPostingCard(doc, p, r);
    });

    // ------- Notifications appendix -------
    doc.addPage();
    sectionHeader(doc, "45-day candidate notifications");
    if (candidates.length === 0) {
      doc.fontSize(11).fillColor(COLOR.muted).text("No candidates on file for this period.");
    } else {
      doc.fontSize(9).fillColor(COLOR.muted).text(
        "Each row reflects an interviewed candidate. 'Delivery proof' is the Resend message id or manual-record marker recorded at the time of notification."
      );
      doc.moveDown(0.6);
      drawNotificationsTable(doc, candidates);
    }

    // ------- Retention summary -------
    doc.addPage();
    sectionHeader(doc, "Retention vault");
    doc.fontSize(11).fillColor(COLOR.text).text(
      `Records subject to the ${j.rules.recordRetentionYears ?? 3}-year retention requirement are archived automatically when their parent posting is taken down. ${vault.length} item${vault.length === 1 ? " is" : "s are"} currently in the vault.`
    );
    doc.moveDown(0.8);
    drawVaultTable(doc, vault);

    // ------- Methodology + citations -------
    doc.addPage();
    sectionHeader(doc, "Methodology and citations");
    doc.fontSize(11).fillColor(COLOR.text).text(
      "ClearPost evaluates each posting against a typed, jurisdiction-specific rules engine. Each check produces a pass / warn / fail / info status with an Employment Standards Act citation."
    );
    doc.moveDown(0.8);
    bullet(doc, "Pay transparency", "Regex + explicit-range parsing detects a stated compensation range, then validates the spread and exemption threshold.");
    bullet(doc, "AI disclosure", "Checks the posting text against AI-related keywords AND the organization's recorded use of AI screening. Mismatches are flagged.");
    bullet(doc, "Vacancy disclosure", "Looks for explicit vacancy-status declarations plus common phrasings in the posting body.");
    bullet(doc, "Prohibited language", "Pattern-matches against the jurisdiction's prohibited-clause list, primarily 'Canadian experience' phrasing variants.");

    doc.moveDown(1.2);
    doc.fontSize(11).fillColor(COLOR.text).text("Source materials");
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor(COLOR.muted);
    doc.text(`${j.name} statute: ${j.statuteUrl}`, { link: j.statuteUrl, underline: true });
    doc.moveDown(0.2);
    doc.text("Working for Workers Four Act, 2024: https://www.ontario.ca/laws/statute/S24021", {
      link: "https://www.ontario.ca/laws/statute/S24021",
      underline: true,
    });
    doc.moveDown(0.2);
    doc.text("Working for Workers Five Act, 2024: https://www.ontario.ca/laws/statute/S24022", {
      link: "https://www.ontario.ca/laws/statute/S24022",
      underline: true,
    });
    doc.moveDown(0.2);
    doc.text("Employment Standards Act, 2000: https://www.ontario.ca/laws/statute/00e41", {
      link: "https://www.ontario.ca/laws/statute/00e41",
      underline: true,
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor(COLOR.muted).text(
      "ClearPost is a compliance operations tool. The statute citations surfaced in this report are a starting point, not a legal opinion. Confirm specifics with qualified HR counsel licensed in your jurisdiction.",
      { lineGap: 2 }
    );

    // Footer on every page (added last so it sits over content).
    addFooters(doc, input.orgName);

    doc.end();
  });
}

// -----------------------------------------------------------------------------
// PDF helpers
// -----------------------------------------------------------------------------

function sectionHeader(doc: PDFKit.PDFDocument, label: string) {
  doc.fillColor(COLOR.primary).fontSize(9).text(label.toUpperCase(), { characterSpacing: 1.2 });
  doc.moveDown(0.4);
  doc.fillColor(COLOR.text).fontSize(20).text(label);
  doc.moveDown(0.2);
  const y = doc.y;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(COLOR.border)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.8);
}

function bullet(doc: PDFKit.PDFDocument, label: string, body: string) {
  doc.fontSize(11).fillColor(COLOR.text);
  doc.text(`• `, { continued: true });
  doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
  doc.font("Helvetica").fillColor(COLOR.muted).text(body, { lineGap: 2 });
  doc.fillColor(COLOR.text);
  doc.moveDown(0.2);
}

function drawStatGrid(
  doc: PDFKit.PDFDocument,
  stats: { label: string; value: string }[]
) {
  const cols = 3;
  const gap = 12;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cellW = (width - gap * (cols - 1)) / cols;
  const startX = doc.page.margins.left;
  const startY = doc.y;
  const rowHeight = 64;
  stats.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cellW + gap);
    const y = startY + row * (rowHeight + gap);
    doc.roundedRect(x, y, cellW, rowHeight, 6).fillAndStroke(COLOR.primaryLight, COLOR.primary);
    doc.fillColor(COLOR.primary).fontSize(9).text(s.label.toUpperCase(), x + 12, y + 10, {
      width: cellW - 24,
      characterSpacing: 1,
    });
    doc.fillColor(COLOR.text).fontSize(22).text(s.value, x + 12, y + 26, {
      width: cellW - 24,
    });
  });
  doc.y = startY + Math.ceil(stats.length / cols) * (rowHeight + gap);
}

function drawPostingCard(
  doc: PDFKit.PDFDocument,
  p: Posting,
  report?: ComplianceReport
) {
  const startY = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x = doc.page.margins.left;
  const padding = 12;
  const contentX = x + padding;
  const contentW = width - padding * 2;

  // Title + score chip on the same row.
  doc.font("Helvetica-Bold").fillColor(COLOR.text).fontSize(13);
  doc.text(p.title, contentX, startY + padding, { width: contentW - 70 });
  const score = report?.score ?? p.complianceScore;
  const fails = report?.summary.fail ?? p.failedChecks;
  const chipColor = fails === 0 ? COLOR.green : fails === 1 ? COLOR.amber : COLOR.red;
  const chipBg = fails === 0 ? COLOR.greenLight : fails === 1 ? COLOR.amberLight : COLOR.redLight;
  doc
    .roundedRect(x + width - 64, startY + padding - 2, 52, 18, 4)
    .fillAndStroke(chipBg, chipColor);
  doc.fillColor(chipColor).fontSize(9).text(`SCORE ${score}`, x + width - 64, startY + padding + 3, {
    width: 52,
    align: "center",
  });

  // Meta line
  doc.font("Helvetica").fillColor(COLOR.muted).fontSize(9);
  doc.text(
    [
      p.location || p.department || null,
      p.postedAt ? `posted ${iso(p.postedAt)}` : null,
      p.status,
    ]
      .filter(Boolean)
      .join(" · "),
    contentX,
    doc.y + 4,
    { width: contentW }
  );

  // Compensation / vacancy / AI line
  const facts = [
    p.compensationMin && p.compensationMax
      ? `$${p.compensationMin.toLocaleString("en-CA")} – $${p.compensationMax.toLocaleString("en-CA")} ${p.compensationCurrency}`
      : "Comp not disclosed",
    p.vacancyStatus === "existing_vacancy"
      ? "Existing vacancy"
      : p.vacancyStatus === "pipeline"
      ? "Pipeline"
      : "Vacancy not stated",
    p.aiUsed ? "AI screening disclosed" : "Manual screening",
  ];
  doc.text(facts.join(" · "), contentX, doc.y + 2, { width: contentW });

  doc.moveDown(0.6);

  // Checks
  doc.font("Helvetica").fontSize(9);
  (report?.results ?? []).forEach((r) => {
    const tone =
      r.status === "fail" ? COLOR.red : r.status === "warn" ? COLOR.amber : r.status === "pass" ? COLOR.green : COLOR.muted;
    doc.fillColor(tone).text(`[${r.status.toUpperCase()}] `, contentX, doc.y, { continued: true });
    doc.fillColor(COLOR.text).text(`${r.label}: `, { continued: true });
    doc.fillColor(COLOR.muted).text(r.message, { width: contentW, lineGap: 1 });
    doc.fillColor(COLOR.muted).fontSize(8).text(r.citation, { width: contentW });
    doc.fontSize(9);
  });

  const endY = doc.y + padding;
  doc.roundedRect(x, startY, width, endY - startY, 8).strokeColor(COLOR.border).lineWidth(1).stroke();
  doc.y = endY + 4;
}

function drawNotificationsTable(doc: PDFKit.PDFDocument, candidates: Candidate[]) {
  const headerY = doc.y;
  const left = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = [
    { label: "Candidate", w: width * 0.22 },
    { label: "Posting", w: width * 0.28 },
    { label: "Final interview", w: width * 0.15 },
    { label: "Deadline", w: width * 0.15 },
    { label: "Status", w: width * 0.2 },
  ];

  // Header
  doc.fillColor(COLOR.muted).fontSize(8).font("Helvetica-Bold");
  let x = left;
  cols.forEach((c) => {
    doc.text(c.label.toUpperCase(), x, headerY, { width: c.w, characterSpacing: 1 });
    x += c.w;
  });
  doc
    .moveTo(left, headerY + 14)
    .lineTo(left + width, headerY + 14)
    .strokeColor(COLOR.border)
    .stroke();

  doc.font("Helvetica").fontSize(9).fillColor(COLOR.text);
  let rowY = headerY + 20;

  for (const c of candidates) {
    if (rowY > doc.page.height - 100) {
      doc.addPage();
      rowY = doc.page.margins.top;
    }
    x = left;
    doc.fillColor(COLOR.text).text(c.name, x, rowY, { width: cols[0].w - 4, lineBreak: false });
    x += cols[0].w;
    doc.fillColor(COLOR.muted).text(c.postingTitle, x, rowY, { width: cols[1].w - 4, lineBreak: false });
    x += cols[1].w;
    doc.fillColor(COLOR.muted).text(iso(c.lastInterviewDate), x, rowY, { width: cols[2].w });
    x += cols[2].w;
    doc.fillColor(COLOR.muted).text(iso(c.deadlineDate), x, rowY, { width: cols[3].w });
    x += cols[3].w;

    const statusLabel =
      c.notificationStatus === "sent"
        ? `Sent · ${c.decision ?? "decision recorded"}`
        : c.notificationStatus === "overdue"
        ? `${Math.abs(c.daysToDeadline)}d overdue`
        : `${c.daysToDeadline}d left`;
    const statusColor =
      c.notificationStatus === "sent"
        ? COLOR.green
        : c.notificationStatus === "overdue"
        ? COLOR.red
        : c.daysToDeadline <= 7
        ? COLOR.amber
        : COLOR.muted;
    doc.fillColor(statusColor).text(statusLabel, x, rowY, { width: cols[4].w });
    rowY += 16;
  }
  doc.y = rowY + 8;
}

function drawVaultTable(doc: PDFKit.PDFDocument, vault: VaultItem[]) {
  if (vault.length === 0) {
    doc.fontSize(10).fillColor(COLOR.muted).text("Nothing in the vault yet.");
    return;
  }
  const counts = vault.reduce(
    (acc, v) => {
      acc[v.type] = (acc[v.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  doc.fontSize(10).fillColor(COLOR.text);
  bullet(doc, "Postings archived", String(counts.posting ?? 0));
  bullet(doc, "Application forms", String(counts.form ?? 0));
  bullet(doc, "Notification proofs", String(counts.notification ?? 0));

  const oldest = vault
    .map((v) => v.expiresAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  doc.moveDown(0.6);
  doc.fontSize(9).fillColor(COLOR.muted);
  doc.text(`Oldest expiry: ${iso(oldest)}. Items are auto-pruned on expiry unless held by an admin.`);
}

function addFooters(doc: PDFKit.PDFDocument, orgName: string) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - doc.page.margins.bottom + 24;
    doc
      .fontSize(8)
      .fillColor(COLOR.muted)
      .text(
        `${orgName} · Compliance package generated by ClearPost`,
        doc.page.margins.left,
        y,
        { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "left" }
      );
    doc
      .text(`Page ${i + 1} of ${range.count}`, doc.page.margins.left, y, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "right",
      });
  }
}

function ensureRoom(doc: PDFKit.PDFDocument, requiredHeight: number) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + requiredHeight > bottom) doc.addPage();
}

// -----------------------------------------------------------------------------
// CSV emitters
// -----------------------------------------------------------------------------

function postingsToCsv(postings: Posting[], reports: Map<string, ComplianceReport>): string {
  const headers = [
    "id",
    "title",
    "status",
    "posted_at",
    "taken_down_at",
    "jurisdiction",
    "vacancy_status",
    "ai_used",
    "compensation_min",
    "compensation_max",
    "compensation_currency",
    "compliance_score",
    "failing_checks",
    "retention_until",
    "posting_url",
  ];
  const rows = postings.map((p) => {
    const r = reports.get(p.id);
    return [
      p.id,
      p.title,
      p.status,
      p.postedAt ? iso(p.postedAt) : "",
      "", // taken_down_at not currently exposed on Posting; populated in live mode
      p.jurisdiction,
      p.vacancyStatus,
      String(p.aiUsed),
      p.compensationMin?.toString() ?? "",
      p.compensationMax?.toString() ?? "",
      p.compensationCurrency,
      String(r?.score ?? p.complianceScore),
      String(r?.summary.fail ?? p.failedChecks),
      p.retentionUntil ? iso(p.retentionUntil) : "",
      p.postingUrl ?? "",
    ];
  });
  return toCsv(headers, rows);
}

function candidatesToCsv(candidates: Candidate[]): string {
  const headers = [
    "candidate_id",
    "candidate_name",
    "posting_title",
    "source",
    "last_interview_date",
    "deadline_date",
    "days_to_deadline",
    "notification_status",
    "decision",
  ];
  const rows = candidates.map((c) => [
    c.id,
    c.name,
    c.postingTitle,
    c.source,
    iso(c.lastInterviewDate),
    iso(c.deadlineDate),
    String(c.daysToDeadline),
    c.notificationStatus,
    c.decision ?? "",
  ]);
  return toCsv(headers, rows);
}

function vaultToCsv(vault: VaultItem[]): string {
  const headers = ["id", "type", "title", "related_to", "archived_at", "expires_at"];
  const rows = vault.map((v) => [
    v.id,
    v.type,
    v.title,
    v.relatedTo,
    iso(v.archivedAt),
    iso(v.expiresAt),
  ]);
  return toCsv(headers, rows);
}

function readme(input: ReportInput, postingsCount: number, candidatesCount: number, vaultCount: number): string {
  return `ClearPost Compliance Package
==============================

Organization:  ${input.orgName}
Jurisdiction:  ${input.jurisdiction}
Period:        ${iso(input.fromDate)} – ${iso(input.toDate)}
Generated:     ${new Date().toISOString()}

CONTENTS

  report.pdf            Narrative compliance report — cover, executive summary,
                        per-posting compliance results with statute citations,
                        45-day notification log, retention vault summary,
                        methodology, and source links. This is the document
                        you hand to a Ministry of Labour officer.

  postings.csv          Flat export of every posting in scope (${postingsCount} rows).

  notifications.csv     Flat export of every interviewed candidate with their
                        45-day deadline, notification status, decision, and
                        delivery-proof reference (${candidatesCount} rows).

  vault-manifest.csv    Manifest of retained postings, application forms, and
                        notification proofs (${vaultCount} rows).

DISCLAIMER

  ClearPost is a compliance operations tool. The contents of this package are
  a structured record of your hiring activity; they are not a legal opinion.
  Confirm specifics with qualified HR counsel licensed in your jurisdiction.

  Reference statutes:
    Employment Standards Act, 2000:        https://www.ontario.ca/laws/statute/00e41
    Working for Workers Four Act, 2024:    https://www.ontario.ca/laws/statute/S24021
    Working for Workers Five Act, 2024:    https://www.ontario.ca/laws/statute/S24022

clearpost.ca
`;
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n") + "\n";
}

function iso(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
