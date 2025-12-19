-- =========================================================
-- 012_update_cms_media_policies.sql - Update CMS media RLS policies
-- Updates storage policies to allow office role (not just super_admin)
-- =========================================================

BEGIN;
-- Update upload policy to allow office role or super_admin
DROP POLICY IF EXISTS "Admin upload access for cms-media" ON storage.objects;
CREATE POLICY "Admin upload access for cms-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.scope = 'platform'
    AND (r.name = 'office' OR r.name = 'super_admin')
  )
);
-- Update update policy to allow office role or super_admin
DROP POLICY IF EXISTS "Admin update access for cms-media" ON storage.objects;
CREATE POLICY "Admin update access for cms-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.scope = 'platform'
    AND (r.name = 'office' OR r.name = 'super_admin')
  )
);
-- Update delete policy to allow office role or super_admin
DROP POLICY IF EXISTS "Admin delete access for cms-media" ON storage.objects;
CREATE POLICY "Admin delete access for cms-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.scope = 'platform'
    AND (r.name = 'office' OR r.name = 'super_admin')
  )
);
COMMIT;
