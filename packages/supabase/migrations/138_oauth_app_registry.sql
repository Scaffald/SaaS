-- =========================================================
-- 138_oauth_app_registry.sql
-- REQ-1: OAuth app registry for Scaffald document management integration
-- Enables OAuth apps (like Forsured) to authenticate and access Scaffald APIs
-- =========================================================

BEGIN;

-- =========================================================
-- OAuth Apps Table
-- Stores registered OAuth applications that can integrate with Scaffald
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- App identification
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- OAuth credentials
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL, -- bcrypt hashed secret

  -- OAuth configuration
  redirect_uris TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  allowed_scopes TEXT[] NOT NULL DEFAULT ARRAY['documents:read']::TEXT[],

  -- App status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),

  -- Contact and ownership
  owner_email TEXT,
  homepage_url TEXT,
  logo_url TEXT,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT oauth_apps_name_unique UNIQUE (name)
);

COMMENT ON TABLE core.oauth_apps IS 'Registry of OAuth applications authorized to access Scaffald APIs';
COMMENT ON COLUMN core.oauth_apps.client_id IS 'Public OAuth client identifier';
COMMENT ON COLUMN core.oauth_apps.client_secret_hash IS 'BCrypt hash of the client secret - never store plaintext';
COMMENT ON COLUMN core.oauth_apps.allowed_scopes IS 'Array of OAuth scopes this app can request';
COMMENT ON COLUMN core.oauth_apps.status IS 'App status: active (can authenticate), suspended (temporarily blocked), revoked (permanently blocked)';

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS oauth_apps_client_id_idx ON core.oauth_apps(client_id);
CREATE INDEX IF NOT EXISTS oauth_apps_name_idx ON core.oauth_apps(name);
CREATE INDEX IF NOT EXISTS oauth_apps_status_idx ON core.oauth_apps(status) WHERE status = 'active';

-- =========================================================
-- OAuth Tokens Table
-- Tracks issued OAuth tokens for rate limiting and revocation
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Token identification
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the access token
  token_type TEXT NOT NULL DEFAULT 'access_token' CHECK (token_type IN ('access_token', 'refresh_token')),

  -- Relationships
  oauth_app_id UUID NOT NULL REFERENCES core.oauth_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Token metadata
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,

  -- Revocation tracking
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER NOT NULL DEFAULT 0,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.oauth_tokens IS 'Tracks issued OAuth tokens for auditing and revocation';
COMMENT ON COLUMN core.oauth_tokens.token_hash IS 'SHA-256 hash of the token - never store plaintext tokens';
COMMENT ON COLUMN core.oauth_tokens.scopes IS 'Scopes granted for this specific token';

-- Create indexes for token operations
CREATE INDEX IF NOT EXISTS oauth_tokens_token_hash_idx ON core.oauth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS oauth_tokens_app_user_idx ON core.oauth_tokens(oauth_app_id, user_id);
CREATE INDEX IF NOT EXISTS oauth_tokens_expires_idx ON core.oauth_tokens(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS oauth_tokens_user_idx ON core.oauth_tokens(user_id);

-- =========================================================
-- OAuth Scopes Reference Table
-- Defines available OAuth scopes and their descriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope identification
  scope TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'documents', 'profile', 'organizations', 'admin')),

  -- Indicates if this scope requires explicit user consent
  requires_consent BOOLEAN NOT NULL DEFAULT TRUE,

  -- Indicates if this is a sensitive/dangerous scope
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.oauth_scopes IS 'Reference table of available OAuth scopes';

-- =========================================================
-- OAuth App Audit Log
-- Tracks OAuth app activity for security auditing
-- =========================================================
CREATE TABLE IF NOT EXISTS core.oauth_app_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  event_type TEXT NOT NULL CHECK (event_type IN (
    'app_created', 'app_updated', 'app_suspended', 'app_revoked', 'app_reactivated',
    'token_issued', 'token_revoked', 'token_refreshed',
    'api_call', 'rate_limited', 'auth_failed'
  )),

  -- Who/what
  oauth_app_id UUID REFERENCES core.oauth_apps(id) ON DELETE SET NULL,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,

  -- Event details
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.oauth_app_audit_log IS 'Audit log for OAuth app activity';

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS oauth_app_audit_log_app_idx ON core.oauth_app_audit_log(oauth_app_id, created_at DESC);
CREATE INDEX IF NOT EXISTS oauth_app_audit_log_user_idx ON core.oauth_app_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS oauth_app_audit_log_event_idx ON core.oauth_app_audit_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS oauth_app_audit_log_created_idx ON core.oauth_app_audit_log(created_at DESC);

