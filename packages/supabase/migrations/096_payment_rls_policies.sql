-- =========================================================
-- 096_payment_rls_policies.sql
-- Row Level Security policies for payment system tables
-- =========================================================

BEGIN;

-- Helper expression snippet for organization scoped access:
-- EXISTS (
--   SELECT 1
--   FROM core.role_assignments ra
--   JOIN core.roles r ON r.id = ra.role_id
--   WHERE ra.user_id = auth.uid()
--     AND (
--       ra.scope_org_id = <ORG_COLUMN>
--       OR (r.scope = 'platform' AND r.name IN ('office', 'super_admin'))
--     )
-- )

-- =========================================================
-- SUCCESS FEES
-- =========================================================

ALTER TABLE core.success_fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS success_fees_select_access ON core.success_fees;
CREATE POLICY success_fees_select_access
  ON core.success_fees
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = worker_user_id
    OR EXISTS (
      SELECT 1
      FROM core.organizations org
      WHERE org.id = organization_id
        AND org.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id
          OR (r.scope = 'platform' AND r.name IN ('office', 'super_admin'))
        )
    )
  );

DROP POLICY IF EXISTS success_fees_manage_service_role ON core.success_fees;
CREATE POLICY success_fees_manage_service_role
  ON core.success_fees
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SERVICE PRICING & ADD-ONS
-- =========================================================

ALTER TABLE core.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_pricing_select_active ON core.service_pricing;
CREATE POLICY service_pricing_select_active
  ON core.service_pricing
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS service_pricing_manage_service_role ON core.service_pricing;
CREATE POLICY service_pricing_manage_service_role
  ON core.service_pricing
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS background_check_addons_select_active ON core.background_check_addons;
CREATE POLICY background_check_addons_select_active
  ON core.background_check_addons
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS background_check_addons_manage_service_role ON core.background_check_addons;
CREATE POLICY background_check_addons_manage_service_role
  ON core.background_check_addons
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- BACKGROUND CHECK CONSENT & DISCLOSURE TABLES
-- =========================================================

ALTER TABLE core.background_check_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_check_consent_select ON core.background_check_consent;
CREATE POLICY background_check_consent_select
  ON core.background_check_consent
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND (
          bc.user_id = auth.uid()
          OR bc.requested_by_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = bc.organization_id
                OR (r.scope = 'platform' AND r.name IN ('office', 'background_check_admin', 'super_admin'))
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS background_check_consent_insert_worker ON core.background_check_consent;
CREATE POLICY background_check_consent_insert_worker
  ON core.background_check_consent
  FOR INSERT
  TO authenticated
  WITH CHECK (worker_user_id = auth.uid());

DROP POLICY IF EXISTS background_check_consent_manage_service_role ON core.background_check_consent;
CREATE POLICY background_check_consent_manage_service_role
  ON core.background_check_consent
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS background_check_disclosures_select ON core.background_check_disclosures;
CREATE POLICY background_check_disclosures_select
  ON core.background_check_disclosures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND (
          bc.user_id = auth.uid()
          OR bc.requested_by_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = bc.organization_id
                OR (r.scope = 'platform' AND r.name IN ('office', 'background_check_admin', 'super_admin'))
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS background_check_disclosures_manage_service_role ON core.background_check_disclosures;
CREATE POLICY background_check_disclosures_manage_service_role
  ON core.background_check_disclosures
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS background_check_access_select ON core.background_check_access;
CREATE POLICY background_check_access_select
  ON core.background_check_access
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND bc.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id
          OR (r.scope = 'platform' AND r.name IN ('office', 'background_check_admin', 'super_admin'))
        )
    )
  );

DROP POLICY IF EXISTS background_check_access_manage_service_role ON core.background_check_access;
CREATE POLICY background_check_access_manage_service_role
  ON core.background_check_access
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS background_check_disputes_select ON core.background_check_disputes;
CREATE POLICY background_check_disputes_select
  ON core.background_check_disputes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND (
          bc.requested_by_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = bc.organization_id
                OR (r.scope = 'platform' AND r.name IN ('office', 'background_check_admin', 'super_admin'))
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS background_check_disputes_insert_worker ON core.background_check_disputes;
CREATE POLICY background_check_disputes_insert_worker
  ON core.background_check_disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS background_check_disputes_update_worker ON core.background_check_disputes;
CREATE POLICY background_check_disputes_update_worker
  ON core.background_check_disputes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS background_check_disputes_manage_service_role ON core.background_check_disputes;
CREATE POLICY background_check_disputes_manage_service_role
  ON core.background_check_disputes
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- ID VERIFICATIONS
-- =========================================================

ALTER TABLE core.id_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS id_verifications_select_access ON core.id_verifications;
CREATE POLICY id_verifications_select_access
  ON core.id_verifications
  FOR SELECT
  TO authenticated
  USING (
    worker_user_id = auth.uid()
    OR initiated_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = initiated_by_org_id
          OR (r.scope = 'platform' AND r.name IN ('office', 'super_admin'))
        )
    )
  );

