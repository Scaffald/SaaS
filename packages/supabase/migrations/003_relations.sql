-- =========================================================
-- 002_relations.sql - Foreign Key Relationships
-- All foreign key constraints and cascading rules
-- =========================================================

BEGIN;

-- =========================================================
-- PUBLIC SCHEMA - User & Core Tables
-- =========================================================

-- Users table
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.users
  ADD CONSTRAINT users_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE SET NULL;

-- =========================================================
-- PUBLIC SCHEMA - Organizations & Teams
-- =========================================================

-- Organizations
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_owner_user_id_fkey 
  FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE SET NULL;

-- Teams
ALTER TABLE public.teams
  ADD CONSTRAINT teams_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Team Members
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =========================================================
-- PUBLIC SCHEMA - Skills
-- =========================================================

-- Skills (self-referencing parent_id)
ALTER TABLE public.skills
  ADD CONSTRAINT skills_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES public.industries(id) ON DELETE SET NULL;

ALTER TABLE public.skills
  ADD CONSTRAINT skills_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES public.skills(id) ON DELETE SET NULL;

-- NOTE: Polymorphic skill tables (user_skills, job_skills, organization_skills)
-- have their foreign keys defined in 002_data.sql where they're created

-- =========================================================
-- PUBLIC SCHEMA - Jobs
-- =========================================================

-- Jobs
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_created_by_user_id_fkey 
  FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Job Certifications
ALTER TABLE public.job_certifications
  ADD CONSTRAINT job_certifications_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.job_certifications
  ADD CONSTRAINT job_certifications_certification_id_fkey 
  FOREIGN KEY (certification_id) REFERENCES data.certifications(id) ON DELETE CASCADE;

-- NOTE: job_skills table has its foreign keys defined in 002_data.sql (polymorphic)

-- =========================================================
-- PUBLIC SCHEMA - Reviews
-- =========================================================

-- Reviews
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_author_user_id_fkey 
  FOREIGN KEY (author_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Review Skill Ratings
ALTER TABLE public.review_skill_ratings
  ADD CONSTRAINT review_skill_ratings_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

ALTER TABLE public.review_skill_ratings
  ADD CONSTRAINT review_skill_ratings_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;

-- Review Aspects
ALTER TABLE public.review_aspects
  ADD CONSTRAINT review_aspects_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

-- =========================================================
-- PRIVATE SCHEMA - User Data
-- =========================================================

-- Private Profile
ALTER TABLE private.profile
  ADD CONSTRAINT profile_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Preferences
ALTER TABLE private.preferences
  ADD CONSTRAINT preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Connections
ALTER TABLE private.connections
  ADD CONSTRAINT connections_requester_user_id_fkey 
  FOREIGN KEY (requester_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE private.connections
  ADD CONSTRAINT connections_addressee_user_id_fkey 
  FOREIGN KEY (addressee_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =========================================================
-- PRIVATE SCHEMA - Applications
-- =========================================================

-- Applications
ALTER TABLE private.applications
  ADD CONSTRAINT applications_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE private.applications
  ADD CONSTRAINT applications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Application Messages
ALTER TABLE private.application_messages
  ADD CONSTRAINT application_messages_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES private.applications(id) ON DELETE CASCADE;

ALTER TABLE private.application_messages
  ADD CONSTRAINT application_messages_author_user_id_fkey 
  FOREIGN KEY (author_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Application Inquiries
ALTER TABLE private.application_inquiries
  ADD CONSTRAINT application_inquiries_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES private.applications(id) ON DELETE CASCADE;

-- =========================================================
-- PRIVATE SCHEMA - Invites
-- =========================================================

-- Invites
ALTER TABLE private.invites
  ADD CONSTRAINT invites_issuer_user_id_fkey 
  FOREIGN KEY (issuer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =========================================================
-- PRIVATE SCHEMA - Role Management
-- =========================================================

-- Role Assignments
ALTER TABLE private.role_assignments
  ADD CONSTRAINT role_assignments_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES private.roles(id) ON DELETE CASCADE;

ALTER TABLE private.role_assignments
  ADD CONSTRAINT role_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE private.role_assignments
  ADD CONSTRAINT role_assignments_scope_org_id_fkey
  FOREIGN KEY (scope_org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE private.role_assignments
  ADD CONSTRAINT role_assignments_scope_team_id_fkey
  FOREIGN KEY (scope_team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- =========================================================
-- CERTIFICATIONS (data schema)
-- =========================================================

-- Certifications (self-referencing parent_id in data schema)
ALTER TABLE data.certifications
  ADD CONSTRAINT certifications_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES data.certifications(id) ON DELETE CASCADE;

-- User Certifications (references data.certifications)
ALTER TABLE private.user_certifications
  ADD CONSTRAINT user_certifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE private.user_certifications
  ADD CONSTRAINT user_certifications_certification_id_fkey
  FOREIGN KEY (certification_id) REFERENCES data.certifications(id) ON DELETE CASCADE;

-- =========================================================
-- EDUCATION (private schema, references data.universities)
-- =========================================================

-- User Education FK
ALTER TABLE private.user_education
  ADD CONSTRAINT user_education_user_id_fkey
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

ALTER TABLE private.user_education
  ADD CONSTRAINT user_education_university_id_fkey
  FOREIGN KEY (university_id) 
  REFERENCES data.universities(id) 
  ON DELETE SET NULL;

-- =========================================================
-- EXPERIENCE (private schema, references public.organizations)
-- =========================================================

-- User Experience FK
ALTER TABLE private.user_experience
  ADD CONSTRAINT user_experience_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

ALTER TABLE private.user_experience
  ADD CONSTRAINT user_experience_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMIT;
