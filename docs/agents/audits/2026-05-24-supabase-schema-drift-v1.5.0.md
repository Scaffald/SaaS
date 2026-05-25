# Schema-drift audit — v1.5.0 — 2026-05-24

## TL;DR

- **Tables / indexes / policies / types / triggers / constraints**: 0 drift across preview/dev/prod (all 171 tables, 561 indexes, 402 policies, 29 types, 119 triggers, 580 constraints match).
- **Functions**: 119 in each env, but body divergence in 97 shared functions plus a 13-function schema-relocation gap.

## Findings

### 1. Migration 328 (SC-68) not applied: 13 functions relocated public→core on preview only

Preview has these functions in `core.*`; dev and prod still have them in `public.*`. Migration 328 exists to fix this but is unapplied on **all three envs** (preview reached the end state via manual dashboard SQL). The migration is idempotent.

- `"core"."archive_expired_external_jobs"()`
- `"core"."calculate_next_attempt"("p_attempts" integer)`
- `"core"."check_notification_receipts"()`
- `"core"."cleanup_old_notifications"()`
- `"core"."import_external_jobs"()`
- `"core"."map_job_to_industry"("p_title" "text", "p_description" "text", "p_category" "text")`
- `"core"."notify_admins_of_cron_failure"("p_job_name" "text", "p_error_message" "text")`
- `"core"."process_daily_digest"()`
- `"core"."process_notification_queue"()`
- `"core"."process_weekly_digest"()`
- `"core"."record_delivery_event"("p_notification_id" "uuid", "p_delivery_id" bigint, "p_channel" "text", "p_event" "text", "p_meta" "jsonb" DEFAULT NULL::"jsonb")`
- `"core"."send_profile_completion_reminders"()`
- `"core"."update_stale_applications"()`

### 2. Migration 308 lying-history: 96 functions missing search_path hardening on dev+prod

Migration 308 (`function_search_path.sql`) is recorded as applied on all three envs, but the actual `SET search_path` declarations are missing on dev/prod for 96 functions. This is a lying-history case — the audit doc's list (140, 200, 221, 222, 223, 225, 300, 301, 304, 305, 307, 312) is missing 308.

#### 2a. HIGH severity — 46 SECURITY DEFINER functions without search_path (injection risk)

A SECURITY DEFINER function without an explicit `search_path` can be exploited by a caller manipulating their session's `search_path` to make unqualified references resolve to malicious overloads. Apply hardening immediately.

