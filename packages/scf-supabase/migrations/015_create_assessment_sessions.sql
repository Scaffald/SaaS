-- =========================================================
-- 015_create_assessment_sessions.sql - Assessment Sessions Table
-- Polymorphic table for tracking assessment retests and diary entries
-- =========================================================

BEGIN;
-- Create assessment_sessions table
CREATE TABLE core.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('personality', 'career', 'other')),
  session_data JSONB DEFAULT '{}'::jsonb, -- Stores color order, diary responses, sentiment tags
  completed_at TIMESTAMPTZ,
  next_available_at TIMESTAMPTZ, -- For cooldown tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Foreign key to users
ALTER TABLE core.assessment_sessions
  ADD CONSTRAINT assessment_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id
  ON core.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_type
  ON core.assessment_sessions(assessment_type);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_completed_at
  ON core.assessment_sessions(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_next_available
  ON core.assessment_sessions(user_id, next_available_at)
  WHERE next_available_at IS NOT NULL;
-- RLS Policies
ALTER TABLE core.assessment_sessions ENABLE ROW LEVEL SECURITY;
-- Users can view their own sessions
CREATE POLICY assessment_sessions_select_own
  ON core.assessment_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Users can insert their own sessions
CREATE POLICY assessment_sessions_insert_own
  ON core.assessment_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Users can update their own sessions
CREATE POLICY assessment_sessions_update_own
  ON core.assessment_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Users can delete their own sessions
CREATE POLICY assessment_sessions_delete_own
  ON core.assessment_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
-- Auto-update updated_at timestamp
CREATE TRIGGER assessment_sessions_set_updated_at
  BEFORE UPDATE ON core.assessment_sessions
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();
-- Comments
COMMENT ON TABLE core.assessment_sessions IS 'Polymorphic table for tracking assessment retests, diary entries, and cooldown periods';
COMMENT ON COLUMN core.assessment_sessions.session_data IS 'JSONB data: {color_orders: [], diary_response: string, sentiment_tag: string, ...}';
COMMENT ON COLUMN core.assessment_sessions.next_available_at IS 'Timestamp when user can retake this assessment (7-day cooldown for personality tests)';
-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON core.assessment_sessions TO authenticated;
COMMIT;
