-- =========================================================
-- 052_cron_refactor_part2.sql
-- Schema enhancements and SQL helpers for cron refactor (part 2)
--
-- ROLLBACK INSTRUCTIONS:
--   - ALTER TABLE core.external_job_feeds DROP COLUMN retention_days, DROP COLUMN last_cleanup_at;
--   - DROP TABLE IF EXISTS core.archived_external_jobs;
--   - DROP TABLE IF EXISTS core.archived_notifications;
--   - DROP FUNCTION IF EXISTS core.archive_expired_external_jobs();
--   - DROP FUNCTION IF EXISTS core.send_profile_completion_reminders();
--   - DROP FUNCTION IF EXISTS core.update_stale_applications();
--   - DROP FUNCTION IF EXISTS core.cleanup_old_notifications();
--   - Consider restoring application status constraint to previous set if required.
-- =========================================================

BEGIN;

-- =========================================================
-- External job feed retention configuration
-- =========================================================
ALTER TABLE core.external_job_feeds
  ADD COLUMN IF NOT EXISTS retention_days INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS last_cleanup_at TIMESTAMPTZ;

COMMENT ON COLUMN core.external_job_feeds.retention_days IS
  'Number of days to retain active jobs before archiving (default 90, configurable per feed).';
COMMENT ON COLUMN core.external_job_feeds.last_cleanup_at IS
  'Timestamp of the most recent automated cleanup run for this feed.';

-- =========================================================
-- Archived external jobs snapshot table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.archived_external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_job_id UUID NOT NULL,
  feed_id UUID NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retention_days INTEGER NOT NULL,
  payload JSONB NOT NULL,
  CONSTRAINT archived_external_jobs_unique UNIQUE (external_job_id)
);

COMMENT ON TABLE core.archived_external_jobs IS
  'Historical snapshots of external jobs that have been archived based on feed retention rules.';
COMMENT ON COLUMN core.archived_external_jobs.payload IS
  'JSONB snapshot of the job record at the time it was archived.';

-- =========================================================
-- Archived notifications snapshot table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.archived_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL,
  user_id UUID NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  CONSTRAINT archived_notifications_notification_unique UNIQUE (notification_id)
);

COMMENT ON TABLE core.archived_notifications IS
  'Snapshots of notifications that have been archived for long-term storage.';

-- =========================================================
-- Harmonise application statuses for stale detection
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_schema = 'core'
      AND table_name = 'applications'
      AND constraint_name = 'core_applications_status_check'
  ) THEN
    ALTER TABLE core.applications
      DROP CONSTRAINT core_applications_status_check;
  END IF;
END;
$$;

ALTER TABLE core.applications
  ALTER COLUMN status SET DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE core.applications
  ADD CONSTRAINT core_applications_status_check
  CHECK (
    status IN (
      'pending','reviewing','interview','offer',
      'hired','rejected','withdrawn','stale'
    )
  );

-- Normalise legacy status values if present
UPDATE core.applications
   SET status = CASE
                 WHEN status = 'new' THEN 'pending'
                 WHEN status = 'screen' THEN 'reviewing'
                 ELSE status
               END;

-- =========================================================
-- Function: archive expired/aged external jobs using retention rules
-- =========================================================
CREATE OR REPLACE FUNCTION core.archive_expired_external_jobs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_summary JSONB := jsonb_build_object('archived', 0, 'updated_feeds', 0);
  v_archived_count INTEGER := 0;
  v_feed RECORD;
