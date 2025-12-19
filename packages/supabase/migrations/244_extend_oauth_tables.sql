-- =========================================================
-- 244_extend_oauth_tables.sql
-- REQ-10 Task 3: Extend oauth_apps and oauth_scopes tables for enhanced OAuth features
-- Adds trust levels, admin approval workflow, RBAC integration, and additional app metadata
-- =========================================================

BEGIN;

-- =========================================================
-- Extend oauth_apps table
-- =========================================================

-- Drop existing status check constraint to add 'trusted' status
ALTER TABLE core.oauth_apps DROP CONSTRAINT IF EXISTS oauth_apps_status_check;

-- Add new columns for admin approval workflow and app metadata
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES core.users(id) ON DELETE SET NULL;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS terms_of_service_url TEXT;

-- Recreate status check constraint with 'trusted' status added
ALTER TABLE core.oauth_apps ADD CONSTRAINT oauth_apps_status_check 
  CHECK (status IN ('pending', 'active', 'trusted', 'suspended', 'revoked'));

-- Update existing 'active' apps to set requires_approval = false (they were pre-approved)
UPDATE core.oauth_apps 
SET requires_approval = false 
WHERE status = 'active' AND requires_approval = true;

-- Create index on approved_by for audit queries
CREATE INDEX IF NOT EXISTS idx_oauth_apps_approved_by ON core.oauth_apps(approved_by);

-- Comments for new columns
COMMENT ON COLUMN core.oauth_apps.requires_approval IS 'Whether app requires admin approval for elevated scopes (default true for self-registered apps)';
COMMENT ON COLUMN core.oauth_apps.approved_by IS 'User ID of admin who approved this app (NULL until approved)';
COMMENT ON COLUMN core.oauth_apps.approved_at IS 'Timestamp when app was approved by admin';
COMMENT ON COLUMN core.oauth_apps.privacy_policy_url IS 'URL to app privacy policy (shown on consent screen)';
COMMENT ON COLUMN core.oauth_apps.terms_of_service_url IS 'URL to app terms of service (shown on consent screen)';

-- =========================================================
-- Extend oauth_scopes table
-- =========================================================

-- Add RBAC integration columns
ALTER TABLE core.oauth_scopes ADD COLUMN IF NOT EXISTS rbac_permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE core.oauth_scopes ADD COLUMN IF NOT EXISTS requires_admin_approval BOOLEAN NOT NULL DEFAULT false;

-- Comments for new columns
COMMENT ON COLUMN core.oauth_scopes.rbac_permissions IS 'Array of RBAC permission names this scope maps to (e.g., ["read:projects", "write:projects"])';
COMMENT ON COLUMN core.oauth_scopes.requires_admin_approval IS 'Whether this scope requires admin approval for apps (true for sensitive/admin scopes)';

-- =========================================================
-- Update existing scope definitions with RBAC mappings
-- =========================================================

-- Update documents scopes
UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['read:documents']::TEXT[]
WHERE scope = 'documents:read';

UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['write:documents']::TEXT[]
WHERE scope = 'documents:write';

UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['delete:documents']::TEXT[]
WHERE scope = 'documents:delete';

-- Update profile scopes
UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['read:own_profile']::TEXT[]
WHERE scope = 'profile:read';

UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['write:own_profile']::TEXT[]
WHERE scope = 'profile:write';

-- Update organization scopes
UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['read:organizations']::TEXT[]
WHERE scope = 'organizations:read';

UPDATE core.oauth_scopes 
SET rbac_permissions = ARRAY['write:organizations']::TEXT[], requires_admin_approval = true
WHERE scope = 'organizations:write';

-- =========================================================
-- Insert new scope definitions required by REQ-10
-- =========================================================

-- OpenID Connect scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('openid', 'OpenID Connect', 'OpenID Connect authentication', 'general', false, false, ARRAY[]::TEXT[], false),
  ('profile', 'Basic Profile', 'Read basic profile information (name, avatar, username)', 'profile', false, false, ARRAY['read:own_profile']::TEXT[], false),
  ('email', 'Email Address', 'Read email address', 'profile', false, false, ARRAY['read:own_profile']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- User profile scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('read:user', 'Read User Profile', 'Read full user profile information', 'profile', true, false, ARRAY['read:own_profile', 'read:user_details']::TEXT[], false),
  ('write:user', 'Update User Profile', 'Update user profile information', 'profile', true, false, ARRAY['write:own_profile']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- Project scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('read:projects', 'Read Projects', 'Read project data', 'organizations', false, false, ARRAY['read:projects']::TEXT[], false),
  ('write:projects', 'Manage Projects', 'Create and update projects', 'organizations', true, false, ARRAY['write:projects']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- Job scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('read:jobs', 'Read Jobs', 'Read job postings', 'organizations', false, false, ARRAY['read:jobs']::TEXT[], false),
  ('write:jobs', 'Manage Jobs', 'Create and update job postings', 'organizations', true, false, ARRAY['write:jobs']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- Application scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('read:applications', 'Read Applications', 'Read job applications', 'organizations', true, false, ARRAY['read:applications']::TEXT[], false),
  ('write:applications', 'Manage Applications', 'Update job applications', 'organizations', true, false, ARRAY['write:applications']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- Team scopes
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('read:teams', 'Read Teams', 'Read team data', 'organizations', false, false, ARRAY['read:teams']::TEXT[], false),
  ('write:teams', 'Manage Teams', 'Create and update teams', 'organizations', true, false, ARRAY['write:teams']::TEXT[], false)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

-- Admin scope (requires admin approval)
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive, rbac_permissions, requires_admin_approval)
VALUES
  ('admin:*', 'Administrative Access', 'Full administrative access to all resources', 'admin', true, true, ARRAY['admin:all']::TEXT[], true)
ON CONFLICT (scope) DO UPDATE 
SET rbac_permissions = EXCLUDED.rbac_permissions,
    requires_admin_approval = EXCLUDED.requires_admin_approval;

COMMIT;

