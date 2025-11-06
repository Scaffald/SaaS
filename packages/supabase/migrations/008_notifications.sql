-- =========================================================
-- 008_notifications.sql - Notifications System
-- Creates notifications table, policies, indexes, and triggers
-- =========================================================

BEGIN;

-- =========================================================
-- NOTIFICATION TYPE ENUM
-- =========================================================
CREATE TYPE core.notification_type AS ENUM ('success', 'warning', 'info');

-- =========================================================
-- NOTIFICATIONS TABLE
-- =========================================================
CREATE TABLE core.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) - added in relations section
  type core.notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  destination_url TEXT,  -- Navigation URL when notification is clicked
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.notifications IS 'User notifications for profile updates, new workers, payments, etc.';
COMMENT ON COLUMN core.notifications.destination_url IS 'URL to navigate to when notification is clicked';

-- =========================================================
-- FOREIGN KEY RELATIONSHIPS
-- =========================================================
ALTER TABLE core.notifications
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY notifications_select_own
  ON core.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own
  ON core.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications (for system-generated notifications)
CREATE POLICY notifications_insert_service_role
  ON core.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own notifications (for testing/self-notifications)
CREATE POLICY notifications_insert_own
  ON core.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- INDEXES
-- =========================================================
-- User lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON core.notifications(user_id);

-- Unread notifications filter
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON core.notifications(user_id, read) 
  WHERE read = false;

-- Created at for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON core.notifications(user_id, created_at DESC);

-- Composite index for common query pattern: unread notifications for user, sorted by date
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created 
  ON core.notifications(user_id, created_at DESC) 
  WHERE read = false;

-- =========================================================
-- TRIGGERS
-- =========================================================
-- Auto-update updated_at timestamp
CREATE TRIGGER notifications_set_updated_at
  BEFORE UPDATE ON core.notifications
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE ON core.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.notifications TO service_role;

COMMIT;

