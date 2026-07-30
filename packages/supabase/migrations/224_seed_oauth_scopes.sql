-- =========================================================
-- 295_seed_oauth_scopes.sql
-- Seed OAuth 2.0 Scopes for Scaffald Platform
-- Provides initial scope definitions for OAuth app approvals
-- =========================================================

BEGIN;

-- =========================================================
-- Idempotency
-- =========================================================
-- This used to be `DELETE FROM core.oauth_scopes;` followed by the inserts
-- below. That made a replay destructive rather than idempotent (#437):
--
--   * Production runs migration 138's vocabulary — 7 `resource:action` scopes
--     (documents:read, profile:write, …) — with one registered OAuth app using
--     four of them. This file declares a different 31-scope `action:resource`
--     vocabulary (read:documents, write:profile, plus openid/email/profile and
--     five admin:*). A replay deleted the live catalog and installed this one.
--   * It also silently discarded the per-scope authorization classifications
--     added by 338 (is_self_scoped / rbac_permissions), which are keyed on
--     scope NAME. After a replay every scope is unclassified, which 338 treats
--     as denied — so OAuth fails closed rather than opening up, but it still
--     breaks.
--
-- The inserts are now additive via ON CONFLICT DO NOTHING. Which of the two
-- vocabularies should be canonical is still an open question; this only ensures
-- that asking it later costs nothing.

-- =========================================================
-- OpenID Connect Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('openid', 'OpenID', 'Access basic identity information', 'general', false, false),
  ('profile', 'Profile Information', 'Access your profile information (name, avatar)', 'profile', false, false),
  ('email', 'Email Address', 'Access your email address', 'profile', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Profile Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:profile', 'Read Profile', 'Read your full profile information including skills, experience, and education', 'profile', true, false),
  ('write:profile', 'Write Profile', 'Update your profile information', 'profile', true, true),
  ('read:resume', 'Read Resume', 'Download and read your resume', 'documents', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Job Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:jobs', 'Read Jobs', 'View job listings and details', 'general', false, false),
  ('write:jobs', 'Create Jobs', 'Create and manage job postings', 'general', true, true),
  ('read:job_applications', 'Read Applications', 'View applications to jobs you posted', 'general', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Application Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:applications', 'Read Applications', 'View your job applications and their status', 'general', true, false),
  ('write:applications', 'Create Applications', 'Apply to jobs on your behalf', 'general', true, true),
  ('delete:applications', 'Withdraw Applications', 'Withdraw your job applications', 'general', true, true)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Document Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:documents', 'Read Documents', 'Access your uploaded documents (resumes, certificates)', 'documents', true, false),
  ('write:documents', 'Upload Documents', 'Upload and manage documents on your behalf', 'documents', true, true),
  ('delete:documents', 'Delete Documents', 'Delete your uploaded documents', 'documents', true, true)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Organization Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:organizations', 'Read Organizations', 'View organization information', 'organizations', true, false),
  ('write:organizations', 'Manage Organizations', 'Create and manage organization profiles', 'organizations', true, true),
  ('read:organization_members', 'Read Organization Members', 'View members of organizations you belong to', 'organizations', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Team/Collaboration Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:teams', 'Read Teams', 'View team information and membership', 'organizations', true, false),
  ('write:teams', 'Manage Teams', 'Create and manage teams', 'organizations', true, true)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Notification Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:notifications', 'Read Notifications', 'Access your notifications', 'general', true, false),
  ('write:notifications', 'Manage Notifications', 'Mark notifications as read or dismissed', 'general', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Messaging Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:messages', 'Read Messages', 'Read your messages and conversations', 'general', true, true),
  ('write:messages', 'Send Messages', 'Send messages on your behalf', 'general', true, true)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Assessment Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:assessments', 'Read Assessments', 'View your assessment results and career recommendations', 'profile', true, false),
  ('write:assessments', 'Take Assessments', 'Complete assessments on your behalf', 'profile', true, false)
ON CONFLICT (scope) DO NOTHING;

-- =========================================================
-- Admin Scopes (Highly Sensitive)
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('admin:users', 'Administer Users', 'Full administrative access to user accounts', 'admin', true, true),
  ('admin:organizations', 'Administer Organizations', 'Full administrative access to organizations', 'admin', true, true),
  ('admin:jobs', 'Administer Jobs', 'Full administrative access to all job postings', 'admin', true, true),
  ('admin:applications', 'Administer Applications', 'Full administrative access to all applications', 'admin', true, true),
  ('admin:oauth', 'Administer OAuth', 'Manage OAuth applications and tokens', 'admin', true, true)
ON CONFLICT (scope) DO NOTHING;

COMMIT;

-- =========================================================
-- Verification Query (for manual testing)
-- =========================================================
-- SELECT
--   category,
--   COUNT(*) as scope_count,
--   COUNT(*) FILTER (WHERE is_sensitive) as sensitive_count
-- FROM core.oauth_scopes
-- GROUP BY category
-- ORDER BY category;
