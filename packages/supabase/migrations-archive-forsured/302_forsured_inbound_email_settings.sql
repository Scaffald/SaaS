-- Migration: 302_forsured_inbound_email_settings.sql
-- Purpose: Create app settings table for Forsured and configure inbound email domain
--
-- Key Changes:
-- 1. Create forsured.app_settings table for application configuration
-- 2. Add inbound_email_base_domain setting for SendGrid integration
-- 3. Add appropriate indexes and RLS policies
-- 4. Seed initial value for inbound email domain

-- =============================================================================
-- STEP 1: CREATE forsured.app_settings TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting identification
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,

  -- Metadata
  description TEXT,
  is_public BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE forsured.app_settings IS
  'Application-level configuration settings for Forsured. Used for feature flags, service endpoints, and other runtime configuration.';

COMMENT ON COLUMN forsured.app_settings.key IS
  'Unique identifier for the setting (e.g., inbound_email_base_domain, api_version)';

COMMENT ON COLUMN forsured.app_settings.value IS
  'Setting value as text. Application code is responsible for type conversion.';

COMMENT ON COLUMN forsured.app_settings.description IS
  'Human-readable description of what this setting controls.';

COMMENT ON COLUMN forsured.app_settings.is_public IS
  'Whether this setting can be read by unauthenticated users. Defaults to false for security.';

-- =============================================================================
-- STEP 2: CREATE INDEXES
-- =============================================================================

-- Index for fast key lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_app_settings_key
  ON forsured.app_settings(key);

-- Index for public settings queries
CREATE INDEX IF NOT EXISTS idx_app_settings_public
  ON forsured.app_settings(is_public)
  WHERE is_public = true;

-- =============================================================================
-- STEP 3: CREATE UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON forsured.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_app_settings_updated_at();

-- =============================================================================
-- STEP 4: CREATE RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read public settings
CREATE POLICY "Anyone can read public settings"
  ON forsured.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Policy: Authenticated users can read all settings
CREATE POLICY "Authenticated users can read all settings"
  ON forsured.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can modify settings
CREATE POLICY "Service role can manage all settings"
  ON forsured.app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON forsured.app_settings TO anon, authenticated;
GRANT ALL ON forsured.app_settings TO service_role;

-- =============================================================================
-- STEP 6: SEED INITIAL SETTINGS
-- =============================================================================

-- Insert inbound email base domain setting
INSERT INTO forsured.app_settings (key, value, description, is_public)
VALUES (
  'inbound_email_base_domain',
  'inbound.mx.forsured.com',
  'Base domain for SendGrid inbound email parsing. Used to generate unique email addresses for inbound communication.',
  false
)
ON CONFLICT (key) DO NOTHING;

-- Insert additional common settings (commented out - add as needed)
-- INSERT INTO forsured.app_settings (key, value, description, is_public)
-- VALUES
--   ('api_version', 'v1', 'Current API version', true),
--   ('maintenance_mode', 'false', 'Whether the app is in maintenance mode', true),
--   ('feature_flags', '{}', 'JSON object of feature flags', false)
-- ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS (OPTIONAL)
-- =============================================================================

-- Helper function to get a setting value by key
CREATE OR REPLACE FUNCTION forsured.get_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM forsured.app_settings
  WHERE key = setting_key;

  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION forsured.get_setting(TEXT) IS
  'Retrieve a setting value by key. Returns NULL if setting does not exist.';

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION forsured.get_setting(TEXT) TO authenticated, anon;

-- =============================================================================
-- STEP 8: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  setting_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Verify app_settings table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured'
    AND table_name = 'app_settings'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table forsured.app_settings was not created successfully';
  END IF;

  -- Verify inbound_email_base_domain setting exists
  SELECT EXISTS (
    SELECT 1 FROM forsured.app_settings
    WHERE key = 'inbound_email_base_domain'
  ) INTO setting_exists;

  IF NOT setting_exists THEN
    RAISE EXCEPTION 'Setting inbound_email_base_domain was not inserted successfully';
  END IF;

  -- Verify helper function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'forsured'
    AND p.proname = 'get_setting'
  ) INTO function_exists;

  IF NOT function_exists THEN
    RAISE EXCEPTION 'Function forsured.get_setting was not created successfully';
  END IF;

  RAISE NOTICE '✅ Migration 302_forsured_inbound_email_settings.sql completed successfully';
  RAISE NOTICE '  - forsured.app_settings table created';
  RAISE NOTICE '  - inbound_email_base_domain setting initialized to: inbound.mx.forsured.com';
  RAISE NOTICE '  - Helper function forsured.get_setting() created';
  RAISE NOTICE '  - Indexes and RLS policies applied';

  -- Show current value
  RAISE NOTICE '';
  RAISE NOTICE 'Current inbound email domain: %', forsured.get_setting('inbound_email_base_domain');
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'Forsured app settings table created (Migration 302)';
