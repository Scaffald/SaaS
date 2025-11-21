-- =========================================================
-- 135_req_254_engagement_schema.sql
-- Create engagement schema and profile_views table for user-to-user connection and follow system
-- =========================================================

BEGIN;

-- =========================================================
-- Create engagement schema
-- =========================================================
CREATE SCHEMA IF NOT EXISTS engagement;
COMMENT ON SCHEMA engagement IS 'User engagement tracking and analytics for AI recommendations';
ALTER SCHEMA engagement OWNER TO postgres;

GRANT USAGE ON SCHEMA engagement TO authenticated;
GRANT ALL ON SCHEMA engagement TO service_role;

-- =========================================================
-- Create profile_views table
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Viewer information (nullable for anonymous/unauthenticated views)
  viewer_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  viewed_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- View metadata
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewer_industry_id UUID REFERENCES core.industries(id) ON DELETE SET NULL,
  viewer_role_type TEXT, -- Primary user type (worker/employer/customer)
  session_id TEXT,
  referrer_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Additional context (device type, location, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE engagement.profile_views IS 'Tracks when users view other users profiles for engagement analytics';
COMMENT ON COLUMN engagement.profile_views.viewer_user_id IS 'User who viewed the profile, nullable for anonymous tracking consideration';
COMMENT ON COLUMN engagement.profile_views.viewed_user_id IS 'User whose profile was viewed, required';
COMMENT ON COLUMN engagement.profile_views.viewer_industry_id IS 'Viewer industry for anonymized analytics';
COMMENT ON COLUMN engagement.profile_views.viewer_role_type IS 'Viewer primary user type (worker/employer/customer)';
COMMENT ON COLUMN engagement.profile_views.session_id IS 'Session identifier for deduplication';
COMMENT ON COLUMN engagement.profile_views.metadata IS 'Additional context like device type, location, etc.';

-- =========================================================
-- Indexes for common query patterns
-- =========================================================

-- Index for recent views of a specific user (most common query)
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_recent
  ON engagement.profile_views (viewed_user_id, viewed_at DESC);

-- Index for user's viewing history
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_history
  ON engagement.profile_views (viewer_user_id, viewed_at DESC)
  WHERE viewer_user_id IS NOT NULL;

-- Partial index for 30-day analytics (recent views only)
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_30d
  ON engagement.profile_views (viewed_user_id)
  WHERE viewed_at > NOW() - INTERVAL '30 days';

-- =========================================================
-- Unique constraint to prevent duplicate views within same session/day
-- =========================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_dedupe
  ON engagement.profile_views (
    COALESCE(viewer_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    viewed_user_id,
    COALESCE(session_id, ''),
    DATE(viewed_at)
  )
  WHERE viewer_user_id IS NOT NULL OR session_id IS NOT NULL;

-- =========================================================
-- RLS Policies
-- =========================================================
ALTER TABLE engagement.profile_views ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own views (as viewer or viewed)
DROP POLICY IF EXISTS profile_views_select_own ON engagement.profile_views;
CREATE POLICY profile_views_select_own
  ON engagement.profile_views
  FOR SELECT
  TO authenticated
  USING (
    viewer_user_id = auth.uid()
    OR viewed_user_id = auth.uid()
  );

-- Authenticated users can INSERT profile views
DROP POLICY IF EXISTS profile_views_insert_authenticated ON engagement.profile_views;
CREATE POLICY profile_views_insert_authenticated
  ON engagement.profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role has full access for analytics processing
DROP POLICY IF EXISTS profile_views_service_full_access ON engagement.profile_views;
CREATE POLICY profile_views_service_full_access
  ON engagement.profile_views
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Updated timestamp trigger (for future updates if needed)
-- =========================================================
-- Note: profile_views is append-only, but we add updated_at support for consistency
ALTER TABLE engagement.profile_views
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS profile_views_set_updated_at ON engagement.profile_views;
CREATE TRIGGER profile_views_set_updated_at
  BEFORE UPDATE ON engagement.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Create activity_events table
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event information
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_type TEXT, -- Type of entity being engaged with (user, job, organization)
  target_id UUID,
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Event-specific data
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE engagement.activity_events IS 'Tracks all user engagement events for AI recommendation engine';
COMMENT ON COLUMN engagement.activity_events.user_id IS 'User who performed the action, required';
COMMENT ON COLUMN engagement.activity_events.event_type IS 'Type of engagement event (profile.viewed, connection.requested, connection.accepted, connection.declined, user.followed, user.unfollowed, job.viewed, application.started, application.submitted, skill.searched, occupation.searched, review.viewed, review.submitted)';
COMMENT ON COLUMN engagement.activity_events.target_type IS 'Type of entity being engaged with (user, job, organization)';
COMMENT ON COLUMN engagement.activity_events.target_id IS 'ID of the target entity';
COMMENT ON COLUMN engagement.activity_events.event_metadata IS 'Event-specific data stored as JSONB';

-- =========================================================
-- Indexes for activity_events
-- =========================================================

-- Index for user activity timeline (most common query)
CREATE INDEX IF NOT EXISTS idx_activity_events_user_timeline
  ON engagement.activity_events (user_id, occurred_at DESC);

-- Index for event-type analytics
CREATE INDEX IF NOT EXISTS idx_activity_events_type_timeline
  ON engagement.activity_events (event_type, occurred_at DESC);

-- Index for target-specific analytics
CREATE INDEX IF NOT EXISTS idx_activity_events_target
  ON engagement.activity_events (target_type, target_id, occurred_at DESC)
  WHERE target_type IS NOT NULL AND target_id IS NOT NULL;

-- Partial index for recent patterns (90-day window)
CREATE INDEX IF NOT EXISTS idx_activity_events_user_type_recent
  ON engagement.activity_events (user_id, event_type)
  WHERE occurred_at > NOW() - INTERVAL '90 days';

-- =========================================================
-- RLS Policies for activity_events
-- =========================================================
ALTER TABLE engagement.activity_events ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own events
DROP POLICY IF EXISTS activity_events_select_own ON engagement.activity_events;
CREATE POLICY activity_events_select_own
  ON engagement.activity_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can INSERT events
DROP POLICY IF EXISTS activity_events_insert_authenticated ON engagement.activity_events;
CREATE POLICY activity_events_insert_authenticated
  ON engagement.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role has full access for analytics processing
DROP POLICY IF EXISTS activity_events_service_full_access ON engagement.activity_events;
CREATE POLICY activity_events_service_full_access
  ON engagement.activity_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Create connection_analytics table
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.connection_analytics (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Connection metrics
  connections_count INTEGER NOT NULL DEFAULT 0 CHECK (connections_count >= 0),
  pending_sent_count INTEGER NOT NULL DEFAULT 0 CHECK (pending_sent_count >= 0),
  pending_received_count INTEGER NOT NULL DEFAULT 0 CHECK (pending_received_count >= 0),
  
  -- Follow metrics
  followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
  following_count INTEGER NOT NULL DEFAULT 0 CHECK (following_count >= 0),
  
  -- Profile view metrics
  profile_views_30d INTEGER NOT NULL DEFAULT 0 CHECK (profile_views_30d >= 0),
  profile_views_total INTEGER NOT NULL DEFAULT 0 CHECK (profile_views_total >= 0),
  last_profile_view_at TIMESTAMPTZ,
  
  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE engagement.connection_analytics IS 'Aggregated connection/follow metrics for quick retrieval';
COMMENT ON COLUMN engagement.connection_analytics.connections_count IS 'Total mutual connections';
COMMENT ON COLUMN engagement.connection_analytics.pending_sent_count IS 'Connection requests sent, awaiting response';
COMMENT ON COLUMN engagement.connection_analytics.pending_received_count IS 'Connection requests received, awaiting action';
COMMENT ON COLUMN engagement.connection_analytics.followers_count IS 'Users following this user';
COMMENT ON COLUMN engagement.connection_analytics.following_count IS 'Users this user is following';
COMMENT ON COLUMN engagement.connection_analytics.profile_views_30d IS 'Profile views in last 30 days';
COMMENT ON COLUMN engagement.connection_analytics.profile_views_total IS 'Total profile views';
COMMENT ON COLUMN engagement.connection_analytics.last_profile_view_at IS 'Most recent profile view timestamp';
COMMENT ON COLUMN engagement.connection_analytics.updated_at IS 'Last metrics update timestamp';

-- =========================================================
-- Indexes for connection_analytics
-- =========================================================

-- Index for identifying stale metrics
CREATE INDEX IF NOT EXISTS idx_connection_analytics_updated_at
  ON engagement.connection_analytics (updated_at);

-- =========================================================
-- RLS Policies for connection_analytics
-- =========================================================
ALTER TABLE engagement.connection_analytics ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own analytics
DROP POLICY IF EXISTS connection_analytics_select_own ON engagement.connection_analytics;
CREATE POLICY connection_analytics_select_own
  ON engagement.connection_analytics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role has full access for analytics processing
DROP POLICY IF EXISTS connection_analytics_service_full_access ON engagement.connection_analytics;
CREATE POLICY connection_analytics_service_full_access
  ON engagement.connection_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Updated timestamp trigger for connection_analytics
-- =========================================================
DROP TRIGGER IF EXISTS connection_analytics_set_updated_at ON engagement.connection_analytics;
CREATE TRIGGER connection_analytics_set_updated_at
  BEFORE UPDATE ON engagement.connection_analytics
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

COMMIT;

