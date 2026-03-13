-- Migration: 264_forsured_extend_compliance_scores.sql
-- Description: Add missing columns and create view with expected column names
-- REQ: Schema alignment - dashboardService expects overall_score, not score
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- EXTEND COMPLIANCE SCORES TABLE
-- =============================================================================
-- Adds columns expected by dashboardService.ts:
-- - expires_at: When this compliance evaluation expires
-- - notes: Evaluation notes from reviewer
--
-- Also creates a view with overall_score alias for compatibility.
-- =============================================================================

-- Add missing columns (IF NOT EXISTS ensures idempotency)
ALTER TABLE forsured.compliance_scores
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';

-- Add constraint for risk_level (with safety check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_compliance_scores_risk_level'
    AND conrelid = 'forsured.compliance_scores'::regclass
  ) THEN
    ALTER TABLE forsured.compliance_scores
    ADD CONSTRAINT chk_compliance_scores_risk_level
    CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- =============================================================================
-- CREATE EXTENDED VIEW
-- =============================================================================
-- The existing column is 'score', but some code expects 'overall_score'.
-- This view provides both names for compatibility.

CREATE OR REPLACE VIEW forsured.compliance_scores_extended AS
SELECT
  id,
  project_id,
  subcontractor_id,
  organization_id,
  score AS overall_score,    -- Alias for compatibility
  score,                      -- Keep original
  status,
  risk_level,
  gaps,
  expires_at,
  notes,
  last_evaluated AS last_evaluated_at,  -- Alias for consistency
  last_evaluated,
  created_at,
  updated_at
FROM forsured.compliance_scores;

-- =============================================================================
-- INDEXES FOR NEW COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_scores_expires_at ON forsured.compliance_scores(expires_at);
CREATE INDEX IF NOT EXISTS idx_compliance_scores_risk_level ON forsured.compliance_scores(risk_level);

-- Composite index for finding expiring compliance scores
CREATE INDEX IF NOT EXISTS idx_compliance_scores_expiring ON forsured.compliance_scores(organization_id, expires_at)
  WHERE expires_at IS NOT NULL;

-- =============================================================================
-- GRANTS FOR VIEW
-- =============================================================================

GRANT SELECT ON forsured.compliance_scores_extended TO authenticated;
GRANT ALL ON forsured.compliance_scores_extended TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN forsured.compliance_scores.expires_at IS 'When this compliance evaluation expires';
COMMENT ON COLUMN forsured.compliance_scores.notes IS 'Evaluation notes from reviewer';
COMMENT ON COLUMN forsured.compliance_scores.risk_level IS 'Risk level: low, medium, high, critical';
COMMENT ON VIEW forsured.compliance_scores_extended IS 'Extended view with overall_score alias for compatibility';

COMMIT;
