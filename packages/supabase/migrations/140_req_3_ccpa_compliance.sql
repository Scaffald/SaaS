-- 138_req_3_ccpa_compliance.sql
-- CCPA compliance system for Scaffald platform
-- Provides request management, opt-out tracking, OAuth app registry, and audit trails

BEGIN;

-- ========================================================
-- ENUM TYPES
-- ========================================================

-- CCPA request types
DO $$ BEGIN
  CREATE TYPE core.ccpa_request_type AS ENUM (
    'access',
    'deletion',
    'correction',
    'opt_out',
    'opt_in',
    'portability'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CCPA request status
DO $$ BEGIN
  CREATE TYPE core.ccpa_request_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'denied',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Identity verification method
DO $$ BEGIN
  CREATE TYPE core.ccpa_verification_method AS ENUM (
    'email',
    'enhanced',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Opt-out categories
DO $$ BEGIN
  CREATE TYPE core.ccpa_opt_out_category AS ENUM (
    'sale',
    'sharing',
    'targeted_advertising',
    'profiling'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Opt-out source tracking
DO $$ BEGIN
  CREATE TYPE core.ccpa_opt_out_source AS ENUM (
    'user_request',
    'gpc_signal',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================================
-- CCPA REQUESTS TABLE
-- Main table for tracking CCPA data subject requests
-- ========================================================
CREATE TABLE IF NOT EXISTS core.ccpa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  request_type core.ccpa_request_type NOT NULL,
  status core.ccpa_request_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  extended_deadline_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Denial tracking
  denial_reason TEXT,

  -- Identity verification
  verification_method core.ccpa_verification_method NOT NULL DEFAULT 'email',
  verification_completed_at TIMESTAMPTZ,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMPTZ,

  -- Flexible metadata storage
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.ccpa_requests
  IS 'Tracks CCPA data subject requests (access, deletion, correction, opt-out, portability). 45-day deadline enforced.';
COMMENT ON COLUMN core.ccpa_requests.deadline_at
  IS '45-day deadline from submission per CCPA requirements.';
COMMENT ON COLUMN core.ccpa_requests.extended_deadline_at
  IS 'Additional 45-day extension if approved, per CCPA allowance for complex requests.';
COMMENT ON COLUMN core.ccpa_requests.metadata
  IS 'Flexible storage for request-specific data (correction details, portability format, etc.).';

-- ========================================================
-- CCPA REQUEST HISTORY TABLE
-- Audit trail for all request status changes
-- ========================================================
CREATE TABLE IF NOT EXISTS core.ccpa_request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request reference
  request_id UUID NOT NULL REFERENCES core.ccpa_requests(id) ON DELETE CASCADE,

  -- Change tracking
  status core.ccpa_request_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Details
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

COMMENT ON TABLE core.ccpa_request_history
  IS 'Audit log tracking all status changes for CCPA requests. Required for compliance reporting.';

-- ========================================================
-- CCPA OPT-OUTS TABLE
-- Tracks user opt-out preferences per category
-- ========================================================
CREATE TABLE IF NOT EXISTS core.ccpa_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Opt-out details
  category core.ccpa_opt_out_category NOT NULL,
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source core.ccpa_opt_out_source NOT NULL DEFAULT 'user_request',

  -- Flexible metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one opt-out per user per category
  CONSTRAINT ccpa_opt_outs_user_category_unique UNIQUE (user_id, category)
);

COMMENT ON TABLE core.ccpa_opt_outs
  IS 'Tracks user opt-out preferences for sale, sharing, targeted advertising, and profiling.';
COMMENT ON COLUMN core.ccpa_opt_outs.source
  IS 'Tracks whether opt-out came from user request, GPC browser signal, or admin action.';

-- ========================================================
-- CCPA OAUTH APP REGISTRY TABLE
-- Tracks OAuth apps that integrate with CCPA system
-- ========================================================
CREATE TABLE IF NOT EXISTS core.ccpa_oauth_app_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- App identification
  app_id TEXT NOT NULL UNIQUE,
  app_name TEXT NOT NULL,

  -- Data category registration
  data_categories JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Webhook configuration
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,

  -- Status tracking
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.ccpa_oauth_app_registry
  IS 'Registry of OAuth apps that participate in CCPA compliance. Apps register data categories and receive webhooks.';
COMMENT ON COLUMN core.ccpa_oauth_app_registry.data_categories
  IS 'JSON array of data category definitions this app handles (e.g., insurance_policies, compliance_records).';
COMMENT ON COLUMN core.ccpa_oauth_app_registry.webhook_url
  IS 'URL to receive CCPA webhooks (export requests, deletion requests).';

-- ========================================================
-- CCPA EXPORT DOWNLOADS TABLE
-- Tracks secure download links for data exports
-- ========================================================
CREATE TABLE IF NOT EXISTS core.ccpa_export_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  request_id UUID NOT NULL REFERENCES core.ccpa_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Storage details
  s3_key TEXT NOT NULL,
  s3_bucket TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_format TEXT NOT NULL DEFAULT 'pdf',

  -- Signed URL (ephemeral, regenerated on request)
  signed_url TEXT,

  -- Expiry and download limits
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0,
  max_downloads INTEGER NOT NULL DEFAULT 3,
  first_downloaded_at TIMESTAMPTZ,
  last_downloaded_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.ccpa_export_downloads
  IS 'Tracks data export files stored in S3 with download limits and expiration.';
COMMENT ON COLUMN core.ccpa_export_downloads.expires_at
  IS 'Export files expire 24 hours after generation.';
COMMENT ON COLUMN core.ccpa_export_downloads.max_downloads
  IS 'Maximum allowed downloads (default 3) before URL is invalidated.';

-- ========================================================
-- INDEXES
-- ========================================================

-- ccpa_requests indexes
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_user_id
  ON core.ccpa_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_status
  ON core.ccpa_requests (status);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_deadline
  ON core.ccpa_requests (deadline_at);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_type
  ON core.ccpa_requests (request_type);
CREATE INDEX IF NOT EXISTS idx_ccpa_requests_pending_deadline
  ON core.ccpa_requests (deadline_at)
  WHERE status IN ('pending', 'in_progress');

-- ccpa_request_history indexes
CREATE INDEX IF NOT EXISTS idx_ccpa_request_history_request_id
  ON core.ccpa_request_history (request_id, changed_at DESC);

-- ccpa_opt_outs indexes
CREATE INDEX IF NOT EXISTS idx_ccpa_opt_outs_user_id
  ON core.ccpa_opt_outs (user_id);

-- ccpa_export_downloads indexes
CREATE INDEX IF NOT EXISTS idx_ccpa_export_downloads_request_id
  ON core.ccpa_export_downloads (request_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_export_downloads_user_id
  ON core.ccpa_export_downloads (user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_export_downloads_expires
  ON core.ccpa_export_downloads (expires_at)
  WHERE download_count < max_downloads;

-- ========================================================
-- TRIGGERS
-- ========================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS ccpa_requests_set_updated_at ON core.ccpa_requests;
CREATE TRIGGER ccpa_requests_set_updated_at
  BEFORE UPDATE ON core.ccpa_requests
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

DROP TRIGGER IF EXISTS ccpa_oauth_app_registry_set_updated_at ON core.ccpa_oauth_app_registry;
CREATE TRIGGER ccpa_oauth_app_registry_set_updated_at
  BEFORE UPDATE ON core.ccpa_oauth_app_registry
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Auto-calculate deadline (45 days from submission)
CREATE OR REPLACE FUNCTION core.ccpa_set_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline_at IS NULL THEN
    NEW.deadline_at := NEW.submitted_at + INTERVAL '45 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ccpa_requests_set_deadline ON core.ccpa_requests;
CREATE TRIGGER ccpa_requests_set_deadline
  BEFORE INSERT ON core.ccpa_requests
  FOR EACH ROW EXECUTE FUNCTION core.ccpa_set_deadline();

-- Auto-record history on status change
CREATE OR REPLACE FUNCTION core.ccpa_record_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO core.ccpa_request_history (request_id, status, changed_by, notes)
    VALUES (NEW.id, NEW.status, auth.uid(), 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ccpa_requests_record_history ON core.ccpa_requests;
CREATE TRIGGER ccpa_requests_record_history
  AFTER UPDATE ON core.ccpa_requests
  FOR EACH ROW EXECUTE FUNCTION core.ccpa_record_history();

-- ========================================================
-- ROW LEVEL SECURITY
-- ========================================================

-- Enable RLS on all tables
ALTER TABLE core.ccpa_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.ccpa_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.ccpa_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.ccpa_oauth_app_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.ccpa_export_downloads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- ccpa_requests policies
-- --------------------------------------------------------

-- Users can view their own requests
DROP POLICY IF EXISTS ccpa_requests_select_own ON core.ccpa_requests;
CREATE POLICY ccpa_requests_select_own ON core.ccpa_requests
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- Users can create their own requests
DROP POLICY IF EXISTS ccpa_requests_insert_own ON core.ccpa_requests;
CREATE POLICY ccpa_requests_insert_own ON core.ccpa_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can cancel their own pending requests; admins can update any
DROP POLICY IF EXISTS ccpa_requests_update ON core.ccpa_requests;
CREATE POLICY ccpa_requests_update ON core.ccpa_requests
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  )
  WITH CHECK (
    (user_id = auth.uid() AND status = 'cancelled')
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- --------------------------------------------------------
-- ccpa_request_history policies
-- --------------------------------------------------------

-- Users can view history for their own requests; admins can view all
DROP POLICY IF EXISTS ccpa_request_history_select ON core.ccpa_request_history;
CREATE POLICY ccpa_request_history_select ON core.ccpa_request_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.ccpa_requests cr
      WHERE cr.id = request_id AND cr.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- Only service role can insert history (via trigger)
DROP POLICY IF EXISTS ccpa_request_history_insert ON core.ccpa_request_history;
CREATE POLICY ccpa_request_history_insert ON core.ccpa_request_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- --------------------------------------------------------
-- ccpa_opt_outs policies
-- --------------------------------------------------------

-- Users can view their own opt-outs
DROP POLICY IF EXISTS ccpa_opt_outs_select_own ON core.ccpa_opt_outs;
CREATE POLICY ccpa_opt_outs_select_own ON core.ccpa_opt_outs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- Users can create their own opt-outs
DROP POLICY IF EXISTS ccpa_opt_outs_insert_own ON core.ccpa_opt_outs;
CREATE POLICY ccpa_opt_outs_insert_own ON core.ccpa_opt_outs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own opt-outs (opt-in)
DROP POLICY IF EXISTS ccpa_opt_outs_delete_own ON core.ccpa_opt_outs;
CREATE POLICY ccpa_opt_outs_delete_own ON core.ccpa_opt_outs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- --------------------------------------------------------
-- ccpa_oauth_app_registry policies
-- --------------------------------------------------------

-- Only admins can manage OAuth app registry
DROP POLICY IF EXISTS ccpa_oauth_app_registry_select ON core.ccpa_oauth_app_registry;
CREATE POLICY ccpa_oauth_app_registry_select ON core.ccpa_oauth_app_registry
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

DROP POLICY IF EXISTS ccpa_oauth_app_registry_insert ON core.ccpa_oauth_app_registry;
CREATE POLICY ccpa_oauth_app_registry_insert ON core.ccpa_oauth_app_registry
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name = 'super_admin'
    )
  );

DROP POLICY IF EXISTS ccpa_oauth_app_registry_update ON core.ccpa_oauth_app_registry;
CREATE POLICY ccpa_oauth_app_registry_update ON core.ccpa_oauth_app_registry
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name = 'super_admin'
    )
  );

DROP POLICY IF EXISTS ccpa_oauth_app_registry_delete ON core.ccpa_oauth_app_registry;
CREATE POLICY ccpa_oauth_app_registry_delete ON core.ccpa_oauth_app_registry
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name = 'super_admin'
    )
  );

