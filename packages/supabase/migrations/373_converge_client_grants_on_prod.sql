-- =========================================================
-- 373_converge_client_grants_on_prod.sql
--
-- The security fingerprint (#1146) showed client grants differ between
-- projects, and always in one direction: prod holds a subset of what dev,
-- preview and a fresh replay hold (#1229).
--
--   fresh replay / preview   10 public.* tables with anon/authenticated DML
--                            prod does not have (Supabase's default privileges
--                            on `public`, revoked by hand on prod at some point)
--   dev                      106 tables, 165 privileges — hand grants
--
-- RLS is on for every one of them, so none is an exposure today, but each is a
-- table where one permissive policy would open data on some projects and not
-- others. This revokes, on every project, each anon/authenticated
-- SELECT/INSERT/UPDATE/DELETE that prod does not hold. On prod it is a no-op by
-- construction (generated from the four fingerprints of 2026-10-16); elsewhere
-- it converges on prod, which is the only grant set the app is known to work
-- against.
--
-- One place prod is *too* tight, found by the same diff: public.webhooks,
-- webhook_events and webhook_deliveries have no grants at all on prod — not
-- even service_role — so GET /v1/webhooks answers "permission denied for table
-- webhooks" to everyone there (measured 2026-10-16). The end of this migration
-- grants what their policies are written for: authenticated (scoped by the
-- four webhooks_* policies and the two *_select_policy ones) and service_role.
-- Not anon.
--
-- It also sweeps TRUNCATE, REFERENCES and TRIGGER from anon and authenticated
-- in our schemas. PostgREST never issues them, and TRUNCATE ignores RLS.
-- =========================================================

BEGIN;

REVOKE SELECT ON core.account_credits FROM anon;
REVOKE SELECT ON core.account_deletions FROM anon;
REVOKE SELECT ON core.addresses FROM anon;
REVOKE SELECT ON core.application_inquiries FROM anon;
REVOKE SELECT ON core.application_messages FROM anon;
REVOKE SELECT ON core.applications FROM anon;
REVOKE SELECT ON core.archetypes FROM anon;
REVOKE SELECT ON core.assessment_sessions FROM anon;
REVOKE SELECT ON core.background_check_access FROM anon;
REVOKE SELECT ON core.background_check_access_log FROM anon;
REVOKE SELECT ON core.background_check_addons FROM anon;
REVOKE SELECT ON core.background_check_consent FROM anon;
REVOKE SELECT ON core.background_check_disclosures FROM anon;
REVOKE SELECT ON core.background_check_disputes FROM anon;
REVOKE SELECT ON core.background_check_documents FROM anon;
REVOKE SELECT ON core.background_check_packages FROM anon;
REVOKE SELECT ON core.background_check_types FROM anon;
REVOKE SELECT ON core.background_checks FROM anon;
REVOKE SELECT ON core.ccpa_export_downloads FROM anon;
REVOKE SELECT ON core.ccpa_oauth_app_registry FROM anon;
REVOKE SELECT ON core.ccpa_opt_outs FROM anon;
REVOKE SELECT ON core.ccpa_request_history FROM anon;
REVOKE SELECT ON core.ccpa_requests FROM anon;
REVOKE SELECT ON core.circumvention_reports FROM anon;
REVOKE SELECT ON core.cloud_storage_tokens FROM anon;
REVOKE SELECT ON core.connections FROM anon;
REVOKE SELECT ON core.credit_ledger FROM anon;
REVOKE SELECT ON core.follows FROM anon;
REVOKE SELECT ON core.hire_agreements FROM anon;
REVOKE SELECT ON core.id_verifications FROM anon;
REVOKE SELECT ON core.inquiry_audit_log FROM anon;
REVOKE SELECT ON core.inquiry_audit_log FROM authenticated;
REVOKE SELECT ON core.inquiry_capability_responses FROM anon;
REVOKE SELECT ON core.inquiry_comments FROM anon;
REVOKE SELECT ON core.inquiry_reminders FROM anon;
REVOKE SELECT ON core.inquiry_sections FROM anon;
REVOKE SELECT ON core.inquiry_templates FROM anon;
REVOKE SELECT ON core.invites FROM anon;
REVOKE SELECT ON core.job_team_assignments FROM anon;
REVOKE SELECT ON core.notification_deliveries FROM anon;
REVOKE SELECT ON core.notification_devices FROM anon;
REVOKE SELECT ON core.notification_digest_queue FROM anon;
REVOKE SELECT ON core.notification_events FROM anon;
REVOKE SELECT ON core.notification_preferences FROM anon;
REVOKE SELECT ON core.notifications FROM anon;
REVOKE SELECT ON core.oauth_app_audit_log FROM anon;
REVOKE SELECT ON core.oauth_apps FROM anon;
REVOKE SELECT ON core.oauth_scopes FROM anon;
REVOKE SELECT ON core.oauth_tokens FROM anon;
REVOKE SELECT ON core.organization_audit_log FROM anon;
REVOKE SELECT ON core.organization_document_shares FROM anon;
REVOKE SELECT ON core.organization_document_versions FROM anon;
REVOKE SELECT ON core.organization_documents FROM anon;
REVOKE SELECT ON core.organization_folders FROM anon;
REVOKE SELECT ON core.organization_limit_overrides FROM anon;
REVOKE SELECT ON core.organization_locations FROM anon;
REVOKE SELECT ON core.organization_payment_methods FROM anon;
REVOKE SELECT ON core.organization_requests FROM anon;
REVOKE SELECT ON core.organization_settings FROM anon;
REVOKE SELECT ON core.organization_storage_usage FROM anon;
REVOKE SELECT ON core.payment_transactions FROM anon;
REVOKE SELECT ON core.personality_assessments FROM anon;
REVOKE SELECT ON core.preferences FROM anon;
REVOKE SELECT ON core.profile FROM anon;
REVOKE SELECT ON core.project_workers FROM anon;
REVOKE SELECT ON core.resume_uploads FROM anon;
REVOKE SELECT ON core.resume_wizard_state FROM anon;
REVOKE SELECT ON core.role_assignments FROM anon;
REVOKE SELECT ON core.roles FROM anon;
REVOKE SELECT ON core.service_pricing FROM anon;
REVOKE SELECT ON core.sites FROM anon;
REVOKE SELECT ON core.slug_change_history FROM anon;
REVOKE SELECT ON core.subscription_tier_limits FROM anon;
REVOKE SELECT ON core.success_fees FROM anon;
REVOKE SELECT ON core.team_activity_events FROM anon;
REVOKE SELECT ON core.team_daily_metrics FROM anon;
REVOKE SELECT ON core.team_invitations FROM anon;
REVOKE SELECT ON core.team_member_workloads FROM anon;
REVOKE SELECT ON core.team_members FROM anon;
REVOKE SELECT ON core.user_archetypes FROM anon;
REVOKE SELECT ON core.user_assessment_xp FROM anon;
REVOKE SELECT ON core.user_certifications FROM anon;
REVOKE SELECT ON core.user_education FROM anon;
REVOKE SELECT ON core.user_experience FROM anon;
REVOKE SELECT ON core.user_skills FROM anon;
REVOKE SELECT ON core.user_storage_usage FROM anon;
REVOKE SELECT ON core.work_log_audit_log FROM anon;
REVOKE SELECT ON core.work_log_collaborators FROM anon;
REVOKE SELECT ON core.work_log_conversations FROM anon;
REVOKE SELECT ON core.work_log_photos FROM anon;
REVOKE SELECT ON core.work_logs FROM anon;
REVOKE SELECT ON engagement.activity_events FROM anon;
REVOKE SELECT ON engagement.connection_analytics FROM anon;
REVOKE SELECT ON engagement.daily_engagement_rollups FROM anon;
REVOKE SELECT ON engagement.daily_visibility_rollups FROM anon;
REVOKE SELECT ON engagement.profile_views FROM anon;
REVOKE SELECT ON engagement.search_impressions FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.audit_log FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.auth_sessions FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.auth_sessions FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.breach_notifications FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.breach_notifications FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.consent_records FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.data_processing_agreements FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.data_processing_agreements FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.privacy_requests FROM anon;
REVOKE DELETE, UPDATE ON public.privacy_requests FROM authenticated;
REVOKE DELETE, INSERT, UPDATE ON public.spatial_ref_sys FROM anon;
REVOKE DELETE, INSERT, UPDATE ON public.spatial_ref_sys FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhook_deliveries FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhook_deliveries FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhook_events FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhook_events FROM authenticated;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhooks FROM anon;
REVOKE DELETE, INSERT, SELECT, UPDATE ON public.webhooks FROM authenticated;

DO $$
DECLARE
  t regclass;
BEGIN
  FOR t IN
    SELECT c.oid::regclass FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind IN ('r', 'p')
       AND n.nspname IN ('core', 'public', 'community', 'engagement', 'onet', 'data')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON %s FROM anon, authenticated', t);
  END LOOP;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated, service_role;
GRANT SELECT ON public.webhook_events, public.webhook_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_events, public.webhook_deliveries TO service_role;

COMMIT;
