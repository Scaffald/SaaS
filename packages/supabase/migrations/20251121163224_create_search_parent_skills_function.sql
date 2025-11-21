-- =========================================================
-- Create skill search and hierarchy functions
-- =========================================================
-- These functions provide search and hierarchy navigation for skills
-- within the core.skills taxonomy table.

BEGIN;

-- Search parent skills function
CREATE OR REPLACE FUNCTION public.search_parent_skills(
  p_query TEXT,
  p_industry_id UUID,
  p_limit INTEGER DEFAULT 20
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
SET search_path = core, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS skill_id,
    s.name AS skill_name,
    NULL::TEXT AS csi_display,  -- core.skills doesn't have CSI fields
    NULL::TEXT[] AS csi_code,    -- core.skills doesn't have CSI fields
    s.active,
    COUNT(child.id)::BIGINT AS child_count
  FROM core.skills s
  LEFT JOIN core.skills child ON child.parent_id = s.id AND child.active = true
  WHERE s.parent_id IS NULL  -- Only parent skills
    AND s.industry_id = p_industry_id
    AND s.active = true
    AND s.name ILIKE '%' || p_query || '%'
  GROUP BY s.id, s.name, s.active
  ORDER BY 
    CASE 
      WHEN s.name ILIKE p_query || '%' THEN 1
      WHEN s.name ILIKE '% ' || p_query || '%' THEN 2
      ELSE 3
    END,
    s.name
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.search_parent_skills IS 
  'Search for parent skills (skills without a parent) within a specific industry, matching against the skill name. Returns skill details including child count.';

-- Get skill children function (recursive hierarchy)
CREATE OR REPLACE FUNCTION public.get_skill_children(
  p_parent_id UUID
)
RETURNS TABLE (
  skill_id UUID,
  skill_name TEXT,
  csi_display TEXT,
  csi_code TEXT[],
  parent_id UUID,
  depth INTEGER,
  hierarchy_path TEXT,
  active BOOLEAN,
  leaf_node BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE skill_hierarchy AS (
    -- Start with direct children
    SELECT 
      s.id,
      s.name,
      s.parent_id,
      1::INTEGER AS depth,
      s.name::TEXT AS hierarchy_path,
      s.active
    FROM core.skills s
    WHERE s.parent_id = p_parent_id
      AND s.active = true
    
    UNION ALL
    
    -- Recursively get descendants
    SELECT 
      s.id,
      s.name,
      s.parent_id,
      sh.depth + 1,
      (sh.hierarchy_path || ' > ' || s.name)::TEXT,
      s.active
    FROM core.skills s
    JOIN skill_hierarchy sh ON sh.id = s.parent_id
    WHERE s.active = true
  )
  SELECT 
    sh.id AS skill_id,
    sh.name AS skill_name,
    NULL::TEXT AS csi_display,  -- core.skills doesn't have CSI fields
    NULL::TEXT[] AS csi_code,    -- core.skills doesn't have CSI fields
    sh.parent_id,
    sh.depth,
    sh.hierarchy_path,
    sh.active,
    NOT EXISTS (
      SELECT 1 FROM core.skills child 
      WHERE child.parent_id = sh.id AND child.active = true
    ) AS leaf_node
  FROM skill_hierarchy sh
  ORDER BY sh.depth, sh.name;
END;
$$;

COMMENT ON FUNCTION public.get_skill_children IS 
  'Get all children (direct and recursive) of a parent skill. Returns hierarchical structure with depth and path.';

-- Get skill details function
CREATE OR REPLACE FUNCTION public.get_skill_details(
  p_skill_id UUID
)
RETURNS TABLE (
  skill_id UUID,
  skill_name TEXT,
  csi_display TEXT,
  csi_code TEXT[],
  parent_id UUID,
  industry_id UUID,
  industry_name TEXT,
  hierarchy_path TEXT,
  hierarchy_ids UUID[],
  active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE skill_path AS (
    -- Start with the skill itself
    SELECT 
      s.id,
      s.name,
      s.parent_id,
      s.industry_id,
      s.active,
      s.created_at,
      1::INTEGER AS depth,
      ARRAY[s.id]::UUID[] AS path_ids,
      ARRAY[s.name]::TEXT[] AS path_names
    FROM core.skills s
    WHERE s.id = p_skill_id
    
    UNION ALL
    
    -- Get ancestors
    SELECT 
      s.id,
      s.name,
      s.parent_id,
      s.industry_id,
      s.active,
      s.created_at,
      sp.depth + 1,
      ARRAY[s.id] || sp.path_ids,
      ARRAY[s.name] || sp.path_names
    FROM core.skills s
    JOIN skill_path sp ON sp.parent_id = s.id
  ),
  skill_with_hierarchy AS (
    SELECT 
      sp.id,
      sp.name,
      sp.parent_id,
      sp.industry_id,
      sp.active,
      sp.created_at,
      ARRAY_TO_STRING(ARRAY_REVERSE(sp.path_names), ' > ') AS hierarchy_path,
      ARRAY_REVERSE(sp.path_ids) AS hierarchy_ids
    FROM skill_path sp
    WHERE sp.depth = (SELECT MAX(depth) FROM skill_path)
  )
  SELECT 
    swh.id AS skill_id,
    swh.name AS skill_name,
    NULL::TEXT AS csi_display,  -- core.skills doesn't have CSI fields
    NULL::TEXT[] AS csi_code,    -- core.skills doesn't have CSI fields
    swh.parent_id,
    swh.industry_id,
    i.name AS industry_name,
    swh.hierarchy_path,
    swh.hierarchy_ids,
    swh.active,
    swh.created_at
  FROM skill_with_hierarchy swh
  LEFT JOIN core.industries i ON i.id = swh.industry_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_skill_details IS 
  'Get detailed information about a skill including full hierarchy path and ancestor IDs.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_parent_skills(TEXT, UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_skill_children(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_skill_children(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_skill_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_skill_details(UUID) TO anon;

COMMIT;

