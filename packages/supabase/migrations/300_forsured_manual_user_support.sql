-- Migration: 300_forsured_manual_user_support.sql
-- REQ-12: Add Manual Broker and Contractor Registration from Manager and Broker Dashboards
-- TASK-1: Create database schema for manual user support and merge tracking
--
-- Purpose: Extend forsured.user_profiles to support manually-created placeholder users
-- and create supporting tables for tracking merge operations when users register.
--
-- Key Changes:
-- 1. Modify forsured.user_profiles to allow nullable scaffald_user_id (for manual users)
-- 2. Add columns for manual user tracking and merge workflow
-- 3. Create user_merge_resolutions table for conflict tracking
-- 4. Add audit log extension for merge references
-- 5. Create appropriate indexes and RLS policies

-- =============================================================================
-- STEP 1: MODIFY forsured.user_profiles FOR MANUAL USER SUPPORT
-- =============================================================================

-- Drop the existing UNIQUE constraint on scaffald_user_id to allow nulls and recreate
-- (Postgres allows multiple NULLs in UNIQUE constraint, but we need to drop NOT NULL)
ALTER TABLE forsured.user_profiles
ALTER COLUMN scaffald_user_id DROP NOT NULL;

-- Add comment explaining nullable scaffald_user_id
COMMENT ON COLUMN forsured.user_profiles.scaffald_user_id IS
  'References core.users. NULL for manually-created placeholder users who have not registered with Scaffald yet.';

-- Add columns for manual user support
ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS is_manually_created BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS merged_from_manual_user_id UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL;

-- Add additional profile fields for manual users (collected during manual creation)
ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS company TEXT;

-- Add comments for new columns
COMMENT ON COLUMN forsured.user_profiles.is_manually_created IS
  'True if this user was manually added by another user (manager or broker) and has not registered yet.';

COMMENT ON COLUMN forsured.user_profiles.created_by_user_id IS
  'References the forsured.user_profiles.id of the user who manually created this entry. NULL for self-registered users.';

COMMENT ON COLUMN forsured.user_profiles.merged_at IS
  'Timestamp when this user''s data was merged from a manual user record. NULL if not merged.';

COMMENT ON COLUMN forsured.user_profiles.merged_from_manual_user_id IS
  'References the original manual user profile that was merged into this user. NULL if not a merge target.';

COMMENT ON COLUMN forsured.user_profiles.email IS
  'User email address. For manual users, this is collected during creation. For Scaffald users, synced from core.users.';

COMMENT ON COLUMN forsured.user_profiles.name IS
  'User display name. For manual users, this is collected during creation. For Scaffald users, synced from core.users.';

COMMENT ON COLUMN forsured.user_profiles.phone IS
  'User phone number. Optional, collected during manual user creation or user profile update.';

COMMENT ON COLUMN forsured.user_profiles.company IS
  'Company name. For manual users, this is collected during creation. May also be derived from organization relationships.';

-- =============================================================================
-- STEP 2: EXTEND forsured.audit_log FOR MERGE TRACKING
-- =============================================================================

-- Add column for manual user merge references
ALTER TABLE forsured.audit_log
ADD COLUMN IF NOT EXISTS manual_user_merge_reference JSONB;

COMMENT ON COLUMN forsured.audit_log.manual_user_merge_reference IS
  'Stores merge metadata when audit entry relates to a manual user merge operation. Contains original_manual_user_id, new_user_id, merged_at, and merge_type.';

-- =============================================================================
-- STEP 3: CREATE user_merge_resolutions TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.user_merge_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References to the users being merged
  manual_user_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,
  real_user_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,

  -- Field conflict tracking
  field_name TEXT NOT NULL,
  manual_value TEXT,
  scaffald_value TEXT,
  selected_value TEXT,

  -- Resolution metadata
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT user_merge_resolutions_unique UNIQUE (manual_user_id, real_user_id, field_name),
  CONSTRAINT user_merge_resolutions_selected_value_check CHECK (
    selected_value IS NULL OR
    selected_value = manual_value OR
    selected_value = scaffald_value
  )
);

-- Add comments
COMMENT ON TABLE forsured.user_merge_resolutions IS
  'Tracks user decisions during manual user merge conflict resolution. Each row represents a single field conflict and its resolution.';

COMMENT ON COLUMN forsured.user_merge_resolutions.manual_user_id IS
  'References the manually-created user profile being merged from.';

COMMENT ON COLUMN forsured.user_merge_resolutions.real_user_id IS
  'References the real (Scaffald-registered) user profile being merged into.';

COMMENT ON COLUMN forsured.user_merge_resolutions.field_name IS
  'Name of the conflicting field (e.g., name, company, phone).';

COMMENT ON COLUMN forsured.user_merge_resolutions.manual_value IS
  'Value from the manually-created user record.';

COMMENT ON COLUMN forsured.user_merge_resolutions.scaffald_value IS
  'Value from the Scaffald user profile.';

COMMENT ON COLUMN forsured.user_merge_resolutions.selected_value IS
  'The value chosen by the user during merge. Must match either manual_value or scaffald_value.';

COMMENT ON COLUMN forsured.user_merge_resolutions.resolved_at IS
  'Timestamp when the user made their resolution choice.';

