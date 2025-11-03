-- =========================================================
-- Migration: Add Rich Text Support
-- Description: Adds TipTap JSON rich text fields with plain text extraction
-- Tables: private.profile, private.user_experience, private.user_education,
--         public.jobs, public.organizations
-- =========================================================

BEGIN;

-- =========================================================
-- 1. Add Rich Text Columns
-- =========================================================

-- Public schema - users table (about field)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS about_rich JSONB,
  ADD COLUMN IF NOT EXISTS about_plain TEXT;

-- Private schema (PII)
ALTER TABLE private.user_experience 
  ADD COLUMN IF NOT EXISTS description_rich JSONB,
  ADD COLUMN IF NOT EXISTS description_plain TEXT;

ALTER TABLE private.user_education 
  ADD COLUMN IF NOT EXISTS description_rich JSONB,
  ADD COLUMN IF NOT EXISTS description_plain TEXT;

-- Public schema (jobs and organizations)
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS description_rich JSONB,
  ADD COLUMN IF NOT EXISTS description_plain TEXT;

ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS description_rich JSONB,
  ADD COLUMN IF NOT EXISTS description_plain TEXT;

-- =========================================================
-- 2. Add Plain Text Length Constraints (5000 chars max)
-- =========================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_about_plain_length') THEN
    ALTER TABLE public.users 
      ADD CONSTRAINT users_about_plain_length 
      CHECK (char_length(about_plain) <= 5000);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'experience_description_plain_length') THEN
    ALTER TABLE private.user_experience 
      ADD CONSTRAINT experience_description_plain_length 
      CHECK (char_length(description_plain) <= 5000);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'education_description_plain_length') THEN
    ALTER TABLE private.user_education 
      ADD CONSTRAINT education_description_plain_length 
      CHECK (char_length(description_plain) <= 5000);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_description_plain_length') THEN
    ALTER TABLE public.jobs 
      ADD CONSTRAINT jobs_description_plain_length 
      CHECK (char_length(description_plain) <= 5000);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_description_plain_length') THEN
    ALTER TABLE public.organizations 
      ADD CONSTRAINT organizations_description_plain_length 
      CHECK (char_length(description_plain) <= 5000);
  END IF;
END $$;

-- =========================================================
-- 3. Plain Text Extraction Function (TipTap JSON format)
-- =========================================================

