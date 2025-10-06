-- 052_add_certification_file_support.sql
-- Add support for file uploads to user_certifications table

BEGIN;

-- Add certificate_file_path column to user_certifications table
ALTER TABLE public.user_certifications
ADD COLUMN IF NOT EXISTS certificate_file_path text;

-- Add index for performance when querying certificates with files
CREATE INDEX IF NOT EXISTS user_certifications_file_path_idx 
ON public.user_certifications(user_id, certificate_file_path) 
WHERE certificate_file_path IS NOT NULL;

-- Add check constraint to ensure at least one of credential_url or certificate_file_path is provided
-- (This will be enforced at the application level for now to avoid breaking existing data)

-- Add comment to document the column
COMMENT ON COLUMN public.user_certifications.certificate_file_path IS 
'Path to uploaded certificate file in Supabase Storage (certifications bucket). 
Users can either provide a credential_url (external link) or upload a file (PDF/image).';

COMMIT;
