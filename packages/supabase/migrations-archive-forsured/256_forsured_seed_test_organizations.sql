-- Migration: Create organization-scoped roles needed for RLS
-- Purpose: Ensure organization-scoped roles exist for RLS policies
-- NOTE: Test user organizations are created by seed files (002_seed-organizations.sql)
--       to avoid duplication. This migration only creates the roles.

-- =========================================================
-- Create organization-scoped roles needed for RLS
-- =========================================================
-- These roles are required for RLS policies (e.g., task creation, project access)
-- Must exist before creating role_assignments

INSERT INTO core.roles (scope, name, description) VALUES
  ('organization', 'owner', 'Organization owner with full control'),
  ('organization', 'admin', 'Organization administrator with elevated privileges'),
  ('organization', 'member', 'Standard organization member')
ON CONFLICT (name) DO NOTHING;

-- NOTE: Test user organizations (test-gc, test-contractor, test-broker) are created
--       by seed file 002_seed-organizations.sql with IDs 60000000-0000-0000-0000-0000000000XX
--       This avoids duplication and ensures test data is only in seeds, not migrations.