BEGIN
  RAISE NOTICE 'Starting external job archival at %', v_now;

  FOR v_feed IN
    SELECT id, retention_days
      FROM core.external_job_feeds
  LOOP
    WITH candidates AS (
      SELECT ej.*
        FROM core.external_jobs ej
       WHERE ej.feed_id = v_feed.id
         AND ej.is_active = true
         AND (
              (ej.expires_date IS NOT NULL AND ej.expires_date < v_now)
           OR  (ej.expires_date IS NULL AND ej.posted_date IS NOT NULL
                AND ej.posted_date < v_now - (v_feed.retention_days || ' days')::INTERVAL)
           OR  (ej.expires_date IS NULL AND ej.posted_date IS NULL
                AND ej.created_at < v_now - (v_feed.retention_days || ' days')::INTERVAL)
         )
    ),
    archived AS (
      INSERT INTO core.archived_external_jobs (external_job_id, feed_id, retention_days, payload, archived_at)
      SELECT
        c.id,
        c.feed_id,
        v_feed.retention_days,
        to_jsonb(c),
        v_now
      FROM candidates c
      ON CONFLICT (external_job_id)
      DO UPDATE
        SET payload = EXCLUDED.payload,
            archived_at = v_now,
            retention_days = EXCLUDED.retention_days
      RETURNING external_job_id
    ),
    updated AS (
      UPDATE core.external_jobs ej
         SET is_active = false,
             archived_at = v_now,
             updated_at = v_now
        WHERE ej.id IN (SELECT external_job_id FROM archived)
      RETURNING ej.id
    )
    SELECT COUNT(*) INTO STRICT v_archived_count FROM updated;

    IF v_archived_count > 0 THEN
      UPDATE core.external_job_feeds
         SET last_cleanup_at = v_now,
             updated_at = v_now
       WHERE id = v_feed.id;

      v_summary := jsonb_set(
        v_summary,
        '{archived}',
        to_jsonb((v_summary->>'archived')::INTEGER + v_archived_count)
      );
      v_summary := jsonb_set(
        v_summary,
        '{updated_feeds}',
        to_jsonb((v_summary->>'updated_feeds')::INTEGER + 1)
      );
    END IF;
  END LOOP;

  RAISE NOTICE 'External job archival complete. Archived: %, Updated feeds: %',
    v_summary->>'archived', v_summary->>'updated_feeds';

  RETURN v_summary;
END;
$$;

COMMENT ON FUNCTION core.archive_expired_external_jobs() IS
  'Archives external jobs based on feed-specific retention periods and snapshots metadata.';

