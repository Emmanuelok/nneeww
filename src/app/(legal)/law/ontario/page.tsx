import { ExternalLink } from "lucide-react";

export const metadata = { title: "The law — Ontario" };

const obligations = [
  {
    title: "Pay transparency",
    citation: "ESA s. 8.1",
    body: "Every public job posting must disclose expected compensation or a pay range. The range cannot exceed $50,000 in spread. Postings whose upper end exceeds $200,000 are exempt from the disclosure requirement.",
  },
  {
    title: "AI screening disclosure",
    citation: "ESA s. 8.4",
    body: "If artificial intelligence is used to screen, assess, or select applicants, the posting must say so. The definition is broad — algorithmic ranking, automated resume scoring, and most ATS scoring qualify.",
  },
  {
    title: "Vacancy disclosure",
    citation: "ESA s. 8.2",
    body: "Postings must state whether they are for an existing vacancy or a pipeline build (anticipated future opportunities).",
  },
  {
    title: "Prohibition on Canadian-experience requirements",
    citation: "ESA s. 8.3",
    body: "Requiring Canadian work experience in postings or application forms is prohibited. Describe the underlying competency directly.",
  },
  {
    title: "45-day candidate notification",
    citation: "ESA s. 8.5",
    body: "Employers must inform every interviewed candidate whether a hiring decision has been made within 45 days of the candidate's final interview. Applies whether the candidate was hired, was not hired, or the role is paused.",
  },
  {
    title: "Three-year record retention",
    citation: "ESA s. 8.6",
    body: "Postings, application forms, and candidate notification records must be retained for three years after the posting is taken down, and produced on request from a Ministry of Labour officer.",
  },
];

export default function OntarioLawPage() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed">
      <p className="text-xs font-medium uppercase tracking-wide text-primary">The law · Ontario</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Ontario's hiring obligations under the Working for Workers Acts
      </h1>
      <p className="text-muted-foreground">
        Effective <strong>January 1, 2026</strong>. Apply to Ontario employers with 25 or more employees. The Working
        for Workers Four, Five, and Seven Acts amended the Employment Standards Act, 2000 to add the obligations
        below.
      </p>

      <div className="space-y-6 pt-2">
        {obligations.map((o) => (
          <div key={o.title} className="rounded-lg border border-border bg-secondary/30 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">{o.title}</h2>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{o.citation}</span>
            </div>
            <p className="mt-2 text-muted-foreground">{o.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Penalties</h2>
      <p>
        Maximum administrative monetary penalties under the ESA were doubled in the 2026 amendments. A pattern of
        non-compliance — for example, dozens of postings without a pay range — can expose an employer to
        six-figure totals plus reputational risk on public posting platforms. Most enforcement begins with a
        candidate complaint to the Ministry of Labour.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Source materials</h2>
      <ul className="space-y-1.5">
        <li>
          <a
            href="https://www.ontario.ca/laws/statute/00e41"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Employment Standards Act, 2000 (consolidated) <ExternalLink className="h-3 w-3" />
          </a>
        </li>
        <li>
          <a
            href="https://www.ontario.ca/laws/statute/S24021"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Working for Workers Four Act, 2024 <ExternalLink className="h-3 w-3" />
          </a>
        </li>
        <li>
          <a
            href="https://www.ontario.ca/laws/statute/S24022"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Working for Workers Five Act, 2024 <ExternalLink className="h-3 w-3" />
          </a>
        </li>
      </ul>

      <p className="mt-10 text-xs text-muted-foreground">
        This page is a plain-English overview, not legal advice. Section numbers reference the consolidated ESA as
        amended; confirm specifics with HR counsel.
      </p>
    </div>
  );
}
