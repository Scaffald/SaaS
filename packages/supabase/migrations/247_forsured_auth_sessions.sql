-- Migration: Create auth_sessions table for httpOnly cookie token storage
-- REQ-11: Authentication Flow Refinement - TASK-3
--
-- This table stores OAuth tokens server-side, referenced by session ID in httpOnly cookies.
-- Tokens are encrypted using:
--   - Supabase Vault (production/cloud) - if available
--   - pgcrypto with AES-256 (local development) - fallback

-- Enable pgcrypto for local development fallback
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Try to enable vault, but don't fail if not available (local dev)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vault" WITH SCHEMA "vault";
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Vault extension not available - using pgcrypto fallback for local development';
END $$;

-- Create auth_sessions table in forsured schema
-- For local dev: tokens stored encrypted with pgcrypto
-- For production: tokens stored as Vault secret references
CREATE TABLE IF NOT EXISTS forsured.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scaffald user ID (external OAuth provider user ID)
  scaffald_user_id TEXT NOT NULL,

  -- Supabase user ID (if linked to a Supabase auth user)
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- For Vault mode: UUID references to vault secrets
  access_token_secret_id UUID,
  refresh_token_secret_id UUID,

  -- For pgcrypto mode: encrypted tokens stored directly
  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,

  -- Token expiration (for proactive refresh)
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Session expiration (30 days by default)
  session_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Request metadata for security audit
  user_agent TEXT,
  ip_address INET
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_auth_sessions_scaffald_user_id ON forsured.auth_sessions(scaffald_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_supabase_user_id ON forsured.auth_sessions(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_session_expires ON forsured.auth_sessions(session_expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_expires ON forsured.auth_sessions(token_expires_at);

-- Comments for documentation
COMMENT ON TABLE forsured.auth_sessions IS 'Stores OAuth session data with encrypted tokens (Vault in prod, pgcrypto locally)';
COMMENT ON COLUMN forsured.auth_sessions.access_token_secret_id IS 'UUID reference to vault secret (production only)';
COMMENT ON COLUMN forsured.auth_sessions.access_token_encrypted IS 'AES-256 encrypted token (local dev only)';

-- Check if Vault is available
CREATE OR REPLACE FUNCTION forsured.is_vault_available()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to access vault schema
  PERFORM 1 FROM information_schema.schemata WHERE schema_name = 'vault';
  IF FOUND THEN
    -- Check if vault.secrets table exists
    PERFORM 1 FROM information_schema.tables
    WHERE table_schema = 'vault' AND table_name = 'secrets';
    RETURN FOUND;
  END IF;
  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Encryption key for local development (NOT for production!)
-- In production, use Vault which handles key management automatically
-- For local dev, we use a hardcoded key (this is fine since it's only for testing)
CREATE OR REPLACE FUNCTION forsured.get_encryption_key()
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 32-byte key for AES-256 (only used in local development)
  -- In production, Vault handles encryption with proper key management
  RETURN decode('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
END;
$$;

-- Helper function to create a session with encrypted tokens
CREATE OR REPLACE FUNCTION forsured.create_auth_session(
  p_scaffald_user_id TEXT,
  p_supabase_user_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_token_expires_at TIMESTAMPTZ,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, vault, public
AS $$
DECLARE
  v_session_id UUID;
  v_access_secret_id UUID;
  v_refresh_secret_id UUID;
  v_use_vault BOOLEAN;
  v_encryption_key BYTEA;
BEGIN
  -- Check if Vault is available
  v_use_vault := forsured.is_vault_available();

  IF v_use_vault THEN
    -- Production mode: Use Vault
    SELECT vault.create_secret(
      p_access_token,
      'auth_session_access_' || gen_random_uuid()::TEXT,
      'ForSured auth session access token'
    ) INTO v_access_secret_id;

    IF p_refresh_token IS NOT NULL THEN
      SELECT vault.create_secret(
        p_refresh_token,
        'auth_session_refresh_' || gen_random_uuid()::TEXT,
        'ForSured auth session refresh token'
      ) INTO v_refresh_secret_id;
    END IF;

    INSERT INTO forsured.auth_sessions (
      scaffald_user_id,
      supabase_user_id,
      access_token_secret_id,
      refresh_token_secret_id,
      token_expires_at,
      user_agent,
      ip_address
    ) VALUES (
      p_scaffald_user_id,
      p_supabase_user_id,
      v_access_secret_id,
      v_refresh_secret_id,
      p_token_expires_at,
      p_user_agent,
      p_ip_address
    )
    RETURNING id INTO v_session_id;
  ELSE
    -- Local dev mode: Use pgcrypto
    v_encryption_key := forsured.get_encryption_key();

    INSERT INTO forsured.auth_sessions (
      scaffald_user_id,
      supabase_user_id,
      access_token_encrypted,
      refresh_token_encrypted,
      token_expires_at,
      user_agent,
      ip_address
    ) VALUES (
      p_scaffald_user_id,
      p_supabase_user_id,
      pgp_sym_encrypt(p_access_token, encode(v_encryption_key, 'hex')),
      CASE WHEN p_refresh_token IS NOT NULL
           THEN pgp_sym_encrypt(p_refresh_token, encode(v_encryption_key, 'hex'))
           ELSE NULL END,
      p_token_expires_at,
      p_user_agent,
      p_ip_address
    )
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$;

-- Helper function to get session with decrypted tokens
CREATE OR REPLACE FUNCTION forsured.get_auth_session(p_session_id UUID)
RETURNS TABLE (
  session_id UUID,
  scaffald_user_id TEXT,
  supabase_user_id UUID,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  session_expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, vault, public
AS $$
DECLARE
  v_use_vault BOOLEAN;
  v_encryption_key BYTEA;
BEGIN
  -- Update last_used_at (qualify column with table alias to avoid ambiguity)
  UPDATE forsured.auth_sessions s
  SET last_used_at = NOW()
  WHERE s.id = p_session_id
    AND s.session_expires_at > NOW();

  -- Check if Vault is available
  v_use_vault := forsured.is_vault_available();

  IF v_use_vault THEN
    -- Production mode: Decrypt from Vault
    RETURN QUERY
    SELECT
      s.id AS session_id,
      s.scaffald_user_id,
      s.supabase_user_id,
      (SELECT ds.decrypted_secret FROM vault.decrypted_secrets ds WHERE ds.id = s.access_token_secret_id) AS access_token,
      (SELECT ds.decrypted_secret FROM vault.decrypted_secrets ds WHERE ds.id = s.refresh_token_secret_id) AS refresh_token,
      s.token_expires_at,
      s.session_expires_at,
      s.last_used_at
    FROM forsured.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();
  ELSE
    -- Local dev mode: Decrypt with pgcrypto
    v_encryption_key := forsured.get_encryption_key();

    RETURN QUERY
    SELECT
      s.id AS session_id,
      s.scaffald_user_id,
      s.supabase_user_id,
      pgp_sym_decrypt(s.access_token_encrypted, encode(v_encryption_key, 'hex')) AS access_token,
      CASE WHEN s.refresh_token_encrypted IS NOT NULL
           THEN pgp_sym_decrypt(s.refresh_token_encrypted, encode(v_encryption_key, 'hex'))
           ELSE NULL END AS refresh_token,
      s.token_expires_at,
      s.session_expires_at,
      s.last_used_at
    FROM forsured.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();
  END IF;
END;
$$;

-- Helper function to update tokens after refresh
CREATE OR REPLACE FUNCTION forsured.update_auth_session_tokens(
  p_session_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_token_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, vault, public
AS $$
DECLARE
  v_old_access_secret_id UUID;
  v_old_refresh_secret_id UUID;
  v_new_access_secret_id UUID;
  v_new_refresh_secret_id UUID;
  v_use_vault BOOLEAN;
  v_encryption_key BYTEA;
  v_updated BOOLEAN := FALSE;
BEGIN
  -- Check if Vault is available
  v_use_vault := forsured.is_vault_available();

  IF v_use_vault THEN
    -- Production mode: Use Vault
    SELECT s.access_token_secret_id, s.refresh_token_secret_id
    INTO v_old_access_secret_id, v_old_refresh_secret_id
    FROM forsured.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    SELECT vault.create_secret(
      p_access_token,
      'auth_session_access_' || gen_random_uuid()::TEXT,
      'ForSured auth session access token (refreshed)'
    ) INTO v_new_access_secret_id;

    IF p_refresh_token IS NOT NULL THEN
      SELECT vault.create_secret(
        p_refresh_token,
        'auth_session_refresh_' || gen_random_uuid()::TEXT,
        'ForSured auth session refresh token (refreshed)'
      ) INTO v_new_refresh_secret_id;
    END IF;

    UPDATE forsured.auth_sessions s
    SET
      access_token_secret_id = v_new_access_secret_id,
      refresh_token_secret_id = COALESCE(v_new_refresh_secret_id, s.refresh_token_secret_id),
      token_expires_at = p_token_expires_at,
      last_used_at = NOW()
    WHERE s.id = p_session_id;

    -- Delete old vault secrets
    DELETE FROM vault.secrets WHERE id = v_old_access_secret_id;
    IF v_old_refresh_secret_id IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_old_refresh_secret_id;
    END IF;

    v_updated := TRUE;
  ELSE
    -- Local dev mode: Use pgcrypto
    v_encryption_key := forsured.get_encryption_key();

    UPDATE forsured.auth_sessions s
    SET
      access_token_encrypted = pgp_sym_encrypt(p_access_token, encode(v_encryption_key, 'hex')),
      refresh_token_encrypted = CASE WHEN p_refresh_token IS NOT NULL
                                     THEN pgp_sym_encrypt(p_refresh_token, encode(v_encryption_key, 'hex'))
                                     ELSE s.refresh_token_encrypted END,
      token_expires_at = p_token_expires_at,
      last_used_at = NOW()
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    v_updated := TRUE;
  END IF;

  RETURN v_updated;
END;
$$;

-- Helper function to delete a session (logout)
CREATE OR REPLACE FUNCTION forsured.delete_auth_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, vault, public
AS $$
DECLARE
  v_access_secret_id UUID;
  v_refresh_secret_id UUID;
  v_use_vault BOOLEAN;
BEGIN
  -- Check if Vault is available
  v_use_vault := forsured.is_vault_available();

  IF v_use_vault THEN
    -- Production mode: Clean up Vault secrets
    SELECT access_token_secret_id, refresh_token_secret_id
    INTO v_access_secret_id, v_refresh_secret_id
    FROM forsured.auth_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    DELETE FROM forsured.auth_sessions WHERE id = p_session_id;

    DELETE FROM vault.secrets WHERE id = v_access_secret_id;
    IF v_refresh_secret_id IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_refresh_secret_id;
    END IF;
  ELSE
    -- Local dev mode: Just delete the session (encrypted data deleted with row)
    DELETE FROM forsured.auth_sessions WHERE id = p_session_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION forsured.cleanup_expired_auth_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, vault, public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_session RECORD;
  v_use_vault BOOLEAN;
BEGIN
  v_use_vault := forsured.is_vault_available();

  IF v_use_vault THEN
    -- Production mode: Clean up Vault secrets
    FOR v_session IN
      SELECT id, access_token_secret_id, refresh_token_secret_id
      FROM forsured.auth_sessions
      WHERE session_expires_at <= NOW()
    LOOP
      DELETE FROM vault.secrets WHERE id = v_session.access_token_secret_id;
      IF v_session.refresh_token_secret_id IS NOT NULL THEN
        DELETE FROM vault.secrets WHERE id = v_session.refresh_token_secret_id;
      END IF;

      DELETE FROM forsured.auth_sessions WHERE id = v_session.id;
      v_deleted_count := v_deleted_count + 1;
    END LOOP;
  ELSE
    -- Local dev mode: Just delete expired sessions
    DELETE FROM forsured.auth_sessions
    WHERE session_expires_at <= NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  END IF;

  RETURN v_deleted_count;
END;
$$;

-- Grant execute permissions on functions to service role
GRANT EXECUTE ON FUNCTION forsured.is_vault_available TO service_role;
GRANT EXECUTE ON FUNCTION forsured.get_encryption_key TO service_role;
GRANT EXECUTE ON FUNCTION forsured.create_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION forsured.get_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION forsured.update_auth_session_tokens TO service_role;
GRANT EXECUTE ON FUNCTION forsured.delete_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION forsured.cleanup_expired_auth_sessions TO service_role;

-- RLS policies (sessions table should only be accessed by service role via functions)
ALTER TABLE forsured.auth_sessions ENABLE ROW LEVEL SECURITY;

-- No direct access - all access through SECURITY DEFINER functions
-- Service role bypasses RLS by default
