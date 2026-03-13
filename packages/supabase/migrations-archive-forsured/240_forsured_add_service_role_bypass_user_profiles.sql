-- Migration: Add service role bypass for user_profiles
-- Description: Allows service role to bypass RLS for user_profiles table
-- This is needed because the app uses Scaffald OAuth (not Supabase Auth),
-- so auth.uid() doesn't match scaffald_user_id in RLS policies.
-- Service role bypass allows server-side queries (tRPC endpoints) to work.
-- Author: Auto-generated
-- Date: 2025-12-16

-- Drop policy if it exists (idempotent)
DROP POLICY IF EXISTS "Service role bypass for user_profiles" ON forsured.user_profiles;

-- Add service role bypass policy for user_profiles
-- This allows server-side queries using service role to bypass RLS
CREATE POLICY "Service role bypass for user_profiles"
  ON forsured.user_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

