-- 130_req_88_account_deletion.sql
-- Adds account deletion workflows with compliance logging and Stripe cleanup tracking

BEGIN;

-- ========================================================
-- Account deletion audit log
-- ========================================================
CREATE TABLE IF NOT EXISTS core.account_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deletion details
  deleted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('worker', 'organization')),
  
  -- Request details
  requested_by_user_id UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  
  -- Anonymization status
  payment_data_anonymized BOOLEAN NOT NULL DEFAULT FALSE,
  payment_data_anonymized_at TIMESTAMPTZ,
  
  -- Stripe cleanup status
  stripe_customer_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_deleted_at TIMESTAMPTZ,
  stripe_payment_methods_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_payment_methods_deleted_at TIMESTAMPTZ,
  stripe_cleanup_errors TEXT[],
  
  -- Compliance logging
  compliance_log JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.account_deletions
  IS 'Audit log for account deletion operations. Tracks anonymization, Stripe cleanup, and compliance requirements.';
COMMENT ON COLUMN core.account_deletions.stripe_cleanup_errors
  IS 'Array of error messages from Stripe cleanup operations if any failures occurred.';
COMMENT ON COLUMN core.account_deletions.compliance_log
  IS 'JSON object containing compliance-related information (GDPR, CCPA, etc.).';

CREATE INDEX IF NOT EXISTS account_deletions_user_idx
  ON core.account_deletions (deleted_user_id, created_at DESC)
  WHERE deleted_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_deletions_org_idx
  ON core.account_deletions (deleted_organization_id, created_at DESC)
  WHERE deleted_organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS account_deletions_status_idx
  ON core.account_deletions (status);

CREATE INDEX IF NOT EXISTS account_deletions_type_idx
  ON core.account_deletions (deletion_type);

DROP TRIGGER IF EXISTS account_deletions_set_updated_at ON core.account_deletions;
CREATE TRIGGER account_deletions_set_updated_at
  BEFORE UPDATE ON core.account_deletions
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ========================================================
-- Helper function: Anonymize organization payment data
-- ========================================================
CREATE OR REPLACE FUNCTION core.anonymize_organization_payment_data(
  p_organization_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Anonymize success fees
  UPDATE core.success_fees
    SET organization_id = NULL
    WHERE organization_id = p_organization_id;

  -- Anonymize payment transactions
  UPDATE core.payment_transactions
    SET organization_id = NULL
    WHERE organization_id = p_organization_id;

  -- Soft delete payment methods
  UPDATE core.organization_payment_methods
    SET deleted_at = NOW()
    WHERE organization_id = p_organization_id
      AND deleted_at IS NULL;

  -- Anonymize account credits (set balance to 0, keep ledger for audit)
  UPDATE core.account_credits
    SET balance_cents = 0,
        metadata = jsonb_build_object('anonymized_at', NOW(), 'original_balance', balance_cents)
    WHERE organization_id = p_organization_id;

  -- Anonymize hire agreements
  UPDATE core.hire_agreements
    SET organization_id = NULL
    WHERE organization_id = p_organization_id;

  -- Anonymize circumvention reports
  UPDATE core.circumvention_reports
    SET organization_id = NULL
    WHERE organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.anonymize_organization_payment_data
  IS 'Anonymizes all payment-related data for an organization. Sets foreign keys to NULL and soft-deletes payment methods.';

-- ========================================================
-- Row Level Security
-- ========================================================
ALTER TABLE core.account_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS account_deletions_select ON core.account_deletions;
CREATE POLICY account_deletions_select ON core.account_deletions
  FOR SELECT TO authenticated
  USING (
    deleted_user_id = auth.uid()
    OR deleted_organization_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

DROP POLICY IF EXISTS account_deletions_insert ON core.account_deletions;
CREATE POLICY account_deletions_insert ON core.account_deletions
  FOR INSERT TO authenticated
  WITH CHECK (
    (deletion_type = 'worker' AND deleted_user_id = auth.uid())
    OR (deletion_type = 'organization' AND deleted_organization_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    ))
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

DROP POLICY IF EXISTS account_deletions_update ON core.account_deletions;
CREATE POLICY account_deletions_update ON core.account_deletions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
    )
  );

GRANT ALL ON TABLE core.account_deletions TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE core.account_deletions TO authenticated;

COMMIT;

