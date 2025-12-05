-- =========================================================
-- 131_req_221_inquiry_reminders.sql
-- Implements automated reminder system for pending inquiries
-- =========================================================

BEGIN;

-- =========================================================
-- Add reminder notification type
-- =========================================================
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'inquiry.reminder'
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
-- Add reminder settings to organizations
-- =========================================================
ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS inquiry_reminder_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS inquiry_reminder_days INTEGER DEFAULT 3;

COMMENT ON COLUMN core.organizations.inquiry_reminder_enabled IS
  'Whether to send automatic reminders to candidates for pending inquiries';
COMMENT ON COLUMN core.organizations.inquiry_reminder_days IS
  'Number of days to wait before sending first reminder (1-14)';

-- Add constraint for reminder days
ALTER TABLE core.organizations
  DROP CONSTRAINT IF EXISTS organizations_inquiry_reminder_days_check;
ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_inquiry_reminder_days_check
  CHECK (inquiry_reminder_days >= 1 AND inquiry_reminder_days <= 14);

-- =========================================================
-- Create inquiry_reminders table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.inquiry_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES core.application_inquiries(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'initial_response',
    'section_pending',
    'capability_pending'
  )),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.inquiry_reminders IS
  'Tracks reminder notifications sent to candidates for pending inquiries';
COMMENT ON COLUMN core.inquiry_reminders.reminder_type IS
  'Type of reminder: initial_response (no response yet), section_pending (sections need acceptance), capability_pending (capability questions unanswered)';

CREATE INDEX IF NOT EXISTS idx_inquiry_reminders_inquiry
  ON core.inquiry_reminders(inquiry_id);

CREATE INDEX IF NOT EXISTS idx_inquiry_reminders_sent_at
  ON core.inquiry_reminders(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiry_reminders_inquiry_sent
  ON core.inquiry_reminders(inquiry_id, sent_at DESC);

-- =========================================================
-- Row Level Security for inquiry_reminders
-- =========================================================
ALTER TABLE core.inquiry_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view reminders for inquiries they have access to
DROP POLICY IF EXISTS inquiry_reminders_select ON core.inquiry_reminders;
CREATE POLICY inquiry_reminders_select ON core.inquiry_reminders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries ai
      JOIN core.applications a ON a.id = ai.application_id
      WHERE ai.id = inquiry_reminders.inquiry_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.role_assignments ra
          WHERE ra.user_id = auth.uid()
          AND ra.scope_org_id IN (
            SELECT j.organization_id FROM core.jobs j WHERE j.id = a.job_id
          )
        )
      )
    )
  );

-- Service role can manage all reminders
GRANT SELECT, INSERT ON core.inquiry_reminders TO service_role;

-- =========================================================
-- Function to process inquiry reminders
-- =========================================================
CREATE OR REPLACE FUNCTION core.send_inquiry_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_inquiry RECORD;
  v_reminder_type TEXT;
  v_recent_reminder_exists BOOLEAN;
  v_days_since_sent INTEGER;
  v_org_settings RECORD;
