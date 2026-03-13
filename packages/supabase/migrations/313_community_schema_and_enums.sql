-- =========================================================
-- 408_community_schema_and_enums.sql
-- Create community schema and enum types for Scaffold Communities
-- =========================================================

BEGIN;

-- =========================================================
-- Create community schema
-- =========================================================
CREATE SCHEMA IF NOT EXISTS community;
COMMENT ON SCHEMA community IS 'Scaffold Communities — verified trade-exclusive social platform with posts, peer review, reputation, and portfolio';
ALTER SCHEMA community OWNER TO postgres;

GRANT USAGE ON SCHEMA community TO anon;
GRANT USAGE ON SCHEMA community TO authenticated;
GRANT ALL ON SCHEMA community TO service_role;

-- =========================================================
-- Enum: Post type
-- =========================================================
CREATE TYPE community.post_type AS ENUM (
  'advice',    -- seeking help/guidance, media required, never publishable to profile
  'critique',  -- inviting peer review, media required, publishable after feedback
  'showcase'   -- finished work celebration, media required, auto-published to profile
);
COMMENT ON TYPE community.post_type IS 'Category of community post — determines visibility and publishing rules';

-- =========================================================
-- Enum: Post status
-- =========================================================
CREATE TYPE community.post_status AS ENUM (
  'draft',              -- not yet submitted
  'pending_moderation', -- submitted, awaiting AI review
  'published',          -- live in community feed (private to community unless is_published)
  'flagged',            -- AI flagged for manual review
  'removed'             -- removed by moderation or admin
);
COMMENT ON TYPE community.post_status IS 'Lifecycle status of a community post';

-- =========================================================
-- Enum: AI moderation result
-- =========================================================
CREATE TYPE community.moderation_result AS ENUM (
  'approved',
  'rejected_off_topic',
  'rejected_spam',
  'rejected_non_trade',
  'rejected_inappropriate',
  'manual_review'
);
COMMENT ON TYPE community.moderation_result IS 'Result of AI content moderation on a post';

-- =========================================================
-- Enum: Reputation action types
-- =========================================================
CREATE TYPE community.reputation_action AS ENUM (
  'post_published',
  'post_published_full_taxonomy',
  'comment_created',
  'rating_given_base',
  'rating_given_detailed',
  'rating_received',
  'upvote_received',
  'karma_gifted',
  'karma_received',
  'post_unpublished',
  'post_deleted'
);
COMMENT ON TYPE community.reputation_action IS 'Actions that affect a members Scaffold Score';

COMMIT;
