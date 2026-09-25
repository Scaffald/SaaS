-- 359_application_submitted_at.sql
--
-- Record when an application was submitted. NULL means an auto-saved draft.
-- The API sets it the first time a create or update carries `is_complete: true`.
--
-- Backfill rule: every existing row counts as submitted.
--
-- No existing row carries a reliable submission signal. The apply wizard's
-- Submit patched the auto-saved draft without `is_complete`, so most real
-- submissions were never scored and are indistinguishable from abandoned
-- drafts. Every existing row has been shown as an application until now;
-- keeping it that way lists some stale drafts, where any narrower rule would
-- pull real candidates off employer boards. The timestamp is when the row was
-- scored, else when it was created.

BEGIN;

ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN core.applications.submitted_at IS
  'When the applicant submitted. NULL means the row is an auto-saved draft.';

UPDATE core.applications
SET submitted_at = COALESCE(score_calculated_at, created_at)
WHERE submitted_at IS NULL;

COMMIT;
