-- =========================================================
-- 366_rls_on_service_only_tables.sql
--
-- Nine tables have RLS disabled on every environment (#1145):
--
--   core.stripe_settings          core.archived_external_jobs
--   core.system_config            core.archived_notifications
--   core.success_fee_jobs         core.vanity_url_analytics
--   core.construction_projects    public.audit_log_archive_index
--   core.application_assignment_history
--
-- On prod and preview they are closed only because anon/authenticated hold no
-- GRANT. On dev someone granted them by hand: anon could SELECT all eight core
-- tables and had ALL on public.audit_log_archive_index. stripe_settings carries
-- api_key_secret_id, and with core.get_secret_value anon-callable (fixed in
-- 364) that chain returned dev's Stripe secret key to an unauthenticated
-- request.
--
-- Every reader is the `api` function's service-role client, which bypasses
-- RLS: stripe-settings.ts, payments.ts, success-fees.ts, stripe-client.ts and
-- id-verification-api.ts (stripe_settings); office-settings.ts (system_config,
-- deliberately not granted to `authenticated` — see #856); work-logs.ts
-- (construction_projects); application-assignment.ts and teams.ts
-- (application_assignment_history). The other four have no reader outside
-- migrations and cron. So these get RLS with NO client policy: deny-all for
-- anon/authenticated even if a stray GRANT reappears, unchanged for the server.
--
-- The REVOKEs are no-ops on prod, preview and local, and remove dev's drift.
-- =========================================================

BEGIN;

ALTER TABLE core.stripe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.success_fee_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.construction_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.application_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.archived_external_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.archived_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.vanity_url_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_archive_index ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON core.stripe_settings FROM anon, authenticated;
REVOKE ALL ON core.system_config FROM anon, authenticated;
REVOKE ALL ON core.success_fee_jobs FROM anon, authenticated;
REVOKE ALL ON core.construction_projects FROM anon, authenticated;
REVOKE ALL ON core.application_assignment_history FROM anon, authenticated;
REVOKE ALL ON core.archived_external_jobs FROM anon, authenticated;
REVOKE ALL ON core.archived_notifications FROM anon, authenticated;
REVOKE ALL ON core.vanity_url_analytics FROM anon, authenticated;
REVOKE ALL ON public.audit_log_archive_index FROM anon, authenticated;

COMMIT;
