-- =========================================================
-- 118_req_92_settings_audit_limits.sql
-- REQ-92: Organization settings, audit log, and storage limit tracking
-- =========================================================

BEGIN;

-- =========================================================
-- Organization Settings
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES core.organizations(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en-US',
  default_currency TEXT NOT NULL DEFAULT 'USD',
  business_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  holiday_calendar JSONB NOT NULL DEFAULT '[]'::jsonb,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  security_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  enforce_mfa BOOLEAN NOT NULL DEFAULT FALSE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  ip_allow_list TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  storage_warning_thresholds NUMERIC[] NOT NULL DEFAULT ARRAY[0.75, 0.9, 0.95, 0.99],
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_settings
  IS 'Organization-wide configuration for locale, notifications, privacy, and security.';
COMMENT ON COLUMN core.organization_settings.storage_warning_thresholds
  IS 'Array of percentages (0-1) used to trigger storage warning banners.';

CREATE TRIGGER organization_settings_set_updated_at
  BEFORE UPDATE ON core.organization_settings
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Organization Audit Log
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  description TEXT,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_audit_log
  IS 'Immutable log of sensitive organization actions for compliance and troubleshooting.';

CREATE INDEX IF NOT EXISTS organization_audit_log_org_idx
  ON core.organization_audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS organization_audit_log_action_idx
  ON core.organization_audit_log(action_type);

-- =========================================================
-- Subscription Tier Defaults & Overrides
-- =========================================================
CREATE TABLE IF NOT EXISTS core.subscription_tier_limits (
  tier TEXT PRIMARY KEY,
  description TEXT,
  max_storage_bytes BIGINT NOT NULL DEFAULT (10::bigint * 1024 * 1024 * 1024), -- 10 GB
  max_file_bytes BIGINT NOT NULL DEFAULT (25::bigint * 1024 * 1024), -- 25 MB
  max_members INTEGER NOT NULL DEFAULT 50,
  soft_warning_thresholds NUMERIC[] NOT NULL DEFAULT ARRAY[0.75, 0.9, 0.95, 0.99],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.subscription_tier_limits
  IS 'Baseline resource allocations for each subscription tier.';

CREATE TRIGGER subscription_tier_limits_set_updated_at
  BEFORE UPDATE ON core.subscription_tier_limits
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

INSERT INTO core.subscription_tier_limits (tier, description, max_storage_bytes, max_file_bytes, max_members)
VALUES
  ('starter', 'Default starter tier', 10::bigint * 1024 * 1024 * 1024, 25::bigint * 1024 * 1024, 15),
  ('growth', 'Growth tier', 25::bigint * 1024 * 1024 * 1024, 50::bigint * 1024 * 1024, 75),
  ('enterprise', 'Enterprise tier', 100::bigint * 1024 * 1024 * 1024, 100::bigint * 1024 * 1024, 1000)
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS core.organization_limit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  storage_bytes BIGINT,
  file_bytes BIGINT,
  member_count INTEGER,
  reason TEXT,
  granted_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_limit_overrides
  IS 'Per-organization resource overrides managed by the office/admin team.';

CREATE INDEX IF NOT EXISTS organization_limit_overrides_org_idx
  ON core.organization_limit_overrides(organization_id)
  WHERE active = TRUE;

CREATE TRIGGER organization_limit_overrides_set_updated_at
  BEFORE UPDATE ON core.organization_limit_overrides
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Storage Usage Snapshot
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_storage_usage (
  organization_id UUID PRIMARY KEY REFERENCES core.organizations(id) ON DELETE CASCADE,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  document_count INTEGER NOT NULL DEFAULT 0,
  version_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_storage_usage
  IS 'Denormalized counters for documents + storage consumption, refreshed via cron.';

-- =========================================================
-- Row Level Security
-- =========================================================
ALTER TABLE core.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.subscription_tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_limit_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_storage_usage ENABLE ROW LEVEL SECURITY;

-- Settings policies
DROP POLICY IF EXISTS organization_settings_select ON core.organization_settings;
CREATE POLICY organization_settings_select ON core.organization_settings
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_settings_upsert ON core.organization_settings;
CREATE POLICY organization_settings_upsert ON core.organization_settings
  FOR ALL TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

-- Audit log policies (read-only for members)
DROP POLICY IF EXISTS organization_audit_log_select ON core.organization_audit_log;
CREATE POLICY organization_audit_log_select ON core.organization_audit_log
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

-- Subscription tiers (read-only)
DROP POLICY IF EXISTS subscription_tier_limits_select ON core.subscription_tier_limits;
CREATE POLICY subscription_tier_limits_select ON core.subscription_tier_limits
  FOR SELECT TO authenticated
  USING (TRUE);

-- Limit overrides
DROP POLICY IF EXISTS organization_limit_overrides_select ON core.organization_limit_overrides;
CREATE POLICY organization_limit_overrides_select ON core.organization_limit_overrides
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_limit_overrides_mutation ON core.organization_limit_overrides;
CREATE POLICY organization_limit_overrides_mutation ON core.organization_limit_overrides
  FOR ALL TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

-- Storage usage snapshots (read-only to org members)
DROP POLICY IF EXISTS organization_storage_usage_select ON core.organization_storage_usage;
CREATE POLICY organization_storage_usage_select ON core.organization_storage_usage
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.organization_settings TO service_role;
GRANT ALL ON TABLE core.organization_audit_log TO service_role;
GRANT ALL ON TABLE core.subscription_tier_limits TO service_role;
GRANT ALL ON TABLE core.organization_limit_overrides TO service_role;
GRANT ALL ON TABLE core.organization_storage_usage TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_settings TO authenticated;
GRANT SELECT ON TABLE core.organization_audit_log TO authenticated;
GRANT SELECT ON TABLE core.subscription_tier_limits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_limit_overrides TO authenticated;
GRANT SELECT ON TABLE core.organization_storage_usage TO authenticated;

COMMIT;

