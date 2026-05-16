import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, MapPin } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-[520px]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, hsl(var(--primary) / 0.18), transparent 60%)",
        }}
      />
      <div className="container relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            For Ontario employers with 25+ employees · Effective January 1, 2026
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Ontario's new hiring rules went live January 1.{" "}
            <span className="text-primary">Stay compliant in 10 minutes a week.</span>
          </h1>
          <p className="mt-6 text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
            ClearPost tracks pay-transparency disclosures, AI screening notices, and the{" "}
            <span className="text-foreground font-medium">45-day candidate notification deadline</span>
            {" "}— so a complaint to the Ministry of Labour doesn't become a six-figure problem.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Start 14-day free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="#quiz">Take the 60-second check</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Data hosted in Canada (ca-central-1)
            </span>
            <span className="inline-flex items-center gap-1.5">
              PIPEDA-aware · Law 25-ready
            </span>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div className="mx-auto mt-16 max-w-5xl">
      <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/5">
        <div className="rounded-xl bg-gradient-to-b from-secondary/50 to-secondary/10 p-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-destructive/70" />
              45-day candidate notifications
            </div>
            <span className="text-xs text-muted-foreground">3 overdue · 7 this week</span>
          </div>
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {[
              { name: "A. Singh", role: "Senior Accountant · Toronto", days: -2, status: "overdue" },
              { name: "M. Tremblay", role: "RN · Mississauga", days: 4, status: "urgent" },
              { name: "J. Okafor", role: "Sales Manager · Ottawa", days: 11, status: "approaching" },
              { name: "P. Cohen", role: "Software Engineer · Toronto", days: 22, status: "ok" },
            ].map((r) => (
              <li key={r.name} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      (r.status === "overdue"
                        ? "bg-red-50 text-red-700"
                        : r.status === "urgent"
                        ? "bg-amber-50 text-amber-800"
                        : r.status === "approaching"
                        ? "bg-amber-50/60 text-amber-700"
                        : "bg-emerald-50 text-emerald-700")
                    }
                  >
                    {r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d left`}
                  </span>
                  <button className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-secondary">
                    Send decision
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        The 45-day inbox. The single screen you'll open every morning.
      </p>
    </div>
  );
}
