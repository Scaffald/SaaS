-- =========================================================
-- 116_req_221_job_capability_questions.sql
-- Add inquiry capability questions to jobs table
-- =========================================================

BEGIN;

-- Add inquiry_capability_questions column to jobs table
-- Stores JSONB array of capability question definitions
-- Example structure:
-- [
--   { "name": "physical_activities", "label": "Are you able to lift, climb...", "type": "boolean", "required": true },
--   { "name": "weight_capacity", "label": "Add weight you can lift", "type": "number", "unit": "Pounds", "required": true },
--   { "name": "standing_hours", "label": "Add hours you can stand", "type": "number", "unit": "Hours", "required": true }
-- ]
ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS inquiry_capability_questions JSONB DEFAULT '[]'::jsonb;

-- Add index for capability questions (though JSONB queries are less efficient)
-- This is mainly for documentation purposes
COMMENT ON COLUMN core.jobs.inquiry_capability_questions IS 
  'Array of capability questions to include in inquiries for this job. Each question has: name (string), label (string), type (boolean|number|text), unit (optional string), required (boolean)';

COMMIT;