BEGIN
  -- Find inquiries that need reminders
  FOR v_inquiry IN
    SELECT
      ai.id AS inquiry_id,
      ai.application_id,
      ai.status,
      ai.sent_at,
      a.user_id AS candidate_user_id,
      j.organization_id,
      o.inquiry_reminder_enabled,
      o.inquiry_reminder_days,
      -- Check if inquiry has pending sections
      EXISTS (
        SELECT 1 FROM core.inquiry_sections isec
        WHERE isec.inquiry_id = ai.id
        AND isec.accepted_at IS NULL
      ) AS has_pending_sections,
      -- Check if inquiry has unanswered capability questions
      EXISTS (
        SELECT 1 FROM core.jobs j2
        JOIN core.applications a2 ON a2.job_id = j2.id
        WHERE a2.id = ai.application_id
        AND j2.inquiry_capability_questions IS NOT NULL
        AND jsonb_array_length(j2.inquiry_capability_questions) > 0
        AND NOT EXISTS (
          SELECT 1 FROM core.inquiry_capability_responses icr
          WHERE icr.inquiry_id = ai.id
        )
      ) AS has_unanswered_capabilities
    FROM core.application_inquiries ai
    JOIN core.applications a ON a.id = ai.application_id
    JOIN core.jobs j ON j.id = a.job_id
    JOIN core.organizations o ON o.id = j.organization_id
    WHERE ai.status IN ('sent', 'candidate_responded', 'organization_responded')
    AND ai.sent_at IS NOT NULL
    AND o.inquiry_reminder_enabled = true
    AND ai.sent_at < NOW() - (o.inquiry_reminder_days || ' days')::INTERVAL
    AND ai.status NOT IN ('accepted', 'rejected', 'withdrawn')
  LOOP
    BEGIN
      -- Check if reminder was sent recently (within last 3 days)
      SELECT EXISTS (
        SELECT 1 FROM core.inquiry_reminders ir
        WHERE ir.inquiry_id = v_inquiry.inquiry_id
        AND ir.sent_at > NOW() - INTERVAL '3 days'
      ) INTO v_recent_reminder_exists;

      IF v_recent_reminder_exists THEN
        CONTINUE; -- Skip to avoid spamming
      END IF;

      -- Determine reminder type
      IF v_inquiry.status = 'sent' THEN
        v_reminder_type := 'initial_response';
      ELSIF v_inquiry.has_unanswered_capabilities THEN
        v_reminder_type := 'capability_pending';
      ELSIF v_inquiry.has_pending_sections THEN
        v_reminder_type := 'section_pending';
      ELSE
        CONTINUE; -- No reminder needed
      END IF;

      -- Create notification
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
        metadata
      ) VALUES (
        v_inquiry.candidate_user_id,
        'inquiry.reminder',
        'info',
        'Inquiry Reminder',
        CASE
          WHEN v_reminder_type = 'initial_response' THEN
            'You have a pending inquiry that needs your response.'
          WHEN v_reminder_type = 'section_pending' THEN
            'Your inquiry has sections that need your acceptance.'
          WHEN v_reminder_type = 'capability_pending' THEN
            'Your inquiry has capability questions that need to be answered.'
          ELSE
            'You have a pending inquiry that needs your attention.'
        END,
        CASE
          WHEN v_reminder_type = 'initial_response' THEN
            'You have a pending inquiry that needs your response.'
          WHEN v_reminder_type = 'section_pending' THEN
            'Your inquiry has sections that need your acceptance.'
          WHEN v_reminder_type = 'capability_pending' THEN
            'Your inquiry has capability questions that need to be answered.'
          ELSE
            'You have a pending inquiry that needs your attention.'
        END,
        'View Inquiry',
        '/dashboard/applications/' || v_inquiry.application_id || '/inquiry',
        jsonb_build_object(
          'inquiry_id', v_inquiry.inquiry_id,
          'application_id', v_inquiry.application_id,
          'reminder_type', v_reminder_type
        ),
        jsonb_build_object(
          'inquiry_id', v_inquiry.inquiry_id,
          'application_id', v_inquiry.application_id
        )
      );

      -- Track reminder
      INSERT INTO core.inquiry_reminders (
        inquiry_id,
        reminder_type
      ) VALUES (
        v_inquiry.inquiry_id,
        v_reminder_type
      );

      v_processed_count := v_processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'inquiry_id', v_inquiry.inquiry_id,
        'error', SQLERRM
      );
    END;
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
    VALUES ('send-inquiry-reminders', 'failed', SQLERRM, NOW());
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

COMMENT ON FUNCTION core.send_inquiry_reminders() IS
  'Processes pending inquiries and sends reminder notifications to candidates. Runs via cron daily.';

-- =========================================================
-- Schedule Cron Job
-- Runs daily at 10 AM to check for inquiries needing reminders
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
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-inquiry-reminders') THEN
    PERFORM cron.unschedule('send-inquiry-reminders');
  END IF;

  -- Schedule to run daily at 10 AM
  PERFORM cron.schedule(
    'send-inquiry-reminders',
    '0 10 * * *',
    'SELECT core.send_inquiry_reminders();'
  );
END;
$$;

COMMIT;

