-- Migration: Add name column and update role constraint for user_invitations
-- Description: Adds name column to user_invitations table and updates role constraint to include 'broker'
-- This enables broker team member invitations to store the invitee's name
-- Author: Claude
-- Date: 2025-01-19

-- =============================================================================
-- Add name column to user_invitations
-- =============================================================================
ALTER TABLE forsured.user_invitations
ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN forsured.user_invitations.name IS 'The name of the person being invited';

-- =============================================================================
-- Update role constraint to include broker role
-- First drop the old constraint, then add the new one
-- =============================================================================
ALTER TABLE forsured.user_invitations
DROP CONSTRAINT IF EXISTS chk_user_invitations_role;

ALTER TABLE forsured.user_invitations
ADD CONSTRAINT chk_user_invitations_role
CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'broker'));

COMMENT ON TABLE forsured.user_invitations IS 'Pending user invitations to organizations. Supports owner, admin, member, viewer, and broker roles.';
