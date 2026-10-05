-- Backfill submission timestamps after all application seed rows are inserted.
UPDATE core.applications
SET submitted_at = COALESCE(score_calculated_at, created_at)
WHERE submitted_at IS NULL;
