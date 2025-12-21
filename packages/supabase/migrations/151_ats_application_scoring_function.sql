-- ====================================================================================
-- 151_ats_application_scoring_function.sql
-- Creates database function to calculate application scores
-- ====================================================================================

BEGIN;

-- =========================================================
-- Application Scoring Function
-- =========================================================

CREATE OR REPLACE FUNCTION core.calculate_application_score(
  p_application_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 0;
  v_job_id UUID;
  v_application RECORD;
  v_job RECORD;
  v_skills_match INTEGER := 0;
  v_certifications_match INTEGER := 0;
  v_experience_match INTEGER := 0;
  v_screening_match INTEGER := 0;
  v_breakdown JSONB := '{}'::jsonb;
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

  -- Skills Match (0-30 points)
  -- TODO: Implement skills matching logic based on job requirements
  -- For now, placeholder logic
  v_skills_match := 15; -- Placeholder
  v_breakdown := v_breakdown || jsonb_build_object('skills_match', v_skills_match);

  -- Certifications Match (0-20 points)
  -- TODO: Implement certification matching logic
  v_certifications_match := 10; -- Placeholder
  v_breakdown := v_breakdown || jsonb_build_object('certifications', v_certifications_match);

  -- Experience Match (0-30 points)
  IF v_job.minimum_years_experience IS NOT NULL AND v_application.screening_answers IS NOT NULL THEN
    DECLARE
      v_years_experience INTEGER;
    BEGIN
      v_years_experience := (v_application.screening_answers->>'years_experience')::INTEGER;
      IF v_years_experience >= v_job.minimum_years_experience THEN
        v_experience_match := 30;
      ELSIF v_years_experience >= (v_job.minimum_years_experience * 0.8) THEN
        v_experience_match := 20;
      ELSIF v_years_experience >= (v_job.minimum_years_experience * 0.5) THEN
        v_experience_match := 10;
      END IF;
    END;
  END IF;
  v_breakdown := v_breakdown || jsonb_build_object('experience', v_experience_match);

  -- Screening Answers Match (0-20 points)
  -- Check if required screening questions are answered correctly
  IF v_application.screening_answers IS NOT NULL THEN
    DECLARE
      v_points INTEGER := 0;
    BEGIN
      -- Work authorization (5 points)
      IF (v_application.screening_answers->>'is_authorized_to_work')::BOOLEAN = true THEN
        v_points := v_points + 5;
      END IF;

      -- Relocation willingness (5 points if required)
      IF v_job.require_relocation_willingness AND (v_application.screening_answers->>'willing_to_relocate')::BOOLEAN = true THEN
        v_points := v_points + 5;
      END IF;

      -- Current location provided (5 points if required)
      IF v_job.require_current_location AND (v_application.screening_answers->>'current_location') IS NOT NULL THEN
        v_points := v_points + 5;
      END IF;

      -- Earliest start date provided (5 points if required)
      IF v_job.require_earliest_start_date AND (v_application.screening_answers->>'earliest_start_date') IS NOT NULL THEN
        v_points := v_points + 5;
      END IF;

      v_screening_match := v_points;
    END;
  END IF;
  v_breakdown := v_breakdown || jsonb_build_object('screening_answers', v_screening_match);

  -- Calculate total score
  v_score := v_skills_match + v_certifications_match + v_experience_match + v_screening_match;

  -- Update application with score
  UPDATE core.applications
  SET
    score_total = v_score,
    score_breakdown = v_breakdown,
    score_calculated_at = NOW()
  WHERE id = p_application_id;

  RETURN v_score;
END;
$$;

COMMENT ON FUNCTION core.calculate_application_score IS
  'Calculates and updates the application score (0-100) based on skills, certifications, experience, and screening answers. Returns the total score.';

-- =========================================================
-- Trigger: Auto-calculate score on application completion
-- =========================================================

CREATE OR REPLACE FUNCTION core.trigger_calculate_application_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only calculate score if application is complete and score hasn't been calculated recently
  IF NEW.current_step = 'review' AND (NEW.score_calculated_at IS NULL OR NEW.score_calculated_at < NOW() - INTERVAL '1 hour') THEN
    PERFORM core.calculate_application_score(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS calculate_application_score_trigger ON core.applications;
CREATE TRIGGER calculate_application_score_trigger
  AFTER UPDATE OF current_step ON core.applications
  FOR EACH ROW
  WHEN (NEW.current_step = 'review')
  EXECUTE FUNCTION core.trigger_calculate_application_score();

COMMIT;

