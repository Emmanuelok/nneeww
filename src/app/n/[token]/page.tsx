import Link from "next/link";
import { Leaf, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// The candidate-facing notification landing page. Visited by candidates via a
// signed link in the decision email. In v1 we render a static (un-tokenized)
// preview that demonstrates the experience; in v1.1 the token resolves to a
// candidate_notifications row and triggers a delivery_proof_url write-back.
export const metadata = { title: "Hiring decision update" };

export default async function CandidateNotificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Deterministic sample candidate / posting derived from the token so the
  // preview at /n/anything renders cleanly.
  const sample = {
    candidate: "Jadesola Okafor",
    company: "Acme Manufacturing Ltd.",
    role: "Sales Manager — GTA",
    interviewDate: "April 9, 2026",
    decision: "we have decided to move forward with another candidate",
    senderName: "Sara Chen",
    senderTitle: "Head of People",
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border/60 bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-3.5 w-3.5" />
            </span>
            {sample.company}
          </div>
          <span className="text-xs text-muted-foreground">Delivered via ClearPost</span>
        </div>
      </header>

      <main className="container max-w-2xl py-14">
        <Card>
          <CardHeader className="border-b border-border/60">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Delivery confirmed
            </div>
            <CardTitle className="mt-3 text-2xl">Hiring decision update</CardTitle>
            <CardDescription>From {sample.company}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6 text-[15px] leading-relaxed">
            <p>Hello {sample.candidate.split(" ")[0]},</p>
            <p>
              Thank you for taking the time to interview with us for the <strong>{sample.role}</strong> role on{" "}
              {sample.interviewDate}. We wanted to follow up to let you know that {sample.decision}.
            </p>
            <p>
              We sincerely appreciated the chance to meet you and learn about your background. We'll keep your
              information on file and reach out if a role that fits your experience opens up.
            </p>
            <p>
              Best regards,
              <br />
              {sample.senderName}
              <br />
              {sample.senderTitle}, {sample.company}
            </p>
            <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
              This notification was sent in accordance with the 45-day candidate notification requirement under
              Ontario's Employment Standards Act, as amended by the Working for Workers Four Act, 2024. Delivery
              of this message has been logged for our records. If you have questions, please reply to the email
              this link arrived in.
              <div className="mt-2 font-mono text-[11px] text-muted-foreground/70">
                Notification token: {token}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sent by {sample.company} via{" "}
          <Link href="/" className="hover:text-foreground underline-offset-2">
            ClearPost
          </Link>{" "}
          — Canadian hiring compliance.
        </p>
      </main>
    </div>
  );
}
