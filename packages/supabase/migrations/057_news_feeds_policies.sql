-- =========================================================
-- 057_news_feeds_policies.sql
-- Row Level Security policies for news feed tables
--
-- ROLLBACK INSTRUCTIONS:
--   - DROP POLICY IF EXISTS news_feeds_public_read ON core.news_feeds;
--   - DROP POLICY IF EXISTS news_feeds_office_manage ON core.news_feeds;
--   - DROP POLICY IF EXISTS cached_news_articles_public_read ON core.cached_news_articles;
--   - DROP POLICY IF EXISTS cached_news_articles_service_role ON core.cached_news_articles;
--   - ALTER TABLE core.news_feeds DISABLE ROW LEVEL SECURITY;
--   - ALTER TABLE core.cached_news_articles DISABLE ROW LEVEL SECURITY;
-- =========================================================

BEGIN;

-- =========================================================
-- Enable RLS on news feed tables
-- =========================================================

ALTER TABLE core.news_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.cached_news_articles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- News Feeds Policies
-- =========================================================

-- Public read access to active feeds
DROP POLICY IF EXISTS news_feeds_public_read ON core.news_feeds;
CREATE POLICY news_feeds_public_read
  ON core.news_feeds
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Office users can manage feeds (all operations)
DROP POLICY IF EXISTS news_feeds_office_manage ON core.news_feeds;
CREATE POLICY news_feeds_office_manage
  ON core.news_feeds
  FOR ALL
  TO authenticated
  USING (core.user_has_role(auth.uid(), 'office'))
  WITH CHECK (core.user_has_role(auth.uid(), 'office'));

-- Service role has full access (for cron jobs)
GRANT ALL ON core.news_feeds TO service_role;

-- =========================================================
-- Cached News Articles Policies
-- =========================================================

-- Public read access to all cached articles
DROP POLICY IF EXISTS cached_news_articles_public_read ON core.cached_news_articles;
CREATE POLICY cached_news_articles_public_read
  ON core.cached_news_articles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Service role can insert/update/delete (for cron job)
DROP POLICY IF EXISTS cached_news_articles_service_role ON core.cached_news_articles;
CREATE POLICY cached_news_articles_service_role
  ON core.cached_news_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

