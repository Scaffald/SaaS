-- Migration 236: Compliance Role Permissions System
-- REQ-2, TASK-18: Extensible Authorization System with Permission Matrix
--
-- Creates a database-driven authorization system for compliance requirements
-- that supports platform admin now and can be extended to broker/GC admins later.

BEGIN;

-- =============================================================================
-- Create compliance_permissions enum type
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_permission') THEN
    CREATE TYPE forsured.compliance_permission AS ENUM (
      'requirement:create',
      'requirement:read',
      'requirement:update',
      'requirement:delete',
      'requirement:clone',
      'requirement:manage_dependencies',
      'requirement:bulk_import',
      'requirement:bulk_export',
      'requirement:manage_versions',
      'requirement:restore_version'
    );
  END IF;
END $$;

-- =============================================================================
-- Create compliance_system_role enum type
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compliance_system_role') THEN
    CREATE TYPE forsured.compliance_system_role AS ENUM (
      'platform_admin',
      'broker_admin',
      'gc_admin',
      'project_manager',
      'subcontractor',
      'viewer'
    );
  END IF;
END $$;

-- =============================================================================
-- Create compliance_role_permissions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.compliance_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The role being granted the permission
  role forsured.compliance_system_role NOT NULL,

  -- The permission being granted
  permission forsured.compliance_permission NOT NULL,

  -- Organization scope (NULL = global permission for this role)
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Audit fields
  granted_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one permission per role per organization (or global)
  UNIQUE(role, permission, organization_id)
);

-- Index for efficient permission lookups
CREATE INDEX IF NOT EXISTS idx_compliance_role_permissions_role
  ON forsured.compliance_role_permissions(role);

CREATE INDEX IF NOT EXISTS idx_compliance_role_permissions_org
  ON forsured.compliance_role_permissions(organization_id);

-- =============================================================================
-- Create compliance_user_role_overrides table (for user-specific overrides)
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.compliance_user_role_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user being assigned the role
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- The compliance role assigned
  role forsured.compliance_system_role NOT NULL,

  -- Organization scope (required for non-platform roles)
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Audit fields
  assigned_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one role per user per organization
  UNIQUE(user_id, role, organization_id)
);

-- Index for efficient role lookups by user
CREATE INDEX IF NOT EXISTS idx_compliance_user_role_overrides_user
  ON forsured.compliance_user_role_overrides(user_id);

-- =============================================================================
-- Seed default permissions for platform_admin (all permissions)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'platform_admin'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:create',
  'requirement:read',
  'requirement:update',
  'requirement:delete',
  'requirement:clone',
  'requirement:manage_dependencies',
  'requirement:bulk_import',
  'requirement:bulk_export',
  'requirement:manage_versions',
  'requirement:restore_version'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Seed default permissions for broker_admin (manage requirements for their org)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'broker_admin'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:create',
  'requirement:read',
  'requirement:update',
  'requirement:clone',
  'requirement:manage_dependencies',
  'requirement:bulk_import',
  'requirement:bulk_export',
  'requirement:manage_versions'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Seed default permissions for gc_admin (manage requirements for their projects)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'gc_admin'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:create',
  'requirement:read',
  'requirement:update',
  'requirement:clone',
  'requirement:manage_dependencies',
  'requirement:bulk_export'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Seed default permissions for project_manager (limited management)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'project_manager'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:read',
  'requirement:clone',
  'requirement:bulk_export'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Seed default permissions for subcontractor (read-only)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'subcontractor'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:read'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Seed default permissions for viewer (read-only)
-- =============================================================================

INSERT INTO forsured.compliance_role_permissions (role, permission)
SELECT 'viewer'::forsured.compliance_system_role, p
FROM unnest(ARRAY[
  'requirement:read'
]::forsured.compliance_permission[]) AS p
ON CONFLICT DO NOTHING;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE forsured.compliance_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.compliance_user_role_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read role permissions (needed for authorization checks)
CREATE POLICY compliance_role_permissions_read
  ON forsured.compliance_role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Only platform admins can modify role permissions (enforced at app level too)
CREATE POLICY compliance_role_permissions_manage
  ON forsured.compliance_role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND r.scope = 'platform'
    )
  );

-- Users can read their own role overrides
CREATE POLICY compliance_user_role_overrides_own_read
  ON forsured.compliance_user_role_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Platform admins can read all role overrides
CREATE POLICY compliance_user_role_overrides_admin_read
  ON forsured.compliance_user_role_overrides
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND r.scope = 'platform'
    )
  );

-- Platform admins can manage role overrides
CREATE POLICY compliance_user_role_overrides_admin_manage
  ON forsured.compliance_user_role_overrides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name = 'super_admin'
        AND r.scope = 'platform'
    )
  );

-- =============================================================================
-- Helper function to check user compliance permission
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.check_compliance_permission(
  p_user_id UUID,
  p_permission forsured.compliance_permission,
  p_organization_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_user_role forsured.compliance_system_role;
  v_is_platform_admin BOOLEAN := FALSE;
BEGIN
  -- Check if user is platform super_admin (has all permissions)
  SELECT EXISTS (
    SELECT 1 FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = p_user_id
      AND r.name = 'super_admin'
      AND r.scope = 'platform'
  ) INTO v_is_platform_admin;

  IF v_is_platform_admin THEN
    RETURN TRUE;
  END IF;

  -- Check user's compliance role overrides
  FOR v_user_role IN
    SELECT role FROM forsured.compliance_user_role_overrides
    WHERE user_id = p_user_id
      AND (organization_id = p_organization_id OR organization_id IS NULL)
  LOOP
    -- Check if this role has the permission
    IF EXISTS (
      SELECT 1 FROM forsured.compliance_role_permissions
      WHERE role = v_user_role
        AND permission = p_permission
        AND (organization_id = p_organization_id OR organization_id IS NULL)
    ) THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  -- Check based on forsured user profile type
  SELECT
    CASE
      WHEN up.user_type = 'admin' THEN 'platform_admin'::forsured.compliance_system_role
      WHEN up.user_type = 'broker' THEN 'broker_admin'::forsured.compliance_system_role
      WHEN up.user_type = 'gc' THEN 'gc_admin'::forsured.compliance_system_role
      WHEN up.user_type = 'contractor' THEN 'subcontractor'::forsured.compliance_system_role
      ELSE 'viewer'::forsured.compliance_system_role
    END INTO v_user_role
  FROM forsured.user_profiles up
  WHERE up.scaffald_user_id = p_user_id;

  IF v_user_role IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM forsured.compliance_role_permissions
      WHERE role = v_user_role
        AND permission = p_permission
        AND (organization_id = p_organization_id OR organization_id IS NULL)
    ) INTO v_has_permission;
  END IF;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
