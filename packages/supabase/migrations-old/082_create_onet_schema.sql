-- =========================================================
-- 036_create_onet_schema.sql - O*NET Database Schema
-- =========================================================
-- Creates isolated schema for O*NET 30.0 occupational data
-- https://www.onetcenter.org/database.html
-- =========================================================

BEGIN;

-- Create dedicated schema for O*NET data
CREATE SCHEMA IF NOT EXISTS onet;

-- Add schema comment
COMMENT ON SCHEMA onet IS 'O*NET 30.0 Database - Occupational Information Network (August 2025 release)';

-- =========================================================
-- Permissions
-- =========================================================
-- Service role has full access for imports/updates
GRANT USAGE ON SCHEMA onet TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA onet TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA onet TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT ALL ON SEQUENCES TO service_role;

-- Authenticated users and anonymous have read-only access
GRANT USAGE ON SCHEMA onet TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA onet TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT SELECT ON TABLES TO authenticated, anon;

-- =========================================================
-- Note: Helper functions are created in migration 039
-- after O*NET data tables are imported in migration 038
-- =========================================================

COMMIT;
