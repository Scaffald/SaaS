-- 025_add_employment_profile_columns.sql
-- Add missing employment profile columns to user_private table

BEGIN;

-- Add employment-related columns to user_private table
ALTER TABLE public.user_private 
ADD COLUMN IF NOT EXISTS employment_street text,
ADD COLUMN IF NOT EXISTS employment_city text,
ADD COLUMN IF NOT EXISTS employment_state text,
ADD COLUMN IF NOT EXISTS employment_zip text,
ADD COLUMN IF NOT EXISTS employment_country text,
ADD COLUMN IF NOT EXISTS willing_to_travel boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_distance_miles integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS us_resident boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS us_passport boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS availability text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);

-- Update existing columns to use jsonb for better querying
-- Note: preferred_work_locations, residency_countries, drivers_license_classes, military_status 
-- were added in migration 021 as text[] which is fine, but we'll add JSON columns for complex data

-- Add indexes for performance on commonly queried fields
CREATE INDEX IF NOT EXISTS user_private_willing_to_travel_idx ON public.user_private(willing_to_travel) WHERE willing_to_travel = true;
CREATE INDEX IF NOT EXISTS user_private_us_resident_idx ON public.user_private(us_resident) WHERE us_resident = true;
CREATE INDEX IF NOT EXISTS user_private_hourly_rate_idx ON public.user_private(hourly_rate) WHERE hourly_rate IS NOT NULL;

-- Add GIN index for array columns for better array operations
CREATE INDEX IF NOT EXISTS user_private_availability_gin_idx ON public.user_private USING GIN(availability);
CREATE INDEX IF NOT EXISTS user_private_preferred_work_locations_gin_idx ON public.user_private USING GIN(preferred_work_locations);
CREATE INDEX IF NOT EXISTS user_private_drivers_license_gin_idx ON public.user_private USING GIN(drivers_license_classes);

COMMIT;
