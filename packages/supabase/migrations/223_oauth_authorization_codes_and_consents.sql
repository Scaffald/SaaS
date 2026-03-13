-- =========================================================
-- 290_oauth_authorization_codes.sql
-- OAuth 2.0 Authorization Code Flow with PKCE Support
-- Adds authorization codes table for secure OAuth flow
-- =========================================================

BEGIN;

-- =========================================================
-- OAuth Authorization Codes Table
-- Temporary codes issued during OAuth authorization flow
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code identification (using code_hash to match router expectations)
  code_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the authorization code

  -- Relationships
  oauth_app_id UUID NOT NULL REFERENCES core.oauth_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Authorization metadata
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  redirect_uri TEXT NOT NULL, -- Must match the redirect_uri used in token exchange

  -- PKCE support
  code_challenge TEXT, -- S256 code challenge
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),

  -- State and nonce for security
  state TEXT, -- Client-provided state parameter
  nonce TEXT, -- For OpenID Connect

  -- Code lifecycle
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used_at TIMESTAMPTZ, -- When the code was exchanged for tokens
  revoked_at TIMESTAMPTZ,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT code_valid_until_used CHECK (used_at IS NULL OR revoked_at IS NULL)
);

COMMENT ON TABLE core.oauth_authorization_codes IS 'Temporary authorization codes for OAuth 2.0 code flow';
COMMENT ON COLUMN core.oauth_authorization_codes.code_hash IS 'SHA-256 hash of the authorization code - never store plaintext';
COMMENT ON COLUMN core.oauth_authorization_codes.code_challenge IS 'PKCE code challenge for enhanced security';
COMMENT ON COLUMN core.oauth_authorization_codes.expires_at IS 'Authorization codes expire after 10 minutes';

-- Add missing columns if table already exists from migration 249
ALTER TABLE core.oauth_authorization_codes ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE core.oauth_authorization_codes ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE core.oauth_authorization_codes ADD COLUMN IF NOT EXISTS nonce TEXT;
-- Make code_challenge optional (migration 249 had it as NOT NULL)
ALTER TABLE core.oauth_authorization_codes ALTER COLUMN code_challenge DROP NOT NULL;
ALTER TABLE core.oauth_authorization_codes ALTER COLUMN code_challenge_method DROP NOT NULL;

-- Create indexes for authorization code operations
CREATE INDEX IF NOT EXISTS oauth_authorization_codes_code_hash_idx ON core.oauth_authorization_codes(code_hash);
CREATE INDEX IF NOT EXISTS oauth_authorization_codes_app_user_idx ON core.oauth_authorization_codes(oauth_app_id, user_id);
CREATE INDEX IF NOT EXISTS oauth_authorization_codes_expires_idx ON core.oauth_authorization_codes(expires_at)
  WHERE used_at IS NULL AND revoked_at IS NULL;

-- Cleanup expired codes automatically (called by cron job)
CREATE OR REPLACE FUNCTION core.cleanup_expired_oauth_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM core.oauth_authorization_codes
  WHERE expires_at < NOW()
    AND used_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION core.cleanup_expired_oauth_codes() IS 'Removes expired and unused authorization codes';

-- =========================================================
-- OAuth Consent Records
-- Tracks user consent for OAuth applications
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  oauth_app_id UUID NOT NULL REFERENCES core.oauth_apps(id) ON DELETE CASCADE,

  -- Consent details
  granted_scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Tracking
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  -- Unique constraint: one consent record per user-app pair
  CONSTRAINT oauth_user_consents_user_app_unique UNIQUE (user_id, oauth_app_id)
);

COMMENT ON TABLE core.oauth_user_consents IS 'Tracks user consent for OAuth applications';
COMMENT ON COLUMN core.oauth_user_consents.granted_scopes IS 'Scopes the user has consented to';
COMMENT ON COLUMN core.oauth_user_consents.revoked_at IS 'When user revoked access to this app';

-- Create indexes for consent lookups
CREATE INDEX IF NOT EXISTS oauth_user_consents_user_idx ON core.oauth_user_consents(user_id);
CREATE INDEX IF NOT EXISTS oauth_user_consents_app_idx ON core.oauth_user_consents(oauth_app_id);

