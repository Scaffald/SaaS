-- =========================================================
-- 077_create_application_scoring_function.sql
-- Implements application scoring algorithm based on job requirements
-- =========================================================

BEGIN;

-- =========================================================
-- Main scoring function
-- =========================================================
CREATE OR REPLACE FUNCTION public.calculate_application_score(p_application_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score integer := 0;
  v_application record;
  v_job record;
  v_user_skill_ids uuid[];
  v_user_cert_ids uuid[];
  v_required_skill_ids uuid[];
  v_required_cert_ids uuid[];
  v_skills_matched integer;
  v_certs_matched integer;
  v_total_required_skills integer;
  v_total_required_certs integer;
BEGIN
  -- Get application details
  SELECT a.* INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
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
    RETURN NULL;
  END IF;

  -- =========================================================
  -- 1. Work Authorization (20 points)
  -- =========================================================
  IF v_application.is_authorized_to_work = true THEN
    v_score := v_score + 20;
  ELSIF v_job.require_work_authorization = true AND 
        (v_application.is_authorized_to_work = false OR v_application.is_authorized_to_work IS NULL) THEN
    -- Missing required authorization
    v_score := v_score + 0;
  ELSIF v_application.is_authorized_to_work IS NULL THEN
    -- Not answered, give partial credit
    v_score := v_score + 10;
  END IF;

  -- =========================================================
  -- 2. Years of Experience (25 points)
  -- =========================================================
  IF v_application.years_experience IS NOT NULL AND v_job.minimum_years_experience IS NOT NULL THEN
    IF v_application.years_experience >= v_job.minimum_years_experience + 3 THEN
      -- Exceeds by 3+ years
      v_score := v_score + 25;
    ELSIF v_application.years_experience >= v_job.minimum_years_experience THEN
      -- Meets requirement exactly (or up to 2 years over)
      v_score := v_score + 20;
    ELSIF v_application.years_experience >= v_job.minimum_years_experience - 2 THEN
      -- 1-2 years below requirement
      v_score := v_score + 15;
    ELSE
      -- 3+ years below requirement
      v_score := v_score + 5;
    END IF;
  ELSIF v_application.years_experience IS NOT NULL THEN
    -- Experience provided but no minimum set - give full credit
    v_score := v_score + 25;
  ELSE
    -- No experience information - give half credit
    v_score := v_score + 12;
  END IF;

  -- =========================================================
  -- 3. Required Skills Match (25 points)
  -- =========================================================
  -- Get user's skills
  SELECT COALESCE(array_agg(skill_id), ARRAY[]::uuid[])
  INTO v_user_skill_ids
  FROM public.user_skills
  WHERE user_id = v_application.user_id;

  -- Get job's required skills
  v_required_skill_ids := COALESCE(v_job.job_skill_ids, ARRAY[]::uuid[]);
  v_total_required_skills := array_length(v_required_skill_ids, 1);

  IF v_total_required_skills > 0 THEN
    -- Count matching skills
    SELECT COUNT(*)
    INTO v_skills_matched
    FROM unnest(v_required_skill_ids) AS required_skill
    WHERE required_skill = ANY(v_user_skill_ids);

    -- Calculate score based on percentage match
    IF v_skills_matched = v_total_required_skills THEN
      -- Has all required skills
      v_score := v_score + 25;
    ELSIF v_skills_matched >= v_total_required_skills - 2 THEN
      -- Missing 1-2 skills
      v_score := v_score + 15;
    ELSIF v_skills_matched > 0 THEN
      -- Has some skills
      v_score := v_score + 10;
    ELSE
      -- Missing all skills
      v_score := v_score + 5;
    END IF;
  ELSE
    -- No skills required - full credit
    v_score := v_score + 25;
  END IF;

  -- =========================================================
  -- 4. Required Certifications (15 points)
  -- =========================================================
  -- Get user's certifications
  SELECT COALESCE(array_agg(certification_id), ARRAY[]::uuid[])
  INTO v_user_cert_ids
  FROM public.user_certifications
  WHERE user_id = v_application.user_id
    AND (expires_at IS NULL OR expires_at > now());

  -- Get job's required certifications
  v_required_cert_ids := COALESCE(v_job.job_cert_ids, ARRAY[]::uuid[]);
  v_total_required_certs := array_length(v_required_cert_ids, 1);

  IF v_total_required_certs > 0 THEN
    -- Count matching certifications
    SELECT COUNT(*)
    INTO v_certs_matched
    FROM unnest(v_required_cert_ids) AS required_cert
    WHERE required_cert = ANY(v_user_cert_ids);

    -- Calculate score based on match
    IF v_certs_matched = v_total_required_certs THEN
      -- Has all required certifications
      v_score := v_score + 15;
    ELSIF v_certs_matched = v_total_required_certs - 1 THEN
      -- Missing 1 certification
      v_score := v_score + 10;
    ELSIF v_certs_matched > 0 THEN
      -- Has some certifications
      v_score := v_score + 5;
    ELSE
      -- Missing all certifications
      v_score := v_score + 0;
    END IF;
  ELSE
    -- No certifications required - full credit
    v_score := v_score + 15;
  END IF;

  -- =========================================================
  -- 5. Location Match (10 points)
  -- =========================================================
  IF v_job.remote_option = 'remote' THEN
    -- Remote job - full credit
    v_score := v_score + 10;
  ELSIF v_application.current_location IS NOT NULL AND v_job.job_location IS NOT NULL THEN
    -- Check if locations match (simple string comparison)
    IF lower(v_application.current_location) = lower(v_job.job_location) OR
       v_application.current_location ILIKE '%' || v_job.job_location || '%' THEN
      -- Lives in job location
      v_score := v_score + 10;
    ELSIF v_application.willing_to_relocate = true THEN
      -- Willing to relocate
      v_score := v_score + 7;
    ELSE
      -- No match and not willing to relocate
      v_score := v_score + 0;
    END IF;
  ELSIF v_application.willing_to_relocate = true THEN
    -- Willing to relocate (no location info)
    v_score := v_score + 7;
  ELSE
    -- No location information - give partial credit
    v_score := v_score + 5;
  END IF;

  -- =========================================================
  -- 6. Custom Questions Completion (5 points)
  -- =========================================================
  DECLARE
    v_custom_questions jsonb;
    v_custom_answers jsonb;
    v_required_questions integer := 0;
    v_answered_questions integer := 0;
  BEGIN
    -- Get job's custom questions
    SELECT custom_application_questions INTO v_custom_questions
    FROM public.jobs
    WHERE id = v_application.job_id;

    -- Get application's custom answers
    v_custom_answers := v_application.custom_question_answers;

    IF v_custom_questions IS NOT NULL THEN
      -- Count required questions
      SELECT COUNT(*)
      INTO v_required_questions
      FROM jsonb_array_elements(v_custom_questions) AS q
      WHERE (q->>'required')::boolean = true;

      -- Count answered questions
      IF v_custom_answers IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_answered_questions
        FROM jsonb_array_elements(v_custom_questions) AS q
        WHERE (q->>'required')::boolean = true
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(v_custom_answers) AS a
            WHERE a->>'question_id' = q->>'id'
              AND a->>'answer' IS NOT NULL
              AND a->>'answer' != ''
          );
      END IF;

      -- Calculate completion score
      IF v_required_questions > 0 THEN
        IF v_answered_questions = v_required_questions THEN
          -- All required questions answered
          v_score := v_score + 5;
        ELSIF v_answered_questions > v_required_questions / 2 THEN
          -- Most questions answered
          v_score := v_score + 3;
        ELSIF v_answered_questions > 0 THEN
          -- Some questions answered
          v_score := v_score + 2;
        ELSE
          -- No questions answered
          v_score := v_score + 0;
        END IF;
      ELSE
        -- No required questions - full credit
        v_score := v_score + 5;
      END IF;
    ELSE
      -- No custom questions - full credit
      v_score := v_score + 5;
    END IF;
  END;

  -- Cap score at 100
  v_score := LEAST(v_score, 100);

  -- Update the application with the calculated score
  UPDATE public.applications
  SET 
    application_score = v_score,
    updated_at = now()
  WHERE id = p_application_id;

  RETURN v_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_application_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_application_score TO service_role;

-- =========================================================
-- Helper function to recalculate scores for all applications of a job
-- =========================================================
CREATE OR REPLACE FUNCTION public.recalculate_job_application_scores(p_job_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated integer := 0;
  v_application_id uuid;
BEGIN
  -- Recalculate score for each application
  FOR v_application_id IN
    SELECT id
    FROM public.applications
    WHERE job_id = p_job_id
      AND is_complete = true
  LOOP
    PERFORM public.calculate_application_score(v_application_id);
    v_updated := v_updated + 1;
  END LOOP;

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_job_application_scores TO authenticated;

-- =========================================================
-- Trigger to auto-calculate score on application completion
-- =========================================================
CREATE OR REPLACE FUNCTION public.trigger_calculate_score_on_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only calculate if marking as complete
  IF NEW.is_complete = true AND (OLD.is_complete = false OR OLD.is_complete IS NULL) THEN
    PERFORM public.calculate_application_score(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_score_on_complete ON public.applications;
CREATE TRIGGER trg_calculate_score_on_complete
  AFTER UPDATE OF is_complete ON public.applications
  FOR EACH ROW
  WHEN (NEW.is_complete = true)
  EXECUTE FUNCTION public.trigger_calculate_score_on_complete();

COMMIT;
