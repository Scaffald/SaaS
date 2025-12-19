-- =========================================================
-- Fix search_parent_skills to support CSI skills
-- =========================================================
-- Updates the search_parent_skills function to search both
-- CSI skills (from data.masterformat) and core.skills taxonomy.
-- CSI skills don't have industry_id, so they're searched independently.

BEGIN;

-- Drop existing grants (will recreate with new signature)
REVOKE EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER) FROM anon;

-- Drop old function (will recreate with new signature that includes optional taxonomy parameter)
DROP FUNCTION IF EXISTS public.search_parent_skills(TEXT, UUID, INTEGER);

-- Create updated search parent skills function to support CSI skills
CREATE OR REPLACE FUNCTION public.search_parent_skills(
  p_query TEXT,
  p_industry_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_taxonomy TEXT DEFAULT NULL  -- 'csi', 'core', or NULL for both
)
RETURNS TABLE (
  skill_id UUID,
  skill_name TEXT,
  csi_display TEXT,
  csi_code TEXT[],
  active BOOLEAN,
  child_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core, data, public
AS $$
BEGIN
  RETURN QUERY
  
  WITH combined_results AS (
    -- Search CSI skills from data.masterformat (if taxonomy is 'csi' or NULL)
    SELECT 
      m.id AS skill_id,
      m.name AS skill_name,
      m.code_display AS csi_display,
      m.code AS csi_code,
      m.active,
      COUNT(child.id)::BIGINT AS child_count
    FROM data.masterformat m
    LEFT JOIN data.masterformat child ON child.parent_id = m.id AND child.active = true
    WHERE m.parent_id IS NULL  -- Only parent skills
      AND m.active = true
      AND m.name ILIKE '%' || p_query || '%'
      AND (p_taxonomy IS NULL OR p_taxonomy = 'csi')
    GROUP BY m.id, m.name, m.code_display, m.code, m.active
    
    UNION ALL
    
    -- Search core.skills (if taxonomy is 'core' or NULL)
    SELECT 
      s.id AS skill_id,
      s.name AS skill_name,
      NULL::TEXT AS csi_display,
      NULL::TEXT[] AS csi_code,
      s.active,
      COUNT(child.id)::BIGINT AS child_count
    FROM core.skills s
    LEFT JOIN core.skills child ON child.parent_id = s.id AND child.active = true
    WHERE s.parent_id IS NULL
      AND s.industry_id = p_industry_id
      AND s.active = true
      AND s.name ILIKE '%' || p_query || '%'
      AND (p_taxonomy IS NULL OR p_taxonomy = 'core')
    GROUP BY s.id, s.name, s.active
  )
  SELECT 
    cr.skill_id,
    cr.skill_name,
    cr.csi_display,
    cr.csi_code,
    cr.active,
    cr.child_count
  FROM combined_results cr
  ORDER BY 
    CASE 
      WHEN cr.skill_name ILIKE p_query || '%' THEN 1
      WHEN cr.skill_name ILIKE '% ' || p_query || '%' THEN 2
      ELSE 3
    END,
    cr.skill_name
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER, TEXT) IS 
  'Search for parent skills across both CSI (data.masterformat) and core.skills taxonomies. 
   When p_taxonomy is NULL, searches both. When set to ''csi'' or ''core'', searches only that taxonomy.
   CSI skills are industry-agnostic, while core.skills are filtered by industry_id.';

-- Grant execute permissions with new signature
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER, TEXT) TO anon;

COMMIT;

