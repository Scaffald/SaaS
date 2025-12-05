-- =========================================================
-- 20251121091000_engagement_schema_grants.sql
-- Add missing GRANT statements for engagement schema tables
-- =========================================================

BEGIN;

-- =========================================================
-- Profile Views Table Grants
-- =========================================================
-- Grant SELECT and INSERT to authenticated users (RLS policies control row-level access)
-- Grant ALL to service_role for analytics processing
GRANT SELECT, INSERT ON TABLE engagement.profile_views TO authenticated;
GRANT ALL ON TABLE engagement.profile_views TO service_role;

-- =========================================================
-- Activity Events Table Grants
-- =========================================================
-- Grant SELECT and INSERT to authenticated users (RLS policies control row-level access)
-- Grant ALL to service_role for analytics processing
GRANT SELECT, INSERT ON TABLE engagement.activity_events TO authenticated;
GRANT ALL ON TABLE engagement.activity_events TO service_role;

-- =========================================================
-- Connection Analytics Table Grants
-- =========================================================
-- Grant SELECT to authenticated users (RLS policies control row-level access)
-- Grant ALL to service_role for analytics processing
-- Note: Users don't need INSERT/UPDATE on this table - it's managed by service role
GRANT SELECT ON TABLE engagement.connection_analytics TO authenticated;
GRANT ALL ON TABLE engagement.connection_analytics TO service_role;

COMMIT;

