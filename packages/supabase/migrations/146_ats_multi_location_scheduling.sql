-- ====================================================================================
-- 146_ats_multi_location_scheduling.sql
-- Adds multi-location and scheduling fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Work Locations
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS work_locations JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN core.jobs.work_locations IS
  'JSONB array of work locations: [{address: {street, city, state, zip, country, latitude, longitude}, is_primary: boolean, percentage_time: 0-100}].';

-- =========================================================
-- Relocation Assistance
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS relocation_assistance_offered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS relocation_assistance_details TEXT;

COMMENT ON COLUMN core.jobs.relocation_assistance_offered IS
  'Whether relocation assistance is offered for this position.';
COMMENT ON COLUMN core.jobs.relocation_assistance_details IS
  'Details about relocation assistance (e.g., moving expenses, temporary housing).';

-- =========================================================
-- Work Schedule Details
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS work_schedule_details TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMENT ON COLUMN core.jobs.work_schedule_details IS
  'Details about the work schedule (e.g., Monday-Friday 9-5, rotating shifts).';
COMMENT ON COLUMN core.jobs.timezone IS
  'Timezone for this position (e.g., America/New_York, UTC).';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_relocation_assistance_offered
  ON core.jobs(relocation_assistance_offered)
  WHERE relocation_assistance_offered = true;

-- GIN index for work_locations JSONB array
CREATE INDEX IF NOT EXISTS idx_jobs_work_locations_gin
  ON core.jobs USING GIN(work_locations);

COMMIT;

