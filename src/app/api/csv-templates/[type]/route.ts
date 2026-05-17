import { NextResponse } from "next/server";
import { getSchema, buildTemplateCsv, type CsvImportType } from "@/lib/csv/schema";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  if (type !== "postings" && type !== "candidates") {
    return NextResponse.json({ error: "unknown template" }, { status: 404 });
  }
  const schema = getSchema(type as CsvImportType);
  const csv = buildTemplateCsv(schema);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clearpost-${type}-template.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
