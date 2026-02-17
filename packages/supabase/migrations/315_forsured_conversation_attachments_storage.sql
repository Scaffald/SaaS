-- =========================================================
-- 315_forsured_conversation_attachments_storage.sql
-- Storage bucket and policies for conversation attachments,
-- plus org-level email policy setting
-- =========================================================

BEGIN;

-- =============================================================================
-- 1. CREATE STORAGE BUCKET: conversation-attachments
-- =============================================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'conversation-attachments',
  'conversation-attachments',
  FALSE,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',                                                          -- .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      -- .docx
    'application/vnd.ms-excel',                                                    -- .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',            -- .xlsx
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. STORAGE RLS POLICIES ON storage.objects
-- =============================================================================

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS conversation_attachments_storage_read ON storage.objects;
DROP POLICY IF EXISTS conversation_attachments_storage_write ON storage.objects;
DROP POLICY IF EXISTS conversation_attachments_storage_service_role ON storage.objects;

-- READ: authenticated users can read files in conversations they participate in
-- Path format: {conversation_id}/{filename}
CREATE POLICY conversation_attachments_storage_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'conversation-attachments'
    AND forsured.is_conversation_participant(
      (storage.foldername(name))[1]::UUID,
      auth.uid()
    )
  );

-- WRITE: authenticated users can upload files to conversations they participate in
CREATE POLICY conversation_attachments_storage_write
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'conversation-attachments'
    AND forsured.is_conversation_participant(
      (storage.foldername(name))[1]::UUID,
      auth.uid()
    )
  );

-- Service role has full access (for edge functions / webhooks)
CREATE POLICY conversation_attachments_storage_service_role
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'conversation-attachments')
  WITH CHECK (bucket_id = 'conversation-attachments');

-- =============================================================================
-- 3. ORG EMAIL POLICY ENUM + COLUMN
-- =============================================================================

-- Create enum idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'email_policy'
      AND n.nspname = 'forsured'
  ) THEN
    CREATE TYPE forsured.email_policy AS ENUM ('full_content', 'links_only');
  END IF;
END $$;

-- Add column to organizations table
ALTER TABLE forsured.organizations
  ADD COLUMN IF NOT EXISTS conversation_email_policy forsured.email_policy NOT NULL DEFAULT 'full_content';

COMMENT ON COLUMN forsured.organizations.conversation_email_policy IS
  'Controls how conversation notification emails are sent: full_content includes the message body in the email, links_only sends a link back to the app.';

COMMIT;

-- =============================================================================
-- 4. VERIFICATION
-- =============================================================================

DO $$
BEGIN
  -- Verify bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'conversation-attachments') THEN
    RAISE EXCEPTION 'Storage bucket conversation-attachments was not created';
  END IF;

  -- Verify enum exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'email_policy' AND n.nspname = 'forsured'
  ) THEN
    RAISE EXCEPTION 'Enum forsured.email_policy was not created';
  END IF;

  -- Verify column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured'
      AND table_name = 'organizations'
      AND column_name = 'conversation_email_policy'
  ) THEN
    RAISE EXCEPTION 'Column conversation_email_policy was not added to forsured.organizations';
  END IF;

  RAISE NOTICE 'Storage bucket conversation-attachments created with RLS policies';
  RAISE NOTICE 'Enum forsured.email_policy created';
  RAISE NOTICE 'Column forsured.organizations.conversation_email_policy added';
END $$;
