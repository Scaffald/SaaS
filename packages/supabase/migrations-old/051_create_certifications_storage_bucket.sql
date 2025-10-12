-- 051_create_certifications_storage_bucket.sql
-- Create storage bucket for certification files (PDFs and images)

BEGIN;

-- Create certifications storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for certifications bucket (idempotent)

-- Public read access - allows viewing/downloading certificates
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
