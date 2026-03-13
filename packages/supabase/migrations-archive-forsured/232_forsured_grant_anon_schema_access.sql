-- Migration: Grant anon role access to forsured and core schemas
-- Date: 2025-12-03
-- Issue: Login flow uses anon key before user is authenticated, needs SELECT access

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- The OAuth callback flow queries user_profiles with the anon key before
-- the user has been authenticated in Supabase Auth. The anon role needs:
-- - USAGE on the schema to access it via PostgREST
-- - SELECT on tables to read user profile data
--
-- RLS policies still control what data can be accessed - this just grants
-- the base permissions needed to make any query at all.
-- =============================================================================

-- Grant anon role access to forsured schema
GRANT USAGE ON SCHEMA forsured TO anon;

-- Grant SELECT on all existing tables in forsured schema to anon
GRANT SELECT ON ALL TABLES IN SCHEMA forsured TO anon;

-- Grant anon default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA forsured
    GRANT SELECT ON TABLES TO anon;

-- Also grant on core schema (used for user lookups)
GRANT USAGE ON SCHEMA core TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA core
    GRANT SELECT ON TABLES TO anon;

DO $$
BEGIN
    RAISE NOTICE '✅ Anon role granted schema access for forsured and core';
END $$;
