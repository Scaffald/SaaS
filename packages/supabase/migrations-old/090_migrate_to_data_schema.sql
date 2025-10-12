-- =========================================================
-- 090_migrate_to_data_schema.sql
-- Migrates masterformat (from csi schema) and universities (from public schema)
-- into a new consolidated data schema for reference/catalog data
-- =========================================================

BEGIN;

-- =========================================================
-- Create data schema
-- =========================================================

CREATE SCHEMA IF NOT EXISTS data;

COMMENT ON SCHEMA data IS 
'Reference and catalog data (universities, masterformat, etc.) - separated from application schema';

-- =========================================================
-- Move universities table from public to data schema
-- =========================================================

-- Move the table
ALTER TABLE public.universities SET SCHEMA data;

-- Recreate indexes (they follow the table automatically, but let's verify they exist)
CREATE INDEX IF NOT EXISTS universities_country_idx ON data.universities(country);
CREATE INDEX IF NOT EXISTS universities_slug_idx ON data.universities(slug);
CREATE INDEX IF NOT EXISTS universities_name_trgm_idx ON data.universities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS universities_active_idx ON data.universities(is_active) WHERE is_active = true;

-- =========================================================
-- Move masterformat table from csi to data schema
-- =========================================================

-- Move the table
ALTER TABLE csi.masterformat SET SCHEMA data;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS masterformat_code_key_idx ON data.masterformat(code_key);
CREATE INDEX IF NOT EXISTS masterformat_code_gin_idx ON data.masterformat USING GIN(code);
CREATE INDEX IF NOT EXISTS masterformat_parent_idx ON data.masterformat(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS masterformat_depth_idx ON data.masterformat(depth);
CREATE INDEX IF NOT EXISTS masterformat_active_idx ON data.masterformat(active) WHERE active = true;

-- Update self-referencing foreign key
ALTER TABLE data.masterformat 
  DROP CONSTRAINT IF EXISTS masterformat_parent_id_fkey;

ALTER TABLE data.masterformat
  ADD CONSTRAINT masterformat_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- =========================================================
-- Update foreign key references in other tables
-- =========================================================

-- Update user_education foreign key to universities
ALTER TABLE public.user_education
  DROP CONSTRAINT IF EXISTS user_education_university_id_fkey;

ALTER TABLE public.user_education
  ADD CONSTRAINT user_education_university_id_fkey
  FOREIGN KEY (university_id) REFERENCES data.universities(id) ON DELETE SET NULL;

-- Update user_skills foreign key to masterformat
ALTER TABLE public.user_skills
  DROP CONSTRAINT IF EXISTS user_skills_csi_skill_id_fkey;

ALTER TABLE public.user_skills
  ADD CONSTRAINT user_skills_csi_skill_id_fkey
  FOREIGN KEY (csi_skill_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- Update job_skills foreign key to masterformat
ALTER TABLE public.job_skills
  DROP CONSTRAINT IF EXISTS job_skills_csi_skill_id_fkey;

ALTER TABLE public.job_skills
  ADD CONSTRAINT job_skills_csi_skill_id_fkey
  FOREIGN KEY (csi_skill_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- =========================================================
-- Recreate university-related functions in data schema
-- =========================================================

-- Drop old function
DROP FUNCTION IF EXISTS public.search_universities(text, text, int);

-- Create new function in data schema using ILIKE for better matching
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
    -- Calculate similarity based on position of match
    CASE 
      WHEN u.name ILIKE p_query || '%' THEN 1.0  -- Starts with query
      WHEN u.name ILIKE '%' || p_query || '%' THEN 0.5  -- Contains query
      ELSE 0.0
    END::real as similarity
  FROM data.universities u
  WHERE u.is_active = true
    AND (p_country IS NULL OR u.country = p_country)
    AND u.name ILIKE '%' || p_query || '%'  -- Use ILIKE for case-insensitive search
  ORDER BY 
    -- Prioritize exact start matches, then any match
    CASE 
      WHEN u.name ILIKE p_query || '%' THEN 1
      ELSE 2
    END,
    u.name
  LIMIT p_limit;
END;
$$;

-- =========================================================
-- Recreate masterformat-related functions in data schema
-- =========================================================

-- Drop old functions from csi schema
DROP FUNCTION IF EXISTS csi.search_masterformat(text);
DROP FUNCTION IF EXISTS csi.get_hierarchy_path(uuid);

-- Create new search function in data schema
CREATE OR REPLACE FUNCTION data.search_masterformat(
  search_term TEXT
)
RETURNS TABLE (
  id UUID,
  code_key TEXT,
  code_display TEXT,
  name TEXT,
  depth SMALLINT,
  relevance NUMERIC
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.code_key,
    m.code_display,
    m.name,
    m.depth,
    CASE 
      WHEN m.name ILIKE search_term || '%' THEN 1.0
      WHEN m.name ILIKE '%' || search_term || '%' THEN 0.5
      WHEN m.code_display ILIKE search_term || '%' THEN 0.8
      ELSE 0.3
    END as relevance
  FROM data.masterformat m
  WHERE m.active = true
    AND (
      m.name ILIKE '%' || search_term || '%'
      OR m.code_display ILIKE '%' || search_term || '%'
      OR m.code_key ILIKE '%' || search_term || '%'
    )
  ORDER BY relevance DESC, m.name;
END;
$$;

-- Create new hierarchy path function in data schema
CREATE OR REPLACE FUNCTION data.get_hierarchy_path(
  code_id UUID
)
RETURNS TABLE (
  level INT,
  id UUID,
  code_key TEXT,
  name TEXT
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarchy AS (
    SELECT 
      1 as level,
      m.id,
      m.code_key,
      m.name,
      m.parent_id
    FROM data.masterformat m
    WHERE m.id = code_id
    
    UNION ALL
    
    SELECT 
      h.level + 1,
      m.id,
      m.code_key,
      m.name,
      m.parent_id
    FROM data.masterformat m
    JOIN hierarchy h ON h.parent_id = m.id
  )
  SELECT level, hierarchy.id, hierarchy.code_key, hierarchy.name
  FROM hierarchy
  ORDER BY level DESC;
END;
$$;

-- =========================================================
-- Recreate views with updated schema references
-- =========================================================

-- Drop old view
DROP VIEW IF EXISTS public.v_user_education_with_details;

-- Create new view with data schema reference
CREATE OR REPLACE VIEW public.v_user_education_with_details AS
SELECT
  ue.id,
  ue.user_id,
  ue.university_id,
  -- Use catalog data if available, otherwise use user-provided data
  COALESCE(u.name, ue.institution_name) as institution_name,
  u.country,
  u.alpha_two_code,
  u.domains,
  u.web_pages,
  u.slug as university_slug,
  ue.degree_type,
  ue.field_of_study,
  ue.start_date,
  ue.end_date,
  ue.is_current,
  ue.gpa,
  ue.honors,
  ue.activities,
  ue.description,
  ue.location,
  ue.is_verified,
  ue.created_at,
  ue.updated_at,
  -- Flag to indicate if this is from catalog or free-form
  (ue.university_id IS NOT NULL) as is_from_catalog
FROM public.user_education ue
LEFT JOIN data.universities u ON u.id = ue.university_id;

-- =========================================================
-- Update RLS policies with new schema references
-- =========================================================

-- Universities policies (already on the table, they moved with it)
-- Just verify they exist and are correct

-- Ensure RLS is enabled
ALTER TABLE data.universities ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Universities are viewable by everyone" ON data.universities;
DROP POLICY IF EXISTS "Admins can manage universities" ON data.universities;

-- Recreate policies
CREATE POLICY "Universities are viewable by everyone"
  ON data.universities FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage universities"
  ON data.universities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
        AND ra.scope_org_id IS NULL
    )
  );

-- Masterformat doesn't need RLS (read-only reference data)
-- But we'll enable it for consistency and add a simple policy

ALTER TABLE data.masterformat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masterformat is viewable by everyone" ON data.masterformat;

CREATE POLICY "Masterformat is viewable by everyone"
  ON data.masterformat FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- =========================================================
-- Update permissions and grants
-- =========================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA data TO anon, authenticated, service_role;

-- Grant table permissions for universities
GRANT SELECT ON data.universities TO anon, authenticated;
GRANT ALL ON data.universities TO service_role;

-- Grant table permissions for masterformat
GRANT SELECT ON data.masterformat TO anon, authenticated;
GRANT ALL ON data.masterformat TO service_role;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION data.search_universities(text, text, int) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION data.search_masterformat(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION data.get_hierarchy_path(uuid) TO anon, authenticated, service_role;

-- Grant view permissions
GRANT SELECT ON public.v_user_education_with_details TO authenticated;

-- =========================================================
-- Update table comments with new schema information
-- =========================================================

COMMENT ON TABLE data.universities IS
'Catalog of universities worldwide for standardized education entries (moved from public schema)';

COMMENT ON TABLE data.masterformat IS
'CSI MasterFormat construction specifications (moved from csi schema)';

-- =========================================================
-- Drop old csi schema completely
-- =========================================================

DROP SCHEMA IF EXISTS csi CASCADE;

COMMENT ON SCHEMA data IS 
'Reference and catalog data (universities, masterformat, etc.) - No backward compatibility views, use data schema directly';

-- =========================================================
-- Final verification
-- =========================================================

-- Verify tables exist in data schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'data' AND tablename = 'universities') THEN
    RAISE EXCEPTION 'Migration failed: universities table not found in data schema';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'data' AND tablename = 'masterformat') THEN
    RAISE EXCEPTION 'Migration failed: masterformat table not found in data schema';
  END IF;
  
  RAISE NOTICE 'Migration successful: Both tables moved to data schema';
END $$;

COMMIT;