-- =========================================================
-- Triggers for updated_at
-- =========================================================
DROP TRIGGER IF EXISTS oauth_apps_set_updated_at ON core.oauth_apps;
CREATE TRIGGER oauth_apps_set_updated_at
  BEFORE UPDATE ON core.oauth_apps
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security Policies
-- =========================================================
ALTER TABLE core.oauth_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.oauth_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.oauth_app_audit_log ENABLE ROW LEVEL SECURITY;

-- OAuth Apps: Only admins can manage OAuth apps
DROP POLICY IF EXISTS oauth_apps_select_admin ON core.oauth_apps;
CREATE POLICY oauth_apps_select_admin ON core.oauth_apps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin', 'office')
    )
  );

DROP POLICY IF EXISTS oauth_apps_insert_admin ON core.oauth_apps;
CREATE POLICY oauth_apps_insert_admin ON core.oauth_apps
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS oauth_apps_update_admin ON core.oauth_apps;
CREATE POLICY oauth_apps_update_admin ON core.oauth_apps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS oauth_apps_delete_admin ON core.oauth_apps;
CREATE POLICY oauth_apps_delete_admin ON core.oauth_apps
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name = 'super_admin'
    )
  );

-- OAuth Tokens: Users can see their own tokens
DROP POLICY IF EXISTS oauth_tokens_select_own ON core.oauth_tokens;
CREATE POLICY oauth_tokens_select_own ON core.oauth_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS oauth_tokens_delete_own ON core.oauth_tokens;
CREATE POLICY oauth_tokens_delete_own ON core.oauth_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- OAuth Scopes: Anyone can read available scopes
DROP POLICY IF EXISTS oauth_scopes_select_all ON core.oauth_scopes;
CREATE POLICY oauth_scopes_select_all ON core.oauth_scopes
  FOR SELECT TO authenticated
  USING (TRUE);

-- Audit Log: Admins can read all, users can read their own
DROP POLICY IF EXISTS oauth_app_audit_log_select_admin ON core.oauth_app_audit_log;
CREATE POLICY oauth_app_audit_log_select_admin ON core.oauth_app_audit_log
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin', 'office')
    )
  );

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.oauth_apps TO service_role;
GRANT ALL ON TABLE core.oauth_tokens TO service_role;
GRANT ALL ON TABLE core.oauth_scopes TO service_role;
GRANT ALL ON TABLE core.oauth_app_audit_log TO service_role;

GRANT SELECT ON TABLE core.oauth_apps TO authenticated;
GRANT SELECT, DELETE ON TABLE core.oauth_tokens TO authenticated;
GRANT SELECT ON TABLE core.oauth_scopes TO authenticated;
GRANT SELECT ON TABLE core.oauth_app_audit_log TO authenticated;

-- =========================================================
-- Seed Data: OAuth Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive)
VALUES
  ('documents:read', 'Read Documents', 'Read documents and their metadata', 'documents', FALSE, FALSE),
  ('documents:write', 'Write Documents', 'Upload, update, and delete documents', 'documents', TRUE, FALSE),
  ('documents:delete', 'Delete Documents', 'Delete documents permanently', 'documents', TRUE, TRUE),
  ('profile:read', 'Read Profile', 'Read user profile information', 'profile', FALSE, FALSE),
  ('profile:write', 'Update Profile', 'Update user profile information', 'profile', TRUE, FALSE),
  ('organizations:read', 'Read Organizations', 'Read organization information', 'organizations', FALSE, FALSE),
  ('organizations:write', 'Manage Organizations', 'Create and update organizations', 'organizations', TRUE, TRUE)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Seed Data: Forsured OAuth App (legacy/deprecated)
-- The Forsured companion app is no longer active; this row is kept for
-- backward compatibility if any external system still references it.
-- Using a placeholder client_secret_hash - regenerate in production if needed.
-- Original hash was for 'forsured_dev_secret_CHANGE_IN_PRODUCTION'
-- =========================================================
INSERT INTO core.oauth_apps (
  name,
  display_name,
  description,
  client_id,
  client_secret_hash,
  redirect_uris,
  allowed_scopes,
  status,
  owner_email,
  homepage_url
)
VALUES (
  'forsured',
  'Forsured',
  'Forsured insurance compliance platform - first OAuth app integrated with Scaffald',
  'forsured_client_' || encode(gen_random_bytes(16), 'hex'),
  -- Placeholder hash - must be regenerated with actual secret in production
  '$2a$10$placeholder_hash_MUST_REGENERATE_IN_PRODUCTION',
  ARRAY['http://localhost:5173/auth/callback', 'https://forsured.com/auth/callback'],
  ARRAY['documents:read', 'documents:write', 'profile:read', 'organizations:read'],
  'active',
  'admin@forsured.com',
  'https://forsured.com'
)
ON CONFLICT (name) DO NOTHING;

COMMIT;