CREATE OR REPLACE FUNCTION extract_tiptap_plain_text(content JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  node JSONB;
  text_node JSONB;
BEGIN
  IF content IS NULL OR content->'content' IS NULL THEN
    RETURN '';
  END IF;

  -- Iterate through content nodes
  FOR node IN SELECT * FROM jsonb_array_elements(content->'content')
  LOOP
    -- Handle paragraph nodes
    IF node->>'type' = 'paragraph' AND node->'content' IS NOT NULL THEN
      FOR text_node IN SELECT * FROM jsonb_array_elements(node->'content')
      LOOP
        IF text_node->>'type' = 'text' THEN
          result := result || COALESCE(text_node->>'text', '');
        END IF;
      END LOOP;
      result := result || E'\n';
    
    -- Handle list items
    ELSIF node->>'type' = 'bulletList' OR node->>'type' = 'orderedList' THEN
      result := result || extract_tiptap_plain_text(node) || E'\n';
    
    ELSIF node->>'type' = 'listItem' AND node->'content' IS NOT NULL THEN
      result := result || extract_tiptap_plain_text(node);
    
    -- Handle text nodes at root level
    ELSIF node->>'type' = 'text' THEN
      result := result || COALESCE(node->>'text', '');
    END IF;
  END LOOP;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION extract_tiptap_plain_text IS 'Extracts plain text from TipTap JSON for search indexing';

-- =========================================================
-- 4. Auto-update Triggers for Plain Text Extraction
-- =========================================================

-- Users (about field)
CREATE OR REPLACE FUNCTION update_users_about_plain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.about_rich IS NOT NULL THEN
    NEW.about_plain := extract_tiptap_plain_text(NEW.about_rich);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_about_plain_trigger ON public.users;
CREATE TRIGGER users_about_plain_trigger
  BEFORE INSERT OR UPDATE OF about_rich ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_about_plain();

-- User Experience
CREATE OR REPLACE FUNCTION update_experience_description_plain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description_rich IS NOT NULL THEN
    NEW.description_plain := extract_tiptap_plain_text(NEW.description_rich);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS experience_description_plain_trigger ON private.user_experience;
CREATE TRIGGER experience_description_plain_trigger
  BEFORE INSERT OR UPDATE OF description_rich ON private.user_experience
  FOR EACH ROW
  EXECUTE FUNCTION update_experience_description_plain();

-- User Education
CREATE OR REPLACE FUNCTION update_education_description_plain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description_rich IS NOT NULL THEN
    NEW.description_plain := extract_tiptap_plain_text(NEW.description_rich);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS education_description_plain_trigger ON private.user_education;
CREATE TRIGGER education_description_plain_trigger
  BEFORE INSERT OR UPDATE OF description_rich ON private.user_education
  FOR EACH ROW
  EXECUTE FUNCTION update_education_description_plain();

-- Jobs
CREATE OR REPLACE FUNCTION update_jobs_description_plain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description_rich IS NOT NULL THEN
    NEW.description_plain := extract_tiptap_plain_text(NEW.description_rich);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_description_plain_trigger ON public.jobs;
CREATE TRIGGER jobs_description_plain_trigger
  BEFORE INSERT OR UPDATE OF description_rich ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_description_plain();

-- Organizations
CREATE OR REPLACE FUNCTION update_organizations_description_plain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description_rich IS NOT NULL THEN
    NEW.description_plain := extract_tiptap_plain_text(NEW.description_rich);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_description_plain_trigger ON public.organizations;
CREATE TRIGGER organizations_description_plain_trigger
  BEFORE INSERT OR UPDATE OF description_rich ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_description_plain();

-- =========================================================
-- 5. Full-text Search Indexes on Plain Text
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_users_about_search 
  ON public.users USING gin(to_tsvector('english', COALESCE(about_plain, '')));

CREATE INDEX IF NOT EXISTS idx_experience_description_search 
  ON private.user_experience USING gin(to_tsvector('english', COALESCE(description_plain, '')));

CREATE INDEX IF NOT EXISTS idx_education_description_search 
  ON private.user_education USING gin(to_tsvector('english', COALESCE(description_plain, '')));

CREATE INDEX IF NOT EXISTS idx_jobs_description_search 
  ON public.jobs USING gin(to_tsvector('english', COALESCE(description_plain, '')));

CREATE INDEX IF NOT EXISTS idx_organizations_description_search 
  ON public.organizations USING gin(to_tsvector('english', COALESCE(description_plain, '')));

-- =========================================================
-- 6. Comments for Documentation
-- =========================================================

COMMENT ON COLUMN public.users.about_rich IS 'Rich text profile description in TipTap JSON format';
COMMENT ON COLUMN public.users.about_plain IS 'Auto-generated plain text for search (max 5000 chars)';

COMMENT ON COLUMN private.user_experience.description_rich IS 'Rich text experience description in TipTap JSON format';
COMMENT ON COLUMN private.user_experience.description_plain IS 'Auto-generated plain text for search (max 5000 chars)';

COMMENT ON COLUMN private.user_education.description_rich IS 'Rich text education description in TipTap JSON format';
COMMENT ON COLUMN private.user_education.description_plain IS 'Auto-generated plain text for search (max 5000 chars)';

COMMENT ON COLUMN public.jobs.description_rich IS 'Rich text job description in TipTap JSON format';
COMMENT ON COLUMN public.jobs.description_plain IS 'Auto-generated plain text for search (max 5000 chars)';

COMMENT ON COLUMN public.organizations.description_rich IS 'Rich text organization description in TipTap JSON format';
COMMENT ON COLUMN public.organizations.description_plain IS 'Auto-generated plain text for search (max 5000 chars)';

COMMIT;
