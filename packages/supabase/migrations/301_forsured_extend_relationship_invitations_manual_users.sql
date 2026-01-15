-- Migration: 301_forsured_extend_relationship_invitations_manual_users.sql
-- REQ-12: Add Manual Broker and Contractor Registration from Manager and Broker Dashboards
-- TASK-2: Extend relationship_invitations table to support manual user linking
--
-- Purpose: Add manual_user_id column to link invitations with manually-created
-- user records, enabling merge workflow triggering when invitations are accepted.
--
-- Dependencies: 300_forsured_manual_user_support.sql (TASK-1)

-- =============================================================================
-- STEP 1: ADD manual_user_id COLUMN TO relationship_invitations
-- =============================================================================

ALTER TABLE forsured.relationship_invitations
ADD COLUMN IF NOT EXISTS manual_user_id UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL;

-- Add comment documenting the column purpose
COMMENT ON COLUMN forsured.relationship_invitations.manual_user_id IS
  'Links this invitation to a manually-created user profile. When the invitation is accepted and the invitee registers, this enables the merge workflow to connect their new account with the placeholder record.';

-- =============================================================================
-- STEP 2: ADD INDEX FOR EFFICIENT LOOKUPS
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_relationship_invitations_manual_user
  ON forsured.relationship_invitations(manual_user_id)
  WHERE manual_user_id IS NOT NULL;

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Verify manual_user_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured'
    AND table_name = 'relationship_invitations'
    AND column_name = 'manual_user_id'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column manual_user_id was not created successfully';
  END IF;

  -- Verify index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'forsured'
    AND tablename = 'relationship_invitations'
    AND indexname = 'idx_relationship_invitations_manual_user'
  ) INTO index_exists;

  IF NOT index_exists THEN
    RAISE EXCEPTION 'Index idx_relationship_invitations_manual_user was not created successfully';
  END IF;

  RAISE NOTICE '✅ Migration 301_forsured_extend_relationship_invitations_manual_users.sql completed successfully';
  RAISE NOTICE '  - manual_user_id column added to forsured.relationship_invitations';
  RAISE NOTICE '  - Index idx_relationship_invitations_manual_user created';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
