/**
 * Daily deadline digest email — sent each morning at 09:00 ET to each
 * organization's owner + admin members. Lists candidates whose 45-day
 * notification deadline is overdue or falls within the next 7 days,
 * with a one-click link into the 45-day inbox.
 */

import type { Candidate } from "@/lib/repositories/candidates";

export type DigestEmailInput = {
  orgName: string;
  recipientFirstName: string;
  overdue: Candidate[];
  dueSoon: Candidate[];
  inboxUrl: string;
  generatedDate: string; // ISO date (YYYY-MM-DD)
};

export function renderDigestEmail(input: DigestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const totalActionable = input.overdue.length + input.dueSoon.length;
  const subject =
    input.overdue.length > 0
      ? `${input.overdue.length} overdue 45-day notification${input.overdue.length === 1 ? "" : "s"} · ${input.orgName}`
      : `${input.dueSoon.length} candidate${input.dueSoon.length === 1 ? "" : "s"} approaching the 45-day deadline · ${input.orgName}`;

  const overdueRowsHtml = input.overdue
    .map(
      (c) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #fee2e2;">
            <div style="font-weight:600;color:#991b1b;">${escapeHtml(c.name)}</div>
            <div style="font-size:12px;color:#7f1d1d;">${escapeHtml(c.postingTitle)} · final interview ${c.lastInterviewDate.toLocaleDateString("en-CA")}</div>
          </td>
          <td align="right" style="padding:10px 14px;border-bottom:1px solid #fee2e2;color:#991b1b;font-weight:600;">
            ${Math.abs(c.daysToDeadline)}d overdue
          </td>
        </tr>`
    )
    .join("");

  const dueSoonRowsHtml = input.dueSoon
    .map(
      (c) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #fef3c7;">
            <div style="font-weight:600;color:#78350f;">${escapeHtml(c.name)}</div>
            <div style="font-size:12px;color:#92400e;">${escapeHtml(c.postingTitle)} · final interview ${c.lastInterviewDate.toLocaleDateString("en-CA")}</div>
          </td>
          <td align="right" style="padding:10px 14px;border-bottom:1px solid #fef3c7;color:#78350f;font-weight:600;">
            ${c.daysToDeadline}d left
          </td>
        </tr>`
    )
    .join("");

  const overdueTextRows = input.overdue
    .map(
      (c) =>
        `  • ${c.name} — ${c.postingTitle} (${Math.abs(c.daysToDeadline)}d overdue)`
    )
    .join("\n");
  const dueSoonTextRows = input.dueSoon
    .map(
      (c) =>
        `  • ${c.name} — ${c.postingTitle} (${c.daysToDeadline}d left)`
    )
    .join("\n");

  const text = `Hi ${input.recipientFirstName},

Daily 45-day notification digest for ${input.orgName}.

${input.overdue.length > 0
    ? `OVERDUE (${input.overdue.length}):\n${overdueTextRows}\n`
    : ""}${input.dueSoon.length > 0
    ? `DUE WITHIN 7 DAYS (${input.dueSoon.length}):\n${dueSoonTextRows}\n`
    : ""}
Open the 45-day inbox to send decision notifications:
${input.inboxUrl}

—
Sent by ClearPost. The 45-day notification requirement applies under
Ontario's Employment Standards Act s. 8.5. Confirm specifics with HR counsel.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">
              <span style="display:inline-block;vertical-align:middle;width:24px;height:24px;background:#0f766e;border-radius:6px;text-align:center;line-height:24px;color:#fff;font-weight:600;margin-right:8px;">C</span>
              <strong style="color:#18181b;">ClearPost · daily digest</strong>
              <span style="float:right;color:#a1a1aa;font-size:12px;">${input.generatedDate}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:600;color:#0f172a;">
                ${totalActionable} candidate${totalActionable === 1 ? "" : "s"} need a decision notification
              </h1>
              <p style="margin:0 0 24px 0;font-size:14px;color:#52525b;">
                Hi ${escapeHtml(input.recipientFirstName)} — here's the morning brief for <strong>${escapeHtml(input.orgName)}</strong>. The 45-day clock under ESA s. 8.5 keeps ticking whether someone opens the inbox or not.
              </p>

              ${input.overdue.length > 0
                ? `<div style="margin-bottom:24px;">
                    <div style="display:inline-block;background:#fef2f2;color:#991b1b;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:10px;">
                      Overdue · ${input.overdue.length}
                    </div>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #fecaca;border-radius:8px;overflow:hidden;background:#fef2f2;">
                      ${overdueRowsHtml}
                    </table>
                  </div>`
                : ""}

              ${input.dueSoon.length > 0
                ? `<div style="margin-bottom:24px;">
                    <div style="display:inline-block;background:#fffbeb;color:#78350f;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:10px;">
                      Due within 7 days · ${input.dueSoon.length}
                    </div>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #fde68a;border-radius:8px;overflow:hidden;background:#fffbeb;">
                      ${dueSoonRowsHtml}
                    </table>
                  </div>`
                : ""}

              <p style="margin:24px 0;text-align:center;">
                <a href="${input.inboxUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">Open the 45-day inbox</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a;">
              The 45-day candidate notification requirement applies under Ontario's
              Employment Standards Act (s. 8.5), as amended by the Working for Workers Four Act, 2024.
              ClearPost is a compliance operations tool, not legal advice — confirm with HR counsel.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
