-- =========================================================
-- 033_background_checks_policies.sql
-- Row level security and grants for background check schema
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: BACKGROUND CHECK TYPES & PACKAGES
-- =========================================================

ALTER TABLE core.background_check_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_check_types_select ON core.background_check_types;
CREATE POLICY background_check_types_select
  ON core.background_check_types
  FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS background_check_types_manage_service_role ON core.background_check_types;
CREATE POLICY background_check_types_manage_service_role
  ON core.background_check_types
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS background_check_packages_select ON core.background_check_packages;
CREATE POLICY background_check_packages_select
  ON core.background_check_packages
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS background_check_packages_manage_service_role ON core.background_check_packages;
CREATE POLICY background_check_packages_manage_service_role
  ON core.background_check_packages
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SECTION 2: BACKGROUND CHECK RECORDS
-- =========================================================

ALTER TABLE core.background_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_checks_select_worker ON core.background_checks;
CREATE POLICY background_checks_select_worker
  ON core.background_checks
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = requested_by_user_id
    OR core.user_has_role(auth.uid(), 'office')
    OR core.user_has_role(auth.uid(), 'background_check_admin')
  );

DROP POLICY IF EXISTS background_checks_manage_service_role ON core.background_checks;
CREATE POLICY background_checks_manage_service_role
  ON core.background_checks
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SECTION 3: BACKGROUND CHECK DOCUMENTS
-- =========================================================

ALTER TABLE core.background_check_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_check_documents_select ON core.background_check_documents;
CREATE POLICY background_check_documents_select
  ON core.background_check_documents
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
          OR core.user_has_role(auth.uid(), 'office')
          OR core.user_has_role(auth.uid(), 'background_check_admin')
        )
    )
  );

DROP POLICY IF EXISTS background_check_documents_insert ON core.background_check_documents;
CREATE POLICY background_check_documents_insert
  ON core.background_check_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND (
          bc.user_id = auth.uid()
          OR bc.requested_by_user_id = auth.uid()
          OR core.user_has_role(auth.uid(), 'office')
          OR core.user_has_role(auth.uid(), 'background_check_admin')
        )
    )
  );

DROP POLICY IF EXISTS background_check_documents_manage_service_role ON core.background_check_documents;
CREATE POLICY background_check_documents_manage_service_role
  ON core.background_check_documents
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SECTION 4: ACCESS LOG
-- =========================================================

ALTER TABLE core.background_check_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_check_access_log_select ON core.background_check_access_log;
CREATE POLICY background_check_access_log_select
  ON core.background_check_access_log
  FOR SELECT
  TO authenticated
  USING (
    core.user_has_role(auth.uid(), 'office')
    OR core.user_has_role(auth.uid(), 'background_check_admin')
  );

DROP POLICY IF EXISTS background_check_access_log_manage_service_role ON core.background_check_access_log;
CREATE POLICY background_check_access_log_manage_service_role
  ON core.background_check_access_log
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SECTION 5: DISPUTES
-- =========================================================

ALTER TABLE core.background_check_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS background_check_disputes_select ON core.background_check_disputes;
CREATE POLICY background_check_disputes_select
  ON core.background_check_disputes
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM core.background_checks bc
      WHERE bc.id = background_check_id
        AND (
          bc.user_id = auth.uid()
          OR bc.requested_by_user_id = auth.uid()
          OR core.user_has_role(auth.uid(), 'office')
          OR core.user_has_role(auth.uid(), 'background_check_admin')
        )
    )
  );

DROP POLICY IF EXISTS background_check_disputes_insert ON core.background_check_disputes;
CREATE POLICY background_check_disputes_insert
  ON core.background_check_disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS background_check_disputes_update_worker ON core.background_check_disputes;
CREATE POLICY background_check_disputes_update_worker
  ON core.background_check_disputes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS background_check_disputes_manage_service_role ON core.background_check_disputes;
CREATE POLICY background_check_disputes_manage_service_role
  ON core.background_check_disputes
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- =========================================================
-- SECTION 6: GRANTS
-- =========================================================

GRANT SELECT ON core.background_check_types TO authenticated;
GRANT ALL ON core.background_check_types TO service_role;

GRANT SELECT ON core.background_check_packages TO authenticated;
GRANT ALL ON core.background_check_packages TO service_role;

GRANT SELECT ON core.background_checks TO authenticated;
GRANT ALL ON core.background_checks TO service_role;

GRANT SELECT, INSERT ON core.background_check_documents TO authenticated;
GRANT ALL ON core.background_check_documents TO service_role;

GRANT SELECT ON core.background_check_access_log TO authenticated;
GRANT ALL ON core.background_check_access_log TO service_role;

GRANT SELECT, INSERT, UPDATE ON core.background_check_disputes TO authenticated;
GRANT ALL ON core.background_check_disputes TO service_role;

GRANT USAGE ON TYPE core.background_check_status TO authenticated, service_role;
GRANT USAGE ON TYPE core.background_check_paid_by TO authenticated, service_role;
GRANT USAGE ON TYPE core.background_check_dispute_status TO authenticated, service_role;

COMMIT;



