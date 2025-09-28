-- Fix user_private table RLS policies completely
-- This migration ensures users can read, insert, and update their own private data

BEGIN;

-- First, disable RLS temporarily to clean up
ALTER TABLE public.user_private DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "user sees their own PII" ON public.user_private;
DROP POLICY IF EXISTS "user updates their own PII" ON public.user_private;
DROP POLICY IF EXISTS "user manages their own PII" ON public.user_private;
DROP POLICY IF EXISTS "Users can view own private data" ON public.user_private;
DROP POLICY IF EXISTS "Users can update own private data" ON public.user_private;
DROP POLICY IF EXISTS "Users can insert own private data" ON public.user_private;

-- Re-enable RLS
ALTER TABLE public.user_private ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for all operations
CREATE POLICY "user_private_select_policy"
  ON public.user_private FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_private_insert_policy"
  ON public.user_private FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_private_update_policy"
  ON public.user_private FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_private_delete_policy"
  ON public.user_private FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_private TO authenticated;

-- Ensure the table has the correct structure
-- Add any missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_private' AND column_name = 'phone') THEN
        ALTER TABLE public.user_private ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_private' AND column_name = 'about') THEN
        ALTER TABLE public.user_private ADD COLUMN about TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_private' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_private ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

COMMIT;
