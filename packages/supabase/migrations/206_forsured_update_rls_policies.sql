-- Migration: Update RLS policies for forsured schema
-- REQ: REQ-211 - Database Schema Migration to forsured.*
-- Phase: 1 - Schema Migration (RLS Policies)
-- Date: 2025-01-14
-- Depends on: 003-006 (all previous migrations must complete successfully)

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration enables Row Level Security on all forsured.* tables and creates
-- policies that reference core.users and core.role_assignments.
--
-- Key Changes from Old Architecture:
-- - OLD: Policies referenced public.users table
-- - NEW: Policies reference core.users and core.role_assignments
-- - Multi-tenancy enforced via organization_id checks
-- - Role-based access control using Scaffald roles
--
-- RLS Strategy:
-- 1. All tables enforce organization-level isolation
-- 2. Role-based permissions (Manager, Subcontractor, Broker, Admin)
-- 3. Service role bypass for system operations
--
-- See: REQ-106 (RBAC requirements), /docs/SCAFFALD_INTEGRATION.md
-- =============================================================================

-- =============================================================================
-- 1. ENABLE RLS ON ALL FORSURED TABLES
-- =============================================================================

ALTER TABLE forsured.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.compliance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.tasks ENABLE ROW LEVEL SECURITY;

-- audit_log RLS already enabled in 004_migrate_audit_log.sql

-- =============================================================================
-- 2. PROJECTS TABLE RLS POLICIES
-- =============================================================================

