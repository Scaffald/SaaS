-- Migration: Create project_subcontractors junction table
-- Description: Links subcontractors to projects with invitation tracking
-- Author: Claude
-- Date: 2025-12-22
-- REQ: Enable inviting subcontractors to projects

-- =============================================================================
-- Create project_subcontractors junction table
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.project_subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    subcontractor_id UUID NOT NULL,
    invited_by UUID,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'invited',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_project_subcontractors_project
        FOREIGN KEY (project_id)
        REFERENCES forsured.projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_subcontractors_subcontractor
        FOREIGN KEY (subcontractor_id)
        REFERENCES forsured.subcontractors(id)
        ON DELETE CASCADE,

    -- Ensure unique project-subcontractor combinations
    CONSTRAINT uq_project_subcontractor UNIQUE (project_id, subcontractor_id),

    -- Status validation
    CONSTRAINT chk_project_subcontractors_status
        CHECK (status IN ('invited', 'active', 'onboarding', 'removed', 'declined'))
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_project_subcontractors_project_id
    ON forsured.project_subcontractors(project_id);

CREATE INDEX IF NOT EXISTS idx_project_subcontractors_subcontractor_id
    ON forsured.project_subcontractors(subcontractor_id);

CREATE INDEX IF NOT EXISTS idx_project_subcontractors_status
    ON forsured.project_subcontractors(status);

CREATE INDEX IF NOT EXISTS idx_project_subcontractors_invited_at
    ON forsured.project_subcontractors(invited_at);

-- =============================================================================
-- Enable RLS
-- =============================================================================

ALTER TABLE forsured.project_subcontractors ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Allow authenticated users to view project_subcontractors in their organization
CREATE POLICY "Users can view project_subcontractors in their org"
    ON forsured.project_subcontractors
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forsured.projects p
            WHERE p.id = project_subcontractors.project_id
            AND p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
                AND scope_org_id IS NOT NULL
            )
        )
    );

-- Allow managers to insert project_subcontractors
CREATE POLICY "Managers can invite subcontractors to projects"
    ON forsured.project_subcontractors
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forsured.projects p
            WHERE p.id = project_subcontractors.project_id
            AND p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
                AND scope_org_id IS NOT NULL
            )
        )
    );

-- Allow managers to update project_subcontractors
CREATE POLICY "Managers can update project_subcontractors"
    ON forsured.project_subcontractors
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forsured.projects p
            WHERE p.id = project_subcontractors.project_id
            AND p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
                AND scope_org_id IS NOT NULL
            )
        )
    );

-- Allow managers to delete project_subcontractors
CREATE POLICY "Managers can remove subcontractors from projects"
    ON forsured.project_subcontractors
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forsured.projects p
            WHERE p.id = project_subcontractors.project_id
            AND p.organization_id IN (
                SELECT scope_org_id FROM core.role_assignments
                WHERE user_id = auth.uid()
                AND scope_org_id IS NOT NULL
            )
        )
    );

-- =============================================================================
-- Service role bypass policy
-- =============================================================================

CREATE POLICY "Service role has full access to project_subcontractors"
    ON forsured.project_subcontractors
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- Trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_project_subcontractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_subcontractors_updated_at ON forsured.project_subcontractors;

CREATE TRIGGER trg_project_subcontractors_updated_at
    BEFORE UPDATE ON forsured.project_subcontractors
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_project_subcontractors_updated_at();

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE forsured.project_subcontractors IS 'Junction table linking subcontractors to projects';
COMMENT ON COLUMN forsured.project_subcontractors.id IS 'Primary key';
COMMENT ON COLUMN forsured.project_subcontractors.project_id IS 'Reference to the project';
COMMENT ON COLUMN forsured.project_subcontractors.subcontractor_id IS 'Reference to the subcontractor';
COMMENT ON COLUMN forsured.project_subcontractors.invited_by IS 'User ID who invited the subcontractor';
COMMENT ON COLUMN forsured.project_subcontractors.invited_at IS 'Timestamp when the invitation was sent';
COMMENT ON COLUMN forsured.project_subcontractors.status IS 'Status: invited, active, onboarding, removed, declined';
COMMENT ON COLUMN forsured.project_subcontractors.notes IS 'Optional notes about the invitation';
COMMENT ON COLUMN forsured.project_subcontractors.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN forsured.project_subcontractors.updated_at IS 'Record last update timestamp';
