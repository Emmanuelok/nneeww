import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Plus } from "lucide-react";
import { demoCandidates } from "@/lib/demo/data";

export const metadata = { title: "Candidates" };

export default function CandidatesPage() {
  return (
    <AppShell
      active="/app/candidates"
      pageTitle="Candidates"
      pageDescription="Every interviewed candidate, with their 45-day notification deadline."
      actions={
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4" /> Log interview
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>All candidates ({demoCandidates.length})</CardTitle>
          <CardDescription>
            Pull these from your ATS via the CSV template (v1). Direct integrations on the roadmap.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y border-border/60 bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Candidate</th>
                <th className="px-4 py-3 text-left font-medium">Posting</th>
                <th className="px-4 py-3 text-left font-medium">Final interview</th>
                <th className="px-4 py-3 text-left font-medium">Deadline</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {demoCandidates
                .slice()
                .sort((a, b) => a.daysToDeadline - b.daysToDeadline)
                .map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                    <td className="px-6 py-4 font-medium">{c.name}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <Link href={`/app/postings/${c.postingId}`} className="hover:text-primary">
                        {c.postingTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {c.lastInterviewDate.toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {c.deadlineDate.toLocaleDateString("en-CA")}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {c.notificationStatus === "sent" ? (
                        <Badge variant="success">Notified</Badge>
                      ) : c.daysToDeadline < 0 ? (
                        <Badge variant="danger">{Math.abs(c.daysToDeadline)}d overdue</Badge>
                      ) : (
                        <Badge variant={c.daysToDeadline <= 5 ? "danger" : c.daysToDeadline <= 15 ? "warning" : "muted"}>
                          {c.daysToDeadline}d left
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
