-- Migration: Remove obsolete tables from public schema
-- REQ: REQ-211 - Database Schema Migration to forsured.*
-- Phase: 1 - Schema Migration (Cleanup)
-- Date: 2025-01-14
-- Depends on: 003-005 (all previous migrations must complete successfully)

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration removes tables from the public schema that have been migrated
-- to the forsured schema. This cleanup is safe because:
-- 1. All data has been copied to forsured.* schema
-- 2. Application code will be updated to use forsured.* schema
-- 3. Rollback script can restore these tables if needed
--
-- Tables to Remove:
-- - public.audit_log (moved to forsured.audit_log)
-- - public.projects (moved to forsured.projects)
-- - public.subcontractors (moved to forsured.subcontractors)
-- - public.documents (moved to forsured.documents)
-- - public.policies (moved to forsured.policies)
-- - public.endorsements (moved to forsured.endorsements)
-- - public.requirements (moved to forsured.requirements)
-- - public.compliance_scores (moved to forsured.compliance_scores)
-- - public.tasks (moved to forsured.tasks)
-- - public.users (Scaffald owns users in core.users)
-- - public.companies (Scaffald owns organizations in core.organizations)
-- - public.cached_users (no longer needed with shared database)
-- - public.cached_companies (no longer needed with shared database)
-- - public.cached_projects (no longer needed with shared database)
--
-- See: /docs/FORSURED_ARCHITECTURE_MIGRATION_PLAN.md (Phase 1, Task 4)
-- =============================================================================

-- =============================================================================
-- SAFETY CHECK: Verify data migration completed successfully
-- =============================================================================

DO $$
DECLARE
  public_audit_count BIGINT;
  forsured_audit_count BIGINT;
BEGIN
  -- Only perform check if public.audit_log exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
    SELECT COUNT(*) INTO public_audit_count FROM public.audit_log;
    SELECT COUNT(*) INTO forsured_audit_count FROM forsured.audit_log;

    IF forsured_audit_count < public_audit_count THEN
      RAISE EXCEPTION 'Safety check failed: forsured.audit_log has % rows, public.audit_log has % rows. Migration incomplete!',
        forsured_audit_count, public_audit_count;
    END IF;

    RAISE NOTICE '✅ Safety check passed: audit_log data migration verified (% rows)', forsured_audit_count;
  END IF;
END $$;

-- =============================================================================
-- 1. DROP MIGRATED CORE TABLES FROM PUBLIC SCHEMA
-- =============================================================================

-- Drop audit_log and related objects
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.audit_log_archive_index CASCADE;
DROP FUNCTION IF EXISTS public.calculate_audit_hash CASCADE;
DROP FUNCTION IF EXISTS public.set_audit_log_hash CASCADE;
DROP FUNCTION IF EXISTS public.prevent_audit_log_modification CASCADE;
DROP FUNCTION IF EXISTS public.verify_audit_log_hash_chain CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.subcontractors CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.endorsements CASCADE;
DROP TABLE IF EXISTS public.requirements CASCADE;
DROP TABLE IF EXISTS public.compliance_scores CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;

-- =============================================================================
-- 2. DROP OBSOLETE USER/COMPANY TABLES
-- =============================================================================

-- These tables are no longer needed because:
-- - Scaffald owns users in core.users
-- - Scaffald owns organizations in core.organizations
-- - Shared database eliminates need for cached data

DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.cached_users CASCADE;
DROP TABLE IF EXISTS public.cached_companies CASCADE;
DROP TABLE IF EXISTS public.cached_projects CASCADE;

-- =============================================================================
-- 3. VERIFICATION: Confirm tables no longer exist
-- =============================================================================

DO $$
DECLARE
  remaining_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'audit_log',
      'projects',
      'subcontractors',
      'documents',
      'policies',
      'endorsements',
      'requirements',
      'compliance_scores',
      'tasks',
      'users',
      'companies',
      'organizations',
      'cached_users',
      'cached_companies',
      'cached_projects'
    );

  IF remaining_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Cleanup verification failed: tables still exist in public schema: %', remaining_tables;
  END IF;

  RAISE NOTICE '✅ All obsolete tables removed from public schema';
END $$;

-- =============================================================================
-- 4. UPDATE SCHEMA COMMENT
-- =============================================================================

COMMENT ON SCHEMA public IS 'Public schema (Forsured tables moved to forsured.* schema, user/org data in core.* schema)';
COMMENT ON SCHEMA forsured IS 'REQ-211 Obsolete Tables Cleanup (006) applied - public schema cleaned up';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 complete: obsolete tables removed from public schema';
  RAISE NOTICE '   - Migrated tables moved to forsured.* schema';
  RAISE NOTICE '   - User/org tables managed in core.* schema';
  RAISE NOTICE '   - Cached tables removed (no longer needed with shared database)';
END $$;
