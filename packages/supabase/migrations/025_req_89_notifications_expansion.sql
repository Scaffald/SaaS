-- =========================================================
-- 025_req_89_notifications_expansion.sql
-- Extends notification system foundation for multi-channel delivery
-- =========================================================

BEGIN;

-- =========================================================
-- Extend notification type enum with planned event types
-- =========================================================
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'job.match','app.submitted','app.status_changed','interview.scheduled',
    'offer.extended','hiring.decision','team.invite','team.assigned',
    'team.commented','team.role_changed','profile.viewed','profile.unlocked',
    'review.new','review.reply','skill.endorse','acct.verify',
    'acct.password_reset','payment.success','payment.failed','sub.renewal',
    'bgcheck.completed','profile.reminder','reengage','feature.announcement',
    'platform.update','message.received'
  ];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END;
$$;

-- =========================================================
-- Create new enums if they do not already exist
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_channel'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.notification_channel AS ENUM ('in_app', 'email', 'push', 'sms');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_severity'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.notification_severity AS ENUM ('info', 'important', 'critical');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_delivery_status'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.notification_delivery_status AS ENUM (
      'queued','sending','sent','delivered','failed','bounce','blocked'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_event_kind'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.notification_event_kind AS ENUM (
      'accepted','delivered','opened','clicked','failed','bounce','complaint'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_frequency'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.notification_frequency AS ENUM (
      'immediate','digest_daily','digest_weekly','mute'
    );
  END IF;
END
$$;

-- =========================================================
-- Extend core.notifications table
-- =========================================================

-- Rename destination_url to cta_url for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'notifications'
      AND column_name = 'destination_url'
  ) THEN
    EXECUTE 'ALTER TABLE core.notifications RENAME COLUMN destination_url TO cta_url';
  END IF;
END
$$;

-- Add new columns if missing
ALTER TABLE core.notifications
  ADD COLUMN IF NOT EXISTS severity core.notification_severity NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS body JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preview TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS routed_channels core.notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::core.notification_channel[],
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Ensure read column defaults to false
ALTER TABLE core.notifications
  ALTER COLUMN read SET DEFAULT false;

-- Backfill body preview data from legacy message column when available
UPDATE core.notifications
SET body = jsonb_build_object('preview', message)
WHERE (body IS NULL OR body = '{}'::jsonb)
  AND message IS NOT NULL;

-- Deduplicate key index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_key_idx
  ON core.notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- Maintain routed channel index for unread queries
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON core.notifications(user_id)
  WHERE read = false;

-- =========================================================
-- Delivery Attempts Table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES core.notifications(id) ON DELETE CASCADE,
  channel core.notification_channel NOT NULL,
  provider TEXT,
  provider_msg_id TEXT,
  status core.notification_delivery_status NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_deliveries_queue_idx
  ON core.notification_deliveries(status, next_attempt_at)
  WHERE status IN ('queued','sending');

CREATE INDEX IF NOT EXISTS notification_deliveries_notification_idx
  ON core.notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS notification_deliveries_provider_idx
  ON core.notification_deliveries(provider_msg_id)
  WHERE provider_msg_id IS NOT NULL;

CREATE TRIGGER notification_deliveries_set_updated_at
  BEFORE UPDATE ON core.notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Delivery Events Table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.notification_events (
  id BIGSERIAL PRIMARY KEY,
  notification_id UUID REFERENCES core.notifications(id) ON DELETE CASCADE,
  delivery_id BIGINT REFERENCES core.notification_deliveries(id) ON DELETE CASCADE,
  channel core.notification_channel,
  event core.notification_event_kind NOT NULL,
  meta JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_events_notification_idx
  ON core.notification_events(notification_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS notification_events_delivery_idx
  ON core.notification_events(delivery_id, occurred_at DESC);

-- =========================================================
-- Notification Preferences Table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  global_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours JSONB,
  channel_enabled JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "push": true, "sms": false}'::jsonb,
  type_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  digest_frequency core.notification_frequency NOT NULL DEFAULT 'immediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON core.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Notification Devices Table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.notification_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  token TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT notification_devices_user_token_unique UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS notification_devices_user_idx
  ON core.notification_devices(user_id);

CREATE INDEX IF NOT EXISTS notification_devices_token_idx
  ON core.notification_devices(token);

CREATE TRIGGER notification_devices_set_updated_at
  BEFORE UPDATE ON core.notification_devices
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Notification Digest Queue Table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.notification_digest_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  type core.notification_type NOT NULL,
  bucket TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  channels core.notification_channel[] NOT NULL DEFAULT ARRAY[]::core.notification_channel[],
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_digest_queue_unique UNIQUE(user_id, type, bucket)
);

CREATE INDEX IF NOT EXISTS notification_digest_queue_bucket_idx
  ON core.notification_digest_queue(bucket, last_event_at DESC);

CREATE TRIGGER notification_digest_queue_set_updated_at
  BEFORE UPDATE ON core.notification_digest_queue
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security Policies
-- =========================================================

