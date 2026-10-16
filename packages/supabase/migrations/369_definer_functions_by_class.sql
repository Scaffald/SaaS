-- =========================================================
-- 369_definer_functions_by_class.sql
--
-- After 364, 63 SECURITY DEFINER functions were still executable by anon
-- (#1148). Classified from evidence — pg_trigger, pg_policies (which roles'
-- policies call the function), cron.job on prod, other functions' bodies, and
-- every `.rpc(...)` call site with the client it uses — not from names.
--
-- 1. Trigger functions (15). A trigger fires whatever the caller's EXECUTE
--    privilege; EXECUTE only lets someone call it as an RPC, which a trigger
--    function cannot usefully be. Revoked from PUBLIC, anon, authenticated.
--    (The persona matrix creates its users through Auth, so handle_new_user
--    and assign_default_role are exercised on every run.)
--
-- 2. Jobs and server-only functions (25). pg_cron runs as postgres; every
--    code caller is a service-role client (getWebhookClient /
--    getServiceClient); several are only called from other definer
--    functions. Until now any visitor could fire them: import_external_jobs
--    (outbound HTTP), process_notification_queue, the digests,
--    publish_scheduled_jobs, update_stale_applications, auto_reject_application,
--    the cleanup_* jobs. Revoked from PUBLIC, anon, authenticated.
--
-- 3. Signed-in helpers (14). RLS helpers referenced only by policies TO
--    authenticated, the review pin RPCs (they check auth.uid() inside),
--    blocked_user_ids (called for signed-in users only) and helpers with no
--    anonymous caller. Revoked from PUBLIC and anon; authenticated keeps them.
--
-- Left callable by anon, and allow-listed with the reason: the map/discover
-- coordinate RPCs, skill search, and public.calculate_years_of_experience
-- (public profile pages call it with the visitor's client).
--
-- Default privileges are deliberately unchanged: revoking EXECUTE by default
-- would also close every future non-definer RPC and invite the forgotten-
-- GRANT regressions this epic is trying not to cause. CI's security check
-- already refuses any new anon-executable definer function.
-- =========================================================

BEGIN;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  -- 1. trigger functions + 2. jobs and server-only functions
  FOREACH fn IN ARRAY ARRAY[
    'core.handle_new_user()',
    'core.assign_default_role()',
    'core.notify_site_overlap()',
    'core.log_inquiry_event()',
    'core.log_inquiry_sent()',
    'core.log_inquiry_comment()',
    'core.log_inquiry_section_accepted()',
    'core.log_inquiry_capability_answered()',
    'core.set_document_version_defaults()',
    'core.refresh_document_latest_version()',
    'core.ccpa_record_history()',
    'community.update_post_comment_count()',
    'community.update_post_rating_stats()',
    'community.update_upvote_count()',
    'community.update_community_member_count()',

    'core.import_external_jobs()',
    'core.import_news_articles()',
    'core.process_notification_queue()',
    'core.check_notification_receipts()',
    'core.process_daily_digest()',
    'core.process_weekly_digest()',
    'core.archive_expired_external_jobs()',
    'core.send_profile_completion_reminders()',
    'core.send_inquiry_reminders()',
    'core.update_stale_applications()',
    'core.cleanup_old_notifications()',
    'core.cleanup_expired_api_keys()',
    'core.cleanup_expired_oauth_codes()',
    'public.cleanup_expired_auth_sessions()',
    'core.publish_scheduled_jobs()',
    'engagement.rollup_daily_analytics(date)',
    'core.refresh_ghost_profiles()',
    'core.notify_admins_of_cron_failure(text,text)',
    'core.record_delivery_event(uuid,bigint,text,text,jsonb)',
    'core.create_skill_snapshot(uuid,text,uuid)',
    'core.calculate_application_score(uuid)',
    'core.auto_reject_application(uuid)',
    'core.preview_auto_rejection(uuid)',
    'core.validate_oauth_scope(uuid,text[])',
    'core.get_api_key_stats(uuid,integer)'
  ]::regprocedure[]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;

  -- 3. signed-in helpers
  FOREACH fn IN ARRAY ARRAY[
    'core.user_has_role(uuid,text,uuid)',
    'core.can_access_work_log(uuid)',
    'core.is_work_log_owner(uuid)',
    'core.has_team_permission(uuid,core.team_permission)',
    'core.user_has_any_team_permission(uuid,core.team_permission)',
    'core.is_org_member(uuid,uuid)',
    'core.is_team_admin(uuid)',
    'core.pin_review(uuid,smallint)',
    'core.unpin_review(uuid)',
    'core.blocked_user_ids(uuid)',
    'core.users_are_blocked(uuid,uuid)',
    'core.check_site_overlaps(uuid,geography)',
    'core.validate_address_in_site(uuid,uuid)',
    'public.is_vault_available()'
  ]::regprocedure[]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END
$$;

COMMIT;
