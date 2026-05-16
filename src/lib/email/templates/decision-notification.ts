/**
 * Decision notification email — the email a candidate receives in response to
 * the 45-day ESA s. 8.5 requirement. Renders email-client-safe HTML inline
 * (no React Email dep) plus a plain-text alternative.
 *
 * Includes a unique view-confirmation link so the candidate's open is logged
 * as a "delivered + opened" event, which becomes the delivery_proof_url that
 * an ESA officer can be shown.
 */

import { notificationLink } from "../resend";

export type DecisionEmailInput = {
  candidateName: string;
  postingTitle: string;
  orgName: string;
  senderName: string;
  senderTitle: string;
  decision: "made" | "not_made" | "no_hire";
  body: string;
  token: string;
};

const DECISION_PHRASE: Record<DecisionEmailInput["decision"], string> = {
  made: "we have made an offer to another candidate for this role",
  no_hire: "we have decided to move forward with another candidate",
  not_made: "we have not yet finalized our hiring decision for this role",
};

export function renderDecisionEmail(input: DecisionEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = input.candidateName.split(/\s+/)[0];
  const phrase = DECISION_PHRASE[input.decision];
  const link = notificationLink(input.token);

  const subject = `Hiring decision update — ${input.postingTitle} at ${input.orgName}`;

  // Trim trailing whitespace and normalize newlines for the plain-text branch.
  const bodyPlain = (input.body || "").replace(/\r\n/g, "\n").trim();
  const bodyHtml = bodyPlain
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px 0;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const text = `Hello ${firstName},

${bodyPlain || `Thank you for taking the time to interview with us for the ${input.postingTitle} role. We wanted to follow up to let you know that ${phrase}.`}

To confirm receipt of this notification, you can view it in your browser:
${link}

Best regards,
${input.senderName}
${input.senderTitle}, ${input.orgName}

—
Sent in accordance with the 45-day candidate notification requirement under
Ontario's Employment Standards Act (s. 8.5), as amended by the Working for
Workers Four Act, 2024. Delivered via ClearPost.`;

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
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;">
              <span style="display:inline-block;vertical-align:middle;width:24px;height:24px;background:#0f766e;border-radius:6px;text-align:center;line-height:24px;color:#fff;font-weight:600;margin-right:8px;">A</span>
              <strong style="color:#18181b;">${escapeHtml(input.orgName)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px 0;font-size:14px;color:#0f766e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Hiring decision update</p>
              <p style="margin:0 0 16px 0;font-size:16px;">Hello ${escapeHtml(firstName)},</p>
              ${bodyHtml || `<p style="margin:0 0 16px 0;font-size:16px;">Thank you for taking the time to interview with us for the <strong>${escapeHtml(input.postingTitle)}</strong> role. We wanted to follow up to let you know that ${escapeHtml(phrase)}.</p>`}
              <p style="margin:24px 0;text-align:center;">
                <a href="${link}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">View this notification</a>
              </p>
              <p style="margin:24px 0 0 0;font-size:16px;">
                Best regards,<br>
                ${escapeHtml(input.senderName)}<br>
                <span style="color:#71717a;">${escapeHtml(input.senderTitle)}, ${escapeHtml(input.orgName)}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a;">
              Sent in accordance with the 45-day candidate notification requirement under Ontario's
              Employment Standards Act (s. 8.5), as amended by the Working for Workers Four Act, 2024.
              Delivered via <a href="${escapeHtml(process.env.NEXT_PUBLIC_APP_URL || "https://clearpost.ca")}" style="color:#0f766e;text-decoration:none;">ClearPost</a>.
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#a1a1aa;">
          You are receiving this email because you interviewed for a role at ${escapeHtml(input.orgName)}.
        </p>
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
