-- =========================================================
-- 295_seed_oauth_scopes.sql
-- Seed OAuth 2.0 Scopes for Scaffald Platform
-- Provides initial scope definitions for OAuth app approvals
-- =========================================================

BEGIN;

-- =========================================================
-- Delete existing scopes (for idempotency)
-- =========================================================
DELETE FROM core.oauth_scopes;

-- =========================================================
-- OpenID Connect Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('openid', 'OpenID', 'Access basic identity information', 'general', false, false),
  ('profile', 'Profile Information', 'Access your profile information (name, avatar)', 'profile', false, false),
  ('email', 'Email Address', 'Access your email address', 'profile', true, false);

-- =========================================================
-- Profile Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:profile', 'Read Profile', 'Read your full profile information including skills, experience, and education', 'profile', true, false),
  ('write:profile', 'Write Profile', 'Update your profile information', 'profile', true, true),
  ('read:resume', 'Read Resume', 'Download and read your resume', 'documents', true, false);

-- =========================================================
-- Job Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:jobs', 'Read Jobs', 'View job listings and details', 'general', false, false),
  ('write:jobs', 'Create Jobs', 'Create and manage job postings', 'general', true, true),
  ('read:job_applications', 'Read Applications', 'View applications to jobs you posted', 'general', true, false);

-- =========================================================
-- Application Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:applications', 'Read Applications', 'View your job applications and their status', 'general', true, false),
  ('write:applications', 'Create Applications', 'Apply to jobs on your behalf', 'general', true, true),
  ('delete:applications', 'Withdraw Applications', 'Withdraw your job applications', 'general', true, true);

-- =========================================================
-- Document Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:documents', 'Read Documents', 'Access your uploaded documents (resumes, certificates)', 'documents', true, false),
  ('write:documents', 'Upload Documents', 'Upload and manage documents on your behalf', 'documents', true, true),
  ('delete:documents', 'Delete Documents', 'Delete your uploaded documents', 'documents', true, true);

-- =========================================================
-- Organization Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:organizations', 'Read Organizations', 'View organization information', 'organizations', true, false),
  ('write:organizations', 'Manage Organizations', 'Create and manage organization profiles', 'organizations', true, true),
  ('read:organization_members', 'Read Organization Members', 'View members of organizations you belong to', 'organizations', true, false);

-- =========================================================
-- Team/Collaboration Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:teams', 'Read Teams', 'View team information and membership', 'organizations', true, false),
  ('write:teams', 'Manage Teams', 'Create and manage teams', 'organizations', true, true);

-- =========================================================
-- Notification Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:notifications', 'Read Notifications', 'Access your notifications', 'general', true, false),
  ('write:notifications', 'Manage Notifications', 'Mark notifications as read or dismissed', 'general', true, false);

-- =========================================================
-- Messaging Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:messages', 'Read Messages', 'Read your messages and conversations', 'general', true, true),
  ('write:messages', 'Send Messages', 'Send messages on your behalf', 'general', true, true);

-- =========================================================
-- Assessment Scopes
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('read:assessments', 'Read Assessments', 'View your assessment results and career recommendations', 'profile', true, false),
  ('write:assessments', 'Take Assessments', 'Complete assessments on your behalf', 'profile', true, false);

-- =========================================================
-- Admin Scopes (Highly Sensitive)
-- =========================================================
INSERT INTO core.oauth_scopes (scope, display_name, description, category, requires_consent, is_sensitive) VALUES
  ('admin:users', 'Administer Users', 'Full administrative access to user accounts', 'admin', true, true),
  ('admin:organizations', 'Administer Organizations', 'Full administrative access to organizations', 'admin', true, true),
  ('admin:jobs', 'Administer Jobs', 'Full administrative access to all job postings', 'admin', true, true),
  ('admin:applications', 'Administer Applications', 'Full administrative access to all applications', 'admin', true, true),
  ('admin:oauth', 'Administer OAuth', 'Manage OAuth applications and tokens', 'admin', true, true);

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
