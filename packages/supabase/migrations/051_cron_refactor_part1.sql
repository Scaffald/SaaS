-- =========================================================
-- 051_cron_refactor_part1.sql
-- Replaces HTTP-based cron jobs with SQL functions (part 1)
--
-- ROLLBACK INSTRUCTIONS:
--   - Re-run legacy cron setup in packages/supabase/migrations-old/044_setup_job_import_cron.sql
--     and reapply notification cron scheduling from 025_req_89_notifications_expansion.sql
--   - DROP the functions created in this migration if they must be removed:
--       DROP FUNCTION IF EXISTS core.process_weekly_digest();
--       DROP FUNCTION IF EXISTS core.process_daily_digest();
--       DROP FUNCTION IF EXISTS core.process_notification_queue();
--       DROP FUNCTION IF EXISTS core.record_delivery_event(UUID,BIGINT,TEXT,TEXT,JSONB);
--       DROP FUNCTION IF EXISTS core.calculate_next_attempt(INTEGER);
--       DROP FUNCTION IF EXISTS core.import_external_jobs();
--       DROP FUNCTION IF EXISTS core.map_job_to_industry(TEXT,TEXT,TEXT);
-- =========================================================

BEGIN;

-- Ensure required extensions exist (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;

-- Unschedule legacy HTTP-based cron jobs so they can be replaced with SQL versions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'import-external-jobs') THEN
      PERFORM cron.unschedule('import-external-jobs');
    END IF;

    -- Workers
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-send-worker') THEN
      PERFORM cron.unschedule('notifications-send-worker');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-check-receipts') THEN
      PERFORM cron.unschedule('notifications-check-receipts');
    END IF;

    -- Digest variants (legacy and new naming)
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-digest-daily') THEN
      PERFORM cron.unschedule('notifications-digest-daily');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-digest-daily') THEN
      PERFORM cron.unschedule('notify-digest-daily');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-digest-weekly') THEN
      PERFORM cron.unschedule('notifications-digest-weekly');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-digest-weekly') THEN
      PERFORM cron.unschedule('notify-digest-weekly');
    END IF;
  END IF;
END;
$$;

