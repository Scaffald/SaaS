-- =========================================================
-- 109_add_scheduled_publish_at_to_jobs.sql
-- Adds scheduled_publish_at column to jobs table for scheduling
-- job publication at a future date/time
-- =========================================================

BEGIN;

-- Add scheduled_publish_at column to jobs table
ALTER TABLE core.jobs
ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN core.jobs.scheduled_publish_at IS
  'Scheduled date and time for automatic job publication. When set, the job will be automatically published at this time. Must be in the future.';

-- Create index for efficient querying of scheduled jobs
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_publish_at 
ON core.jobs(scheduled_publish_at) 
WHERE scheduled_publish_at IS NOT NULL AND status = 'draft';

COMMENT ON INDEX core.idx_jobs_scheduled_publish_at IS
  'Index for efficiently finding draft jobs scheduled for future publication.';

COMMIT;

