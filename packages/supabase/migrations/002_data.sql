-- =========================================================
-- 003_data.sql - Data Schemas and Reference Data
-- O*NET + CSI/MasterFormat + Universities + Skill Associations
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: O*NET SCHEMA
-- =========================================================

-- Create dedicated schema for O*NET data
CREATE SCHEMA IF NOT EXISTS onet;

COMMENT ON SCHEMA onet IS 'O*NET 30.0 Database - Occupational Information Network (August 2025 release)';

-- Permissions for O*NET schema
GRANT USAGE ON SCHEMA onet TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA onet TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA onet TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT ALL ON SEQUENCES TO service_role;

GRANT USAGE ON SCHEMA onet TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA onet TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA onet GRANT SELECT ON TABLES TO authenticated, anon;

CREATE TABLE IF NOT EXISTS onet.scales_reference (
  scale_id VARCHAR(3) NOT NULL,
  scale_name VARCHAR(50) NOT NULL,
  minimum DECIMAL(1,0) NOT NULL,
  maximum DECIMAL(3,0) NOT NULL,
  PRIMARY KEY (scale_id));

CREATE TABLE IF NOT EXISTS onet.content_model_reference (
  element_id VARCHAR(20) NOT NULL,
  element_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (element_id));

CREATE TABLE IF NOT EXISTS onet.occupation_data (
  onetsoc_code CHAR(10) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (onetsoc_code));

CREATE TABLE IF NOT EXISTS onet.job_zone_reference (
  job_zone DECIMAL(1,0) NOT NULL,
  name VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  education TEXT NOT NULL,
  job_training TEXT NOT NULL,
  examples TEXT NOT NULL,
  svp_range VARCHAR(25) NOT NULL,
  PRIMARY KEY (job_zone));

CREATE TABLE IF NOT EXISTS onet.unspsc_reference (
  commodity_code DECIMAL(8,0) NOT NULL,
  commodity_title VARCHAR(150) NOT NULL,
  class_code DECIMAL(8,0) NOT NULL,
  class_title VARCHAR(150) NOT NULL,
  family_code DECIMAL(8,0) NOT NULL,
  family_title VARCHAR(150) NOT NULL,
  segment_code DECIMAL(8,0) NOT NULL,
  segment_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (commodity_code));

CREATE TABLE IF NOT EXISTS onet.occupation_level_metadata (
  onetsoc_code CHAR(10) NOT NULL,
  item VARCHAR(150) NOT NULL,
  response VARCHAR(75),
  n DECIMAL(4,0),
  percent DECIMAL(4,1),
  date_updated DATE NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));

