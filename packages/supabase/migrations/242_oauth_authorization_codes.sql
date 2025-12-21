-- =========================================================
-- 242_oauth_authorization_codes.sql
-- REQ-10 Task 1: Create OAuth authorization codes database table and indexes
-- Stores OAuth 2.0 authorization codes with PKCE support for secure temporary code storage
-- =========================================================

BEGIN;

-- =========================================================
-- OAuth Authorization Codes Table
-- Stores temporary authorization codes during OAuth 2.0 Authorization Code flow
-- Codes are single-use with 10-minute expiration and support PKCE
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_authorization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authorization code (stored as hash for security)
  code_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the authorization code

  -- Relationships
  oauth_app_id UUID NOT NULL REFERENCES core.oauth_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- OAuth flow parameters
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- PKCE parameters
  code_challenge TEXT NOT NULL, -- Base64url-encoded SHA-256 hash of code_verifier
  code_challenge_method TEXT NOT NULL DEFAULT 'S256' CHECK (code_challenge_method IN ('S256')),

  -- Expiration and usage tracking
  expires_at TIMESTAMPTZ NOT NULL, -- 10-minute expiration
  used_at TIMESTAMPTZ, -- NULL until code is used (single-use enforcement)

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.oauth_authorization_codes IS 'Temporary authorization codes for OAuth 2.0 Authorization Code flow with PKCE support';
COMMENT ON COLUMN core.oauth_authorization_codes.code_hash IS 'SHA-256 hash of authorization code - never store plaintext codes';
COMMENT ON COLUMN core.oauth_authorization_codes.code_challenge IS 'PKCE code challenge (base64url-encoded SHA-256 of code_verifier)';
COMMENT ON COLUMN core.oauth_authorization_codes.expires_at IS 'Authorization code expires 10 minutes after creation';
COMMENT ON COLUMN core.oauth_authorization_codes.used_at IS 'Timestamp when code was exchanged for tokens - NULL until used (enforces single-use)';

-- Create indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_authorization_codes_hash ON core.oauth_authorization_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_oauth_authorization_codes_app_user ON core.oauth_authorization_codes(oauth_app_id, user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_authorization_codes_expires ON core.oauth_authorization_codes(expires_at) WHERE used_at IS NULL;

-- =========================================================
-- Row Level Security Policies
-- =========================================================
ALTER TABLE core.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;

-- Service role bypass for backend operations
DROP POLICY IF EXISTS oauth_authorization_codes_service_role ON core.oauth_authorization_codes;
CREATE POLICY oauth_authorization_codes_service_role ON core.oauth_authorization_codes
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Users cannot directly access authorization codes (security)
-- All operations must go through service role

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.oauth_authorization_codes TO service_role;
-- No grants to authenticated role - codes are backend-only for security

COMMIT;

