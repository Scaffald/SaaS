-- Migration: Create Additional Tables for REQ-212
-- Description: Creates tables for comments, project participants, and other features
-- Author: Claude (REQ-212)
-- Date: 2025-11-14

-- =============================================================================
-- Comments Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ,

    CONSTRAINT chk_comments_entity_type CHECK (entity_type IN ('task', 'project', 'document', 'policy', 'subcontractor'))
);

-- Indexes for comments
CREATE INDEX idx_forsured_comments_entity ON forsured.comments(entity_type, entity_id);
CREATE INDEX idx_forsured_comments_user ON forsured.comments(user_id);
CREATE INDEX idx_forsured_comments_organization ON forsured.comments(organization_id);
CREATE INDEX idx_forsured_comments_created ON forsured.comments(created_at DESC);

-- RLS for comments
ALTER TABLE forsured.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their organization" ON forsured.comments
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create comments" ON forsured.comments
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update own comments" ON forsured.comments
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments or managers can delete any" ON forsured.comments
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role bypass" ON forsured.comments
    TO service_role
    USING (true);

-- =============================================================================
-- Project Participants Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.project_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES forsured.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    invited_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_project_participants_role CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
    CONSTRAINT uq_project_participants_user UNIQUE (project_id, user_id)
);

-- Indexes for project_participants
CREATE INDEX idx_forsured_project_participants_project ON forsured.project_participants(project_id);
CREATE INDEX idx_forsured_project_participants_user ON forsured.project_participants(user_id);
CREATE INDEX idx_forsured_project_participants_organization ON forsured.project_participants(organization_id);

-- RLS for project_participants
ALTER TABLE forsured.project_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their projects" ON forsured.project_participants
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Managers can add participants" ON forsured.project_participants
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
    ));

CREATE POLICY "Managers can update participants" ON forsured.project_participants
    FOR UPDATE TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
    ));

CREATE POLICY "Managers can remove participants" ON forsured.project_participants
    FOR DELETE TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
    ));

CREATE POLICY "Service role bypass" ON forsured.project_participants
    TO service_role
    USING (true);

-- =============================================================================
-- User Invitations Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_user_invitations_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    CONSTRAINT chk_user_invitations_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Indexes for user_invitations
CREATE INDEX idx_forsured_user_invitations_email ON forsured.user_invitations(email);
CREATE INDEX idx_forsured_user_invitations_organization ON forsured.user_invitations(organization_id);
CREATE INDEX idx_forsured_user_invitations_token ON forsured.user_invitations(token);
CREATE INDEX idx_forsured_user_invitations_status ON forsured.user_invitations(status);

-- RLS for user_invitations
ALTER TABLE forsured.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations in their organization" ON forsured.user_invitations
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Managers can create invitations" ON forsured.user_invitations
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
    ));

CREATE POLICY "Service role bypass" ON forsured.user_invitations
    TO service_role
    USING (true);

-- =============================================================================
-- Attachments Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_attachments_entity_type CHECK (entity_type IN ('task', 'project', 'document', 'policy', 'comment'))
);

-- Indexes for attachments
CREATE INDEX idx_forsured_attachments_entity ON forsured.attachments(entity_type, entity_id);
CREATE INDEX idx_forsured_attachments_organization ON forsured.attachments(organization_id);
CREATE INDEX idx_forsured_attachments_uploaded_by ON forsured.attachments(uploaded_by);

-- RLS for attachments
ALTER TABLE forsured.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their organization" ON forsured.attachments
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can upload attachments" ON forsured.attachments
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update own attachments or managers can update any" ON forsured.attachments
    FOR UPDATE TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role bypass" ON forsured.attachments
    TO service_role
    USING (true);

-- =============================================================================
-- Status History Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_status_history_entity_type CHECK (entity_type IN ('task', 'project', 'document', 'policy', 'subcontractor'))
);

-- Indexes for status_history
CREATE INDEX idx_forsured_status_history_entity ON forsured.status_history(entity_type, entity_id);
CREATE INDEX idx_forsured_status_history_organization ON forsured.status_history(organization_id);
CREATE INDEX idx_forsured_status_history_created ON forsured.status_history(created_at DESC);

-- RLS for status_history
ALTER TABLE forsured.status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history in their organization" ON forsured.status_history
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role bypass" ON forsured.status_history
    TO service_role
    USING (true);

-- Status history is insert-only (no update/delete)

-- =============================================================================
-- Auto-update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION forsured.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON forsured.comments
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_project_participants_updated_at BEFORE UPDATE ON forsured.project_participants
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at BEFORE UPDATE ON forsured.user_invitations
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON forsured.attachments
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE forsured.comments IS 'User comments on various entities';
COMMENT ON TABLE forsured.project_participants IS 'Project team members and their roles';
COMMENT ON TABLE forsured.user_invitations IS 'Pending user invitations to organizations';
COMMENT ON TABLE forsured.attachments IS 'File attachments for various entities';
COMMENT ON TABLE forsured.status_history IS 'Audit trail for status changes';
