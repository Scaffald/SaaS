-- =========================================================
-- 080_add_certification_id_to_user_certifications.sql
-- Links user_certifications to the certifications catalog
-- =========================================================

BEGIN;

-- =========================================================
-- Add certification_id foreign key to user_certifications
-- =========================================================

-- Add certification_id column (nullable for backwards compatibility)
ALTER TABLE public.user_certifications
ADD COLUMN IF NOT EXISTS certification_id uuid REFERENCES public.certifications(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS user_certifications_certification_id_idx 
ON public.user_certifications(certification_id);

-- Create composite index for user + certification lookups
CREATE INDEX IF NOT EXISTS user_certifications_user_cert_idx 
ON public.user_certifications(user_id, certification_id)
WHERE certification_id IS NOT NULL;

-- =========================================================
-- Update columns to be nullable for backwards compatibility
-- =========================================================

-- Make name nullable (will be derived from catalog when certification_id is present)
ALTER TABLE public.user_certifications
ALTER COLUMN name DROP NOT NULL;

-- Make issuing_organization nullable (will be derived from catalog)
ALTER TABLE public.user_certifications
ALTER COLUMN issuing_organization DROP NOT NULL;

-- =========================================================
-- Add verification status enum if not exists
-- =========================================================

DO $$ BEGIN
  CREATE TYPE public.certification_verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add verification status column if not exists
ALTER TABLE public.user_certifications
ADD COLUMN IF NOT EXISTS verification_status public.certification_verification_status DEFAULT 'unverified';

-- =========================================================
-- Add constraint to ensure either certification_id or name is provided
-- =========================================================

ALTER TABLE public.user_certifications
DROP CONSTRAINT IF EXISTS user_certifications_id_or_name_check;

ALTER TABLE public.user_certifications
ADD CONSTRAINT user_certifications_id_or_name_check 
CHECK (
  (certification_id IS NOT NULL) OR 
  (name IS NOT NULL AND issuing_organization IS NOT NULL)
);

-- =========================================================
-- Create helper view for user certifications with catalog data
-- =========================================================

CREATE OR REPLACE VIEW public.v_user_certifications_with_details AS
SELECT
  uc.id,
  uc.user_id,
  uc.certification_id,
  -- Use catalog data if available, otherwise use user-provided data
  COALESCE(c.name, uc.name) as certification_name,
  COALESCE(c.issuing_organization, uc.issuing_organization) as issuing_organization,
  c.category,
  c.requires_renewal,
  c.renewal_period_months,
  uc.issue_date,
  uc.expiration_date,
  uc.credential_id,
  uc.credential_url,
  uc.certificate_file_path,
  uc.description,
  uc.verification_status,
  uc.is_active,
  uc.created_at,
  uc.updated_at,
  -- Include catalog metadata
  c.slug as certification_slug,
  c.description as catalog_description,
  c.typical_duration_days,
  -- Flag to indicate if this is from catalog or free-form
  (uc.certification_id IS NOT NULL) as is_from_catalog
FROM public.user_certifications uc
LEFT JOIN public.certifications c ON c.id = uc.certification_id
WHERE uc.is_active = true;

-- Grant SELECT on the view
GRANT SELECT ON public.v_user_certifications_with_details TO authenticated;

-- =========================================================
-- Add comment to document the changes
-- =========================================================

COMMENT ON COLUMN public.user_certifications.certification_id IS
'Foreign key to certifications catalog. When present, name and issuing_organization are derived from the catalog.';

COMMENT ON COLUMN public.user_certifications.verification_status IS
'Verification status: unverified (default), pending (awaiting verification), verified (confirmed), rejected (invalid)';

COMMIT;
