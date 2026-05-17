import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PostingWizard } from "@/components/app/posting-wizard";
import { getActiveOrg } from "@/lib/auth/context";
import { activeJurisdictions, provinceToJurisdiction } from "@/lib/compliance/province";

export const metadata = { title: "New posting check" };

export default async function NewPostingPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");
  const jurisdictions = activeJurisdictions();
  const defaultJurisdiction = provinceToJurisdiction(org.province);
  return (
    <AppShell
      active="/app/postings/new"
      pageTitle="New posting check"
      pageDescription="Paste a posting URL or text. We'll run pay transparency, AI disclosure, vacancy disclosure, and prohibited-language checks."
    >
      <PostingWizard jurisdictions={jurisdictions} defaultJurisdiction={defaultJurisdiction} />
    </AppShell>
  );
}
