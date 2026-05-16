import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, FileText, Mail, ClipboardList } from "lucide-react";
import { demoVaultItems } from "@/lib/demo/data";

export const metadata = { title: "Retention vault" };

const ICON = {
  posting: ClipboardList,
  form: FileText,
  notification: Mail,
} as const;

export default function VaultPage() {
  return (
    <AppShell
      active="/app/vault"
      pageTitle="Retention vault"
      pageDescription="3-year archive of postings, application forms, and notification proofs. Items auto-prune on expiry unless held by an admin."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total items" value={String(demoVaultItems.length)} />
        <Stat
          label="Oldest expiry"
          value={
            demoVaultItems
              .map((v) => v.expiresAt)
              .sort((a, b) => a.getTime() - b.getTime())[0]
              ?.toLocaleDateString("en-CA") ?? "—"
          }
        />
        <Stat label="Auto-archive" value="Enabled" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Archived items</CardTitle>
          <CardDescription>
            Searchable by year, posting, candidate, or jurisdiction.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/60">
            {demoVaultItems.map((item) => {
              const Icon = ICON[item.type];
              const daysToExpiry = Math.ceil(
                (item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Archived {item.archivedAt.toLocaleDateString("en-CA")} · expires{" "}
                        {item.expiresAt.toLocaleDateString("en-CA")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="muted">
                    <Archive className="mr-1 h-3 w-3" />
                    {Math.round(daysToExpiry / 30)} mo left
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