-- =========================================================
-- Function: profile completion reminders
-- =========================================================
CREATE OR REPLACE FUNCTION core.send_profile_completion_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_record RECORD;
  v_sent INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  RAISE NOTICE 'Running profile completion reminders at %', v_now;

  FOR v_record IN
    SELECT
      prefs.user_id,
      COALESCE(scores.completion_score, 0) AS completion_score,
      prefs.ui_preferences
    FROM core.preferences prefs
    JOIN core.v_profile_completion_scores scores
      ON scores.user_id = prefs.user_id
    WHERE COALESCE(scores.completion_score, 0) < 50
      AND prefs.prerequisites_completed_at IS NOT NULL
      AND prefs.prerequisites_completed_at < v_now - INTERVAL '30 days'
      AND (
        prefs.ui_preferences->>'last_profile_reminder_at' IS NULL
        OR (prefs.ui_preferences->>'last_profile_reminder_at')::timestamptz < v_now - INTERVAL '7 days'
      )
  LOOP
    BEGIN
      INSERT INTO core.notifications (
        id,
        user_id,
        type,
        severity,
        title,
        message,
        metadata,
        created_at,
        routed_channels
      )
      VALUES (
        gen_random_uuid(),
        v_record.user_id,
        'profile.completion_reminder',
        'important',
        'Complete Your Profile',
        format(
          'Your profile is %s%% complete. Add more details to improve visibility in search results.',
          v_record.completion_score
        ),
        jsonb_build_object(
          'completion_score', v_record.completion_score,
          'reminder_type', 'profile_completion'
        ),
        v_now,
        ARRAY['in_app','email']::core.notification_channel[]
      );

      UPDATE core.preferences
         SET ui_preferences = jsonb_set(
               COALESCE(ui_preferences, '{}'::jsonb),
               '{last_profile_reminder_at}',
               to_jsonb(v_now)
             ),
             updated_at = v_now
       WHERE user_id = v_record.user_id;

      v_sent := v_sent + 1;
    EXCEPTION WHEN OTHERS THEN
      PERFORM core.notify_admins_of_cron_failure(
        'profile-completion-reminders',
        format('Failed to send reminder to user %s: %s', v_record.user_id, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'Profile completion reminders sent: %', v_sent;
  RETURN v_sent;
END;
$$;

COMMENT ON FUNCTION core.send_profile_completion_reminders() IS
  'Sends notifications to users with incomplete profiles who have not been reminded within the past week.';

-- =========================================================
-- Function: mark stale applications
-- =========================================================
CREATE OR REPLACE FUNCTION core.update_stale_applications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_application RECORD;
  v_updated INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
  v_reference_date TIMESTAMPTZ;
BEGIN
  RAISE NOTICE 'Starting stale application evaluation at %', v_now;

  FOR v_application IN
    SELECT
      a.id,
      a.user_id,
      a.job_id,
      a.status,
      COALESCE(a.stage_changed_at, a.created_at) AS last_status_change,
      j.title AS job_title
    FROM core.applications a
    JOIN core.jobs j ON j.id = a.job_id
    WHERE a.status = 'reviewing'
      AND COALESCE(a.stage_changed_at, a.created_at) < v_now - INTERVAL '30 days'
  LOOP
    BEGIN
      v_reference_date := COALESCE(v_application.last_status_change, v_application.created_at);

      UPDATE core.applications
         SET status = 'stale',
             stage_changed_at = v_now,
             updated_at = v_now
       WHERE id = v_application.id;

      INSERT INTO core.notifications (
        id,
        user_id,
        type,
        severity,
        title,
        message,
        metadata,
        created_at,
        routed_channels
      )
      VALUES (
        gen_random_uuid(),
        v_application.user_id,
        'application.status_stale',
        'info',
        'Application Status Update',
        format(
          'Your application for "%s" has been marked as stale after 30 days without updates.',
          v_application.job_title
        ),
        jsonb_build_object(
          'application_id', v_application.id,
          'job_id', v_application.job_id,
          'previous_status', 'reviewing',
          'new_status', 'stale',
          'last_status_change', v_reference_date
        ),
        v_now,
        ARRAY['in_app','email']::core.notification_channel[]
      );

      v_updated := v_updated + 1;
    EXCEPTION WHEN OTHERS THEN
      PERFORM core.notify_admins_of_cron_failure(
        'update-stale-applications',
        format('Failed to update application %s: %s', v_application.id, SQLERRM)
      );
    END;
  END LOOP;

  RAISE NOTICE 'Stale application updates complete. Updated: %', v_updated;
  RETURN v_updated;
END;
$$;

COMMENT ON FUNCTION core.update_stale_applications() IS
  'Marks reviewing applications older than 30 days as stale and notifies applicants.';

-- =========================================================
-- Function: notification cleanup (delete + archive)
-- =========================================================
CREATE OR REPLACE FUNCTION core.cleanup_old_notifications()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_deleted INTEGER := 0;
  v_archived INTEGER := 0;
BEGIN
  RAISE NOTICE 'Running notification cleanup at %', v_now;

  WITH deleted AS (
    DELETE FROM core.notifications n
     WHERE n.read = true
       AND n.read_at IS NOT NULL
       AND n.read_at < v_now - INTERVAL '90 days'
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;

  WITH stale_unread AS (
    SELECT *
      FROM core.notifications
     WHERE read = false
       AND created_at < v_now - INTERVAL '180 days'
  ),
  archived AS (
    INSERT INTO core.archived_notifications (notification_id, user_id, payload, archived_at)
    SELECT n.id, n.user_id, to_jsonb(n), v_now
      FROM stale_unread n
    ON CONFLICT (notification_id) DO NOTHING
    RETURNING notification_id
  )
  SELECT COUNT(*) INTO v_archived FROM archived;

  DELETE FROM core.notifications
   WHERE id IN (
     SELECT notification_id
       FROM core.archived_notifications
      WHERE archived_at = v_now
   );

  DELETE FROM core.notification_digest_queue
   WHERE processed_at IS NOT NULL
     AND processed_at < v_now - INTERVAL '30 days';

  RAISE NOTICE 'Notification cleanup finished. Deleted: %, Archived: %', v_deleted, v_archived;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'archived', v_archived
  );
END;
$$;

COMMENT ON FUNCTION core.cleanup_old_notifications() IS
  'Deletes read notifications older than 90 days, archives unread items older than 180 days, and trims the digest queue.';

COMMIT;

