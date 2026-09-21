-- 358_legal_documents_canonical_urls.sql
--
-- Point the legal documents at the URLs a signed-in user can actually open.
--
-- `core.legal_documents.url` held `/auth/terms` and `/auth/privacy`. Those
-- routes lived inside the `(auth)` route group, which is guest-only: the
-- guard in `useProtectedRoute` sends any authenticated visitor to the
-- dashboard. So the one audience that has to read these documents — a user
-- the prerequisites check is blocking until they accept a new version —
-- could not open either of them. Neither could an employer ticking the
-- clickwrap on the hire payment screen.
--
-- Worse than the routing: the `(auth)` pages were a *second, different* copy
-- of each document. The Terms there ran nine generic SaaS sections; the
-- public page at /terms runs fifteen written for this product (the Scaffald
-- score, profile claiming, background checks, dispute resolution). Both
-- rendered the same version string from this table, so "v1.0" meant two
-- different agreements depending on which URL you reached.
--
-- The duplicates are deleted in the same change. These are the surviving
-- canonical pages, which also carry the SEO metadata and the canonical link.
--
-- Version and effective_at are deliberately untouched: this corrects where a
-- document is published, not what it says, and bumping the version would
-- force every user through re-acceptance for a URL change.

BEGIN;

UPDATE core.legal_documents
SET url = '/terms'
WHERE doc_type = 'terms_of_service'
  AND url = '/auth/terms';

UPDATE core.legal_documents
SET url = '/privacy'
WHERE doc_type = 'privacy_policy'
  AND url = '/auth/privacy';

DO $$
DECLARE
  stale_count integer;
BEGIN
  SELECT count(*) INTO stale_count
  FROM core.legal_documents
  WHERE url LIKE '/auth/%';

  IF stale_count > 0 THEN
    RAISE EXCEPTION
      'legal_documents still has % row(s) pointing into the guest-only (auth) group', stale_count;
  END IF;
END $$;

COMMIT;
