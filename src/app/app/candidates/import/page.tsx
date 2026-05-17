import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { CsvImporter } from "@/components/app/csv-importer";
import { Button } from "@/components/ui/button";
import { getSchema } from "@/lib/csv/schema";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Import candidates" };

export default function ImportCandidatesPage() {
  const schema = getSchema("candidates");
  return (
    <AppShell
      active="/app/candidates"
      pageTitle="Import candidates"
      pageDescription="Bring your interviewed candidates in via CSV. Each one starts a 45-day notification deadline counted from the final-interview date."
      actions={
        <Button asChild variant="outline">
          <Link href="/app/candidates">
            <ArrowLeft className="h-4 w-4" /> All candidates
          </Link>
        </Button>
      }
    >
      <CsvImporter schema={schema} />
    </AppShell>
  );
}
