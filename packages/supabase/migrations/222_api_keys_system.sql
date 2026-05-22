-- Migration: API Keys System
-- Purpose: Enable third-party API access via API keys for @scaffald/sdk
-- Tables: api_keys, api_key_usage
-- Security: SHA-256 hashed keys, rate limiting support

-- ============================================================================
-- Table: api_keys
-- Stores API keys for third-party application access
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Key identification
  name TEXT NOT NULL,                    -- Human-readable name e.g. "Production API Key"
  key_hash TEXT NOT NULL UNIQUE,         -- SHA-256 hash of the full key
  key_prefix TEXT NOT NULL,              -- e.g. 'sk_live' for display purposes

  -- Permissions
  scopes TEXT[] DEFAULT '{}',            -- e.g. ['read:jobs', 'write:applications']

  -- Rate limiting
  rate_limit_tier TEXT DEFAULT 'free',   -- 'free', 'pro', 'enterprise'

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Tracking
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CHECK (key_prefix IN ('sk_test', 'sk_live')),
  CHECK (rate_limit_tier IN ('free', 'pro', 'enterprise')),
  CHECK (length(name) >= 1 AND length(name) <= 100)
);

-- Indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash
  ON core.api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_organization
  ON core.api_keys(organization_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix
  ON core.api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_keys_expires
  ON core.api_keys(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;

-- ============================================================================
-- Table: api_key_usage
-- Tracks API key usage for analytics and billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  api_key_id UUID NOT NULL REFERENCES core.api_keys(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL,                -- e.g. '/v1/jobs'
  method TEXT NOT NULL,                  -- 'GET', 'POST', 'PUT', 'DELETE'
  status_code INT NOT NULL,              -- HTTP status code
  response_time_ms INT,                  -- Response time in milliseconds

  -- IP tracking (optional)
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  CHECK (status_code >= 100 AND status_code < 600),
  CHECK (response_time_ms >= 0)
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_id
  ON core.api_key_usage(api_key_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp
  ON core.api_key_usage(timestamp DESC);

-- Partition by month for better performance (optional, can be added later)
-- CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp_month
--   ON core.api_key_usage(date_trunc('month', timestamp));

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION core.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_api_keys_updated_at ON core.api_keys;
CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON core.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION core.update_api_keys_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE core.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.api_key_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for API authentication middleware)
DROP POLICY IF EXISTS api_keys_service_role_all ON core.api_keys;
CREATE POLICY api_keys_service_role_all
  ON core.api_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS api_key_usage_service_role_all ON core.api_key_usage;
CREATE POLICY api_key_usage_service_role_all
  ON core.api_key_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can view their organization's keys
DROP POLICY IF EXISTS api_keys_select_own_org ON core.api_keys;
CREATE POLICY api_keys_select_own_org
  ON core.api_keys
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT t.organization_id
      FROM core.team_members tm
      JOIN core.teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Org members can insert keys (role check done at API layer)
DROP POLICY IF EXISTS api_keys_insert_org_member ON core.api_keys;
CREATE POLICY api_keys_insert_org_member
  ON core.api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT t.organization_id
      FROM core.team_members tm
      JOIN core.teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Org members can update keys (role check done at API layer)
DROP POLICY IF EXISTS api_keys_update_org_member ON core.api_keys;
CREATE POLICY api_keys_update_org_member
  ON core.api_keys
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT t.organization_id
      FROM core.team_members tm
      JOIN core.teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT t.organization_id
      FROM core.team_members tm
      JOIN core.teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Org members can delete keys (role check done at API layer)
DROP POLICY IF EXISTS api_keys_delete_org_member ON core.api_keys;
CREATE POLICY api_keys_delete_org_member
  ON core.api_keys
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT t.organization_id
      FROM core.team_members tm
      JOIN core.teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Policy: Users can view usage for their organization's keys
DROP POLICY IF EXISTS api_key_usage_select_own_org ON core.api_key_usage;
CREATE POLICY api_key_usage_select_own_org
  ON core.api_key_usage
  FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (
      SELECT id
      FROM core.api_keys
      WHERE organization_id IN (
        SELECT t.organization_id
        FROM core.team_members tm
        JOIN core.teams t ON tm.team_id = t.id
        WHERE tm.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- Helper function: Clean up expired keys (cron job)
-- ============================================================================

CREATE OR REPLACE FUNCTION core.cleanup_expired_api_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE core.api_keys
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Helper function: Get API key statistics for an organization
-- ============================================================================

CREATE OR REPLACE FUNCTION core.get_api_key_stats(org_id UUID, days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_keys', COUNT(DISTINCT ak.id),
    'active_keys', COUNT(DISTINCT ak.id) FILTER (WHERE ak.is_active = true),
    'total_requests', COUNT(aku.id),
    'requests_last_30_days', COUNT(aku.id) FILTER (WHERE aku.timestamp > now() - interval '1 day' * days),
    'avg_response_time_ms', AVG(aku.response_time_ms)::INTEGER,
    'error_rate', ROUND(
      (COUNT(aku.id) FILTER (WHERE aku.status_code >= 400)::NUMERIC /
       NULLIF(COUNT(aku.id), 0)) * 100,
      2
    )
  ) INTO result
  FROM core.api_keys ak
  LEFT JOIN core.api_key_usage aku ON ak.id = aku.api_key_id
  WHERE ak.organization_id = org_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE core.api_keys IS
  'API keys for third-party application access via @scaffald/sdk';

COMMENT ON COLUMN core.api_keys.key_hash IS
  'SHA-256 hash of the full API key. Never store plain text keys.';

COMMENT ON COLUMN core.api_keys.key_prefix IS
  'Key prefix for display purposes (e.g., sk_live_abc...). Shows first 11 chars.';

COMMENT ON COLUMN core.api_keys.scopes IS
  'Array of permission scopes (e.g., read:jobs, write:applications)';

COMMENT ON COLUMN core.api_keys.rate_limit_tier IS
  'Rate limit tier: free (100 req/min), pro (1000 req/min), enterprise (10000 req/min)';

COMMENT ON TABLE core.api_key_usage IS
  'Tracks API requests made with API keys for analytics and billing';