COMMENT ON COLUMN forsured.user_merge_resolutions.resolved_by IS
  'User who resolved the conflict (typically the newly registered user).';

-- =============================================================================
-- STEP 4: CREATE INDEXES FOR MANUAL USER QUERIES
-- =============================================================================

-- Index for querying manual users
CREATE INDEX IF NOT EXISTS idx_user_profiles_manually_created
  ON forsured.user_profiles(is_manually_created)
  WHERE is_manually_created = true;

-- Index for finding users by their creator
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by
  ON forsured.user_profiles(created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

-- Index for finding merged users
CREATE INDEX IF NOT EXISTS idx_user_profiles_merged_from
  ON forsured.user_profiles(merged_from_manual_user_id)
  WHERE merged_from_manual_user_id IS NOT NULL;

-- Index for email lookups (for merge matching)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON forsured.user_profiles(email)
  WHERE email IS NOT NULL;

-- Indexes for user_merge_resolutions
CREATE INDEX IF NOT EXISTS idx_user_merge_resolutions_manual_user
  ON forsured.user_merge_resolutions(manual_user_id);

CREATE INDEX IF NOT EXISTS idx_user_merge_resolutions_real_user
  ON forsured.user_merge_resolutions(real_user_id);

CREATE INDEX IF NOT EXISTS idx_user_merge_resolutions_resolved_by
  ON forsured.user_merge_resolutions(resolved_by)
  WHERE resolved_by IS NOT NULL;

-- =============================================================================
-- STEP 5: CREATE RLS POLICIES FOR MANUAL USER ACCESS
-- =============================================================================

-- Enable RLS on user_merge_resolutions
ALTER TABLE forsured.user_merge_resolutions ENABLE ROW LEVEL SECURITY;

-- Update user_profiles RLS policies for manual users

-- Policy: Users can view manual users they created
CREATE POLICY "Users can view manual users they created"
  ON forsured.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    created_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Policy: Users can update manual users they created
CREATE POLICY "Users can update manual users they created"
  ON forsured.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_manually_created = true AND
    created_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Policy: Users can delete manual users they created
CREATE POLICY "Users can delete manual users they created"
  ON forsured.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    is_manually_created = true AND
    created_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Policy: Users can insert manual users
CREATE POLICY "Users can insert manual users"
  ON forsured.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- For manual users, created_by must reference a profile owned by the current user
    (is_manually_created = true AND created_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )) OR
    -- For self-registration, scaffald_user_id must match current user
    (is_manually_created = false AND scaffald_user_id = auth.uid())
  );

-- RLS Policies for user_merge_resolutions

-- Policy: Users involved in the merge can view resolutions
CREATE POLICY "Users can view their merge resolutions"
  ON forsured.user_merge_resolutions
  FOR SELECT
  TO authenticated
  USING (
    real_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    manual_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE created_by_user_id IN (
        SELECT id FROM forsured.user_profiles
        WHERE scaffald_user_id = auth.uid()
      )
    )
  );

-- Policy: New users can insert/update resolutions during merge
CREATE POLICY "Users can manage their merge resolutions"
  ON forsured.user_merge_resolutions
  FOR ALL
  TO authenticated
  USING (
    real_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  )
  WITH CHECK (
    real_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Service role bypass for merge operations
CREATE POLICY "Service role can manage all merge resolutions"
  ON forsured.user_merge_resolutions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- STEP 6: CREATE UPDATED_AT TRIGGER FOR user_merge_resolutions
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_user_merge_resolutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_merge_resolutions_updated_at
  BEFORE UPDATE ON forsured.user_merge_resolutions
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_user_merge_resolutions_updated_at();

-- =============================================================================
-- STEP 7: GRANT PERMISSIONS
-- =============================================================================

-- Grant access to user_merge_resolutions
GRANT SELECT ON forsured.user_merge_resolutions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON forsured.user_merge_resolutions TO authenticated;
GRANT ALL ON forsured.user_merge_resolutions TO service_role;

-- =============================================================================
-- STEP 8: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Verify is_manually_created column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured'
    AND table_name = 'user_profiles'
    AND column_name = 'is_manually_created'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column is_manually_created was not created successfully';
  END IF;

  -- Verify user_merge_resolutions table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured'
    AND table_name = 'user_merge_resolutions'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table user_merge_resolutions was not created successfully';
  END IF;

  -- Verify scaffald_user_id is now nullable
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured'
    AND table_name = 'user_profiles'
    AND column_name = 'scaffald_user_id'
    AND is_nullable = 'YES'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column scaffald_user_id is still NOT NULL - migration failed';
  END IF;

  RAISE NOTICE '✅ Migration 300_forsured_manual_user_support.sql completed successfully';
  RAISE NOTICE '  - forsured.user_profiles extended with manual user columns';
  RAISE NOTICE '  - forsured.user_merge_resolutions table created';
  RAISE NOTICE '  - forsured.audit_log extended with manual_user_merge_reference column';
  RAISE NOTICE '  - Indexes and RLS policies created';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'REQ-12 Manual User Support Migration (300) applied - user_profiles extended, user_merge_resolutions created';
