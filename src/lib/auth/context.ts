import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, memberships, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDemoMode, DEMO_ORG } from "@/lib/mode";

export type ActiveOrg = {
  id: string;
  name: string;
  province: string;
  employeeCountBucket: string;
  role: "owner" | "admin" | "recruiter";
};

export const getCurrentSession = cache(async () => {
  if (isDemoMode()) return { user: null, demo: true as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, demo: false as const };
});

/**
 * Resolves the active organization for the signed-in Supabase user.
 *
 * Returns `null` when the user is signed in but has no membership yet
 * (they need to go to /onboarding).
 *
 * In demo mode, returns the static DEMO_ORG so /app/* pages render the
 * seeded demo dataset without any auth.
 */
export const getActiveOrg = cache(async (): Promise<ActiveOrg | null> => {
  if (isDemoMode()) {
    return {
      id: DEMO_ORG.id,
      name: DEMO_ORG.name,
      province: DEMO_ORG.province,
      employeeCountBucket: DEMO_ORG.employeeCountBucket,
      role: "owner",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await db
    .select({
      orgId: organizations.id,
      name: organizations.name,
      province: organizations.province,
      bucket: organizations.employeeCountBucket,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .innerJoin(organizations, eq(organizations.id, memberships.orgId))
    .where(eq(users.supabaseUid, user.id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.orgId,
    name: row.name,
    province: row.province,
    employeeCountBucket: row.bucket,
    role: row.role,
  };
});
