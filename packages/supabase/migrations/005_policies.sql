-- =========================================================
-- 005_policies.sql - RLS Policies and Grants
-- All Row Level Security policies and permission grants
-- =========================================================

BEGIN;
-- =========================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- =========================================================

-- Core schema tables
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.review_skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.review_aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.soft_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.review_category_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.review_soft_skill_votes ENABLE ROW LEVEL SECURITY;
-- Core schema private tables (PII)
ALTER TABLE core.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.application_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_experience ENABLE ROW LEVEL SECURITY;
-- Certifications
ALTER TABLE core.certifications ENABLE ROW LEVEL SECURITY;
-- Job certifications
ALTER TABLE core.job_certifications ENABLE ROW LEVEL SECURITY;
-- External jobs tables
ALTER TABLE core.external_job_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.external_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.external_job_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.external_job_skills ENABLE ROW LEVEL SECURITY;
-- =========================================================
-- SECTION 2: PUBLIC.USERS POLICIES
-- =========================================================

CREATE POLICY users_public_read ON core.users
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY users_own_insert ON core.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY users_own_update ON core.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
-- =========================================================
-- SECTION 3: PUBLIC.INDUSTRIES POLICIES
-- =========================================================

CREATE POLICY industries_public_read ON core.industries
  FOR SELECT TO anon, authenticated
  USING (true);
-- =========================================================
-- SECTION 4: PUBLIC.ORGANIZATIONS POLICIES
-- =========================================================

CREATE POLICY orgs_read ON core.organizations
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY orgs_insert ON core.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY orgs_update ON core.organizations
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);
-- =========================================================
-- SECTION 5: PUBLIC.TEAMS POLICIES
-- =========================================================

CREATE POLICY teams_read ON core.teams
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY teams_insert ON core.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY teams_update ON core.teams
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 6: PUBLIC.TEAM_MEMBERS POLICIES
-- =========================================================

CREATE POLICY team_members_read ON core.team_members
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY team_members_self_add ON core.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id AND o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY team_members_manage ON core.team_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id AND o.owner_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 7: PUBLIC.SKILLS POLICIES
-- =========================================================

-- Skills are public read
CREATE POLICY skills_read ON core.skills
  FOR SELECT TO anon, authenticated
  USING (true);
-- =========================================================
-- SECTION 8: PUBLIC.USER_SKILLS POLICIES
-- =========================================================

CREATE POLICY user_skills_select ON core.user_skills
  FOR SELECT
  USING (true);
CREATE POLICY user_skills_insert ON core.user_skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_skills_update ON core.user_skills
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY user_skills_delete ON core.user_skills
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- =========================================================
-- SECTION 9: PUBLIC.ORGANIZATION_SKILLS POLICIES
-- =========================================================

CREATE POLICY org_skills_select ON core.organization_skills
  FOR SELECT
  USING (true);
-- =========================================================
-- SECTION 10: PUBLIC.FOLLOWS POLICIES
-- =========================================================

CREATE POLICY follows_read ON core.follows
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY follows_write ON core.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    (follower_type = 'user' AND follower_id = auth.uid())
    OR (follower_type <> 'user')
  );
CREATE POLICY follows_delete ON core.follows
  FOR DELETE TO authenticated
  USING (
    (follower_type = 'user' AND follower_id = auth.uid())
    OR (follower_type <> 'user')
  );
-- =========================================================
-- SECTION 11: PUBLIC.JOBS POLICIES
-- =========================================================

CREATE POLICY jobs_read ON core.jobs
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY jobs_insert ON core.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY jobs_update ON core.jobs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 12: PUBLIC.JOB_SKILLS POLICIES
-- =========================================================

CREATE POLICY job_skills_select ON core.job_skills
  FOR SELECT
  USING (true);
-- =========================================================
-- SECTION 13: PUBLIC.REVIEWS POLICIES
-- =========================================================

CREATE POLICY reviews_read ON core.reviews
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY reviews_insert ON core.reviews
  FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid());
CREATE POLICY reviews_update ON core.reviews
  FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());
CREATE POLICY reviews_delete ON core.reviews
  FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());
