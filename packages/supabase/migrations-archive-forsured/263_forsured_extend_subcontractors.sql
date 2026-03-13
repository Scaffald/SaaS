-- Migration: 263_forsured_extend_subcontractors.sql
-- Description: Add missing columns to subcontractors table for dashboard compatibility
-- REQ: Schema alignment - dashboardService expects these columns
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- EXTEND SUBCONTRACTORS TABLE
-- =============================================================================
-- Adds columns expected by dashboardService.ts:
-- - status: Account status tracking
-- - trade_type: Type of trade/work the subcontractor performs
-- - license_number: Business/contractor license
-- - compliance_score: Calculated compliance score
-- - risk_level: Risk classification
-- - last_activity_at: Activity tracking
-- - updated_at: Modification timestamp
--
-- Also creates a view with company_name alias for compatibility.
-- =============================================================================

-- Add missing columns (IF NOT EXISTS ensures idempotency)
ALTER TABLE forsured.subcontractors
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trade_type TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low',
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraints for new columns (with safety checks)
DO $$
BEGIN
  -- Add status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subcontractors_status'
    AND conrelid = 'forsured.subcontractors'::regclass
  ) THEN
    ALTER TABLE forsured.subcontractors
    ADD CONSTRAINT chk_subcontractors_status
    CHECK (status IS NULL OR status IN ('active', 'inactive', 'pending', 'suspended'));
  END IF;

  -- Add risk_level constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subcontractors_risk_level'
    AND conrelid = 'forsured.subcontractors'::regclass
  ) THEN
    ALTER TABLE forsured.subcontractors
    ADD CONSTRAINT chk_subcontractors_risk_level
    CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high', 'critical'));
  END IF;

  -- Add compliance_score constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subcontractors_compliance_score'
    AND conrelid = 'forsured.subcontractors'::regclass
  ) THEN
    ALTER TABLE forsured.subcontractors
    ADD CONSTRAINT chk_subcontractors_compliance_score
    CHECK (compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100));
  END IF;
END $$;

-- =============================================================================
-- CREATE EXTENDED VIEW
-- =============================================================================
-- The existing column is 'company', but some code expects 'company_name'.
-- This view provides both names for compatibility.

CREATE OR REPLACE VIEW forsured.subcontractors_extended AS
SELECT
  id,
  name,
  company AS company_name,  -- Alias for compatibility
  company,                   -- Keep original
  scaffald_company_id,
  organization_id,
  contact_info,
  status,
  trade_type,
  license_number,
  compliance_score,
  risk_level,
  last_activity_at,
  created_at,
  updated_at
FROM forsured.subcontractors;

-- =============================================================================
-- INDEXES FOR NEW COLUMNS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON forsured.subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_risk_level ON forsured.subcontractors(risk_level);
CREATE INDEX IF NOT EXISTS idx_subcontractors_compliance_score ON forsured.subcontractors(compliance_score);
CREATE INDEX IF NOT EXISTS idx_subcontractors_trade_type ON forsured.subcontractors(trade_type);
CREATE INDEX IF NOT EXISTS idx_subcontractors_last_activity ON forsured.subcontractors(last_activity_at);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_subcontractors_org_status ON forsured.subcontractors(organization_id, status);

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_subcontractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subcontractors_updated_at ON forsured.subcontractors;

CREATE TRIGGER trg_subcontractors_updated_at
  BEFORE UPDATE ON forsured.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_subcontractors_updated_at();

-- =============================================================================
-- GRANTS FOR VIEW
-- =============================================================================

GRANT SELECT ON forsured.subcontractors_extended TO authenticated;
GRANT ALL ON forsured.subcontractors_extended TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN forsured.subcontractors.status IS 'Account status: active, inactive, pending, suspended';
COMMENT ON COLUMN forsured.subcontractors.trade_type IS 'Type of trade or work the subcontractor performs';
COMMENT ON COLUMN forsured.subcontractors.license_number IS 'Business or contractor license number';
COMMENT ON COLUMN forsured.subcontractors.compliance_score IS 'Overall compliance score from 0-100';
COMMENT ON COLUMN forsured.subcontractors.risk_level IS 'Calculated risk level: low, medium, high, critical';
COMMENT ON COLUMN forsured.subcontractors.last_activity_at IS 'Timestamp of last activity';
COMMENT ON COLUMN forsured.subcontractors.updated_at IS 'Record last update timestamp';
COMMENT ON VIEW forsured.subcontractors_extended IS 'Extended view of subcontractors with company_name alias for compatibility';

COMMIT;
