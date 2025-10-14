-- =========================================================
-- 007_indexes.sql - Database Indexes and Triggers
-- Performance indexes and automatic triggers
-- =========================================================

BEGIN;

-- =========================================================
-- USER EDUCATION INDEXES
-- =========================================================

-- User lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_user_education_user_id 
  ON private.user_education(user_id);

-- Current education filter
CREATE INDEX IF NOT EXISTS idx_user_education_user_current 
  ON private.user_education(user_id, is_current) 
  WHERE is_current = true;

-- University lookup for joins
CREATE INDEX IF NOT EXISTS idx_user_education_university_id 
  ON private.user_education(university_id) 
  WHERE university_id IS NOT NULL;

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_user_education_dates
  ON private.user_education(user_id, start_date DESC, end_date DESC);

-- =========================================================
-- USER EDUCATION TRIGGERS
-- =========================================================

-- Updated_at trigger
CREATE TRIGGER trg_user_education_updated_at
  BEFORE UPDATE ON private.user_education
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMIT;
