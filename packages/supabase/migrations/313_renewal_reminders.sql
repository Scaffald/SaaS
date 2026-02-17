-- =========================================================
-- 313_renewal_reminders.sql
-- Automated renewal reminder system for insurance policies
-- Sends notifications at configurable intervals before
-- policy expiration (default: 30, 60, 90 days)
-- =========================================================

-- =========================================================
-- Section A: Add notification type enum value
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a
-- transaction block, so this must come BEFORE BEGIN;
-- =========================================================
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY['policy.renewal'];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

BEGIN;

-- =========================================================
-- Section B: Add org settings columns to core.organizations
-- =========================================================
ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS renewal_reminder_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_reminder_intervals INTEGER[] DEFAULT '{30,60,90}';

COMMENT ON COLUMN core.organizations.renewal_reminder_enabled IS
  'Whether to send automatic renewal reminders for expiring insurance policies';
COMMENT ON COLUMN core.organizations.renewal_reminder_intervals IS
  'Days before expiration to send renewal reminders (e.g. {30,60,90})';

-- Add constraint: each interval must be between 1 and 365
ALTER TABLE core.organizations
  DROP CONSTRAINT IF EXISTS organizations_renewal_reminder_intervals_check;
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_renewal_reminder_intervals_check
  CHECK (
    renewal_reminder_intervals IS NULL
    OR (
      array_length(renewal_reminder_intervals, 1) > 0
      AND (
        (SELECT MIN(v) FROM unnest(renewal_reminder_intervals) AS v) >= 1
        AND (SELECT MAX(v) FROM unnest(renewal_reminder_intervals) AS v) <= 365
      )
    )
  );

-- =========================================================
-- Section C: Create forsured.renewal_reminders table
-- =========================================================
CREATE TABLE IF NOT EXISTS forsured.renewal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  interval_days INTEGER NOT NULL,
  notification_id UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_renewal_reminders_policy
    FOREIGN KEY (policy_id)
    REFERENCES forsured.insurance_policies(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_renewal_reminders_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_renewal_reminders_user
    FOREIGN KEY (user_id)
    REFERENCES core.users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_renewal_reminders_notification
    FOREIGN KEY (notification_id)
    REFERENCES core.notifications(id)
    ON DELETE SET NULL
);

COMMENT ON TABLE forsured.renewal_reminders IS
  'Tracks renewal reminder notifications sent for expiring insurance policies';
COMMENT ON COLUMN forsured.renewal_reminders.interval_days IS
  'Which threshold triggered this reminder (e.g. 90, 60, 30 days before expiration)';
COMMENT ON COLUMN forsured.renewal_reminders.dismissed_at IS
  'NULL until auto-dismissed on policy renewal or cancellation';

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_renewal_reminders_dedup
  ON forsured.renewal_reminders(policy_id, interval_days, user_id)
  WHERE dismissed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_policy
  ON forsured.renewal_reminders(policy_id);

CREATE INDEX IF NOT EXISTS idx_renewal_reminders_organization
  ON forsured.renewal_reminders(organization_id);

-- =========================================================
-- Row Level Security for renewal_reminders
-- =========================================================
ALTER TABLE forsured.renewal_reminders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view reminders for their organization
DROP POLICY IF EXISTS "Users can view renewal_reminders in their org" ON forsured.renewal_reminders;
CREATE POLICY "Users can view renewal_reminders in their org"
  ON forsured.renewal_reminders
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
    OR user_id = auth.uid()
  );

-- Service role has full access
DROP POLICY IF EXISTS "Service role has full access to renewal_reminders" ON forsured.renewal_reminders;
CREATE POLICY "Service role has full access to renewal_reminders"
  ON forsured.renewal_reminders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT ON forsured.renewal_reminders TO authenticated;
GRANT ALL ON forsured.renewal_reminders TO service_role;

