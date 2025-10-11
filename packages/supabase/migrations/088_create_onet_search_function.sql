-- =========================================================
-- 088_create_onet_search_function.sql
-- Add search function for O*NET occupations
-- =========================================================

BEGIN;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS onet.search_occupations(TEXT);

-- Search O*NET occupations by title or code
CREATE OR REPLACE FUNCTION onet.search_occupations(
  search_term TEXT
)
RETURNS TABLE (
  onetsoc_code CHAR(10),
  title TEXT,
  description TEXT,
  relevance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    od.onetsoc_code,
    od.title,
    od.description,
    CASE 
      WHEN od.title ILIKE search_term || '%' THEN 1.0
      WHEN od.title ILIKE '%' || search_term || '%' THEN 0.5
      WHEN od.onetsoc_code ILIKE search_term || '%' THEN 0.8
      ELSE 0.3
    END as relevance
  FROM onet.occupation_data od
  WHERE 
    od.title ILIKE '%' || search_term || '%'
    OR od.onetsoc_code ILIKE '%' || search_term || '%'
    OR od.description ILIKE '%' || search_term || '%'
  ORDER BY relevance DESC, od.title
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT) TO anon;

COMMIT;
