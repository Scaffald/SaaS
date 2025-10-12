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
-- =========================================================
