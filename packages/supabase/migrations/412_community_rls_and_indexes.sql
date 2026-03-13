-- =========================================================
-- 412_community_rls_and_indexes.sql
-- Row-level security policies, performance indexes, counter triggers,
-- storage bucket, and core.follows extension for community schema
-- =========================================================

BEGIN;

-- =========================================================
-- ENABLE RLS ON ALL COMMUNITY TABLES
-- =========================================================
ALTER TABLE community.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.post_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.scaffold_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.karma_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.skill_taxonomy ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS: community.communities — public read
-- =========================================================
CREATE POLICY communities_select ON community.communities
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY communities_all_service ON community.communities
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.memberships
-- =========================================================
-- Anyone authenticated can see memberships (public who is in what community)
CREATE POLICY memberships_select ON community.memberships
  FOR SELECT TO authenticated
  USING (true);

-- Users can join communities themselves
CREATE POLICY memberships_insert ON community.memberships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave communities
CREATE POLICY memberships_delete ON community.memberships
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY memberships_all_service ON community.memberships
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.posts
-- Members can see posts in their communities; published posts visible to all authenticated
-- =========================================================
CREATE POLICY posts_select ON community.posts
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Published posts are visible to all authenticated users
      (status = 'published')
      -- Community members can see all non-deleted posts in their community
      OR EXISTS (
        SELECT 1 FROM community.memberships m
        WHERE m.community_id = community.posts.community_id
          AND m.user_id = auth.uid()
      )
      -- Authors can always see their own posts
      OR author_id = auth.uid()
    )
  );

-- Authors can create posts in communities they belong to
CREATE POLICY posts_insert ON community.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community.memberships m
      WHERE m.community_id = community.posts.community_id
        AND m.user_id = auth.uid()
        AND m.is_verified = true
    )
  );

-- Authors can update their own posts
CREATE POLICY posts_update ON community.posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own posts
CREATE POLICY posts_delete ON community.posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY posts_all_service ON community.posts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.comments
-- Community members can read comments; authors can modify own
-- =========================================================
CREATE POLICY comments_select ON community.comments
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      EXISTS (
        SELECT 1 FROM community.posts p
        JOIN community.memberships m ON m.community_id = p.community_id
        WHERE p.id = community.comments.post_id
          AND m.user_id = auth.uid()
      )
      OR author_id = auth.uid()
    )
  );

CREATE POLICY comments_insert ON community.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community.posts p
      JOIN community.memberships m ON m.community_id = p.community_id
      WHERE p.id = community.comments.post_id
        AND m.user_id = auth.uid()
        AND m.is_verified = true
    )
  );

CREATE POLICY comments_update ON community.comments
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY comments_delete ON community.comments
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY comments_all_service ON community.comments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.post_ratings — community members can rate; raters see own
-- =========================================================
CREATE POLICY ratings_select ON community.post_ratings
  FOR SELECT TO authenticated
  USING (true);  -- Ratings are visible to all authenticated (aggregated on posts)

CREATE POLICY ratings_insert ON community.post_ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM community.posts p
      JOIN community.memberships m ON m.community_id = p.community_id
      WHERE p.id = community.post_ratings.post_id
        AND m.user_id = auth.uid()
        AND m.is_verified = true
    )
  );

CREATE POLICY ratings_update ON community.post_ratings
  FOR UPDATE TO authenticated
  USING (rater_id = auth.uid())
  WITH CHECK (rater_id = auth.uid());

CREATE POLICY ratings_all_service ON community.post_ratings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.upvotes — self only
-- =========================================================
CREATE POLICY upvotes_select ON community.upvotes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY upvotes_insert ON community.upvotes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY upvotes_delete ON community.upvotes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY upvotes_all_service ON community.upvotes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.bookmarks — self only
-- =========================================================
CREATE POLICY bookmarks_select ON community.bookmarks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY bookmarks_insert ON community.bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY bookmarks_delete ON community.bookmarks
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY bookmarks_all_service ON community.bookmarks
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.scaffold_scores — public read, service write
-- =========================================================
CREATE POLICY scores_select ON community.scaffold_scores
  FOR SELECT TO anon, authenticated
  USING (true);  -- Scaffold Score is public

