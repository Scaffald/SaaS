-- =========================================================
-- 031_req_173_feedback_schema.sql
-- Schema, table, policies, and storage setup for global feedback system
-- =========================================================

BEGIN;

-- Create logs schema for feedback data
CREATE SCHEMA IF NOT EXISTS logs;
COMMENT ON SCHEMA logs IS 'Application logging and feedback data';
ALTER SCHEMA logs OWNER TO postgres;

GRANT USAGE ON SCHEMA logs TO authenticated;
GRANT ALL ON SCHEMA logs TO service_role;

-- Create feedback table
CREATE TABLE IF NOT EXISTS logs.user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User metadata
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- Feedback content
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'comment')),
  feedback_text TEXT NOT NULL CHECK (char_length(feedback_text) BETWEEN 100 AND 5000),
  screenshot_path TEXT,

  -- Context metadata
  page_url TEXT NOT NULL,
  page_title TEXT,
  user_agent TEXT,
  browser_name TEXT,
  browser_version TEXT,
  operating_system TEXT,
  screen_resolution TEXT,
  viewport_size TEXT,

  -- Braingrid sync tracking
  braingrid_feature_id TEXT,
  braingrid_sync_status TEXT DEFAULT 'pending' CHECK (braingrid_sync_status IN ('pending', 'synced', 'failed')),
  braingrid_sync_error TEXT,
  braingrid_synced_at TIMESTAMPTZ,

  -- Retry metadata
  sync_retry_count INTEGER NOT NULL DEFAULT 0 CHECK (sync_retry_count >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE logs.user_feedback IS 'User-submitted feedback including bugs, features, and comments';
COMMENT ON COLUMN logs.user_feedback.feedback_type IS 'Type of feedback: bug, feature, or comment';
COMMENT ON COLUMN logs.user_feedback.braingrid_sync_status IS 'Status of sync to Braingrid: pending, synced, or failed';

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS set_logs_user_feedback_updated_at ON logs.user_feedback;
CREATE TRIGGER set_logs_user_feedback_updated_at
  BEFORE UPDATE ON logs.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Indexes to support queries and retries
CREATE INDEX IF NOT EXISTS idx_logs_user_feedback_user_id ON logs.user_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_feedback_type ON logs.user_feedback (feedback_type);
CREATE INDEX IF NOT EXISTS idx_logs_user_feedback_sync_status
  ON logs.user_feedback (braingrid_sync_status)
  WHERE braingrid_sync_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_logs_user_feedback_created_at
  ON logs.user_feedback (created_at DESC);

-- Enable RLS and define policies
ALTER TABLE logs.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_feedback_insert_self ON logs.user_feedback;
CREATE POLICY user_feedback_insert_self
  ON logs.user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_feedback_select_self ON logs.user_feedback;
CREATE POLICY user_feedback_select_self
  ON logs.user_feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_feedback_service_full_access ON logs.user_feedback;
CREATE POLICY user_feedback_service_full_access
  ON logs.user_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for authenticated users
DROP POLICY IF EXISTS feedback_screenshots_insert ON storage.objects;
CREATE POLICY feedback_screenshots_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS feedback_screenshots_select ON storage.objects;
CREATE POLICY feedback_screenshots_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS feedback_screenshots_service ON storage.objects;
CREATE POLICY feedback_screenshots_service
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'feedback-screenshots')
  WITH CHECK (bucket_id = 'feedback-screenshots');

COMMIT;


