import { AppShell } from "@/components/app/app-shell";
import { NotificationInbox } from "@/components/app/notification-inbox";
import { getActiveOrg } from "@/lib/auth/context";
import { listCandidates } from "@/lib/repositories/candidates";
import { redirect } from "next/navigation";

export const metadata = { title: "45-day inbox" };

export default async function NotificationsPage() {
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");
  const candidates = await listCandidates(org.id);
  return (
    <AppShell
      active="/app/notifications"
      pageTitle="45-day inbox"
      pageDescription="Every interviewed candidate gets a notification deadline of last-interview + 45 calendar days. Sorted by urgency."
    >
      <NotificationInbox candidates={candidates} />
    </AppShell>
  );
}
