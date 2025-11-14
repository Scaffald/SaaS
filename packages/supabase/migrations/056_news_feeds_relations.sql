-- =========================================================
-- 056_news_feeds_relations.sql
-- Foreign key relationships for news feed tables
--
-- ROLLBACK INSTRUCTIONS:
--   - ALTER TABLE core.cached_news_articles DROP CONSTRAINT IF EXISTS cached_news_articles_feed_id_fkey;
--   - ALTER TABLE core.cached_news_articles DROP CONSTRAINT IF EXISTS cached_news_articles_industry_id_fkey;
--   - ALTER TABLE core.news_feeds DROP CONSTRAINT IF EXISTS news_feeds_industry_id_fkey;
-- =========================================================

BEGIN;

-- =========================================================
-- News Feeds Foreign Keys
-- =========================================================

ALTER TABLE core.news_feeds
  ADD CONSTRAINT news_feeds_industry_id_fkey
  FOREIGN KEY (industry_id)
  REFERENCES core.industries(id)
  ON DELETE SET NULL;

-- =========================================================
-- Cached News Articles Foreign Keys
-- =========================================================

ALTER TABLE core.cached_news_articles
  ADD CONSTRAINT cached_news_articles_feed_id_fkey
  FOREIGN KEY (feed_id)
  REFERENCES core.news_feeds(id)
  ON DELETE CASCADE;

ALTER TABLE core.cached_news_articles
  ADD CONSTRAINT cached_news_articles_industry_id_fkey
  FOREIGN KEY (industry_id)
  REFERENCES core.industries(id)
  ON DELETE SET NULL;

COMMIT;