-- =========================================================
-- SECTION 14: PUBLIC.REVIEW_SKILL_RATINGS POLICIES
-- =========================================================

CREATE POLICY rsr_read ON core.review_skill_ratings
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY rsr_insert ON core.review_skill_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.reviews r 
      WHERE r.id = review_id 
      AND r.author_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 15: PUBLIC.REVIEW_ASPECTS POLICIES
-- =========================================================

CREATE POLICY ra_read ON core.review_aspects
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY ra_insert ON core.review_aspects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.reviews r 
      WHERE r.id = review_id 
      AND r.author_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 16: PRIVATE.PROFILE POLICIES
-- =========================================================

CREATE POLICY profile_own_select ON core.profile
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY profile_own_insert ON core.profile
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY profile_own_update ON core.profile
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- =========================================================
-- SECTION 17: PRIVATE.PREFERENCES POLICIES
-- =========================================================

CREATE POLICY preferences_own_all ON core.preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- =========================================================
-- SECTION 18: PRIVATE.CONNECTIONS POLICIES
-- =========================================================

CREATE POLICY connections_read ON core.connections
  FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());
CREATE POLICY connections_write ON core.connections
  FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());
CREATE POLICY connections_update ON core.connections
  FOR UPDATE TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid())
  WITH CHECK (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());
CREATE POLICY connections_delete ON core.connections
  FOR DELETE TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());
-- =========================================================
-- SECTION 19: PRIVATE.APPLICATIONS POLICIES
-- =========================================================

CREATE POLICY apps_read ON core.applications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.jobs j
      JOIN core.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );
CREATE POLICY apps_insert ON core.applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY apps_update ON core.applications
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.jobs j
      JOIN core.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.jobs j
      JOIN core.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 20: PRIVATE.APPLICATION_MESSAGES POLICIES
-- =========================================================

CREATE POLICY app_msgs_read ON core.application_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY app_msgs_insert ON core.application_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );
-- =========================================================
-- SECTION 21: PRIVATE.APPLICATION_INQUIRIES POLICIES
-- =========================================================

CREATE POLICY app_inquiries_read ON core.application_inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY app_inquiries_write ON core.application_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );
CREATE POLICY app_inquiries_update ON core.application_inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );
-- =========================================================
-- SECTION 22: PRIVATE.INVITES POLICIES
-- =========================================================

CREATE POLICY invites_read ON core.invites
  FOR SELECT TO authenticated
  USING (issuer_user_id = auth.uid());
CREATE POLICY invites_insert ON core.invites
  FOR INSERT TO authenticated
  WITH CHECK (issuer_user_id = auth.uid());
CREATE POLICY invites_update ON core.invites
  FOR UPDATE TO authenticated
  USING (issuer_user_id = auth.uid())
  WITH CHECK (issuer_user_id = auth.uid());
-- =========================================================
-- SECTION 23: PRIVATE.ROLES POLICIES
-- =========================================================

-- Allow all authenticated users to read role definitions
CREATE POLICY roles_authenticated_read ON core.roles
  FOR SELECT TO authenticated
  USING (true);
-- =========================================================
-- SECTION 24: PRIVATE.ROLE_ASSIGNMENTS POLICIES
-- =========================================================

-- Allow users to read their own role assignments
CREATE POLICY role_assignments_own_read ON core.role_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- =========================================================
-- SECTION 25: PUBLIC.CERTIFICATIONS POLICIES
-- =========================================================

-- Public read access for certifications catalog
CREATE POLICY certifications_public_read ON core.certifications
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
-- Service role has full access to certifications
GRANT ALL ON core.certifications TO service_role;
-- =========================================================
-- SECTION 26: PRIVATE.USER_CERTIFICATIONS POLICIES
-- =========================================================

CREATE POLICY user_certifications_own_select ON core.user_certifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY user_certifications_own_insert ON core.user_certifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_certifications_own_update ON core.user_certifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_certifications_own_delete ON core.user_certifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- =========================================================
-- SECTION 27: PRIVATE.USER_EDUCATION POLICIES
-- =========================================================

