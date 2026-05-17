import { NextRequest, NextResponse } from "next/server";
import { getActiveOrg } from "@/lib/auth/context";
import { buildComplianceReport } from "@/lib/reports/compliance-report";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { isDemoMode } from "@/lib/mode";

export const runtime = "nodejs"; // pdfkit needs Node, not Edge
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const org = await getActiveOrg();
  if (!org) {
    return NextResponse.json({ error: "no_active_org" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const fromDate = fromParam ? new Date(fromParam) : yearStart;
  const toDate = toParam ? new Date(toParam) : now;

  const bundle = await buildComplianceReport({
    orgId: org.id,
    orgName: org.name,
    jurisdiction: "ca_on",
    fromDate,
    toDate,
  });

  if (!isDemoMode()) {
    try {
      await db.insert(auditLog).values({
        orgId: org.id,
        action: "report.generated",
        entityType: "organization",
        entityId: org.id,
        payload: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          filename: bundle.filename,
          bytes: bundle.zipBytes.length,
        },
      });
    } catch {
      // Report generation must not fail because of audit-log issues.
    }
  }

  // NextResponse body type narrowing chokes on Node Buffers; wrap in a Blob
  // (universally accepted as BodyInit) so the response streams cleanly.
  const body = new Blob([new Uint8Array(bundle.zipBytes)], { type: "application/zip" });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${bundle.filename}"`,
      "Content-Length": bundle.zipBytes.length.toString(),
      "Cache-Control": "no-store",
    },
  });
}
