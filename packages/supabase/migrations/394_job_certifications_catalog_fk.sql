-- =========================================================
-- 394: job_certifications points at the catalog people actually pick from (#1342)
-- =========================================================
-- core.job_certifications.certification_id referenced core.certifications,
-- which is empty on dev, preview and prod. The certification catalog is
-- data.certifications (69 rows): the profile's certification search reads it,
-- and so will the job form's. With the old key no job certificate could ever
-- be saved; every insert would fail the foreign key.
--
-- core.job_certifications is empty in all three environments (checked
-- 2026-11-16) and no database function reads it, so the key can simply move.
-- =========================================================

BEGIN;

ALTER TABLE core.job_certifications
  DROP CONSTRAINT IF EXISTS job_certifications_certification_id_fkey;

ALTER TABLE core.job_certifications
  ADD CONSTRAINT job_certifications_certification_id_fkey
  FOREIGN KEY (certification_id) REFERENCES data.certifications(id) ON DELETE CASCADE;

COMMIT;
