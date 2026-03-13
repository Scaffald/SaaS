-- Migration: 262_forsured_create_project_requirements.sql
-- Description: Junction table linking projects to compliance requirements with fulfillment tracking
-- REQ: Enable proving which requirements are met per project with evidence
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- PROJECT REQUIREMENTS JUNCTION TABLE
-- =============================================================================
-- Links projects to their compliance requirements with tracking for:
-- - Whether requirements are met
-- - Evidence (documents/policies) that prove compliance
-- - Override values for project-specific thresholds
-- - Evaluation history
--
-- Note: This is different from forsured.requirements which defines requirement
-- templates per project. This table tracks actual compliance status.
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project reference
  project_id UUID NOT NULL,
  CONSTRAINT fk_project_requirements_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  -- Requirement reference (from compliance_requirements table)
  requirement_id UUID NOT NULL,
  CONSTRAINT fk_project_requirements_requirement
    FOREIGN KEY (requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Organization reference (denormalized for RLS performance)
  organization_id UUID NOT NULL,
  CONSTRAINT fk_project_requirements_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Status
  is_required BOOLEAN DEFAULT true,
  is_met BOOLEAN DEFAULT false,

  -- Override values (project can have different thresholds than template)
  minimum_amount_override NUMERIC(15, 2),
  override_notes TEXT,

  -- Evidence tracking
  met_by_document_id UUID,
  CONSTRAINT fk_project_requirements_document
    FOREIGN KEY (met_by_document_id)
    REFERENCES forsured.documents(id)
    ON DELETE SET NULL,

  met_by_policy_id UUID,
  CONSTRAINT fk_project_requirements_policy
    FOREIGN KEY (met_by_policy_id)
    REFERENCES forsured.policies(id)
    ON DELETE SET NULL,

  -- Evaluation tracking
  last_evaluated_at TIMESTAMPTZ,
  evaluated_by_user_id UUID,
  CONSTRAINT fk_project_requirements_evaluator
    FOREIGN KEY (evaluated_by_user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  evaluation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint - each requirement can only be linked once per project
  CONSTRAINT unique_project_requirement UNIQUE (project_id, requirement_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_project_requirements_project ON forsured.project_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_project_requirements_requirement ON forsured.project_requirements(requirement_id);
CREATE INDEX IF NOT EXISTS idx_project_requirements_organization ON forsured.project_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_requirements_is_met ON forsured.project_requirements(is_met);
CREATE INDEX IF NOT EXISTS idx_project_requirements_is_required ON forsured.project_requirements(is_required);
CREATE INDEX IF NOT EXISTS idx_project_requirements_document ON forsured.project_requirements(met_by_document_id) WHERE met_by_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_requirements_policy ON forsured.project_requirements(met_by_policy_id) WHERE met_by_policy_id IS NOT NULL;

-- Composite index for common query: find unmet required items per project
CREATE INDEX IF NOT EXISTS idx_project_requirements_unmet ON forsured.project_requirements(project_id, is_met)
  WHERE is_required = true AND is_met = false;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.project_requirements ENABLE ROW LEVEL SECURITY;

-- Users can view project requirements for projects in their organization
CREATE POLICY "Users can view project requirements in their org"
  ON forsured.project_requirements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can create project requirements for projects in their organization
CREATE POLICY "Users can create project requirements in their org"
  ON forsured.project_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can update project requirements for projects in their organization
CREATE POLICY "Users can update project requirements in their org"
  ON forsured.project_requirements
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can delete project requirements for projects in their organization
CREATE POLICY "Users can delete project requirements in their org"
  ON forsured.project_requirements
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to project_requirements"
  ON forsured.project_requirements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.project_requirements TO authenticated;
GRANT ALL ON forsured.project_requirements TO service_role;

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_project_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_requirements_updated_at ON forsured.project_requirements;

CREATE TRIGGER trg_project_requirements_updated_at
  BEFORE UPDATE ON forsured.project_requirements
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_project_requirements_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.project_requirements IS 'Links projects to their compliance requirements with fulfillment tracking';
COMMENT ON COLUMN forsured.project_requirements.project_id IS 'Reference to the project';
COMMENT ON COLUMN forsured.project_requirements.requirement_id IS 'Reference to the compliance requirement';
COMMENT ON COLUMN forsured.project_requirements.is_required IS 'Whether this requirement is mandatory for the project';
COMMENT ON COLUMN forsured.project_requirements.is_met IS 'Whether this requirement has been satisfied';
COMMENT ON COLUMN forsured.project_requirements.minimum_amount_override IS 'Project-specific override for minimum coverage amount';
COMMENT ON COLUMN forsured.project_requirements.met_by_document_id IS 'Document that proves this requirement is met';
COMMENT ON COLUMN forsured.project_requirements.met_by_policy_id IS 'Policy that proves this requirement is met';
COMMENT ON COLUMN forsured.project_requirements.last_evaluated_at IS 'When this requirement was last evaluated';
COMMENT ON COLUMN forsured.project_requirements.evaluated_by_user_id IS 'User who last evaluated this requirement';
COMMENT ON COLUMN forsured.project_requirements.evaluation_notes IS 'Notes from the last evaluation';

COMMIT;
