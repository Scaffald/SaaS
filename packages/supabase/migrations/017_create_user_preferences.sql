-- =========================================================
-- 017_create_user_preferences.sql
-- Creates user_preferences table for storing user settings and tracking prerequisites completion
-- =========================================================

BEGIN;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User persona/type selections (array for multi-select)
  -- Options: 'worker', 'employer', 'customer'
  user_types text[] DEFAULT '{}' NOT NULL,
  
  -- Prerequisites completion tracking
  prerequisites_completed_at timestamptz,
  
  -- Future expansion fields
  notification_preferences jsonb DEFAULT '{}',
  ui_preferences jsonb DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (private - users can only see their own preferences)
DROP POLICY IF EXISTS "users see own preferences" ON public.user_preferences;
CREATE POLICY "users see own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users insert own preferences" ON public.user_preferences;
CREATE POLICY "users insert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users update own preferences" ON public.user_preferences;
CREATE POLICY "users update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS user_preferences_completed_idx 
  ON public.user_preferences(prerequisites_completed_at) 
  WHERE prerequisites_completed_at IS NOT NULL;

COMMIT;
