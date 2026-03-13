-- =========================================================
-- 401_drop_braingrid_columns.sql
-- Remove BrainGrid sync tracking columns from feedback table
-- BrainGrid integration has been removed from the project
-- =========================================================

BEGIN;

-- Drop the BrainGrid sync status index first
DROP INDEX IF EXISTS logs.idx_logs_user_feedback_sync_status;

-- Drop the comment on the sync status column
COMMENT ON COLUMN logs.user_feedback.braingrid_sync_status IS NULL;

-- Remove BrainGrid-specific columns
ALTER TABLE logs.user_feedback
  DROP COLUMN IF EXISTS braingrid_feature_id,
  DROP COLUMN IF EXISTS braingrid_sync_status,
  DROP COLUMN IF EXISTS braingrid_sync_error,
  DROP COLUMN IF EXISTS braingrid_synced_at,
  DROP COLUMN IF EXISTS sync_retry_count;

COMMIT;
