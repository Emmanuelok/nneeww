import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/mode";
import { getActiveOrg, getCurrentSession } from "@/lib/auth/context";

/**
 * Route guard for /app/*.
 *
 * Demo mode: always allows through (DEMO_ORG is the active org).
 *
 * Live mode:
 *   - no session → /login
 *   - signed in but no org membership → /onboarding
 *   - otherwise → render
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDemoMode()) {
    const session = await getCurrentSession();
    if (!session.user) redirect("/login");
    const org = await getActiveOrg();
    if (!org) redirect("/onboarding");
  }
  return <>{children}</>;
}
