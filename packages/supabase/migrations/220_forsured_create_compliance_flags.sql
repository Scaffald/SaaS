-- REQ-269: Policy & Endorsement Level Flags
-- Creates a polymorphic compliance_flags table for flagging issues at policy, provision, or endorsement level

-- Create enum for entity types that can have flags
DO $$ BEGIN
    CREATE TYPE forsured.flaggable_entity_type AS ENUM ('policy', 'provision', 'endorsement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for flag severity levels
DO $$ BEGIN
    CREATE TYPE forsured.flag_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for flag status
DO $$ BEGIN
    CREATE TYPE forsured.flag_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the compliance_flags table
CREATE TABLE IF NOT EXISTS forsured.compliance_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Polymorphic reference to flagged entity
    entity_type forsured.flaggable_entity_type NOT NULL,
    entity_id UUID NOT NULL,

    -- Flag details
    flag_type VARCHAR(100) NOT NULL,  -- e.g., 'coverage_gap', 'limit_insufficient', 'expired', 'missing_endorsement'
    severity forsured.flag_severity NOT NULL DEFAULT 'warning',
    status forsured.flag_status NOT NULL DEFAULT 'active',

    -- Human-readable information
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Reference to related compliance requirement (if applicable)
    requirement_id UUID REFERENCES forsured.coverage_requirements(id) ON DELETE SET NULL,

    -- Project/subcontractor context
    project_id UUID REFERENCES forsured.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID REFERENCES forsured.subcontractors(id) ON DELETE CASCADE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_compliance_flags_entity
ON forsured.compliance_flags(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_compliance_flags_project
ON forsured.compliance_flags(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_flags_subcontractor
ON forsured.compliance_flags(subcontractor_id) WHERE subcontractor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_flags_status
ON forsured.compliance_flags(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_compliance_flags_severity
ON forsured.compliance_flags(severity, status);

CREATE INDEX IF NOT EXISTS idx_compliance_flags_type
ON forsured.compliance_flags(flag_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION forsured.update_compliance_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compliance_flags_updated_at ON forsured.compliance_flags;
CREATE TRIGGER trigger_compliance_flags_updated_at
    BEFORE UPDATE ON forsured.compliance_flags
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_compliance_flags_updated_at();

-- RLS Policies
ALTER TABLE forsured.compliance_flags ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view flags for projects they have access to
CREATE POLICY compliance_flags_select_policy ON forsured.compliance_flags
    FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM forsured.projects p
            WHERE p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
        OR subcontractor_id IN (
            SELECT s.id FROM forsured.subcontractors s
            WHERE s.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can insert flags for projects in their organization
CREATE POLICY compliance_flags_insert_policy ON forsured.compliance_flags
    FOR INSERT
    TO authenticated
    WITH CHECK (
        project_id IN (
            SELECT p.id FROM forsured.projects p
            WHERE p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
        OR subcontractor_id IN (
            SELECT s.id FROM forsured.subcontractors s
            WHERE s.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can update flags for projects in their organization
CREATE POLICY compliance_flags_update_policy ON forsured.compliance_flags
    FOR UPDATE
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM forsured.projects p
            WHERE p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
        OR subcontractor_id IN (
            SELECT s.id FROM forsured.subcontractors s
            WHERE s.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
    );

-- Users can delete flags for projects in their organization
CREATE POLICY compliance_flags_delete_policy ON forsured.compliance_flags
    FOR DELETE
    TO authenticated
    USING (
        project_id IN (
            SELECT p.id FROM forsured.projects p
            WHERE p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
        OR subcontractor_id IN (
            SELECT s.id FROM forsured.subcontractors s
            WHERE s.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
            )
        )
    );

-- Add comment for documentation
COMMENT ON TABLE forsured.compliance_flags IS 'Polymorphic table for compliance flags attached to policies, provisions, or endorsements. REQ-269.';
COMMENT ON COLUMN forsured.compliance_flags.entity_type IS 'Type of entity this flag is attached to: policy, provision, or endorsement';
COMMENT ON COLUMN forsured.compliance_flags.entity_id IS 'UUID of the flagged entity (references insurance_policies, insurance_provisions, or insurance_endorsements)';
COMMENT ON COLUMN forsured.compliance_flags.flag_type IS 'Category of the flag: coverage_gap, limit_insufficient, expired, missing_endorsement, etc.';