DROP POLICY IF EXISTS id_verifications_manage_service_role ON core.id_verifications;
CREATE POLICY id_verifications_manage_service_role
  ON core.id_verifications
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- PAYMENT TRANSACTIONS LEDGER
-- =========================================================

ALTER TABLE core.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_transactions_select_access ON core.payment_transactions;
CREATE POLICY payment_transactions_select_access
  ON core.payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id
          OR (r.scope = 'platform' AND r.name IN ('office', 'super_admin'))
        )
    )
  );

DROP POLICY IF EXISTS payment_transactions_manage_service_role ON core.payment_transactions;
CREATE POLICY payment_transactions_manage_service_role
  ON core.payment_transactions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- STRIPE SETTINGS
-- Note: stripe_settings table is created in migration 098
-- RLS policies are also defined there to ensure table exists first
-- =========================================================

-- Only enable RLS if the table exists (created in migration 098)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core'
      AND table_name = 'stripe_settings'
  ) THEN
    ALTER TABLE core.stripe_settings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS stripe_settings_select ON core.stripe_settings;
    CREATE POLICY stripe_settings_select
      ON core.stripe_settings
      FOR SELECT
      TO authenticated
      USING (
        core.user_has_role(auth.uid(), 'office')
        OR core.user_has_role(auth.uid(), 'super_admin')
      );

    DROP POLICY IF EXISTS stripe_settings_update ON core.stripe_settings;
    CREATE POLICY stripe_settings_update
      ON core.stripe_settings
      FOR UPDATE
      TO authenticated
      USING (
        core.user_has_role(auth.uid(), 'office')
        OR core.user_has_role(auth.uid(), 'super_admin')
      )
      WITH CHECK (
        core.user_has_role(auth.uid(), 'office')
        OR core.user_has_role(auth.uid(), 'super_admin')
      );

    DROP POLICY IF EXISTS stripe_settings_manage_service_role ON core.stripe_settings;
    CREATE POLICY stripe_settings_manage_service_role
      ON core.stripe_settings
      FOR ALL
      TO service_role
      USING (TRUE)
      WITH CHECK (TRUE);
  END IF;
END $$;

-- =========================================================
-- GRANTS
-- =========================================================

GRANT SELECT ON core.success_fees TO authenticated;
GRANT SELECT ON core.service_pricing TO authenticated;
GRANT SELECT ON core.background_check_addons TO authenticated;
GRANT SELECT, INSERT ON core.background_check_consent TO authenticated;
GRANT SELECT ON core.background_check_disclosures TO authenticated;
GRANT SELECT ON core.background_check_access TO authenticated;
GRANT SELECT, INSERT, UPDATE ON core.background_check_disputes TO authenticated;
GRANT SELECT ON core.id_verifications TO authenticated;
GRANT SELECT ON core.payment_transactions TO authenticated;
-- Grants for stripe_settings (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core'
      AND table_name = 'stripe_settings'
  ) THEN
    GRANT SELECT, UPDATE ON core.stripe_settings TO authenticated;
    GRANT ALL ON core.stripe_settings TO service_role;
  END IF;
END $$;

GRANT ALL ON core.success_fees TO service_role;
GRANT ALL ON core.service_pricing TO service_role;
GRANT ALL ON core.background_check_addons TO service_role;
GRANT ALL ON core.background_check_consent TO service_role;
GRANT ALL ON core.background_check_disclosures TO service_role;
GRANT ALL ON core.background_check_access TO service_role;
GRANT ALL ON core.background_check_disputes TO service_role;
GRANT ALL ON core.id_verifications TO service_role;
GRANT ALL ON core.payment_transactions TO service_role;

COMMIT;

