import { AppShell } from "@/components/app/app-shell";
import { PostingWizard } from "@/components/app/posting-wizard";

export const metadata = { title: "New posting check" };

export default function NewPostingPage() {
  return (
    <AppShell
      active="/app/postings/new"
      pageTitle="New posting check"
      pageDescription="Paste a posting URL or text. We'll run pay transparency, AI disclosure, vacancy disclosure, and prohibited-language checks."
    >
      <PostingWizard />
    </AppShell>
  );
}
