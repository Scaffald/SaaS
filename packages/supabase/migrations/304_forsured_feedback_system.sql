-- =========================================================
-- 304_forsured_feedback_system.sql
-- Feedback Modal System - Database Schema & Storage
-- =========================================================

BEGIN;

-- =========================================================
-- FEEDBACK ITEMS TABLE
-- Main table for user-submitted feedback
-- =========================================================
CREATE TABLE forsured.feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'support', 'general')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'archived')),
  subject TEXT NOT NULL,
  source_url TEXT,
  assigned_to UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL,
  user_archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE forsured.feedback_items IS 'User feedback submissions including bugs, feature requests, support requests, and general feedback';
COMMENT ON COLUMN forsured.feedback_items.type IS 'Type of feedback: bug, feature, support, or general';
COMMENT ON COLUMN forsured.feedback_items.status IS 'Current status: open, in_progress, resolved, or archived';
COMMENT ON COLUMN forsured.feedback_items.source_url IS 'URL where the user submitted feedback from';
COMMENT ON COLUMN forsured.feedback_items.assigned_to IS 'Admin user who owns/is handling this feedback';
COMMENT ON COLUMN forsured.feedback_items.user_archived_at IS 'Timestamp when user archived this feedback (hides from their view)';

-- =========================================================
-- FEEDBACK MESSAGES TABLE
-- Conversation thread between user and admin
-- =========================================================
CREATE TABLE forsured.feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES forsured.feedback_items(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE forsured.feedback_messages IS 'Messages in feedback conversations between users and admins';
COMMENT ON COLUMN forsured.feedback_messages.sender_type IS 'Whether message is from user or admin';
COMMENT ON COLUMN forsured.feedback_messages.read_at IS 'Timestamp when recipient read the message';

-- =========================================================
-- FEEDBACK ATTACHMENTS TABLE
-- File attachments linked to messages
-- =========================================================
CREATE TABLE forsured.feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES forsured.feedback_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE forsured.feedback_attachments IS 'File attachments (screenshots, documents) for feedback messages';
COMMENT ON COLUMN forsured.feedback_attachments.file_path IS 'Path in Supabase storage bucket';

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_feedback_items_user ON forsured.feedback_items(user_id);
CREATE INDEX idx_feedback_items_assigned ON forsured.feedback_items(assigned_to);
CREATE INDEX idx_feedback_items_status ON forsured.feedback_items(status);
CREATE INDEX idx_feedback_items_type ON forsured.feedback_items(type);
CREATE INDEX idx_feedback_items_created ON forsured.feedback_items(created_at DESC);
CREATE INDEX idx_feedback_items_updated ON forsured.feedback_items(updated_at DESC);

CREATE INDEX idx_feedback_messages_feedback ON forsured.feedback_messages(feedback_id);
CREATE INDEX idx_feedback_messages_created ON forsured.feedback_messages(feedback_id, created_at ASC);

CREATE INDEX idx_feedback_attachments_message ON forsured.feedback_attachments(message_id);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Auto-update updated_at timestamp on feedback_items
CREATE TRIGGER feedback_items_set_updated_at
  BEFORE UPDATE ON forsured.feedback_items
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Update feedback_items.updated_at when a new message is added
CREATE OR REPLACE FUNCTION forsured.update_feedback_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forsured.feedback_items
  SET updated_at = NOW()
  WHERE id = NEW.feedback_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_messages_update_item_timestamp
  AFTER INSERT ON forsured.feedback_messages
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_feedback_item_timestamp();

-- =========================================================
-- ROW LEVEL SECURITY - FEEDBACK ITEMS
-- =========================================================
ALTER TABLE forsured.feedback_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback items
CREATE POLICY feedback_items_select_own
  ON forsured.feedback_items
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
    )
  );

-- Admins can view ALL feedback items
CREATE POLICY feedback_items_select_admin
  ON forsured.feedback_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Users can insert their own feedback items
CREATE POLICY feedback_items_insert_own
  ON forsured.feedback_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
    )
  );

-- Users can update their own feedback items (archive only - enforced at app level)
CREATE POLICY feedback_items_update_own
  ON forsured.feedback_items
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
    )
  );

-- Admins can update ANY feedback item (status, assigned_to)
CREATE POLICY feedback_items_update_admin
  ON forsured.feedback_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Service role can do anything (for tRPC backend)
CREATE POLICY feedback_items_service_role
  ON forsured.feedback_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- ROW LEVEL SECURITY - FEEDBACK MESSAGES
-- =========================================================
ALTER TABLE forsured.feedback_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own feedback items
CREATE POLICY feedback_messages_select_own
  ON forsured.feedback_messages
  FOR SELECT
  TO authenticated
  USING (
    feedback_id IN (
      SELECT id FROM forsured.feedback_items
      WHERE user_id IN (
        SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
      )
    )
  );

-- Admins can view ALL messages
CREATE POLICY feedback_messages_select_admin
  ON forsured.feedback_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Users can insert messages on their own feedback items
CREATE POLICY feedback_messages_insert_own
  ON forsured.feedback_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    feedback_id IN (
      SELECT id FROM forsured.feedback_items
      WHERE user_id IN (
        SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
      )
    )
    AND sender_type = 'user'
  );

