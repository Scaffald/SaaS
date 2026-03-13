-- =========================================================
-- 306_forsured_insurance_uploads_storage.sql
-- REQ-13: Storage bucket and policies for insurance document uploads
-- =========================================================

BEGIN;

-- Create private storage bucket for insurance uploads
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'insurance-uploads',
  'insurance-uploads',
  FALSE,
  2097152, -- 2MB as per requirement
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing policies before reapplying
DROP POLICY IF EXISTS insurance_uploads_read_contractor ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_read_broker ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_write_contractor ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_write_broker ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_delete_contractor ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_service_role ON storage.objects;
DROP POLICY IF EXISTS insurance_uploads_admin_access ON storage.objects;

-- Contractors can read their own uploaded documents
-- Path format: {contractor_profile_id}/{filename}
CREATE POLICY insurance_uploads_read_contractor
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insurance-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Brokers can read documents for their contractors
CREATE POLICY insurance_uploads_read_broker
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insurance-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT bcr.contractor_id::TEXT
      FROM forsured.broker_contractor_relationships bcr
      JOIN forsured.user_profiles up ON up.id = bcr.broker_id
      WHERE up.scaffald_user_id = auth.uid()
      AND bcr.status = 'active'
    )
  );

-- Admins can read all insurance uploads
CREATE POLICY insurance_uploads_admin_access
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'insurance-uploads'
    AND EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Contractors can upload their own documents
CREATE POLICY insurance_uploads_write_contractor
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insurance-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Brokers can upload documents for their contractors
CREATE POLICY insurance_uploads_write_broker
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'insurance-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT bcr.contractor_id::TEXT
      FROM forsured.broker_contractor_relationships bcr
      JOIN forsured.user_profiles up ON up.id = bcr.broker_id
      WHERE up.scaffald_user_id = auth.uid()
      AND bcr.status = 'active'
    )
  );

-- Contractors can delete their own documents
CREATE POLICY insurance_uploads_delete_contractor
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'insurance-uploads'
    AND (storage.foldername(name))[1] IN (
      SELECT id::TEXT FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Service role has full access (for edge functions / webhooks)
CREATE POLICY insurance_uploads_service_role
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'insurance-uploads')
  WITH CHECK (bucket_id = 'insurance-uploads');

COMMIT;

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'insurance-uploads') THEN
    RAISE EXCEPTION 'Storage bucket insurance-uploads was not created';
  END IF;

  RAISE NOTICE '✅ Storage bucket insurance-uploads created with policies';
END $$;
