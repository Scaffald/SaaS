-- Migration: Create help_articles table
-- REQ: Phase 9 - Production Readiness (Help Articles DB Migration)
-- Date: 2025-12-02

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration creates the `forsured.help_articles` table to store help
-- documentation content. Previously this was stored in-memory in the
-- helpArticleService.ts file. Moving to database allows:
--   - Content management without code deployments
--   - Future admin UI for article editing
--   - Search optimization with PostgreSQL full-text search
--   - Analytics on help article usage
-- =============================================================================

-- Create help_articles table
CREATE TABLE IF NOT EXISTS forsured.help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_types TEXT[] NOT NULL DEFAULT '{}',
    category VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    video_url VARCHAR(500),
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE forsured.help_articles IS 'Help documentation articles for each user type';
COMMENT ON COLUMN forsured.help_articles.slug IS 'URL-friendly identifier for the article';
COMMENT ON COLUMN forsured.help_articles.user_types IS 'Array of user types this article applies to: gc, contractor, broker, admin';
COMMENT ON COLUMN forsured.help_articles.category IS 'Category for grouping articles: getting-started, dashboard, documents, etc.';
COMMENT ON COLUMN forsured.help_articles.sort_order IS 'Sort order within category (lower = first)';
COMMENT ON COLUMN forsured.help_articles.is_published IS 'Whether the article is visible to users';

-- Create indexes
CREATE INDEX idx_help_articles_slug ON forsured.help_articles(slug);
CREATE INDEX idx_help_articles_category ON forsured.help_articles(category);
CREATE INDEX idx_help_articles_user_types ON forsured.help_articles USING GIN(user_types);
CREATE INDEX idx_help_articles_published ON forsured.help_articles(is_published) WHERE is_published = true;

-- Create unique constraint for slug + user_types combination
-- This allows same slug for different user types (e.g., "getting-started" for gc and contractor)
CREATE UNIQUE INDEX idx_help_articles_slug_user_type ON forsured.help_articles(slug, user_types);

-- Create full-text search index for content search
CREATE INDEX idx_help_articles_search ON forsured.help_articles
    USING GIN(to_tsvector('english', title || ' ' || content));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION forsured.update_help_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER help_articles_updated_at
    BEFORE UPDATE ON forsured.help_articles
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_help_articles_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.help_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published articles (including anonymous users)
CREATE POLICY help_articles_select_published ON forsured.help_articles
    FOR SELECT
    USING (is_published = true);

-- Policy: Admins can do anything (for future admin UI)
CREATE POLICY help_articles_admin_all ON forsured.help_articles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forsured.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forsured.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.user_type = 'admin'
        )
    );

-- Verify table creation
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'forsured'
        AND table_name = 'help_articles'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE EXCEPTION 'Table forsured.help_articles was not created successfully';
    END IF;

    RAISE NOTICE '✅ Table forsured.help_articles created successfully';
END $$;
