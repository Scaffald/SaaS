-- Migration: 246_forsured_broker_invitations_enhancements.sql
-- Adds security (rate limiting) and UX (brokerage name) fields to broker_invitations

-- Add brokerage_name field for UX improvement
-- Allows users to see which brokerage is inviting them during signup
ALTER TABLE forsured.broker_invitations
  ADD COLUMN IF NOT EXISTS brokerage_name TEXT;

-- Add rate limiting tracking fields
-- These protect against brute force attacks on invitation codes
ALTER TABLE forsured.broker_invitations
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;

ALTER TABLE forsured.broker_invitations
  ADD COLUMN IF NOT EXISTS last_failed_attempt TIMESTAMPTZ;

ALTER TABLE forsured.broker_invitations
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create partial index for efficient locked invitation queries
-- Only indexes rows where locked_until is not null (active lockouts)
CREATE INDEX IF NOT EXISTS idx_broker_invitations_locked
  ON forsured.broker_invitations(code, locked_until)
  WHERE locked_until IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN forsured.broker_invitations.brokerage_name IS 'Display name of the brokerage for UX - shown during signup validation';
COMMENT ON COLUMN forsured.broker_invitations.failed_attempts IS 'Number of failed validation attempts for this invitation code';
COMMENT ON COLUMN forsured.broker_invitations.last_failed_attempt IS 'Timestamp of the most recent failed validation attempt';
COMMENT ON COLUMN forsured.broker_invitations.locked_until IS 'If set, code is locked until this timestamp due to too many failed attempts';