CREATE POLICY scores_all_service ON community.scaffold_scores
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.reputation_events — users see own history only
-- =========================================================
CREATE POLICY reputation_events_select ON community.reputation_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY reputation_events_all_service ON community.reputation_events
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.karma_gifts — givers and receivers see their own
-- =========================================================
CREATE POLICY karma_gifts_select ON community.karma_gifts
  FOR SELECT TO authenticated
  USING (giver_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY karma_gifts_all_service ON community.karma_gifts
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- RLS: community.skill_taxonomy — public read
-- =========================================================
CREATE POLICY skill_taxonomy_select ON community.skill_taxonomy
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY skill_taxonomy_all_service ON community.skill_taxonomy
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- PERFORMANCE INDEXES
-- =========================================================

-- Posts: feed queries
CREATE INDEX idx_posts_community_status_created
  ON community.posts (community_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Posts: author profile/portfolio
CREATE INDEX idx_posts_author_published
  ON community.posts (author_id, published_at DESC)
  WHERE is_published = true AND deleted_at IS NULL;

-- Posts: cross-community published feed
CREATE INDEX idx_posts_published_feed
  ON community.posts (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Comments: thread loading
CREATE INDEX idx_comments_post_created
  ON community.comments (post_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Comments: parent threading
CREATE INDEX idx_comments_parent
  ON community.comments (parent_comment_id)
  WHERE parent_comment_id IS NOT NULL AND deleted_at IS NULL;

-- Upvotes: count queries
CREATE INDEX idx_upvotes_target
  ON community.upvotes (target_type, target_id);

-- Bookmarks: user's bookmarks list
CREATE INDEX idx_bookmarks_user_created
  ON community.bookmarks (user_id, created_at DESC);

-- Memberships: user's communities
CREATE INDEX idx_memberships_user
  ON community.memberships (user_id);

-- Memberships: community's members
CREATE INDEX idx_memberships_community
  ON community.memberships (community_id);

-- Post ratings: per-post aggregation
CREATE INDEX idx_post_ratings_post
  ON community.post_ratings (post_id);

-- =========================================================
-- TRIGGER: Update denormalized post counters
-- =========================================================

-- Comment count trigger
CREATE OR REPLACE FUNCTION community.update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community.posts SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community.posts SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    -- Soft delete
    UPDATE community.posts SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = NEW.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_comment_count
  AFTER INSERT OR DELETE OR UPDATE OF deleted_at ON community.comments
  FOR EACH ROW EXECUTE FUNCTION community.update_post_comment_count();

-- Rating average/count trigger
CREATE OR REPLACE FUNCTION community.update_post_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE community.posts SET
      rating_avg = sub.avg_rating,
      rating_count = sub.cnt
    FROM (
      SELECT AVG(base_rating)::NUMERIC(3,2) AS avg_rating, COUNT(*) AS cnt
      FROM community.post_ratings WHERE post_id = NEW.post_id
    ) sub
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community.posts SET
      rating_avg = sub.avg_rating,
      rating_count = sub.cnt
    FROM (
      SELECT AVG(base_rating)::NUMERIC(3,2) AS avg_rating, COUNT(*) AS cnt
      FROM community.post_ratings WHERE post_id = OLD.post_id
    ) sub
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_post_rating_stats
  AFTER INSERT OR DELETE OR UPDATE ON community.post_ratings
  FOR EACH ROW EXECUTE FUNCTION community.update_post_rating_stats();

-- Upvote count trigger for posts
CREATE OR REPLACE FUNCTION community.update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE community.posts SET upvote_count = upvote_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE community.comments SET upvote_count = upvote_count + 1
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE community.posts SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE community.comments SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_upvote_count
  AFTER INSERT OR DELETE ON community.upvotes
  FOR EACH ROW EXECUTE FUNCTION community.update_upvote_count();

-- Membership count trigger
CREATE OR REPLACE FUNCTION community.update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community.communities SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community.communities SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.community_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR DELETE ON community.memberships
  FOR EACH ROW EXECUTE FUNCTION community.update_community_member_count();

-- =========================================================
-- EXTEND core.follows to support 'community' followee type
-- =========================================================
ALTER TABLE core.follows DROP CONSTRAINT IF EXISTS follows_followee_type_check;
ALTER TABLE core.follows ADD CONSTRAINT follows_followee_type_check
  CHECK (followee_type IN ('user', 'organization', 'team', 'job', 'community'));

-- =========================================================
-- STORAGE BUCKET: community-media
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,  -- public read for published post media
  52428800,  -- 50MB limit (supports video)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Storage policies: users can manage their own folder
CREATE POLICY community_media_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'community-media');

CREATE POLICY community_media_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY community_media_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY community_media_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
