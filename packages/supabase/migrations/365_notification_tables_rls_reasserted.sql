-- =========================================================
-- 365_notification_tables_rls_reasserted.sql
--
-- Migration 303 enabled RLS on the five core.notification_* tables below and
-- is recorded in supabase_migrations.schema_migrations on prod, dev and
-- preview — but on all three `pg_class.relrowsecurity` was still false on
-- 2026-10-16. The SQL never ran; the ledger was backfilled later without
-- probing for the objects (#437, #1144). A local replay does run 303, which is
-- why every local test passed against a database production does not match.
--
-- Meanwhile `authenticated` holds SELECT/INSERT/UPDATE/DELETE on
-- notification_devices and notification_preferences (025), so any signed-in
-- user could read or rewrite every user's push tokens and preferences.
--
-- 303 cannot be edited (append-only), so this re-asserts it. ENABLE is
-- idempotent: on a fresh replay this is a no-op. The policies from
-- 025_req_89_notifications_expansion.sql are correct and unchanged.
--
-- Found by this migration's test: `service_role` has no USAGE on the four
-- notification id sequences on prod, preview and local (dev was granted by
-- hand), so any server-side INSERT into notification_devices, _deliveries,
-- _events or _digest_queue fails with `permission denied for sequence`. The
-- cron path runs as `postgres` and never noticed. Granted here — the same
-- tables, and the server's own role (see 357 for that defect class).
--
-- Verify on a remote after applying — not via the ledger:
--   select relname, relrowsecurity from pg_class
--    where relnamespace = 'core'::regnamespace and relname like 'notification_%';
-- =========================================================

BEGIN;

ALTER TABLE core.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_digest_queue ENABLE ROW LEVEL SECURITY;

GRANT USAGE, SELECT ON SEQUENCE
  core.notification_deliveries_id_seq,
  core.notification_devices_id_seq,
  core.notification_digest_queue_id_seq,
  core.notification_events_id_seq
TO service_role;

COMMIT;
