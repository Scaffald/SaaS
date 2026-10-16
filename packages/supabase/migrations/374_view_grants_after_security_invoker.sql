-- =========================================================
-- 374_view_grants_after_security_invoker.sql
--
-- Two loose ends from making views run as the caller (306, re-run by 367 on
-- prod and dev) (#1149):
--
-- 1. service_role holds no SELECT on four of those views on any project. As
--    SECURITY DEFINER views that never mattered; as invoker views the server
--    is refused like anyone else (measured: `select * from core.v_profile_search`
--    with the service key -> 42501). service_role bypasses RLS on the base
--    tables but still needs the view grant.
--
-- 2. public.v_active_cron_jobs is a SECURITY DEFINER view over cron.job that
--    shows every scheduled command to any signed-in user (and to anon on
--    dev/preview). Nothing in the app or the api reads it. Revoked from both
--    client roles; the security allow-list loses its last definer-view entry.
-- =========================================================

BEGIN;

GRANT SELECT ON
  core.v_profile_search,
  core.v_id_verification_latest,
  core.v_news_feed_health,
  core.v_profile_completion_scores
TO service_role;

REVOKE ALL ON public.v_active_cron_jobs FROM anon, authenticated;

COMMIT;
