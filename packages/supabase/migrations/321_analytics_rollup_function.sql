-- =========================================================
-- 321_analytics_rollup_function.sql
-- Rollup function for daily analytics aggregation + pg_cron
-- Also enables Supabase Realtime on engagement tables
-- =========================================================

BEGIN;

-- =========================================================
-- Rollup function: engagement.rollup_daily_analytics
-- Aggregates raw events into daily rollup tables
-- Designed to be called nightly via pg_cron for previous day
-- =========================================================
CREATE OR REPLACE FUNCTION engagement.rollup_daily_analytics(target_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = engagement, core, public
AS $$
BEGIN
  -- -------------------------------------------------------
  -- Step 1: Aggregate activity_events where user is TARGET
  -- (e.g., profile_view events where target_id is the user)
  -- -------------------------------------------------------
  INSERT INTO engagement.daily_engagement_rollups (user_id, date, event_type, count, unique_actors)
  SELECT
    ae.target_id AS user_id,
    target_date AS date,
    ae.event_type,
    COUNT(*)::integer AS count,
    COUNT(DISTINCT ae.user_id)::integer AS unique_actors
  FROM engagement.activity_events ae
  WHERE ae.target_id IS NOT NULL
    AND ae.occurred_at >= target_date::timestamptz
    AND ae.occurred_at < (target_date + interval '1 day')::timestamptz
    AND ae.event_type IN ('profile_view', 'job_view', 'job_click', 'review_viewed')
  GROUP BY ae.target_id, ae.event_type
  ON CONFLICT (user_id, date, event_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    unique_actors = EXCLUDED.unique_actors,
    updated_at = NOW();

  -- -------------------------------------------------------
  -- Step 2: Aggregate activity_events where user is ACTOR
  -- (e.g., search, application events initiated by user)
  -- -------------------------------------------------------
  INSERT INTO engagement.daily_engagement_rollups (user_id, date, event_type, count, unique_actors)
  SELECT
    ae.user_id,
    target_date AS date,
    ae.event_type,
    COUNT(*)::integer AS count,
    1 AS unique_actors
  FROM engagement.activity_events ae
  WHERE ae.occurred_at >= target_date::timestamptz
    AND ae.occurred_at < (target_date + interval '1 day')::timestamptz
    AND ae.event_type IN ('search', 'filter_change', 'application_start', 'application_complete')
  GROUP BY ae.user_id, ae.event_type
  ON CONFLICT (user_id, date, event_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    unique_actors = EXCLUDED.unique_actors,
    updated_at = NOW();

  -- -------------------------------------------------------
  -- Step 3: Aggregate profile_views into engagement rollups
  -- (separate table, different schema)
  -- -------------------------------------------------------
  INSERT INTO engagement.daily_engagement_rollups (user_id, date, event_type, count, unique_actors)
  SELECT
    pv.viewed_user_id AS user_id,
    target_date AS date,
    'profile_view_direct' AS event_type,
    COUNT(*)::integer AS count,
    COUNT(DISTINCT pv.viewer_user_id)::integer AS unique_actors
  FROM engagement.profile_views pv
  WHERE pv.viewed_at >= target_date::timestamptz
    AND pv.viewed_at < (target_date + interval '1 day')::timestamptz
  GROUP BY pv.viewed_user_id
  ON CONFLICT (user_id, date, event_type)
  DO UPDATE SET
    count = EXCLUDED.count,
    unique_actors = EXCLUDED.unique_actors,
    updated_at = NOW();

  -- -------------------------------------------------------
  -- Step 4: Aggregate search_impressions into visibility rollups
  -- -------------------------------------------------------
  INSERT INTO engagement.daily_visibility_rollups (
    user_id, date, impression_type, impressions, clicks, unique_searchers, top_queries
  )
  SELECT
    si.user_id,
    target_date AS date,
    si.impression_type,
    COUNT(*)::integer AS impressions,
    COUNT(*) FILTER (WHERE si.clicked)::integer AS clicks,
    COUNT(DISTINCT si.searcher_id)::integer AS unique_searchers,
    COALESCE(
      (
        SELECT jsonb_agg(row_to_json(q))
        FROM (
          SELECT sq.search_query AS query, COUNT(*)::integer AS count
          FROM engagement.search_impressions sq
          WHERE sq.user_id = si.user_id
            AND sq.impression_type = si.impression_type
            AND sq.occurred_at >= target_date::timestamptz
            AND sq.occurred_at < (target_date + interval '1 day')::timestamptz
            AND sq.search_query IS NOT NULL
          GROUP BY sq.search_query
          ORDER BY COUNT(*) DESC
          LIMIT 10
        ) q
      ),
      '[]'::jsonb
    ) AS top_queries
  FROM engagement.search_impressions si
  WHERE si.occurred_at >= target_date::timestamptz
    AND si.occurred_at < (target_date + interval '1 day')::timestamptz
  GROUP BY si.user_id, si.impression_type
  ON CONFLICT (user_id, date, impression_type)
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    unique_searchers = EXCLUDED.unique_searchers,
    top_queries = EXCLUDED.top_queries,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION engagement.rollup_daily_analytics(DATE) IS 'Aggregates raw engagement events and search impressions into daily rollup tables. Run nightly via pg_cron.';

-- =========================================================
-- Schedule nightly rollup via pg_cron (02:00 UTC)
-- =========================================================
SELECT cron.schedule(
  'rollup-daily-analytics',
  '0 2 * * *',
  $$SELECT engagement.rollup_daily_analytics(CURRENT_DATE - 1)$$
);

-- =========================================================
-- Enable Supabase Realtime on engagement tables
-- for live analytics updates
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE engagement.profile_views;
ALTER PUBLICATION supabase_realtime ADD TABLE engagement.activity_events;

COMMIT;