CREATE POLICY user_education_own_select ON core.user_education
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY user_education_own_insert ON core.user_education
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_education_own_update ON core.user_education
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_education_own_delete ON core.user_education
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- =========================================================
-- SECTION 28: PRIVATE.USER_EXPERIENCE POLICIES
-- =========================================================

CREATE POLICY user_experience_own_select ON core.user_experience
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY user_experience_own_insert ON core.user_experience
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_experience_own_update ON core.user_experience
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_experience_own_delete ON core.user_experience
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
-- =========================================================
-- SECTION 29: PUBLIC.JOB_CERTIFICATIONS POLICIES
-- =========================================================

-- Public read access for job certifications
CREATE POLICY job_certifications_read ON core.job_certifications
  FOR SELECT TO anon, authenticated
  USING (true);
-- Organization owners can manage job certifications
CREATE POLICY job_certifications_manage ON core.job_certifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.jobs j
      JOIN core.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.jobs j
      JOIN core.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );
-- =========================================================
-- SECTION 29B: EXTERNAL JOBS POLICIES
-- =========================================================

-- External Job Feeds (admin/service role only)
CREATE POLICY external_job_feeds_read ON core.external_job_feeds
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
-- External Jobs (public read for active jobs)
CREATE POLICY external_jobs_read ON core.external_jobs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
-- External Job Industries (public read)
CREATE POLICY external_job_industries_read ON core.external_job_industries
  FOR SELECT TO anon, authenticated
  USING (true);
-- External Job Skills (public read)
CREATE POLICY external_job_skills_read ON core.external_job_skills
  FOR SELECT TO anon, authenticated
  USING (true);
-- =========================================================
-- SECTION 30: REVIEW ENHANCEMENTS POLICIES
-- =========================================================

-- Soft Skills (public read)
CREATE POLICY soft_skills_public_read ON core.soft_skills
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
-- Review Category Ratings (public read, authenticated write)
CREATE POLICY review_category_ratings_read ON core.review_category_ratings
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY review_category_ratings_write ON core.review_category_ratings
  FOR ALL TO authenticated
  USING (true);
-- Review Soft Skill Votes (public read, authenticated write)
CREATE POLICY review_soft_skill_votes_read ON core.review_soft_skill_votes
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY review_soft_skill_votes_write ON core.review_soft_skill_votes
  FOR ALL TO authenticated
  USING (true);
-- =========================================================
-- SECTION 31: CMS SCHEMA POLICIES
-- =========================================================

-- Enable RLS on CMS tables
ALTER TABLE cms.welcome_slides ENABLE ROW LEVEL SECURITY;
-- Grant table-level permissions
GRANT SELECT ON cms.welcome_slides TO anon, authenticated;
GRANT ALL ON cms.welcome_slides TO service_role;
-- Public read policy (anyone can read active slides)
CREATE POLICY welcome_slides_public_read ON cms.welcome_slides
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
-- Authenticated users can read all slides (including inactive)
CREATE POLICY welcome_slides_authenticated_read ON cms.welcome_slides
  FOR SELECT TO authenticated
  USING (true);
-- =========================================================
-- SECTION 32: GRANTS - CORE SCHEMA
-- =========================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA core TO authenticated, anon, service_role;
-- =========================================================
-- SECTION 33: GRANTS - CORE SCHEMA TABLES (replaces PUBLIC and PRIVATE)
-- =========================================================