- `"core"."auto_reject_application"("p_application_id" "uuid")`
- `"core"."calculate_application_score"("p_application_id" "uuid")`
- `"core"."can_access_work_log"("target_work_log_id" "uuid")`
- `"core"."ccpa_record_history"()`
- `"core"."cleanup_expired_api_keys"()`
- `"core"."cleanup_expired_oauth_codes"()`
- `"core"."configure_stripe_server"("p_api_key_secret_id" "uuid", "p_api_version" "text" DEFAULT '2024-06-20'::"text")`
- `"core"."generate_oauth_token"("p_oauth_app_id" "uuid", "p_user_id" "uuid", "p_scopes" "text"[])`
- `"core"."get_api_key_stats"("org_id" "uuid", "days" integer DEFAULT 30)`
- `"core"."get_jobs_with_coords"()`
- `"core"."get_organizations_with_coords"()`
- `"core"."get_secret_value"("p_secret_id" "uuid")`
- `"core"."handle_new_user"()`
- `"core"."import_news_articles"()`
- `"core"."is_org_member"("org_id" "uuid", "target_user" "uuid" DEFAULT "auth"."uid"()`
- `"core"."is_work_log_owner"("target_work_log_id" "uuid")`
- `"core"."log_inquiry_capability_answered"()`
- `"core"."log_inquiry_comment"()`
- `"core"."log_inquiry_event"()`
- `"core"."log_inquiry_section_accepted"()`
- `"core"."log_inquiry_sent"()`
- `"core"."preview_auto_rejection"("p_application_id" "uuid")`
- `"core"."publish_scheduled_jobs"()`
- `"core"."refresh_document_latest_version"()`
- `"core"."refresh_ghost_profiles"()`
- `"core"."refresh_stripe_schema"()`
- `"core"."revoke_oauth_app_tokens"("p_oauth_app_id" "uuid")`
- `"core"."rotate_stripe_secret"("p_secret" "text", "p_secret_type" "text" DEFAULT 'api_key'::"text")`
- `"core"."set_document_version_defaults"()`
- `"core"."validate_oauth_scope"("p_user_id" "uuid", "p_requested_scopes" "text"[])`
- `"public"."calculate_years_of_experience"("p_user_id" "uuid")`
- `"public"."cleanup_expired_auth_sessions"()`
- `"public"."create_auth_session"("p_scaffald_user_id" "text", "p_supabase_user_id" "uuid", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone, "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet")`
- `"public"."delete_auth_session"("p_session_id" "uuid")`
- `"public"."get_auth_session"("p_session_id" "uuid")`
- `"public"."get_encryption_key"()`
- `"public"."get_jobs_with_coords"()`
- `"public"."get_organizations_with_coords"()`
- `"public"."get_pending_webhook_deliveries"()`
- `"public"."get_skill_children"("p_parent_id" "uuid")`
- `"public"."get_skill_details"("p_skill_id" "uuid")`
- `"public"."get_skill_parent_ids"("p_skill_id" "uuid")`
- `"public"."get_webhooks_for_event"("p_organization_id" "uuid", "p_event_type" "text")`
- `"public"."is_vault_available"()`
- `"public"."search_parent_skills"("p_query" "text", "p_industry_id" "uuid", "p_limit" integer DEFAULT 20, "p_taxonomy" "text" DEFAULT NULL::"text")`
- `"public"."update_auth_session_tokens"("p_session_id" "uuid", "p_access_token" "text", "p_refresh_token" "text", "p_token_expires_at" timestamp with time zone)`

#### 2b. MEDIUM severity — 50 non-SECURITY-DEFINER functions without search_path (defense-in-depth)

No direct exploitation vector since these run as the caller, but Supabase Advisor flags them and the hardening already shipped on preview. Apply for parity.

