-- Add structured location column to user_experience
-- REQ-36: Work Experience Location Auto-Population
ALTER TABLE core.user_experience
  ADD COLUMN IF NOT EXISTS location_structured JSONB;

COMMENT ON COLUMN core.user_experience.location_structured IS 
  'Structured address data matching user_private.address format: {street, city, state, zip, country, formattedAddress}. Falls back to location TEXT column if not present.';

