import { db } from "@/lib/db";
import { retentionVaultItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";
import { demoVaultItems, type DemoVaultItem } from "@/lib/demo/data";

export type VaultItem = DemoVaultItem;

export async function listVaultItems(orgId: string): Promise<VaultItem[]> {
  if (isDemoMode()) return demoVaultItems;

  const rows = await db
    .select()
    .from(retentionVaultItems)
    .where(eq(retentionVaultItems.orgId, orgId))
    .orderBy(desc(retentionVaultItems.archivedAt));

  return rows.map((r) => ({
    id: r.id,
    type: r.itemType,
    title: `${r.itemType} ${r.sourceId.slice(0, 8)}`,
    relatedTo: r.sourceId,
    archivedAt: r.archivedAt,
    expiresAt: r.expiresAt,
  }));
}
