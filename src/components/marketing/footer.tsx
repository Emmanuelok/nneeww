import Link from "next/link";
import { Leaf, ExternalLink } from "lucide-react";

const STATUTE_LINKS = [
  {
    label: "Working for Workers Four Act, 2024",
    href: "https://www.ontario.ca/laws/statute/S24021",
  },
  {
    label: "Working for Workers Five Act, 2024",
    href: "https://www.ontario.ca/laws/statute/S24022",
  },
  {
    label: "Employment Standards Act, 2000",
    href: "https://www.ontario.ca/laws/statute/00e41",
  },
  {
    label: "BC Pay Transparency Act",
    href: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/23018",
  },
  {
    label: "Quebec Law 25",
    href: "https://www.legisquebec.gouv.qc.ca/en/document/cs/p-39.1",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </span>
              ClearPost
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Canadian hiring compliance for Ontario's Working for Workers Acts. Built in Toronto.
              Data hosted in Canada (ca-central-1).
            </p>
            <p className="mt-4 max-w-md rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Not legal advice.</strong> ClearPost is a
              compliance operations tool. The statute citations we surface are a starting point, not
              a legal opinion. Always confirm specifics with qualified HR counsel licensed in your
              jurisdiction.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#how-it-works" className="hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#quiz" className="hover:text-foreground">
                  Compliance check
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Statutes &amp; sources</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {STATUTE_LINKS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {s.label} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} ClearPost Compliance Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/security" className="hover:text-foreground">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