-- Temporary helper stub; will be replaced with full implementation in 053_cron_refactor_scheduling.sql
CREATE OR REPLACE FUNCTION core.notify_admins_of_cron_failure(
  p_job_name TEXT,
  p_error_message TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = core, public
AS $$
BEGIN
  RAISE WARNING 'Cron job % reported: %', p_job_name, p_error_message;
  RETURN 0;
END;
$$;

COMMENT ON FUNCTION core.notify_admins_of_cron_failure(TEXT, TEXT) IS
  'Stub for admin notification helper; replaced with full implementation in later migration.';

-- =========================================================
-- Helper: map job content to an industry
-- =========================================================
CREATE OR REPLACE FUNCTION core.map_job_to_industry(
  p_title TEXT,
  p_description TEXT,
  p_category TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = core, public
AS $$
DECLARE
  v_text TEXT;
  v_industry_id UUID;
  v_patterns CONSTANT JSONB := jsonb_build_object(
    'construction', 'construction|builder|contractor|carpenter|framing',
    'electrical', 'electrician|electrical|wiring|power systems',
    'plumbing', 'plumber|plumbing|pipefitting|hvac|boiler',
    'information_technology', 'developer|software|engineer|it|programmer|sysadmin',
    'manufacturing', 'manufacturing|assembly|plant|machinist|production',
    'healthcare', 'nurse|clinical|medical|healthcare|patient care',
    'hospitality', 'hospitality|hotel|restaurant|culinary|chef'
  );
BEGIN
  v_text := lower(coalesce(p_title, '') || ' ' || coalesce(p_description, '') || ' ' || coalesce(p_category, ''));

  -- Match explicit industry by slug if present
  SELECT i.id
    INTO v_industry_id
  FROM core.industries i
  WHERE lower(coalesce(i.slug, '')) <> ''
    AND v_text LIKE '%' || lower(i.slug) || '%'
  LIMIT 1;

  IF v_industry_id IS NOT NULL THEN
    RETURN v_industry_id;
  END IF;

  -- Regex match using heuristics
  FOR v_industry_id IN
    SELECT i.id
    FROM core.industries i
    CROSS JOIN LATERAL jsonb_each_text(v_patterns) AS pattern(slug, expr)
    WHERE i.slug = pattern.slug
      AND v_text ~* pattern.expr
    LIMIT 1
  LOOP
    RETURN v_industry_id;
  END LOOP;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION core.map_job_to_industry(TEXT, TEXT, TEXT) IS
  'Maps external job content to an industry using heuristics; returns matching industry UUID or NULL.';

-- =========================================================
-- Job Import Orchestrator (pg_net + XML parsing)
-- =========================================================
CREATE OR REPLACE FUNCTION core.import_external_jobs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_feed RECORD;
  v_response net.http_response;
  v_body_xml XML;
  v_items XML[];
  v_item XML;
  v_processed_count INTEGER := 0;
  v_imported_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_job_title TEXT;
  v_job_guid TEXT;
  v_job_link TEXT;
  v_job_description TEXT;
  v_job_pubdate TIMESTAMPTZ;
  v_industry_id UUID;
  v_inserted BOOLEAN;
  v_job_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  RAISE NOTICE 'Starting external job import at %', v_now;

  FOR v_feed IN
    SELECT f.id,
           f.url,
           f.feed_type,
           f.parser_config,
           f.is_active
      FROM core.external_job_feeds f
     WHERE f.is_active = true
  LOOP
    BEGIN
      SELECT *
        INTO v_response
      FROM net.http_get(
        url := v_feed.url,
        headers := jsonb_build_object(
          'User-Agent', 'SCF-Job-Importer/2.0'
        )
      );

      IF v_response.status >= 400 THEN
        RAISE WARNING 'Feed % returned HTTP status %', v_feed.id, v_response.status;
        v_error_count := v_error_count + 1;

        UPDATE core.external_job_feeds
           SET last_fetched_at = NOW(),
               error_count = coalesce(error_count, 0) + 1,
               last_error = format('HTTP %s: %s', v_response.status, substr(v_response.body, 1, 250)),
               updated_at = NOW()
         WHERE id = v_feed.id;

        PERFORM core.notify_admins_of_cron_failure(
          'import-external-jobs',
          format('Feed %s returned HTTP status %s', v_feed.url, v_response.status)
        );
        CONTINUE;
      END IF;

      v_body_xml := NULL;
      IF v_response.body IS NOT NULL THEN
        v_body_xml := xmlparse(document COALESCE(v_response.body, ''));
      END IF;

      IF v_body_xml IS NULL THEN
        RAISE WARNING 'Feed % produced empty body', v_feed.id;
        v_error_count := v_error_count + 1;
        UPDATE core.external_job_feeds
           SET last_fetched_at = NOW(),
               error_count = coalesce(error_count, 0) + 1,
               last_error = 'Empty feed response',
               updated_at = NOW()
         WHERE id = v_feed.id;
        PERFORM core.notify_admins_of_cron_failure(
          'import-external-jobs',
          format('Feed %s returned no parsable XML', v_feed.url)
        );
        CONTINUE;
      END IF;

      v_items := xpath('//item', v_body_xml);

      FOREACH v_item IN ARRAY v_items
      LOOP
        v_processed_count := v_processed_count + 1;

        v_job_title := COALESCE((xpath('string(./title)', v_item))[1]::text, 'Untitled');
        v_job_guid := COALESCE((xpath('string(./guid)', v_item))[1]::text, (xpath('string(./link)', v_item))[1]::text);
        v_job_link := COALESCE((xpath('string(./link)', v_item))[1]::text, (xpath('string(./guid)', v_item))[1]::text);
        v_job_description := (xpath('string(./description)', v_item))[1]::text;

        BEGIN
          v_job_pubdate := NULL;
          IF (xpath('string(./pubDate)', v_item))[1] IS NOT NULL THEN
            v_job_pubdate := (xpath('string(./pubDate)', v_item))[1]::timestamptz;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          v_job_pubdate := NULL;
        END;

        IF v_job_guid IS NULL OR length(trim(v_job_guid)) = 0 THEN
          v_job_guid := md5(coalesce(v_job_title, '') || coalesce(v_job_link, '') || coalesce(v_job_description, ''));
        END IF;

        v_industry_id := core.map_job_to_industry(v_job_title, v_job_description, NULL);

        INSERT INTO core.external_jobs AS ej (
          id,
          feed_id,
          external_guid,
          title,
          description,
          external_url,
          application_url,
          posted_date,
          is_active,
          raw_data,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          v_feed.id,
          v_job_guid,
          v_job_title,
          v_job_description,
          v_job_link,
          v_job_link,
          v_job_pubdate,
          true,
          jsonb_build_object(
            'feed_id', v_feed.id,
            'fetched_at', NOW(),
            'source', v_feed.url
          ),
          NOW()
        )
        ON CONFLICT (feed_id, external_guid)
        DO UPDATE
          SET title = EXCLUDED.title,
              description = EXCLUDED.description,
              external_url = EXCLUDED.external_url,
              application_url = COALESCE(EXCLUDED.application_url, core.external_jobs.application_url),
              posted_date = COALESCE(EXCLUDED.posted_date, core.external_jobs.posted_date),
              is_active = true,
              updated_at = NOW(),
              raw_data = core.external_jobs.raw_data || EXCLUDED.raw_data
        RETURNING id, (xmax = 0) INTO v_job_id, v_inserted;

        IF v_inserted THEN
          v_imported_count := v_imported_count + 1;
        END IF;

        IF v_industry_id IS NOT NULL THEN
          INSERT INTO core.external_job_industries (external_job_id, industry_id, confidence_score, mapped_by, created_at)
          VALUES (v_job_id, v_industry_id, 0.8, 'rule', NOW())
          ON CONFLICT (external_job_id, industry_id)
          DO UPDATE
            SET confidence_score = GREATEST(core.external_job_industries.confidence_score, 0.8),
                mapped_by = 'rule';
        END IF;

      END LOOP;

      UPDATE core.external_job_feeds
         SET last_fetched_at = NOW(),
             last_success_at = NOW(),
             error_count = 0,
             last_error = NULL,
             updated_at = NOW()
       WHERE id = v_feed.id;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;

      UPDATE core.external_job_feeds
         SET last_fetched_at = NOW(),
             error_count = coalesce(error_count, 0) + 1,
             last_error = left(SQLERRM, 250),
             updated_at = NOW()
       WHERE id = v_feed.id;

      PERFORM core.notify_admins_of_cron_failure(
        'import-external-jobs',
        format('Feed %s processing error: %s', v_feed.url, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'External job import finished. Processed: %, Imported: %, Errors: %',
    v_processed_count, v_imported_count, v_error_count;

  RETURN jsonb_build_object(
    'processed', v_processed_count,
    'imported', v_imported_count,
    'errors', v_error_count
  );
END;
$$;

COMMENT ON FUNCTION core.import_external_jobs() IS
  'Fetches active external job feeds via pg_net, parses RSS XML, upserts jobs, maps industries, and returns summary counts.';

-- =========================================================
-- Notification queue helper functions
-- =========================================================
CREATE OR REPLACE FUNCTION core.calculate_next_attempt(
  p_attempts INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = core, public
AS $$
DECLARE
  v_delay_minutes INTEGER;
  v_max_attempts CONSTANT INTEGER := 5;
BEGIN
  IF p_attempts IS NULL OR p_attempts < 0 THEN
    RETURN NOW() + INTERVAL '1 minute';
  END IF;

  IF p_attempts >= v_max_attempts THEN
    RETURN NULL;
  END IF;

  v_delay_minutes := GREATEST(1, CAST(POWER(2, p_attempts) AS INTEGER));

  RETURN NOW() + (v_delay_minutes || ' minutes')::INTERVAL;
END;
$$;

COMMENT ON FUNCTION core.calculate_next_attempt(INTEGER) IS
  'Returns next retry timestamp using exponential backoff (1,2,4,8,16 minutes).';

CREATE OR REPLACE FUNCTION core.record_delivery_event(
  p_notification_id UUID,
  p_delivery_id BIGINT,
  p_channel TEXT,
  p_event TEXT,
  p_meta JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  INSERT INTO core.notification_events (
    notification_id,
    delivery_id,
    channel,
    event,
    meta,
    occurred_at
  )
  VALUES (
    p_notification_id,
    p_delivery_id,
    p_channel::core.notification_channel,
    p_event::core.notification_event_kind,
    p_meta,
    NOW()
  );
END;
$$;

COMMENT ON FUNCTION core.record_delivery_event(UUID, BIGINT, TEXT, TEXT, JSONB) IS
  'Records lifecycle events for notification deliveries into core.notification_events.';

CREATE OR REPLACE FUNCTION core.process_notification_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_delivery RECORD;
  v_processed INTEGER := 0;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  RAISE NOTICE 'Processing notification queue at %', NOW();

  FOR v_delivery IN
    SELECT nd.id,
           nd.notification_id,
           nd.channel,
           nd.status,
           nd.attempts,
           nd.next_attempt_at,
           n.type,
           n.user_id,
           n.metadata
      FROM core.notification_deliveries nd
      JOIN core.notifications n ON n.id = nd.notification_id
     WHERE nd.status IN ('queued', 'sending')
       AND (nd.next_attempt_at IS NULL OR nd.next_attempt_at <= NOW())
     ORDER BY nd.created_at ASC
     LIMIT 200
  LOOP
    BEGIN
      UPDATE core.notification_deliveries
         SET status = 'sending',
             attempts = nd.attempts + 1,
             last_error = NULL,
             updated_at = NOW()
       WHERE id = v_delivery.id;

      -- Placeholder for adapter invocation (handled externally)
      PERFORM core.record_delivery_event(
        v_delivery.notification_id,
        v_delivery.id,
        v_delivery.channel::TEXT,
        'accepted',
        jsonb_build_object('note', 'Queued by SQL processor')
      );

      v_next_attempt := core.calculate_next_attempt(v_delivery.attempts);

      UPDATE core.notification_deliveries
         SET status = CASE
                        WHEN v_next_attempt IS NULL THEN 'failed'
                        ELSE 'queued'
                      END,
             next_attempt_at = v_next_attempt,
             updated_at = NOW()
       WHERE id = v_delivery.id;

      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE core.notification_deliveries
         SET status = 'failed',
             last_error = left(SQLERRM, 250),
             updated_at = NOW()
       WHERE id = v_delivery.id;

      PERFORM core.record_delivery_event(
        v_delivery.notification_id,
        v_delivery.id,
        v_delivery.channel::TEXT,
        'failed',
        jsonb_build_object('error', SQLERRM)
      );

      PERFORM core.notify_admins_of_cron_failure(
        'notifications-send-worker',
        format('Delivery %s failed: %s', v_delivery.id, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'Notification queue processing complete. Processed: %', v_processed;
  RETURN v_processed;
END;
$$;

COMMENT ON FUNCTION core.process_notification_queue() IS
  'Processes up to 200 pending notification deliveries, manages retry scheduling, and records delivery events.';

CREATE OR REPLACE FUNCTION core.check_notification_receipts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_delivery RECORD;
  v_event RECORD;
  v_processed INTEGER := 0;
  v_next_attempt TIMESTAMPTZ;
BEGIN
  RAISE NOTICE 'Checking notification receipts at %', NOW();

  FOR v_delivery IN
    SELECT
      nd.id,
      nd.notification_id,
      nd.status,
      nd.provider,
      nd.provider_msg_id,
      nd.attempts
    FROM core.notification_deliveries nd
    WHERE nd.status IN ('sending','sent')
      AND nd.provider_msg_id IS NOT NULL
    ORDER BY nd.updated_at ASC
    LIMIT 200
  LOOP
    SELECT ne.event, ne.meta, ne.occurred_at
      INTO v_event
    FROM core.notification_events ne
    WHERE ne.delivery_id = v_delivery.id
    ORDER BY ne.occurred_at DESC
    LIMIT 1;

    IF v_event.event IS NULL THEN
      -- No receipt yet; schedule a recheck
      v_next_attempt := NOW() + INTERVAL '15 minutes';
      UPDATE core.notification_deliveries
         SET next_attempt_at = v_next_attempt,
             updated_at = NOW()
       WHERE id = v_delivery.id;
      CONTINUE;
    END IF;

    IF v_event.event IN ('delivered','opened','clicked') THEN
      UPDATE core.notification_deliveries
         SET status = 'delivered',
             last_error = NULL,
             updated_at = NOW()
       WHERE id = v_delivery.id;
    ELSIF v_event.event IN ('failed','bounce','complaint') THEN
      UPDATE core.notification_deliveries
         SET status = 'failed',
             last_error = COALESCE(v_event.meta->>'error', 'Delivery failure reported by provider'),
             updated_at = NOW()
       WHERE id = v_delivery.id;

      PERFORM core.notify_admins_of_cron_failure(
        'notifications-check-receipts',
        format(
          'Delivery %s reported failure event %s',
          v_delivery.id,
          v_event.event
        )
      );
    ELSE
      -- Still pending; schedule another check
      v_next_attempt := NOW() + INTERVAL '30 minutes';
      UPDATE core.notification_deliveries
         SET next_attempt_at = v_next_attempt,
             updated_at = NOW()
       WHERE id = v_delivery.id;
    END IF;

    v_processed := v_processed + 1;
  END LOOP;

  RAISE NOTICE 'Notification receipt check complete. Processed: %', v_processed;
  RETURN v_processed;
END;
$$;

COMMENT ON FUNCTION core.check_notification_receipts() IS
  'Evaluates provider delivery events to update notification delivery statuses.';

-- =========================================================
-- Notification digest processors
-- =========================================================
CREATE OR REPLACE FUNCTION core.process_daily_digest()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_entry RECORD;
  v_created INTEGER := 0;
  v_notification_id UUID;
BEGIN
  RAISE NOTICE 'Starting daily digest processing at %', NOW();

  FOR v_entry IN
    SELECT ndq.user_id,
           COUNT(*) AS bucket_count,
           jsonb_agg(
             jsonb_build_object(
               'type', ndq.type,
               'count', ndq.count,
               'channels', ndq.channels,
               'examples', ndq.examples
             )
           ) AS digest_payload
      FROM core.notification_digest_queue ndq
      JOIN core.notification_preferences prefs ON prefs.user_id = ndq.user_id
     WHERE ndq.bucket = 'daily'
       AND ndq.processed_at IS NULL
       AND prefs.digest_frequency = 'digest_daily'
     GROUP BY ndq.user_id
  LOOP
    BEGIN
      INSERT INTO core.notifications (
        id,
        user_id,
        type,
        title,
        message,
        metadata,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        v_entry.user_id,
        'system.digest_daily',
        'Your Daily Digest',
        format('You have %s new updates from the last day', v_entry.bucket_count),
        jsonb_build_object(
          'digest_type', 'daily',
          'items', v_entry.digest_payload
        ),
        NOW()
      )
      RETURNING id INTO v_notification_id;

      UPDATE core.notification_digest_queue
         SET processed_at = NOW(),
             updated_at = NOW()
       WHERE user_id = v_entry.user_id
         AND bucket = 'daily'
         AND processed_at IS NULL;

      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      PERFORM core.notify_admins_of_cron_failure(
        'notify-digest-daily',
        format('Failed to create daily digest for user %s: %s', v_entry.user_id, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'Daily digest processing complete. Created: %', v_created;
  RETURN v_created;
END;
$$;

COMMENT ON FUNCTION core.process_daily_digest() IS
  'Aggregates daily notification digest entries and creates consolidated notifications.';

CREATE OR REPLACE FUNCTION core.process_weekly_digest()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_entry RECORD;
  v_created INTEGER := 0;
  v_notification_id UUID;
BEGIN
  RAISE NOTICE 'Starting weekly digest processing at %', NOW();

  FOR v_entry IN
    SELECT ndq.user_id,
           COUNT(*) AS bucket_count,
           jsonb_agg(
             jsonb_build_object(
               'type', ndq.type,
               'count', ndq.count,
               'channels', ndq.channels,
               'examples', ndq.examples
             )
           ) AS digest_payload
      FROM core.notification_digest_queue ndq
      JOIN core.notification_preferences prefs ON prefs.user_id = ndq.user_id
     WHERE ndq.bucket = 'weekly'
       AND ndq.processed_at IS NULL
       AND prefs.digest_frequency = 'digest_weekly'
     GROUP BY ndq.user_id
  LOOP
    BEGIN
      INSERT INTO core.notifications (
        id,
        user_id,
        type,
        title,
        message,
        metadata,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        v_entry.user_id,
        'system.digest_weekly',
        'Your Weekly Digest',
        format('You have %s new updates from the last week', v_entry.bucket_count),
        jsonb_build_object(
          'digest_type', 'weekly',
          'items', v_entry.digest_payload
        ),
        NOW()
      )
      RETURNING id INTO v_notification_id;

      UPDATE core.notification_digest_queue
         SET processed_at = NOW(),
             updated_at = NOW()
       WHERE user_id = v_entry.user_id
         AND bucket = 'weekly'
         AND processed_at IS NULL;

      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      PERFORM core.notify_admins_of_cron_failure(
        'notify-digest-weekly',
        format('Failed to create weekly digest for user %s: %s', v_entry.user_id, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'Weekly digest processing complete. Created: %', v_created;
  RETURN v_created;
END;
$$;

COMMENT ON FUNCTION core.process_weekly_digest() IS
  'Aggregates weekly notification digest entries and creates consolidated notifications.';

COMMIT;

