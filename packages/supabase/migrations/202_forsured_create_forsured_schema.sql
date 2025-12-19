-- Migration: Create forsured schema
-- REQ: REQ-211 - Database Schema Migration to forsured.*
-- Phase: 1 - Schema Creation
-- Date: 2025-01-14

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration creates the `forsured` schema to isolate Forsured data from
-- Scaffald data in the shared Supabase instance. The shared architecture uses:
--   - `scaffald.*` schema: Scaffald-owned tables (users, organizations, projects)
--   - `forsured.*` schema: Forsured-owned tables (policies, compliance, documents)
--
-- IMPORTANT: This is the first step in the architecture migration. All subsequent
-- migrations depend on this schema existing.
--
-- See: /docs/FORSURED_ARCHITECTURE_MIGRATION_PLAN.md (Phase 1)
-- =============================================================================

-- Create forsured schema
CREATE SCHEMA IF NOT EXISTS forsured;

-- Add schema description
COMMENT ON SCHEMA forsured IS 'Forsured insurance compliance data (isolated from Scaffald)';

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA forsured TO authenticated;
GRANT USAGE ON SCHEMA forsured TO service_role;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA forsured
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA forsured
    GRANT ALL ON TABLES TO service_role;

-- Verify schema creation
DO $$
DECLARE
    schema_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'forsured'
    ) INTO schema_exists;

    IF NOT schema_exists THEN
        RAISE EXCEPTION 'Schema forsured was not created successfully';
    END IF;

    RAISE NOTICE '✅ Schema forsured created successfully';
END $$;