-- Drop legacy policies to replace with enhanced versions
DROP POLICY IF EXISTS notifications_select_own ON core.notifications;
DROP POLICY IF EXISTS notifications_update_own ON core.notifications;
DROP POLICY IF EXISTS notifications_insert_service_role ON core.notifications;
DROP POLICY IF EXISTS notifications_insert_own ON core.notifications;

CREATE POLICY notifications_select_own
  ON core.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_own
  ON core.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_insert_service_role
  ON core.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY notifications_insert_own
  ON core.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Deliveries policies
DROP POLICY IF EXISTS notification_deliveries_select_own ON core.notification_deliveries;
DROP POLICY IF EXISTS notification_deliveries_service_all ON core.notification_deliveries;

CREATE POLICY notification_deliveries_select_own
  ON core.notification_deliveries
  FOR SELECT
  TO authenticated
  USING (notification_id IN (
    SELECT id FROM core.notifications WHERE user_id = auth.uid()
  ));

CREATE POLICY notification_deliveries_service_all
  ON core.notification_deliveries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Events policies
DROP POLICY IF EXISTS notification_events_select_own ON core.notification_events;
DROP POLICY IF EXISTS notification_events_service_all ON core.notification_events;

CREATE POLICY notification_events_select_own
  ON core.notification_events
  FOR SELECT
  TO authenticated
  USING (notification_id IN (
    SELECT id FROM core.notifications WHERE user_id = auth.uid()
  ));

CREATE POLICY notification_events_service_all
  ON core.notification_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Preferences policies
DROP POLICY IF EXISTS notification_preferences_user_all ON core.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_service_all ON core.notification_preferences;

CREATE POLICY notification_preferences_user_all
  ON core.notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_preferences_service_all
  ON core.notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Devices policies
DROP POLICY IF EXISTS notification_devices_user_all ON core.notification_devices;
DROP POLICY IF EXISTS notification_devices_service_all ON core.notification_devices;

CREATE POLICY notification_devices_user_all
  ON core.notification_devices
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notification_devices_service_all
  ON core.notification_devices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Digest queue policies
DROP POLICY IF EXISTS notification_digest_queue_select_own ON core.notification_digest_queue;
DROP POLICY IF EXISTS notification_digest_queue_service_all ON core.notification_digest_queue;

CREATE POLICY notification_digest_queue_select_own
  ON core.notification_digest_queue
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notification_digest_queue_service_all
  ON core.notification_digest_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Grants
-- =========================================================

GRANT SELECT, INSERT, UPDATE ON core.notifications TO authenticated;
GRANT ALL ON core.notifications TO service_role;

GRANT SELECT ON core.notification_deliveries TO authenticated;
GRANT ALL ON core.notification_deliveries TO service_role;

GRANT SELECT ON core.notification_events TO authenticated;
GRANT ALL ON core.notification_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.notification_preferences TO authenticated;
GRANT ALL ON core.notification_preferences TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.notification_devices TO authenticated;
GRANT ALL ON core.notification_devices TO service_role;

GRANT SELECT ON core.notification_digest_queue TO authenticated;
GRANT ALL ON core.notification_digest_queue TO service_role;

-- =========================================================
-- Cron scheduling for notification workers
-- =========================================================

DO $$
DECLARE
  base_url TEXT := COALESCE(
    NULLIF(current_setting('app.supabase_url', true), ''),
    NULLIF(current_setting('supabase.external_url', true), ''),
    'http://127.0.0.1:54321'
  );
  service_key TEXT := COALESCE(current_setting('app.service_role_key', true), '');
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    PERFORM cron.unschedule('notifications-send-worker');
    PERFORM cron.unschedule('notifications-check-receipts');
    PERFORM cron.unschedule('notifications-digest-daily');
    PERFORM cron.unschedule('notifications-digest-weekly');

    PERFORM cron.schedule(
      'notifications-send-worker',
      '*/1 * * * *',
      format($cmd$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Authorization', %L,
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text)
        );
      $cmd$, base_url || '/functions/v1/notify-send-worker', 'Bearer ' || service_key)
    );

    PERFORM cron.schedule(
      'notifications-check-receipts',
      '*/15 * * * *',
      format($cmd$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Authorization', %L,
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text)
        );
      $cmd$, base_url || '/functions/v1/notify-check-receipts', 'Bearer ' || service_key)
    );

    PERFORM cron.schedule(
      'notifications-digest-daily',
      '0 7 * * *',
      format($cmd$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Authorization', %L,
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text)
        );
      $cmd$, base_url || '/functions/v1/notify-digest-daily', 'Bearer ' || service_key)
    );

    PERFORM cron.schedule(
      'notifications-digest-weekly',
      '0 8 * * 1',
      format($cmd$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Authorization', %L,
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text)
        );
      $cmd$, base_url || '/functions/v1/notify-digest-weekly', 'Bearer ' || service_key)
    );
  END IF;
END;
$$;

COMMIT;