CREATE TABLE IF NOT EXISTS onet.ete_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.level_scale_anchors (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  anchor_value DECIMAL(3,0) NOT NULL,
  anchor_description TEXT NOT NULL,
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.survey_booklet_locations (
  element_id VARCHAR(20) NOT NULL,
  survey_item_number VARCHAR(5) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.task_categories (
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (scale_id, category),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.work_context_categories (
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0) NOT NULL,
  category_description TEXT NOT NULL,
  PRIMARY KEY (element_id, scale_id, category),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.abilities (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.education_training_experience (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.ete_categories (element_id, scale_id, category));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.interests (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.job_zones (
  onetsoc_code CHAR(10) NOT NULL,
  job_zone DECIMAL(1,0) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (job_zone) REFERENCES onet.job_zone_reference (job_zone));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.knowledge (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.skills (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.task_statements (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  task TEXT NOT NULL,
  task_type VARCHAR(12),
  incumbents_responding DECIMAL(4,0),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  PRIMARY KEY (task_id),
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.task_ratings (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (task_id) REFERENCES onet.task_statements (task_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (scale_id, category) REFERENCES onet.task_categories (scale_id, category));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.work_activities (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.work_context (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  category DECIMAL(3,0),
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  not_relevant CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id),
  FOREIGN KEY (element_id, scale_id, category) REFERENCES onet.work_context_categories (element_id, scale_id, category));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.work_styles (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  n DECIMAL(4,0),
  standard_error DECIMAL(7,4),
  lower_ci_bound DECIMAL(7,4),
  upper_ci_bound DECIMAL(7,4),
  recommend_suppress CHAR(1),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.work_values (
  onetsoc_code CHAR(10) NOT NULL,
  element_id VARCHAR(20) NOT NULL,
  scale_id VARCHAR(3) NOT NULL,
  data_value DECIMAL(5,2) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (scale_id) REFERENCES onet.scales_reference (scale_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.iwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  iwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (iwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.dwa_reference (
  element_id VARCHAR(20) NOT NULL,
  iwa_id VARCHAR(20) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  dwa_title VARCHAR(150) NOT NULL,
  PRIMARY KEY (dwa_id),
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (iwa_id) REFERENCES onet.iwa_reference (iwa_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.tasks_to_dwas (
  onetsoc_code CHAR(10) NOT NULL,
  task_id DECIMAL(8,0) NOT NULL,
  dwa_id VARCHAR(20) NOT NULL,
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (task_id) REFERENCES onet.task_statements (task_id),
  FOREIGN KEY (dwa_id) REFERENCES onet.dwa_reference (dwa_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.emerging_tasks (
  onetsoc_code CHAR(10) NOT NULL,
  task TEXT NOT NULL,
  category VARCHAR(8) NOT NULL,
  original_task_id DECIMAL(8,0),
  date_updated DATE NOT NULL,
  domain_source VARCHAR(30) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (original_task_id) REFERENCES onet.task_statements (task_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.related_occupations (
  onetsoc_code CHAR(10) NOT NULL,
  related_onetsoc_code CHAR(10) NOT NULL,
  relatedness_tier VARCHAR(50) NOT NULL,
  related_index DECIMAL(3,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (related_onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)


-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.alternate_titles (
  onetsoc_code CHAR(10) NOT NULL,
  alternate_title VARCHAR(250) NOT NULL,
  short_title VARCHAR(150),
  sources VARCHAR(50) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.sample_of_reported_titles (
  onetsoc_code CHAR(10) NOT NULL,
  reported_job_title VARCHAR(150) NOT NULL,
  shown_in_my_next_move CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.technology_skills (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  hot_technology CHAR(1) NOT NULL,
  in_demand CHAR(1) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.tools_used (
  onetsoc_code CHAR(10) NOT NULL,
  example VARCHAR(150) NOT NULL,
  commodity_code DECIMAL(8,0) NOT NULL,
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code),
  FOREIGN KEY (commodity_code) REFERENCES onet.unspsc_reference (commodity_code));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.abilities_to_work_activities (
  abilities_element_id VARCHAR(20) NOT NULL,
  work_activities_element_id VARCHAR(20) NOT NULL,
  FOREIGN KEY (abilities_element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (work_activities_element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.abilities_to_work_context (
  abilities_element_id VARCHAR(20) NOT NULL,
  work_context_element_id VARCHAR(20) NOT NULL,
  FOREIGN KEY (abilities_element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (work_context_element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.skills_to_work_activities (
  skills_element_id VARCHAR(20) NOT NULL,
  work_activities_element_id VARCHAR(20) NOT NULL,
  FOREIGN KEY (skills_element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (work_activities_element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.skills_to_work_context (
  skills_element_id VARCHAR(20) NOT NULL,
  work_context_element_id VARCHAR(20) NOT NULL,
  FOREIGN KEY (skills_element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (work_context_element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.riasec_keywords (
  element_id VARCHAR(20) NOT NULL,
  keyword VARCHAR(150) NOT NULL,
  keyword_type VARCHAR(20) NOT NULL,
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.basic_interests_to_riasec (
  basic_interests_element_id VARCHAR(20) NOT NULL,
  riasec_element_id VARCHAR(20) NOT NULL,
  FOREIGN KEY (basic_interests_element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (riasec_element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.interests_illus_activities (
  element_id VARCHAR(20) NOT NULL,
  interest_type VARCHAR(20) NOT NULL,
  activity VARCHAR(150) NOT NULL,
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id));
-- COMMIT (handled at file level)
-- BEGIN (handled at file level)

-- =========================================================
-- ONET
-- =========================================================
-- BEGIN (handled at file level)
CREATE TABLE IF NOT EXISTS onet.interests_illus_occupations (
  element_id VARCHAR(20) NOT NULL,
  interest_type VARCHAR(20) NOT NULL,
  onetsoc_code CHAR(10) NOT NULL,
  FOREIGN KEY (element_id) REFERENCES onet.content_model_reference (element_id),
  FOREIGN KEY (onetsoc_code) REFERENCES onet.occupation_data (onetsoc_code));


-- =========================================================
-- SECTION 2: DATA SCHEMA (CSI + UNIVERSITIES)
-- =========================================================

-- Create data schema
CREATE SCHEMA IF NOT EXISTS data;

-- CSI MasterFormat Table
CREATE TABLE data.masterformat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code components (4-part hierarchy)
  code TEXT[4] NOT NULL,
  code_key TEXT UNIQUE NOT NULL,
  code_display TEXT NOT NULL,
  
  -- Naming
  name TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchy
  depth SMALLINT NOT NULL CHECK (depth BETWEEN 1 AND 4),
  parent_id UUID REFERENCES data.masterformat(id) ON DELETE CASCADE,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT csi_code_length CHECK (array_length(code, 1) = 4)
);

-- Universities Table
CREATE TABLE data.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  
  -- Location
  country TEXT NOT NULL,
  alpha_two_code TEXT,
  state_province TEXT,
  
  -- Online presence
  domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  web_pages TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certifications Catalog Table (hierarchical reference data)
CREATE TABLE data.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  parent_id UUID,  -- FK to certifications(id) in 002_relations.sql (self-reference)
  depth INTEGER NOT NULL DEFAULT 0,  -- 0=top level, 1=category, 2=certification
  hierarchy_path TEXT NOT NULL,       -- e.g., 'osha.construction.osha-10-construction'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SECTION 3: POLYMORPHIC SKILL ASSOCIATIONS
-- =========================================================
-- NOTE: These tables replace the simple skill associations from 001_schema.sql
-- They support multiple taxonomies (CSI, O*NET) polymorphically
-- =========================================================

-- Drop old simple tables if they exist (from 001_schema.sql)
DROP TABLE IF EXISTS core.user_skills CASCADE;
DROP TABLE IF EXISTS core.job_skills CASCADE;
DROP TABLE IF EXISTS core.organization_skills CASCADE;

-- User Skills (Polymorphic)
CREATE TABLE core.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID,  -- FK added after data.masterformat exists
  onet_occupation_id CHAR(10),  -- FK added after onet schema is imported
  
  -- Skill proficiency (0-5 scale)
  proficiency_level SMALLINT DEFAULT 0 CHECK (proficiency_level BETWEEN 0 AND 5),
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES core.users(id),
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

-- Add foreign keys for polymorphic references
ALTER TABLE core.user_skills
  ADD CONSTRAINT user_skills_csi_skill_id_fkey 
  FOREIGN KEY (csi_skill_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- Note: onet_occupation_id FK will be added after O*NET data import (in 004_functions.sql)

-- Job Skills (Polymorphic)
CREATE TABLE core.job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES core.jobs(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID,
  onet_occupation_id CHAR(10),
  
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

-- Add foreign keys
ALTER TABLE core.job_skills
  ADD CONSTRAINT job_skills_csi_skill_id_fkey 
  FOREIGN KEY (csi_skill_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- Organization Skills (Polymorphic)
CREATE TABLE core.organization_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic skill reference
  skill_taxonomy TEXT NOT NULL CHECK (skill_taxonomy IN ('csi', 'onet')),
  csi_skill_id UUID,
  onet_occupation_id CHAR(10),
  
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

-- Add foreign keys
ALTER TABLE core.organization_skills
  ADD CONSTRAINT org_skills_csi_skill_id_fkey 
  FOREIGN KEY (csi_skill_id) REFERENCES data.masterformat(id) ON DELETE CASCADE;

-- =========================================================
-- SECTION 4: PERMISSIONS
-- =========================================================

-- Data schema permissions
GRANT ALL ON SCHEMA data TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA data TO service_role;

GRANT USAGE ON SCHEMA data TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA data TO authenticated, anon;

-- =========================================================
-- SECTION 5: DEFAULT ROLES
-- =========================================================

-- Insert default platform roles
INSERT INTO core.roles (scope, name, description) VALUES
  ('platform', 'worker', 'Default role for all platform users'),
  ('platform', 'office', 'Office staff with administrative access')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- =========================================================
-- POST-COMMIT NOTES
-- =========================================================
-- 
-- IMPORTANT: After this migration, you must:
-- 
-- 1. Import O*NET data (migration 021_import_onet_full_data.sql)
--    This creates onet.occupation_data and related tables
-- 
-- 2. Import CSI/MasterFormat data
--    Run: packages/supabase/scripts/seed-csi.ts
-- 
-- 3. Import Universities data
--    Run: packages/supabase/scripts/seed-universities.ts
-- 
-- 4. Add O*NET foreign keys (done in 004_functions.sql):
--    ALTER TABLE public.user_skills
--      ADD CONSTRAINT user_skills_onet_occupation_id_fkey 
--      FOREIGN KEY (onet_occupation_id) 
--      REFERENCES onet.occupation_data(onetsoc_code) ON DELETE CASCADE;
-- 
-- =========================================================
