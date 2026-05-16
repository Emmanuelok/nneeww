import {
  AlarmClock,
  ScanSearch,
  Archive,
  FileBadge,
  Globe2,
  ClipboardCheck,
} from "lucide-react";

const features = [
  {
    icon: AlarmClock,
    title: "45-day candidate notifications",
    body: "Every interviewed candidate is tracked with a hard deadline. Day 30 turns yellow. Day 40 turns red. One-click decision emails with delivery receipts.",
  },
  {
    icon: ScanSearch,
    title: "Posting compliance checker",
    body: "Paste a posting. We check pay range (≤ $50k spread, > $200k exempt), AI disclosure, vacancy disclosure, and prohibited 'Canadian experience' language.",
  },
  {
    icon: Archive,
    title: "3-year retention vault",
    body: "Every posting, application form, and notification proof archived with an automatic expiry timer. Searchable by candidate, posting, or date.",
  },
  {
    icon: FileBadge,
    title: "Audit-ready report",
    body: "Generate a PDF + ZIP package showing every posting, notification, and statute citation — the document you hand to an ESA officer.",
  },
  {
    icon: ClipboardCheck,
    title: "Plain-English checks",
    body: "Each finding cites the exact section of the Employment Standards Act. We are not your lawyer, and we say so — but we'll show you the source.",
  },
  {
    icon: Globe2,
    title: "Canada-first, expansion-ready",
    body: "Ontario today. BC, Alberta, and federally regulated next. Quebec with bilingual UI in 2026. Hosted in ca-central-1.",
  },
];

export function Features() {
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-secondary/30">
      <div className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            One place for the obligations that didn't exist before January.
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            ClearPost sits between your ATS and your audit file. It doesn't replace BambooHR,
            Workable, or Greenhouse — it covers what they don't.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-7">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