-- --------------------------------------------------------
-- ccpa_export_downloads policies
-- --------------------------------------------------------

-- Users can view their own downloads
DROP POLICY IF EXISTS ccpa_export_downloads_select_own ON core.ccpa_export_downloads;
CREATE POLICY ccpa_export_downloads_select_own ON core.ccpa_export_downloads
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- Only service role can insert downloads (via API)
DROP POLICY IF EXISTS ccpa_export_downloads_insert ON core.ccpa_export_downloads;
CREATE POLICY ccpa_export_downloads_insert ON core.ccpa_export_downloads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

-- Users can update download count for their own downloads
DROP POLICY IF EXISTS ccpa_export_downloads_update ON core.ccpa_export_downloads;
CREATE POLICY ccpa_export_downloads_update ON core.ccpa_export_downloads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ========================================================
-- GRANTS
-- ========================================================

GRANT ALL ON TABLE core.ccpa_requests TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE core.ccpa_requests TO authenticated;

GRANT ALL ON TABLE core.ccpa_request_history TO service_role;
GRANT SELECT, INSERT ON TABLE core.ccpa_request_history TO authenticated;

GRANT ALL ON TABLE core.ccpa_opt_outs TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE core.ccpa_opt_outs TO authenticated;

GRANT ALL ON TABLE core.ccpa_oauth_app_registry TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.ccpa_oauth_app_registry TO authenticated;

GRANT ALL ON TABLE core.ccpa_export_downloads TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE core.ccpa_export_downloads TO authenticated;

COMMIT;
