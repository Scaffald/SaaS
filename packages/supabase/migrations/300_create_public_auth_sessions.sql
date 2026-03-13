-- Migration: Create auth_sessions and RPCs in public schema
-- Purpose: OAuth cookie auth with session storage in public schema.
-- Supports vault (production) and pgcrypto (local dev) for token encryption.

-- =============================================================================
-- STEP 1: Create auth_sessions table in public
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  scaffald_user_id TEXT NOT NULL,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  access_token_secret_id UUID,
  refresh_token_secret_id UUID,

  access_token_encrypted BYTEA,
  refresh_token_encrypted BYTEA,

  token_expires_at TIMESTAMPTZ NOT NULL,
  session_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  user_agent TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_public_auth_sessions_scaffald_user_id ON public.auth_sessions(scaffald_user_id);
CREATE INDEX IF NOT EXISTS idx_public_auth_sessions_supabase_user_id ON public.auth_sessions(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_public_auth_sessions_session_expires ON public.auth_sessions(session_expires_at);
CREATE INDEX IF NOT EXISTS idx_public_auth_sessions_token_expires ON public.auth_sessions(token_expires_at);

COMMENT ON TABLE public.auth_sessions IS 'Stores OAuth session data with encrypted tokens (Vault in prod, pgcrypto locally)';
COMMENT ON COLUMN public.auth_sessions.access_token_secret_id IS 'UUID reference to vault secret (production only)';
COMMENT ON COLUMN public.auth_sessions.access_token_encrypted IS 'AES-256 encrypted token (local dev only)';

-- =============================================================================
-- STEP 2: Create helper functions in public
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_vault_available()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM 1 FROM information_schema.schemata WHERE schema_name = 'vault';
  IF FOUND THEN
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

CREATE OR REPLACE FUNCTION public.get_encryption_key()
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN decode('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_auth_session(
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
SET search_path = public, vault
AS $$
DECLARE
  v_session_id UUID;
  v_access_secret_id UUID;
  v_refresh_secret_id UUID;
  v_use_vault BOOLEAN;
  v_encryption_key BYTEA;
BEGIN
  v_use_vault := public.is_vault_available();

  IF v_use_vault THEN
    SELECT vault.create_secret(
      p_access_token,
      'auth_session_access_' || gen_random_uuid()::TEXT,
      'Auth session access token'
    ) INTO v_access_secret_id;

    IF p_refresh_token IS NOT NULL THEN
      SELECT vault.create_secret(
        p_refresh_token,
        'auth_session_refresh_' || gen_random_uuid()::TEXT,
        'Auth session refresh token'
      ) INTO v_refresh_secret_id;
    END IF;

    INSERT INTO public.auth_sessions (
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
    v_encryption_key := public.get_encryption_key();

    INSERT INTO public.auth_sessions (
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

CREATE OR REPLACE FUNCTION public.get_auth_session(p_session_id UUID)
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
SET search_path = public, vault
AS $$
DECLARE
  v_use_vault BOOLEAN;
  v_encryption_key BYTEA;
BEGIN
  UPDATE public.auth_sessions s
  SET last_used_at = NOW()
  WHERE s.id = p_session_id
    AND s.session_expires_at > NOW();

  v_use_vault := public.is_vault_available();

  IF v_use_vault THEN
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
    FROM public.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();
  ELSE
    v_encryption_key := public.get_encryption_key();

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
    FROM public.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_auth_session_tokens(
  p_session_id UUID,
  p_access_token TEXT,
  p_refresh_token TEXT,
  p_token_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
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
  v_use_vault := public.is_vault_available();

  IF v_use_vault THEN
    SELECT s.access_token_secret_id, s.refresh_token_secret_id
    INTO v_old_access_secret_id, v_old_refresh_secret_id
    FROM public.auth_sessions s
    WHERE s.id = p_session_id
      AND s.session_expires_at > NOW();

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    SELECT vault.create_secret(
      p_access_token,
      'auth_session_access_' || gen_random_uuid()::TEXT,
      'Auth session access token (refreshed)'
    ) INTO v_new_access_secret_id;

    IF p_refresh_token IS NOT NULL THEN
      SELECT vault.create_secret(
        p_refresh_token,
        'auth_session_refresh_' || gen_random_uuid()::TEXT,
        'Auth session refresh token (refreshed)'
      ) INTO v_new_refresh_secret_id;
    END IF;

    UPDATE public.auth_sessions s
    SET
      access_token_secret_id = v_new_access_secret_id,
      refresh_token_secret_id = COALESCE(v_new_refresh_secret_id, s.refresh_token_secret_id),
      token_expires_at = p_token_expires_at,
      last_used_at = NOW()
    WHERE s.id = p_session_id;

    DELETE FROM vault.secrets WHERE id = v_old_access_secret_id;
    IF v_old_refresh_secret_id IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_old_refresh_secret_id;
    END IF;

    v_updated := TRUE;
  ELSE
    v_encryption_key := public.get_encryption_key();

    UPDATE public.auth_sessions s
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

CREATE OR REPLACE FUNCTION public.delete_auth_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_access_secret_id UUID;
  v_refresh_secret_id UUID;
  v_use_vault BOOLEAN;
BEGIN
  v_use_vault := public.is_vault_available();

  IF v_use_vault THEN
    SELECT access_token_secret_id, refresh_token_secret_id
    INTO v_access_secret_id, v_refresh_secret_id
    FROM public.auth_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    DELETE FROM public.auth_sessions WHERE id = p_session_id;

    DELETE FROM vault.secrets WHERE id = v_access_secret_id;
    IF v_refresh_secret_id IS NOT NULL THEN
      DELETE FROM vault.secrets WHERE id = v_refresh_secret_id;
    END IF;
  ELSE
    DELETE FROM public.auth_sessions WHERE id = p_session_id;

    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_session RECORD;
  v_use_vault BOOLEAN;
BEGIN
  v_use_vault := public.is_vault_available();

  IF v_use_vault THEN
    FOR v_session IN
      SELECT id, access_token_secret_id, refresh_token_secret_id
      FROM public.auth_sessions
      WHERE session_expires_at <= NOW()
    LOOP
      DELETE FROM vault.secrets WHERE id = v_session.access_token_secret_id;
      IF v_session.refresh_token_secret_id IS NOT NULL THEN
        DELETE FROM vault.secrets WHERE id = v_session.refresh_token_secret_id;
      END IF;

      DELETE FROM public.auth_sessions WHERE id = v_session.id;
      v_deleted_count := v_deleted_count + 1;
    END LOOP;
  ELSE
    DELETE FROM public.auth_sessions
    WHERE session_expires_at <= NOW();

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  END IF;

  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_vault_available TO service_role;
GRANT EXECUTE ON FUNCTION public.get_encryption_key TO service_role;
GRANT EXECUTE ON FUNCTION public.create_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION public.update_auth_session_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_auth_session TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_auth_sessions TO service_role;

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- NOTE: forsured schema no longer exists in the migration chain.
-- It was removed during migration consolidation (March 2026).
