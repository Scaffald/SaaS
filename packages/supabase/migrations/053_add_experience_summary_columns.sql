-- 053_add_experience_summary_columns.sql
-- Add experience summary columns to user_private table

BEGIN;

-- Add experience summary columns if they don't exist
ALTER TABLE public.user_private 
ADD COLUMN IF NOT EXISTS total_years_experience smallint,
ADD COLUMN IF NOT EXISTS career_level text;

COMMIT;
