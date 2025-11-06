-- =========================================================
-- 013_portfolio.sql - Portfolio System
-- Creates portfolio_items table, policies, indexes, triggers, and storage bucket
-- =========================================================

BEGIN;

-- =========================================================
-- PORTFOLIO ITEMS TABLE
-- =========================================================
CREATE TABLE core.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) - added in relations section
  title TEXT NOT NULL,
  description JSONB,  -- Rich text description in TipTap JSON format
  image_url TEXT,  -- Public URL for display
  file_path TEXT,  -- Storage bucket path for the image
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.portfolio_items IS 'User portfolio items showcasing work, projects, or achievements';
COMMENT ON COLUMN core.portfolio_items.description IS 'Rich text description in TipTap JSON format';
COMMENT ON COLUMN core.portfolio_items.file_path IS 'Path in storage bucket (portfolio/{user_id}/{id}/{filename})';

-- =========================================================
-- FOREIGN KEY RELATIONSHIPS
-- =========================================================
ALTER TABLE core.portfolio_items
  ADD CONSTRAINT portfolio_items_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE core.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own portfolio items
CREATE POLICY portfolio_items_select_own
  ON core.portfolio_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can view portfolio items (public profile feature)
CREATE POLICY portfolio_items_select_public
  ON core.portfolio_items
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can insert their own portfolio items
CREATE POLICY portfolio_items_insert_own
  ON core.portfolio_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio items
CREATE POLICY portfolio_items_update_own
  ON core.portfolio_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own portfolio items
CREATE POLICY portfolio_items_delete_own
  ON core.portfolio_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- INDEXES
-- =========================================================
-- User lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id 
  ON core.portfolio_items(user_id);

-- Display order for sorting
CREATE INDEX IF NOT EXISTS idx_portfolio_items_display_order 
  ON core.portfolio_items(user_id, display_order ASC);

-- Created at for sorting
CREATE INDEX IF NOT EXISTS idx_portfolio_items_created_at 
  ON core.portfolio_items(user_id, created_at DESC);

-- =========================================================
-- TRIGGERS
-- =========================================================
-- Auto-update updated_at timestamp
CREATE TRIGGER portfolio_items_set_updated_at
  BEFORE UPDATE ON core.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON core.portfolio_items TO authenticated;
GRANT SELECT ON core.portfolio_items TO anon;

-- =========================================================
-- PORTFOLIO STORAGE BUCKET
-- =========================================================

-- Create portfolio storage bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Portfolio images are publicly accessible
DROP POLICY IF EXISTS "Portfolio images are publicly accessible" ON storage.objects;
CREATE POLICY "Portfolio images are publicly accessible" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'portfolio');

-- Users can upload their own portfolio images
DROP POLICY IF EXISTS "Users can upload their own portfolio images" ON storage.objects;
CREATE POLICY "Users can upload their own portfolio images" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own portfolio images
DROP POLICY IF EXISTS "Users can update their own portfolio images" ON storage.objects;
CREATE POLICY "Users can update their own portfolio images" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own portfolio images
DROP POLICY IF EXISTS "Users can delete their own portfolio images" ON storage.objects;
CREATE POLICY "Users can delete their own portfolio images" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;

