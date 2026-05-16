import { listPostings } from "./postings";
import { listCandidates } from "./candidates";
import { listVaultItems } from "./vault";

export type DashboardStats = {
  overdue: number;
  upcomingWeek: number;
  live: number;
  failingPostings: number;
  avgScore: number;
  vaultCount: number;
};

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const [postings, candidates, vault] = await Promise.all([
    listPostings(orgId),
    listCandidates(orgId),
    listVaultItems(orgId),
  ]);

  const overdue = candidates.filter((c) => c.notificationStatus === "overdue").length;
  const upcomingWeek = candidates.filter(
    (c) => c.notificationStatus === "pending" && c.daysToDeadline <= 7
  ).length;
  const livePostings = postings.filter((p) => p.status === "live");
  const failingPostings = livePostings.filter((p) => p.failedChecks > 0).length;
  const avgScore =
    livePostings.length === 0
      ? 100
      : Math.round(livePostings.reduce((s, p) => s + p.complianceScore, 0) / livePostings.length);

  return {
    overdue,
    upcomingWeek,
    live: livePostings.length,
    failingPostings,
    avgScore,
    vaultCount: vault.length,
  };
}
