-- =========================================================
-- 006_storage.sql - Storage Buckets and Policies
-- Supabase Storage configuration for file uploads
-- =========================================================

BEGIN;
-- =========================================================
-- SECTION 1: AVATARS BUCKET
-- =========================================================

-- Create avatars storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
-- Avatar images are publicly accessible
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'avatars');
-- Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- =========================================================
-- SECTION 2: CERTIFICATIONS BUCKET
-- =========================================================

-- Create certifications storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;
-- Certification files are publicly accessible
DROP POLICY IF EXISTS "Certification files are publicly accessible" ON storage.objects;
CREATE POLICY "Certification files are publicly accessible" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'certifications');
-- Users can upload their own certification files
DROP POLICY IF EXISTS "Users can upload their own certification files" ON storage.objects;
CREATE POLICY "Users can upload their own certification files" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can update their own certification files
DROP POLICY IF EXISTS "Users can update their own certification files" ON storage.objects;
CREATE POLICY "Users can update their own certification files" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Users can delete their own certification files
DROP POLICY IF EXISTS "Users can delete their own certification files" ON storage.objects;
CREATE POLICY "Users can delete their own certification files" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- =========================================================
-- SECTION 3: CMS MEDIA BUCKET
-- =========================================================

-- Create storage bucket for CMS media (images, videos, documents, etc.)
-- Organized by content type: welcome-slides, pages, blog-posts, etc.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'cms-media',
  'cms-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
-- Public read access for all CMS media
DROP POLICY IF EXISTS "Public read access for cms-media" ON storage.objects;
CREATE POLICY "Public read access for cms-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cms-media');
-- Admin upload access for CMS media
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
    AND r.name = 'super_admin'
  )
);
-- Admin update access for CMS media
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
    AND r.name = 'super_admin'
  )
);
-- Admin delete access for CMS media
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
    AND r.name = 'super_admin'
  )
);
COMMIT;
-- =========================================================
-- USAGE NOTES
-- =========================================================
--
-- Avatar Storage:
-- - Path format: avatars/{user_id}/{filename}
-- - Public read access
-- - Users can only manage their own avatars
--
-- Certifications Storage:
-- - Path format: certifications/{user_id}/{filename}
-- - Public read access (allows sharing certificates)
-- - Users can only manage their own certification files
-- - Supports PDFs and images
--
-- CMS Media Storage:
-- - Path format: cms-media/{content_type}/{filename}
-- - Public read access
-- - Admin-only write/update/delete access (super_admin role required)
-- - Supports images (JPEG, PNG, WebP, GIF)
--
-- =========================================================;
