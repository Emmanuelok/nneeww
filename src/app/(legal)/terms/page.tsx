export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of service</h1>
      <p className="text-muted-foreground">
        This is a plain-English summary of how ClearPost is licensed. The signed Master Services Agreement governs
        any conflict.
      </p>

      <h2 className="mt-8 text-xl font-semibold">What ClearPost is</h2>
      <p>
        ClearPost is a hosted compliance operations tool. We surface obligations, deadlines, and statute
        citations to help your team meet Canadian employment-standards requirements. We are not a law firm, and
        nothing in the product or output is legal advice. Confirm specifics with qualified HR counsel.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Acceptable use</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Use ClearPost only for postings, candidates, and records related to lawful hiring.</li>
        <li>Don't upload personal information you don't have a lawful basis to process.</li>
        <li>Don't attempt to reverse-engineer, resell, or sublicense the service.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Subscriptions & billing</h2>
      <p>
        Plans are billed in Canadian dollars via Stripe. GST/HST is applied at checkout. The 14-day trial does
        not require a credit card. After trial conversion, plans renew monthly or annually depending on the cycle
        you select. You may downgrade or cancel at any time through the customer portal.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Data ownership</h2>
      <p>
        Your data is yours. We never sell it. We process it solely to provide the service. On termination, we
        export your data on request and delete it within 30 days, subject to records held under a regulatory
        retention obligation.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Limitation of liability</h2>
      <p>
        ClearPost is provided "as is." Our aggregate liability is limited to the fees paid in the 12 months
        preceding the claim. We expressly disclaim liability for regulatory outcomes (penalties, complaints,
        adverse rulings) — those depend on facts and decisions outside our control.
      </p>

      <p className="mt-10 text-xs text-muted-foreground">
        Nothing on this page constitutes legal advice. Email{" "}
        <a href="mailto:legal@clearpost.ca" className="text-primary underline">legal@clearpost.ca</a> for the full
        MSA.
      </p>
    </div>
  );
}
