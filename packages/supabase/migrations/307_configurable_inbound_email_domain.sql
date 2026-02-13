-- =============================================================================
-- Migration 307: Make inbound email domain configurable
-- REQ-13: Use INBOUND_EMAIL_BASE_DOMAIN instead of hardcoded domain
-- =============================================================================
--
-- The inbound email base domain is read from the Postgres GUC variable
-- app.settings.inbound_email_base_domain. Set it in Supabase Dashboard >
-- Database Settings, or in config.toml under [db.settings].
--
-- Example: app.settings.inbound_email_base_domain = 'inbound.mx.forsured.com'
-- =============================================================================

-- Update the trigger function to use the configurable domain
CREATE OR REPLACE FUNCTION forsured.generate_inbound_email_address()
RETURNS TRIGGER AS $$
DECLARE
  base_domain TEXT;
BEGIN
  -- Only generate for contractors who don't have one
  IF NEW.user_type = 'contractor' AND NEW.inbound_email_address IS NULL THEN
    -- Read domain from app settings, with fallback
    base_domain := current_setting('app.settings.inbound_email_base_domain', true);
    IF base_domain IS NULL OR base_domain = '' THEN
      RAISE WARNING 'app.settings.inbound_email_base_domain not set, skipping inbound email generation';
      RETURN NEW;
    END IF;
    NEW.inbound_email_address := 'insurance-' || NEW.id || '@' || base_domain;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Existing inbound_email_address values are NOT changed by this migration.
-- To update existing addresses to the new domain, run manually:
--
--   UPDATE forsured.user_profiles
--   SET inbound_email_address = 'insurance-' || id || '@' || current_setting('app.settings.inbound_email_base_domain')
--   WHERE user_type = 'contractor'
--   AND inbound_email_address IS NOT NULL;
