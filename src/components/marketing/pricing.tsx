import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCAD } from "@/lib/utils";

type Plan = {
  name: string;
  price: number;
  blurb: string;
  cta: string;
  href: string;
  highlight?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Solo",
    price: 79,
    blurb: "For a single HR generalist or fractional consultant.",
    cta: "Start free trial",
    href: "/signup?plan=solo",
    features: [
      "1 user",
      "Up to 25 active postings / year",
      "Ontario rules engine",
      "45-day candidate workflow",
      "3-year retention vault",
      "Email support",
    ],
  },
  {
    name: "Team",
    price: 179,
    blurb: "For an in-house People team running active hiring.",
    cta: "Start free trial",
    href: "/signup?plan=team",
    highlight: true,
    features: [
      "Up to 5 users",
      "Unlimited postings",
      "Ontario + Federal coverage",
      "CSV import from any ATS",
      "Audit-ready compliance report",
      "Audit log + member roles",
      "Priority email support",
    ],
  },
  {
    name: "Multi-province",
    price: 349,
    blurb: "For multi-entity employers operating across Canada.",
    cta: "Talk to us",
    href: "/signup?plan=multi",
    features: [
      "Ontario, BC, Alberta, Quebec",
      "Bilingual UI (English / French, 2026)",
      "Multiple legal entities",
      "Compliance report export (PDF + ZIP)",
      "Priority support + onboarding",
      "DPA available on request",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-border/60 bg-secondary/30">
      <div className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Priced in Canadian dollars. GST/HST handled at checkout.
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            14-day free trial on every plan. No credit card required to start. Annual billing
            saves you two months.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.name}
              className={cn(
                "relative flex flex-col",
                p.highlight && "border-primary/60 shadow-lg shadow-primary/10"
              )}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.blurb}</CardDescription>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    {formatCAD(p.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">CAD / month</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button
                    asChild
                    className="w-full"
                    variant={p.highlight ? "default" : "outline"}
                  >
                    <Link href={p.href}>{p.cta}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          A US-states add-on at {formatCAD(199)}/mo will be available in 2026.
          All prices CAD, exclusive of applicable GST/HST.
        </p>
      </div>
    </section>
  );
}
