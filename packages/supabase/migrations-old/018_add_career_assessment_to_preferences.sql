-- =========================================================
-- 018_add_career_assessment_to_preferences.sql
-- Adds O*NET career assessment fields to user_preferences table
-- Includes RIASEC scores, occupation tracking, and career assessment completion
-- =========================================================

BEGIN;

-- Add career assessment columns to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS riasec_scores JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_occupation_code TEXT,
  ADD COLUMN IF NOT EXISTS target_occupation_codes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_assessment_completed_at TIMESTAMPTZ;

-- Add foreign key constraint to O*NET occupation data (if onet schema exists)
-- Note: This constraint will be added after onet schema is created in migration 082
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'onet'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'onet' AND table_name = 'occupation_data'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT fk_current_occupation 
      FOREIGN KEY (current_occupation_code) 
      REFERENCES onet.occupation_data(onetsoc_code)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_preferences_riasec_idx 
  ON public.user_preferences USING GIN (riasec_scores)
  WHERE riasec_scores IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_preferences_occupation_idx
  ON public.user_preferences(current_occupation_code)
  WHERE current_occupation_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_preferences_career_completed_idx
  ON public.user_preferences(career_assessment_completed_at)
  WHERE career_assessment_completed_at IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.user_preferences.riasec_scores IS 'RIASEC interest profile scores (1-5 scale): Realistic, Investigative, Artistic, Social, Enterprising, Conventional';
COMMENT ON COLUMN public.user_preferences.current_occupation_code IS 'User''s current occupation (O*NET SOC code)';
COMMENT ON COLUMN public.user_preferences.target_occupation_codes IS 'Array of target/goal occupations (O*NET SOC codes)';
COMMENT ON COLUMN public.user_preferences.career_assessment_completed_at IS 'Timestamp when user completed RIASEC career assessment';

-- Example RIASEC scores structure:
-- {
--   "realistic": 3,
--   "investigative": 4,
--   "artistic": 2,
--   "social": 5,
--   "enterprising": 3,
--   "conventional": 2
-- }

COMMIT;
