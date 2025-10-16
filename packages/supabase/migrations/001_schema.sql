-- =========================================================
-- 001_schema.sql - Pure Database Schema
-- Tables, types, enums (NO foreign keys, NO RLS, NO indexes)
-- =========================================================

BEGIN;

-- =========================================================
-- SCHEMAS
-- =========================================================
CREATE SCHEMA IF NOT EXISTS private;
COMMENT ON SCHEMA private IS 'Private schema for sensitive user data (PII)';

GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis";  -- Must be in public schema for GEOGRAPHY type
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
-- CORE TABLES (PUBLIC SCHEMA)
-- =========================================================

-- Industries
CREATE TABLE public.industries (
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
CREATE TABLE public.users (
  id UUID PRIMARY KEY,  -- FK to auth.users(id) in 002_relations.sql
  username TEXT UNIQUE,
  slug TEXT UNIQUE,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  about TEXT,
  avatar_url TEXT,
  avatar_path TEXT,
  avatar_media_id UUID,
  open_to_work BOOLEAN DEFAULT false,
  years_of_experience INTEGER DEFAULT 0,
  industry_id UUID,  -- FK to industries(id) in 002_relations.sql
  skills_summary JSONB DEFAULT '{"skills":[],"primary_location":{},"travel_radius_miles":0}'::jsonb,
  tsv TSVECTOR,
  created_by_user_id UUID,  -- FK to users(id) - for tracking who created (used for admin tracking)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID,  -- FK to users(id) in 002_relations.sql
  name TEXT NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  industry_id UUID,  -- FK to industries(id) in 002_relations.sql
  logo_url TEXT,
  website TEXT,
  description TEXT,
  address JSONB,
  geo GEOGRAPHY(POINT, 4326),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,  -- FK in 002_relations.sql
  name TEXT NOT NULL,
  slug CITEXT UNIQUE,
  image_url TEXT,
  created_by UUID,  -- FK to users(id) in 002_relations.sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team Members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,  -- FK in 002_relations.sql
  user_id UUID NOT NULL,  -- FK in 002_relations.sql
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

-- Skills Taxonomy
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  industry_id UUID,  -- FK in 002_relations.sql
  parent_id UUID,  -- FK in 002_relations.sql (self-reference)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Skills
CREATE TABLE public.user_skills (
  user_id UUID NOT NULL,  -- FK in 002_relations.sql
  skill_id UUID NOT NULL,  -- FK in 002_relations.sql
  proficiency SMALLINT DEFAULT 0 CHECK (proficiency BETWEEN 0 AND 5),
  source TEXT DEFAULT 'self' CHECK (source IN ('self', 'assessed', 'verified')),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- Organization Skills
CREATE TABLE public.organization_skills (
  organization_id UUID NOT NULL,  -- FK in 002_relations.sql
  skill_id UUID NOT NULL,  -- FK in 002_relations.sql
  required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
  priority SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, skill_id)
);

-- Follows (polymorphic)
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_type TEXT NOT NULL CHECK (follower_type IN ('user', 'organization', 'team')),
  follower_id UUID NOT NULL,
  followee_type TEXT NOT NULL CHECK (followee_type IN ('user', 'organization', 'team', 'job')),
  followee_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_type, follower_id, followee_type, followee_id)
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,  -- FK in 002_relations.sql
  team_id UUID,  -- FK in 002_relations.sql
  created_by_user_id UUID,  -- FK to users(id) - tracks who created the job
  title TEXT NOT NULL,
  description TEXT,
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

-- Job Skills
CREATE TABLE public.job_skills (
  job_id UUID NOT NULL,  -- FK in 002_relations.sql
  skill_id UUID NOT NULL,  -- FK in 002_relations.sql
  required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_id, skill_id)
);

-- Job Certifications (junction table for job-certification relationship)
CREATE TABLE public.job_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,  -- FK to jobs(id) in 002_relations.sql
  certification_id UUID NOT NULL,  -- FK to certifications(id) in 002_relations.sql
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, certification_id)
);

-- Reviews (unified)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'review' CHECK (kind IN ('review', 'recommendation', 'endorsement', 'rating')),
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  author_user_id UUID NOT NULL,  -- FK in 002_relations.sql
  rating SMALLINT,
  headline TEXT,
  body TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, subject_type, subject_id, author_user_id)
);

-- Review Skill Ratings
CREATE TABLE public.review_skill_ratings (
  review_id UUID NOT NULL,  -- FK in 002_relations.sql
  skill_id UUID NOT NULL,  -- FK in 002_relations.sql
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, skill_id)
);

-- Review Aspects
CREATE TABLE public.review_aspects (
  review_id UUID NOT NULL,  -- FK in 002_relations.sql
  key TEXT NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, key)
);

-- =========================================================
-- PRIVATE SCHEMA TABLES (PII)
-- =========================================================

-- User Private Profile Data
-- Note: phone is stored in auth.users, not here
CREATE TABLE private.profile (
  user_id UUID PRIMARY KEY,  -- FK to users(id) in 002_relations.sql
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
CREATE TABLE private.preferences (
  user_id UUID PRIMARY KEY,  -- FK to users(id) in 002_relations.sql
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
CREATE TABLE private.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL,  -- FK in 002_relations.sql
  addressee_user_id UUID NOT NULL,  -- FK in 002_relations.sql
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requester_type TEXT DEFAULT 'peer' CHECK (requester_type IN ('peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor', 'other')),
  addressee_type TEXT DEFAULT 'peer' CHECK (addressee_type IN ('peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor', 'other')),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_user_id, addressee_user_id),
  CHECK (requester_user_id <> addressee_user_id)
);

-- Applications (sensitive application data)
CREATE TABLE private.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,  -- FK in 002_relations.sql
  user_id UUID NOT NULL,  -- FK in 002_relations.sql
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
CREATE TABLE private.application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,  -- FK in 002_relations.sql
  author_user_id UUID NOT NULL,  -- FK in 002_relations.sql
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Application Inquiries
CREATE TABLE private.application_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,  -- FK in 002_relations.sql
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'declined', 'expired', 'replaced')),
  terms JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invites (contains email addresses and tokens)
CREATE TABLE private.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_user_id UUID NOT NULL,  -- FK in 002_relations.sql
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
CREATE TABLE private.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT CHECK (scope IN ('platform', 'organization', 'team')) NOT NULL,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Assignments
CREATE TABLE private.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,  -- FK to private.roles in 002_relations.sql
  user_id UUID NOT NULL,  -- FK to public.users in 002_relations.sql
  scope_org_id UUID,  -- FK to public.organizations in 002_relations.sql
  scope_team_id UUID,  -- FK to public.teams in 002_relations.sql
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, user_id, scope_org_id, scope_team_id),
  CHECK (
    (scope_org_id IS NULL AND scope_team_id IS NULL)
    OR (scope_org_id IS NOT NULL AND scope_team_id IS NULL)
    OR (scope_org_id IS NULL AND scope_team_id IS NOT NULL)
  )
);

-- User Certifications (personal certification data - PII)
CREATE TABLE private.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to users(id) in 002_relations.sql
  certification_id UUID NOT NULL,  -- FK to certifications(id) in 002_relations.sql
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
CREATE TABLE private.user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to users(id) in 003_relations.sql
  university_id UUID,  -- FK to data.universities(id) in 003_relations.sql
  institution_name TEXT,  -- Free-form entry (used when university_id is null)
  degree_type TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
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
CREATE TABLE private.user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to users(id) in 002_relations.sql
  organization_id UUID,  -- Optional FK to public.organizations
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
