-- =========================================================
-- 065_distribution_visibility.sql
-- Adds job distribution and visibility configuration
-- =========================================================

BEGIN;

-- =========================================================
-- Add posting channels and distribution configuration
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS posting_channels jsonb,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until timestamptz,
ADD COLUMN IF NOT EXISTS seo_keywords text[],
ADD COLUMN IF NOT EXISTS external_application_url text;

-- =========================================================
-- Create indexes for distribution queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_is_featured_idx ON public.jobs(is_featured, featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS jobs_featured_until_idx ON public.jobs(featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS jobs_seo_keywords_idx ON public.jobs USING gin (seo_keywords);
CREATE INDEX IF NOT EXISTS jobs_external_url_idx ON public.jobs(external_application_url) WHERE external_application_url IS NOT NULL;

-- =========================================================
-- Create GIN index for posting_channels jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_posting_channels_idx ON public.jobs USING gin (posting_channels);

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.posting_channels IS 'JSON object of distribution channels. Example: {"internal_only": false, "external_boards": ["indeed", "linkedin"], "referral_bonus_enabled": true, "referral_bonus_cents": 100000}';
COMMENT ON COLUMN public.jobs.is_featured IS 'Whether job is featured in search results';
COMMENT ON COLUMN public.jobs.featured_until IS 'Timestamp until job remains featured';
COMMENT ON COLUMN public.jobs.seo_keywords IS 'Array of keywords for SEO and external job boards';
COMMENT ON COLUMN public.jobs.external_application_url IS 'URL for external ATS if not using internal system';

COMMIT;
