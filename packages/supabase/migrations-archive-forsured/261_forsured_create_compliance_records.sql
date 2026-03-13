-- Migration: 261_forsured_create_compliance_records.sql
-- Description: Create compliance_records table for assessment history
-- REQ: Schema alignment with original design for dashboard functionality
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- COMPLIANCE RECORDS TABLE
-- =============================================================================
-- Stores compliance assessment records with review history.
-- Enables dashboard queries that were previously failing due to missing table.
-- Note: This is separate from compliance_scores which tracks per-project scores.
-- compliance_records is for organization-level assessment history.
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization reference (owns this record)
  organization_id UUID NOT NULL,
  CONSTRAINT fk_compliance_records_org
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client reference (for broker workflows - the org being assessed)
  client_id UUID NOT NULL,
  CONSTRAINT fk_compliance_records_client
    FOREIGN KEY (client_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Compliance metrics
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Issue counts
  issues_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  policies_expiring_soon INTEGER DEFAULT 0,

  -- Review dates
  last_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_review_date DATE,

  -- Notes
  notes TEXT,

  -- Reviewed by
  reviewed_by_user_id UUID,
  CONSTRAINT fk_compliance_records_reviewer
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_records_org ON forsured.compliance_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_client ON forsured.compliance_records(client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_score ON forsured.compliance_records(overall_score);
CREATE INDEX IF NOT EXISTS idx_compliance_records_risk ON forsured.compliance_records(risk_level);
CREATE INDEX IF NOT EXISTS idx_compliance_records_review ON forsured.compliance_records(last_review_date);
CREATE INDEX IF NOT EXISTS idx_compliance_records_next_review ON forsured.compliance_records(next_review_date);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_compliance_records_org_risk ON forsured.compliance_records(organization_id, risk_level);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.compliance_records ENABLE ROW LEVEL SECURITY;

-- Users can view compliance records in their organization
CREATE POLICY "Users can view compliance records in their org"
  ON forsured.compliance_records
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can create compliance records for their organization
CREATE POLICY "Users can create compliance records in their org"
  ON forsured.compliance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can update compliance records in their organization
CREATE POLICY "Users can update compliance records in their org"
  ON forsured.compliance_records
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can delete compliance records in their organization
CREATE POLICY "Users can delete compliance records in their org"
  ON forsured.compliance_records
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
CREATE POLICY "Service role has full access to compliance_records"
  ON forsured.compliance_records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.compliance_records TO authenticated;
GRANT ALL ON forsured.compliance_records TO service_role;

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_compliance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compliance_records_updated_at ON forsured.compliance_records;

CREATE TRIGGER trg_compliance_records_updated_at
  BEFORE UPDATE ON forsured.compliance_records
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_compliance_records_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.compliance_records IS 'Compliance assessment records with review history';
COMMENT ON COLUMN forsured.compliance_records.organization_id IS 'Organization that owns this record';
COMMENT ON COLUMN forsured.compliance_records.client_id IS 'Organization being assessed (for broker workflows)';
COMMENT ON COLUMN forsured.compliance_records.overall_score IS 'Compliance score from 0-100';
COMMENT ON COLUMN forsured.compliance_records.risk_level IS 'Risk classification: low, medium, high, critical';
COMMENT ON COLUMN forsured.compliance_records.issues_count IS 'Number of open compliance issues';
COMMENT ON COLUMN forsured.compliance_records.warnings_count IS 'Number of warnings';
COMMENT ON COLUMN forsured.compliance_records.policies_expiring_soon IS 'Count of policies expiring within threshold';
COMMENT ON COLUMN forsured.compliance_records.last_review_date IS 'Date of last compliance review';
COMMENT ON COLUMN forsured.compliance_records.next_review_date IS 'Scheduled date for next review';
COMMENT ON COLUMN forsured.compliance_records.reviewed_by_user_id IS 'User who performed the last review';

COMMIT;
