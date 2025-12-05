-- =========================================================
-- 055_news_feeds_schema.sql
-- News feed caching system schema
-- Creates news_feeds and cached_news_articles tables
--
-- ROLLBACK INSTRUCTIONS:
--   - DROP TABLE IF EXISTS core.cached_news_articles;
--   - DROP TABLE IF EXISTS core.news_feeds;
-- =========================================================

BEGIN;

-- =========================================================
-- News Feeds Table
-- Stores RSS feed sources with metadata and configuration
-- =========================================================
CREATE TABLE IF NOT EXISTS core.news_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  feed_type TEXT NOT NULL DEFAULT 'rss' CHECK (feed_type IN ('rss', 'atom')),
  category TEXT, -- 'general', 'technology', 'safety', 'workforce', 'projects', 'sustainability', 'finance', 'equipment'
  region TEXT, -- 'california', 'midwest', etc. (for regional feeds)
  industry_id UUID, -- FK to core.industries(id) in 003_relations.sql
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  last_fetch_status TEXT CHECK (last_fetch_status IN ('success', 'failed', 'partial')),
  last_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.news_feeds IS 'RSS feed sources with metadata and configuration for news caching system';
COMMENT ON COLUMN core.news_feeds.feed_type IS 'Type of feed: rss or atom';
COMMENT ON COLUMN core.news_feeds.category IS 'Feed category for filtering (general, technology, safety, etc.)';
COMMENT ON COLUMN core.news_feeds.region IS 'Geographic region for regional feeds';
COMMENT ON COLUMN core.news_feeds.last_fetch_status IS 'Status of last fetch: success, failed, or partial';

-- =========================================================
-- Cached News Articles Table
-- Stores parsed news articles from RSS feeds
-- =========================================================
CREATE TABLE IF NOT EXISTS core.cached_news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL, -- FK to core.news_feeds(id) in 003_relations.sql
  industry_id UUID, -- FK to core.industries(id) in 003_relations.sql
  guid TEXT NOT NULL, -- Unique identifier from RSS feed
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  pub_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  source_name TEXT NOT NULL, -- Feed name for display
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(feed_id, guid)
);

COMMENT ON TABLE core.cached_news_articles IS 'Cached news articles parsed from RSS feeds';
COMMENT ON COLUMN core.cached_news_articles.guid IS 'Unique identifier from RSS feed (used for deduplication)';
COMMENT ON COLUMN core.cached_news_articles.source_name IS 'Name of the feed source for display purposes';

-- =========================================================
-- Indexes for Performance
-- =========================================================

-- News feeds indexes
CREATE INDEX IF NOT EXISTS idx_news_feeds_active 
  ON core.news_feeds(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_news_feeds_industry 
  ON core.news_feeds(industry_id) 
  WHERE industry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_feeds_last_fetched 
  ON core.news_feeds(last_fetched_at DESC NULLS LAST);

-- Cached news articles indexes
CREATE INDEX IF NOT EXISTS idx_cached_news_industry 
  ON core.cached_news_articles(industry_id) 
  WHERE industry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cached_news_pub_date 
  ON core.cached_news_articles(pub_date DESC);

CREATE INDEX IF NOT EXISTS idx_cached_news_feed 
  ON core.cached_news_articles(feed_id);

CREATE INDEX IF NOT EXISTS idx_cached_news_feed_guid 
  ON core.cached_news_articles(feed_id, guid);

COMMIT;

