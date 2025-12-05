-- =========================================================
-- 036_background_check_roles.sql
-- Platform role for background check administration
-- =========================================================

BEGIN;

INSERT INTO core.roles (scope, name, description)
VALUES (
  'platform',
  'background_check_admin',
  'Platform administrators who can review, adjudicate, and manage background checks'
)
ON CONFLICT (name) DO NOTHING;

COMMIT;



