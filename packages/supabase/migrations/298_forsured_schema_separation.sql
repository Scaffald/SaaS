-- =========================================================
-- 298_forsured_schema_separation.sql
-- ForSured Schema Separation: Create forsured-owned tables
-- and repoint all FKs from core.* to forsured.*
-- =========================================================
-- This migration:
-- 1. Creates forsured.users, organizations, roles, role_assignments
-- 2. Creates forsured.generic_invitations, invitation_rules, user_relationships
-- 3. Creates forsured CCPA tables (ccpa_requests, ccpa_request_history, ccpa_oauth_app_registry, oauth_apps)
-- 4. Drops all FKs from forsured.* tables to core.* tables
-- 5. Recreates FKs pointing to forsured.* equivalents
-- 6. Enables RLS on forsured.user_profiles (was missing)
-- 7. Adds RLS policies to all new tables
-- =========================================================

BEGIN;

-- =========================================================
-- PHASE 1: CREATE NEW FORSURED TABLES
-- =========================================================

-- ---------------------------------------------------------
-- 1a. forsured.organizations (must come before users due to FK)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_user_id UUID, -- FK added after forsured.users is created
  description JSONB,
  address JSONB,
  website TEXT,
  logo_url TEXT,
  visibility TEXT DEFAULT 'private',
  scaffald_company_id TEXT, -- optional Scaffald sync link (no FK)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.organizations IS 'ForSured-owned organizations table (replaces core.organizations for ForSured)';

-- ---------------------------------------------------------
-- 1b. forsured.users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  display_name TEXT,
  username TEXT,
  slug TEXT,
  full_name TEXT,
  role TEXT, -- admin, manager, broker, subcontractor, user
  company TEXT,
  avatar TEXT,
  avatar_url TEXT,
  broker_role TEXT,
  organization_id UUID REFERENCES forsured.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.users IS 'ForSured-owned users table (replaces core.users for ForSured)';

