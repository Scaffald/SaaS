-- 023_fix_user_private_update_policy.sql
-- Fix user_private table update permissions by ensuring basic user policy exists

BEGIN;

-- Drop and recreate the user update policy to ensure it works correctly
-- The existing policy might be conflicting with admin policies
DROP POLICY IF EXISTS "user updates their own PII" ON public.user_private;

-- Create a simple, clear policy for users to update their own data
CREATE POLICY "user updates their own PII"
  ON public.user_private FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
