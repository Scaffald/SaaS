-- =========================================================
-- 043_create_external_job_feeds.sql
-- Creates external job feed infrastructure for RSS/API imports
-- =========================================================

BEGIN;

-- =========================================================
-- External Job Feeds
-- =========================================================
CREATE TABLE IF NOT EXISTS external_job_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  feed_type VARCHAR(50) NOT NULL CHECK (feed_type IN ('rss', 'api')),
  parser_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  fetch_interval_hours INTEGER DEFAULT 3,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

CREATE INDEX idx_external_feeds_active ON external_job_feeds(is_active) WHERE is_active = true;
CREATE INDEX idx_external_feeds_last_fetched ON external_job_feeds(last_fetched_at);

-- =========================================================
-- External Jobs Cache
-- =========================================================
CREATE TABLE IF NOT EXISTS external_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES external_job_feeds(id) ON DELETE CASCADE,
  external_guid VARCHAR(500) NOT NULL,
  
  -- Job information
  title VARCHAR(500) NOT NULL,
  description TEXT,
  company_name VARCHAR(255),
  company_logo VARCHAR(1000),
  company_website VARCHAR(1000),
  company_headquarters VARCHAR(255),
  
  -- Job details
  job_location VARCHAR(255),
  job_type VARCHAR(50),
  job_category VARCHAR(100),
  job_tags TEXT[],
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  
  -- Compensation
  compensation_min INTEGER,
  compensation_max INTEGER,
  compensation_currency VARCHAR(10) DEFAULT 'USD',
  compensation_period VARCHAR(50),
  
  -- URLs and links
  application_url VARCHAR(1000),
  external_url VARCHAR(1000),
  
  -- Dates
  posted_date TIMESTAMPTZ,
  expires_date TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  
  -- Metadata for deduplication and tracking
  content_hash VARCHAR(64),
  raw_data JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_processed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(feed_id, external_guid)
);

-- Performance indexes
CREATE INDEX idx_external_jobs_active ON external_jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_external_jobs_posted ON external_jobs(posted_date DESC);
CREATE INDEX idx_external_jobs_company ON external_jobs(company_name);
CREATE INDEX idx_external_jobs_category ON external_jobs(job_category);
CREATE INDEX idx_external_jobs_location ON external_jobs(job_location);
CREATE INDEX idx_external_jobs_type ON external_jobs(job_type);
CREATE INDEX idx_external_jobs_featured ON external_jobs(featured) WHERE featured = true;
CREATE INDEX idx_external_jobs_expires ON external_jobs(expires_date) WHERE expires_date IS NOT NULL;
CREATE INDEX idx_external_jobs_hash ON external_jobs(content_hash);
CREATE INDEX idx_external_jobs_feed ON external_jobs(feed_id, is_active);

-- =========================================================
-- Industry Mappings for External Jobs
-- =========================================================
CREATE TABLE IF NOT EXISTS external_job_industries (
  external_job_id UUID NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  mapped_by VARCHAR(20) DEFAULT 'rule' CHECK (mapped_by IN ('rule', 'ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (external_job_id, industry_id)
);

CREATE INDEX idx_external_job_industries_job ON external_job_industries(external_job_id);
CREATE INDEX idx_external_job_industries_industry ON external_job_industries(industry_id);
CREATE INDEX idx_external_job_industries_confidence ON external_job_industries(confidence_score);

-- =========================================================
-- External Job Skills Junction
-- =========================================================
CREATE TABLE IF NOT EXISTS external_job_skills (
  external_job_id UUID NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level SMALLINT CHECK (required_level BETWEEN 0 AND 5),
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extracted_by VARCHAR(20) DEFAULT 'rule' CHECK (extracted_by IN ('rule', 'ai', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (external_job_id, skill_id)
);

CREATE INDEX idx_external_job_skills_job ON external_job_skills(external_job_id);
CREATE INDEX idx_external_job_skills_skill ON external_job_skills(skill_id);

-- =========================================================
-- Row Level Security Policies
-- =========================================================

-- External Job Feeds (admin-only management)
ALTER TABLE external_job_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_feeds_admin_full ON external_job_feeds
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY external_feeds_read_all ON external_job_feeds
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- External Jobs (public read for active jobs)
ALTER TABLE external_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_jobs_read_active ON external_jobs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY external_jobs_admin_full ON external_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- External Job Industries (public read)
ALTER TABLE external_job_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_job_industries_read ON external_job_industries
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY external_job_industries_admin_write ON external_job_industries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- External Job Skills (public read)
ALTER TABLE external_job_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_job_skills_read ON external_job_skills
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY external_job_skills_admin_write ON external_job_skills
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =========================================================
-- Monitoring View
-- =========================================================
CREATE OR REPLACE VIEW v_job_import_stats AS
SELECT
  f.id AS feed_id,
  f.name AS feed_name,
  f.feed_type,
  f.is_active,
  f.last_fetched_at,
  f.last_success_at,
  f.error_count,
  COUNT(ej.id) AS total_jobs,
  COUNT(ej.id) FILTER (WHERE ej.is_active) AS active_jobs,
  COUNT(ej.id) FILTER (WHERE ej.archived_at IS NOT NULL) AS archived_jobs,
  COUNT(DISTINCT eji.industry_id) AS mapped_industries,
  AVG(eji.confidence_score) FILTER (WHERE eji.confidence_score IS NOT NULL) AS avg_industry_confidence,
  MAX(ej.posted_date) AS most_recent_job_date,
  COUNT(DISTINCT ej.company_name) AS unique_companies
FROM external_job_feeds f
LEFT JOIN external_jobs ej ON ej.feed_id = f.id
LEFT JOIN external_job_industries eji ON eji.external_job_id = ej.id
GROUP BY f.id, f.name, f.feed_type, f.is_active, f.last_fetched_at, f.last_success_at, f.error_count;

GRANT SELECT ON v_job_import_stats TO authenticated;

-- =========================================================
-- Helper Functions
-- =========================================================

-- Function to calculate content hash for deduplication
CREATE OR REPLACE FUNCTION calculate_job_content_hash(
  p_title TEXT,
  p_company TEXT,
  p_description TEXT
) RETURNS VARCHAR(64) AS $$
BEGIN
  RETURN encode(
    digest(
      LOWER(TRIM(COALESCE(p_title, ''))) || '::' ||
      LOWER(TRIM(COALESCE(p_company, ''))) || '::' ||
      LOWER(SUBSTRING(COALESCE(p_description, ''), 1, 500)),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar jobs (for deduplication)
CREATE OR REPLACE FUNCTION find_similar_jobs(
  p_title TEXT,
  p_company TEXT,
  p_posted_within_days INTEGER DEFAULT 7
) RETURNS TABLE(
  job_id UUID,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ej.id,
    (
      similarity(LOWER(ej.title), LOWER(p_title)) * 0.6 +
      similarity(LOWER(ej.company_name), LOWER(p_company)) * 0.4
    ) AS similarity_score
  FROM external_jobs ej
  WHERE
    ej.is_active = true
    AND ej.posted_date > NOW() - (p_posted_within_days || ' days')::INTERVAL
    AND (
      similarity(LOWER(ej.title), LOWER(p_title)) > 0.7
      OR similarity(LOWER(ej.company_name), LOWER(p_company)) > 0.8
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMIT;