-- =========================================================
-- Section D: Create forsured.send_renewal_reminders() function
-- =========================================================
CREATE OR REPLACE FUNCTION forsured.send_renewal_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, core, public
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_policy RECORD;
  v_recipient RECORD;
  v_notification_id UUID;
  v_already_sent BOOLEAN;
  v_opted_out BOOLEAN;
  v_severity core.notification_severity;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Find policies matching configured reminder intervals
  FOR v_policy IN
    SELECT
      ip.id,
      ip.policy_number,
      ip.policy_type,
      ip.carrier_name,
      ip.expiration_date,
      ip.organization_id,
      interval_value,
      o.name AS org_name
    FROM forsured.insurance_policies ip
    JOIN core.organizations o ON ip.organization_id = o.id
    CROSS JOIN LATERAL unnest(o.renewal_reminder_intervals) AS interval_value
    WHERE ip.status = 'active'
      AND o.renewal_reminder_enabled = true
      AND ip.expiration_date IS NOT NULL
      AND ip.expiration_date = CURRENT_DATE + interval_value
  LOOP
    -- For each matching policy, find recipients (client + broker users)
    FOR v_recipient IN
      -- Client org users
      SELECT DISTINCT ra.user_id, 'client' AS recipient_role
      FROM core.role_assignments ra
      WHERE ra.scope_org_id = v_policy.organization_id
      UNION
      -- Broker org users
      SELECT DISTINCT ra.user_id, 'broker' AS recipient_role
      FROM core.role_assignments ra
      JOIN forsured.broker_clients bc ON ra.scope_org_id = bc.broker_org_id
      WHERE bc.client_org_id = v_policy.organization_id
        AND bc.status = 'active'
        AND bc.deleted_at IS NULL
    LOOP
      BEGIN
        -- Check dedup: skip if already sent for this policy/interval/user
        SELECT EXISTS (
          SELECT 1 FROM forsured.renewal_reminders
          WHERE policy_id = v_policy.id
            AND interval_days = v_policy.interval_value
            AND user_id = v_recipient.user_id
            AND dismissed_at IS NULL
        ) INTO v_already_sent;

        IF v_already_sent THEN
          CONTINUE;
        END IF;

        -- Check notification preferences: skip if globally disabled or type disabled
        SELECT EXISTS (
          SELECT 1 FROM core.notification_preferences
          WHERE user_id = v_recipient.user_id
            AND (
              global_enabled = false
              OR type_overrides->>'policy.renewal' = 'disabled'
            )
        ) INTO v_opted_out;

        IF v_opted_out THEN
          CONTINUE;
        END IF;

        -- Determine severity based on interval
        v_severity := CASE
          WHEN v_policy.interval_value <= 30 THEN 'critical'::core.notification_severity
          WHEN v_policy.interval_value <= 60 THEN 'important'::core.notification_severity
          ELSE 'info'::core.notification_severity
        END;

        -- Compute title based on urgency
        v_title := CASE
          WHEN v_policy.interval_value <= 30 THEN
            'Urgent: Policy ' || v_policy.policy_number || ' expires in ' || v_policy.interval_value || ' days'
          WHEN v_policy.interval_value <= 60 THEN
            'Policy renewal in ' || v_policy.interval_value || ' days: ' || v_policy.policy_number
          ELSE
            'Policy renewal upcoming: ' || v_policy.policy_number
        END;

        -- Compute message based on recipient role
        v_message := CASE
          WHEN v_recipient.recipient_role = 'broker' THEN
            'Your client ' || v_policy.org_name || '''s ' || v_policy.policy_type
            || ' policy with ' || COALESCE(v_policy.carrier_name, 'unknown carrier')
            || ' expires on ' || v_policy.expiration_date
          ELSE
            'Your ' || v_policy.policy_type
            || ' policy with ' || COALESCE(v_policy.carrier_name, 'unknown carrier')
            || ' expires on ' || v_policy.expiration_date
        END;

        -- Insert notification
        INSERT INTO core.notifications (
          user_id,
          type,
          severity,
          title,
          message,
          preview,
          cta_label,
          cta_url,
          body,
          metadata,
          dedupe_key,
          routed_channels
        ) VALUES (
          v_recipient.user_id,
          'policy.renewal',
          v_severity,
          v_title,
          v_message,
          v_message,
          'View Policy',
          '/policies/' || v_policy.id,
          jsonb_build_object(
            'policy_id', v_policy.id,
            'policy_number', v_policy.policy_number,
            'policy_type', v_policy.policy_type,
            'carrier_name', v_policy.carrier_name,
            'expiration_date', v_policy.expiration_date,
            'company_name', v_policy.org_name,
            'interval_days', v_policy.interval_value,
            'recipient_role', v_recipient.recipient_role
          ),
          jsonb_build_object(
            'policy_id', v_policy.id,
            'organization_id', v_policy.organization_id,
            'interval_days', v_policy.interval_value,
            'recipient_role', v_recipient.recipient_role
          ),
          'renewal:' || v_policy.id || ':' || v_policy.interval_value || ':' || v_recipient.user_id,
          ARRAY['in_app', 'email']::core.notification_channel[]
        )
        RETURNING id INTO v_notification_id;

        -- Track reminder
        INSERT INTO forsured.renewal_reminders (
          policy_id,
          organization_id,
          user_id,
          interval_days,
          notification_id
        ) VALUES (
          v_policy.id,
          v_policy.organization_id,
          v_recipient.user_id,
          v_policy.interval_value,
          v_notification_id
        );

        v_processed_count := v_processed_count + 1;

      EXCEPTION WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := v_errors || jsonb_build_object(
          'policy_id', v_policy.id,
          'user_id', v_recipient.user_id,
          'error', SQLERRM
        );
      END;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed_count,
    'errors', v_error_count,
    'error_details', v_errors,
    'executed_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  -- Log overall failure
  BEGIN
    INSERT INTO core.cron_execution_log (job_name, status, error_message, executed_at)
    VALUES ('send-renewal-reminders', 'failed', SQLERRM, NOW());
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'processed', v_processed_count
  );
END;
$$;

COMMENT ON FUNCTION forsured.send_renewal_reminders() IS
  'Processes active insurance policies and sends renewal reminder notifications at configured intervals before expiration. Runs via cron daily.';

-- =========================================================
-- Section E: Create trigger function and trigger
-- =========================================================
CREATE OR REPLACE FUNCTION forsured.handle_policy_renewal_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = forsured, core, public
AS $$
BEGIN
  IF (OLD.expiration_date IS DISTINCT FROM NEW.expiration_date)
     OR (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('cancelled', 'expired'))
  THEN
    WITH dismissed AS (
      UPDATE forsured.renewal_reminders
      SET dismissed_at = NOW()
      WHERE policy_id = OLD.id
        AND dismissed_at IS NULL
      RETURNING notification_id
    )
    UPDATE core.notifications
    SET archived_at = NOW()
    WHERE id IN (SELECT notification_id FROM dismissed WHERE notification_id IS NOT NULL)
      AND archived_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_policy_renewal_reminder_update ON forsured.insurance_policies;
CREATE TRIGGER trg_policy_renewal_reminder_update
  AFTER UPDATE ON forsured.insurance_policies
  FOR EACH ROW
  EXECUTE FUNCTION forsured.handle_policy_renewal_update();

-- =========================================================
-- Section F: Schedule cron job
-- Runs daily at 9 AM to check for policies needing reminders
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron extension not available; skipping schedule.';
    RETURN;
  END IF;

  -- Unschedule if already exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-renewal-reminders') THEN
    PERFORM cron.unschedule('send-renewal-reminders');
  END IF;

  -- Schedule to run daily at 9 AM
  PERFORM cron.schedule(
    'send-renewal-reminders',
    '0 9 * * *',
    'SELECT forsured.send_renewal_reminders();'
  );
END;
$$;

COMMIT;
