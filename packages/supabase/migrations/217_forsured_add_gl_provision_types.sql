-- Migration: Add GL Provision Types for REQ-280
-- Description: Extends policy_provisions table to support additional GL sub-limit types
-- Author: Claude (REQ-280, TASK-1)
-- Date: 2025-11-25

-- =============================================================================
-- Update provision_type constraint to include new GL provision types
-- REQ-280: Per Project Aggregate (Yes/No), Occurrence Form (Yes/No), Auto Symbol (1 or 7,8,9)
-- =============================================================================

-- First, drop the existing constraint
ALTER TABLE forsured.policy_provisions
DROP CONSTRAINT IF EXISTS chk_policy_provisions_type;

-- Add the updated constraint with new provision types
ALTER TABLE forsured.policy_provisions
ADD CONSTRAINT chk_policy_provisions_type CHECK (provision_type IN (
    -- Monetary sub-limits
    'per_occurrence',
    'general_aggregate',
    'personal_advertising',
    'products_completed',
    'medical_payments',
    'damage_to_premises',
    'fire_damage',
    'employee_benefits',
    -- GL requirements (boolean/string) - Added for REQ-280
    'per_project_aggregate',
    'occurrence_form',
    'auto_symbol',
    -- Other
    'other'
));

-- =============================================================================
-- Add value column for non-monetary provisions (boolean/string values)
-- REQ-280: per_project_aggregate and occurrence_form are Yes/No, auto_symbol is string
-- =============================================================================

-- Add value column for boolean/string provision values
ALTER TABLE forsured.policy_provisions
ADD COLUMN IF NOT EXISTS provision_value TEXT;

-- Add comment explaining the column usage
COMMENT ON COLUMN forsured.policy_provisions.provision_value IS
'For non-monetary provisions: per_project_aggregate/occurrence_form store "true"/"false", auto_symbol stores "1" or "7,8,9" (REQ-280)';

-- =============================================================================
-- Create index for faster lookup of provision types
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_forsured_policy_provisions_type_value
ON forsured.policy_provisions(provision_type, provision_value);

-- =============================================================================
-- Add human-readable provision name mapping view
-- REQ-280: Display all GL sub-limits in table format
-- =============================================================================
CREATE OR REPLACE VIEW forsured.gl_provision_display AS
SELECT
    pp.id,
    pp.policy_id,
    pp.organization_id,
    pp.provision_type,
    CASE pp.provision_type
        WHEN 'per_occurrence' THEN 'Per Occurrence'
        WHEN 'general_aggregate' THEN 'General Aggregate'
        WHEN 'personal_advertising' THEN 'Personal & Advertising Injury'
        WHEN 'products_completed' THEN 'Products-Completed Operations'
        WHEN 'medical_payments' THEN 'Medical Payments'
        WHEN 'damage_to_premises' THEN 'Damage to Premises Rented to You'
        WHEN 'fire_damage' THEN 'Fire Damage'
        WHEN 'employee_benefits' THEN 'Employee Benefits Liability'
        WHEN 'per_project_aggregate' THEN 'Per Project Aggregate'
        WHEN 'occurrence_form' THEN 'Occurrence Form'
        WHEN 'auto_symbol' THEN 'Auto Symbol Requirements'
        WHEN 'other' THEN 'Other'
        ELSE pp.provision_type
    END AS display_name,
    pp.limit_amount,
    pp.deductible,
    pp.provision_value,
    pp.description,
    -- Validation requirements based on REQ-280 specs
    CASE pp.provision_type
        WHEN 'per_occurrence' THEN 'Min $1,000,000'
        WHEN 'general_aggregate' THEN 'Min $2,000,000'
        WHEN 'personal_advertising' THEN 'Min $1,000,000'
        WHEN 'products_completed' THEN 'Min $2,000,000'
        WHEN 'per_project_aggregate' THEN 'Yes/No'
        WHEN 'occurrence_form' THEN 'Yes/No'
        WHEN 'auto_symbol' THEN '1 or 7,8,9'
        ELSE NULL
    END AS requirement,
    pp.created_at,
    pp.updated_at
FROM forsured.policy_provisions pp;

-- Grant access to the view
GRANT SELECT ON forsured.gl_provision_display TO authenticated;

-- =============================================================================
-- Table Comment Update
-- =============================================================================
COMMENT ON TABLE forsured.policy_provisions IS
'Sub-limits and provisions within insurance policies. Extended for REQ-280 GL sub-limits including per_project_aggregate, occurrence_form, and auto_symbol provisions.';
