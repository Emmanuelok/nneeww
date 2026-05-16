export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-semibold tracking-tight">Security posture</h1>
      <p className="text-muted-foreground">
        ClearPost holds employment records. The bar for protecting them is high. Here's how we approach it.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Data residency</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Postgres and file storage hosted in Supabase's <strong>ca-central-1 (Montréal)</strong> region.</li>
        <li>Application served from Vercel's Canadian edge.</li>
        <li>No data egress to US datacentres for production workloads.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Encryption</h2>
      <p>
        TLS 1.2+ for all in-transit traffic. AES-256 at rest on Supabase managed storage. Candidate email
        addresses are stored as one-way hashes in non-essential tables; cleartext copies in the primary{" "}
        <code>candidates</code> table sit behind stricter access controls.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Access control</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Multi-tenant isolation enforced by Supabase Row-Level Security on every table.</li>
        <li>Authentication via Supabase Auth — email/password with strong hashing, Google OAuth.</li>
        <li>Role-based access: owner, admin, recruiter.</li>
        <li>Audit log captures every state-changing action.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Operational practices</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Production access limited to on-call engineers; access is logged.</li>
        <li>Daily Postgres backups retained 14 days.</li>
        <li>Dependency updates tracked; security advisories triaged within one business day.</li>
        <li>Sentry error monitoring with PII scrubbing.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Compliance</h2>
      <p>
        PIPEDA-aware from day one. Law 25 readiness in progress for our Quebec launch, including privacy-officer
        designation and a Privacy Impact Assessment template. SOC 2 Type I targeted for late 2026. A DPA template
        is available on request — email{" "}
        <a href="mailto:security@clearpost.ca" className="text-primary underline">security@clearpost.ca</a>.
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        Disclose a vulnerability:{" "}
        <a href="mailto:security@clearpost.ca" className="text-primary underline">security@clearpost.ca</a>. We
        respond within one business day.
      </p>
    </div>
  );
}
