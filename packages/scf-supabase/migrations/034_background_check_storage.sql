-- =========================================================
-- 034_background_check_storage.sql
-- Storage bucket and policies for background check documents
-- =========================================================

BEGIN;

-- Create private storage bucket for background check documents
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'background-check-documents',
  'background-check-documents',
  FALSE,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Revoke any existing policies before reapplying
DROP POLICY IF EXISTS background_check_documents_read_self ON storage.objects;
DROP POLICY IF EXISTS background_check_documents_write_self ON storage.objects;
DROP POLICY IF EXISTS background_check_documents_delete_self ON storage.objects;
DROP POLICY IF EXISTS background_check_documents_admin_access ON storage.objects;

-- Workers can read their own uploaded documents
CREATE POLICY background_check_documents_read_self
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'background-check-documents'
    AND (
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR core.user_has_role(auth.uid(), 'office')
      OR core.user_has_role(auth.uid(), 'background_check_admin')
    )
  );

-- Workers can upload/update their own documents
CREATE POLICY background_check_documents_write_self
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'background-check-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY background_check_documents_update_self
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'background-check-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'background-check-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY background_check_documents_delete_self
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'background-check-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Service role and admin roles have full access
CREATE POLICY background_check_documents_admin_access
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'background-check-documents')
  WITH CHECK (bucket_id = 'background-check-documents');

COMMIT;



