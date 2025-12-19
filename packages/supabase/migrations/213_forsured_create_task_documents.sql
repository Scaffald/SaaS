-- Migration: Create Task Documents Table (REQ-265)
-- Description: Polymorphic table linking tasks to documents (uploaded or certificate references)
-- Author: Claude (REQ-265, TASK-1)
-- Date: 2025-11-21

-- =============================================================================
-- Task Documents Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.task_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES forsured.tasks(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

    -- Polymorphic relationship: either uploaded document OR linked certificate/policy
    document_type TEXT NOT NULL,

    -- For uploaded documents (stored in Scaffald storage)
    document_url TEXT,
    document_name TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,

    -- For linked certificates/policies
    linked_policy_id UUID REFERENCES forsured.insurance_policies(id) ON DELETE SET NULL,
    linked_certificate_id UUID, -- Reference to certificate table (when it exists)

    -- Document metadata
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_current_version BOOLEAN NOT NULL DEFAULT true,
    replaces_document_id UUID REFERENCES forsured.task_documents(id) ON DELETE SET NULL,

    -- Notes and description
    description TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_task_documents_document_type CHECK (
        document_type IN ('uploaded', 'linked_policy', 'linked_certificate', 'linked_endorsement')
    ),
    -- Must have either uploaded document OR linked reference
    CONSTRAINT chk_task_documents_has_document CHECK (
        (document_type = 'uploaded' AND document_url IS NOT NULL) OR
        (document_type = 'linked_policy' AND linked_policy_id IS NOT NULL) OR
        (document_type IN ('linked_certificate', 'linked_endorsement') AND linked_certificate_id IS NOT NULL)
    ),
    -- File size must be positive if provided
    CONSTRAINT chk_task_documents_file_size CHECK (
        file_size_bytes IS NULL OR file_size_bytes > 0
    )
);

-- Index for querying by task
CREATE INDEX IF NOT EXISTS idx_task_documents_task_id
    ON forsured.task_documents(task_id);

-- Index for querying by organization
CREATE INDEX IF NOT EXISTS idx_task_documents_organization_id
    ON forsured.task_documents(organization_id);

-- Index for querying current versions only
CREATE INDEX IF NOT EXISTS idx_task_documents_current_version
    ON forsured.task_documents(task_id, is_current_version)
    WHERE is_current_version = true;

-- Index for querying by uploaded user
CREATE INDEX IF NOT EXISTS idx_task_documents_uploaded_by
    ON forsured.task_documents(uploaded_by);

-- Index for querying linked policies
CREATE INDEX IF NOT EXISTS idx_task_documents_linked_policy_id
    ON forsured.task_documents(linked_policy_id)
    WHERE linked_policy_id IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_task_documents_updated_at
    BEFORE UPDATE ON forsured.task_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle document versioning
CREATE OR REPLACE FUNCTION forsured.create_task_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new version is uploaded, mark previous version as not current
    IF NEW.replaces_document_id IS NOT NULL THEN
        UPDATE forsured.task_documents
        SET is_current_version = false,
            updated_at = now()
        WHERE id = NEW.replaces_document_id;

        -- Increment version number
        SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
        FROM forsured.task_documents
        WHERE task_id = NEW.task_id
          AND (id = NEW.replaces_document_id OR replaces_document_id = NEW.replaces_document_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle versioning
CREATE TRIGGER handle_task_document_versioning
    BEFORE INSERT ON forsured.task_documents
    FOR EACH ROW
    EXECUTE FUNCTION forsured.create_task_document_version();

-- Comments
COMMENT ON TABLE forsured.task_documents IS
    'REQ-265: Polymorphic table linking tasks to uploaded documents or certificate references with version history';
COMMENT ON COLUMN forsured.task_documents.document_type IS
    'Type: uploaded (Scaffald storage), linked_policy, linked_certificate, linked_endorsement';
COMMENT ON COLUMN forsured.task_documents.document_url IS
    'URL to uploaded document in Scaffald storage (for document_type = uploaded)';
COMMENT ON COLUMN forsured.task_documents.linked_policy_id IS
    'Reference to insurance_policies table (for document_type = linked_policy)';
COMMENT ON COLUMN forsured.task_documents.version IS
    'Version number for document history tracking (auto-incremented)';
COMMENT ON COLUMN forsured.task_documents.is_current_version IS
    'Whether this is the current version of the document (false for historical versions)';
COMMENT ON COLUMN forsured.task_documents.replaces_document_id IS
    'Reference to previous version this document replaces';
