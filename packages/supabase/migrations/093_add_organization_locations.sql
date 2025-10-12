-- =========================================================
-- 093_add_organization_locations.sql
-- Add locations support to organizations table
-- Following existing convention of JSONB arrays like preferred_work_locations
-- =========================================================

BEGIN;

-- Add locations column to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS locations jsonb DEFAULT '[]'::jsonb;

-- Add index for better query performance on locations
CREATE INDEX IF NOT EXISTS organizations_locations_gin_idx 
ON public.organizations USING GIN(locations);

-- Add comment
COMMENT ON COLUMN public.organizations.locations IS
  'Array of organization locations, each with name and address. Format: [{ name: string, address: jsonb }]';

COMMIT;
