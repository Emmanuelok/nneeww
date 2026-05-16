export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="text-muted-foreground">
        This notice describes how ClearPost Compliance Inc. handles personal information. It is a plain-English
        summary, not a legal contract.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What we collect</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Account information you provide (name, work email, organization details).</li>
        <li>Job postings, application forms, and candidate records you upload or enter.</li>
        <li>Product analytics (PostHog) and error telemetry (Sentry), stripped of PII where possible.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Where it lives</h2>
      <p>
        Database and file storage are hosted in Supabase's <strong>ca-central-1 (Montréal)</strong> region. The
        application is served from Vercel's Canadian edge. Candidate email addresses are stored as one-way hashes
        in non-essential tables; cleartext copies live only in the primary <code>candidates</code> table, which has
        stricter access controls.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Who can see it</h2>
      <p>
        Access to your organization's data is restricted to members of your organization. All queries are scoped
        by <code>org_id</code> through Supabase Row-Level Security. ClearPost staff access is limited to
        engineers troubleshooting incidents, and audited.
      </p>

      <h2 className="mt-8 text-xl font-semibold">How long we keep it</h2>
      <p>
        Records subject to a regulatory retention period (postings, application forms, notifications) are held
        for the duration required by the applicable jurisdiction — three years from posting takedown in Ontario.
        Other records are deleted within 30 days of organization deletion.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Your rights</h2>
      <p>
        You may request access, correction, or deletion of your personal information by emailing{" "}
        <a href="mailto:privacy@clearpost.ca" className="text-primary underline">privacy@clearpost.ca</a>. For
        Quebec-resident users, requests under Law 25 will be handled by our privacy officer (designation effective
        with Quebec launch).
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        ClearPost is a compliance operations tool. Nothing on this page constitutes legal advice.
      </p>
    </div>
  );
}
