-- =========================================================
-- 001_schema.sql - Pure Database Schema
-- Tables, types, enums (NO foreign keys, NO RLS, NO indexes)
-- =========================================================

BEGIN;
-- =========================================================
-- SCHEMAS
-- =========================================================
-- Core schema for all application tables
CREATE SCHEMA IF NOT EXISTS core;
COMMENT ON SCHEMA core IS 'Core application schema - all application and private tables';
GRANT USAGE ON SCHEMA core TO authenticated, service_role, anon;
-- CMS schema for content management
CREATE SCHEMA IF NOT EXISTS cms;
COMMENT ON SCHEMA cms IS 'CMS content management schema for welcome slides and future CMS features';
GRANT USAGE ON SCHEMA cms TO authenticated, service_role, anon;
-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis";
-- Must be in public schema for GEOGRAPHY type
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;
-- =========================================================
-- CUSTOM TYPES (ENUMS)
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE public.application_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'interviewing',
  'offer_extended',
  'hired',
  'rejected',
  'withdrawn'
);
-- =========================================================
-- CORE SCHEMA TABLES
-- =========================================================

-- Industries
CREATE TABLE core.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Users (public profile data)
CREATE TABLE core.users (
  id UUID PRIMARY KEY,  -- FK to auth.users(id) in 003_relations.sql
  username TEXT UNIQUE,
  slug TEXT UNIQUE,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  about JSONB,  -- Rich text profile description in TipTap JSON format
  avatar_url TEXT,
  avatar_path TEXT,
  avatar_media_id UUID,
  open_to_work BOOLEAN DEFAULT false,
  years_of_experience INTEGER DEFAULT 0,
  industry_id UUID,  -- FK to core.industries(id) in 003_relations.sql
  skills_summary JSONB DEFAULT '{"skills":[],"primary_location":{},"travel_radius_miles":0}'::jsonb,
  tsv TSVECTOR,
  created_by_user_id UUID,  -- FK to core.users(id) - for tracking who created (used for admin tracking)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Organizations
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,  -- FK to core.users(id) in 003_relations.sql
  name TEXT NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  industry_id UUID,  -- FK to core.industries(id) in 003_relations.sql
  logo_url TEXT,
  website TEXT,
  description JSONB,  -- Rich text organization description in TipTap JSON format
  address JSONB,
  geo GEOGRAPHY(POINT, 4326),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Teams
CREATE TABLE core.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,  -- FK in 003_relations.sql
  name TEXT NOT NULL,
  slug CITEXT UNIQUE,
  image_url TEXT,
  created_by UUID,  -- FK to core.users(id) in 003_relations.sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Team Members
CREATE TABLE core.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,  -- FK in 003_relations.sql
  user_id UUID NOT NULL,  -- FK in 003_relations.sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);
-- Skills Taxonomy
CREATE TABLE core.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  industry_id UUID,  -- FK in 003_relations.sql
  parent_id UUID,  -- FK in 003_relations.sql (self-reference)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NOTE: User Skills, Organization Skills, and Job Skills are created as polymorphic tables in 002_data.sql

-- Follows (polymorphic)
CREATE TABLE core.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_type TEXT NOT NULL CHECK (follower_type IN ('user', 'organization', 'team')),
  follower_id UUID NOT NULL,
  followee_type TEXT NOT NULL CHECK (followee_type IN ('user', 'organization', 'team', 'job')),
  followee_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_type, follower_id, followee_type, followee_id)
);
-- Jobs
CREATE TABLE core.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,  -- FK in 003_relations.sql
  team_id UUID,  -- FK in 003_relations.sql
  created_by_user_id UUID,  -- FK to core.users(id) - tracks who created the job
  title TEXT NOT NULL,
  description JSONB,  -- Rich text job description in TipTap JSON format
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paused', 'closed')),
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temp', 'intern')),
  remote_option TEXT CHECK (remote_option IN ('on_site', 'hybrid', 'remote')),
  location TEXT,
  address JSONB,
  geo GEOGRAPHY(POINT, 4326),
  compensation JSONB,
  pay_range_min_cents INTEGER,
  pay_range_max_cents INTEGER,
  pay_range_type TEXT CHECK (pay_range_type IN ('hourly', 'salary', 'contract', 'project')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'members')),
  slug CITEXT UNIQUE,
  posted_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  position_level TEXT,
  min_reputation NUMERIC,
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Certifications (reference/catalog table for certifications)
CREATE TABLE core.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  issuing_organization TEXT,
  category TEXT CHECK (category IN ('safety', 'trade', 'equipment', 'license', 'management', 'other')),
  description TEXT,
  typical_duration_days INTEGER,
  requires_renewal BOOLEAN DEFAULT false,
  renewal_period_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Job Certifications (junction table for job-certification relationship)
