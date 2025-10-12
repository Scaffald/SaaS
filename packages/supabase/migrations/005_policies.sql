-- =========================================================
-- 005_policies.sql - RLS Policies and Grants
-- All Row Level Security policies and permission grants
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- =========================================================

-- Public schema tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_skill_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_aspects ENABLE ROW LEVEL SECURITY;

-- Private schema tables
ALTER TABLE private.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.application_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.invites ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SECTION 2: PUBLIC.USERS POLICIES
-- =========================================================

CREATE POLICY users_public_read ON public.users
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY users_own_update ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =========================================================
-- SECTION 3: PUBLIC.INDUSTRIES POLICIES
-- =========================================================

CREATE POLICY industries_public_read ON public.industries
  FOR SELECT TO anon, authenticated
  USING (true);

-- =========================================================
-- SECTION 4: PUBLIC.ORGANIZATIONS POLICIES
-- =========================================================

CREATE POLICY orgs_read ON public.organizations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY orgs_insert ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY orgs_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- =========================================================
-- SECTION 5: PUBLIC.TEAMS POLICIES
-- =========================================================

CREATE POLICY teams_read ON public.teams
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY teams_insert ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY teams_update ON public.teams
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 6: PUBLIC.TEAM_MEMBERS POLICIES
-- =========================================================

CREATE POLICY team_members_read ON public.team_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY team_members_self_add ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_members_manage ON public.team_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 7: PUBLIC.SKILLS POLICIES
-- =========================================================

-- Skills are public read
CREATE POLICY skills_read ON public.skills
  FOR SELECT TO anon, authenticated
  USING (true);

-- =========================================================
-- SECTION 8: PUBLIC.USER_SKILLS POLICIES
-- =========================================================

CREATE POLICY user_skills_select ON public.user_skills
  FOR SELECT
  USING (true);

CREATE POLICY user_skills_insert ON public.user_skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_skills_update ON public.user_skills
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_skills_delete ON public.user_skills
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- SECTION 9: PUBLIC.ORGANIZATION_SKILLS POLICIES
-- =========================================================

CREATE POLICY org_skills_select ON public.organization_skills
  FOR SELECT
  USING (true);

-- =========================================================
-- SECTION 10: PUBLIC.FOLLOWS POLICIES
-- =========================================================

CREATE POLICY follows_read ON public.follows
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY follows_write ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    (follower_type = 'user' AND follower_id = auth.uid())
    OR (follower_type <> 'user')
  );

CREATE POLICY follows_delete ON public.follows
  FOR DELETE TO authenticated
  USING (
    (follower_type = 'user' AND follower_id = auth.uid())
    OR (follower_type <> 'user')
  );

-- =========================================================
-- SECTION 11: PUBLIC.JOBS POLICIES
-- =========================================================

CREATE POLICY jobs_read ON public.jobs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY jobs_insert ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY jobs_update ON public.jobs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id 
      AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 12: PUBLIC.JOB_SKILLS POLICIES
-- =========================================================

CREATE POLICY job_skills_select ON public.job_skills
  FOR SELECT
  USING (true);

-- =========================================================
-- SECTION 13: PUBLIC.REVIEWS POLICIES
-- =========================================================

CREATE POLICY reviews_read ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY reviews_insert ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY reviews_update ON public.reviews
  FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY reviews_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());

-- =========================================================
-- SECTION 14: PUBLIC.REVIEW_SKILL_RATINGS POLICIES
-- =========================================================

CREATE POLICY rsr_read ON public.review_skill_ratings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY rsr_insert ON public.review_skill_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r 
      WHERE r.id = review_id 
      AND r.author_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 15: PUBLIC.REVIEW_ASPECTS POLICIES
-- =========================================================

CREATE POLICY ra_read ON public.review_aspects
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY ra_insert ON public.review_aspects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r 
      WHERE r.id = review_id 
      AND r.author_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 16: PRIVATE.PROFILE POLICIES
-- =========================================================

CREATE POLICY profile_own_select ON private.profile
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY profile_own_insert ON private.profile
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profile_own_update ON private.profile
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- SECTION 17: PRIVATE.PREFERENCES POLICIES
-- =========================================================

CREATE POLICY preferences_own_all ON private.preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- SECTION 18: PRIVATE.CONNECTIONS POLICIES
-- =========================================================

CREATE POLICY connections_read ON private.connections
  FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());

CREATE POLICY connections_write ON private.connections
  FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

