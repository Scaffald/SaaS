-- =========================================================
-- 078_create_auto_rejection_function.sql
-- Implements auto-rejection logic based on job requirements
-- =========================================================

BEGIN;

-- =========================================================
-- Main auto-rejection function
-- =========================================================
CREATE OR REPLACE FUNCTION public.apply_auto_rejection(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application record;
  v_job record;
  v_auto_reject_criteria jsonb;
  v_should_reject boolean := false;
  v_reject_reasons text[] := ARRAY[]::text[];
  v_user_skill_ids uuid[];
  v_user_cert_ids uuid[];
  v_required_skill_ids uuid[];
  v_required_cert_ids uuid[];
  v_skills_matched integer;
  v_certs_matched integer;
BEGIN
  -- Get application details
  SELECT a.* INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get job details
  SELECT 
    j.*,
    j.skill_ids as job_skill_ids,
    j.certification_ids as job_cert_ids
  INTO v_job
  FROM public.jobs j
  WHERE j.id = v_application.job_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Skip if auto-rejection is not enabled for this job
  IF v_job.enable_auto_reject = false OR v_job.enable_auto_reject IS NULL THEN
    RETURN false;
  END IF;

  v_auto_reject_criteria := COALESCE(v_job.auto_reject_criteria, '{}'::jsonb);

  -- =========================================================
  -- Check 1: Work Authorization (if required by job)
  -- =========================================================
  IF v_job.require_work_authorization = true THEN
    IF v_application.is_authorized_to_work = false OR v_application.is_authorized_to_work IS NULL THEN
      v_should_reject := true;
      v_reject_reasons := array_append(v_reject_reasons, 'Missing required work authorization');
    END IF;
  END IF;

  -- Also check if explicitly configured in auto_reject_criteria
  IF (v_auto_reject_criteria->>'require_work_authorization')::boolean = true THEN
    IF v_application.is_authorized_to_work = false OR v_application.is_authorized_to_work IS NULL THEN
      v_should_reject := true;
      IF NOT ('Missing required work authorization' = ANY(v_reject_reasons)) THEN
        v_reject_reasons := array_append(v_reject_reasons, 'Missing required work authorization');
      END IF;
    END IF;
  END IF;

  -- =========================================================
  -- Check 2: Minimum Score Threshold
  -- =========================================================
  IF v_auto_reject_criteria->>'score_minimum' IS NOT NULL THEN
    DECLARE
      v_min_score integer;
    BEGIN
      v_min_score := (v_auto_reject_criteria->>'score_minimum')::integer;
      
      -- Calculate score if not already calculated
      IF v_application.application_score IS NULL THEN
        PERFORM public.calculate_application_score(p_application_id);
        
        -- Refresh application data
        SELECT application_score INTO v_application.application_score
        FROM public.applications
        WHERE id = p_application_id;
      END IF;
      
      IF v_application.application_score < v_min_score THEN
        v_should_reject := true;
        v_reject_reasons := array_append(
          v_reject_reasons,
          format('Application score (%s) below minimum threshold (%s)', 
                 v_application.application_score, 
                 v_min_score)
        );
      END IF;
    END;
  ELSIF v_job.minimum_score IS NOT NULL THEN
    -- Fall back to job's minimum_score if no criteria specified
    IF v_application.application_score IS NULL THEN
      PERFORM public.calculate_application_score(p_application_id);
      
      SELECT application_score INTO v_application.application_score
      FROM public.applications
      WHERE id = p_application_id;
    END IF;
    
    IF v_application.application_score < v_job.minimum_score THEN
      v_should_reject := true;
      v_reject_reasons := array_append(
        v_reject_reasons,
        format('Application score (%s) below job minimum (%s)', 
               v_application.application_score, 
               v_job.minimum_score)
      );
    END IF;
  END IF;

  -- =========================================================
  -- Check 3: All Required Skills (if configured)
  -- =========================================================
  IF (v_auto_reject_criteria->>'require_all_skills')::boolean = true THEN
    -- Get user's skills
    SELECT COALESCE(array_agg(skill_id), ARRAY[]::uuid[])
    INTO v_user_skill_ids
    FROM public.user_skills
    WHERE user_id = v_application.user_id;

    -- Get job's required skills
    v_required_skill_ids := COALESCE(v_job.job_skill_ids, ARRAY[]::uuid[]);

    IF array_length(v_required_skill_ids, 1) > 0 THEN
      -- Count matching skills
      SELECT COUNT(*)
      INTO v_skills_matched
      FROM unnest(v_required_skill_ids) AS required_skill
      WHERE required_skill = ANY(v_user_skill_ids);

      -- Reject if missing any required skills
      IF v_skills_matched < array_length(v_required_skill_ids, 1) THEN
        v_should_reject := true;
        v_reject_reasons := array_append(
          v_reject_reasons,
          format('Missing %s of %s required skills', 
                 array_length(v_required_skill_ids, 1) - v_skills_matched,
                 array_length(v_required_skill_ids, 1))
        );
      END IF;
    END IF;
  END IF;

  -- =========================================================
  -- Check 4: All Required Certifications (if configured)
  -- =========================================================
  IF (v_auto_reject_criteria->>'require_all_certifications')::boolean = true THEN
    -- Get user's valid certifications
    SELECT COALESCE(array_agg(certification_id), ARRAY[]::uuid[])
    INTO v_user_cert_ids
    FROM public.user_certifications
    WHERE user_id = v_application.user_id
      AND (expires_at IS NULL OR expires_at > now());

    -- Get job's required certifications
    v_required_cert_ids := COALESCE(v_job.job_cert_ids, ARRAY[]::uuid[]);

    IF array_length(v_required_cert_ids, 1) > 0 THEN
      -- Count matching certifications
      SELECT COUNT(*)
      INTO v_certs_matched
      FROM unnest(v_required_cert_ids) AS required_cert
      WHERE required_cert = ANY(v_user_cert_ids);

      -- Reject if missing any required certifications
      IF v_certs_matched < array_length(v_required_cert_ids, 1) THEN
        v_should_reject := true;
        v_reject_reasons := array_append(
          v_reject_reasons,
          format('Missing %s of %s required certifications', 
                 array_length(v_required_cert_ids, 1) - v_certs_matched,
                 array_length(v_required_cert_ids, 1))
        );
      END IF;
    END IF;
  END IF;

  -- =========================================================
  -- Check 5: Minimum Years of Experience (if configured)
  -- =========================================================
  IF v_job.minimum_years_experience IS NOT NULL THEN
    IF v_application.years_experience IS NULL OR 
       v_application.years_experience < v_job.minimum_years_experience THEN
      -- Note: We don't auto-reject on experience alone unless it's far below
      -- This is handled by the scoring system
      -- But we could add a strict mode here if needed
    END IF;
  END IF;

  -- =========================================================
  -- Apply rejection if criteria met
  -- =========================================================
  IF v_should_reject THEN
    UPDATE public.applications
    SET 
      auto_rejected = true,
      auto_reject_reason = array_to_string(v_reject_reasons, '; '),
      status = 'rejected',
      updated_at = now()
    WHERE id = p_application_id;
    
    RETURN true;
  END IF;

  -- Not rejected
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_auto_rejection TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_auto_rejection TO service_role;

-- =========================================================
-- Trigger to auto-apply rejection on application completion
-- =========================================================
CREATE OR REPLACE FUNCTION public.trigger_auto_rejection_on_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_rejected boolean;
BEGIN
  -- Only check auto-rejection if marking as complete and not already rejected
  IF NEW.is_complete = true AND 
     (OLD.is_complete = false OR OLD.is_complete IS NULL) AND
     NEW.status != 'rejected' AND
     NEW.auto_rejected = false THEN
    
    -- First calculate score (this happens in its own trigger)
    -- Then apply auto-rejection logic
    SELECT public.apply_auto_rejection(NEW.id) INTO v_rejected;
    
    -- If rejected, update the NEW record
    IF v_rejected THEN
      SELECT 
        auto_rejected,
        auto_reject_reason,
        status
      INTO 
        NEW.auto_rejected,
        NEW.auto_reject_reason,
        NEW.status
      FROM public.applications
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_rejection_on_complete ON public.applications;
CREATE TRIGGER trg_auto_rejection_on_complete
  AFTER UPDATE OF is_complete ON public.applications
  FOR EACH ROW
  WHEN (NEW.is_complete = true AND NEW.auto_rejected = false)
  EXECUTE FUNCTION public.trigger_auto_rejection_on_complete();

-- =========================================================
-- Helper function to check if application would be auto-rejected
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_auto_rejection_preview(
  p_job_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_job record;
  v_auto_reject_criteria jsonb;
  v_would_reject boolean := false;
  v_reasons text[] := ARRAY[]::text[];
  v_user_skill_ids uuid[];
  v_user_cert_ids uuid[];
  v_required_skill_ids uuid[];
  v_required_cert_ids uuid[];
  v_skills_matched integer;
  v_certs_matched integer;
BEGIN
  -- Get job details
  SELECT 
    j.*,
    j.skill_ids as job_skill_ids,
    j.certification_ids as job_cert_ids
  INTO v_job
  FROM public.jobs j
  WHERE j.id = p_job_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'would_reject', false,
      'reasons', '[]'::jsonb,
      'error', 'Job not found'
    );
  END IF;

  -- Skip if auto-rejection is not enabled
  IF v_job.enable_auto_reject = false OR v_job.enable_auto_reject IS NULL THEN
    RETURN jsonb_build_object(
      'would_reject', false,
      'reasons', '[]'::jsonb,
      'auto_reject_enabled', false
    );
  END IF;

  v_auto_reject_criteria := COALESCE(v_job.auto_reject_criteria, '{}'::jsonb);

  -- Check work authorization
  IF v_job.require_work_authorization = true OR
     (v_auto_reject_criteria->>'require_work_authorization')::boolean = true THEN
    v_reasons := array_append(v_reasons, 'Work authorization required');
  END IF;

  -- Check skills if configured
  IF (v_auto_reject_criteria->>'require_all_skills')::boolean = true THEN
    v_required_skill_ids := COALESCE(v_job.job_skill_ids, ARRAY[]::uuid[]);
    IF array_length(v_required_skill_ids, 1) > 0 THEN
      v_reasons := array_append(
        v_reasons, 
        format('All %s required skills must match', array_length(v_required_skill_ids, 1))
      );
    END IF;
  END IF;

  -- Check certifications if configured
  IF (v_auto_reject_criteria->>'require_all_certifications')::boolean = true THEN
    v_required_cert_ids := COALESCE(v_job.job_cert_ids, ARRAY[]::uuid[]);
    IF array_length(v_required_cert_ids, 1) > 0 THEN
      v_reasons := array_append(
        v_reasons,
        format('All %s required certifications must match', array_length(v_required_cert_ids, 1))
      );
    END IF;
  END IF;

  -- Check minimum score
  IF v_auto_reject_criteria->>'score_minimum' IS NOT NULL THEN
    v_reasons := array_append(
      v_reasons,
      format('Minimum score of %s required', v_auto_reject_criteria->>'score_minimum')
    );
  ELSIF v_job.minimum_score IS NOT NULL THEN
    v_reasons := array_append(
      v_reasons,
      format('Minimum score of %s required', v_job.minimum_score)
    );
  END IF;

  RETURN jsonb_build_object(
    'auto_reject_enabled', true,
    'criteria', v_auto_reject_criteria,
    'requirements', v_reasons
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_auto_rejection_preview TO authenticated;

COMMIT;
