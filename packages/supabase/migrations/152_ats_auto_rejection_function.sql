-- ====================================================================================
-- 152_ats_auto_rejection_function.sql
-- Creates database functions for auto-rejection logic
-- ====================================================================================

BEGIN;

-- =========================================================
-- Auto-Rejection Function
-- =========================================================

CREATE OR REPLACE FUNCTION core.auto_reject_application(
  p_application_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application RECORD;
  v_job RECORD;
  v_should_reject BOOLEAN := false;
  v_reject_reasons TEXT[] := '{}';
BEGIN
  -- Get application data
  SELECT a.*
  INTO v_application
  FROM core.applications a
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id;
  END IF;

  -- Get job data
  SELECT j.*
  INTO v_job
  FROM core.jobs j
  WHERE j.id = v_application.job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found for application: %', p_application_id;
  END IF;

  -- Check if auto-reject is enabled for this job
  IF NOT v_job.enable_auto_reject THEN
    RETURN false;
  END IF;

  -- Check if already rejected
  IF v_application.status = 'rejected' THEN
    RETURN false;
  END IF;

  -- Check minimum score requirement
  IF v_job.auto_reject_criteria->>'score_minimum' IS NOT NULL THEN
    DECLARE
      v_min_score INTEGER := (v_job.auto_reject_criteria->>'score_minimum')::INTEGER;
    BEGIN
      IF v_application.score_total IS NULL OR v_application.score_total < v_min_score THEN
        v_should_reject := true;
        v_reject_reasons := array_append(v_reject_reasons, 'Score below minimum: ' || COALESCE(v_application.score_total::text, 'N/A') || ' < ' || v_min_score::text);
      END IF;
    END;
  END IF;

  -- Check work authorization requirement
  IF (v_job.auto_reject_criteria->>'require_work_authorization')::BOOLEAN = true THEN
    IF v_application.screening_answers IS NULL OR (v_application.screening_answers->>'is_authorized_to_work')::BOOLEAN != true THEN
      v_should_reject := true;
      v_reject_reasons := array_append(v_reject_reasons, 'Work authorization required but not confirmed');
    END IF;
  END IF;

  -- Check all skills requirement
  IF (v_job.auto_reject_criteria->>'require_all_skills')::BOOLEAN = true THEN
    -- TODO: Implement skills matching logic
    -- For now, skip this check
  END IF;

  -- Check all certifications requirement
  IF (v_job.auto_reject_criteria->>'require_all_certifications')::BOOLEAN = true THEN
    -- TODO: Implement certification matching logic
    -- For now, skip this check
  END IF;

  -- Reject application if criteria met
  IF v_should_reject THEN
    UPDATE core.applications
    SET
      status = 'rejected',
      rejected_at = NOW(),
      reject_reasons = v_reject_reasons,
      reject_meta = jsonb_build_object(
        'auto_rejected', true,
        'rejected_at', NOW(),
        'criteria', v_job.auto_reject_criteria
      )
    WHERE id = p_application_id;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION core.auto_reject_application IS
  'Automatically rejects an application if it meets the job''s auto-rejection criteria. Returns true if rejected, false otherwise.';

-- =========================================================
-- Preview Auto-Rejection Function
-- =========================================================

CREATE OR REPLACE FUNCTION core.preview_auto_rejection(
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application RECORD;
  v_job RECORD;
  v_result JSONB := '{}'::jsonb;
  v_would_reject BOOLEAN := false;
  v_reasons TEXT[] := '{}';
BEGIN
  -- Get application data
  SELECT a.*
  INTO v_application
  FROM core.applications a
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_application_id;
  END IF;

  -- Get job data
  SELECT j.*
  INTO v_job
  FROM core.jobs j
  WHERE j.id = v_application.job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found for application: %', p_application_id;
  END IF;

  -- Check if auto-reject is enabled
  IF NOT v_job.enable_auto_reject THEN
    RETURN jsonb_build_object(
      'would_reject', false,
      'reason', 'Auto-reject is not enabled for this job'
    );
  END IF;

  -- Check minimum score
  IF v_job.auto_reject_criteria->>'score_minimum' IS NOT NULL THEN
    DECLARE
      v_min_score INTEGER := (v_job.auto_reject_criteria->>'score_minimum')::INTEGER;
    BEGIN
      IF v_application.score_total IS NULL OR v_application.score_total < v_min_score THEN
        v_would_reject := true;
        v_reasons := array_append(v_reasons, 'Score below minimum');
      END IF;
    END;
  END IF;

  -- Check work authorization
  IF (v_job.auto_reject_criteria->>'require_work_authorization')::BOOLEAN = true THEN
    IF v_application.screening_answers IS NULL OR (v_application.screening_answers->>'is_authorized_to_work')::BOOLEAN != true THEN
      v_would_reject := true;
      v_reasons := array_append(v_reasons, 'Work authorization not confirmed');
    END IF;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'would_reject', v_would_reject,
    'reasons', v_reasons,
    'criteria', v_job.auto_reject_criteria,
    'current_score', v_application.score_total
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION core.preview_auto_rejection IS
  'Preview whether an application would be auto-rejected without actually rejecting it. Returns JSONB with would_reject, reasons, and criteria.';

COMMIT;

