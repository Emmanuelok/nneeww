"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { organizations, memberships, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isDemoMode } from "@/lib/mode";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function createOrganization(formData: FormData) {
  // In demo mode, just route the user into the seeded workspace.
  if (isDemoMode()) {
    redirect("/app");
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const province = String(formData.get("province") ?? "ON");
  const size = String(formData.get("size") ?? "25-99");

  if (!name) redirect("/onboarding?error=name_required");

  // Ensure a users row exists for this Supabase identity.
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUid, user.id))
    .limit(1);

  const userId =
    existingUser[0]?.id ??
    (
      await db
        .insert(users)
        .values({
          supabaseUid: user.id,
          email: user.email ?? "",
          name: (user.user_metadata?.full_name as string) ?? null,
        })
        .returning()
    )[0].id;

  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;

  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug,
      province,
      employeeCountBucket: size,
      plan: "trial",
    })
    .returning();

  await db.insert(memberships).values({
    orgId: org.id,
    userId,
    role: "owner",
  });

  redirect("/app");
}
