-- Migration: Create function to get user profile by scaffald_user_id
-- Description: Creates a SECURITY DEFINER function that can query user_profiles
-- without RLS restrictions. This is needed because the app uses Scaffald OAuth
-- (not Supabase Auth), so auth.uid() doesn't match scaffald_user_id in RLS policies.
-- Author: Auto-generated
-- Date: 2025-12-16

-- Create function to get user profile by scaffald_user_id
-- SECURITY DEFINER allows the function to run with the privileges of the function owner
-- This bypasses RLS policies, allowing queries even when auth.uid() doesn't match
-- Function is created in public schema so it can be called via Supabase RPC
CREATE OR REPLACE FUNCTION public.get_user_profile_by_scaffald_id(p_scaffald_user_id UUID)
RETURNS forsured.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, forsured
AS $$
DECLARE
  v_profile forsured.user_profiles;
BEGIN
  SELECT * INTO v_profile
  FROM forsured.user_profiles
  WHERE scaffald_user_id = p_scaffald_user_id
  LIMIT 1;
  
  RETURN v_profile;
END;
$$;

-- Grant execute permission to authenticated users (anon key)
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_scaffald_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_by_scaffald_id(UUID) TO anon;

