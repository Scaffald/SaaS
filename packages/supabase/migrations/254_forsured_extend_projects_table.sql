-- Migration: Extend projects table with required fields
-- Description: Adds missing columns to forsured.projects table to match application code
-- Author: Claude
-- Date: 2025-12-22
-- REQ: Fix schema mismatch for project creation

-- =============================================================================
-- Add missing columns to forsured.projects
-- =============================================================================

-- Project details
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS contract_value NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS project_manager TEXT;

-- Compliance status
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS compliance_status TEXT DEFAULT 'pending';

-- Insurance requirements (coverage amounts)
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS general_liability_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS workers_comp_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS auto_liability_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS umbrella_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS professional_liability_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS pollution_liability_required NUMERIC(15, 2);
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS builders_risk_required NUMERIC(15, 2);

-- Insurance requirements (flags and text)
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS additional_insureds TEXT[];
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS waiver_of_subrogation_required BOOLEAN DEFAULT false;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS primary_non_contributory_required BOOLEAN DEFAULT false;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS certificate_holder TEXT;
ALTER TABLE forsured.projects ADD COLUMN IF NOT EXISTS special_provisions TEXT;

-- =============================================================================
-- Add constraint for compliance_status
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_projects_compliance_status'
    ) THEN
        ALTER TABLE forsured.projects ADD CONSTRAINT chk_projects_compliance_status
            CHECK (compliance_status IN ('compliant', 'warning', 'critical', 'non_compliant', 'partial', 'pending'));
    END IF;
END $$;

-- =============================================================================
-- Add constraint for date validation
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_projects_dates'
    ) THEN
        ALTER TABLE forsured.projects ADD CONSTRAINT chk_projects_dates
            CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
    END IF;
END $$;

-- =============================================================================
-- Add indexes for commonly queried fields
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_forsured_projects_compliance_status ON forsured.projects(compliance_status);
CREATE INDEX IF NOT EXISTS idx_forsured_projects_start_date ON forsured.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_forsured_projects_end_date ON forsured.projects(end_date);
CREATE INDEX IF NOT EXISTS idx_forsured_projects_location ON forsured.projects(location);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON COLUMN forsured.projects.description IS 'Project description';
COMMENT ON COLUMN forsured.projects.location IS 'Physical location of the project';
COMMENT ON COLUMN forsured.projects.start_date IS 'Project start date';
COMMENT ON COLUMN forsured.projects.end_date IS 'Project end date';
COMMENT ON COLUMN forsured.projects.contract_value IS 'Total contract value in USD';
COMMENT ON COLUMN forsured.projects.project_manager IS 'Name of the project manager';
COMMENT ON COLUMN forsured.projects.compliance_status IS 'Overall compliance status: compliant, warning, critical, non_compliant, partial, pending';
COMMENT ON COLUMN forsured.projects.general_liability_required IS 'Required general liability coverage amount';
COMMENT ON COLUMN forsured.projects.workers_comp_required IS 'Required workers compensation coverage amount';
COMMENT ON COLUMN forsured.projects.auto_liability_required IS 'Required auto liability coverage amount';
COMMENT ON COLUMN forsured.projects.umbrella_required IS 'Required umbrella/excess coverage amount';
COMMENT ON COLUMN forsured.projects.professional_liability_required IS 'Required professional liability coverage amount';
COMMENT ON COLUMN forsured.projects.pollution_liability_required IS 'Required pollution liability coverage amount';
COMMENT ON COLUMN forsured.projects.builders_risk_required IS 'Required builders risk coverage amount';
COMMENT ON COLUMN forsured.projects.additional_insureds IS 'List of additional insured parties';
COMMENT ON COLUMN forsured.projects.waiver_of_subrogation_required IS 'Whether waiver of subrogation is required';
COMMENT ON COLUMN forsured.projects.primary_non_contributory_required IS 'Whether primary and non-contributory coverage is required';
COMMENT ON COLUMN forsured.projects.certificate_holder IS 'Certificate holder information';
COMMENT ON COLUMN forsured.projects.special_provisions IS 'Any special insurance provisions or notes';
