-- ============================================================================
-- 342_versioned_legal_documents.sql
--
-- Versioned legal documents (Terms of Service / Privacy Policy) — the single
-- source of truth for which version of each document users must accept.
--
-- Why: acceptance stamps in core.preferences carried a version string that was
-- hardcoded ("v1.0") in two server routers and never read back, so publishing
-- new terms could not force re-acceptance. This table replaces five drifting
-- hardcoded version constants across the codebase. Both prerequisites routers
-- (REST + legacy tRPC) now read the is_current row; GET /v1/prerequisites/check
-- compares each user's accepted version against it, and clients receive the
-- required versions from the API instead of embedding constants.
--
-- Also extends public.consent_records.consent_type with first-class
-- 'terms_of_service' / 'privacy_policy' values so acceptance audit rows no
-- longer shoehorn through 'data_processing'/'data_collection' with a
-- metadata.type discriminator.
--
-- PUBLISHING A NEW VERSION (no code deploy needed — this is the whole point):
--   BEGIN;
--   UPDATE core.legal_documents SET is_current = false
--     WHERE doc_type = 'terms_of_service' AND is_current;
--   INSERT INTO core.legal_documents (doc_type, version, effective_at, title, url, is_current)
--     VALUES ('terms_of_service', '2026-09-15', '2026-09-15', 'Terms of Service', '/auth/terms', true);
--   COMMIT;
-- Users whose accepted version no longer equals the current version are
-- routed to the blocking re-acceptance screen on their next prerequisites
-- check. Bump versions only when the fleet of deployed clients understands
-- needsLegalAcceptance (older clients degrade to the full onboarding form).
--
-- ROLLBACK INSTRUCTIONS:
--   BEGIN;
--   ALTER TABLE public.consent_records DROP CONSTRAINT consent_records_consent_type_check;
--   ALTER TABLE public.consent_records ADD CONSTRAINT consent_records_consent_type_check
--     CHECK (consent_type::text = ANY (ARRAY[
--       'data_collection','data_processing','data_sharing','marketing_communications',
--       'analytics','opt_out_sale','limit_sensitive_pi','third_party_sharing',
--       'cookies_essential','cookies_analytics','cookies_marketing'
--     ]::text[]));
--   DROP TABLE core.legal_documents;
--   COMMIT;
--   (Only safe before any consent_records rows exist with the new types.)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. The versioned documents table
-- ----------------------------------------------------------------------------

CREATE TABLE core.legal_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('terms_of_service', 'privacy_policy')),
  -- Opaque, equality-compared. 'v1.0' is the pre-versioning cohort (matches
  -- every existing core.preferences.*_version row so nobody re-accepts at
  -- cutover); versions published after this migration use effective-date
  -- strings like '2026-09-15'.
  version      TEXT NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title        TEXT,
  -- App-relative route where the document is rendered.
  url          TEXT NOT NULL,
  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doc_type, version)
);

COMMENT ON TABLE core.legal_documents IS
  'Single source of truth for required legal document versions. One is_current row per doc_type; publishing a new version is an UPDATE+INSERT (see migration 342 header), no code deploy.';
COMMENT ON COLUMN core.legal_documents.version IS
  'Opaque, equality-compared. v1.0 = pre-versioning cohort; later versions use effective-date strings (YYYY-MM-DD).';

-- Exactly one current row per document type.
CREATE UNIQUE INDEX legal_documents_one_current_per_type
  ON core.legal_documents (doc_type)
  WHERE is_current;

-- ----------------------------------------------------------------------------
-- 2. RLS + grants
--
-- Public read: the login screen and the terms/privacy pages render for
-- logged-out users. Writes are service/operator-only (no INSERT/UPDATE policy
-- for authenticated; publishing happens via SQL runbook or service_role).
-- Table-level GRANTs are required alongside RLS — RLS without GRANTs fails
-- with "permission denied" before any policy is evaluated (see migrations
-- 332/335 for the retro-fixes this pattern avoids).
-- ----------------------------------------------------------------------------

ALTER TABLE core.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_documents_public_read ON core.legal_documents
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON core.legal_documents TO anon, authenticated;
GRANT ALL ON core.legal_documents TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Current versions (reference data — required in every environment, so it
--    lives in the migration, not in dev seeds). effective_at mirrors the
--    "Last updated: March 2025" already displayed on the document pages.
-- ----------------------------------------------------------------------------

INSERT INTO core.legal_documents (doc_type, version, effective_at, title, url, is_current) VALUES
  ('terms_of_service', 'v1.0', '2025-03-01T00:00:00Z', 'Terms of Service', '/auth/terms',   TRUE),
  ('privacy_policy',   'v1.0', '2025-03-01T00:00:00Z', 'Privacy Policy',   '/auth/privacy', TRUE)
ON CONFLICT (doc_type, version) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. First-class consent_type values for the acceptance audit trail.
--    Constraint name verified against the live schema (default inline name
--    from migration 201).
-- ----------------------------------------------------------------------------

ALTER TABLE public.consent_records DROP CONSTRAINT consent_records_consent_type_check;
ALTER TABLE public.consent_records ADD CONSTRAINT consent_records_consent_type_check
  CHECK (consent_type::text = ANY (ARRAY[
    'data_collection', 'data_processing', 'data_sharing', 'marketing_communications',
    'analytics', 'opt_out_sale', 'limit_sensitive_pi', 'third_party_sharing',
    'cookies_essential', 'cookies_analytics', 'cookies_marketing',
    'terms_of_service', 'privacy_policy'
  ]::text[]));

COMMIT;