-- Admins can insert messages on ANY feedback item
CREATE POLICY feedback_messages_insert_admin
  ON forsured.feedback_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
    AND sender_type = 'admin'
  );

-- Users can update messages (mark as read) on their own feedback
CREATE POLICY feedback_messages_update_own
  ON forsured.feedback_messages
  FOR UPDATE
  TO authenticated
  USING (
    feedback_id IN (
      SELECT id FROM forsured.feedback_items
      WHERE user_id IN (
        SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
      )
    )
  );

-- Admins can update ANY message
CREATE POLICY feedback_messages_update_admin
  ON forsured.feedback_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Service role can do anything
CREATE POLICY feedback_messages_service_role
  ON forsured.feedback_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- ROW LEVEL SECURITY - FEEDBACK ATTACHMENTS
-- =========================================================
ALTER TABLE forsured.feedback_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments on their own feedback messages
CREATE POLICY feedback_attachments_select_own
  ON forsured.feedback_attachments
  FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT fm.id FROM forsured.feedback_messages fm
      JOIN forsured.feedback_items fi ON fm.feedback_id = fi.id
      WHERE fi.user_id IN (
        SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
      )
    )
  );

-- Admins can view ALL attachments
CREATE POLICY feedback_attachments_select_admin
  ON forsured.feedback_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Users can insert attachments on their own messages
CREATE POLICY feedback_attachments_insert_own
  ON forsured.feedback_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    message_id IN (
      SELECT fm.id FROM forsured.feedback_messages fm
      JOIN forsured.feedback_items fi ON fm.feedback_id = fi.id
      WHERE fi.user_id IN (
        SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
      )
    )
  );

-- Admins can insert attachments on any message
CREATE POLICY feedback_attachments_insert_admin
  ON forsured.feedback_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Service role can do anything
CREATE POLICY feedback_attachments_service_role
  ON forsured.feedback_attachments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE ON forsured.feedback_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON forsured.feedback_messages TO authenticated;
GRANT SELECT, INSERT ON forsured.feedback_attachments TO authenticated;

GRANT ALL ON forsured.feedback_items TO service_role;
GRANT ALL ON forsured.feedback_messages TO service_role;
GRANT ALL ON forsured.feedback_attachments TO service_role;

-- =========================================================
-- STORAGE BUCKET - FEEDBACK ATTACHMENTS
-- =========================================================

-- Helper function to extract user_id from feedback attachment path
-- Path format: {user_id}/{feedback_id}/{filename}
CREATE OR REPLACE FUNCTION forsured.get_feedback_user_id_from_path(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  first_segment TEXT;
BEGIN
  first_segment := (storage.foldername(object_name))[1];
  IF first_segment IS NULL THEN
    RETURN NULL;
  END IF;

  IF first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN first_segment::uuid;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION forsured.get_feedback_user_id_from_path(TEXT)
  IS 'Parses the first folder segment (user_id) of a feedback attachment storage path';
GRANT EXECUTE ON FUNCTION forsured.get_feedback_user_id_from_path(TEXT) TO authenticated, service_role;

-- Create private bucket for feedback attachments
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  false,
  2 * 1024 * 1024, -- 2 MB limit per file
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- STORAGE POLICIES
-- Path format: feedback-attachments/{user_id}/{feedback_id}/{filename}
-- =========================================================

-- Allow users to read their own attachments
DROP POLICY IF EXISTS "Feedback attachments readable by owner" ON storage.objects;
CREATE POLICY "Feedback attachments readable by owner"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-attachments'
  AND forsured.get_feedback_user_id_from_path(name) IN (
    SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
  )
);

-- Allow admins to read ALL feedback attachments
DROP POLICY IF EXISTS "Feedback attachments readable by admin" ON storage.objects;
CREATE POLICY "Feedback attachments readable by admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-attachments'
  AND EXISTS (
    SELECT 1 FROM forsured.user_profiles
    WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
  )
);

-- Allow users to upload to their own folder
DROP POLICY IF EXISTS "Feedback attachments upload by owner" ON storage.objects;
CREATE POLICY "Feedback attachments upload by owner"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-attachments'
  AND forsured.get_feedback_user_id_from_path(name) IN (
    SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
  )
);

-- Allow admins to upload to any folder
DROP POLICY IF EXISTS "Feedback attachments upload by admin" ON storage.objects;
CREATE POLICY "Feedback attachments upload by admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-attachments'
  AND EXISTS (
    SELECT 1 FROM forsured.user_profiles
    WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
  )
);

-- Allow users to delete their own attachments
DROP POLICY IF EXISTS "Feedback attachments delete by owner" ON storage.objects;
CREATE POLICY "Feedback attachments delete by owner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-attachments'
  AND forsured.get_feedback_user_id_from_path(name) IN (
    SELECT id FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()
  )
);

-- Allow admins to delete any attachment
DROP POLICY IF EXISTS "Feedback attachments delete by admin" ON storage.objects;
CREATE POLICY "Feedback attachments delete by admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback-attachments'
  AND EXISTS (
    SELECT 1 FROM forsured.user_profiles
    WHERE scaffald_user_id = auth.uid() AND user_type = 'admin'
  )
);

COMMIT;
