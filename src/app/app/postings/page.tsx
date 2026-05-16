import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { demoPostings } from "@/lib/demo/data";
import { Plus, ExternalLink } from "lucide-react";

export const metadata = { title: "Postings" };

export default function PostingsPage() {
  const live = demoPostings.filter((p) => p.status === "live");
  const archived = demoPostings.filter((p) => p.status !== "live");

  return (
    <AppShell
      active="/app/postings"
      pageTitle="Postings"
      pageDescription="Run each posting through the compliance checker. Live items appear in your retention vault when taken down."
      actions={
        <Button asChild>
          <Link href="/app/postings/new">
            <Plus className="h-4 w-4" /> New posting check
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Live postings ({live.length})</CardTitle>
          <CardDescription>
            Updated automatically when you re-run the compliance checker.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-y border-border/60 bg-secondary/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Pay range</th>
                <th className="px-4 py-3 text-left font-medium">Compliance</th>
                <th className="px-4 py-3 text-right font-medium">Posted</th>
              </tr>
            </thead>
            <tbody>
              {live.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <Link href={`/app/postings/${p.id}`} className="font-medium hover:text-primary">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.department}</div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{p.location}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {p.compensationMin && p.compensationMax
                      ? `$${(p.compensationMin / 1000).toFixed(0)}k–$${(p.compensationMax / 1000).toFixed(0)}k`
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBadge score={p.complianceScore} failedChecks={p.failedChecks} />
                  </td>
                  <td className="px-4 py-4 text-right text-muted-foreground">
                    {p.postedAt.toLocaleDateString("en-CA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {archived.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Taken down / archived ({archived.length})</CardTitle>
            <CardDescription>Retained for 3 years from takedown.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {archived.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-6 py-3.5">
                  <div className="min-w-0">
                    <Link href={`/app/postings/${p.id}`} className="font-medium hover:text-primary">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.location} · Retained until {p.retentionUntil?.toLocaleDateString("en-CA")}
                    </div>
                  </div>
                  <a
                    href={p.postingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Original posting <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function ScoreBadge({ score, failedChecks }: { score: number; failedChecks: number }) {
  if (failedChecks === 0) {
    return <Badge variant="success">Compliant · {score}</Badge>;
  }
  if (score >= 60) {
    return <Badge variant="warning">{failedChecks} to fix · {score}</Badge>;
  }
  return <Badge variant="danger">{failedChecks} failing · {score}</Badge>;
}
