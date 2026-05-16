import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization } from "@/lib/orgs/actions";
import { Leaf } from "lucide-react";

const PROVINCES = [
  { value: "ON", label: "Ontario", supported: true },
  { value: "BC", label: "British Columbia", supported: false },
  { value: "AB", label: "Alberta", supported: false },
  { value: "QC", label: "Quebec", supported: false },
  { value: "FED", label: "Federally regulated", supported: false },
  { value: "OTHER", label: "Other / multiple", supported: false },
];

const SIZE_BUCKETS = [
  { value: "1-24", label: "1–24", note: "Below the 25-employee threshold" },
  { value: "25-99", label: "25–99", note: "" },
  { value: "100-249", label: "100–249", note: "" },
  { value: "250-500", label: "250–500", note: "" },
  { value: "500+", label: "500+", note: "" },
];

export const metadata = { title: "Set up your organization" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-xl">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            ClearPost
          </Link>
          <Card>
            <CardHeader>
              <CardTitle>Set up your organization</CardTitle>
              <CardDescription>
                We'll tailor the compliance rules engine to your province and headcount.
                You can change either of these later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createOrganization} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Organization name</Label>
                  <Input id="name" name="name" placeholder="Acme Manufacturing Ltd." required />
                </div>

                <fieldset className="space-y-2">
                  <Label>Primary province / regulator</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROVINCES.map((p) => (
                      <label
                        key={p.value}
                        className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-background px-3 py-2.5 text-sm hover:border-foreground/30 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                      >
                        <span>
                          {p.label}
                          {!p.supported && (
                            <span className="ml-1 text-xs text-muted-foreground">(soon)</span>
                          )}
                        </span>
                        <input
                          type="radio"
                          name="province"
                          value={p.value}
                          required
                          defaultChecked={p.value === "ON"}
                          className="accent-primary"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only Ontario is fully active in v1. Other jurisdictions ship through 2026.
                  </p>
                </fieldset>

                <fieldset className="space-y-2">
                  <Label>Employee count</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {SIZE_BUCKETS.map((b) => (
                      <label
                        key={b.value}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-border bg-background px-3 py-3 text-sm hover:border-foreground/30 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
                      >
                        <span className="font-medium">{b.label}</span>
                        <input
                          type="radio"
                          name="size"
                          value={b.value}
                          required
                          className="sr-only"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The 25-employee threshold determines whether the new posting obligations apply.
                  </p>
                </fieldset>

                <Button type="submit" size="lg" className="w-full">
                  Continue to dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
