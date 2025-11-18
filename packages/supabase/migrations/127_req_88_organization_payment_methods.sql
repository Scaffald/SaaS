-- 127_req_88_organization_payment_methods.sql
-- Adds organization payment method storage and Stripe customer references

BEGIN;

-- ========================================================
-- Organization columns for Stripe customer + defaults
-- ========================================================
ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS default_payment_method_id UUID;

-- ========================================================
-- Organization payment methods table
-- ========================================================
CREATE TABLE IF NOT EXISTS core.organization_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  brand TEXT,
  last4 TEXT,
  exp_month SMALLINT,
  exp_year SMALLINT,
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  billing_country TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE core.organization_payment_methods
  IS 'Stores saved Stripe payment methods for organizations.';
COMMENT ON COLUMN core.organization_payment_methods.stripe_payment_method_id
  IS 'Stripe Payment Method reference (pm_xxx).';

CREATE UNIQUE INDEX IF NOT EXISTS organization_payment_methods_stripe_pm_unique
  ON core.organization_payment_methods (stripe_payment_method_id);

CREATE UNIQUE INDEX IF NOT EXISTS organization_payment_methods_single_active_idx
  ON core.organization_payment_methods (organization_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS organization_payment_methods_org_idx
  ON core.organization_payment_methods (organization_id, created_at DESC);

CREATE TRIGGER organization_payment_methods_set_updated_at
  BEFORE UPDATE ON core.organization_payment_methods
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Link organizations.default_payment_method_id once table exists
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_default_payment_method_fk
    FOREIGN KEY (default_payment_method_id)
    REFERENCES core.organization_payment_methods(id)
    ON DELETE SET NULL;

-- ========================================================
-- Row Level Security
-- ========================================================
ALTER TABLE core.organization_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_payment_methods_select ON core.organization_payment_methods;
CREATE POLICY organization_payment_methods_select ON core.organization_payment_methods
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_payment_methods_insert ON core.organization_payment_methods;
CREATE POLICY organization_payment_methods_insert ON core.organization_payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_payment_methods_update ON core.organization_payment_methods;
CREATE POLICY organization_payment_methods_update ON core.organization_payment_methods
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_payment_methods_delete ON core.organization_payment_methods;
CREATE POLICY organization_payment_methods_delete ON core.organization_payment_methods
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

GRANT ALL ON TABLE core.organization_payment_methods TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_payment_methods TO authenticated;

COMMIT;


