-- =========================================================
-- 087_create_polymorphic_skill_associations.sql
-- Polymorphic skill references supporting multiple taxonomies
-- =========================================================

BEGIN;

-- =========================================================
-- User Skills (Polymorphic)
-- =========================================================

-- Drop old table if exists
DROP TABLE IF EXISTS public.user_skills CASCADE;

CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID REFERENCES csi.masterformat(id) ON DELETE CASCADE,
  onet_occupation_id CHAR(10) REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE,
  
  -- Skill proficiency (0-5 scale, 0 = awareness, 5 = expert)
  proficiency_level SMALLINT DEFAULT 0 CHECK (proficiency_level BETWEEN 0 AND 5),
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  years_experience NUMERIC(4,1),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one taxonomy field is set
  CONSTRAINT user_skills_taxonomy_check CHECK (
    (skill_taxonomy = 'csi' AND csi_skill_id IS NOT NULL AND onet_occupation_id IS NULL) OR
    (skill_taxonomy = 'onet' AND onet_occupation_id IS NOT NULL AND csi_skill_id IS NULL)
  ),
  
  -- Prevent duplicate skills per user
  CONSTRAINT user_skills_unique UNIQUE (user_id, skill_taxonomy, csi_skill_id, onet_occupation_id)
);

CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_taxonomy ON public.user_skills(skill_taxonomy);
CREATE INDEX idx_user_skills_csi ON public.user_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX idx_user_skills_onet ON public.user_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- Job Skills (Polymorphic)
-- =========================================================

DROP TABLE IF EXISTS public.job_skills CASCADE;

CREATE TABLE public.job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID REFERENCES csi.masterformat(id) ON DELETE CASCADE,
  onet_occupation_id CHAR(10) REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE,
  
  -- Required level (0-5 scale)
  required_level SMALLINT DEFAULT 0 CHECK (required_level BETWEEN 0 AND 5),
  
  -- Priority
  is_required BOOLEAN DEFAULT false,
  priority_order INT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one taxonomy field is set
  CONSTRAINT job_skills_taxonomy_check CHECK (
    (skill_taxonomy = 'csi' AND csi_skill_id IS NOT NULL AND onet_occupation_id IS NULL) OR
    (skill_taxonomy = 'onet' AND onet_occupation_id IS NOT NULL AND csi_skill_id IS NULL)
  ),
  
  -- Prevent duplicate skills per job
  CONSTRAINT job_skills_unique UNIQUE (job_id, skill_taxonomy, csi_skill_id, onet_occupation_id)
);

CREATE INDEX idx_job_skills_job ON public.job_skills(job_id);
CREATE INDEX idx_job_skills_taxonomy ON public.job_skills(skill_taxonomy);
CREATE INDEX idx_job_skills_csi ON public.job_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX idx_job_skills_onet ON public.job_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- Organization Skills (Polymorphic)
-- =========================================================

DROP TABLE IF EXISTS public.organization_skills CASCADE;

CREATE TABLE public.organization_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID REFERENCES csi.masterformat(id) ON DELETE CASCADE,
  onet_occupation_id CHAR(10) REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE,
  
  -- Organization context
  is_core_competency BOOLEAN DEFAULT false,
  proficiency_level SMALLINT CHECK (proficiency_level BETWEEN 0 AND 5),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one taxonomy field is set
  CONSTRAINT org_skills_taxonomy_check CHECK (
    (skill_taxonomy = 'csi' AND csi_skill_id IS NOT NULL AND onet_occupation_id IS NULL) OR
    (skill_taxonomy = 'onet' AND onet_occupation_id IS NOT NULL AND csi_skill_id IS NULL)
  ),
  
  -- Prevent duplicate skills per organization
  CONSTRAINT org_skills_unique UNIQUE (organization_id, skill_taxonomy, csi_skill_id, onet_occupation_id)
);

CREATE INDEX idx_org_skills_org ON public.organization_skills(organization_id);
CREATE INDEX idx_org_skills_taxonomy ON public.organization_skills(skill_taxonomy);
CREATE INDEX idx_org_skills_csi ON public.organization_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX idx_org_skills_onet ON public.organization_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- Unified Skill Views
-- =========================================================

-- View: All available skills across taxonomies
CREATE OR REPLACE VIEW public.v_all_skills AS
SELECT 
  'csi' as taxonomy,
  id::text as skill_id,
  code_key as code,
  code_display as display_code,
  name,
  description,
  depth as hierarchy_level,
  parent_id::text as parent_ref,
  active
FROM csi.masterformat

UNION ALL

SELECT
  'onet' as taxonomy,
  onetsoc_code as skill_id,
  onetsoc_code as code,
  onetsoc_code as display_code,
  title as name,
  description,
  NULL as hierarchy_level,
  NULL as parent_ref,
  true as active
FROM onet.occupation_data;

-- View: User skills with details
CREATE OR REPLACE VIEW public.v_user_skills_detailed AS
SELECT 
  us.id,
  us.user_id,
  us.skill_taxonomy,
  us.proficiency_level,
  us.verified,
  us.years_experience,
  
  -- CSI details
  CASE WHEN us.skill_taxonomy = 'csi' THEN
    jsonb_build_object(
      'id', m.id,
      'code', m.code_key,
      'display', m.code_display,
      'name', m.name,
      'depth', m.depth
    )
  END as csi_skill,
  
  -- O*NET details
  CASE WHEN us.skill_taxonomy = 'onet' THEN
    jsonb_build_object(
      'id', od.onetsoc_code,
      'code', od.onetsoc_code,
      'name', od.title,
      'description', od.description
    )
  END as onet_skill
  
FROM public.user_skills us
LEFT JOIN csi.masterformat m ON us.csi_skill_id = m.id
LEFT JOIN onet.occupation_data od ON us.onet_occupation_id = od.onetsoc_code;

-- =========================================================
-- Helper Functions
-- =========================================================

-- Search across all taxonomies
CREATE OR REPLACE FUNCTION public.search_all_skills(
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
  SELECT 
    v.taxonomy,
    v.skill_id,
    v.code,
    v.display_code,
    v.name,
    CASE WHEN v.name ILIKE search_term || '%' THEN 1 ELSE 2 END as relevance
  FROM v_all_skills v
  WHERE (taxonomy_filter IS NULL OR v.taxonomy = taxonomy_filter)
    AND v.name ILIKE '%' || search_term || '%'
  ORDER BY relevance, v.name
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================================
-- RLS Policies
-- =========================================================

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_skills ENABLE ROW LEVEL SECURITY;

-- User skills: users can manage their own
CREATE POLICY user_skills_select ON public.user_skills
  FOR SELECT USING (true);

CREATE POLICY user_skills_insert ON public.user_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_skills_update ON public.user_skills
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_skills_delete ON public.user_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Job skills: public read, admin write
CREATE POLICY job_skills_select ON public.job_skills
  FOR SELECT USING (true);

-- Organization skills: public read, admin write  
CREATE POLICY org_skills_select ON public.organization_skills
  FOR SELECT USING (true);

COMMIT;
