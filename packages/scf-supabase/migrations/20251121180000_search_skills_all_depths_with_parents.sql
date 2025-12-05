-- =========================================================
-- Update search_parent_skills to return all depth levels
-- and add helper function to get parent IDs
-- =========================================================
-- Updates search_parent_skills to return CSI skills at all depth levels
-- (not just top-level parents) and includes parent information.
-- Also adds a helper function to get all parent IDs for a skill.

BEGIN;

-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS public.search_parent_skills(TEXT, UUID, INTEGER, TEXT);

-- Helper function to get all parent IDs for a skill (recursive)
CREATE OR REPLACE FUNCTION public.get_skill_parent_ids(
  p_skill_id UUID
)
RETURNS UUID[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core, data, public
AS $$
DECLARE
  parent_ids UUID[] := ARRAY[]::UUID[];
  current_id UUID := p_skill_id;
  parent_id UUID;
BEGIN
  -- Try to find in CSI masterformat first
  LOOP
    SELECT m.parent_id INTO parent_id
    FROM data.masterformat m
    WHERE m.id = current_id AND m.parent_id IS NOT NULL;
    
    EXIT WHEN parent_id IS NULL;
    
    parent_ids := ARRAY[parent_id] || parent_ids;
    current_id := parent_id;
  END LOOP;
  
  -- If no parents found in CSI, try core.skills
  IF array_length(parent_ids, 1) IS NULL THEN
    current_id := p_skill_id;
    LOOP
      SELECT s.parent_id INTO parent_id
      FROM core.skills s
      WHERE s.id = current_id AND s.parent_id IS NOT NULL;
      
      EXIT WHEN parent_id IS NULL;
      
      parent_ids := ARRAY[parent_id] || parent_ids;
      current_id := parent_id;
    END LOOP;
  END IF;
  
  RETURN parent_ids;
END;
$$;

COMMENT ON FUNCTION public.get_skill_parent_ids IS 
  'Get all parent IDs for a skill recursively, working with both CSI (data.masterformat) and core.skills taxonomies. Returns array of parent IDs from immediate parent to root.';

-- Update search_parent_skills to return all depth levels for CSI skills
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
  child_count BIGINT,
  parent_id UUID,
  parent_name TEXT,
  depth INTEGER,
  hierarchy_path TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core, data, public
AS $$
BEGIN
  RETURN QUERY
  
  WITH combined_results AS (
    -- Search CSI skills from data.masterformat at ALL depth levels (if taxonomy is 'csi' or NULL)
    SELECT 
      m.id AS skill_id,
      m.name AS skill_name,
      m.code_display AS csi_display,
      m.code AS csi_code,
      m.active,
      COUNT(child.id)::BIGINT AS child_count,
      m.parent_id,
      parent.name AS parent_name,
      m.depth::INTEGER AS depth,
      CASE 
        WHEN m.parent_id IS NOT NULL THEN
          COALESCE(parent.name || ' > ' || m.name, m.name)
        ELSE m.name
      END AS hierarchy_path
    FROM data.masterformat m
    LEFT JOIN data.masterformat child ON child.parent_id = m.id AND child.active = true
    LEFT JOIN data.masterformat parent ON parent.id = m.parent_id
    WHERE m.active = true
      AND m.name ILIKE '%' || p_query || '%'
      AND (p_taxonomy IS NULL OR p_taxonomy = 'csi')
    GROUP BY m.id, m.name, m.code_display, m.code, m.active, m.parent_id, parent.name, m.depth
    
    UNION ALL
    
    -- Search core.skills (only top-level parents, as before)
    SELECT 
      s.id AS skill_id,
      s.name AS skill_name,
      NULL::TEXT AS csi_display,
      NULL::TEXT[] AS csi_code,
      s.active,
      COUNT(child.id)::BIGINT AS child_count,
      s.parent_id,
      parent.name AS parent_name,
      CASE 
        WHEN s.parent_id IS NULL THEN 0
        ELSE 1
      END::INTEGER AS depth,
      CASE 
        WHEN s.parent_id IS NOT NULL THEN
          COALESCE(parent.name || ' > ' || s.name, s.name)
        ELSE s.name
      END AS hierarchy_path
    FROM core.skills s
    LEFT JOIN core.skills child ON child.parent_id = s.id AND child.active = true
    LEFT JOIN core.skills parent ON parent.id = s.parent_id
    WHERE s.parent_id IS NULL  -- Only top-level for core.skills
      AND s.industry_id = p_industry_id
      AND s.active = true
      AND s.name ILIKE '%' || p_query || '%'
      AND (p_taxonomy IS NULL OR p_taxonomy = 'core')
    GROUP BY s.id, s.name, s.active, s.parent_id, parent.name
  )
  SELECT 
    cr.skill_id,
    cr.skill_name,
    cr.csi_display,
    cr.csi_code,
    cr.active,
    cr.child_count,
    cr.parent_id,
    cr.parent_name,
    cr.depth,
    cr.hierarchy_path
  FROM combined_results cr
  ORDER BY 
    cr.depth,  -- Show top-level first, then children
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
  'Search for skills across both CSI (data.masterformat) and core.skills taxonomies. 
   For CSI skills, returns skills at ALL depth levels (1-4) with parent information.
   For core.skills, returns only top-level parents (as before).
   When p_taxonomy is NULL, searches both. When set to ''csi'' or ''core'', searches only that taxonomy.
   CSI skills are industry-agnostic, while core.skills are filtered by industry_id.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_skill_parent_ids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_skill_parent_ids(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER, TEXT) TO anon;

COMMIT;