CREATE TABLE core.job_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,  -- FK to core.jobs(id) in 003_relations.sql
  certification_id UUID NOT NULL,  -- FK to core.certifications(id) in 003_relations.sql
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, certification_id)
);
-- Reviews (unified)
CREATE TABLE core.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'review' CHECK (kind IN ('review', 'recommendation', 'endorsement', 'rating')),
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  author_user_id UUID NOT NULL,  -- FK in 003_relations.sql
  rating SMALLINT,
  headline TEXT,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, subject_type, subject_id, author_user_id)
);
-- Review Skill Ratings
CREATE TABLE core.review_skill_ratings (
  review_id UUID NOT NULL,  -- FK in 003_relations.sql
  skill_id UUID NOT NULL,  -- FK in 003_relations.sql
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, skill_id)
);
-- Review Aspects
CREATE TABLE core.review_aspects (
  review_id UUID NOT NULL,  -- FK in 003_relations.sql
  key TEXT NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, key)
);
-- =========================================================
-- EXTERNAL JOB FEEDS & AGGREGATION
-- =========================================================

-- External Job Feeds (RSS/API sources)
CREATE TABLE core.external_job_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  feed_type TEXT NOT NULL CHECK (feed_type IN ('rss', 'api')),
  parser_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  fetch_interval_hours INTEGER DEFAULT 3,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- External Jobs (cached external job listings)
CREATE TABLE core.external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL,  -- FK to core.external_job_feeds(id) in 003_relations.sql
  external_guid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  company_name TEXT,
  company_logo TEXT,
  company_website TEXT,
  company_headquarters TEXT,
  job_location TEXT,
  job_type TEXT,
  job_category TEXT,
  job_tags TEXT[],
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  compensation_min INTEGER,
  compensation_max INTEGER,
  compensation_currency TEXT DEFAULT 'USD',
  compensation_period TEXT,
  application_url TEXT,
  external_url TEXT,
  posted_date TIMESTAMPTZ,
  expires_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  content_hash TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feed_id, external_guid)
);
-- External Job Industries (industry mappings for external jobs)
CREATE TABLE core.external_job_industries (
  external_job_id UUID NOT NULL,  -- FK to core.external_jobs(id) in 003_relations.sql
  industry_id UUID NOT NULL,  -- FK to core.industries(id) in 003_relations.sql
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  mapped_by TEXT DEFAULT 'rule' CHECK (mapped_by IN ('rule', 'ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (external_job_id, industry_id)
);
-- External Job Skills (skill mappings for external jobs)
CREATE TABLE core.external_job_skills (
  external_job_id UUID NOT NULL,  -- FK to core.external_jobs(id) in 003_relations.sql
  skill_id UUID NOT NULL,  -- FK to core.skills(id) in 003_relations.sql
  required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extracted_by TEXT DEFAULT 'rule' CHECK (extracted_by IN ('rule', 'ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (external_job_id, skill_id)
);
-- =========================================================
-- REVIEW ENHANCEMENTS TABLES
-- =========================================================

-- Soft Skills Catalog
CREATE TABLE core.soft_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('reliability', 'collaboration', 'professionalism', 'technical')),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Review Category Ratings
CREATE TABLE core.review_category_ratings (
  review_id UUID NOT NULL,  -- FK to core.reviews(id) in 003_relations.sql
  category TEXT NOT NULL CHECK (category IN ('skills', 'reliability', 'collaboration', 'professionalism', 'technical')),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, category)
);
-- Review Soft Skill Votes (Strengths & Improvements)
CREATE TABLE core.review_soft_skill_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,  -- FK to core.reviews(id) in 003_relations.sql
  skill_id UUID NOT NULL,  -- FK to core.soft_skills(id) in 003_relations.sql
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_strength BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, skill_id, is_strength)
);
-- Seed Soft Skills Data
INSERT INTO core.soft_skills (name, slug, category, description, order_index) VALUES
  -- Reliability Skills
  ('Deadline Management', 'deadline-management', 'reliability', 'Consistently meets deadlines and commitments', 1),
  ('Prioritization', 'prioritization', 'reliability', 'Effectively prioritizes tasks and responsibilities', 2),
  ('Time Management', 'time-management', 'reliability', 'Manages time efficiently and effectively', 3),
  ('Task Delegation', 'task-delegation', 'reliability', 'Delegates tasks appropriately when needed', 4),
  ('Accountability', 'accountability', 'reliability', 'Takes responsibility for work and outcomes', 5),
  ('Consistency', 'consistency', 'reliability', 'Delivers consistent quality of work', 6),
  -- Collaboration Skills
  ('Communication', 'communication', 'collaboration', 'Communicates clearly and effectively', 1),
  ('Teamwork', 'teamwork', 'collaboration', 'Works well with others in team settings', 2),
  ('Active Listening', 'active-listening', 'collaboration', 'Listens attentively and responds thoughtfully', 3),
  ('Conflict Resolution', 'conflict-resolution', 'collaboration', 'Resolves disagreements constructively', 4),
  ('Empathy', 'empathy', 'collaboration', 'Shows understanding and consideration for others', 5),
  ('Cooperation', 'cooperation', 'collaboration', 'Cooperates willingly with team members', 6),
  ('Feedback Reception', 'feedback-reception', 'collaboration', 'Accepts and acts on feedback constructively', 7),
  -- Professionalism Skills
  ('Work Ethic', 'work-ethic', 'professionalism', 'Demonstrates strong dedication to work', 1),
  ('Adaptability', 'adaptability', 'professionalism', 'Adapts well to changing circumstances', 2),
  ('Problem Solving', 'problem-solving', 'professionalism', 'Effectively solves problems', 3),
  ('Initiative', 'initiative', 'professionalism', 'Takes initiative without being asked', 4),
  ('Professionalism', 'professionalism', 'professionalism', 'Maintains professional demeanor and standards', 5),
  ('Attention to Detail', 'attention-to-detail', 'professionalism', 'Pays close attention to details', 6),
  -- Technical Skills
  ('Technical Knowledge', 'technical-knowledge', 'technical', 'Demonstrates strong technical expertise', 1),
  ('Learning Ability', 'learning-ability', 'technical', 'Quickly learns new skills and technologies', 2),
  ('Innovation', 'innovation', 'technical', 'Brings innovative ideas and solutions', 3),
  ('Best Practices', 'best-practices', 'technical', 'Follows industry best practices', 4),
  ('Code Quality', 'code-quality', 'technical', 'Writes clean, maintainable code', 5),
  ('Documentation', 'documentation', 'technical', 'Creates clear and helpful documentation', 6)
