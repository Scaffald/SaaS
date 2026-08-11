-- 345_drift_trigger_probe.sql
--
-- TEMPORARY probe, not intended to merge.
--
-- #559's fix added a `pull_request` trigger to supabase-drift-audit.yml scoped
-- to packages/supabase/migrations/**. This file exists to prove that trigger
-- actually fires on a migrations-only PR, rather than assuming it does — the
-- recurring lesson of this epic being that a check existing is not evidence it
-- has ever run.

SELECT 1 WHERE FALSE;
