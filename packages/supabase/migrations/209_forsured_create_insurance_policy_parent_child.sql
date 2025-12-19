-- Migration: Create Insurance Policy Parent-Child Model for REQ-262
-- Description: Creates tables for insurance policies, policy provisions, and policy endorsements
-- Author: Claude (REQ-262, TASK-1)
-- Date: 2025-11-21

-- =============================================================================
-- Insurance Policies Table (Parent)
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES core.projects(id) ON DELETE SET NULL,
    policy_number TEXT,
    policy_type TEXT NOT NULL,
    carrier_name TEXT,
    aggregate_limit DECIMAL(12,2),
    each_occurrence_limit DECIMAL(12,2),
    deductible DECIMAL(12,2),
    effective_date DATE,
    expiration_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_insurance_policies_policy_type CHECK (policy_type IN ('GL', 'WC', 'Auto', 'Umbrella', 'Professional Liability', 'Other')),
    CONSTRAINT chk_insurance_policies_status CHECK (status IN ('active', 'expired', 'cancelled', 'pending'))
);

-- Indexes for insurance_policies
CREATE INDEX idx_forsured_insurance_policies_organization ON forsured.insurance_policies(organization_id);
CREATE INDEX idx_forsured_insurance_policies_project ON forsured.insurance_policies(project_id);
CREATE INDEX idx_forsured_insurance_policies_type ON forsured.insurance_policies(policy_type);
CREATE INDEX idx_forsured_insurance_policies_status ON forsured.insurance_policies(status);
CREATE INDEX idx_forsured_insurance_policies_expiration ON forsured.insurance_policies(expiration_date);
CREATE INDEX idx_forsured_insurance_policies_policy_number ON forsured.insurance_policies(policy_number);

-- =============================================================================
-- Policy Provisions Table (Children - Sub-limits)
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.policy_provisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES forsured.insurance_policies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    provision_type TEXT NOT NULL,
    limit_amount DECIMAL(12,2),
    deductible DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_policy_provisions_type CHECK (provision_type IN (
        'per_occurrence',
        'general_aggregate',
        'personal_advertising',
        'products_completed',
        'medical_payments',
        'damage_to_premises',
        'fire_damage',
        'employee_benefits',
        'other'
    ))
);

-- Indexes for policy_provisions
CREATE INDEX idx_forsured_policy_provisions_policy ON forsured.policy_provisions(policy_id);
CREATE INDEX idx_forsured_policy_provisions_organization ON forsured.policy_provisions(organization_id);
CREATE INDEX idx_forsured_policy_provisions_type ON forsured.policy_provisions(provision_type);

-- =============================================================================
-- Policy Endorsements Table (Children - Additional coverages)
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.policy_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES forsured.insurance_policies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    endorsement_code TEXT,
    endorsement_type TEXT NOT NULL,
    description TEXT,
    limit_amount DECIMAL(12,2),
    effective_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for policy_endorsements
CREATE INDEX idx_forsured_policy_endorsements_policy ON forsured.policy_endorsements(policy_id);
CREATE INDEX idx_forsured_policy_endorsements_organization ON forsured.policy_endorsements(organization_id);
CREATE INDEX idx_forsured_policy_endorsements_code ON forsured.policy_endorsements(endorsement_code);
CREATE INDEX idx_forsured_policy_endorsements_type ON forsured.policy_endorsements(endorsement_type);

-- =============================================================================
-- Auto-update timestamps
-- =============================================================================
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON forsured.insurance_policies
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_policy_provisions_updated_at BEFORE UPDATE ON forsured.policy_provisions
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_policy_endorsements_updated_at BEFORE UPDATE ON forsured.policy_endorsements
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

-- =============================================================================
-- Table Comments
-- =============================================================================
COMMENT ON TABLE forsured.insurance_policies IS 'Insurance policies with parent-child relationship to provisions and endorsements (REQ-262)';
COMMENT ON TABLE forsured.policy_provisions IS 'Sub-limits and provisions within insurance policies (REQ-262)';
COMMENT ON TABLE forsured.policy_endorsements IS 'Additional coverages and endorsements added to insurance policies (REQ-262)';
