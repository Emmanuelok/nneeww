import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/lib/auth/actions";
import { ExternalLink, Mail } from "lucide-react";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell
      active="/app/settings"
      pageTitle="Settings"
      pageDescription="Organization, members, billing, and jurisdiction preferences."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Visible to your team and on audit-report headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Legal name</Label>
                <Input id="orgName" defaultValue="Acme Manufacturing Ltd." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgProvince">Primary province</Label>
                <Input id="orgProvince" defaultValue="Ontario" readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgSize">Employee count bucket</Label>
                <Input id="orgSize" defaultValue="100–249" readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgRecruiter">Sender email (Resend)</Label>
                <Input id="orgRecruiter" defaultValue="people@acme.ca" />
              </div>
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan & billing</CardTitle>
            <CardDescription>Stripe (CAD) — GST/HST applied at checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Team plan</div>
                  <div className="text-xs text-muted-foreground">$179 CAD / month</div>
                </div>
                <Badge variant="success">Trial · 11 days left</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Manage billing <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Invite recruiters, HR coordinators, and admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {[
              { name: "You (Owner)", email: "you@acme.ca", role: "owner" },
              { name: "Sara Chen", email: "sara.chen@acme.ca", role: "admin" },
              { name: "Devon Walsh", email: "devon.walsh@acme.ca", role: "recruiter" },
            ].map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "muted"}>{m.role}</Badge>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex gap-2">
            <Input placeholder="invite@example.ca" />
            <Button variant="outline">
              <Mail className="h-4 w-4" /> Send invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" variant="outline">Sign out</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
