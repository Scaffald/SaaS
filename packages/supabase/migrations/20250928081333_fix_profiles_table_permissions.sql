-- Fix profiles table permissions and RLS policies
-- This migration ensures the profiles table has proper permissions for authenticated users

BEGIN;

-- Ensure profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Also ensure service_role has full access (needed for Edge Functions)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_private TO service_role;

-- Grant usage on sequences if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'profiles_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.profiles_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE public.profiles_id_seq TO service_role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'user_private_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.user_private_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE public.user_private_id_seq TO service_role;
    END IF;
END $$;

COMMIT;