ON CONFLICT (slug) DO NOTHING;
-- =========================================================
-- CORE SCHEMA PRIVATE TABLES (PII) - moved from private schema
-- =========================================================

-- User Private Profile Data
-- Note: phone is stored in auth.users, not here
CREATE TABLE core.profile (
  user_id UUID PRIMARY KEY,  -- FK to core.users(id) in 003_relations.sql
  first_name TEXT,
  last_name TEXT,
  address JSONB,
  geo GEOGRAPHY(POINT, 4326),
  contact_prefs TEXT[] DEFAULT ARRAY['email']::TEXT[],
  veteran BOOLEAN DEFAULT false,
  us_resident BOOLEAN DEFAULT false,
  us_passport BOOLEAN DEFAULT false,
  travel_mileage INTEGER DEFAULT 0,
  education_level TEXT,
  hourly_rate_cents INTEGER,
  location TEXT,
  open_to_travel BOOLEAN DEFAULT true,
  drivers_license_classes TEXT[] DEFAULT ARRAY[]::TEXT[],
  phone_os TEXT[] DEFAULT '{}'::TEXT[],
  availability TEXT[],
  certifications TEXT[],
  preferred_work_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  authorized_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  military_status TEXT[] DEFAULT ARRAY[]::TEXT[],
  travel_distance_miles INTEGER DEFAULT 25,
  career_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- User Preferences
CREATE TABLE core.preferences (
  user_id UUID PRIMARY KEY,  -- FK to core.users(id) in 003_relations.sql
  user_types TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  prerequisites_completed_at TIMESTAMPTZ,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  riasec_scores JSONB DEFAULT NULL,
  current_occupation_code TEXT,
  target_occupation_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  career_assessment_completed_at TIMESTAMPTZ,
  accepted_privacy_policy_at TIMESTAMPTZ,
  accepted_terms_of_service_at TIMESTAMPTZ,
  privacy_policy_version TEXT,
  terms_of_service_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Connections (social graph - sensitive)
CREATE TABLE core.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL,  -- FK in 003_relations.sql
  addressee_user_id UUID NOT NULL,  -- FK in 003_relations.sql
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requester_type TEXT DEFAULT 'peer' CHECK (requester_type IN ('peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor', 'other')),
  addressee_type TEXT DEFAULT 'peer' CHECK (addressee_type IN ('peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor', 'other')),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_user_id, addressee_user_id),
  CHECK (requester_user_id <> addressee_user_id)
);
-- Applications (sensitive application data)
CREATE TABLE core.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,  -- FK in 003_relations.sql
  user_id UUID NOT NULL,  -- FK in 003_relations.sql
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'screen', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  resume_url TEXT,
  cover_letter_url TEXT,
  answers JSONB,
  is_shortlisted BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  reject_reasons TEXT[],
  reject_meta JSONB,
  stage_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, user_id)
);
-- Application Messages
CREATE TABLE core.application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,  -- FK in 003_relations.sql
  author_user_id UUID NOT NULL,  -- FK in 003_relations.sql
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Application Inquiries
CREATE TABLE core.application_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,  -- FK in 003_relations.sql
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'declined', 'expired', 'replaced')),
  terms JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Invites (contains email addresses and tokens)
