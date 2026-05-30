-- 334_user_certifications_freeform_columns.sql
-- The "Add custom certification" UI path at
-- packages/scf-core/features/profile/profile-certifications-left.tsx:254 collects
-- freeform name + issuing_organization (plus other fields) and submits via the
-- saveCertifications mutation. The current table only has certification_id (FK
-- to data.certifications catalog) and no place to record freeform values, so
-- that path has been architecturally broken since launch — the matching tRPC
-- handler writes to columns that don't exist (would 500 in prod).
--
-- Per SC-114 (v1.8.0 pre-audit), the chosen fix is freeform columns alongside
-- the catalog FK rather than a separate table or removing the UI. The UI already
-- treats both kinds the same; one table keeps the route shapes simple.
--
-- 1. Add nullable name + issuing_organization columns.
-- 2. Relax certification_id from NOT NULL — freeform rows skip the FK.
-- 3. CHECK constraint: either catalog-link or freeform-pair must be present.

BEGIN;

ALTER TABLE core.user_certifications
  ADD COLUMN name TEXT,
  ADD COLUMN issuing_organization TEXT;

ALTER TABLE core.user_certifications
  ALTER COLUMN certification_id DROP NOT NULL;

ALTER TABLE core.user_certifications
  ADD CONSTRAINT user_certifications_catalog_or_freeform
  CHECK (
    certification_id IS NOT NULL
    OR (name IS NOT NULL AND issuing_organization IS NOT NULL)
  );

COMMIT;
