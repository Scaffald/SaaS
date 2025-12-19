-- =========================================================
-- 243_oauth_user_consents.sql
-- REQ-10 Task 2: Create OAuth user consents database table and indexes
-- Tracks user consent records for OAuth applications with expiration and revocation
-- =========================================================

BEGIN;

-- =========================================================
-- OAuth User Consents Table
-- Stores user consent records for OAuth applications
-- Enables consent tracking, expiration (90-day default), and revocation management
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  oauth_app_id UUID NOT NULL REFERENCES core.oauth_apps(id) ON DELETE CASCADE,

  -- Consent details
  granted_scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- Scopes user has consented to

  -- Consent lifecycle
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'), -- 90-day expiration
  revoked_at TIMESTAMPTZ, -- NULL until consent is revoked by user

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.oauth_user_consents IS 'Tracks user consent for OAuth applications with expiration and revocation support';
COMMENT ON COLUMN core.oauth_user_consents.granted_scopes IS 'Array of OAuth scopes the user has consented to grant';
COMMENT ON COLUMN core.oauth_user_consents.expires_at IS 'Consent expires after 90 days, requiring re-authorization (does not revoke existing tokens)';
COMMENT ON COLUMN core.oauth_user_consents.revoked_at IS 'Timestamp when user revoked consent - NULL if consent is active';

-- Unique constraint: One active consent per user-app pair
-- Allows new consent after revocation/expiration
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_user_consents_user_app ON core.oauth_user_consents(user_id, oauth_app_id) 
  WHERE revoked_at IS NULL AND expires_at > NOW();

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_oauth_user_consents_expires ON core.oauth_user_consents(expires_at) 
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_user_consents_user ON core.oauth_user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_user_consents_app ON core.oauth_user_consents(oauth_app_id);

-- =========================================================
-- Trigger for updated_at
-- =========================================================
DROP TRIGGER IF EXISTS oauth_user_consents_set_updated_at ON core.oauth_user_consents;
CREATE TRIGGER oauth_user_consents_set_updated_at
  BEFORE UPDATE ON core.oauth_user_consents
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security Policies
-- =========================================================
ALTER TABLE core.oauth_user_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consents
DROP POLICY IF EXISTS oauth_user_consents_select_own ON core.oauth_user_consents;
CREATE POLICY oauth_user_consents_select_own ON core.oauth_user_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (revoke) their own consents
DROP POLICY IF EXISTS oauth_user_consents_update_own ON core.oauth_user_consents;
CREATE POLICY oauth_user_consents_update_own ON core.oauth_user_consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role bypass for backend operations
DROP POLICY IF EXISTS oauth_user_consents_service_role ON core.oauth_user_consents;
CREATE POLICY oauth_user_consents_service_role ON core.oauth_user_consents
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.oauth_user_consents TO service_role;
GRANT SELECT, UPDATE ON TABLE core.oauth_user_consents TO authenticated;

COMMIT;

