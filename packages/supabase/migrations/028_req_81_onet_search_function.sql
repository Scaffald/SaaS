-- =========================================================
-- 028_req_81_onet_search_function.sql
-- Restore and enhance O*NET occupation search function
-- =========================================================

BEGIN;

-- Ensure trigram extension is available for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Supporting GIN index for faster text lookup
CREATE INDEX IF NOT EXISTS onet_occupation_title_trgm_idx
  ON onet.occupation_data
  USING gin (title gin_trgm_ops);

-- Drop legacy function signatures if present
DROP FUNCTION IF EXISTS onet.search_occupations(TEXT);
DROP FUNCTION IF EXISTS onet.search_occupations(TEXT, INTEGER);

-- Create new search function with configurable limit
CREATE OR REPLACE FUNCTION onet.search_occupations(
  search_query TEXT,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  onetsoc_code TEXT,
  title TEXT,
  description TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    od.onetsoc_code,
    od.title,
    od.description,
    GREATEST(
      SIMILARITY(od.title, search_query),
      SIMILARITY(od.onetsoc_code, search_query),
      SIMILARITY(COALESCE(od.description, ''), search_query)
    ) AS similarity_score
  FROM onet.occupation_data od
  WHERE
    od.title ILIKE '%' || search_query || '%'
    OR od.onetsoc_code ILIKE '%' || search_query || '%'
    OR od.description ILIKE '%' || search_query || '%'
    OR SIMILARITY(od.title, search_query) > 0.3
  ORDER BY similarity_score DESC, od.title
  LIMIT GREATEST(max_results, 1);
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT, INTEGER) TO anon;

COMMIT;

