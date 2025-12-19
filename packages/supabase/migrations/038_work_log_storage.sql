-- =========================================================
-- 038_work_log_storage.sql
-- Storage bucket and policies for Work Log photos
-- =========================================================

BEGIN;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'work-log-photos',
  'work-log-photos',
  FALSE,
  2097152, -- 2MB limit per original upload before compression
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Revoke existing policies to ensure clean slate
DROP POLICY IF EXISTS work_log_photos_read_self ON storage.objects;
DROP POLICY IF EXISTS work_log_photos_write_self ON storage.objects;
DROP POLICY IF EXISTS work_log_photos_update_self ON storage.objects;
DROP POLICY IF EXISTS work_log_photos_delete_self ON storage.objects;
DROP POLICY IF EXISTS work_log_photos_admin_access ON storage.objects;

-- Workers can read their own uploaded photos
CREATE POLICY work_log_photos_read_self
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'work-log-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Workers can upload
CREATE POLICY work_log_photos_write_self
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'work-log-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Workers can update their own uploads
CREATE POLICY work_log_photos_update_self
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'work-log-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'work-log-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Workers can delete their own uploads
CREATE POLICY work_log_photos_delete_self
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'work-log-photos'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Service role has full access
CREATE POLICY work_log_photos_admin_access
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'work-log-photos')
  WITH CHECK (bucket_id = 'work-log-photos');

COMMIT;


