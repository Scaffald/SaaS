-- =========================================================
-- 027_req_81_years_of_experience.sql
-- Automatically calculate and persist years of experience
-- =========================================================

BEGIN;
-- Function to calculate total years of experience based on user_experience rows
CREATE OR REPLACE FUNCTION core.calculate_years_of_experience(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_months INTEGER := 0;
BEGIN
  WITH experience_ranges AS (
    SELECT
      DATE_TRUNC('month', start_date)::date AS start_month,
      DATE_TRUNC('month', COALESCE(end_date, CURRENT_DATE))::date AS end_month
    FROM core.user_experience
    WHERE user_id = p_user_id
      AND start_date IS NOT NULL
      AND COALESCE(end_date, CURRENT_DATE) >= start_date
  ),
  monthly_coverage AS (
    SELECT
      generate_series(start_month, end_month, INTERVAL '1 month')::date AS month_start
    FROM experience_ranges
  )
  SELECT COUNT(DISTINCT month_start)
  INTO total_months
  FROM monthly_coverage;

  RETURN ROUND(COALESCE(total_months, 0)::NUMERIC / 12, 1);
END;
$$;
COMMENT ON FUNCTION core.calculate_years_of_experience(UUID) IS
  'Calculates total years of experience for a user by expanding experience periods into distinct months and returning the total in years (one decimal place).';
-- Helper to update users.years_of_experience when experience entries change
CREATE OR REPLACE FUNCTION core.refresh_years_of_experience(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_years NUMERIC;
BEGIN
  SELECT core.calculate_years_of_experience(p_user_id)
  INTO calculated_years;

  UPDATE core.users
  SET
    years_of_experience = COALESCE(ROUND(calculated_years)::INTEGER, 0),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
COMMENT ON FUNCTION core.refresh_years_of_experience(UUID) IS
  'Recalculates and persists the rounded years_of_experience value for the provided user.';
-- Trigger to keep years_of_experience current
CREATE OR REPLACE FUNCTION core.user_experience_refresh_years_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF target_user_id IS NOT NULL THEN
    PERFORM core.refresh_years_of_experience(target_user_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS user_experience_refresh_years ON core.user_experience;
CREATE TRIGGER user_experience_refresh_years
AFTER INSERT OR UPDATE OR DELETE ON core.user_experience
FOR EACH ROW
EXECUTE FUNCTION core.user_experience_refresh_years_trigger();
-- Backfill existing data
UPDATE core.users
SET years_of_experience = COALESCE(
  ROUND(core.calculate_years_of_experience(id))::INTEGER,
  0
);
COMMIT;
