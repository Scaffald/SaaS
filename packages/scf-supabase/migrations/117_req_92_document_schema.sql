-- =========================================================
-- 117_req_92_document_schema.sql
-- REQ-92: Document storage, folders, versions, and sharing metadata
-- =========================================================

BEGIN;

-- =========================================================
-- Helper: determine if a user is a member/admin of an organization
-- =========================================================
CREATE OR REPLACE FUNCTION core.is_org_member(org_id UUID, target_user UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID := COALESCE(target_user, auth.uid());
BEGIN
  IF org_id IS NULL OR user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM core.organizations o
    WHERE o.id = org_id
      AND (
        o.owner_user_id = user_id
        OR EXISTS (
          SELECT 1
          FROM core.role_assignments ra
          JOIN core.roles r ON r.id = ra.role_id
          WHERE ra.user_id = user_id
            AND (
              ra.scope_org_id = org_id
              OR (r.scope = 'platform' AND r.name IN ('admin', 'super_admin'))
            )
        )
      )
  );
END;
$$;
COMMENT ON FUNCTION core.is_org_member
  IS 'Returns true when the specified user (defaults to auth.uid()) belongs to or administers the target organization.';
GRANT EXECUTE ON FUNCTION core.is_org_member(UUID, UUID) TO authenticated, service_role;

