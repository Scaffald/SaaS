-- Fix organizations table RLS permissions
-- The user_private trigger is trying to access organizations table through role checking functions
-- This ensures authenticated users can read organizations data when needed

BEGIN;

-- Grant basic read permissions to authenticated users for organizations table
GRANT SELECT ON public.organizations TO authenticated;

-- Ensure the existing read policy allows authenticated users to read organizations
-- The existing policy should already allow this, but let's make sure
DROP POLICY IF EXISTS "orgs_read" ON public.organizations;
CREATE POLICY "orgs_read" 
  ON public.organizations FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Also ensure role_assignments table is readable by authenticated users
-- since the user_has_role function needs to check this
GRANT SELECT ON public.role_assignments TO authenticated;

-- Create a read policy for role_assignments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'role_assignments' 
    AND policyname = 'role_assignments_read'
  ) THEN
    CREATE POLICY "role_assignments_read"
      ON public.role_assignments FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Also ensure roles table is readable
GRANT SELECT ON public.roles TO authenticated;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'roles' 
    AND policyname = 'roles_read'
  ) THEN
    CREATE POLICY "roles_read"
      ON public.roles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

COMMIT;
