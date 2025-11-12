-- =========================================================
-- 026_req_64_role_assignments_indexes.sql
-- Optimize role lookup performance for authorization checks
-- =========================================================

BEGIN;
CREATE INDEX IF NOT EXISTS role_assignments_user_id_idx
  ON core.role_assignments(user_id);
COMMIT;
