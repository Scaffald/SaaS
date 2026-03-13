-- Migration: 277_forsured_audit_comments_and_rls_fix.sql
-- Description: Add audit trigger for comments table and fix RLS policy on audit_log
-- to allow users to see audit logs for projects they have access to
-- Author: Claude
-- Date: 2026-01-14

BEGIN;

-- =============================================================================
-- 1. ADD AUDIT TRIGGER FOR COMMENTS TABLE
-- =============================================================================

DROP TRIGGER IF EXISTS audit_comments ON forsured.comments;
CREATE TRIGGER audit_comments
  AFTER INSERT OR UPDATE OR DELETE ON forsured.comments
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- =============================================================================
-- 2. FIX RLS POLICY ON AUDIT_LOG
-- =============================================================================
-- The current policy only allows users to see their OWN audit logs (user_id = auth.uid()).
-- This prevents seeing audit logs for:
--   - System/seed-created entries (user_id is NULL)
--   - Entries created by other users on shared resources (projects, etc.)
--
-- New policy: Allow users to see audit logs for:
--   - Their own actions (user_id = auth.uid())
--   - Actions on projects in their organization
--   - Actions with user_id = NULL in their organization

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own audit logs" ON forsured.audit_log;

-- Create a more permissive policy for viewing audit logs
-- Users can see audit logs if:
--   1. They created the audit log entry (user_id = auth.uid())
--   2. The audit log belongs to their organization (organization_id matches)
--   3. The audit log is for a project they have access to via project_participants
CREATE POLICY "Users can view audit logs for their organization"
  ON forsured.audit_log
  FOR SELECT TO authenticated
  USING (
    -- User created the entry
    user_id = auth.uid()
    -- OR the entry belongs to user's organization
    OR organization_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
    -- OR the entry is for a project the user participates in
    OR record_id IN (
      SELECT project_id FROM forsured.project_participants WHERE user_id = auth.uid()
    )
    -- OR the entry is for a project in the user's organization (via projects table)
    OR record_id IN (
      SELECT p.id FROM forsured.projects p
      WHERE p.organization_id IN (
        SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 3. VERIFICATION
-- =============================================================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
  policy_exists BOOLEAN;
BEGIN
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'audit_comments'
      AND event_object_schema = 'forsured'
      AND event_object_table = 'comments'
  ) INTO trigger_exists;

  -- Check policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can view audit logs for their organization'
      AND schemaname = 'forsured'
      AND tablename = 'audit_log'
  ) INTO policy_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ Audit trigger for comments table created successfully';
  ELSE
    RAISE WARNING '❌ Audit trigger for comments table NOT found';
  END IF;

  IF policy_exists THEN
    RAISE NOTICE '✅ RLS policy for audit_log updated successfully';
  ELSE
    RAISE WARNING '❌ RLS policy for audit_log NOT found';
  END IF;
END $$;

COMMIT;
