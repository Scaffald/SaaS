-- =========================================================
-- 007_indexes.sql - Performance Indexes
-- All database indexes for query optimization
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: PUBLIC.USERS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_slug ON public.users(slug);
CREATE INDEX IF NOT EXISTS idx_users_industry_id ON public.users(industry_id);
CREATE INDEX IF NOT EXISTS idx_users_open_to_work ON public.users(open_to_work);

-- =========================================================
-- SECTION 2: PRIVATE.PROFILE INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_profile_geo ON private.profile USING GIST(geo);

-- GIN indexes for array columns (for fast array operations)
CREATE INDEX IF NOT EXISTS idx_profile_availability_gin ON private.profile USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_profile_preferred_work_locations_gin ON private.profile USING GIN(preferred_work_locations);
CREATE INDEX IF NOT EXISTS idx_profile_authorized_countries_gin ON private.profile USING GIN(authorized_countries);
CREATE INDEX IF NOT EXISTS idx_profile_drivers_license_classes_gin ON private.profile USING GIN(drivers_license_classes);
CREATE INDEX IF NOT EXISTS idx_profile_military_status_gin ON private.profile USING GIN(military_status);

-- =========================================================
-- SECTION 3: PUBLIC.ORGANIZATIONS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS organizations_geo_idx ON public.organizations USING GIST(geo);
CREATE INDEX IF NOT EXISTS organizations_owner_idx ON public.organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS orgs_tsv_idx ON public.organizations USING GIN(search_tsv);

-- =========================================================
-- SECTION 4: PUBLIC.TEAMS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS teams_org_idx ON public.teams(organization_id);

-- =========================================================
-- SECTION 5: PUBLIC.TEAM_MEMBERS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS team_members_team_idx ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_user_idx ON public.team_members(user_id);

-- =========================================================
-- SECTION 6: PUBLIC.SKILLS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS skills_name_trgm_idx ON public.skills USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS skills_industry_idx ON public.skills(industry_id);
CREATE INDEX IF NOT EXISTS skills_parent_idx ON public.skills(parent_id);

-- =========================================================
-- SECTION 7: PUBLIC.USER_SKILLS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_taxonomy ON public.user_skills(skill_taxonomy);
CREATE INDEX IF NOT EXISTS idx_user_skills_csi ON public.user_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_skills_onet ON public.user_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- SECTION 8: PUBLIC.ORGANIZATION_SKILLS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_org_skills_org ON public.organization_skills(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_skills_taxonomy ON public.organization_skills(skill_taxonomy);
CREATE INDEX IF NOT EXISTS idx_org_skills_csi ON public.organization_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_skills_onet ON public.organization_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- SECTION 9: PRIVATE.CONNECTIONS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS connections_users_idx ON private.connections(requester_user_id, addressee_user_id);
CREATE INDEX IF NOT EXISTS connections_status_idx ON private.connections(status);

-- =========================================================
-- SECTION 10: PUBLIC.FOLLOWS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_type, follower_id);
CREATE INDEX IF NOT EXISTS follows_followee_idx ON public.follows(followee_type, followee_id);

-- =========================================================
-- SECTION 11: PUBLIC.JOBS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS jobs_geo_idx ON public.jobs USING GIST(geo);
CREATE INDEX IF NOT EXISTS jobs_status_posted_idx ON public.jobs(status, posted_at DESC);
CREATE INDEX IF NOT EXISTS jobs_org_idx ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS jobs_team_idx ON public.jobs(team_id);
CREATE INDEX IF NOT EXISTS jobs_tsv_idx ON public.jobs USING GIN(search_tsv);

-- =========================================================
-- SECTION 12: PUBLIC.JOB_SKILLS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_job_skills_job ON public.job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_taxonomy ON public.job_skills(skill_taxonomy);
CREATE INDEX IF NOT EXISTS idx_job_skills_csi ON public.job_skills(csi_skill_id) WHERE csi_skill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_skills_onet ON public.job_skills(onet_occupation_id) WHERE onet_occupation_id IS NOT NULL;

-- =========================================================
-- SECTION 13: PUBLIC.REVIEWS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS reviews_subject_idx ON public.reviews(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS reviews_author_idx ON public.reviews(author_user_id);

-- =========================================================
-- SECTION 14: PRIVATE.APPLICATIONS INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS applications_job_status_idx ON private.applications(job_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_user_idx ON private.applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_created_idx ON private.applications(created_at DESC);

-- =========================================================
-- SECTION 15: PRIVATE.APPLICATION_MESSAGES INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS app_messages_app_idx ON private.application_messages(application_id);

-- =========================================================
-- SECTION 16: PRIVATE.APPLICATION_INQUIRIES INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS app_inquiries_app_idx ON private.application_inquiries(application_id);

-- =========================================================
-- SECTION 17: PRIVATE.INVITES INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS invites_token_idx ON private.invites(token);
CREATE INDEX IF NOT EXISTS invites_target_idx ON private.invites(target_type, target_id);

-- =========================================================
-- SECTION 18: DATA SCHEMA INDEXES
-- =========================================================

-- MasterFormat indexes
CREATE INDEX IF NOT EXISTS idx_masterformat_code_key ON data.masterformat(code_key);
CREATE INDEX IF NOT EXISTS idx_masterformat_code_gin ON data.masterformat USING GIN(code);
CREATE INDEX IF NOT EXISTS idx_masterformat_parent ON data.masterformat(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_masterformat_depth ON data.masterformat(depth);
CREATE INDEX IF NOT EXISTS idx_masterformat_active ON data.masterformat(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_masterformat_name_trgm ON data.masterformat USING GIN(name gin_trgm_ops);

-- Universities indexes
CREATE INDEX IF NOT EXISTS idx_universities_name ON data.universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_active ON data.universities(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm ON data.universities USING GIN(name gin_trgm_ops);

COMMIT;

-- =========================================================
-- INDEX SUMMARY
-- =========================================================
--
-- Total Indexes Created: ~50+
--
-- Index Types:
-- - B-tree: Standard indexes for exact matches and range queries
-- - GIN: Generalized Inverted Index for full-text search and arrays
-- - GIST: Generalized Search Tree for geospatial and complex types
--
-- Key Performance Benefits:
-- 1. Full-text search on names and descriptions
-- 2. Fast geospatial queries with PostGIS
-- 3. Efficient array operations on multi-select fields
-- 4. Optimized joins on foreign keys
-- 5. Quick lookups on frequently queried columns
--
-- =========================================================
