const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Who needs to comply with these rules?",
    a: (
      <>
        Ontario employers with{" "}
        <span className="font-medium text-foreground">25 or more employees</span>. The obligations
        attach to public job postings, application forms, and the people you actually interview.
        Federally regulated employers (banks, telecoms, inter-provincial transport) have a separate
        regime under the Canada Labour Code — ClearPost adds that coverage on the Team plan.
      </>
    ),
  },
  {
    q: "When did the rules take effect?",
    a: (
      <>
        The pay transparency, AI disclosure, vacancy disclosure, and 45-day candidate notification
        provisions of the{" "}
        <span className="font-medium text-foreground">Working for Workers Four Act, 2024</span>{" "}
        came into force on{" "}
        <span className="font-medium text-foreground">January 1, 2026</span>. The Working for
        Workers Five and Seven Acts layered on additional posting-related obligations.
      </>
    ),
  },
  {
    q: "What are the penalties if I get it wrong?",
    a: (
      <>
        Maximum administrative monetary penalties under the Employment Standards Act were doubled
        in the 2026 amendments. A pattern of non-compliance — say, dozens of postings without a
        pay range — can expose an employer to{" "}
        <span className="font-medium text-foreground">six-figure totals</span> plus reputational
        risk on public posting platforms. Most enforcement begins with a candidate complaint to the
        Ministry of Labour.
      </>
    ),
  },
  {
    q: "Is ClearPost legal advice?",
    a: (
      <>
        <span className="font-medium text-foreground">No.</span> ClearPost is a compliance
        operations tool. We surface obligations, deadlines, and statute citations so that you and
        your counsel can make decisions quickly. Every regulatory output ends with a clear
        reminder to confirm with HR counsel. If you don't have counsel, we can introduce you to
        Ontario employment lawyers who work with SMBs.
      </>
    ),
  },
  {
    q: "Where is the data stored?",
    a: (
      <>
        Postgres and file storage are hosted in Supabase's{" "}
        <span className="font-medium text-foreground">ca-central-1 region (Montréal)</span>. The
        application runs on Vercel's Canadian edge. Candidate emails are hashed where possible.
        We're PIPEDA-aware today and on the path to Law 25 readiness for our Quebec launch.
      </>
    ),
  },
  {
    q: "Do I have to throw out my ATS?",
    a: (
      <>
        No. ClearPost is built to sit beside BambooHR, Workable, Greenhouse, Rippling, Humi, ADP,
        Ceridian Dayforce, or just Indeed + a spreadsheet. In v1, you import candidates and
        interviews via CSV. Direct ATS integrations are on the roadmap based on customer demand.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border/60">
      <div className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Common questions</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            What HR leaders ask us first.
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-border/60 rounded-2xl border border-border bg-background">
          {FAQS.map((item, i) => (
            <details key={i} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-start justify-between gap-6 text-base font-medium">
                <span>{item.q}</span>
                <span className="mt-1 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
