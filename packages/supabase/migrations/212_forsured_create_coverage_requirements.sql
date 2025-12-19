-- Migration: Create Coverage Requirements Table (REQ-271)
-- Description: Coverage-specific additional requirements with validation rules
-- Author: Claude (REQ-271, TASK-1)
-- Date: 2025-11-21

-- =============================================================================
-- Coverage Requirements Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.coverage_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES core.projects(id) ON DELETE CASCADE,
    coverage_type TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    endorsement_codes TEXT[], -- e.g., ['CG2010', 'CG2037'] for AI
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_coverage_requirements_coverage_type CHECK (
        coverage_type IN ('general_liability', 'auto', 'workers_comp', 'umbrella', 'professional_liability')
    ),
    CONSTRAINT chk_coverage_requirements_requirement_type CHECK (
        requirement_type IN ('additional_insured', 'waiver_of_subrogation', 'primary_non_contributory', 'certificate_holder')
    ),
    -- Business rule validation: prevent invalid requirement/coverage combinations
    CONSTRAINT chk_coverage_requirements_valid_combinations CHECK (
        -- AI is NOT allowed for Workers Comp
        (requirement_type = 'additional_insured' AND coverage_type != 'workers_comp') OR
        -- Primary Non-Contributory is ONLY allowed for GL and Umbrella
        (requirement_type = 'primary_non_contributory' AND coverage_type IN ('general_liability', 'umbrella')) OR
        -- Waiver and Certificate Holder are allowed for all coverage types
        (requirement_type IN ('waiver_of_subrogation', 'certificate_holder'))
    )
);

-- Unique constraint: one requirement per coverage type per project/org
CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_requirements_unique_org_coverage
    ON forsured.coverage_requirements(organization_id, coverage_type, requirement_type)
    WHERE project_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coverage_requirements_unique_project_coverage
    ON forsured.coverage_requirements(project_id, coverage_type, requirement_type)
    WHERE project_id IS NOT NULL;

-- Index for querying by organization
CREATE INDEX IF NOT EXISTS idx_coverage_requirements_organization_id
    ON forsured.coverage_requirements(organization_id);

-- Index for querying by project
CREATE INDEX IF NOT EXISTS idx_coverage_requirements_project_id
    ON forsured.coverage_requirements(project_id);

-- Index for querying by coverage type
CREATE INDEX IF NOT EXISTS idx_coverage_requirements_coverage_type
    ON forsured.coverage_requirements(coverage_type);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_coverage_requirements_updated_at
    BEFORE UPDATE ON forsured.coverage_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE forsured.coverage_requirements IS
    'REQ-271: Coverage-specific additional requirements with industry-standard validation';
COMMENT ON COLUMN forsured.coverage_requirements.coverage_type IS
    'Type of insurance coverage (GL, Auto, WC, Umbrella, Professional Liability)';
COMMENT ON COLUMN forsured.coverage_requirements.requirement_type IS
    'Type of additional requirement (AI, Waiver, Primary Non-Contributory, Certificate Holder)';
COMMENT ON COLUMN forsured.coverage_requirements.is_required IS
    'Whether this requirement is mandatory for this coverage type';
COMMENT ON COLUMN forsured.coverage_requirements.endorsement_codes IS
    'Array of acceptable endorsement codes (e.g., [CG2010, CG2037] for GL AI)';
COMMENT ON CONSTRAINT chk_coverage_requirements_valid_combinations ON forsured.coverage_requirements IS
    'Business rules: AI not allowed for WC, Primary only for GL/Umbrella, Waiver/Cert Holder allowed for all';
