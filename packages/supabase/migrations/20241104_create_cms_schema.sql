-- =========================================================
-- Create CMS Schema and Welcome Slides Table
-- CMS content management schema for welcome slides and future CMS features
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: CREATE CMS SCHEMA
-- =========================================================

CREATE SCHEMA IF NOT EXISTS cms;

-- =========================================================
-- SECTION 2: CREATE WELCOME_SLIDES TABLE
-- =========================================================

CREATE TABLE cms.welcome_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  background_image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE cms.welcome_slides IS 'Welcome screen slides shown during onboarding';
COMMENT ON COLUMN cms.welcome_slides.icon_name IS 'Lucide icon name (e.g., UserSearch, Share2, Sprout)';
COMMENT ON COLUMN cms.welcome_slides.display_order IS 'Order in which slides are displayed';

-- =========================================================
-- SECTION 3: CREATE INDEXES
-- =========================================================

-- Index for efficient ordering queries
CREATE INDEX idx_welcome_slides_display_order 
  ON cms.welcome_slides(display_order) 
  WHERE is_active = true;

-- Index for active/inactive filtering
CREATE INDEX idx_welcome_slides_active 
  ON cms.welcome_slides(is_active);

-- =========================================================
-- SECTION 4: ENABLE RLS
-- =========================================================

ALTER TABLE cms.welcome_slides ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- SECTION 5: CREATE RLS POLICIES
-- =========================================================

-- Public read policy for active slides (anonymous + authenticated users)
CREATE POLICY welcome_slides_public_read ON cms.welcome_slides
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- =========================================================
-- SECTION 6: GRANTS
-- =========================================================

-- Grant schema usage
GRANT USAGE ON SCHEMA cms TO anon, authenticated, service_role;

-- Grant table permissions
GRANT SELECT ON cms.welcome_slides TO anon, authenticated;
GRANT ALL ON cms.welcome_slides TO service_role;

-- =========================================================
-- SECTION 7: SEED DATA
-- =========================================================

-- Insert the three existing welcome slides
INSERT INTO cms.welcome_slides (title, description, icon_name, background_image_url, display_order) VALUES
  (
    'Discover',
    'Explore tailored content that matches your interests and goals.',
    'UserSearch',
    'https://images.pexels.com/photos/271667/pexels-photo-271667.jpeg',
    1
  ),
  (
    'Connect',
    'Engage with experts and peers to grow your knowledge and network.',
    'Share2',
    'https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg',
    2
  ),
  (
    'Grow',
    'Track your progress and unlock new opportunities as you learn.',
    'Sprout',
    'https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg',
    3
  );

-- =========================================================
-- SECTION 8: STORAGE BUCKET FOR CMS MEDIA
-- =========================================================

-- Create storage bucket for CMS media (images, videos, documents, etc.)
-- Organized by content type: welcome-slides, pages, blog-posts, etc.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'cms-media',
  'cms-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- =========================================================
-- SECTION 9: STORAGE POLICIES
-- =========================================================

-- Public read access for all CMS media
CREATE POLICY "Public read access for cms-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cms-media');

-- Admin upload access for CMS media
CREATE POLICY "Admin upload access for cms-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM private.role_assignments ra
    JOIN private.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.name = 'super_admin'
  )
);

-- Admin update access for CMS media
CREATE POLICY "Admin update access for cms-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM private.role_assignments ra
    JOIN private.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.name = 'super_admin'
  )
);

-- Admin delete access for CMS media
CREATE POLICY "Admin delete access for cms-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cms-media'
  AND EXISTS (
    SELECT 1 FROM private.role_assignments ra
    JOIN private.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
    AND r.name = 'super_admin'
  )
);

COMMIT;
