-- =========================================================
-- 003_relations.sql - Foreign Key Relationships
-- All foreign key constraints and cascading rules
-- =========================================================

BEGIN;
-- =========================================================
-- CORE SCHEMA - User & Core Tables
-- =========================================================

-- Users table
ALTER TABLE core.users
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE core.users
  ADD CONSTRAINT users_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES core.industries(id) ON DELETE SET NULL;
-- =========================================================
-- CORE SCHEMA - Organizations & Teams
-- =========================================================

-- Organizations
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_owner_user_id_fkey 
  FOREIGN KEY (owner_user_id) REFERENCES core.users(id) ON DELETE SET NULL;
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES core.industries(id) ON DELETE SET NULL;
-- Teams
ALTER TABLE core.teams
  ADD CONSTRAINT teams_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES core.organizations(id) ON DELETE CASCADE;
ALTER TABLE core.teams
  ADD CONSTRAINT teams_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES core.users(id) ON DELETE SET NULL;
-- Team Members
ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES core.teams(id) ON DELETE CASCADE;
ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Skills
-- =========================================================

-- Skills (self-referencing parent_id)
ALTER TABLE core.skills
  ADD CONSTRAINT skills_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES core.industries(id) ON DELETE SET NULL;
ALTER TABLE core.skills
  ADD CONSTRAINT skills_parent_id_fkey 
  FOREIGN KEY (parent_id) REFERENCES core.skills(id) ON DELETE SET NULL;
-- NOTE: Polymorphic skill tables (user_skills, job_skills, organization_skills)
-- have their foreign keys defined in 002_data.sql where they're created

-- =========================================================
-- CORE SCHEMA - Jobs
-- =========================================================

-- Jobs
ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES core.organizations(id) ON DELETE CASCADE;
ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES core.teams(id) ON DELETE SET NULL;
ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_created_by_user_id_fkey 
  FOREIGN KEY (created_by_user_id) REFERENCES core.users(id) ON DELETE SET NULL;
-- Job Certifications
ALTER TABLE core.job_certifications
  ADD CONSTRAINT job_certifications_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;
ALTER TABLE core.job_certifications
  ADD CONSTRAINT job_certifications_certification_id_fkey 
  FOREIGN KEY (certification_id) REFERENCES core.certifications(id) ON DELETE CASCADE;
-- NOTE: job_skills table has its foreign keys defined in 002_data.sql (polymorphic)

-- =========================================================
-- CORE SCHEMA - External Jobs
-- =========================================================

-- External Jobs
ALTER TABLE core.external_jobs
  ADD CONSTRAINT external_jobs_feed_id_fkey 
  FOREIGN KEY (feed_id) REFERENCES core.external_job_feeds(id) ON DELETE CASCADE;
-- External Job Industries
ALTER TABLE core.external_job_industries
  ADD CONSTRAINT external_job_industries_external_job_id_fkey 
  FOREIGN KEY (external_job_id) REFERENCES core.external_jobs(id) ON DELETE CASCADE;
ALTER TABLE core.external_job_industries
  ADD CONSTRAINT external_job_industries_industry_id_fkey 
  FOREIGN KEY (industry_id) REFERENCES core.industries(id) ON DELETE CASCADE;
-- External Job Skills
ALTER TABLE core.external_job_skills
  ADD CONSTRAINT external_job_skills_external_job_id_fkey 
  FOREIGN KEY (external_job_id) REFERENCES core.external_jobs(id) ON DELETE CASCADE;
