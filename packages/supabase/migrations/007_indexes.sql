-- =========================================================
-- 007_indexes.sql - Database Indexes
-- Performance indexes for core schema tables
-- =========================================================

BEGIN;

-- =========================================================
-- USER EDUCATION INDEXES
-- =========================================================

-- User lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_user_education_user_id 
  ON core.user_education(user_id);

-- Current education filter
CREATE INDEX IF NOT EXISTS idx_user_education_user_current 
  ON core.user_education(user_id, is_current) 
  WHERE is_current = true;

-- University lookup for joins
CREATE INDEX IF NOT EXISTS idx_user_education_university_id 
  ON core.user_education(university_id) 
  WHERE university_id IS NOT NULL;

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_user_education_dates
  ON core.user_education(user_id, start_date DESC, end_date DESC);

-- =========================================================
-- USER EXPERIENCE INDEXES
-- =========================================================

-- User lookup
CREATE INDEX IF NOT EXISTS idx_user_experience_user_id 
  ON core.user_experience(user_id);

-- Current experience filter
CREATE INDEX IF NOT EXISTS idx_user_experience_user_current 
  ON core.user_experience(user_id, is_current) 
  WHERE is_current = true;

-- Organization lookup for joins
CREATE INDEX IF NOT EXISTS idx_user_experience_organization_id 
  ON core.user_experience(organization_id) 
  WHERE organization_id IS NOT NULL;

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_user_experience_dates
  ON core.user_experience(user_id, start_date DESC, end_date DESC);

-- =========================================================
-- REVIEW ENHANCEMENTS INDEXES
-- =========================================================

-- Soft Skills indexes
CREATE INDEX IF NOT EXISTS idx_soft_skills_category 
  ON core.soft_skills(category) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_soft_skills_active 
  ON core.soft_skills(is_active);

-- Review Category Ratings indexes
CREATE INDEX IF NOT EXISTS idx_review_category_ratings_review_id 
  ON core.review_category_ratings(review_id);

-- Review Soft Skill Votes indexes
CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_review_id 
  ON core.review_soft_skill_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_skill_id 
  ON core.review_soft_skill_votes(skill_id);

CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_is_strength 
  ON core.review_soft_skill_votes(is_strength);

-- =========================================================
-- FULL-TEXT SEARCH INDEXES (Rich Text JSONB)
-- =========================================================

-- Users about field (rich text JSONB)
CREATE INDEX IF NOT EXISTS idx_users_about_search 
  ON core.users 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(about), '')));

-- Organizations description field (rich text JSONB)
CREATE INDEX IF NOT EXISTS idx_organizations_description_search 
  ON core.organizations 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(description), '')));

-- Jobs description field (rich text JSONB)
CREATE INDEX IF NOT EXISTS idx_jobs_description_search 
  ON core.jobs 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(description), '')));

-- User Experience description field (rich text JSONB)
CREATE INDEX IF NOT EXISTS idx_experience_description_search 
  ON core.user_experience 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(description), '')));

-- User Education description field (rich text JSONB)
CREATE INDEX IF NOT EXISTS idx_education_description_search 
  ON core.user_education 
  USING gin(to_tsvector('english', COALESCE(core.extract_tiptap_plain_text(description), '')));

-- =========================================================
-- CMS SCHEMA INDEXES
-- =========================================================

-- Welcome Slides indexes
CREATE INDEX IF NOT EXISTS idx_welcome_slides_display_order 
  ON cms.welcome_slides(display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_welcome_slides_active 
  ON cms.welcome_slides(is_active);

COMMIT;
