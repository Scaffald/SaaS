-- =========================================================
-- 320_analytics_rollup_tables.sql
-- Analytics rollup tables for dashboard analytics section
-- Provides pre-aggregated daily engagement metrics and
-- search impression tracking for visibility analytics
-- =========================================================

BEGIN;

-- =========================================================
-- Table 1: daily_engagement_rollups
-- Pre-aggregated daily counts per user per event type
-- Powers timeline charts without scanning full activity_events
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.daily_engagement_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  unique_actors INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date, event_type)
);

COMMENT ON TABLE engagement.daily_engagement_rollups IS 'Pre-aggregated daily engagement counts per user per event type for analytics dashboard';
COMMENT ON COLUMN engagement.daily_engagement_rollups.user_id IS 'User these metrics are about (the target of engagement)';
COMMENT ON COLUMN engagement.daily_engagement_rollups.event_type IS 'Type of engagement event (profile_view, job_view, application_start, etc.)';
COMMENT ON COLUMN engagement.daily_engagement_rollups.count IS 'Total number of events for this user/date/type';
COMMENT ON COLUMN engagement.daily_engagement_rollups.unique_actors IS 'Distinct actors who triggered this event type';
COMMENT ON COLUMN engagement.daily_engagement_rollups.metadata IS 'Reserved for future breakdowns (e.g. by source, device)';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_daily_engagement_rollups_user_date
  ON engagement.daily_engagement_rollups (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_engagement_rollups_user_type_date
  ON engagement.daily_engagement_rollups (user_id, event_type, date DESC);

-- RLS
ALTER TABLE engagement.daily_engagement_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_engagement_rollups_select_own ON engagement.daily_engagement_rollups;
CREATE POLICY daily_engagement_rollups_select_own
  ON engagement.daily_engagement_rollups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS daily_engagement_rollups_service_full ON engagement.daily_engagement_rollups;
CREATE POLICY daily_engagement_rollups_service_full
  ON engagement.daily_engagement_rollups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
DROP TRIGGER IF EXISTS daily_engagement_rollups_set_updated_at ON engagement.daily_engagement_rollups;
CREATE TRIGGER daily_engagement_rollups_set_updated_at
  BEFORE UPDATE ON engagement.daily_engagement_rollups
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Table 2: search_impressions
-- Track when a user's profile appears in search results,
-- recommendations, or feed listings
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.search_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  searcher_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  impression_type TEXT NOT NULL,
  search_query TEXT,
  search_filters JSONB,
  position INTEGER,
  clicked BOOLEAN NOT NULL DEFAULT false,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE engagement.search_impressions IS 'Tracks when a user profile appears in search results or recommendation feeds';
COMMENT ON COLUMN engagement.search_impressions.user_id IS 'User whose profile appeared in results';
COMMENT ON COLUMN engagement.search_impressions.searcher_id IS 'User who performed the search (null for anonymous)';
COMMENT ON COLUMN engagement.search_impressions.impression_type IS 'search_result, recommendation, or feed_appearance';
COMMENT ON COLUMN engagement.search_impressions.search_query IS 'Search terms that produced this impression';
COMMENT ON COLUMN engagement.search_impressions.search_filters IS 'Filter criteria applied during search';
COMMENT ON COLUMN engagement.search_impressions.position IS 'Rank position in the result set';
COMMENT ON COLUMN engagement.search_impressions.clicked IS 'Whether the searcher clicked through to this profile';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_impressions_user_time
  ON engagement.search_impressions (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_impressions_user_type_time
  ON engagement.search_impressions (user_id, impression_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_impressions_query_time
  ON engagement.search_impressions (search_query, occurred_at DESC)
  WHERE search_query IS NOT NULL;

-- RLS
ALTER TABLE engagement.search_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS search_impressions_select_own ON engagement.search_impressions;
CREATE POLICY search_impressions_select_own
  ON engagement.search_impressions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS search_impressions_insert_authenticated ON engagement.search_impressions;
CREATE POLICY search_impressions_insert_authenticated
  ON engagement.search_impressions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS search_impressions_service_full ON engagement.search_impressions;
CREATE POLICY search_impressions_service_full
  ON engagement.search_impressions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Table 3: daily_visibility_rollups
-- Daily aggregation of search impressions for visibility charts
-- =========================================================
CREATE TABLE IF NOT EXISTS engagement.daily_visibility_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impression_type TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_searchers INTEGER NOT NULL DEFAULT 0,
  top_queries JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date, impression_type)
);

COMMENT ON TABLE engagement.daily_visibility_rollups IS 'Daily aggregation of search impressions for visibility analytics';
COMMENT ON COLUMN engagement.daily_visibility_rollups.top_queries IS 'Array of {query, count} for the top search terms';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_visibility_rollups_user_date
  ON engagement.daily_visibility_rollups (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_visibility_rollups_user_type_date
  ON engagement.daily_visibility_rollups (user_id, impression_type, date DESC);

-- RLS
ALTER TABLE engagement.daily_visibility_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_visibility_rollups_select_own ON engagement.daily_visibility_rollups;
CREATE POLICY daily_visibility_rollups_select_own
  ON engagement.daily_visibility_rollups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS daily_visibility_rollups_service_full ON engagement.daily_visibility_rollups;
CREATE POLICY daily_visibility_rollups_service_full
  ON engagement.daily_visibility_rollups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
DROP TRIGGER IF EXISTS daily_visibility_rollups_set_updated_at ON engagement.daily_visibility_rollups;
CREATE TRIGGER daily_visibility_rollups_set_updated_at
  BEFORE UPDATE ON engagement.daily_visibility_rollups
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Grant permissions to authenticated and service_role
-- =========================================================
GRANT SELECT ON engagement.daily_engagement_rollups TO authenticated;
GRANT ALL ON engagement.daily_engagement_rollups TO service_role;

GRANT SELECT, INSERT ON engagement.search_impressions TO authenticated;
GRANT ALL ON engagement.search_impressions TO service_role;

GRANT SELECT ON engagement.daily_visibility_rollups TO authenticated;
GRANT ALL ON engagement.daily_visibility_rollups TO service_role;

COMMIT;