ALTER TABLE core.external_job_skills
  ADD CONSTRAINT external_job_skills_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES core.skills(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Reviews
-- =========================================================

-- Reviews
ALTER TABLE core.reviews
  ADD CONSTRAINT reviews_author_user_id_fkey 
  FOREIGN KEY (author_user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Review Skill Ratings
ALTER TABLE core.review_skill_ratings
  ADD CONSTRAINT review_skill_ratings_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES core.reviews(id) ON DELETE CASCADE;
ALTER TABLE core.review_skill_ratings
  ADD CONSTRAINT review_skill_ratings_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES core.skills(id) ON DELETE CASCADE;
-- Review Aspects
ALTER TABLE core.review_aspects
  ADD CONSTRAINT review_aspects_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES core.reviews(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Review Enhancements
-- =========================================================

-- Review Category Ratings
ALTER TABLE core.review_category_ratings
  ADD CONSTRAINT review_category_ratings_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES core.reviews(id) ON DELETE CASCADE;
-- Review Soft Skill Votes
ALTER TABLE core.review_soft_skill_votes
  ADD CONSTRAINT review_soft_skill_votes_review_id_fkey 
  FOREIGN KEY (review_id) REFERENCES core.reviews(id) ON DELETE CASCADE;
ALTER TABLE core.review_soft_skill_votes
  ADD CONSTRAINT review_soft_skill_votes_skill_id_fkey 
  FOREIGN KEY (skill_id) REFERENCES core.soft_skills(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Private Tables (PII)
-- =========================================================

-- Private Profile
ALTER TABLE core.profile
  ADD CONSTRAINT profile_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Preferences
ALTER TABLE core.preferences
  ADD CONSTRAINT preferences_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Connections
ALTER TABLE core.connections
  ADD CONSTRAINT connections_requester_user_id_fkey 
  FOREIGN KEY (requester_user_id) REFERENCES core.users(id) ON DELETE CASCADE;
ALTER TABLE core.connections
  ADD CONSTRAINT connections_addressee_user_id_fkey 
  FOREIGN KEY (addressee_user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Applications
-- =========================================================

-- Applications
ALTER TABLE core.applications
  ADD CONSTRAINT applications_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE CASCADE;
ALTER TABLE core.applications
  ADD CONSTRAINT applications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Application Messages
ALTER TABLE core.application_messages
  ADD CONSTRAINT application_messages_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES core.applications(id) ON DELETE CASCADE;
ALTER TABLE core.application_messages
  ADD CONSTRAINT application_messages_author_user_id_fkey 
  FOREIGN KEY (author_user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Application Inquiries
ALTER TABLE core.application_inquiries
  ADD CONSTRAINT application_inquiries_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES core.applications(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Invites
-- =========================================================

-- Invites
ALTER TABLE core.invites
  ADD CONSTRAINT invites_issuer_user_id_fkey 
  FOREIGN KEY (issuer_user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Role Management
-- =========================================================

-- Role Assignments
ALTER TABLE core.role_assignments
  ADD CONSTRAINT role_assignments_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES core.roles(id) ON DELETE CASCADE;
ALTER TABLE core.role_assignments
  ADD CONSTRAINT role_assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
ALTER TABLE core.role_assignments
  ADD CONSTRAINT role_assignments_scope_org_id_fkey
  FOREIGN KEY (scope_org_id) REFERENCES core.organizations(id) ON DELETE CASCADE;
ALTER TABLE core.role_assignments
  ADD CONSTRAINT role_assignments_scope_team_id_fkey
  FOREIGN KEY (scope_team_id) REFERENCES core.teams(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Certifications
-- =========================================================

-- User Certifications (references core.certifications)
ALTER TABLE core.user_certifications
  ADD CONSTRAINT user_certifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
ALTER TABLE core.user_certifications
  ADD CONSTRAINT user_certifications_certification_id_fkey
  FOREIGN KEY (certification_id) REFERENCES core.certifications(id) ON DELETE CASCADE;
-- =========================================================
-- CORE SCHEMA - Education (references data.universities)
-- =========================================================

-- User Education FK
ALTER TABLE core.user_education
  ADD CONSTRAINT user_education_user_id_fkey
  FOREIGN KEY (user_id) 
  REFERENCES core.users(id) 
  ON DELETE CASCADE;
ALTER TABLE core.user_education
  ADD CONSTRAINT user_education_university_id_fkey
  FOREIGN KEY (university_id) 
  REFERENCES data.universities(id) 
  ON DELETE SET NULL;
-- =========================================================
-- CORE SCHEMA - Experience (references core.organizations)
-- =========================================================

-- User Experience FK
ALTER TABLE core.user_experience
  ADD CONSTRAINT user_experience_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES core.users(id)
  ON DELETE CASCADE;
ALTER TABLE core.user_experience
  ADD CONSTRAINT user_experience_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES core.organizations(id)
  ON DELETE SET NULL;
COMMIT;
