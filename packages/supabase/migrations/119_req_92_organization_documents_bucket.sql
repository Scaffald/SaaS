-- =========================================================
-- 119_req_92_organization_documents_bucket.sql
-- REQ-92: Supabase Storage bucket for organization documents
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.get_org_id_from_path(object_name TEXT)
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
COMMENT ON FUNCTION core.get_org_id_from_path(TEXT)
  IS 'Parses the first folder segment of a storage object path as a UUID if possible.';
GRANT EXECUTE ON FUNCTION core.get_org_id_from_path(TEXT) TO authenticated, service_role;

-- Create private bucket for organization documents
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'organization-documents',
  'organization-documents',
  false,
  50 * 1024 * 1024, -- 50 MB safety net (per-tier overrides enforced in API)
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Storage Policies
-- Path format: organization-documents/{organization_id}/{document_id}/{version_id}/{filename}
-- =========================================================

-- Allow organization members to read files in their org bucket
DROP POLICY IF EXISTS "Organization documents readable by members" ON storage.objects;
CREATE POLICY "Organization documents readable by members"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND core.get_org_id_from_path(name) IS NOT NULL
  AND core.is_org_member(core.get_org_id_from_path(name))
);

-- Allow organization members to upload new files
DROP POLICY IF EXISTS "Organization documents upload" ON storage.objects;
CREATE POLICY "Organization documents upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-documents'
  AND core.get_org_id_from_path(name) IS NOT NULL
  AND core.is_org_member(core.get_org_id_from_path(name))
);

-- Allow organization members to update their files (used for metadata adjustments)
DROP POLICY IF EXISTS "Organization documents update" ON storage.objects;
CREATE POLICY "Organization documents update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND core.get_org_id_from_path(name) IS NOT NULL
  AND core.is_org_member(core.get_org_id_from_path(name))
);

-- Allow organization members to delete files they own/manage
DROP POLICY IF EXISTS "Organization documents delete" ON storage.objects;
CREATE POLICY "Organization documents delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-documents'
  AND core.get_org_id_from_path(name) IS NOT NULL
  AND core.is_org_member(core.get_org_id_from_path(name))
);

COMMIT;

