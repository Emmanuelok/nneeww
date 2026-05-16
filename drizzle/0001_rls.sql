-- Row-Level Security policies for ClearPost.
-- Run AFTER 0000_init.sql in Supabase SQL editor.
--
-- The policy model: every tenant table is gated on a `org_id` column
-- matching a row in `memberships` for the authenticated Supabase user.
-- The `users` table maps Supabase auth.users.id → users.supabase_uid.

-- Helper: returns the set of org_ids the current Supabase user belongs to.
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.org_id
  FROM memberships m
  JOIN users u ON u.id = m.user_id
  WHERE u.supabase_uid = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Enable RLS on every table
-- -----------------------------------------------------------------------------
ALTER TABLE organizations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships              ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_forms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates               ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_vault_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions            ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Public read on jurisdictions (config table, no PII)
-- -----------------------------------------------------------------------------
CREATE POLICY "jurisdictions_read_all"
  ON jurisdictions FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- users: a user can read/update their own row
-- -----------------------------------------------------------------------------
CREATE POLICY "users_self_read"
  ON users FOR SELECT
  USING (supabase_uid = auth.uid());

CREATE POLICY "users_self_update"
  ON users FOR UPDATE
  USING (supabase_uid = auth.uid());

-- -----------------------------------------------------------------------------
-- organizations: members can read; owners can update
-- -----------------------------------------------------------------------------
CREATE POLICY "orgs_member_read"
  ON organizations FOR SELECT
  USING (id IN (SELECT current_user_org_ids()));

CREATE POLICY "orgs_owner_update"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT m.org_id FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE u.supabase_uid = auth.uid() AND m.role = 'owner'
    )
  );

-- -----------------------------------------------------------------------------
-- memberships: members of an org can see all memberships in that org;
-- only owners can modify
-- -----------------------------------------------------------------------------
CREATE POLICY "memberships_member_read"
  ON memberships FOR SELECT
  USING (org_id IN (SELECT current_user_org_ids()));

CREATE POLICY "memberships_owner_write"
  ON memberships FOR ALL
  USING (
    org_id IN (
      SELECT m.org_id FROM memberships m
      JOIN users u ON u.id = m.user_id
      WHERE u.supabase_uid = auth.uid() AND m.role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- Tenant data: members can read; admins+recruiters can write
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'job_postings',
    'candidates',
    'interviews',
    'candidate_notifications',
    'retention_vault_items',
    'audit_log'
  ]
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%I_org_member_read" ON %I FOR SELECT
      USING (org_id IN (SELECT current_user_org_ids()));
    $f$, t, t);

    EXECUTE format($f$
      CREATE POLICY "%I_org_member_write" ON %I FOR ALL
      USING (org_id IN (SELECT current_user_org_ids()));
    $f$, t, t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- application_forms and compliance_checks are tied to job_postings, not
-- directly to org_id. Scope via the parent posting.
-- -----------------------------------------------------------------------------
CREATE POLICY "application_forms_via_posting_read"
  ON application_forms FOR SELECT
  USING (
    posting_id IN (
      SELECT id FROM job_postings WHERE org_id IN (SELECT current_user_org_ids())
    )
  );

CREATE POLICY "application_forms_via_posting_write"
  ON application_forms FOR ALL
  USING (
    posting_id IN (
      SELECT id FROM job_postings WHERE org_id IN (SELECT current_user_org_ids())
    )
  );

CREATE POLICY "compliance_checks_via_posting_read"
  ON compliance_checks FOR SELECT
  USING (
    posting_id IN (
      SELECT id FROM job_postings WHERE org_id IN (SELECT current_user_org_ids())
    )
  );

CREATE POLICY "compliance_checks_via_posting_write"
  ON compliance_checks FOR ALL
  USING (
    posting_id IN (
      SELECT id FROM job_postings WHERE org_id IN (SELECT current_user_org_ids())
    )
  );
