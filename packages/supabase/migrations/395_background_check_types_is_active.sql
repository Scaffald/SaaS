-- =========================================================
-- 395: background_check_types gets the is_active column the admin catalog reads
-- =========================================================
-- The office screening catalog (GET /v1/background-checks/admin/packages and
-- /admin/check-types, and PATCH /admin/check-types/:id/active) selects and
-- writes core.background_check_types.is_active. No migration ever created it:
-- not on local, dev, preview or prod (checked 2026-11-17). Both list
-- endpoints therefore 500 and the Catalog tab sits on "Loading packages…"
-- forever, so nobody could see or edit the packages a check is sold as.
--
-- background_check_packages already has is_active (default true); this gives
-- check types the same shape. Every existing type stays active, which is how
-- the worker-facing package list already treats them.
-- =========================================================

BEGIN;

ALTER TABLE core.background_check_types
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
