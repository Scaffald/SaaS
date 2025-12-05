-- =========================================================
-- 115_req_221_inquiry_audit_trail.sql
-- Create inquiry audit log table and triggers for history tracking
-- =========================================================

BEGIN;

-- =========================================================
-- Create inquiry_audit_log table
-- =========================================================

CREATE TABLE IF NOT EXISTS core.inquiry_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES core.application_inquiries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'inquiry_created',
    'inquiry_sent',
    'inquiry_edited',
    'comment_added',
    'section_accepted',
    'capability_answered',
    'status_changed'
  )),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiry_audit_inquiry ON core.inquiry_audit_log(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_audit_created_at ON core.inquiry_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_audit_event_type ON core.inquiry_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_inquiry_audit_actor ON core.inquiry_audit_log(actor_id);

-- =========================================================
-- Enable RLS on inquiry_audit_log
-- =========================================================

ALTER TABLE core.inquiry_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow inserts (automatic logging)
DROP POLICY IF EXISTS inquiry_audit_insert_only ON core.inquiry_audit_log;
CREATE POLICY inquiry_audit_insert_only ON core.inquiry_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow select for authorized users (candidate or organization members)
DROP POLICY IF EXISTS inquiry_audit_select_authorized ON core.inquiry_audit_log;
CREATE POLICY inquiry_audit_select_authorized ON core.inquiry_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM core.application_inquiries i
      JOIN core.applications a ON i.application_id = a.id
      WHERE i.id = inquiry_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM core.jobs j
          JOIN core.organizations o ON o.id = j.organization_id
          WHERE j.id = a.job_id 
          AND (
            o.owner_user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM core.role_assignments ra
              WHERE ra.scope_org_id = o.id
              AND ra.user_id = auth.uid()
            )
          )
        )
      )
    )
  );

-- Deny updates and deletes (immutable audit log)
DROP POLICY IF EXISTS inquiry_audit_no_update ON core.inquiry_audit_log;
CREATE POLICY inquiry_audit_no_update ON core.inquiry_audit_log
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS inquiry_audit_no_delete ON core.inquiry_audit_log;
CREATE POLICY inquiry_audit_no_delete ON core.inquiry_audit_log
  FOR DELETE
  USING (false);

-- =========================================================
-- Create trigger function to log inquiry events
-- =========================================================

