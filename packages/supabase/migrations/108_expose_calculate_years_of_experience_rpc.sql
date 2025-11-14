-- =========================================================
-- 108_expose_calculate_years_of_experience_rpc.sql
-- Creates a public schema wrapper function to expose
-- core.calculate_years_of_experience via Supabase RPC
-- =========================================================

BEGIN;

-- Create public schema wrapper function for RPC access
-- Supabase PostgREST only exposes functions from the public schema by default
CREATE OR REPLACE FUNCTION public.calculate_years_of_experience(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  -- Simply call the core function
  RETURN core.calculate_years_of_experience(p_user_id);
END;
$$;

COMMENT ON FUNCTION public.calculate_years_of_experience(UUID) IS
  'Public wrapper for core.calculate_years_of_experience. Calculates total years of experience for a user by expanding experience periods into distinct months and returning the total in years (one decimal place).';

-- Grant execute permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.calculate_years_of_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_years_of_experience(UUID) TO anon;

COMMIT;

