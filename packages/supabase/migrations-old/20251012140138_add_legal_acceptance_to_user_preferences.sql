-- Add privacy policy and terms of service acceptance tracking to user_preferences
-- This migration adds columns to track when users accept legal agreements

BEGIN;

-- Add columns for tracking legal acceptance
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS accepted_privacy_policy_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_terms_of_service_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS terms_of_service_version TEXT DEFAULT 'v1.0';

-- Add helpful comments
COMMENT ON COLUMN public.user_preferences.accepted_privacy_policy_at IS 'Timestamp when user accepted privacy policy';
COMMENT ON COLUMN public.user_preferences.accepted_terms_of_service_at IS 'Timestamp when user accepted terms of service';
COMMENT ON COLUMN public.user_preferences.privacy_policy_version IS 'Version of privacy policy that was accepted';
COMMENT ON COLUMN public.user_preferences.terms_of_service_version IS 'Version of terms of service that was accepted';

COMMIT;
