-- Migration: Migrate core tables to forsured schema
-- REQ: REQ-211 - Database Schema Migration to forsured.*
-- Phase: 1 - Schema Migration
-- Date: 2025-01-14
-- Depends on: 003_create_forsured_schema.sql, 004_migrate_audit_log.sql

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration creates all core Forsured tables in the forsured schema with
-- cross-schema foreign keys to core.users and core.organizations.
--
-- Tables Created:
-- - forsured.projects (insurance project tracking)
-- - forsured.subcontractors (subcontractor registry)
-- - forsured.documents (document storage and tracking)
-- - forsured.policies (insurance policy data)
-- - forsured.endorsements (policy amendments)
-- - forsured.requirements (project insurance requirements)
-- - forsured.compliance_scores (compliance evaluation results)
-- - forsured.tasks (compliance tasks)
--
-- See: REQ-106 (Database Schema Design), /docs/FORSURED_ARCHITECTURE_MIGRATION_PLAN.md
-- =============================================================================

-- =============================================================================
-- 1. PROJECTS TABLE
-- =============================================================================

CREATE TABLE forsured.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,

  -- Cross-schema foreign keys to Scaffald
  scaffald_project_id UUID,
  CONSTRAINT fk_projects_scaffald_project
    FOREIGN KEY (scaffald_project_id)
    REFERENCES core.projects(id)
    ON DELETE SET NULL,

  organization_id UUID NOT NULL,
  CONSTRAINT fk_projects_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Project manager from Scaffald users
  manager_id UUID,
  CONSTRAINT fk_projects_manager
    FOREIGN KEY (manager_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for projects
CREATE INDEX idx_forsured_projects_scaffald_project ON forsured.projects(scaffald_project_id);
CREATE INDEX idx_forsured_projects_organization ON forsured.projects(organization_id);
CREATE INDEX idx_forsured_projects_manager ON forsured.projects(manager_id);
CREATE INDEX idx_forsured_projects_name ON forsured.projects(name);

-- Comments
COMMENT ON TABLE forsured.projects IS 'Insurance compliance projects linked to Scaffald projects';
COMMENT ON COLUMN forsured.projects.scaffald_project_id IS 'Optional reference to core.projects (cross-schema FK)';
COMMENT ON COLUMN forsured.projects.organization_id IS 'Organization that owns this project (references core.organizations)';
COMMENT ON COLUMN forsured.projects.manager_id IS 'Project manager (references core.users)';

-- =============================================================================
-- 2. SUBCONTRACTORS TABLE
-- =============================================================================

CREATE TABLE forsured.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,

  -- Cross-schema foreign key to Scaffald organization (for subcontractors who use Scaffald)
  scaffald_company_id UUID,
  CONSTRAINT fk_subcontractors_scaffald_company
    FOREIGN KEY (scaffald_company_id)
    REFERENCES core.organizations(id)
    ON DELETE SET NULL,

  organization_id UUID NOT NULL,
  CONSTRAINT fk_subcontractors_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Contact info for non-Scaffald subcontractors
  contact_info JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for subcontractors
CREATE INDEX idx_forsured_subcontractors_scaffald_company ON forsured.subcontractors(scaffald_company_id);
CREATE INDEX idx_forsured_subcontractors_organization ON forsured.subcontractors(organization_id);
CREATE INDEX idx_forsured_subcontractors_company ON forsured.subcontractors(company);
CREATE INDEX idx_forsured_subcontractors_name ON forsured.subcontractors(name);

-- Comments
COMMENT ON TABLE forsured.subcontractors IS 'Subcontractor registry with optional Scaffald company linkage';
COMMENT ON COLUMN forsured.subcontractors.scaffald_company_id IS 'Optional reference to core.organizations for subcontractors who use Uni-Construct';
COMMENT ON COLUMN forsured.subcontractors.contact_info IS 'JSONB with email, phone, address (for non-Scaffald subcontractors)';

-- =============================================================================
-- 3. DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE forsured.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships within forsured schema
  subcontractor_id UUID NOT NULL,
  CONSTRAINT fk_documents_subcontractor
    FOREIGN KEY (subcontractor_id)
    REFERENCES forsured.subcontractors(id)
    ON DELETE CASCADE,

  project_id UUID NOT NULL,
  CONSTRAINT fk_documents_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign keys to Scaffald
  organization_id UUID NOT NULL,
  CONSTRAINT fk_documents_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  uploader_id UUID,
  CONSTRAINT fk_documents_uploader
    FOREIGN KEY (uploader_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Document data
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Processing status
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'error')),
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for documents
CREATE INDEX idx_forsured_documents_subcontractor ON forsured.documents(subcontractor_id);
CREATE INDEX idx_forsured_documents_project ON forsured.documents(project_id);
CREATE INDEX idx_forsured_documents_organization ON forsured.documents(organization_id);
CREATE INDEX idx_forsured_documents_uploader ON forsured.documents(uploader_id);
CREATE INDEX idx_forsured_documents_status ON forsured.documents(status);
CREATE INDEX idx_forsured_documents_upload_date ON forsured.documents(upload_date DESC);

