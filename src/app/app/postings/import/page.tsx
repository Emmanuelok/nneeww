import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { CsvImporter } from "@/components/app/csv-importer";
import { Button } from "@/components/ui/button";
import { getSchema } from "@/lib/csv/schema";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Import postings" };

export default function ImportPostingsPage() {
  const schema = getSchema("postings");
  return (
    <AppShell
      active="/app/postings"
      pageTitle="Import postings"
      pageDescription="Bring your active and historical postings in via CSV. Each one runs through the compliance checker on save."
      actions={
        <Button asChild variant="outline">
          <Link href="/app/postings">
            <ArrowLeft className="h-4 w-4" /> All postings
          </Link>
        </Button>
      }
    >
      <CsvImporter schema={schema} />
    </AppShell>
  );
}
