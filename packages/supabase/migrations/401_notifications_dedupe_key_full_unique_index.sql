-- 401: make core.notifications.dedupe_key usable as an upsert target
--
-- insertNotification (functions/_shared/notifications/utils.ts) de-duplicates
-- with `.upsert(..., { onConflict: 'dedupe_key' })`. The unique index from
-- 025 is PARTIAL (`WHERE dedupe_key IS NOT NULL`), and PostgREST's ON CONFLICT
-- can't name a partial index, so every such insert has failed with
--   42P10 there is no unique or exclusion constraint matching the ON CONFLICT specification
-- and returned null. notify-publish passes a dedupe_key for every event that
-- has one, so those notifications were never written ("Failed to insert
-- notification"). Found adding the referral notifications (#1397).
--
-- A plain unique index enforces the same rule (NULLs stay distinct, so rows
-- without a key are unaffected) and is a valid ON CONFLICT target. The old
-- index already guaranteed non-null keys are unique, so building this one
-- can't fail on existing rows.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key_key
  ON core.notifications (dedupe_key);

DROP INDEX IF EXISTS core.notifications_dedupe_key_idx;

COMMIT;
