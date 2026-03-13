-- =============================================================================
-- 311_fix_forsured_rls_and_role_data.sql
--
-- Fixes two issues:
-- 1. Infinite recursion in user_profiles RLS policies (from migration 300)
-- 2. Empty forsured.roles and forsured.role_assignments tables
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FIX user_profiles RLS INFINITE RECURSION
--    Migration 300 added policies that subquery user_profiles from within
--    user_profiles policies, causing infinite recursion when PostgreSQL
--    evaluates the RLS policies.
--    Fix: Use auth.uid() directly instead of subquerying user_profiles.
-- =============================================================================

-- Drop the recursive policies
DROP POLICY IF EXISTS "Users can view manual users they created" ON forsured.user_profiles;
DROP POLICY IF EXISTS "Users can update manual users they created" ON forsured.user_profiles;
DROP POLICY IF EXISTS "Users can delete manual users they created" ON forsured.user_profiles;
DROP POLICY IF EXISTS "Users can insert manual users" ON forsured.user_profiles;

-- Recreate without self-referential subqueries.
-- Use created_by_user_id matching auth.uid() via scaffald_user_id directly.
-- The created_by_user_id column stores the user_profiles.id of the creator,
-- but we can join through a simple correlation without recursion by checking
-- if the current auth user's scaffald_user_id matches.

CREATE POLICY "Users can view manual users they created"
  ON forsured.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    created_by_user_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM forsured.users u
      WHERE u.id = auth.uid()
        AND forsured.user_profiles.created_by_user_id = (
          SELECT up2.id FROM forsured.user_profiles up2
          WHERE up2.scaffald_user_id = auth.uid()
          LIMIT 1
        )
    )
  );

-- Actually, the above still references user_profiles. Let me use a different approach.
-- Since created_by_user_id stores the user_profiles.id of the creator,
-- and the creator's scaffald_user_id = auth.uid(), we need to find the creator's
-- user_profiles.id. But any subquery on user_profiles causes recursion.
--
-- The safest approach: store the auth user ID (scaffald_user_id) directly
-- in the created_by column, OR use a security definer function.
-- Let's use a security definer function to break the recursion.

DROP POLICY IF EXISTS "Users can view manual users they created" ON forsured.user_profiles;

-- Create a security definer function that bypasses RLS to look up the profile ID
CREATE OR REPLACE FUNCTION forsured.get_current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM forsured.user_profiles
  WHERE scaffald_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now create non-recursive policies using the security definer function
CREATE POLICY "Users can view manual users they created"
  ON forsured.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    created_by_user_id = forsured.get_current_profile_id()
  );

CREATE POLICY "Users can update manual users they created"
  ON forsured.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_manually_created = true AND
    created_by_user_id = forsured.get_current_profile_id()
  );

CREATE POLICY "Users can delete manual users they created"
  ON forsured.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    is_manually_created = true AND
    created_by_user_id = forsured.get_current_profile_id()
  );

CREATE POLICY "Users can insert manual users"
  ON forsured.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_manually_created = true AND created_by_user_id = forsured.get_current_profile_id()) OR
    (is_manually_created = false AND scaffald_user_id = auth.uid())
  );


-- =============================================================================
-- 2. POPULATE forsured.roles AND forsured.role_assignments FROM core.*
--    The schema separation (migration 298) created the tables but didn't
--    copy the data. App code now queries forsured.* but the data is in core.*.
-- =============================================================================

-- Copy roles (skip if already populated)
INSERT INTO forsured.roles (id, scope, name, description, created_at)
SELECT id, scope, name, description, created_at
FROM core.roles
ON CONFLICT (id) DO NOTHING;

-- Copy role_assignments (need to handle FK constraints)
-- forsured.role_assignments has FKs to forsured.users and forsured.organizations
-- Only copy assignments where the user exists in forsured.users
INSERT INTO forsured.role_assignments (id, role_id, role_type, user_id, scope_org_id, organization_id, created_at)
SELECT
  ca.id,
  ca.role_id,
  r.name as role_type,
  ca.user_id,
  ca.scope_org_id,
  ca.scope_org_id as organization_id,
  ca.created_at
FROM core.role_assignments ca
JOIN core.roles r ON ca.role_id = r.id
WHERE EXISTS (SELECT 1 FROM forsured.users fu WHERE fu.id = ca.user_id)
  AND (ca.scope_org_id IS NULL OR EXISTS (SELECT 1 FROM forsured.organizations fo WHERE fo.id = ca.scope_org_id))
ON CONFLICT (id) DO NOTHING;

COMMIT;
