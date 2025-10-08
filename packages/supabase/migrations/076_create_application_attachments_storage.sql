-- =========================================================
-- 076_create_application_attachments_storage.sql
-- Creates storage bucket for application attachments with RLS policies
-- =========================================================

BEGIN;

-- =========================================================
-- Create storage bucket for application attachments
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-attachments',
  'application-attachments',
  false, -- Not public, requires authentication
  524288000, -- 500MB max file size
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- RLS Policies for application-attachments bucket
-- =========================================================

-- Users can upload their own attachments (INSERT)
CREATE POLICY "application_attachments_user_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'application-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own attachments (SELECT)
CREATE POLICY "application_attachments_user_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own attachments (UPDATE)
CREATE POLICY "application_attachments_user_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'application-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own attachments (DELETE)
CREATE POLICY "application_attachments_user_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Organization owners can view attachments for their jobs (SELECT)
CREATE POLICY "application_attachments_owner_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE (storage.foldername(name))[1] = a.user_id::text
        AND (storage.foldername(name))[2] = a.job_id::text
        AND o.owner_user_id = auth.uid()
    )
  );

-- Platform admins can view all attachments (SELECT)
CREATE POLICY "application_attachments_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Platform admins can delete any attachment (DELETE)
CREATE POLICY "application_attachments_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'application-attachments'
    AND EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Service role has full access
GRANT ALL ON storage.objects TO service_role;

-- =========================================================
-- Helper function to generate attachment path
-- =========================================================
CREATE OR REPLACE FUNCTION public.generate_attachment_path(
  p_user_id uuid,
  p_job_id uuid,
  p_application_id uuid,
  p_attachment_type text,
  p_filename text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Path format: {user_id}/{job_id}/{application_id}/{attachment_type}/{filename}
  RETURN format(
    '%s/%s/%s/%s/%s',
    p_user_id,
    p_job_id,
    p_application_id,
    p_attachment_type,
    p_filename
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_attachment_path TO authenticated;

-- =========================================================
-- Helper function to validate attachment type
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_valid_attachment_type(p_type text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_type IN ('resume', 'cover_letter', 'portfolio', 'assessment', 'video_interview');
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_valid_attachment_type TO authenticated;

-- =========================================================
-- Helper function to get attachment metadata
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_attachment_metadata(
  p_application_id uuid,
  p_attachment_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  -- Extract attachment metadata from attachments JSON column
  SELECT attachments->p_attachment_type INTO v_metadata
  FROM public.applications
  WHERE id = p_application_id;
  
  RETURN v_metadata;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_attachment_metadata TO authenticated;

COMMIT;
