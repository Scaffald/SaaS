-- =========================================================
-- 095_create_payment_tables.sql
-- Comprehensive payment system schema additions
-- =========================================================

BEGIN;

-- Ensure pgcrypto is available for encryption helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- =========================================================
-- SECTION 1: BACKGROUND CHECK ENHANCEMENTS
-- =========================================================

ALTER TABLE core.background_checks
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS add_on_ids UUID[] DEFAULT '{}'::UUID[],
  ADD COLUMN IF NOT EXISTS base_price_cents INTEGER CHECK (base_price_cents IS NULL OR base_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS add_ons_price_cents INTEGER CHECK (add_ons_price_cents IS NULL OR add_ons_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS total_price_cents INTEGER CHECK (total_price_cents IS NULL OR total_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nationsearch_request_id TEXT,
  ADD COLUMN IF NOT EXISTS nationsearch_status TEXT,
  ADD COLUMN IF NOT EXISTS results_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_data_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS results_data_encryption_version SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS shared_with_org_ids UUID[] DEFAULT '{}'::UUID[];

ALTER TABLE core.background_checks
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE core.background_checks
  DROP CONSTRAINT IF EXISTS background_checks_user_id_fkey;

ALTER TABLE core.background_checks
  ADD CONSTRAINT background_checks_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS background_checks_public_idx
  ON core.background_checks (is_public)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS background_checks_paid_idx
  ON core.background_checks (paid_at)
  WHERE paid_at IS NOT NULL;

-- =========================================================
-- SECTION 2: SUCCESS FEE TRACKING
-- =========================================================

CREATE TABLE IF NOT EXISTS core.success_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  worker_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES core.jobs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES core.applications(id) ON DELETE SET NULL,

  total_hire_value_cents INTEGER NOT NULL CHECK (total_hire_value_cents >= 0),
  fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  total_fee_cents INTEGER NOT NULL CHECK (total_fee_cents >= 0),

  job_duration_days INTEGER CHECK (job_duration_days IS NULL OR job_duration_days > 0),
  payment_schedule TEXT NOT NULL CHECK (payment_schedule IN ('standard', 'short')),

  upfront_percentage NUMERIC(5,2) NOT NULL,
  upfront_amount_cents INTEGER NOT NULL CHECK (upfront_amount_cents >= 0),
  upfront_payment_intent_id TEXT,
  upfront_paid_at TIMESTAMPTZ,

  final_percentage NUMERIC(5,2) NOT NULL,
  final_amount_cents INTEGER NOT NULL CHECK (final_amount_cents >= 0),
  final_payment_intent_id TEXT,
  final_payment_due_date DATE NOT NULL,
  final_paid_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'upfront_paid', 'completed', 'failed', 'cancelled')),

  duration_adjusted BOOLEAN NOT NULL DEFAULT FALSE,
  original_schedule TEXT,
  adjustment_notes TEXT,

  hire_start_date DATE NOT NULL,
  hire_confirmed_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT success_fee_percentages_check
    CHECK (upfront_percentage + final_percentage = 100),
  CONSTRAINT success_fee_amounts_check
    CHECK (upfront_amount_cents + final_amount_cents = total_fee_cents)
);

COMMENT ON TABLE core.success_fees
  IS 'Tracks success fee schedules and payment states for confirmed hires.';

