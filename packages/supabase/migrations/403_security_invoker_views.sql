-- =============================================================================
-- 403_security_invoker_views.sql
--
-- Sets security_invoker = on for five views that were created as SECURITY DEFINER
-- (Supabase advisor Issue #171). They will then run with the caller's privileges
-- and RLS context instead of the view owner's.
--
-- public.v_active_cron_jobs is NOT altered: it reads from cron.job (pg_cron);
-- only definer can read that catalog, so it intentionally remains SECURITY DEFINER.
--
-- Requires PostgreSQL 15+. Supabase uses PG15+.
-- =============================================================================

BEGIN;

ALTER VIEW core.v_id_verification_latest SET (security_invoker = on);
-- v_active_cron_jobs: leave as definer (reads cron.job)
ALTER VIEW core.v_team_daily_metrics_latest SET (security_invoker = on);
ALTER VIEW core.v_team_member_workloads_latest SET (security_invoker = on);
ALTER VIEW core.v_profile_search SET (security_invoker = on);
ALTER VIEW core.v_news_feed_health SET (security_invoker = on);

COMMIT;
