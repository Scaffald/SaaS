-- =========================================================
-- 104_req30_user_certifications_fk.sql
-- Align user certifications FK with data.certifications catalog
-- =========================================================

BEGIN;

ALTER TABLE core.user_certifications
  DROP CONSTRAINT IF EXISTS user_certifications_certification_id_fkey;

ALTER TABLE core.user_certifications
  ADD CONSTRAINT user_certifications_certification_id_fkey
  FOREIGN KEY (certification_id)
  REFERENCES data.certifications(id)
  ON DELETE CASCADE;

COMMIT;


