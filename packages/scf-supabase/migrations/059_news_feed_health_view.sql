-- =========================================================
-- 059_news_feed_health_view.sql
-- Feed health monitoring view for news feeds
--
-- ROLLBACK INSTRUCTIONS:
--   - DROP VIEW IF EXISTS core.v_news_feed_health;
-- =========================================================

BEGIN;

-- =========================================================
-- News Feed Health Monitoring View
-- =========================================================
CREATE OR REPLACE VIEW core.v_news_feed_health AS
SELECT
  nf.id,
  nf.name,
  nf.url,
  nf.feed_type,
  nf.category,
  nf.region,
  nf.is_active,
  nf.last_fetched_at,
  nf.last_fetch_status,
  nf.last_error_message,
  COUNT(cna.id) as cached_article_count,
  MAX(cna.pub_date) as latest_article_date,
  MIN(cna.pub_date) as oldest_article_date,
  CASE
    WHEN nf.last_fetch_status = 'success' THEN 'healthy'
    WHEN nf.last_fetch_status = 'failed' THEN 'unhealthy'
    WHEN nf.last_fetch_status = 'partial' THEN 'degraded'
    WHEN nf.last_fetched_at IS NULL THEN 'never_fetched'
    ELSE 'unknown'
  END as health_status,
  CASE
    WHEN nf.last_fetched_at IS NULL THEN NULL
    ELSE EXTRACT(EPOCH FROM (NOW() - nf.last_fetched_at)) / 3600
  END as hours_since_last_fetch
FROM core.news_feeds nf
LEFT JOIN core.cached_news_articles cna ON cna.feed_id = nf.id
GROUP BY nf.id
ORDER BY 
  CASE nf.last_fetch_status
    WHEN 'failed' THEN 1
    WHEN 'partial' THEN 2
    WHEN 'success' THEN 3
    ELSE 4
  END,
  nf.last_fetched_at DESC NULLS LAST;

COMMENT ON VIEW core.v_news_feed_health IS
  'Monitoring view showing health status of all news feeds including last fetch time, status, and cached article counts.';

-- Grant access to authenticated users
GRANT SELECT ON core.v_news_feed_health TO authenticated, anon;

COMMIT;

