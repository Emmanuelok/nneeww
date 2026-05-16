import { Resend } from "resend";

let _resend: Resend | undefined;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "people@clearpost.ca";
export const FROM_NAME = process.env.RESEND_FROM_NAME || "ClearPost People Team";

export function notificationLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/n/${token}`;
}
