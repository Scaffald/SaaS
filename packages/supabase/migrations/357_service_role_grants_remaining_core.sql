-- =========================================================
-- 357_service_role_grants_remaining_core.sql
--
-- Grant `service_role` the twenty core tables it still cannot read.
--
-- Fifth time for this defect. Migrations 332 (api_keys), 335 (scheduling),
-- 347 (review_links), 352 (eight assessment/portfolio tables), 355
-- (construction_projects) and 356 (six tables a policy already named) each
-- fixed the tables that happened to be discovered that week, because each was
-- discovered the same way: an endpoint returned `permission denied` in an
-- environment somebody was looking at. #732 opening
-- GET /v1/work-logs/public-feed to anonymous callers is what surfaced the last
-- one — the 401 it used to return had been hiding the gap, because the request
-- never reached the query.
--
-- `service_role` is the server's own identity and bypasses RLS by design; a
-- missing GRANT fires before RLS is evaluated, so no policy can rescue it:
--
--   await createAdminClient().schema("core").from("system_config").select("*")
--   -> { code: "42501", message: "permission denied for table system_config" }
--
-- Measured across all three remote environments rather than inferred from the
-- repo (#751):
--
--   select c.relname from pg_class c
--    where c.relkind in ('r','p')
--      and c.relnamespace::regnamespace::text = 'core'
--      and not has_table_privilege('service_role', c.oid, 'SELECT');
--
--   prod      20 tables   (the list below)
--   preview   20 tables   (identical)
--   dev       12 tables   (the same list minus the eight marked * below)
--
-- The dev difference is worth recording, because #751 asked whether a migration
-- had been applied in one place and not another. It had not. All three ledgers
-- are complete and identical — 192 of 192 recorded, nothing unrecorded — and on
-- dev those eight tables carry the full privilege set
-- (DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE), which is the
-- shape `GRANT ALL` leaves, not the shape a SELECT-only fix leaves. So they were
-- granted by hand against dev, almost certainly while chasing one of these very
-- 500s, and never carried anywhere else. The ledger was not lying; nobody wrote
-- it down at all.
--
-- Granting on dev is therefore a no-op for those eight and the fix for the
-- other four — GRANT is idempotent, so this file is safe to apply anywhere.
--
-- Scoped to a fixed list on purpose. `GRANT ALL ON ALL TABLES IN SCHEMA core`
-- would close today's gap and silently swallow every table added afterwards,
-- which is the opposite of what scripts/check-migrations.mjs now enforces: a
-- new core table has to be considered, not swept in.
--
-- Only `service_role` changes. `anon` and `authenticated` are untouched, and
-- every RLS policy still scopes their rows exactly as before.
-- =========================================================

BEGIN;

GRANT ALL ON core.application_assignment_history TO service_role;  -- *
GRANT ALL ON core.archived_external_jobs         TO service_role;  -- *
GRANT ALL ON core.archived_notifications         TO service_role;  -- *
GRANT ALL ON core.background_check_events        TO service_role;
GRANT ALL ON core.background_check_providers     TO service_role;
GRANT ALL ON core.generic_invitations            TO service_role;
GRANT ALL ON core.hris_connections               TO service_role;
GRANT ALL ON core.hris_employee_mappings         TO service_role;
GRANT ALL ON core.hris_sync_logs                 TO service_role;
GRANT ALL ON core.inquiry_audit_log              TO service_role;  -- *
GRANT ALL ON core.invitation_rules               TO service_role;
GRANT ALL ON core.job_match_scores               TO service_role;
GRANT ALL ON core.job_occupation_mappings        TO service_role;
GRANT ALL ON core.message_templates              TO service_role;
GRANT ALL ON core.review_pins                    TO service_role;
GRANT ALL ON core.stripe_settings                TO service_role;  -- *
GRANT ALL ON core.success_fee_jobs               TO service_role;  -- *
GRANT ALL ON core.system_config                  TO service_role;  -- *
GRANT ALL ON core.user_relationships             TO service_role;
GRANT ALL ON core.vanity_url_analytics           TO service_role;  -- *

COMMIT;