-- Helper function to check project subcontractor access without RLS recursion
-- Uses SECURITY DEFINER to bypass RLS when checking project_subcontractors
CREATE OR REPLACE FUNCTION forsured.check_project_subcontractor_access(
  p_project_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, forsured, core
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM forsured.project_subcontractors ps
    INNER JOIN forsured.subcontractors s ON ps.subcontractor_id = s.id
    INNER JOIN core.role_assignments ra ON s.organization_id = ra.scope_org_id
    WHERE ps.project_id = p_project_id
    AND ra.user_id = p_user_id
    AND ra.scope_org_id IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION forsured.check_project_subcontractor_access(UUID, UUID) TO authenticated;

-- SELECT: Users can view projects in their organization
-- OR if they are a subcontractor on the project (via project_subcontractors)
CREATE POLICY "Users can view projects in their organization"
  ON forsured.projects
  FOR SELECT
  TO authenticated
  USING (
    -- Managers/GCs: User has role in project's organization
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
    OR
    -- Subcontractors: Use security definer function to avoid RLS recursion
    forsured.check_project_subcontractor_access(
      forsured.projects.id,
      auth.uid()
    )
  );

-- INSERT: Managers can create projects in their organization
CREATE POLICY "Managers can create projects"
  ON forsured.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- UPDATE: Managers can update projects in their organization
CREATE POLICY "Managers can update projects"
  ON forsured.projects
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- DELETE: Managers can delete projects in their organization
CREATE POLICY "Managers can delete projects"
  ON forsured.projects
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 3. SUBCONTRACTORS TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view subcontractors in their organization
CREATE POLICY "Users can view subcontractors in their organization"
  ON forsured.subcontractors
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Managers can add subcontractors
CREATE POLICY "Managers can add subcontractors"
  ON forsured.subcontractors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- UPDATE: Managers can update subcontractors
CREATE POLICY "Managers can update subcontractors"
  ON forsured.subcontractors
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 4. DOCUMENTS TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view documents in their organization
CREATE POLICY "Users can view documents in their organization"
  ON forsured.documents
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can upload documents for their organization
CREATE POLICY "Users can upload documents"
  ON forsured.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update documents they uploaded or managers can update any
CREATE POLICY "Users can update own documents or managers can update any"
  ON forsured.documents
  FOR UPDATE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- DELETE: Users can delete documents they uploaded or managers can delete any
CREATE POLICY "Users can delete own documents or managers can delete any"
  ON forsured.documents
  FOR DELETE
  TO authenticated
  USING (
    uploader_id = auth.uid()
    OR organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 5. POLICIES TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view policies in their organization
CREATE POLICY "Users can view policies in their organization"
  ON forsured.policies
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Service role only (policies created by document processing)
-- No direct user access for INSERT/UPDATE/DELETE

-- =============================================================================
-- 6. ENDORSEMENTS TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view endorsements in their organization
CREATE POLICY "Users can view endorsements in their organization"
  ON forsured.endorsements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: Service role only (endorsements created by document processing)
-- No direct user access for INSERT/UPDATE/DELETE

-- =============================================================================
-- 7. REQUIREMENTS TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view requirements for projects in their organization
CREATE POLICY "Users can view requirements in their organization"
  ON forsured.requirements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Managers can create requirements
CREATE POLICY "Managers can create requirements"
  ON forsured.requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- UPDATE: Managers can update requirements
CREATE POLICY "Managers can update requirements"
  ON forsured.requirements
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- DELETE: Managers can delete requirements
CREATE POLICY "Managers can delete requirements"
  ON forsured.requirements
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 8. COMPLIANCE SCORES TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view compliance scores in their organization
CREATE POLICY "Users can view compliance scores in their organization"
  ON forsured.compliance_scores
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT/UPDATE: Service role only (scores calculated by compliance engine)
-- No direct user access for INSERT/UPDATE

-- =============================================================================
-- 9. TASKS TABLE RLS POLICIES
-- =============================================================================

-- SELECT: Users can view tasks in their organization or assigned to them
CREATE POLICY "Users can view tasks in their organization"
  ON forsured.tasks
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
    OR assigned_to_user_id = auth.uid()
  );

-- INSERT: Managers can create tasks
CREATE POLICY "Managers can create tasks"
  ON forsured.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- UPDATE: Assigned users can update task status, managers can update any field
CREATE POLICY "Users can update assigned tasks, managers can update any"
  ON forsured.tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to_user_id = auth.uid()
    OR organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- DELETE: Managers can delete tasks
CREATE POLICY "Managers can delete tasks"
  ON forsured.tasks
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT ra.scope_org_id
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- 10. SERVICE ROLE BYPASS (FULL ACCESS FOR SYSTEM OPERATIONS)
-- =============================================================================

-- Create bypass policies for service_role on all tables
-- Service role needs full access for system operations, migrations, and background jobs

-- Projects
CREATE POLICY "Service role bypass" ON forsured.projects FOR ALL TO service_role USING (true);

-- Subcontractors
CREATE POLICY "Service role bypass" ON forsured.subcontractors FOR ALL TO service_role USING (true);

-- Documents
CREATE POLICY "Service role bypass" ON forsured.documents FOR ALL TO service_role USING (true);

-- Policies
CREATE POLICY "Service role bypass" ON forsured.policies FOR ALL TO service_role USING (true);

-- Endorsements
CREATE POLICY "Service role bypass" ON forsured.endorsements FOR ALL TO service_role USING (true);

-- Requirements
CREATE POLICY "Service role bypass" ON forsured.requirements FOR ALL TO service_role USING (true);

-- Compliance Scores
CREATE POLICY "Service role bypass" ON forsured.compliance_scores FOR ALL TO service_role USING (true);

-- Tasks
CREATE POLICY "Service role bypass" ON forsured.tasks FOR ALL TO service_role USING (true);

-- =============================================================================
-- 11. VERIFICATION: Confirm RLS is enabled
-- =============================================================================

DO $$
DECLARE
  tables_without_rls TEXT[];
BEGIN
  SELECT ARRAY_AGG(tablename)
  INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'forsured'
    AND tablename IN ('projects', 'subcontractors', 'documents', 'policies', 'endorsements', 'requirements', 'compliance_scores', 'tasks')
    AND NOT rowsecurity;

  IF tables_without_rls IS NOT NULL THEN
    RAISE EXCEPTION 'RLS verification failed: tables without RLS enabled: %', tables_without_rls;
  END IF;

  RAISE NOTICE '✅ RLS enabled on all forsured tables';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'REQ-211 RLS Policies Migration (007) applied - all policies reference core.users and core.role_assignments';

-- Log migration completion
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'forsured';

  RAISE NOTICE '✅ Migration 007 complete: % RLS policies created for forsured schema', policy_count;
  RAISE NOTICE '   - All policies reference core.users and core.role_assignments';
  RAISE NOTICE '   - Multi-tenancy enforced via organization_id';
  RAISE NOTICE '   - Role-based access control implemented';
END $$;