-- Certifications catalog (reference data)
GRANT SELECT ON core.certifications TO anon, authenticated;
GRANT ALL ON core.certifications TO service_role;
-- External Job Feeds
GRANT SELECT ON core.external_job_feeds TO anon, authenticated;
GRANT ALL ON core.external_job_feeds TO service_role;
-- External Jobs
GRANT SELECT ON core.external_jobs TO anon, authenticated;
GRANT ALL ON core.external_jobs TO service_role;
-- External Job Industries
GRANT SELECT ON core.external_job_industries TO anon, authenticated;
GRANT ALL ON core.external_job_industries TO service_role;
-- External Job Skills
GRANT SELECT ON core.external_job_skills TO anon, authenticated;
GRANT ALL ON core.external_job_skills TO service_role;
-- Industries
GRANT SELECT ON core.industries TO anon, authenticated;
GRANT ALL ON core.industries TO service_role;
-- Users
GRANT SELECT ON core.users TO anon, authenticated;
GRANT INSERT, UPDATE ON core.users TO authenticated;
GRANT ALL ON core.users TO service_role;
-- Organizations
GRANT SELECT ON core.organizations TO anon, authenticated;
GRANT ALL ON core.organizations TO service_role;
-- Teams
GRANT SELECT ON core.teams TO anon, authenticated;
GRANT ALL ON core.teams TO service_role;
-- Team Members
GRANT SELECT, INSERT, DELETE ON core.team_members TO authenticated;
GRANT ALL ON core.team_members TO service_role;
-- Skills
GRANT SELECT ON core.skills TO anon, authenticated;
GRANT ALL ON core.skills TO service_role;
-- User Skills
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_skills TO authenticated;
GRANT ALL ON core.user_skills TO service_role;
-- Organization Skills
GRANT SELECT ON core.organization_skills TO anon, authenticated;
GRANT ALL ON core.organization_skills TO service_role;
-- Follows
GRANT SELECT, INSERT, DELETE ON core.follows TO authenticated;
GRANT ALL ON core.follows TO service_role;
-- Jobs
GRANT SELECT ON core.jobs TO anon, authenticated;
GRANT ALL ON core.jobs TO service_role;
-- Job Skills
GRANT SELECT ON core.job_skills TO anon, authenticated;
GRANT ALL ON core.job_skills TO service_role;
-- Job Certifications
GRANT SELECT ON core.job_certifications TO anon, authenticated;
GRANT ALL ON core.job_certifications TO service_role;
-- Reviews
GRANT SELECT ON core.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON core.reviews TO authenticated;
GRANT ALL ON core.reviews TO service_role;
-- Review Skill Ratings
GRANT SELECT ON core.review_skill_ratings TO anon, authenticated;
GRANT INSERT ON core.review_skill_ratings TO authenticated;
GRANT ALL ON core.review_skill_ratings TO service_role;
-- Review Aspects
GRANT SELECT ON core.review_aspects TO anon, authenticated;
GRANT INSERT ON core.review_aspects TO authenticated;
GRANT ALL ON core.review_aspects TO service_role;
-- =========================================================
-- SECTION 32: GRANTS - PRIVATE SCHEMA
-- =========================================================

-- Private Profile
GRANT SELECT, INSERT, UPDATE, DELETE ON core.profile TO authenticated;
GRANT ALL ON core.profile TO service_role;
-- Roles
GRANT SELECT ON core.roles TO authenticated, service_role;
GRANT ALL ON core.roles TO service_role;
-- Role Assignments
GRANT SELECT ON core.role_assignments TO authenticated, service_role;
GRANT ALL ON core.role_assignments TO service_role;
-- Preferences
GRANT SELECT, INSERT, UPDATE, DELETE ON core.preferences TO authenticated;
GRANT ALL ON core.preferences TO service_role;
-- Connections
GRANT SELECT, INSERT, UPDATE, DELETE ON core.connections TO authenticated;
GRANT ALL ON core.connections TO service_role;
-- Applications
GRANT SELECT, INSERT, UPDATE ON core.applications TO authenticated;
GRANT ALL ON core.applications TO service_role;
-- Application Messages
GRANT SELECT, INSERT ON core.application_messages TO authenticated;
GRANT ALL ON core.application_messages TO service_role;
-- Application Inquiries
GRANT SELECT, INSERT, UPDATE ON core.application_inquiries TO authenticated;
GRANT ALL ON core.application_inquiries TO service_role;
-- Invites
GRANT SELECT, INSERT, UPDATE ON core.invites TO authenticated;
GRANT ALL ON core.invites TO service_role;
-- User Certifications
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_certifications TO authenticated;
GRANT ALL ON core.user_certifications TO service_role;
-- User Education
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_education TO authenticated;
GRANT ALL ON core.user_education TO service_role;
-- User Experience
GRANT SELECT, INSERT, UPDATE, DELETE ON core.user_experience TO authenticated;
GRANT ALL ON core.user_experience TO service_role;
COMMIT;