CREATE INDEX IF NOT EXISTS success_fees_org_idx
  ON core.success_fees (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS success_fees_worker_idx
  ON core.success_fees (worker_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS success_fees_status_idx
  ON core.success_fees (status);

CREATE INDEX IF NOT EXISTS success_fees_final_due_idx
  ON core.success_fees (final_payment_due_date)
  WHERE status IN ('upfront_paid', 'pending');

DROP TRIGGER IF EXISTS success_fees_set_updated_at ON core.success_fees;
CREATE TRIGGER success_fees_set_updated_at
  BEFORE UPDATE ON core.success_fees
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 3: SERVICE PRICING & ADD-ONS
-- =========================================================

CREATE TABLE IF NOT EXISTS core.service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  tier TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS service_pricing_unique_idx
  ON core.service_pricing (service_type, COALESCE(tier, ''), name);

COMMENT ON TABLE core.service_pricing
  IS 'Configurable pricing rows for background checks, ID verification, and other payment-based services.';

CREATE INDEX IF NOT EXISTS service_pricing_active_idx
  ON core.service_pricing (service_type)
  WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS service_pricing_set_updated_at ON core.service_pricing;
CREATE TRIGGER service_pricing_set_updated_at
  BEFORE UPDATE ON core.service_pricing
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE IF NOT EXISTS core.background_check_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.background_check_addons
  IS 'Optional add-on components that can be attached to a background check request.';

CREATE INDEX IF NOT EXISTS background_check_addons_active_idx
  ON core.background_check_addons (is_active);

DROP TRIGGER IF EXISTS background_check_addons_set_updated_at ON core.background_check_addons;
CREATE TRIGGER background_check_addons_set_updated_at
  BEFORE UPDATE ON core.background_check_addons
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 4: COMPLIANCE SUPPORT TABLES
-- =========================================================

CREATE TABLE IF NOT EXISTS core.background_check_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  worker_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  consent_text TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS background_check_consent_check_idx
  ON core.background_check_consent (background_check_id);

CREATE INDEX IF NOT EXISTS background_check_consent_worker_idx
  ON core.background_check_consent (worker_user_id)
  WHERE worker_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS core.background_check_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  disclosure_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  delivery_method TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS background_check_disclosures_check_idx
  ON core.background_check_disclosures (background_check_id);

-- Note: background_check_disputes table already exists from migration 032
-- This migration does not recreate it to avoid conflicts

CREATE TABLE IF NOT EXISTS core.background_check_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_check_id UUID NOT NULL REFERENCES core.background_checks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  accessed_by_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (background_check_id, organization_id)
);

CREATE INDEX IF NOT EXISTS background_check_access_check_idx
  ON core.background_check_access (background_check_id);

CREATE INDEX IF NOT EXISTS background_check_access_org_idx
  ON core.background_check_access (organization_id);

DROP TRIGGER IF EXISTS background_check_access_set_updated_at ON core.background_check_access;
CREATE TRIGGER background_check_access_set_updated_at
  BEFORE UPDATE ON core.background_check_access
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 5: ID VERIFICATION TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS core.id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  worker_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  initiated_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  initiated_by_org_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,

  payment_intent_id TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  paid_at TIMESTAMPTZ NOT NULL,

  persona_inquiry_id TEXT NOT NULL,
  persona_status TEXT,

  verification_level TEXT,
  verified_at TIMESTAMPTZ,
  verification_data JSONB,

  badge_status TEXT NOT NULL DEFAULT 'active'
    CHECK (badge_status IN ('active', 'expired', 'revoked')),
  badge_expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  revocation_reason TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS id_verifications_worker_idx
  ON core.id_verifications (worker_user_id);

CREATE INDEX IF NOT EXISTS id_verifications_badge_idx
  ON core.id_verifications (badge_status);

CREATE INDEX IF NOT EXISTS id_verifications_expiring_idx
  ON core.id_verifications (badge_expires_at)
  WHERE badge_status = 'active' AND badge_expires_at IS NOT NULL;

DROP TRIGGER IF EXISTS id_verifications_set_updated_at ON core.id_verifications;
CREATE TRIGGER id_verifications_set_updated_at
  BEFORE UPDATE ON core.id_verifications
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 6: PAYMENT TRANSACTIONS LEDGER
-- =========================================================

CREATE TABLE IF NOT EXISTS core.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,

  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'success_fee_upfront',
      'success_fee_final',
      'background_check',
      'background_check_shared',
      'id_verification',
      'credit_deposit',
      'credit_refund'
    )
  ),

  success_fee_id UUID REFERENCES core.success_fees(id) ON DELETE SET NULL,
  background_check_id UUID REFERENCES core.background_checks(id) ON DELETE SET NULL,
  background_check_access_id UUID REFERENCES core.background_check_access(id) ON DELETE SET NULL,
  id_verification_id UUID REFERENCES core.id_verifications(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  failure_reason TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS payment_transactions_org_idx
  ON core.payment_transactions (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_transactions_user_idx
  ON core.payment_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_transactions_type_idx
  ON core.payment_transactions (transaction_type);

CREATE INDEX IF NOT EXISTS payment_transactions_status_idx
  ON core.payment_transactions (status);

CREATE INDEX IF NOT EXISTS payment_transactions_stripe_idx
  ON core.payment_transactions (stripe_payment_intent_id);

DROP TRIGGER IF EXISTS payment_transactions_set_updated_at ON core.payment_transactions;
CREATE TRIGGER payment_transactions_set_updated_at
  BEFORE UPDATE ON core.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 7: SUPPORTING FUNCTIONS
-- =========================================================

CREATE OR REPLACE FUNCTION core.encrypt_background_check_results(
  p_data JSONB,
  p_secret TEXT
) RETURNS BYTEA AS $$
  SELECT
    CASE
      WHEN p_data IS NULL THEN NULL
      ELSE pgp_sym_encrypt(p_data::TEXT, p_secret, 'compress-algo=1')
    END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION core.decrypt_background_check_results(
  p_encrypted BYTEA,
  p_secret TEXT
) RETURNS JSONB AS $$
  SELECT
    CASE
      WHEN p_encrypted IS NULL THEN NULL
      ELSE pgp_sym_decrypt(p_encrypted, p_secret)::JSONB
    END;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION core.get_current_verification(
  p_worker_user_id UUID
) RETURNS TABLE (
  id UUID,
  verification_level TEXT,
  verified_at TIMESTAMPTZ,
  badge_status TEXT,
  badge_expires_at TIMESTAMPTZ
) AS $$
  SELECT
    v.id,
    v.verification_level,
    v.verified_at,
    v.badge_status,
    v.badge_expires_at
  FROM core.id_verifications v
  WHERE v.worker_user_id = p_worker_user_id
    AND v.badge_status IN ('active', 'expired')
  ORDER BY v.verified_at DESC NULLS LAST
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION core.anonymize_worker_payment_data(
  p_worker_user_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE core.success_fees
    SET worker_user_id = NULL
    WHERE worker_user_id = p_worker_user_id;

  UPDATE core.background_checks
    SET user_id = NULL
    WHERE user_id = p_worker_user_id;

  UPDATE core.background_check_consent
    SET worker_user_id = NULL
    WHERE worker_user_id = p_worker_user_id;

  UPDATE core.background_check_disputes
    SET user_id = NULL
    WHERE user_id = p_worker_user_id;

  UPDATE core.id_verifications
    SET worker_user_id = NULL
    WHERE worker_user_id = p_worker_user_id;

  UPDATE core.payment_transactions
    SET user_id = NULL
    WHERE user_id = p_worker_user_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

