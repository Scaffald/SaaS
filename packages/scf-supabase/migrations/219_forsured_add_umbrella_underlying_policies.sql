-- Migration: Add underlying_policy_ids to insurance_policies for REQ-270
-- Description: Enables umbrella policies to reference which underlying coverages they extend
-- Author: Claude (REQ-270, TASK-1)
-- Date: 2025-11-28

-- =============================================================================
-- Add underlying_policy_ids column
-- =============================================================================
-- This column stores UUIDs of policies that an umbrella policy extends
-- Only umbrella policies will use this field; defaults to empty array

ALTER TABLE forsured.insurance_policies
ADD COLUMN IF NOT EXISTS underlying_policy_ids UUID[] DEFAULT '{}';

-- Add index for efficient queries on underlying policies
CREATE INDEX IF NOT EXISTS idx_forsured_insurance_policies_underlying
ON forsured.insurance_policies USING gin(underlying_policy_ids);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON COLUMN forsured.insurance_policies.underlying_policy_ids IS
'REQ-270: Array of policy IDs that this umbrella policy extends (e.g., GL, Auto, Employers Liability)';
