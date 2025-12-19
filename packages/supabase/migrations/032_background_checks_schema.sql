-- =========================================================
-- 032_background_checks_schema.sql
-- Foundational schema objects for background check system
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: ENUM TYPES
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'background_check_status'
      AND n.nspname = 'core'
  ) THEN
    CREATE TYPE core.background_check_status AS ENUM (
      'pending',
      'invited',
      'submitted',
      'in_progress',
      'under_review',
      'completed_clear',
      'completed_consider',
      'completed_not_clear',
      'partially_completed',
      'failed',
      'cancelled',
      'disputed',
      'expired',
      'refunded'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'background_check_paid_by'
      AND n.nspname = 'core'
  ) THEN
    CREATE TYPE core.background_check_paid_by AS ENUM ('worker', 'organization', 'platform');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'background_check_dispute_status'
      AND n.nspname = 'core'
  ) THEN
    CREATE TYPE core.background_check_dispute_status AS ENUM (
      'pending',
      'under_review',
      'resolved',
      'upheld',
      'cancelled'
    );
  END IF;
END;
$$;

-- =========================================================
-- SECTION 2: LOOKUP TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_check_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  provider_check_code TEXT UNIQUE,
  validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0),
  platform_cost_cents INTEGER NOT NULL CHECK (platform_cost_cents >= 0),
  retail_cost_cents INTEGER CHECK (retail_cost_cents IS NULL OR retail_cost_cents >= 0),
  estimated_completion_days INTEGER CHECK (estimated_completion_days IS NULL OR estimated_completion_days >= 0),
  required_documents JSONB NOT NULL DEFAULT '[]'::JSONB,
  provider_configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.background_check_types
  IS 'Atomic NationSearch background screening components with validity and pricing metadata.';

CREATE TRIGGER background_check_types_set_updated_at
  BEFORE UPDATE ON core.background_check_types
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE IF NOT EXISTS core.background_check_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  provider_package_code TEXT UNIQUE,
  check_type_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  component_overrides JSONB NOT NULL DEFAULT '[]'::JSONB,
  platform_cost_cents INTEGER NOT NULL CHECK (platform_cost_cents >= 0),
  retail_cost_cents INTEGER NOT NULL CHECK (retail_cost_cents >= 0),
  estimated_completion_days INTEGER CHECK (estimated_completion_days IS NULL OR estimated_completion_days >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT background_check_packages_component_count_chk
    CHECK (array_length(check_type_ids, 1) IS NULL OR array_length(check_type_ids, 1) > 0)
);

COMMENT ON TABLE core.background_check_packages
  IS 'Pre-configured screening packages composed of multiple background check types.';

CREATE TRIGGER background_check_packages_set_updated_at
  BEFORE UPDATE ON core.background_check_packages
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 3: CORE BACKGROUND CHECK TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actors & relationships
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  job_id UUID REFERENCES core.jobs(id) ON DELETE SET NULL,
  requested_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  package_id UUID REFERENCES core.background_check_packages(id) ON DELETE SET NULL,

  -- Configuration
  check_type_ids UUID[] NOT NULL DEFAULT '{}'::UUID[],
  custom_configuration JSONB NOT NULL DEFAULT '{}'::JSONB,
  component_statuses JSONB NOT NULL DEFAULT '[]'::JSONB,
  provider_check_id TEXT,
  provider_reference JSONB,

  -- Status & lifecycle
  status core.background_check_status NOT NULL DEFAULT 'pending',
  status_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  initiated_by TEXT NOT NULL DEFAULT 'worker' CHECK (initiated_by IN ('worker', 'organization', 'admin')),
  invited_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  estimated_completion_date DATE,

  -- Results
  findings JSONB,
  summary TEXT,
  notes TEXT,

  -- Compliance & consent
  consent_given_at TIMESTAMPTZ,
  consent_ip_address INET,
  consent_user_agent TEXT,
  consent_signature TEXT,
  disclosure_provided_at TIMESTAMPTZ,
  summary_of_rights_provided_at TIMESTAMPTZ,
  pre_adverse_action_sent_at TIMESTAMPTZ,
  adverse_action_sent_at TIMESTAMPTZ,

  -- Payment tracking
  payment_id UUID,
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  paid_by core.background_check_paid_by,

  -- Audit metadata
  last_webhook_event_at TIMESTAMPTZ,
  webhook_delivery_attempts INTEGER NOT NULL DEFAULT 0 CHECK (webhook_delivery_attempts >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT background_checks_type_count_chk
    CHECK (array_length(check_type_ids, 1) IS NULL OR array_length(check_type_ids, 1) > 0)
);

COMMENT ON TABLE core.background_checks
  IS 'Primary record of worker background checks including package selection, lifecycle, and compliance metadata.';

CREATE INDEX IF NOT EXISTS background_checks_user_idx
  ON core.background_checks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS background_checks_status_idx
  ON core.background_checks (status);

CREATE INDEX IF NOT EXISTS background_checks_package_idx
  ON core.background_checks (package_id);

CREATE INDEX IF NOT EXISTS background_checks_expires_at_idx
  ON core.background_checks (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS background_checks_org_idx
  ON core.background_checks (organization_id, created_at DESC);

CREATE TRIGGER background_checks_set_updated_at
  BEFORE UPDATE ON core.background_checks
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 4: DOCUMENT MANAGEMENT
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_check_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER CHECK (file_size IS NULL OR file_size >= 0),
  mime_type TEXT,
  uploaded_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  delete_after TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.background_check_documents
  IS 'Metadata for documents gathered during background checks and stored in Supabase storage.';

CREATE INDEX IF NOT EXISTS background_check_documents_check_idx
  ON core.background_check_documents (background_check_id);

CREATE INDEX IF NOT EXISTS background_check_documents_type_idx
  ON core.background_check_documents (document_type);

CREATE TRIGGER background_check_documents_set_updated_at
  BEFORE UPDATE ON core.background_check_documents
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 5: ACCESS LOGGING
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_check_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  accessed_by_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  accessed_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

COMMENT ON TABLE core.background_check_access_log
  IS 'Immutable audit log for background check data access events.';

CREATE INDEX IF NOT EXISTS background_check_access_log_check_idx
  ON core.background_check_access_log (background_check_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS background_check_access_log_user_idx
  ON core.background_check_access_log (accessed_by_user_id, accessed_at DESC);

-- =========================================================
-- SECTION 6: DISPUTE TRACKING
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_check_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  dispute_details TEXT,
  supporting_documents JSONB NOT NULL DEFAULT '[]'::JSONB,
  status core.background_check_dispute_status NOT NULL DEFAULT 'pending',
  resolution TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.background_check_disputes
  IS 'Tracks worker disputes of background check results including resolution workflow.';

CREATE INDEX IF NOT EXISTS background_check_disputes_check_idx
  ON core.background_check_disputes (background_check_id);

CREATE INDEX IF NOT EXISTS background_check_disputes_status_idx
  ON core.background_check_disputes (status);

CREATE TRIGGER background_check_disputes_set_updated_at
  BEFORE UPDATE ON core.background_check_disputes
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMIT;