-- Add owner FK on organizations now that users exists
ALTER TABLE forsured.organizations
  ADD CONSTRAINT fk_organizations_owner
  FOREIGN KEY (owner_user_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_forsured_users_email ON forsured.users(email);
CREATE INDEX IF NOT EXISTS idx_forsured_users_organization ON forsured.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_forsured_users_role ON forsured.users(role);

-- Indexes for organizations
CREATE INDEX IF NOT EXISTS idx_forsured_organizations_slug ON forsured.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_forsured_organizations_owner ON forsured.organizations(owner_user_id);

-- ---------------------------------------------------------
-- 1c. forsured.roles
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL, -- platform, organization, team
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.roles IS 'ForSured role definitions';

-- ---------------------------------------------------------
-- 1d. forsured.role_assignments
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES forsured.roles(id) ON DELETE CASCADE,
  role_type TEXT, -- for direct type checks without join
  user_id UUID NOT NULL REFERENCES forsured.users(id) ON DELETE CASCADE,
  scope_org_id UUID REFERENCES forsured.organizations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES forsured.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.role_assignments IS 'ForSured user-role-organization assignments';

CREATE INDEX IF NOT EXISTS idx_forsured_role_assignments_user ON forsured.role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_forsured_role_assignments_org ON forsured.role_assignments(scope_org_id);

-- ---------------------------------------------------------
-- 1e. forsured.invitation_rules
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.invitation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- one-to-one, one-to-many, one-to-many-via-project
  name TEXT NOT NULL,
  description TEXT,
  requires_project BOOLEAN DEFAULT false,
  constraint_message TEXT,
  allow_referral_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.invitation_rules IS 'Rules governing invitation types and constraints';

-- ---------------------------------------------------------
-- 1f. forsured.generic_invitations
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.generic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES forsured.invitation_rules(id) ON DELETE SET NULL,
  inviter_id UUID REFERENCES forsured.users(id) ON DELETE SET NULL,
  inviter_organization_id UUID REFERENCES forsured.organizations(id) ON DELETE SET NULL,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invitee_user_id UUID REFERENCES forsured.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES forsured.projects(id) ON DELETE SET NULL,
  referral_code TEXT,
  personal_message TEXT,
  is_referral BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  constraint_blocked BOOLEAN DEFAULT false,
  constraint_reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.generic_invitations IS 'Generic invitation system for all ForSured relationship types';

CREATE INDEX IF NOT EXISTS idx_forsured_invitations_email ON forsured.generic_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_forsured_invitations_inviter ON forsured.generic_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_forsured_invitations_status ON forsured.generic_invitations(status);
CREATE INDEX IF NOT EXISTS idx_forsured_invitations_referral ON forsured.generic_invitations(referral_code);

-- ---------------------------------------------------------
-- 1g. forsured.user_relationships
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS forsured.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id UUID NOT NULL REFERENCES forsured.users(id) ON DELETE CASCADE,
  source_organization_id UUID REFERENCES forsured.organizations(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL REFERENCES forsured.users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  invitation_id UUID REFERENCES forsured.generic_invitations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active', -- active, removed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.user_relationships IS 'User-to-user relationships (broker-client, etc.)';

CREATE INDEX IF NOT EXISTS idx_forsured_user_rels_source ON forsured.user_relationships(source_user_id);
CREATE INDEX IF NOT EXISTS idx_forsured_user_rels_target ON forsured.user_relationships(target_user_id);
CREATE INDEX IF NOT EXISTS idx_forsured_user_rels_type ON forsured.user_relationships(relationship_type);

-- ---------------------------------------------------------
-- 1h. CCPA Tables
-- ---------------------------------------------------------

-- Create enum types in forsured schema
DO $$ BEGIN
  CREATE TYPE forsured.ccpa_request_type AS ENUM (
    'access', 'deletion', 'correction', 'opt_out', 'opt_in', 'portability'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forsured.ccpa_request_status AS ENUM (
    'pending', 'in_progress', 'completed', 'denied', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forsured.ccpa_verification_method AS ENUM (
    'email', 'enhanced', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- forsured.ccpa_requests
CREATE TABLE IF NOT EXISTS forsured.ccpa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type forsured.ccpa_request_type NOT NULL,
  status forsured.ccpa_request_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  extended_deadline_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  denial_reason TEXT,
  verification_method forsured.ccpa_verification_method NOT NULL DEFAULT 'email',
  verification_completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.ccpa_requests IS 'CCPA data subject requests for ForSured';

CREATE INDEX IF NOT EXISTS idx_forsured_ccpa_requests_user ON forsured.ccpa_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_forsured_ccpa_requests_status ON forsured.ccpa_requests(status);
CREATE INDEX IF NOT EXISTS idx_forsured_ccpa_requests_deadline ON forsured.ccpa_requests(deadline_at);

-- forsured.ccpa_request_history
CREATE TABLE IF NOT EXISTS forsured.ccpa_request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES forsured.ccpa_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE forsured.ccpa_request_history IS 'Audit trail for CCPA request status changes';

CREATE INDEX IF NOT EXISTS idx_forsured_ccpa_history_request ON forsured.ccpa_request_history(request_id);

-- forsured.oauth_apps
CREATE TABLE IF NOT EXISTS forsured.oauth_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  redirect_uris TEXT[],
  allowed_scopes TEXT[],
  owner_email TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  homepage_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.oauth_apps IS 'ForSured OAuth app registry';

-- forsured.ccpa_oauth_app_registry
CREATE TABLE IF NOT EXISTS forsured.ccpa_oauth_app_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  app_name TEXT,
  data_categories JSONB DEFAULT '[]',
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE forsured.ccpa_oauth_app_registry IS 'CCPA configuration for ForSured OAuth apps';

-- =========================================================
-- PHASE 1.5: POPULATE NEW TABLES FROM CORE (for FK satisfaction)
-- =========================================================
-- Existing forsured.* tables (audit_log, tasks, projects, etc.) already
-- have data referencing core.users(id) and core.organizations(id).
-- Before repointing FKs to forsured.users/organizations, we must
-- copy the referenced data so FK constraints succeed.
-- =========================================================

-- Copy users from core.users into forsured.users
-- Note: core.users does NOT have an email column; email lives in auth.users
INSERT INTO forsured.users (id, email, name, display_name, username, slug, role, created_at, updated_at)
SELECT cu.id,
       COALESCE(au.email, 'unknown@local'),
       cu.display_name,
       cu.display_name,
       cu.username,
       cu.slug,
       'user',
       cu.created_at,
       cu.updated_at
FROM core.users cu
LEFT JOIN auth.users au ON au.id = cu.id
ON CONFLICT (id) DO NOTHING;

-- Copy organizations from core.organizations into forsured.organizations
INSERT INTO forsured.organizations (id, name, slug, owner_user_id, website, created_at, updated_at)
SELECT id, name, slug, owner_user_id, website, created_at, updated_at
FROM core.organizations
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PHASE 2: DROP OLD FKs AND RECREATE POINTING TO FORSURED
-- =========================================================

-- ---------------------------------------------------------
-- Drop FKs from migration 203 (audit_log)
-- ---------------------------------------------------------
ALTER TABLE forsured.audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_user;
ALTER TABLE forsured.audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_impersonated_by;
ALTER TABLE forsured.audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_organization;

-- Recreate pointing to forsured
ALTER TABLE forsured.audit_log
  ADD CONSTRAINT fk_audit_log_user
  FOREIGN KEY (user_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

ALTER TABLE forsured.audit_log
  ADD CONSTRAINT fk_audit_log_impersonated_by
  FOREIGN KEY (impersonated_by_user_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

ALTER TABLE forsured.audit_log
  ADD CONSTRAINT fk_audit_log_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE SET NULL;

-- ---------------------------------------------------------
-- Drop FKs from migration 204 (projects, subcontractors, documents, etc.)
-- ---------------------------------------------------------

-- forsured.projects
ALTER TABLE forsured.projects DROP CONSTRAINT IF EXISTS fk_projects_organization;
ALTER TABLE forsured.projects DROP CONSTRAINT IF EXISTS fk_projects_manager;
ALTER TABLE forsured.projects DROP CONSTRAINT IF EXISTS fk_projects_scaffald_project;

ALTER TABLE forsured.projects
  ADD CONSTRAINT fk_projects_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

ALTER TABLE forsured.projects
  ADD CONSTRAINT fk_projects_manager
  FOREIGN KEY (manager_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

-- scaffald_project_id: drop FK, keep column (optional integration link, no FK)

-- forsured.subcontractors
ALTER TABLE forsured.subcontractors DROP CONSTRAINT IF EXISTS fk_subcontractors_organization;
ALTER TABLE forsured.subcontractors DROP CONSTRAINT IF EXISTS fk_subcontractors_scaffald_company;

ALTER TABLE forsured.subcontractors
  ADD CONSTRAINT fk_subcontractors_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

-- scaffald_company_id: drop FK, keep column (optional integration link, no FK)

-- forsured.documents
ALTER TABLE forsured.documents DROP CONSTRAINT IF EXISTS fk_documents_organization;
ALTER TABLE forsured.documents DROP CONSTRAINT IF EXISTS fk_documents_uploader;

ALTER TABLE forsured.documents
  ADD CONSTRAINT fk_documents_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

ALTER TABLE forsured.documents
  ADD CONSTRAINT fk_documents_uploader
  FOREIGN KEY (uploader_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

-- forsured.policies
ALTER TABLE forsured.policies DROP CONSTRAINT IF EXISTS fk_policies_organization;

ALTER TABLE forsured.policies
  ADD CONSTRAINT fk_policies_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

-- forsured.endorsements
ALTER TABLE forsured.endorsements DROP CONSTRAINT IF EXISTS fk_endorsements_organization;

ALTER TABLE forsured.endorsements
  ADD CONSTRAINT fk_endorsements_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

-- forsured.requirements
ALTER TABLE forsured.requirements DROP CONSTRAINT IF EXISTS fk_requirements_organization;

ALTER TABLE forsured.requirements
  ADD CONSTRAINT fk_requirements_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

-- forsured.compliance_scores
ALTER TABLE forsured.compliance_scores DROP CONSTRAINT IF EXISTS fk_compliance_scores_organization;

ALTER TABLE forsured.compliance_scores
  ADD CONSTRAINT fk_compliance_scores_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

-- forsured.tasks
ALTER TABLE forsured.tasks DROP CONSTRAINT IF EXISTS fk_tasks_organization;
ALTER TABLE forsured.tasks DROP CONSTRAINT IF EXISTS fk_tasks_assigned_to;
ALTER TABLE forsured.tasks DROP CONSTRAINT IF EXISTS fk_tasks_created_by;

ALTER TABLE forsured.tasks
  ADD CONSTRAINT fk_tasks_organization
  FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

ALTER TABLE forsured.tasks
  ADD CONSTRAINT fk_tasks_assigned_to
  FOREIGN KEY (assigned_to_user_id) REFERENCES forsured.users(id) ON DELETE SET NULL;

-- Only add created_by FK if column exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured' AND table_name = 'tasks' AND column_name = 'created_by_user_id')
  THEN
    ALTER TABLE forsured.tasks
      ADD CONSTRAINT fk_tasks_created_by
      FOREIGN KEY (created_by_user_id) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 233 (compliance_requirements)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'compliance_requirements')
  THEN
    ALTER TABLE forsured.compliance_requirements DROP CONSTRAINT IF EXISTS fk_compliance_requirements_organization;
    ALTER TABLE forsured.compliance_requirements DROP CONSTRAINT IF EXISTS fk_compliance_requirements_created_by;

    ALTER TABLE forsured.compliance_requirements
      ADD CONSTRAINT fk_compliance_requirements_organization
      FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

    ALTER TABLE forsured.compliance_requirements
      ADD CONSTRAINT fk_compliance_requirements_created_by
      FOREIGN KEY (created_by) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 234 (compliance_requirement_versions)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'compliance_requirement_versions')
  THEN
    ALTER TABLE forsured.compliance_requirement_versions DROP CONSTRAINT IF EXISTS fk_versions_changed_by;

    ALTER TABLE forsured.compliance_requirement_versions
      ADD CONSTRAINT fk_versions_changed_by
      FOREIGN KEY (changed_by) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 235 (requirement_dependencies)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'requirement_dependencies')
  THEN
    ALTER TABLE forsured.requirement_dependencies DROP CONSTRAINT IF EXISTS fk_dependencies_created_by;

    ALTER TABLE forsured.requirement_dependencies
      ADD CONSTRAINT fk_dependencies_created_by
      FOREIGN KEY (created_by) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 260 (broker_clients)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'broker_clients')
  THEN
    ALTER TABLE forsured.broker_clients DROP CONSTRAINT IF EXISTS fk_broker_clients_broker_org;
    ALTER TABLE forsured.broker_clients DROP CONSTRAINT IF EXISTS fk_broker_clients_client_org;

    ALTER TABLE forsured.broker_clients
      ADD CONSTRAINT fk_broker_clients_broker_org
      FOREIGN KEY (broker_org_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

    ALTER TABLE forsured.broker_clients
      ADD CONSTRAINT fk_broker_clients_client_org
      FOREIGN KEY (client_org_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 261 (compliance_records)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'compliance_records')
  THEN
    ALTER TABLE forsured.compliance_records DROP CONSTRAINT IF EXISTS fk_compliance_records_org;
    ALTER TABLE forsured.compliance_records DROP CONSTRAINT IF EXISTS fk_compliance_records_client;
    ALTER TABLE forsured.compliance_records DROP CONSTRAINT IF EXISTS fk_compliance_records_reviewer;

    ALTER TABLE forsured.compliance_records
      ADD CONSTRAINT fk_compliance_records_org
      FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

    ALTER TABLE forsured.compliance_records
      ADD CONSTRAINT fk_compliance_records_client
      FOREIGN KEY (client_org_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

    ALTER TABLE forsured.compliance_records
      ADD CONSTRAINT fk_compliance_records_reviewer
      FOREIGN KEY (reviewer_id) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- Drop FKs from migration 262 (project_requirements)
-- ---------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'project_requirements')
  THEN
    ALTER TABLE forsured.project_requirements DROP CONSTRAINT IF EXISTS fk_project_requirements_organization;
    ALTER TABLE forsured.project_requirements DROP CONSTRAINT IF EXISTS fk_project_requirements_evaluator;

    ALTER TABLE forsured.project_requirements
      ADD CONSTRAINT fk_project_requirements_organization
      FOREIGN KEY (organization_id) REFERENCES forsured.organizations(id) ON DELETE CASCADE;

    ALTER TABLE forsured.project_requirements
      ADD CONSTRAINT fk_project_requirements_evaluator
      FOREIGN KEY (evaluator_id) REFERENCES forsured.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================
-- PHASE 3: ENABLE RLS ON ALL NEW TABLES + user_profiles
-- =========================================================

-- Enable RLS on user_profiles (if table exists from migration 221)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured' AND table_name = 'user_profiles')
  THEN
    ALTER TABLE forsured.user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE forsured.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.invitation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.generic_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.ccpa_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.ccpa_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.oauth_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.ccpa_oauth_app_registry ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- RLS Policies: Service role bypass (for tRPC server)
-- ---------------------------------------------------------
CREATE POLICY service_role_bypass_users ON forsured.users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_organizations ON forsured.organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_roles ON forsured.roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_role_assignments ON forsured.role_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_invitation_rules ON forsured.invitation_rules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_generic_invitations ON forsured.generic_invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_user_relationships ON forsured.user_relationships
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_ccpa_requests ON forsured.ccpa_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_ccpa_request_history ON forsured.ccpa_request_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_oauth_apps ON forsured.oauth_apps
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_bypass_ccpa_oauth_app_registry ON forsured.ccpa_oauth_app_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------
-- RLS Policies: Authenticated user access
-- ---------------------------------------------------------

-- Users: authenticated users can read all users, update own
CREATE POLICY users_select ON forsured.users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY users_update_own ON forsured.users
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Organizations: authenticated can read all, members can update
CREATE POLICY organizations_select ON forsured.organizations
  FOR SELECT TO authenticated USING (true);

-- Roles: read-only for authenticated
CREATE POLICY roles_select ON forsured.roles
  FOR SELECT TO authenticated USING (true);

-- Role assignments: read-only for authenticated
CREATE POLICY role_assignments_select ON forsured.role_assignments
  FOR SELECT TO authenticated USING (true);

-- Invitation rules: read-only for authenticated
CREATE POLICY invitation_rules_select ON forsured.invitation_rules
  FOR SELECT TO authenticated USING (true);

-- Generic invitations: users can see their own
CREATE POLICY invitations_select_own ON forsured.generic_invitations
  FOR SELECT TO authenticated
  USING (inviter_id = auth.uid() OR invitee_user_id = auth.uid());

CREATE POLICY invitations_insert ON forsured.generic_invitations
  FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());

-- User relationships: users can see their own
CREATE POLICY relationships_select_own ON forsured.user_relationships
  FOR SELECT TO authenticated
  USING (source_user_id = auth.uid() OR target_user_id = auth.uid());

-- CCPA: users can see their own requests
CREATE POLICY ccpa_requests_select_own ON forsured.ccpa_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- OAuth apps: read-only for authenticated
CREATE POLICY oauth_apps_select ON forsured.oauth_apps
  FOR SELECT TO authenticated USING (true);

-- CCPA app registry: read-only for authenticated
CREATE POLICY ccpa_app_registry_select ON forsured.ccpa_oauth_app_registry
  FOR SELECT TO authenticated USING (true);

-- =========================================================
-- PHASE 4: GRANT SCHEMA ACCESS
-- =========================================================

-- Ensure PostgREST (authenticator/anon/authenticated) can access new tables
GRANT USAGE ON SCHEMA forsured TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA forsured TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA forsured TO authenticated;
GRANT INSERT, UPDATE, DELETE ON forsured.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON forsured.organizations TO authenticated;
GRANT INSERT, UPDATE ON forsured.role_assignments TO authenticated;
GRANT INSERT, UPDATE ON forsured.generic_invitations TO authenticated;
GRANT INSERT, UPDATE ON forsured.user_relationships TO authenticated;
GRANT INSERT ON forsured.ccpa_requests TO authenticated;

COMMIT;
