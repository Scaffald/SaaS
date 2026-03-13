-- =========================================================
-- 409_community_core_tables.sql
-- Core tables for Scaffold Communities: communities, memberships, posts, comments, ratings, upvotes, bookmarks
-- =========================================================

BEGIN;

-- =========================================================
-- Table: community.communities
-- Trade-specific community groups (e.g., Cosmetology, Plumbing, Electrical)
-- =========================================================
CREATE TABLE community.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug CITEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  industry_id UUID REFERENCES core.industries(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE community.communities IS 'Trade-specific community groups — each maps to a licensed trade';
COMMENT ON COLUMN community.communities.slug IS 'URL-safe unique identifier for the community';
COMMENT ON COLUMN community.communities.industry_id IS 'Optional link to core.industries for cross-referencing';
COMMENT ON COLUMN community.communities.member_count IS 'Denormalized member count for display';
COMMENT ON COLUMN community.communities.post_count IS 'Denormalized published post count for display';

-- =========================================================
-- Table: community.memberships
-- Join table: users belong to communities (gated by license verification)
-- =========================================================
CREATE TABLE community.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (community_id, user_id)
);

COMMENT ON TABLE community.memberships IS 'Community membership — user must be verified to participate';
COMMENT ON COLUMN community.memberships.is_verified IS 'Whether the users trade license has been verified for this community';
COMMENT ON COLUMN community.memberships.verification_data IS 'License verification data: { state, license_number, license_type, submitted_at, verified_by, verified_at }';

-- =========================================================
-- Table: community.posts
-- Content posts: Advice, Critique, Showcase — all require media
-- =========================================================
CREATE TABLE community.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  post_type community.post_type NOT NULL,
  status community.post_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  body TEXT,

  -- Media (required on submission; stored as Supabase Storage paths)
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  media_thumbnails TEXT[] NOT NULL DEFAULT '{}',

  -- Skill taxonomy tags (array of community.skill_taxonomy IDs)
  skill_tags UUID[] NOT NULL DEFAULT '{}',

  -- Denormalized counters
  upvote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT NULL,
  rating_count INTEGER NOT NULL DEFAULT 0,

  -- Publishing
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,

  -- AI Moderation
  moderation_result community.moderation_result,
  moderation_metadata JSONB,

  -- AI Feedback Summary (generated when published with 5+ comments)
  ai_feedback_summary TEXT,
  ai_summary_updated_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- soft delete
);

COMMENT ON TABLE community.posts IS 'Community posts — advice, critique, and showcase content with required media';
COMMENT ON COLUMN community.posts.media_urls IS 'Array of Supabase Storage paths to uploaded media (photos/videos)';
COMMENT ON COLUMN community.posts.skill_tags IS 'Array of community.skill_taxonomy IDs — child selection auto-includes parents in data layer';
COMMENT ON COLUMN community.posts.is_published IS 'Whether this post is visible on the authors public profile (portfolio)';
COMMENT ON COLUMN community.posts.ai_feedback_summary IS 'AI-generated summary of community feedback thread — no individual identities exposed';

-- Showcase posts auto-publish
-- Advice posts can never be published to profile
ALTER TABLE community.posts ADD CONSTRAINT chk_advice_not_published
  CHECK (NOT (post_type = 'advice' AND is_published = true));

-- =========================================================
-- Table: community.comments
-- Threaded comments on posts
-- =========================================================
CREATE TABLE community.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- soft delete
);

COMMENT ON TABLE community.comments IS 'Threaded comments on community posts — members cannot delete others comments';
COMMENT ON COLUMN community.comments.is_pinned IS 'Post author can pin one comment as a featured review';
COMMENT ON COLUMN community.comments.parent_comment_id IS 'For threaded replies; NULL = top-level comment';

-- Enforce max 1 pinned comment per post (among non-deleted comments)
CREATE UNIQUE INDEX idx_one_pinned_comment_per_post
  ON community.comments (post_id)
  WHERE is_pinned = true AND deleted_at IS NULL;

-- =========================================================
-- Table: community.post_ratings
-- 5-star peer review with optional sub-dimensions
-- =========================================================
CREATE TABLE community.post_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community.posts(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Base rating (required)
  base_rating SMALLINT NOT NULL CHECK (base_rating BETWEEN 1 AND 5),

  -- Optional sub-dimension ratings
  quality_rating SMALLINT CHECK (quality_rating BETWEEN 1 AND 5),
  technique_rating SMALLINT CHECK (technique_rating BETWEEN 1 AND 5),
  creativity_rating SMALLINT CHECK (creativity_rating BETWEEN 1 AND 5),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (post_id, rater_id)
);

COMMENT ON TABLE community.post_ratings IS 'Peer review ratings on critique and showcase posts — 5-star base + optional sub-dimensions';
COMMENT ON COLUMN community.post_ratings.quality_rating IS 'Quality of Work — does the finished result meet professional standards?';
COMMENT ON COLUMN community.post_ratings.technique_rating IS 'Technique — process, precision, method';
COMMENT ON COLUMN community.post_ratings.creativity_rating IS 'Creativity / Problem-Solving — innovative solutions, artistic choices';

-- =========================================================
-- Table: community.upvotes
-- Polymorphic upvotes on posts and comments (v1.0: upvotes only, no downvotes)
-- =========================================================
CREATE TABLE community.upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, target_type, target_id)
);

COMMENT ON TABLE community.upvotes IS 'Upvotes on posts and comments — v1.0 is upvotes only, downvotes deferred to v2.0';

-- =========================================================
-- Table: community.bookmarks
-- Private bookmarks for inspiration/reference
-- =========================================================
CREATE TABLE community.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, post_id)
);

COMMENT ON TABLE community.bookmarks IS 'Private bookmarks — never visible to other members or employers';

-- =========================================================
-- Updated_at triggers
-- =========================================================
CREATE OR REPLACE FUNCTION community.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_communities_updated_at BEFORE UPDATE ON community.communities
  FOR EACH ROW EXECUTE FUNCTION community.set_updated_at();

CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON community.posts
  FOR EACH ROW EXECUTE FUNCTION community.set_updated_at();

CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON community.comments
  FOR EACH ROW EXECUTE FUNCTION community.set_updated_at();

CREATE TRIGGER trg_post_ratings_updated_at BEFORE UPDATE ON community.post_ratings
  FOR EACH ROW EXECUTE FUNCTION community.set_updated_at();

-- =========================================================
-- Grant table permissions
-- =========================================================
GRANT SELECT ON ALL TABLES IN SCHEMA community TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA community TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA community TO service_role;

-- Ensure future tables get same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA community GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA community GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA community GRANT ALL ON TABLES TO service_role;

COMMIT;
