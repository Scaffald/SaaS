-- =========================================================
-- 081_create_universities_table.sql
-- Creates universities catalog table and updates user_education
-- =========================================================

BEGIN;

-- =========================================================
-- Create universities catalog table
-- =========================================================

CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  country text NOT NULL,
  alpha_two_code text NOT NULL,
  domains text[] DEFAULT array[]::text[],
  web_pages text[] DEFAULT array[]::text[],
  state_province text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================================
-- Add indexes for performance
-- =========================================================

-- Country filtering
CREATE INDEX IF NOT EXISTS universities_country_idx 
ON public.universities(country);

-- Slug lookup
CREATE INDEX IF NOT EXISTS universities_slug_idx 
ON public.universities(slug);

-- Name search (trigram for fuzzy search)
CREATE INDEX IF NOT EXISTS universities_name_trgm_idx 
ON public.universities USING gin(name gin_trgm_ops);

-- Active universities
CREATE INDEX IF NOT EXISTS universities_active_idx 
ON public.universities(is_active) WHERE is_active = true;

-- =========================================================
-- Update user_education table
-- =========================================================

-- Add university_id foreign key
ALTER TABLE public.user_education
ADD COLUMN IF NOT EXISTS university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL;

-- Create index for university lookups
CREATE INDEX IF NOT EXISTS user_education_university_id_idx 
ON public.user_education(university_id);

-- Make institution_name nullable (derived from catalog when university_id present)
ALTER TABLE public.user_education
ALTER COLUMN institution_name DROP NOT NULL;

-- Add constraint to ensure either university_id or institution_name is provided
ALTER TABLE public.user_education
DROP CONSTRAINT IF EXISTS user_education_id_or_name_check;

ALTER TABLE public.user_education
ADD CONSTRAINT user_education_id_or_name_check 
CHECK (
  (university_id IS NOT NULL) OR 
  (institution_name IS NOT NULL)
);

-- =========================================================
-- Create search function
-- =========================================================

CREATE OR REPLACE FUNCTION search_universities(
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
  FROM public.universities u
  WHERE u.is_active = true
    AND (p_country IS NULL OR u.country = p_country)
    AND u.name % p_query  -- Trigram similarity operator
  ORDER BY similarity DESC, u.name
  LIMIT p_limit;
END;
$$;

-- =========================================================
-- Create view for user education with university details
-- =========================================================

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
LEFT JOIN public.universities u ON u.id = ue.university_id;

-- =========================================================
-- Enable RLS on universities table
-- =========================================================

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Public read access for universities (catalog data)
CREATE POLICY "Universities are viewable by everyone"
  ON public.universities FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin write access (adjust based on your admin role logic)
CREATE POLICY "Admins can manage universities"
  ON public.universities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
        AND ra.scope_org_id IS NULL
    )
  );

-- =========================================================
-- Grant permissions
-- =========================================================

-- Public read access
GRANT SELECT ON public.universities TO anon, authenticated;

-- View access
GRANT SELECT ON public.v_user_education_with_details TO authenticated;

-- =========================================================
-- Add updated_at trigger
-- =========================================================

CREATE TRIGGER trg_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- Add comments for documentation
-- =========================================================

COMMENT ON TABLE public.universities IS
'Catalog of universities worldwide for standardized education entries';

COMMENT ON COLUMN public.universities.slug IS
'URL-friendly unique identifier generated from university name';

COMMENT ON COLUMN public.universities.domains IS
'Email domains associated with this university (e.g., ["stanford.edu", "alumni.stanford.edu"])';

COMMENT ON COLUMN public.universities.web_pages IS
'Official website URLs for this university';

COMMENT ON COLUMN public.user_education.university_id IS
'Foreign key to universities catalog. When present, institution_name is derived from the catalog.';

COMMIT;
