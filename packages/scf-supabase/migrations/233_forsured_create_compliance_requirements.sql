-- Migration: Create Compliance Requirements Table (REQ-2, TASK-1)
-- Description: Enhanced compliance requirements table with organizational scoping,
--              template support, and JSONB requirement definitions
-- Author: Claude (REQ-2, TASK-1)
-- Date: 2025-12-13

-- =============================================================================
-- COMPLIANCE REQUIREMENTS TABLE
-- =============================================================================
-- This is the core table for the Compliance Requirements Management system.
-- It stores insurance compliance requirements with flexible JSONB definitions,
-- organizational scoping, and template support for reusability.
--
-- Note: Version history table and dependency tables are created in separate tasks.
-- =============================================================================

BEGIN;

-- Create the compliance requirements table
CREATE TABLE IF NOT EXISTS forsured.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique code for easy reference (e.g., "GL-001", "UMB-5M-001")
  code VARCHAR(50) NOT NULL,

  -- Human-readable name
  name VARCHAR(255) NOT NULL,

  -- Coverage type classification
  type VARCHAR(100) NOT NULL CHECK (type IN (
    'general_liability',
    'workers_comp',
    'auto_liability',
    'umbrella',
    'professional_liability',
    'custom'
  )),

  -- Optional description
  description TEXT,

  -- Status and lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,

  -- Organizational scoping
  organization_id UUID NOT NULL,
  CONSTRAINT fk_compliance_requirements_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Creator tracking
  created_by UUID NOT NULL,
  CONSTRAINT fk_compliance_requirements_created_by
    FOREIGN KEY (created_by)
    REFERENCES core.users(id)
    ON DELETE RESTRICT,

  -- Template flag for reusable requirements
  is_template BOOLEAN NOT NULL DEFAULT FALSE,

  -- Requirement definition (flexible JSONB structure)
  -- Structure: {
  --   coverage_limits: { per_occurrence?: number, aggregate?: number, deductible_max?: number, ... },
  --   required_endorsements: [{ endorsement_type: string, description: string }],
  --   policy_conditions: [{ condition_type: string, description: string }],
  --   documentation_requirements: [{ document_type: string, is_required: boolean }]
  -- }
  requirement_definition JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Version tracking (denormalized for performance)
  -- Detailed version history is in separate compliance_requirement_versions table (TASK-2)
  current_version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  parent_requirement_id UUID,
  CONSTRAINT fk_compliance_requirements_parent
    FOREIGN KEY (parent_requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE SET NULL,

  -- Version change metadata
  change_summary TEXT,
  superseded_date TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  -- Unique constraint: code must be unique within organization for current versions
  CONSTRAINT unique_code_per_org UNIQUE (organization_id, code),

  -- Ensure expiration_date is after effective_date if provided
  CONSTRAINT chk_expiration_after_effective
    CHECK (expiration_date IS NULL OR expiration_date > effective_date)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary query patterns: filter by organization and status
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_org_status
  ON forsured.compliance_requirements(organization_id, status);

-- Filter by coverage type
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_type
  ON forsured.compliance_requirements(type);

-- Quick filter for current versions
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_current
  ON forsured.compliance_requirements(is_current)
  WHERE is_current = TRUE;

-- Template lookup
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_templates
  ON forsured.compliance_requirements(organization_id, is_template)
  WHERE is_template = TRUE;

-- Date-based queries for active requirements
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_effective
  ON forsured.compliance_requirements(effective_date, expiration_date)
  WHERE status = 'active';

-- Full-text search on name and description
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_search
  ON forsured.compliance_requirements
  USING gin(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_compliance_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compliance_requirements_updated_at
  ON forsured.compliance_requirements;

CREATE TRIGGER trigger_compliance_requirements_updated_at
  BEFORE UPDATE ON forsured.compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_compliance_requirements_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.compliance_requirements ENABLE ROW LEVEL SECURITY;

-- Users can read requirements for their organization
CREATE POLICY compliance_requirements_select_policy
  ON forsured.compliance_requirements
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- Admin users can insert requirements for their organization
CREATE POLICY compliance_requirements_insert_policy
  ON forsured.compliance_requirements
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT ra.organization_id
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin', 'platform_admin')
    )
  );

-- Admin users can update requirements for their organization
CREATE POLICY compliance_requirements_update_policy
  ON forsured.compliance_requirements
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT ra.organization_id
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin', 'platform_admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT ra.organization_id
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin', 'platform_admin')
    )
  );

-- Admin users can delete requirements for their organization
CREATE POLICY compliance_requirements_delete_policy
  ON forsured.compliance_requirements
  FOR DELETE
  USING (
    organization_id IN (
      SELECT ra.organization_id
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin', 'platform_admin')
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.compliance_requirements IS
  'REQ-2: Core compliance requirements table for insurance compliance management';

COMMENT ON COLUMN forsured.compliance_requirements.code IS
  'Unique identifier code within organization (e.g., GL-001, UMB-5M-001)';

COMMENT ON COLUMN forsured.compliance_requirements.type IS
  'Insurance coverage type classification';

COMMENT ON COLUMN forsured.compliance_requirements.requirement_definition IS
  'Flexible JSONB structure containing coverage limits, endorsements, conditions, and documentation requirements';

COMMENT ON COLUMN forsured.compliance_requirements.is_template IS
  'Whether this requirement can be used as a template for creating new requirements';

COMMENT ON COLUMN forsured.compliance_requirements.current_version IS
  'Denormalized version number for quick access (detailed history in versions table)';

COMMENT ON COLUMN forsured.compliance_requirements.is_current IS
  'Quick filter flag for current version (detailed history in versions table)';

COMMIT;
