-- =========================================================
-- 139_add_oauth_app_id_to_documents.sql
-- REQ-1: Add oauth_app_id tracking to document tables
-- Enables tracking which OAuth app created/modified documents
-- =========================================================

BEGIN;

-- =========================================================
-- Add oauth_app_id to organization_documents
-- Tracks which OAuth application created the document
-- =========================================================
ALTER TABLE core.organization_documents
ADD COLUMN IF NOT EXISTS oauth_app_id TEXT REFERENCES core.oauth_apps(name) ON DELETE SET NULL;

COMMENT ON COLUMN core.organization_documents.oauth_app_id IS 'OAuth application that created this document (null for Scaffald native uploads)';

-- Create index for filtering by OAuth app
CREATE INDEX IF NOT EXISTS organization_documents_oauth_app_id_idx
ON core.organization_documents(oauth_app_id)
WHERE oauth_app_id IS NOT NULL;

-- =========================================================
-- Add oauth_app_id to organization_document_versions
-- Tracks which OAuth application uploaded each version
-- =========================================================
ALTER TABLE core.organization_document_versions
ADD COLUMN IF NOT EXISTS oauth_app_id TEXT REFERENCES core.oauth_apps(name) ON DELETE SET NULL;

COMMENT ON COLUMN core.organization_document_versions.oauth_app_id IS 'OAuth application that uploaded this version (null for Scaffald native uploads)';

-- =========================================================
-- Add cloud_storage_preference to user profiles
-- Allows users to select their preferred storage backend
-- =========================================================
DO $$
BEGIN
  -- Check if storage_preference enum exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'storage_preference'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.storage_preference AS ENUM ('supabase', 'dropbox', 'google_drive');
  END IF;
END
$$;

-- Add storage_preference column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'users'
      AND column_name = 'storage_preference'
  ) THEN
    ALTER TABLE core.users
    ADD COLUMN storage_preference core.storage_preference DEFAULT 'supabase';
  END IF;
END
$$;

COMMENT ON COLUMN core.users.storage_preference IS 'User preferred cloud storage backend for document uploads';

-- =========================================================
-- Create cloud_storage_tokens table
-- Stores encrypted OAuth tokens for Dropbox/Google Drive
-- =========================================================
CREATE TABLE IF NOT EXISTS core.cloud_storage_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Provider information
  provider TEXT NOT NULL CHECK (provider IN ('dropbox', 'google_drive')),

  -- Encrypted tokens (encrypt with app-level encryption key)
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,

  -- Token metadata
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Provider-specific metadata
  provider_user_id TEXT, -- User's ID in the provider's system
  provider_email TEXT,   -- User's email in the provider's system

  -- Status
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only have one token per provider
  CONSTRAINT cloud_storage_tokens_user_provider_unique UNIQUE (user_id, provider)
);

COMMENT ON TABLE core.cloud_storage_tokens IS 'Stores encrypted OAuth tokens for external cloud storage providers';
COMMENT ON COLUMN core.cloud_storage_tokens.access_token_encrypted IS 'AES-256-GCM encrypted access token';
COMMENT ON COLUMN core.cloud_storage_tokens.refresh_token_encrypted IS 'AES-256-GCM encrypted refresh token';

-- Create indexes
CREATE INDEX IF NOT EXISTS cloud_storage_tokens_user_idx
ON core.cloud_storage_tokens(user_id);

CREATE INDEX IF NOT EXISTS cloud_storage_tokens_provider_idx
ON core.cloud_storage_tokens(provider, is_valid)
WHERE is_valid = TRUE;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS cloud_storage_tokens_set_updated_at ON core.cloud_storage_tokens;
CREATE TRIGGER cloud_storage_tokens_set_updated_at
  BEFORE UPDATE ON core.cloud_storage_tokens
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security for cloud_storage_tokens
-- =========================================================
ALTER TABLE core.cloud_storage_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own tokens
DROP POLICY IF EXISTS cloud_storage_tokens_select_own ON core.cloud_storage_tokens;
CREATE POLICY cloud_storage_tokens_select_own ON core.cloud_storage_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS cloud_storage_tokens_insert_own ON core.cloud_storage_tokens;
CREATE POLICY cloud_storage_tokens_insert_own ON core.cloud_storage_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cloud_storage_tokens_update_own ON core.cloud_storage_tokens;
CREATE POLICY cloud_storage_tokens_update_own ON core.cloud_storage_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS cloud_storage_tokens_delete_own ON core.cloud_storage_tokens;
CREATE POLICY cloud_storage_tokens_delete_own ON core.cloud_storage_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.cloud_storage_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.cloud_storage_tokens TO authenticated;

GRANT USAGE ON TYPE core.storage_preference TO authenticated, service_role;

COMMIT;
