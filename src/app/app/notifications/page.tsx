import { AppShell } from "@/components/app/app-shell";
import { NotificationInbox } from "@/components/app/notification-inbox";
import { demoCandidates } from "@/lib/demo/data";

export const metadata = { title: "45-day inbox" };

export default function NotificationsPage() {
  return (
    <AppShell
      active="/app/notifications"
      pageTitle="45-day inbox"
      pageDescription="Every interviewed candidate gets a notification deadline of last-interview + 45 calendar days. Sorted by urgency."
    >
      <NotificationInbox candidates={demoCandidates} />
    </AppShell>
  );
}
