-- =========================================================
-- 004_functions.sql - Stored Procedures and Helper Functions
-- All database functions and triggers
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: UTILITY FUNCTIONS (CORE SCHEMA)
-- =========================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION core.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION core.set_updated_at IS 'Automatically updates updated_at timestamp on row updates';

-- Plain text extraction function for rich text JSONB fields
CREATE OR REPLACE FUNCTION core.extract_tiptap_plain_text(content JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  node JSONB;
  text_node JSONB;
BEGIN
  IF content IS NULL OR content->'content' IS NULL THEN
    RETURN '';
  END IF;

  -- Iterate through content nodes
  FOR node IN SELECT * FROM jsonb_array_elements(content->'content')
  LOOP
    -- Handle paragraph nodes
    IF node->>'type' = 'paragraph' AND node->'content' IS NOT NULL THEN
      FOR text_node IN SELECT * FROM jsonb_array_elements(node->'content')
      LOOP
        IF text_node->>'type' = 'text' THEN
          result := result || COALESCE(text_node->>'text', '');
        END IF;
      END LOOP;
      result := result || E'\n';
    
    -- Handle list items
    ELSIF node->>'type' = 'bulletList' OR node->>'type' = 'orderedList' THEN
      result := result || core.extract_tiptap_plain_text(node) || E'\n';
    
    ELSIF node->>'type' = 'listItem' AND node->'content' IS NOT NULL THEN
      result := result || core.extract_tiptap_plain_text(node);
    
    -- Handle text nodes at root level
    ELSIF node->>'type' = 'text' THEN
      result := result || COALESCE(node->>'text', '');
    END IF;
  END LOOP;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION core.extract_tiptap_plain_text IS 'Extracts plain text from TipTap JSON for search indexing';

-- =========================================================
-- SECTION 2: USER MANAGEMENT FUNCTIONS
-- =========================================================

-- Handle new user creation
CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extract username from email
  username_base := split_part(NEW.email, '@', 1);
  final_username := username_base;
  
  -- Ensure unique username
  WHILE EXISTS (SELECT 1 FROM core.users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := username_base || counter;
  END LOOP;
  
  -- Create user record (core.users)
  INSERT INTO core.users (id, username, slug, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    final_username,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'name', final_username),
    NEW.created_at,
    NEW.updated_at
  );
  
  -- Create private profile record (PII)
  -- Note: email and phone are stored in auth.users, not core.profile
  INSERT INTO core.profile (
    user_id, 
    first_name, 
    last_name, 
    location,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'location',
    NEW.created_at,
    NEW.updated_at
  );
  
  -- Create preferences record
  INSERT INTO core.preferences (user_id, created_at, updated_at)
  VALUES (NEW.id, NEW.created_at, NEW.updated_at);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION core.handle_new_user IS 'Automatically creates user profile records when a new auth user is created';

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();

-- =========================================================
-- SECTION 2B: ROLE MANAGEMENT FUNCTIONS
-- =========================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION core.user_has_role(
  p_user_id UUID,
  p_role_name TEXT,
  p_org_id UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = core
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = p_user_id
      AND r.name = p_role_name
      AND (
        -- Platform scope (no org/team restriction)
        r.scope = 'platform'
        -- Or org scope matching the requested org
        OR (r.scope = 'organization' AND ra.scope_org_id = p_org_id)
        -- Or team scope
        OR (r.scope = 'team' AND ra.scope_team_id = p_org_id)
      )
  );
$$;

COMMENT ON FUNCTION core.user_has_role IS 'Check if a user has a specific role, with optional org/team scoping';

-- Auto-assign 'worker' role to new users
CREATE OR REPLACE FUNCTION core.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core
AS $$
BEGIN
  -- Assign the 'worker' role to new users
  INSERT INTO core.role_assignments (role_id, user_id)
  SELECT r.id, NEW.id
  FROM core.roles r
  WHERE r.name = 'worker'
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION core.assign_default_role IS 'Automatically assigns the worker role to new users';

-- Trigger to auto-assign worker role
DROP TRIGGER IF EXISTS assign_default_role_trigger ON core.users;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON core.users
  FOR EACH ROW
  EXECUTE FUNCTION core.assign_default_role();

-- =========================================================
-- SECTION 3: UPDATED_AT TRIGGERS
-- =========================================================

-- Users table
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Private profile
CREATE TRIGGER trg_profile_updated_at
  BEFORE UPDATE ON core.profile
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Preferences
CREATE TRIGGER trg_preferences_updated_at
  BEFORE UPDATE ON core.preferences
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Industries
CREATE TRIGGER trg_industries_updated_at
  BEFORE UPDATE ON core.industries
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Organizations
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Teams
CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON core.teams
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Jobs
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON core.jobs
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Skills
CREATE TRIGGER trg_skills_updated_at
  BEFORE UPDATE ON core.skills
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Reviews
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON core.reviews
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Soft Skills
CREATE TRIGGER trg_soft_skills_updated_at
  BEFORE UPDATE ON core.soft_skills
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- User Experience
CREATE TRIGGER trg_user_experience_updated_at
  BEFORE UPDATE ON core.user_experience
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- User Education
CREATE TRIGGER trg_user_education_updated_at
  BEFORE UPDATE ON core.user_education
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- User Certifications
CREATE TRIGGER trg_user_certifications_updated_at
  BEFORE UPDATE ON core.user_certifications
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Welcome Slides
CREATE TRIGGER trg_welcome_slides_updated_at
  BEFORE UPDATE ON cms.welcome_slides
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- SECTION 4: SEARCH/TSV FUNCTIONS
-- =========================================================

-- Organizations search TSV update
CREATE OR REPLACE FUNCTION core.organizations_tsv_update() 
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.slug::text,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(core.extract_tiptap_plain_text(NEW.description),'')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orgs_tsv
  BEFORE INSERT OR UPDATE OF name, slug, description
  ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION core.organizations_tsv_update();

-- Jobs search TSV update
CREATE OR REPLACE FUNCTION core.jobs_tsv_update() 
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(core.extract_tiptap_plain_text(NEW.description),'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.position_level,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.location,'')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_jobs_tsv
  BEFORE INSERT OR UPDATE OF title, description, position_level, location
  ON core.jobs
  FOR EACH ROW EXECUTE FUNCTION core.jobs_tsv_update();

-- =========================================================
-- SECTION 5: DATA SCHEMA FUNCTIONS (CSI/UNIVERSITIES)
-- =========================================================

-- Search MasterFormat by name or code
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
) AS $$
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION data.search_masterformat IS 'Search CSI MasterFormat codes by name or code';

-- Get full hierarchy path for a MasterFormat code
CREATE OR REPLACE FUNCTION data.get_masterformat_hierarchy(
  code_id UUID
)
RETURNS TABLE (
  level INT,
  id UUID,
  code_key TEXT,
  name TEXT
) AS $$
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
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION data.get_masterformat_hierarchy IS 'Get full hierarchy path for a MasterFormat code';

-- Search Universities by name
CREATE OR REPLACE FUNCTION data.search_universities(
  p_query TEXT,
  p_country TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS SETOF data.universities AS $$
BEGIN
  RETURN QUERY
  SELECT u.*
  FROM data.universities u
  WHERE u.name ILIKE '%' || p_query || '%'
    AND (p_country IS NULL OR u.country = p_country)
  ORDER BY 
    CASE 
      WHEN u.name ILIKE p_query || '%' THEN 1
      WHEN u.name ILIKE '% ' || p_query || '%' THEN 2
      ELSE 3
    END,
    u.name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION data.search_universities IS 'Search universities by name with optional country filter (case-insensitive)';

-- =========================================================
-- SECTION 6: O*NET FUNCTIONS (PLACEHOLDER)
-- =========================================================
-- Note: O*NET functions will be created after O*NET data import
-- These are defined in a separate migration after 021_import_onet_full_data.sql
-- This prevents errors when onet.occupation_data doesn't exist yet

-- =========================================================
-- SECTION 7: POLYMORPHIC SKILL FUNCTIONS
-- =========================================================

-- Unified skill search across all taxonomies
CREATE OR REPLACE FUNCTION core.search_all_skills(
  search_term TEXT,
  taxonomy_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  taxonomy TEXT,
  skill_id TEXT,
  code TEXT,
  display_code TEXT,
  name TEXT,
  relevance INT
) AS $$
BEGIN
  RETURN QUERY
  
  -- CSI Skills
  SELECT 
    'csi'::TEXT as taxonomy,
    m.id::TEXT as skill_id,
    m.code_key as code,
    m.code_display as display_code,
    m.name,
    CASE WHEN m.name ILIKE search_term || '%' THEN 1 ELSE 2 END as relevance
  FROM data.masterformat m
  WHERE (taxonomy_filter IS NULL OR taxonomy_filter = 'csi')
    AND m.active = true
    AND m.name ILIKE '%' || search_term || '%'
  
  UNION ALL
  
  -- O*NET Skills (will fail if O*NET data not imported yet)
  SELECT 
    'onet'::TEXT as taxonomy,
    od.onetsoc_code::TEXT as skill_id,
    od.onetsoc_code::TEXT as code,
    od.onetsoc_code::TEXT as display_code,
    od.title as name,
    CASE WHEN od.title ILIKE search_term || '%' THEN 1 ELSE 2 END as relevance
  FROM onet.occupation_data od
  WHERE (taxonomy_filter IS NULL OR taxonomy_filter = 'onet')
    AND od.title ILIKE '%' || search_term || '%'
  
  ORDER BY relevance, name
  LIMIT 100;
  
  EXCEPTION 
    WHEN undefined_table THEN
      -- If onet.occupation_data doesn't exist yet, just return CSI results
      RETURN QUERY
      SELECT 
        'csi'::TEXT as taxonomy,
        m.id::TEXT as skill_id,
        m.code_key as code,
        m.code_display as display_code,
        m.name,
        CASE WHEN m.name ILIKE search_term || '%' THEN 1 ELSE 2 END as relevance
      FROM data.masterformat m
      WHERE (taxonomy_filter IS NULL OR taxonomy_filter = 'csi')
        AND m.active = true
        AND m.name ILIKE '%' || search_term || '%'
      ORDER BY relevance, name
      LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION core.search_all_skills IS 'Search across all skill taxonomies (CSI and O*NET)';

-- =========================================================
-- SECTION 8: MAP DISPLAY FUNCTIONS
-- =========================================================

-- Privacy function: jitter coordinates for user privacy
CREATE OR REPLACE FUNCTION core.jitter_coordinate(
  coord double precision,
  max_offset_degrees double precision DEFAULT 0.03
)
RETURNS double precision
LANGUAGE sql
VOLATILE
AS $$
  -- Add random offset between -max_offset and +max_offset
  -- 0.03 degrees ≈ 3.3km at equator, ≈ 2.1km at 45° latitude
  -- This provides privacy while maintaining general area accuracy
  SELECT coord + (random() * 2 - 1) * max_offset_degrees;
$$;

COMMENT ON FUNCTION core.jitter_coordinate IS 
  'Adds random offset to coordinate for privacy. Default ±0.03° (≈2-3km depending on latitude).';

-- Get organizations with extracted coordinates for map display
CREATE OR REPLACE FUNCTION core.get_organizations_with_coords()
RETURNS TABLE (
  id uuid,
  name text,
  slug citext,
  longitude float8,
  latitude float8,
  address jsonb,
  industry_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, extensions, public
AS $$
  SELECT 
    o.id,
    o.name,
    o.slug,
    ST_X(o.geo::geometry) AS longitude,
    ST_Y(o.geo::geometry) AS latitude,
    o.address,
    i.name AS industry_name
  FROM core.organizations o
  LEFT JOIN core.industries i ON i.id = o.industry_id
  WHERE o.visibility = 'public'
    AND o.geo IS NOT NULL
  LIMIT 100;
$$;

COMMENT ON FUNCTION core.get_organizations_with_coords IS 
  'Returns public organizations with lat/lon coordinates for map display';

-- =========================================================
-- SECTION 9: PROFILE SEARCH VIEW
-- =========================================================

-- Profile search view with jittered coordinates for privacy
CREATE OR REPLACE VIEW core.v_profile_search AS
SELECT 
  u.id,
  u.display_name AS name,
  u.headline,
  u.bio,
  u.avatar_url,
  u.open_to_work,
  u.years_of_experience,
  u.skills_summary,
  i.name AS industry_name,
  pp.location,
  pp.hourly_rate_cents,
  pp.certifications,
  pp.availability,
  pp.travel_mileage,
  pp.open_to_travel,
  pp.education_level,
  -- Jittered coordinates for privacy (not exact location)
  core.jitter_coordinate(ST_X(pp.geo::public.geometry)) AS longitude,
  core.jitter_coordinate(ST_Y(pp.geo::public.geometry)) AS latitude,
  -- Gamified score calculation
  LEAST(
    COALESCE(u.years_of_experience, 0) * 3 + 
    COALESCE(jsonb_array_length(u.skills_summary->'skills'), 0) * 2 +
    CASE WHEN pp.open_to_travel THEN 10 ELSE 0 END +
    CASE WHEN u.open_to_work THEN 15 ELSE 0 END,
    100
  )::integer AS gamified_score,
  u.created_at,
  u.updated_at
FROM core.users u
LEFT JOIN core.profile pp ON pp.user_id = u.id
LEFT JOIN core.industries i ON i.id = u.industry_id
WHERE pp.geo IS NOT NULL;  -- Only include users with coordinates

COMMENT ON VIEW core.v_profile_search IS 
  'Public view for searching worker/talent profiles. Coordinates are jittered (±3km) for privacy. Excludes sensitive PII.';

-- =========================================================
-- SECTION 10: PERMISSIONS
-- =========================================================

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA core TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA data TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA data TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA onet TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA onet TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cms TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cms TO anon;

-- Grant access to views
GRANT SELECT ON core.v_profile_search TO authenticated, anon;

-- =========================================================
-- SECTION 11: CERTIFICATIONS - INDEXES AND TRIGGERS
-- =========================================================
-- Note: RLS policies are in 005_policies.sql

-- Indexes for certifications catalog (data schema)
CREATE INDEX IF NOT EXISTS certifications_parent_id_idx ON data.certifications(parent_id);
CREATE INDEX IF NOT EXISTS certifications_depth_active_idx ON data.certifications(depth, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS certifications_slug_idx ON data.certifications(slug);
CREATE INDEX IF NOT EXISTS certifications_hierarchy_path_idx ON data.certifications(hierarchy_path);
CREATE INDEX IF NOT EXISTS certifications_sort_order_idx ON data.certifications(parent_id, sort_order);

-- Indexes for user_certifications (core schema)
CREATE INDEX IF NOT EXISTS user_certifications_user_id_idx ON core.user_certifications(user_id);
CREATE INDEX IF NOT EXISTS user_certifications_certification_id_idx ON core.user_certifications(certification_id);
CREATE INDEX IF NOT EXISTS user_certifications_user_active_idx ON core.user_certifications(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS user_certifications_file_path_idx ON core.user_certifications(user_id, certificate_file_path) WHERE certificate_file_path IS NOT NULL;

-- Updated_at triggers
CREATE TRIGGER trg_certifications_updated_at
  BEFORE UPDATE ON data.certifications
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMIT;

-- =========================================================
-- POST-COMMIT NOTES
-- =========================================================
--
-- IMPORTANT: After O*NET data is imported, you should add
-- foreign key constraints for O*NET references:
--
-- ALTER TABLE core.user_skills
--   ADD CONSTRAINT user_skills_onet_occupation_id_fkey 
--   FOREIGN KEY (onet_occupation_id) 
--   REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
--
-- ALTER TABLE core.job_skills
--   ADD CONSTRAINT job_skills_onet_occupation_id_fkey 
--   FOREIGN KEY (onet_occupation_id) 
--   REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
--
-- ALTER TABLE core.organization_skills
--   ADD CONSTRAINT org_skills_onet_occupation_id_fkey 
--   FOREIGN KEY (onet_occupation_id) 
--   REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
--
-- =========================================================
