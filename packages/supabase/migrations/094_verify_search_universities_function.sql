-- =========================================================
-- 094_verify_search_universities_function.sql
-- Ensures the search_universities function exists and is properly accessible
-- This migration is idempotent and safe to run multiple times
-- =========================================================

BEGIN;

-- Ensure pg_trgm extension is enabled (required for trigram similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop and recreate the function to ensure it's up to date
DROP FUNCTION IF EXISTS data.search_universities(text, text, int);

-- Create the search_universities function
CREATE OR REPLACE FUNCTION data.search_universities(
  p_query text,
  p_country text DEFAULT NULL,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  country text,
  alpha_two_code text,
  domains text[],
  web_pages text[],
  state_province text,
  similarity real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.slug,
    u.country,
    u.alpha_two_code,
    u.domains,
    u.web_pages,
    u.state_province,
    similarity(u.name, p_query) as similarity
  FROM data.universities u
  WHERE u.is_active = true
    AND (p_country IS NULL OR u.country = p_country)
    AND u.name % p_query  -- Trigram similarity operator
  ORDER BY similarity DESC, u.name
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions to all relevant roles
GRANT EXECUTE ON FUNCTION data.search_universities(text, text, int) TO anon;
GRANT EXECUTE ON FUNCTION data.search_universities(text, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION data.search_universities(text, text, int) TO service_role;

-- Verify the trigram index exists on the universities.name column
CREATE INDEX IF NOT EXISTS universities_name_trgm_idx 
  ON data.universities USING gin(name gin_trgm_ops);

-- Add comment for documentation
COMMENT ON FUNCTION data.search_universities(text, text, int) IS
'Searches universities using trigram similarity matching. Returns universities ordered by similarity score.
Parameters:
- p_query: Search term (required)
- p_country: Optional country filter
- p_limit: Maximum number of results (default 20)
Available to: anon, authenticated, service_role';

-- Verify the function exists and log success
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'data' 
    AND p.proname = 'search_universities';
    
  IF func_count = 0 THEN
    RAISE EXCEPTION 'Failed to create data.search_universities function';
  END IF;
  
  RAISE NOTICE 'Successfully verified data.search_universities function exists';
END $$;

COMMIT;
