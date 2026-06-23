-- 335_scheduling_grants.sql
-- The interview-scheduling tables (migration 307: scheduling_links,
-- interview_slots, interview_bookings, interview_availability,
-- calendar_connections) were created with RLS enabled but WITHOUT the
-- underlying table-level GRANTs for service_role / authenticated. Every access
-- therefore failed with "permission denied for table ..." — a GRANT error that
-- fires before RLS is evaluated. This blocked the v1.12.0 candidate
-- self-scheduling flow (the edge function uses service_role and enforces
-- ownership in code). Same class of bug as 332_api_keys_grants.
--
-- Grant service_role full access (the API gates ownership in code) and grant
-- authenticated the privileges its future RLS policies would assume.

BEGIN;

GRANT ALL ON core.scheduling_links TO service_role;
GRANT ALL ON core.interview_slots TO service_role;
GRANT ALL ON core.interview_bookings TO service_role;
GRANT ALL ON core.interview_availability TO service_role;
GRANT ALL ON core.calendar_connections TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.scheduling_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.interview_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.interview_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.interview_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.calendar_connections TO authenticated;

COMMIT;
