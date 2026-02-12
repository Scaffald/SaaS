-- =========================================================
-- 303_add_deleted_at_to_notifications.sql
-- Adds deleted_at column to core.notifications for soft delete
-- =========================================================

BEGIN;

-- Add deleted_at column to notifications table
ALTER TABLE core.notifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Add index on deleted_at for query performance
CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at
  ON core.notifications(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Update RLS policies to exclude deleted notifications by default
-- The existing policies already filter by user_id, so deleted notifications
-- will be automatically excluded when we filter by deleted_at IS NULL

-- Add comment
COMMENT ON COLUMN core.notifications.deleted_at IS 'Soft delete timestamp. When set, notification is considered deleted but remains in database for audit purposes.';

COMMIT;