-- Composite index for common query pattern
CREATE INDEX idx_forsured_documents_project_sub ON forsured.documents(project_id, subcontractor_id);

-- Comments
COMMENT ON TABLE forsured.documents IS 'Insurance documents (COIs, policies, etc.) uploaded by users';
COMMENT ON COLUMN forsured.documents.uploader_id IS 'User who uploaded this document (references core.users)';
COMMENT ON COLUMN forsured.documents.organization_id IS 'Organization that owns this document (references core.organizations)';

-- =============================================================================
-- 4. POLICIES TABLE
-- =============================================================================

CREATE TABLE forsured.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship to document
  document_id UUID NOT NULL,
  CONSTRAINT fk_policies_document
    FOREIGN KEY (document_id)
    REFERENCES forsured.documents(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign key
  organization_id UUID NOT NULL,
  CONSTRAINT fk_policies_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Policy identification
  policy_number TEXT UNIQUE NOT NULL,
  carrier TEXT NOT NULL,

  -- Coverage details
  coverage_type TEXT NOT NULL CHECK (coverage_type IN (
    'general_liability',
    'workers_comp',
    'umbrella',
    'auto',
    'professional_liability'
  )),
  coverage_amount NUMERIC(15, 2) NOT NULL,
  aggregate_limit NUMERIC(15, 2),
  per_occurrence_limit NUMERIC(15, 2),

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CONSTRAINT chk_policy_dates CHECK (end_date > start_date),

  -- Certificate holder
  certificate_holder TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for policies
CREATE UNIQUE INDEX idx_forsured_policies_number ON forsured.policies(policy_number);
CREATE INDEX idx_forsured_policies_document ON forsured.policies(document_id);
CREATE INDEX idx_forsured_policies_organization ON forsured.policies(organization_id);
CREATE INDEX idx_forsured_policies_coverage_type ON forsured.policies(coverage_type);
CREATE INDEX idx_forsured_policies_carrier ON forsured.policies(carrier);
CREATE INDEX idx_forsured_policies_dates ON forsured.policies(start_date, end_date);

-- Comments
COMMENT ON TABLE forsured.policies IS 'Insurance policy data extracted from documents';
COMMENT ON COLUMN forsured.policies.coverage_type IS 'Type of coverage: general_liability, workers_comp, umbrella, auto, professional_liability';
COMMENT ON COLUMN forsured.policies.coverage_amount IS 'Total coverage amount in USD';

-- =============================================================================
-- 5. ENDORSEMENTS TABLE
-- =============================================================================

CREATE TABLE forsured.endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship to policy
  policy_id UUID NOT NULL,
  CONSTRAINT fk_endorsements_policy
    FOREIGN KEY (policy_id)
    REFERENCES forsured.policies(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign key
  organization_id UUID NOT NULL,
  CONSTRAINT fk_endorsements_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Endorsement details
  type TEXT NOT NULL CHECK (type IN (
    'additional_insured',
    'waiver_of_subrogation',
    'primary_non_contributory',
    'notice_of_cancellation',
    'other'
  )),
  details JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for endorsements
CREATE INDEX idx_forsured_endorsements_policy ON forsured.endorsements(policy_id);
CREATE INDEX idx_forsured_endorsements_organization ON forsured.endorsements(organization_id);
CREATE INDEX idx_forsured_endorsements_type ON forsured.endorsements(type);

-- Comments
COMMENT ON TABLE forsured.endorsements IS 'Policy endorsements and amendments';
COMMENT ON COLUMN forsured.endorsements.type IS 'Type of endorsement: additional_insured, waiver_of_subrogation, etc.';
COMMENT ON COLUMN forsured.endorsements.details IS 'Endorsement-specific details in JSONB format';

-- =============================================================================
-- 6. REQUIREMENTS TABLE
-- =============================================================================

CREATE TABLE forsured.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship to project
  project_id UUID NOT NULL,
  CONSTRAINT fk_requirements_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign key
  organization_id UUID NOT NULL,
  CONSTRAINT fk_requirements_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Requirement details
  coverage_type TEXT NOT NULL CHECK (coverage_type IN (
    'general_liability',
    'workers_comp',
    'umbrella',
    'auto',
    'professional_liability'
  )),
  minimum_amount NUMERIC(15, 2) NOT NULL,
  endorsements_required TEXT[] DEFAULT ARRAY[]::TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for requirements
CREATE INDEX idx_forsured_requirements_project ON forsured.requirements(project_id);
CREATE INDEX idx_forsured_requirements_organization ON forsured.requirements(organization_id);
CREATE INDEX idx_forsured_requirements_coverage_type ON forsured.requirements(coverage_type);

-- Comments
COMMENT ON TABLE forsured.requirements IS 'Insurance requirements for projects';
COMMENT ON COLUMN forsured.requirements.minimum_amount IS 'Minimum coverage amount required in USD';
COMMENT ON COLUMN forsured.requirements.endorsements_required IS 'Array of required endorsement types';

-- =============================================================================
-- 7. COMPLIANCE SCORES TABLE
-- =============================================================================

CREATE TABLE forsured.compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships within forsured schema
  project_id UUID NOT NULL,
  CONSTRAINT fk_compliance_scores_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  subcontractor_id UUID NOT NULL,
  CONSTRAINT fk_compliance_scores_subcontractor
    FOREIGN KEY (subcontractor_id)
    REFERENCES forsured.subcontractors(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign key
  organization_id UUID NOT NULL,
  CONSTRAINT fk_compliance_scores_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Score data
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('compliant', 'warning', 'critical')),
  gaps JSONB DEFAULT '[]'::jsonb,

  last_evaluated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for compliance_scores
CREATE INDEX idx_forsured_compliance_scores_project ON forsured.compliance_scores(project_id);
CREATE INDEX idx_forsured_compliance_scores_subcontractor ON forsured.compliance_scores(subcontractor_id);
CREATE INDEX idx_forsured_compliance_scores_organization ON forsured.compliance_scores(organization_id);
CREATE INDEX idx_forsured_compliance_scores_status ON forsured.compliance_scores(status);
CREATE INDEX idx_forsured_compliance_scores_score ON forsured.compliance_scores(score);

-- Composite index for common query pattern
CREATE INDEX idx_forsured_compliance_scores_project_sub ON forsured.compliance_scores(project_id, subcontractor_id);

-- Comments
COMMENT ON TABLE forsured.compliance_scores IS 'Compliance evaluation results for subcontractors on projects';
COMMENT ON COLUMN forsured.compliance_scores.score IS 'Compliance score from 0-100';
COMMENT ON COLUMN forsured.compliance_scores.gaps IS 'Array of compliance gaps in JSONB format';

-- =============================================================================
-- 8. TASKS TABLE
-- =============================================================================

CREATE TABLE forsured.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships within forsured schema
  project_id UUID NOT NULL,
  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  subcontractor_id UUID,
  CONSTRAINT fk_tasks_subcontractor
    FOREIGN KEY (subcontractor_id)
    REFERENCES forsured.subcontractors(id)
    ON DELETE CASCADE,

  -- Cross-schema foreign keys to Scaffald
  organization_id UUID NOT NULL,
  CONSTRAINT fk_tasks_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  assigned_to_user_id UUID,
  CONSTRAINT fk_tasks_assigned_to
    FOREIGN KEY (assigned_to_user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for tasks
CREATE INDEX idx_forsured_tasks_project ON forsured.tasks(project_id);
CREATE INDEX idx_forsured_tasks_subcontractor ON forsured.tasks(subcontractor_id);
CREATE INDEX idx_forsured_tasks_organization ON forsured.tasks(organization_id);
CREATE INDEX idx_forsured_tasks_assigned_to ON forsured.tasks(assigned_to_user_id);
CREATE INDEX idx_forsured_tasks_status ON forsured.tasks(status);

-- Composite index for common query pattern
CREATE INDEX idx_forsured_tasks_project_status ON forsured.tasks(project_id, status);
CREATE INDEX idx_forsured_tasks_assigned_status ON forsured.tasks(assigned_to_user_id, status);

-- Comments
COMMENT ON TABLE forsured.tasks IS 'Compliance-related tasks for projects and subcontractors';
COMMENT ON COLUMN forsured.tasks.assigned_to_user_id IS 'User assigned to this task (references core.users)';

-- =============================================================================
-- 9. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions for all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.subcontractors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.endorsements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.compliance_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.tasks TO authenticated;

-- Grant all to service_role
GRANT ALL ON forsured.projects TO service_role;
GRANT ALL ON forsured.subcontractors TO service_role;
GRANT ALL ON forsured.documents TO service_role;
GRANT ALL ON forsured.policies TO service_role;
GRANT ALL ON forsured.endorsements TO service_role;
GRANT ALL ON forsured.requirements TO service_role;
GRANT ALL ON forsured.compliance_scores TO service_role;
GRANT ALL ON forsured.tasks TO service_role;

-- =============================================================================
-- 10. DATA MIGRATION (IF TABLES EXIST IN PUBLIC SCHEMA)
-- =============================================================================

-- Check if tables exist in public schema and copy data if they do
-- This is a safe operation that won't fail if tables don't exist

DO $$
BEGIN
  -- Projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    INSERT INTO forsured.projects SELECT * FROM public.projects;
    RAISE NOTICE '✅ Migrated % rows from public.projects', (SELECT COUNT(*) FROM public.projects);
  END IF;

  -- Subcontractors
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subcontractors') THEN
    INSERT INTO forsured.subcontractors SELECT * FROM public.subcontractors;
    RAISE NOTICE '✅ Migrated % rows from public.subcontractors', (SELECT COUNT(*) FROM public.subcontractors);
  END IF;

  -- Documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    INSERT INTO forsured.documents SELECT * FROM public.documents;
    RAISE NOTICE '✅ Migrated % rows from public.documents', (SELECT COUNT(*) FROM public.documents);
  END IF;

  -- Policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'policies') THEN
    INSERT INTO forsured.policies SELECT * FROM public.policies;
    RAISE NOTICE '✅ Migrated % rows from public.policies', (SELECT COUNT(*) FROM public.policies);
  END IF;

  -- Endorsements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'endorsements') THEN
    INSERT INTO forsured.endorsements SELECT * FROM public.endorsements;
    RAISE NOTICE '✅ Migrated % rows from public.endorsements', (SELECT COUNT(*) FROM public.endorsements);
  END IF;

  -- Requirements
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requirements') THEN
    INSERT INTO forsured.requirements SELECT * FROM public.requirements;
    RAISE NOTICE '✅ Migrated % rows from public.requirements', (SELECT COUNT(*) FROM public.requirements);
  END IF;

  -- Compliance Scores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_scores') THEN
    INSERT INTO forsured.compliance_scores SELECT * FROM public.compliance_scores;
    RAISE NOTICE '✅ Migrated % rows from public.compliance_scores', (SELECT COUNT(*) FROM public.compliance_scores);
  END IF;

  -- Tasks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    INSERT INTO forsured.tasks SELECT * FROM public.tasks;
    RAISE NOTICE '✅ Migrated % rows from public.tasks', (SELECT COUNT(*) FROM public.tasks);
  END IF;

  RAISE NOTICE '✅ Core tables migration complete';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'REQ-211 Core Tables Migration (005) applied - all core tables created in forsured schema with cross-schema FKs';
