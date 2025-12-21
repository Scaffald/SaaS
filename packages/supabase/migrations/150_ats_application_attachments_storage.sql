-- ====================================================================================
-- 150_ats_application_attachments_storage.sql
-- Creates Supabase Storage bucket for application attachments with RLS policies
-- ====================================================================================

BEGIN;

-- =========================================================
-- Create Storage Bucket
-- =========================================================

-- Create application-attachments storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-attachments',
  'application-attachments',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/*',
    'video/*'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Storage Policies (RLS)
-- =========================================================

-- Policy: Users can upload their own attachments
DROP POLICY IF EXISTS "Users can upload their own application attachments" ON storage.objects;
CREATE POLICY "Users can upload their own application attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own attachments
DROP POLICY IF EXISTS "Users can view their own application attachments" ON storage.objects;
CREATE POLICY "Users can view their own application attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Organization members can view attachments for applications to their jobs
DROP POLICY IF EXISTS "Organization members can view attachments for their jobs" ON storage.objects;
CREATE POLICY "Organization members can view attachments for their jobs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-attachments' AND
    EXISTS (
      SELECT 1
      FROM core.applications a
      JOIN core.jobs j ON j.id = a.job_id
      WHERE (
        -- User is owner of the organization
        EXISTS (SELECT 1 FROM core.organizations o WHERE o.id = j.organization_id AND o.owner_user_id = auth.uid())
        OR
        -- User has a role assignment for this organization
        EXISTS (SELECT 1 FROM core.role_assignments ra WHERE ra.scope_org_id = j.organization_id AND ra.user_id = auth.uid())
        OR
        -- User is a member of a team that belongs to this organization
        EXISTS (
          SELECT 1
          FROM core.team_members tm
          JOIN core.teams t ON t.id = tm.team_id
          WHERE t.organization_id = j.organization_id AND tm.user_id = auth.uid()
        )
      )
      AND a.id::text = (storage.foldername(name))[2]
    )
  );

-- Policy: Users can update their own attachments
DROP POLICY IF EXISTS "Users can update their own application attachments" ON storage.objects;
CREATE POLICY "Users can update their own application attachments"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own attachments
DROP POLICY IF EXISTS "Users can delete their own application attachments" ON storage.objects;
CREATE POLICY "Users can delete their own application attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'application-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================================================
-- Helper Function: Generate Attachment Path
-- =========================================================

CREATE OR REPLACE FUNCTION core.generate_application_attachment_path(
  user_id UUID,
  application_id UUID,
  attachment_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  path TEXT;
BEGIN
  -- Path format: {user_id}/{application_id}/{attachment_type}/{timestamp}_{filename}
  path := user_id::text || '/' || application_id::text || '/' || attachment_type || '/';
  RETURN path;
END;
$$;

COMMENT ON FUNCTION core.generate_application_attachment_path IS
  'Generates a storage path for application attachments. Returns the base path; caller should append filename.';

COMMIT;