-- =========================================================
-- Enumerations for document categories, permissions, and share types
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'organization_document_category'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.organization_document_category AS ENUM (
      'contracts',
      'templates',
      'compliance',
      'certifications',
      'onboarding',
      'general',
      'other'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'organization_document_permission'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.organization_document_permission AS ENUM (
      'view',
      'edit',
      'manage'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'organization_document_share_type'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.organization_document_share_type AS ENUM (
      'organization_member',
      'external'
    );
  END IF;
END
$$;

-- =========================================================
-- Folder hierarchy
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES core.organization_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  depth INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_folders
  IS 'Logical folders that organize organization documents.';
COMMENT ON COLUMN core.organization_folders.depth
  IS 'Computed depth hint for breadcrumb rendering.';
COMMENT ON COLUMN core.organization_folders.metadata
  IS 'Additional UI metadata (icons, tags, etc.).';

CREATE UNIQUE INDEX IF NOT EXISTS organization_folders_unique_name_idx
  ON core.organization_folders (
    organization_id,
    COALESCE(parent_folder_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(name)
  )
  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS organization_folders_parent_idx
  ON core.organization_folders(organization_id, parent_folder_id);

DROP TRIGGER IF EXISTS organization_folders_set_updated_at ON core.organization_folders;
CREATE TRIGGER organization_folders_set_updated_at
  BEFORE UPDATE ON core.organization_folders
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Document metadata
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES core.organization_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category core.organization_document_category NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  version_count INTEGER NOT NULL DEFAULT 0,
  latest_version_number INTEGER NOT NULL DEFAULT 0,
  latest_version_id UUID,
  latest_size_bytes BIGINT NOT NULL DEFAULT 0,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  latest_checksum TEXT,
  latest_mime_type TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'organization-documents',
  storage_prefix TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_documents
  IS 'Top-level document metadata for organizations; individual file blobs live in the versions table.';
COMMENT ON COLUMN core.organization_documents.storage_prefix
  IS 'Prefix applied to Supabase Storage object paths (e.g., org/<orgId>/docs).';
COMMENT ON COLUMN core.organization_documents.latest_version_id
  IS 'Denormalized pointer to the most recent version row.';

CREATE INDEX IF NOT EXISTS organization_documents_org_idx
  ON core.organization_documents(organization_id, folder_id)
  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS organization_documents_tags_idx
  ON core.organization_documents
  USING GIN (tags);
CREATE INDEX IF NOT EXISTS organization_documents_name_trgm_idx
  ON core.organization_documents
  USING GIN (name gin_trgm_ops);

DROP TRIGGER IF EXISTS organization_documents_set_updated_at ON core.organization_documents;
CREATE TRIGGER organization_documents_set_updated_at
  BEFORE UPDATE ON core.organization_documents
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Document versions
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES core.organization_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  storage_object_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  checksum TEXT,
  uploaded_by UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_document_versions
  IS 'Discrete document revisions tied to Supabase Storage objects.';
COMMENT ON COLUMN core.organization_document_versions.storage_object_path
  IS 'Full path (bucket/key) for the underlying storage object.';

ALTER TABLE core.organization_document_versions
  DROP CONSTRAINT IF EXISTS organization_document_versions_version_unique;
ALTER TABLE core.organization_document_versions
  ADD CONSTRAINT organization_document_versions_version_unique
  UNIQUE (document_id, version_number);

CREATE INDEX IF NOT EXISTS organization_document_versions_doc_idx
  ON core.organization_document_versions(document_id);
CREATE INDEX IF NOT EXISTS organization_document_versions_org_idx
  ON core.organization_document_versions(organization_id);

-- Automatically inherit organization_id + version numbering
CREATE OR REPLACE FUNCTION core.set_document_version_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_version INTEGER;
  doc_org_id UUID;
BEGIN
  SELECT organization_id
  INTO doc_org_id
  FROM core.organization_documents
  WHERE id = NEW.document_id;

  IF doc_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization document % not found', NEW.document_id;
  END IF;

  NEW.organization_id := doc_org_id;

  IF NEW.version_number IS NULL OR NEW.version_number <= 0 THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM core.organization_document_versions
    WHERE document_id = NEW.document_id;

    NEW.version_number := next_version;
  END IF;

  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION core.set_document_version_defaults
  IS 'Ensures document versions inherit organization_id and sequential version numbers.';

DROP TRIGGER IF EXISTS organization_document_versions_defaults ON core.organization_document_versions;
CREATE TRIGGER organization_document_versions_defaults
  BEFORE INSERT ON core.organization_document_versions
  FOR EACH ROW EXECUTE FUNCTION core.set_document_version_defaults();

-- Update parent document aggregates after each version insert
CREATE OR REPLACE FUNCTION core.refresh_document_latest_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE core.organization_documents
  SET latest_version_id = NEW.id,
      latest_version_number = NEW.version_number,
      version_count = COALESCE(version_count, 0) + 1,
      latest_size_bytes = NEW.size_bytes,
      total_size_bytes = COALESCE(total_size_bytes, 0) + NEW.size_bytes,
      latest_checksum = NEW.checksum,
      latest_mime_type = NEW.mime_type,
      updated_by = NEW.uploaded_by,
      updated_at = NOW()
  WHERE id = NEW.document_id;

  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION core.refresh_document_latest_version
  IS 'Denormalizes version metadata back onto the parent document row.';

DROP TRIGGER IF EXISTS organization_document_versions_refresh_parent ON core.organization_document_versions;
CREATE TRIGGER organization_document_versions_refresh_parent
  AFTER INSERT ON core.organization_document_versions
  FOR EACH ROW EXECUTE FUNCTION core.refresh_document_latest_version();

-- Establish FK for denormalized latest_version_id now that versions table exists
ALTER TABLE core.organization_documents
  DROP CONSTRAINT IF EXISTS organization_documents_latest_version_id_fkey;
ALTER TABLE core.organization_documents
  ADD CONSTRAINT organization_documents_latest_version_id_fkey
  FOREIGN KEY (latest_version_id)
  REFERENCES core.organization_document_versions(id)
  ON DELETE SET NULL;

-- =========================================================
-- Document sharing metadata
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES core.organization_documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  share_type core.organization_document_share_type NOT NULL DEFAULT 'organization_member',
  permission core.organization_document_permission NOT NULL DEFAULT 'view',
  target_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
  external_email TEXT,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_document_shares
  IS 'Tracks fine-grained grants for document access (internal members or external links).';

ALTER TABLE core.organization_document_shares
  DROP CONSTRAINT IF EXISTS organization_document_shares_share_target_check;
ALTER TABLE core.organization_document_shares
  ADD CONSTRAINT organization_document_shares_share_target_check
  CHECK (
    (share_type = 'organization_member' AND target_user_id IS NOT NULL AND external_email IS NULL)
    OR (share_type = 'external' AND external_email IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS organization_document_shares_doc_idx
  ON core.organization_document_shares(document_id, share_type)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS organization_document_shares_token_idx
  ON core.organization_document_shares(access_token)
  WHERE access_token IS NOT NULL;

DROP TRIGGER IF EXISTS organization_document_shares_set_updated_at ON core.organization_document_shares;
CREATE TRIGGER organization_document_shares_set_updated_at
  BEFORE UPDATE ON core.organization_document_shares
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security policies
-- =========================================================
ALTER TABLE core.organization_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_document_shares ENABLE ROW LEVEL SECURITY;

-- Folders
DROP POLICY IF EXISTS organization_folders_select ON core.organization_folders;
CREATE POLICY organization_folders_select ON core.organization_folders
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_folders_insert ON core.organization_folders;
CREATE POLICY organization_folders_insert ON core.organization_folders
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_folders_update ON core.organization_folders;
CREATE POLICY organization_folders_update ON core.organization_folders
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_folders_delete ON core.organization_folders;
CREATE POLICY organization_folders_delete ON core.organization_folders
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

-- Documents
DROP POLICY IF EXISTS organization_documents_select ON core.organization_documents;
CREATE POLICY organization_documents_select ON core.organization_documents
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_documents_insert ON core.organization_documents;
CREATE POLICY organization_documents_insert ON core.organization_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_documents_update ON core.organization_documents;
CREATE POLICY organization_documents_update ON core.organization_documents
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_documents_delete ON core.organization_documents;
CREATE POLICY organization_documents_delete ON core.organization_documents
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

-- Versions
DROP POLICY IF EXISTS organization_document_versions_select ON core.organization_document_versions;
CREATE POLICY organization_document_versions_select ON core.organization_document_versions
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_document_versions_insert ON core.organization_document_versions;
CREATE POLICY organization_document_versions_insert ON core.organization_document_versions
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_document_versions_delete ON core.organization_document_versions;
CREATE POLICY organization_document_versions_delete ON core.organization_document_versions
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

-- Shares
DROP POLICY IF EXISTS organization_document_shares_select ON core.organization_document_shares;
CREATE POLICY organization_document_shares_select ON core.organization_document_shares
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_document_shares_insert ON core.organization_document_shares;
CREATE POLICY organization_document_shares_insert ON core.organization_document_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_document_shares_update ON core.organization_document_shares;
CREATE POLICY organization_document_shares_update ON core.organization_document_shares
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_document_shares_delete ON core.organization_document_shares;
CREATE POLICY organization_document_shares_delete ON core.organization_document_shares
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.organization_folders TO service_role;
GRANT ALL ON TABLE core.organization_documents TO service_role;
GRANT ALL ON TABLE core.organization_document_versions TO service_role;
GRANT ALL ON TABLE core.organization_document_shares TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_document_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_document_shares TO authenticated;

GRANT USAGE ON TYPE core.organization_document_category TO authenticated, service_role;
GRANT USAGE ON TYPE core.organization_document_permission TO authenticated, service_role;
GRANT USAGE ON TYPE core.organization_document_share_type TO authenticated, service_role;

COMMIT;