-- =========================================================
-- Update oauth_tokens to support refresh tokens
-- =========================================================
ALTER TABLE core.oauth_tokens ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT;
ALTER TABLE core.oauth_tokens ADD COLUMN IF NOT EXISTS refresh_expires_at TIMESTAMPTZ;
ALTER TABLE core.oauth_tokens ADD COLUMN IF NOT EXISTS parent_token_id UUID REFERENCES core.oauth_tokens(id) ON DELETE SET NULL;

COMMENT ON COLUMN core.oauth_tokens.refresh_token_hash IS 'SHA-256 hash of the refresh token (for refresh token type)';
COMMENT ON COLUMN core.oauth_tokens.refresh_expires_at IS 'Expiration time for refresh tokens (typically 30 days)';
COMMENT ON COLUMN core.oauth_tokens.parent_token_id IS 'Links refreshed access tokens to their refresh token';

CREATE INDEX IF NOT EXISTS oauth_tokens_refresh_hash_idx ON core.oauth_tokens(refresh_token_hash)
  WHERE refresh_token_hash IS NOT NULL;

-- =========================================================
-- Triggers
-- =========================================================
DROP TRIGGER IF EXISTS oauth_user_consents_set_updated_at ON core.oauth_user_consents;
CREATE TRIGGER oauth_user_consents_set_updated_at
  BEFORE UPDATE ON core.oauth_user_consents
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
ALTER TABLE core.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.oauth_user_consents ENABLE ROW LEVEL SECURITY;

-- Authorization codes: Only the service role can manage these
DROP POLICY IF EXISTS oauth_authorization_codes_service_only ON core.oauth_authorization_codes;
CREATE POLICY oauth_authorization_codes_service_only ON core.oauth_authorization_codes
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- User consents: Users can view and revoke their own consents
DROP POLICY IF EXISTS oauth_user_consents_select_own ON core.oauth_user_consents;
CREATE POLICY oauth_user_consents_select_own ON core.oauth_user_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS oauth_user_consents_delete_own ON core.oauth_user_consents;
CREATE POLICY oauth_user_consents_delete_own ON core.oauth_user_consents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.oauth_authorization_codes TO service_role;
GRANT ALL ON TABLE core.oauth_user_consents TO service_role;

GRANT SELECT, DELETE ON TABLE core.oauth_user_consents TO authenticated;

-- =========================================================
-- Add missing columns to oauth_apps
-- =========================================================
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS terms_of_service_url TEXT;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES core.users(id) ON DELETE SET NULL;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE core.oauth_apps ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

COMMENT ON COLUMN core.oauth_apps.privacy_policy_url IS 'URL to the app privacy policy';
COMMENT ON COLUMN core.oauth_apps.terms_of_service_url IS 'URL to the app terms of service';
COMMENT ON COLUMN core.oauth_apps.approved_by IS 'Admin who approved the app';
COMMENT ON COLUMN core.oauth_apps.approved_at IS 'When the app was approved';
COMMENT ON COLUMN core.oauth_apps.requires_approval IS 'Whether the app requires admin approval before activation';

-- Update oauth_user_consents to include expires_at
ALTER TABLE core.oauth_user_consents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days');

COMMENT ON COLUMN core.oauth_user_consents.expires_at IS 'When the user consent expires (typically 90 days)';

-- Drop existing status check constraint to add 'trusted' status
ALTER TABLE core.oauth_apps DROP CONSTRAINT IF EXISTS oauth_apps_status_check;
ALTER TABLE core.oauth_apps ADD CONSTRAINT oauth_apps_status_check
  CHECK (status IN ('pending', 'active', 'trusted', 'suspended', 'revoked'));

CREATE INDEX IF NOT EXISTS idx_oauth_apps_approved_by ON core.oauth_apps(approved_by);

-- =========================================================
-- Extend oauth_scopes table (RBAC integration)
-- =========================================================
ALTER TABLE core.oauth_scopes ADD COLUMN IF NOT EXISTS rbac_permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE core.oauth_scopes ADD COLUMN IF NOT EXISTS requires_admin_approval BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN core.oauth_scopes.rbac_permissions IS 'Array of RBAC permission names this scope maps to';
COMMENT ON COLUMN core.oauth_scopes.requires_admin_approval IS 'Whether this scope requires admin approval for apps';

COMMIT;
