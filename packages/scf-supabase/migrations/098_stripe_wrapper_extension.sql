-- =========================================================
-- 098_stripe_wrapper_extension.sql
-- Supabase wrappers extension + Stripe configuration artifacts
-- =========================================================

BEGIN;

-- Ensure wrappers extension and schema exist
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- Create Stripe FDW if it does not already exist
-- Only create if wrappers extension handlers are available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_foreign_data_wrapper
    WHERE fdwname = 'stripe_wrapper'
  ) AND EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions'
    AND p.proname = 'stripe_fdw_handler'
  ) THEN
    CREATE FOREIGN DATA WRAPPER stripe_wrapper
      HANDLER extensions.stripe_fdw_handler
      VALIDATOR extensions.stripe_fdw_validator;
  END IF;
END;
$$;

-- Create Stripe server with placeholder secret id (to be updated via configure function)
-- Only create if the FDW exists (which means wrappers extension is available)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_foreign_server
    WHERE srvname = 'stripe_server'
  ) AND EXISTS (
    SELECT 1
    FROM pg_foreign_data_wrapper
    WHERE fdwname = 'stripe_wrapper'
  ) THEN
    CREATE SERVER stripe_server
      FOREIGN DATA WRAPPER stripe_wrapper
      OPTIONS (
        api_key_id '00000000-0000-0000-0000-000000000000',
        api_url 'https://api.stripe.com/v1/',
        api_version '2024-06-20'
      );
  END IF;
END;
$$;

-- Dedicated schema to house Stripe foreign tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- =========================================================
-- STRIPE SETTINGS TABLE (singleton)
-- =========================================================

CREATE TABLE IF NOT EXISTS core.stripe_settings (
  settings_name TEXT PRIMARY KEY DEFAULT 'stripe',
  publishable_key TEXT,
  api_key_secret_id UUID,
  webhook_secret_id UUID,
  test_mode BOOLEAN NOT NULL DEFAULT TRUE,
  webhook_endpoint_url TEXT,
  last_tested_at TIMESTAMPTZ,
  last_tested_status TEXT CHECK (last_tested_status IN ('succeeded', 'failed')),
  last_tested_error TEXT,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stripe_settings_singleton CHECK (settings_name = 'stripe')
);

INSERT INTO core.stripe_settings (settings_name)
VALUES ('stripe')
ON CONFLICT (settings_name) DO NOTHING;

DROP TRIGGER IF EXISTS stripe_settings_set_updated_at ON core.stripe_settings;
CREATE TRIGGER stripe_settings_set_updated_at
  BEFORE UPDATE ON core.stripe_settings
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECURE HELPERS FOR VAULT INTEGRATION
-- =========================================================

CREATE OR REPLACE FUNCTION core.rotate_stripe_secret(
  p_secret TEXT,
  p_secret_type TEXT DEFAULT 'api_key'
) RETURNS UUID AS $$
DECLARE
  secret_id UUID;
  secret_name TEXT;
BEGIN
  IF p_secret IS NULL OR LENGTH(TRIM(p_secret)) = 0 THEN
    RAISE EXCEPTION 'Secret value is required';
  END IF;

  secret_name := format(
    'stripe_%s_%s',
    lower(coalesce(p_secret_type, 'key')),
    encode(gen_random_bytes(4), 'hex')
  );

  secret_id := vault.create_secret(
    p_secret,
    secret_name,
    format('Stripe %s secret stored at %s', p_secret_type, NOW()::TEXT)
  );

  RETURN secret_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, vault, public;

CREATE OR REPLACE FUNCTION core.get_secret_value(p_secret_id UUID)
RETURNS TEXT AS $$
BEGIN
  IF p_secret_id IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN vault.get_secret(p_secret_id);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, vault, public;

CREATE OR REPLACE FUNCTION core.configure_stripe_server(
  p_api_key_secret_id UUID,
  p_api_version TEXT DEFAULT '2024-06-20'
) RETURNS VOID AS $$
DECLARE
  v_sql TEXT;
BEGIN
  IF p_api_key_secret_id IS NULL THEN
    RAISE EXCEPTION 'api_key_secret_id is required';
  END IF;

  -- Build the ALTER SERVER statement
  v_sql := format(
    'ALTER SERVER stripe_server OPTIONS (
      SET api_key_id %L,
      SET api_version %L,
      SET api_url ''https://api.stripe.com/v1/''
    )',
    p_api_key_secret_id::TEXT,
    p_api_version
  );

  EXECUTE v_sql;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public;

CREATE OR REPLACE FUNCTION core.refresh_stripe_schema()
RETURNS VOID AS $$
BEGIN
  EXECUTE 'DROP SCHEMA IF EXISTS stripe CASCADE';
  EXECUTE 'CREATE SCHEMA stripe';
  BEGIN
    EXECUTE 'IMPORT FOREIGN SCHEMA stripe FROM SERVER stripe_server INTO stripe';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '[stripe] schema import failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public;

GRANT EXECUTE ON FUNCTION core.rotate_stripe_secret(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION core.get_secret_value(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION core.configure_stripe_server(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION core.refresh_stripe_schema() TO service_role;

COMMIT;

