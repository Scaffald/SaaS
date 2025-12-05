-- Add new columns to core.user_education for enhanced education tracking
ALTER TABLE core.user_education
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expected_graduation_date DATE,
  ADD COLUMN IF NOT EXISTS gpa NUMERIC(3,2);
-- Make university_id optional (already handled by constraint, but ensure it's nullable)
-- The constraint user_education_id_or_name_check already ensures either university_id OR institution_name is provided
ALTER TABLE core.user_education
  ALTER COLUMN university_id DROP NOT NULL;
-- Add index for verification status (useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_user_education_verification 
  ON core.user_education(is_verified) 
  WHERE is_verified = false;
-- Add comment explaining the verification flag
COMMENT ON COLUMN core.user_education.is_verified IS 'True when institution is from university catalog, false when manually entered';