- `"core"."anonymize_organization_payment_data"("p_organization_id" "uuid")`
- `"core"."anonymize_worker_payment_data"("p_worker_user_id" "uuid")`
- `"core"."apply_credit_transaction"("p_organization_id" "uuid", "p_amount_cents" integer, "p_transaction_type" "text", "p_direction" "text", "p_description" "text" DEFAULT NULL::"text", "p_payment_transaction_id" "uuid" DEFAULT NULL::"uuid", "p_success_fee_id" "uuid" DEFAULT NULL::"uuid", "p_background_check_id" "uuid" DEFAULT NULL::"uuid", "p_id_verification_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_created_by" "uuid" DEFAULT NULL::"uuid")`
- `"core"."assign_user_skill_trade"()`
- `"core"."calculate_multi_match_score"("p_user_id" "uuid", "p_job_id" "uuid")`
- `"core"."calculate_time_entries_total_hours"("time_entries" "jsonb")`
- `"core"."calculate_years_of_experience"("p_user_id" "uuid")`
- `"core"."ccpa_set_deadline"()`
- `"core"."decrypt_background_check_results"("p_encrypted" "bytea", "p_secret" "text")`
- `"core"."detect_trade_for_csi_skill"("skill_id" "uuid")`
- `"core"."encrypt_background_check_results"("p_data" "jsonb", "p_secret" "text")`
- `"core"."enqueue_due_success_fees"()`
- `"core"."enqueue_duration_check_success_fees"()`
- `"core"."extract_tiptap_plain_text"("content" "jsonb")`
- `"core"."generate_application_attachment_path"("user_id" "uuid", "application_id" "uuid", "attachment_type" "text")`
- `"core"."get_current_verification"("p_worker_user_id" "uuid")`
- `"core"."get_default_hire_agreement_text"()`
- `"core"."get_or_create_account_credits"("p_organization_id" "uuid")`
- `"core"."get_org_id_from_path"("object_name" "text")`
- `"core"."handle_team_activity_event_refresh"()`
- `"core"."jitter_coordinate"("coord" double precision, "max_offset_degrees" double precision DEFAULT 0.03)`
- `"core"."jitter_coordinate_deterministic"("coord" double precision, "user_id" "uuid", "coord_type" "text" DEFAULT 'lng'::"text", "max_offset_degrees" double precision DEFAULT 0.03)`
- `"core"."jobs_tsv_update"()`
- `"core"."organizations_tsv_update"()`
- `"core"."refresh_all_team_metrics"("p_metric_date" "date" DEFAULT CURRENT_DATE)`
- `"core"."refresh_team_daily_metrics"("p_team_id" "uuid", "p_metric_date" "date" DEFAULT CURRENT_DATE, "p_capture_workloads" boolean DEFAULT true)`
- `"core"."refresh_years_of_experience"("p_user_id" "uuid")`
- `"core"."search_all_skills"("search_term" "text", "taxonomy_filter" "text" DEFAULT NULL::"text")`
- `"core"."set_privacy_request_deadline"()`
- `"core"."set_updated_at"()`
- `"core"."sync_primary_job_assignment"()`
- `"core"."trigger_calculate_application_score"()`
- `"core"."update_api_keys_updated_at"()`
- `"core"."update_personality_assessment_last_updated"()`
- `"core"."update_updated_at_column"()`
- `"core"."user_experience_refresh_years_trigger"()`
- `"public"."calculate_audit_hash"("p_id" "uuid", "p_created_at" timestamp with time zone, "p_category" character varying, "p_action" character varying, "p_user_id" "uuid", "p_record_id" "uuid", "p_metadata" "jsonb")`
- `"public"."generate_breach_number"()`
- `"public"."generate_privacy_request_number"()`
- `"public"."log_breach_audit"()`
- `"public"."log_consent_audit"()`
- `"public"."log_privacy_request_audit"()`
- `"public"."prevent_audit_log_modification"()`
- `"public"."set_audit_log_hash"()`
- `"public"."set_breach_notification_deadline"()`
- `"public"."set_privacy_request_due_date"()`
- `"public"."update_updated_at_column"()`
- `"public"."update_webhook_delivery_stats"()`
- `"public"."update_webhook_updated_at"()`
- `"public"."verify_audit_log_hash_chain"("p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone)`

### 3. Substantive body drift — 1 function(s)

- `"core"."send_inquiry_reminders"()`

### 4. Pending repo migrations not applied to any env

- `329_review_pins.sql` (SC-30) — `review_pins` table missing on all three envs.
- `330_community_memberships_public_read.sql` (SC-42) — RLS policy update unapplied on all three envs.

These aren't drift between envs but pending work — the migration files exist but `db push` never ran them. Either apply or close the parent SC tickets if scope moved.

## What's NOT drifted

Table-level catch-up from #281 (SC-67) worked cleanly: dev/prod gained the missing tables, indexes, policies, types, and constraints. The earlier audit's tabular drift is fully resolved.

## Methodology

- Dumped `public` + `core` schemas via `supabase db dump --linked` from preview/dev/prod (`/tmp/scaffald-audit-v1.5.0-2026-05-24/`).
- Compared object inventories (tables, functions, triggers, indexes, policies, types, constraints).
- For functions, parsed bodies and diffed signature-by-signature, isolating `search_path` differences from substantive body changes.

Raw artifacts in `/tmp/scaffald-audit-v1.5.0-2026-05-24/`: `*-schema.sql`, `*-functions.txt`, `preview-vs-dev.diff`, `preview-vs-prod.diff`.