CREATE OR REPLACE FUNCTION core.log_inquiry_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
    VALUES (
      NEW.id,
      'inquiry_created',
      COALESCE(NEW.created_by, auth.uid()),
      jsonb_build_object(
        'status', NEW.status,
        'application_id', NEW.application_id
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if status changed or significant fields changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
      VALUES (
        NEW.id,
        'status_changed',
        auth.uid(),
        jsonb_build_object(
          'from_status', OLD.status,
          'to_status', NEW.status
        )
      );
    ELSIF (
      OLD.employment_type IS DISTINCT FROM NEW.employment_type
      OR OLD.work_schedule IS DISTINCT FROM NEW.work_schedule
      OR OLD.rate_min_cents IS DISTINCT FROM NEW.rate_min_cents
      OR OLD.rate_max_cents IS DISTINCT FROM NEW.rate_max_cents
      OR OLD.working_hours_start IS DISTINCT FROM NEW.working_hours_start
      OR OLD.working_hours_end IS DISTINCT FROM NEW.working_hours_end
      OR OLD.workdays IS DISTINCT FROM NEW.workdays
      OR OLD.additional_notes IS DISTINCT FROM NEW.additional_notes
    ) THEN
      -- Log as inquiry_edited if terms changed
      INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
      VALUES (
        NEW.id,
        'inquiry_edited',
        auth.uid(),
        jsonb_build_object(
          'changed_fields', jsonb_build_object(
            'employment_type', CASE WHEN OLD.employment_type IS DISTINCT FROM NEW.employment_type THEN true ELSE false END,
            'work_schedule', CASE WHEN OLD.work_schedule IS DISTINCT FROM NEW.work_schedule THEN true ELSE false END,
            'rate', CASE WHEN OLD.rate_min_cents IS DISTINCT FROM NEW.rate_min_cents OR OLD.rate_max_cents IS DISTINCT FROM NEW.rate_max_cents THEN true ELSE false END,
            'working_hours', CASE WHEN OLD.working_hours_start IS DISTINCT FROM NEW.working_hours_start OR OLD.working_hours_end IS DISTINCT FROM NEW.working_hours_end THEN true ELSE false END,
            'workdays', CASE WHEN OLD.workdays IS DISTINCT FROM NEW.workdays THEN true ELSE false END,
            'additional_notes', CASE WHEN OLD.additional_notes IS DISTINCT FROM NEW.additional_notes THEN true ELSE false END
          )
        )
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- Create trigger on application_inquiries
-- =========================================================

DROP TRIGGER IF EXISTS inquiry_audit_trigger ON core.application_inquiries;

CREATE TRIGGER inquiry_audit_trigger
  AFTER INSERT OR UPDATE ON core.application_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION core.log_inquiry_event();

-- =========================================================
-- Create trigger function to log inquiry_sent when sent_at is set
-- =========================================================

CREATE OR REPLACE FUNCTION core.log_inquiry_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Log inquiry_sent when sent_at changes from NULL to a value
  IF OLD.sent_at IS NULL AND NEW.sent_at IS NOT NULL THEN
    INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
    VALUES (
      NEW.id,
      'inquiry_sent',
      COALESCE(NEW.created_by, auth.uid()),
      jsonb_build_object(
        'sent_at', NEW.sent_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS inquiry_sent_audit_trigger ON core.application_inquiries;

CREATE TRIGGER inquiry_sent_audit_trigger
  AFTER UPDATE OF sent_at ON core.application_inquiries
  FOR EACH ROW
  WHEN (OLD.sent_at IS NULL AND NEW.sent_at IS NOT NULL)
  EXECUTE FUNCTION core.log_inquiry_sent();

-- =========================================================
-- Create trigger function to log comment events
-- =========================================================

CREATE OR REPLACE FUNCTION core.log_inquiry_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
    VALUES (
      NEW.inquiry_id,
      'comment_added',
      NEW.sender_id,
      jsonb_build_object(
        'section_name', NEW.section_name,
        'comment_id', NEW.id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS inquiry_comment_audit_trigger ON core.inquiry_comments;

CREATE TRIGGER inquiry_comment_audit_trigger
  AFTER INSERT ON core.inquiry_comments
  FOR EACH ROW
  EXECUTE FUNCTION core.log_inquiry_comment();

-- =========================================================
-- Create trigger function to log section acceptance events
-- =========================================================

CREATE OR REPLACE FUNCTION core.log_inquiry_section_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when a section is accepted (accepted_by changes from NULL to a value)
  IF OLD.accepted_by IS NULL AND NEW.accepted_by IS NOT NULL THEN
    INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
    VALUES (
      NEW.inquiry_id,
      'section_accepted',
      NEW.accepted_by,
      jsonb_build_object(
        'section_name', NEW.section_name,
        'accepted_at', NEW.accepted_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS inquiry_section_audit_trigger ON core.inquiry_sections;

CREATE TRIGGER inquiry_section_audit_trigger
  AFTER UPDATE OF accepted_by ON core.inquiry_sections
  FOR EACH ROW
  WHEN (OLD.accepted_by IS NULL AND NEW.accepted_by IS NOT NULL)
  EXECUTE FUNCTION core.log_inquiry_section_accepted();

-- =========================================================
-- Create trigger function to log capability response events
-- =========================================================

CREATE OR REPLACE FUNCTION core.log_inquiry_capability_answered()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when a capability is answered (response_value or response_text is set)
  IF TG_OP = 'INSERT' OR (
    TG_OP = 'UPDATE' AND (
      (OLD.response_value IS NULL AND NEW.response_value IS NOT NULL)
      OR (OLD.response_text IS NULL AND NEW.response_text IS NOT NULL)
    )
  ) THEN
    INSERT INTO core.inquiry_audit_log (inquiry_id, event_type, actor_id, event_data)
    SELECT
      NEW.inquiry_id,
      'capability_answered',
      a.user_id,
      jsonb_build_object(
        'capability_name', NEW.capability_name,
        'response_value', NEW.response_value,
        'response_text', NEW.response_text
      )
    FROM core.application_inquiries iq
    JOIN core.applications a ON iq.application_id = a.id
    WHERE iq.id = NEW.inquiry_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS inquiry_capability_audit_trigger ON core.inquiry_capability_responses;

CREATE TRIGGER inquiry_capability_audit_trigger
  AFTER INSERT OR UPDATE ON core.inquiry_capability_responses
  FOR EACH ROW
  EXECUTE FUNCTION core.log_inquiry_capability_answered();

COMMIT;