CREATE TABLE core.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_user_id UUID NOT NULL,  -- FK in 003_relations.sql
  target_type TEXT NOT NULL CHECK (target_type IN ('organization', 'team')),
  target_id UUID NOT NULL,
  invitee_email CITEXT NOT NULL,
  role_name TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'canceled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);
-- Roles (RBAC system)
CREATE TABLE core.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT CHECK (scope IN ('platform', 'organization', 'team')) NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Role Assignments
CREATE TABLE core.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,  -- FK to core.roles in 003_relations.sql
  user_id UUID NOT NULL,  -- FK to core.users in 003_relations.sql
  scope_org_id UUID,  -- FK to core.organizations in 003_relations.sql
  scope_team_id UUID,  -- FK to core.teams in 003_relations.sql
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, user_id, scope_org_id, scope_team_id),
  CHECK (
    (scope_org_id IS NULL AND scope_team_id IS NULL)
    OR (scope_org_id IS NOT NULL AND scope_team_id IS NULL)
    OR (scope_org_id IS NULL AND scope_team_id IS NOT NULL)
  )
);
-- User Certifications (personal certification data - PII)
CREATE TABLE core.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) in 003_relations.sql
  certification_id UUID NOT NULL,  -- FK to core.certifications(id) in 003_relations.sql
  issue_date DATE,
  expiration_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  certificate_file_path TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- User Education (educational background - PII)
CREATE TABLE core.user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) in 003_relations.sql
  university_id UUID,  -- FK to data.universities(id) in 003_relations.sql
  institution_name TEXT,  -- Free-form entry (used when university_id is null)
  degree_type TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description JSONB,  -- Rich text education description in TipTap JSON format
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either university_id OR institution_name is provided
  CONSTRAINT user_education_id_or_name_check 
  CHECK (
    (university_id IS NOT NULL) OR 
    (institution_name IS NOT NULL)
  )
);
-- User Experience (work experience history - PII)
CREATE TABLE core.user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) in 003_relations.sql
  organization_id UUID,  -- Optional FK to core.organizations
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description JSONB,  -- Rich text experience description in TipTap JSON format
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =========================================================
-- CMS SCHEMA TABLES
-- =========================================================

-- Welcome Slides
CREATE TABLE cms.welcome_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  background_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE cms.welcome_slides IS 'Welcome screen slides shown during onboarding';
COMMENT ON COLUMN cms.welcome_slides.icon_name IS 'Lucide icon name (e.g., UserSearch, Share2, Sprout)';
COMMENT ON COLUMN cms.welcome_slides.display_order IS 'Order in which slides are displayed';
-- Seed Welcome Slides Data
INSERT INTO cms.welcome_slides (title, description, icon_name, background_image_url, display_order) VALUES
  (
    'Discover',
    'Explore tailored content that matches your interests and goals.',
    'UserSearch',
    'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    1
  ),
  (
    'Connect',
    'Engage with experts and peers to grow your knowledge and network.',
    'Share2',
    'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    2
  ),
  (
    'Grow',
    'Track your progress and unlock new opportunities as you learn.',
    'Sprout',
    'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    3
  )
ON CONFLICT DO NOTHING;
COMMIT;
