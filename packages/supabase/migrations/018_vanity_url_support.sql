-- =========================================================
-- 018_vanity_url_support.sql
-- Adds vanity URL support with analytics, slug history, and profile visibility
-- =========================================================

BEGIN;

-- =========================================================
-- Analytics Table for Vanity URL Tracking
-- =========================================================
CREATE TABLE IF NOT EXISTS core.vanity_url_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'organization', 'job')),
  entity_id UUID NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  country_code TEXT,
  device_type TEXT,
  user_agent TEXT,
  ip_hash TEXT, -- Hashed IP address for privacy
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.vanity_url_analytics IS 'Tracks views and clicks on vanity URLs for analytics';
COMMENT ON COLUMN core.vanity_url_analytics.ip_hash IS 'SHA256 hash of IP address for privacy compliance';

-- =========================================================
-- Slug Change History
-- =========================================================
CREATE TABLE IF NOT EXISTS core.slug_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  old_slug TEXT,
  new_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.slug_change_history IS 'Tracks history of slug changes for users';
COMMENT ON COLUMN core.slug_change_history.old_slug IS 'Previous slug value (NULL for first-time slug assignment)';

-- =========================================================
-- Profile Visibility Settings
-- =========================================================
ALTER TABLE core.preferences 
ADD COLUMN IF NOT EXISTS profile_visibility JSONB DEFAULT '{
  "work_experience": true,
  "education": true,
  "skills": true,
  "certifications": true,
  "reviews": true,
  "contact_info": false
}'::jsonb;

COMMENT ON COLUMN core.preferences.profile_visibility IS 'Controls which profile sections are visible on public vanity URLs';

-- =========================================================
-- Populate Existing User Slugs
-- =========================================================
-- Generate valid slugs from username for users who don't have one
UPDATE core.users
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(username, '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL 
  AND username IS NOT NULL
  AND LENGTH(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(username, '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ) >= 3
  AND LENGTH(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(username, '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ) <= 50;

-- For users without username, generate from display_name
UPDATE core.users
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(display_name, '[^a-z0-9]+', '-', 'g'),
      '-+', '-', 'g'
    ),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL 
  AND display_name IS NOT NULL
  AND LENGTH(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(display_name, '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ) >= 3
  AND LENGTH(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(display_name, '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    )
  ) <= 50;

-- =========================================================
-- Indexes for Performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_vanity_analytics_entity 
ON core.vanity_url_analytics(entity_type, entity_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_vanity_analytics_visited_at 
ON core.vanity_url_analytics(visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_slug_history_user 
ON core.slug_change_history(user_id, changed_at DESC);

-- Index for slug lookups (users already has unique index, but ensure it exists)
CREATE UNIQUE INDEX IF NOT EXISTS users_slug_unique_idx 
ON core.users(slug) 
WHERE slug IS NOT NULL;

-- Index for job slug lookups
CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_unique_idx 
ON core.jobs(slug) 
WHERE slug IS NOT NULL;

-- =========================================================
-- Constraints
-- =========================================================
-- Clean up existing invalid slugs before enforcing constraints
UPDATE core.users
SET slug = NULL
WHERE slug IS NOT NULL
  AND (
    slug !~ '^[a-z0-9-]+$' OR
    LENGTH(slug) < 3 OR
    LENGTH(slug) > 50
  );

UPDATE core.jobs
SET slug = NULL
WHERE slug IS NOT NULL
  AND (
    slug !~ '^[a-z0-9-]+$' OR
    LENGTH(slug) < 3 OR
    LENGTH(slug) > 50
  );

-- Ensure slug format is valid (alphanumeric and dashes only, 3-50 chars)
ALTER TABLE core.users
ADD CONSTRAINT users_slug_format_check 
CHECK (
  slug IS NULL OR (
    LENGTH(slug) >= 3 AND 
    LENGTH(slug) <= 50 AND 
    slug ~ '^[a-z0-9-]+$'
  )
);

ALTER TABLE core.jobs
ADD CONSTRAINT jobs_slug_format_check 
CHECK (
  slug IS NULL OR (
    LENGTH(slug) >= 3 AND 
    LENGTH(slug) <= 50 AND 
    slug ~ '^[a-z0-9-]+$'
  )
);

COMMIT;

