-- =========================================================
-- 039_create_onet_helper_functions.sql
-- =========================================================
-- Creates helper functions for O*NET data access
-- Must run AFTER 038 (data import) to ensure tables exist
-- =========================================================

BEGIN;

-- =========================================================
-- Helper Functions
-- =========================================================

-- Search occupations by keyword
CREATE OR REPLACE FUNCTION onet.search_occupations(search_term TEXT)
RETURNS TABLE (
  onetsoc_code TEXT,
  title TEXT,
  description TEXT,
  rank REAL
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    onetsoc_code::TEXT,
    title::TEXT,
    description::TEXT,
    ts_rank(
      to_tsvector('english', title || ' ' || COALESCE(description, '')),
      plainto_tsquery('english', search_term)
    ) AS rank
  FROM onet.occupation_data
  WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) 
    @@ plainto_tsquery('english', search_term)
  ORDER BY rank DESC, title
  LIMIT 50;
$$;

COMMENT ON FUNCTION onet.search_occupations IS 'Full-text search across O*NET occupation titles and descriptions';

-- Get occupation by SOC code
CREATE OR REPLACE FUNCTION onet.get_occupation(soc_code TEXT)
RETURNS TABLE (
  onetsoc_code TEXT,
  title TEXT,
  description TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    onetsoc_code::TEXT,
    title::TEXT,
    description::TEXT
  FROM onet.occupation_data
  WHERE onetsoc_code = soc_code;
$$;

COMMENT ON FUNCTION onet.get_occupation IS 'Get occupation details by O*NET-SOC code';

COMMIT;
