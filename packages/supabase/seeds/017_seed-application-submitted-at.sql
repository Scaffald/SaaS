-- 017_seed-application-submitted-at.sql
--
-- Give every seeded application a `submitted_at`, the same way migration 359
-- gave every real one.
--
-- 359 added the column and backfilled it:
--
--   UPDATE core.applications SET submitted_at = COALESCE(score_calculated_at, created_at)
--   WHERE submitted_at IS NULL;
--
-- That is correct for a database with data in it. On a local reset it runs
-- against an EMPTY table — migrations apply first, seeds after — and then
-- seeds 006 and 008 insert sixteen applications without the column. The
-- employer pipeline lists only rows where `submitted_at IS NOT NULL`
-- (routes/employer-applications.ts), so from the day 359 landed every local
-- stack showed the seeded office user "0 applications" across every stage,
-- while the same twelve rows were plainly in core.applications.
--
-- A trailing seed rather than edits to the six INSERT blocks, so the next seed
-- that forgets the column is covered too. Same expression as 359 on purpose.

UPDATE core.applications
SET submitted_at = COALESCE(score_calculated_at, created_at)
WHERE submitted_at IS NULL;
