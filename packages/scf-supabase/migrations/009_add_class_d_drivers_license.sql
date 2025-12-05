-- Migration: Add Class D default for existing users with empty license classes
-- Date: 2025-11-05
-- Purpose: Set Class D (standard driver's license) as default for users who
--          previously checked "I have a license" but didn't specify a class
-- Requirement: REQ-35

BEGIN;
-- Update users with empty or null license classes to include Class D
-- This assumes users who checked "I have a license" but didn't specify
-- a class have the standard Class D license
-- Only update users who have other employment data (indicates they've used the form)
UPDATE core.profile
SET drivers_license_classes = ARRAY['Class D']::text[]
WHERE (drivers_license_classes = ARRAY[]::text[] OR drivers_license_classes IS NULL)
  AND (
    -- Users who have employment-related data indicating they've used the form
    preferred_work_locations IS NOT NULL
    OR travel_distance_miles IS NOT NULL
    OR hourly_rate_cents IS NOT NULL
    OR open_to_travel IS NOT NULL
  );
-- Log the number of affected rows for verification
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Migration updated % users with Class D default', affected_count;
END $$;
COMMIT;
