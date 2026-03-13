-- =============================================================================
-- restore_prod_data.sql
-- Combined production data restore script
-- Run AFTER db reset to restore user data from production backups
--
-- Usage (on staging/preview):
--   psql $DATABASE_URL -f restore_prod_data.sql
--
-- Or via supabase CLI:
--   supabase db execute --file restore_prod_data.sql --linked
-- =============================================================================

-- Disable triggers and FK checks during restore
SET session_replication_role = replica;

-- Temporarily disable the slug format constraint (auth trigger may create users with bad slugs)
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_slug_format_check;

-- =============================================================================
-- Phase 1: Auth users (must come first — triggers create core.users rows)
-- =============================================================================
\echo 'Restoring auth.users...'
\i prod_auth_data_20260313.sql

-- =============================================================================
-- Phase 2: Core schema data (users, profiles, orgs, etc.)
-- =============================================================================
\echo 'Restoring core schema data...'
\i prod_core_data_20260313.sql

-- =============================================================================
-- Phase 3: Engagement schema data
-- =============================================================================
\echo 'Restoring engagement schema data...'
\i prod_engagement_data_20260313.sql

-- =============================================================================
-- Phase 4: Public schema data
-- =============================================================================
\echo 'Restoring public schema data...'
\i prod_public_data_20260313.sql

-- Re-enable triggers and FK checks
SET session_replication_role = DEFAULT;

-- Re-add the slug format constraint
ALTER TABLE core.users ADD CONSTRAINT users_slug_format_check
  CHECK (slug ~ '^[a-z0-9][a-z0-9_-]*$');

\echo 'Production data restore complete!'
