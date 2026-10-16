-- =========================================================
-- 378_reassert_function_search_paths.sql
--
-- 110 functions have a different search_path on the remote projects than
-- the migrations give them (#1229). On prod and dev the remote value is
-- narrower — `core` where the repo says `core, public, extensions` — set by
-- hand at some point, never by a migration. Most of these functions only call
-- built-ins, so it went unnoticed, but pgcrypto lives in `public`:
--
--   core.rotate_stripe_secret              gen_random_bytes -> 42883
--   core.encrypt_background_check_results  pgp_sym_encrypt  -> 42883
--   core.decrypt_background_check_results  pgp_sym_decrypt  -> 42883
--
-- so saving a Stripe key from office settings failed on prod, dev and preview
-- (measured 2026-10-16), while a local replay — the repo's value — worked.
--
-- GENERATED from the security fingerprint of a fresh replay: every function
-- whose search_path differs on any remote is set to the replay's value.
-- ALTER FUNCTION ... SET touches only that setting — body, owner, SECURITY
-- DEFINER and grants are unchanged. A no-op on a fresh replay. Supabase's own
-- storage.* functions are not ours and are not listed.
-- =========================================================

BEGIN;

DO $$
DECLARE
  item text;
  fn regprocedure;
BEGIN
  FOREACH item IN ARRAY ARRAY[
    'public.calculate_audit_hash(uuid,timestamp with time zone,character varying,character varying,uuid,uuid,jsonb)=>public, public, extensions',
    'public.calculate_years_of_experience(uuid)=>core, public',
    'core.anonymize_organization_payment_data(uuid)=>core, public, extensions',
    'core.anonymize_worker_payment_data(uuid)=>core, public, extensions',
    'core.apply_credit_transaction(uuid,integer,text,text,text,uuid,uuid,uuid,uuid,jsonb,uuid)=>core, public, extensions',
    'core.archive_expired_external_jobs()=>core, public',
    'core.assign_user_skill_trade()=>core, public, extensions',
    'core.auto_reject_application(uuid)=>core, public, extensions',
    'core.calculate_application_score(uuid)=>core, public, extensions',
    'core.calculate_multi_match_score(uuid,uuid)=>core, public, extensions',
    'core.calculate_next_attempt(integer)=>core, public',
    'core.calculate_time_entries_total_hours(jsonb)=>core, public, extensions',
    'core.calculate_years_of_experience(uuid)=>core, public, extensions',
    'core.can_access_work_log(uuid)=>core, public',
    'core.ccpa_record_history()=>core, public, extensions',
    'core.ccpa_set_deadline()=>core, public, extensions',
    'core.check_notification_receipts()=>core, public',
    'core.cleanup_expired_api_keys()=>core, public, extensions',
    'core.cleanup_expired_oauth_codes()=>core, public, extensions',
    'core.cleanup_old_notifications()=>core, public',
    'core.configure_stripe_server(uuid,text)=>core, public',
    'core.create_skill_snapshot(uuid,text,uuid)=>core, public',
    'core.decrypt_background_check_results(bytea,text)=>core, public, extensions',
    'core.detect_trade_for_csi_skill(uuid)=>core, public, extensions',
    'core.encrypt_background_check_results(jsonb,text)=>core, public, extensions',
    'core.enqueue_due_success_fees()=>core, public, extensions',
    'core.enqueue_duration_check_success_fees()=>core, public, extensions',
    'core.extract_tiptap_plain_text(jsonb)=>core, public, extensions',
    'core.generate_application_attachment_path(uuid,uuid,text)=>core, public, extensions',
    'core.generate_oauth_token(uuid,uuid,text[])=>core, public, extensions',
    'core.get_api_key_stats(uuid,integer)=>core, public, extensions',
    'core.get_current_verification(uuid)=>core, public, extensions',
    'core.get_default_hire_agreement_text()=>core, public, extensions',
    'core.get_or_create_account_credits(uuid)=>core, public, extensions',
    'core.get_org_id_from_path(text)=>core, public, extensions',
    'core.get_secret_value(uuid)=>core, vault, public',
    'core.handle_new_user()=>core, public, extensions',
    'core.handle_team_activity_event_refresh()=>core, public, extensions',
    'core.import_external_jobs()=>core, public',
    'core.is_work_log_owner(uuid)=>core, public',
    'core.jitter_coordinate(double precision,double precision)=>core, public, extensions',
    'core.jitter_coordinate_deterministic(double precision,uuid,text,double precision)=>core, public, extensions',
    'core.jobs_tsv_update()=>core, public, extensions',
    'core.log_inquiry_capability_answered()=>core, public, extensions',
    'core.log_inquiry_comment()=>core, public, extensions',
    'core.log_inquiry_event()=>core, public, extensions',
    'core.log_inquiry_section_accepted()=>core, public, extensions',
    'core.log_inquiry_sent()=>core, public, extensions',
    'core.map_job_to_industry(text,text,text)=>core, public',
    'core.notify_admins_of_cron_failure(text,text)=>core, public',
    'core.organizations_tsv_update()=>core, public, extensions',
    'core.pin_review(uuid,smallint)=>core, public',
    'core.preview_auto_rejection(uuid)=>core, public, extensions',
    'core.process_daily_digest()=>core, public',
    'core.process_notification_queue()=>core, public',
    'core.process_weekly_digest()=>core, public',
    'core.publish_scheduled_jobs()=>core, public',
    'core.record_delivery_event(uuid,bigint,text,text,jsonb)=>core, public',
    'core.refresh_all_team_metrics(date)=>core, public, extensions',
    'core.refresh_document_latest_version()=>core, public, extensions',
    'core.refresh_ghost_profiles()=>core, public, pg_temp',
    'core.refresh_stripe_schema()=>core, public',
    'core.refresh_team_daily_metrics(uuid,date,boolean)=>core, public, extensions',
    'core.refresh_years_of_experience(uuid)=>core, public, extensions',
    'core.revoke_oauth_app_tokens(uuid)=>core, public, extensions',
    'core.rotate_stripe_secret(text,text)=>core, vault, public',
    'core.search_all_skills(text,text)=>core, public, extensions',
    'core.send_inquiry_reminders()=>core, public',
    'core.send_profile_completion_reminders()=>core, public',
    'core.set_document_version_defaults()=>core, public, extensions',
    'core.set_privacy_request_deadline()=>core, public, extensions',
    'core.set_updated_at()=>core, public, extensions',
    'core.sync_primary_job_assignment()=>core, public, extensions',
    'core.trigger_calculate_application_score()=>core, public, extensions',
    'core.unpin_review(uuid)=>core, public',
    'core.update_api_keys_updated_at()=>core, public, extensions',
    'core.update_personality_assessment_last_updated()=>core, public, extensions',
    'core.update_stale_applications()=>core, public',
    'core.update_updated_at_column()=>core, public, extensions',
    'core.user_experience_refresh_years_trigger()=>core, public, extensions',
    'data.clean_certification_categories()=>data, public, extensions',
    'data.cleanup_deprecated_certifications()=>data, public, extensions',
    'data.get_masterformat_hierarchy(uuid)=>data, public, extensions',
    'data.identify_duplicate_certifications()=>data, public, extensions',
    'data.merge_duplicate_certifications(uuid[],uuid)=>data, public, extensions',
    'data.normalize_certification_titles()=>data, public, extensions',
    'data.search_masterformat(text)=>data, public, extensions',
    'data.search_universities(text,text,integer)=>data, public, extensions',
    'data.verify_certification_hierarchy()=>data, public, extensions',
    'public.generate_breach_number()=>public, public, extensions',
    'public.generate_privacy_request_number()=>public, public, extensions',
    'public.get_jobs_with_coords()=>core, public, extensions',
    'public.get_organizations_with_coords()=>core, public, extensions',
    'public.get_pending_webhook_deliveries()=>public, public, extensions',
    'public.get_skill_children(uuid)=>core, public',
    'public.get_skill_details(uuid)=>core, public',
    'public.get_skill_parent_ids(uuid)=>core, data, public',
    'public.get_webhooks_for_event(uuid,text)=>public, public, extensions',
    'public.log_breach_audit()=>public, public, extensions',
    'public.log_consent_audit()=>public, public, extensions',
    'public.log_privacy_request_audit()=>public, public, extensions',
    'public.prevent_audit_log_modification()=>public, public, extensions',
    'public.search_parent_skills(text,uuid,integer,text)=>core, data, public',
    'public.set_audit_log_hash()=>public, public, extensions',
    'public.set_breach_notification_deadline()=>public, public, extensions',
    'public.set_privacy_request_due_date()=>public, public, extensions',
    'public.update_updated_at_column()=>public, public, extensions',
    'public.update_webhook_delivery_stats()=>public, public, extensions',
    'public.update_webhook_updated_at()=>public, public, extensions',
    'public.verify_audit_log_hash_chain(timestamp with time zone,timestamp with time zone)=>public, public, extensions'
  ]
  LOOP
    fn := to_regprocedure(split_part(item, '=>', 1));
    IF fn IS NULL THEN
      RAISE NOTICE 'skipping %, not present here', split_part(item, '=>', 1);
      CONTINUE;
    END IF;
    EXECUTE format('ALTER FUNCTION %s SET search_path = %s', fn, split_part(item, '=>', 2));
  END LOOP;
END
$$;

COMMIT;
