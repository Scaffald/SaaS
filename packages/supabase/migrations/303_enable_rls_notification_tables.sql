-- =============================================================================
-- 402_enable_rls_notification_tables.sql
--
-- Enables Row Level Security (RLS) on the five core.notification_* tables
-- that have policies but did not have RLS enabled (Supabase advisor Issue #170).
--
-- Policies and grants were created in 025_req_89_notifications_expansion.sql;
-- this migration only enables RLS so those policies take effect for
-- authenticated requests. service_role continues to bypass RLS.
-- =============================================================================

BEGIN;

ALTER TABLE core.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_digest_queue ENABLE ROW LEVEL SECURITY;

COMMIT;