CREATE POLICY connections_update ON private.connections
  FOR UPDATE TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid())
  WITH CHECK (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());

CREATE POLICY connections_delete ON private.connections
  FOR DELETE TO authenticated
  USING (requester_user_id = auth.uid() OR addressee_user_id = auth.uid());

-- =========================================================
-- SECTION 19: PRIVATE.APPLICATIONS POLICIES
-- =========================================================

CREATE POLICY apps_read ON private.applications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY apps_insert ON private.applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY apps_update ON private.applications
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- SECTION 20: PRIVATE.APPLICATION_MESSAGES POLICIES
-- =========================================================

CREATE POLICY app_msgs_read ON private.application_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY app_msgs_insert ON private.application_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );

-- =========================================================
-- SECTION 21: PRIVATE.APPLICATION_INQUIRIES POLICIES
-- =========================================================

CREATE POLICY app_inquiries_read ON private.application_inquiries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY app_inquiries_write ON private.application_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY app_inquiries_update ON private.application_inquiries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM private.applications a
      WHERE a.id = application_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          JOIN public.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id AND o.owner_user_id = auth.uid()
        )
      )
    )
  );

-- =========================================================
-- SECTION 22: PRIVATE.INVITES POLICIES
-- =========================================================

CREATE POLICY invites_read ON private.invites
  FOR SELECT TO authenticated
  USING (issuer_user_id = auth.uid());

CREATE POLICY invites_insert ON private.invites
  FOR INSERT TO authenticated
  WITH CHECK (issuer_user_id = auth.uid());

CREATE POLICY invites_update ON private.invites
  FOR UPDATE TO authenticated
  USING (issuer_user_id = auth.uid())
  WITH CHECK (issuer_user_id = auth.uid());

-- =========================================================
-- SECTION 23: GRANTS - PUBLIC SCHEMA
-- =========================================================

-- Industries
GRANT SELECT ON public.industries TO anon, authenticated;
GRANT ALL ON public.industries TO service_role;

-- Users
GRANT SELECT ON public.users TO anon, authenticated;
GRANT ALL ON public.users TO service_role;

-- Organizations
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO service_role;

-- Teams
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;

-- Team Members
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

-- Skills
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT ALL ON public.skills TO service_role;

-- User Skills
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;
GRANT ALL ON public.user_skills TO service_role;

-- Organization Skills
GRANT SELECT ON public.organization_skills TO anon, authenticated;
GRANT ALL ON public.organization_skills TO service_role;

-- Follows
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

-- Jobs
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.jobs TO service_role;

-- Job Skills
GRANT SELECT ON public.job_skills TO anon, authenticated;
GRANT ALL ON public.job_skills TO service_role;

-- Reviews
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- Review Skill Ratings
GRANT SELECT ON public.review_skill_ratings TO anon, authenticated;
GRANT INSERT ON public.review_skill_ratings TO authenticated;
GRANT ALL ON public.review_skill_ratings TO service_role;

-- Review Aspects
GRANT SELECT ON public.review_aspects TO anon, authenticated;
GRANT INSERT ON public.review_aspects TO authenticated;
GRANT ALL ON public.review_aspects TO service_role;

-- =========================================================
-- SECTION 24: GRANTS - PRIVATE SCHEMA
-- =========================================================

-- Private Profile
GRANT SELECT, INSERT, UPDATE, DELETE ON private.profile TO authenticated;
GRANT ALL ON private.profile TO service_role;

-- Preferences
GRANT SELECT, INSERT, UPDATE, DELETE ON private.preferences TO authenticated;
GRANT ALL ON private.preferences TO service_role;

-- Connections
GRANT SELECT, INSERT, UPDATE, DELETE ON private.connections TO authenticated;
GRANT ALL ON private.connections TO service_role;

-- Applications
GRANT SELECT, INSERT, UPDATE ON private.applications TO authenticated;
GRANT ALL ON private.applications TO service_role;

-- Application Messages
GRANT SELECT, INSERT ON private.application_messages TO authenticated;
GRANT ALL ON private.application_messages TO service_role;

-- Application Inquiries
GRANT SELECT, INSERT, UPDATE ON private.application_inquiries TO authenticated;
GRANT ALL ON private.application_inquiries TO service_role;

-- Invites
GRANT SELECT, INSERT, UPDATE ON private.invites TO authenticated;
GRANT ALL ON private.invites TO service_role;

COMMIT;
