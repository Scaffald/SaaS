-- =========================================================
-- 030_slug_history_policies.sql
-- Grants and RLS policies for slug change history tracking
-- =========================================================

BEGIN;
GRANT SELECT, INSERT ON core.slug_change_history TO authenticated;
GRANT ALL ON core.slug_change_history TO service_role;
ALTER TABLE core.slug_change_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS slug_change_history_owner_select ON core.slug_change_history;
CREATE POLICY slug_change_history_owner_select
  ON core.slug_change_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS slug_change_history_owner_insert ON core.slug_change_history;
CREATE POLICY slug_change_history_owner_insert
  ON core.slug_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
COMMIT;
