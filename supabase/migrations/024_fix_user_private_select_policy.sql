-- 024_fix_user_private_select_policy.sql
-- Fix user_private table SELECT permissions - user can't even read their own data

BEGIN;

-- Drop and recreate both SELECT and UPDATE policies to ensure they work correctly
-- The existing policies might be conflicting with admin policies

-- Fix SELECT policy
DROP POLICY IF EXISTS "user sees their own PII" ON public.user_private;
CREATE POLICY "user sees their own PII"
  ON public.user_private FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Fix UPDATE policy (ensure it's clean)
DROP POLICY IF EXISTS "user updates their own PII" ON public.user_private;
CREATE POLICY "user updates their own PII"
  ON public.user_private FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix INSERT policy (in case user needs to create initial record)
DROP POLICY IF EXISTS "user manages their own PII" ON public.user_private;
CREATE POLICY "user manages their own PII"
  ON public.user_private FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;
