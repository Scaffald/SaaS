-- SC-38: Shareable review links + anonymous (no-account) review submissions
--
-- Backend for the "Reviews & Credentials" flow described in
-- https://linear.app/scaffald/issue/SC-38. A worker shares a unique
-- token (text/email/QR) with a former employer, instructor, foreman,
-- etc. The recipient opens the link in a browser, fills a short form,
-- and submits a review WITHOUT creating a Scaffald account.
--
-- Design choices:
--   - Submitted reviews live in `core.reviews` alongside auth-user
--     reviews, with `author_user_id = NULL`. That keeps existing
--     consumers (ReviewsWidget, ProfileScaffoldScore, etc.) working
--     without code changes — they just need to handle a nullable
--     author.
--   - Real reviewer name / email / relationship live in `metadata`.
--     We deliberately do NOT create rows in `core.users` for
--     reviewers (would inflate user counts + auth metrics).
--   - The existing UNIQUE constraint
--     (kind, subject_type, subject_id, author_user_id) is replaced
--     by a partial unique index that only applies when
--     author_user_id IS NOT NULL — anon dedup is enforced at the
--     API layer (per token + reviewer email) rather than at the DB.
--   - Token validation + insertion happens in an Edge Function
--     using the service role; the new RLS policies below cover the
--     direct-anon-read case (token row lookup) but writes are
--     gated by the service-role bypass, not RLS.

BEGIN;

-- =========================================================
-- review_links: shareable review-request tokens
-- =========================================================

CREATE TABLE core.review_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT review_links_used_count_nonnegative CHECK (used_count >= 0),
  CONSTRAINT review_links_max_uses_positive CHECK (max_uses IS NULL OR max_uses > 0)
);

CREATE INDEX idx_review_links_subject ON core.review_links(subject_user_id);

COMMENT ON TABLE core.review_links IS
  'SC-38: shareable, no-auth-required review request tokens. Each row is one shareable link a worker generates to solicit a review from an external reviewer (instructor, foreman, etc.). Anon submission uses the token to look up the subject_user_id and inserts into core.reviews with author_user_id = NULL.';

-- =========================================================
-- RLS on review_links
-- =========================================================

ALTER TABLE core.review_links ENABLE ROW LEVEL SECURITY;

-- The worker who issued the link can SELECT / INSERT / UPDATE / DELETE
-- their own rows. INSERT requires `subject_user_id = auth.uid()` so
-- they can only issue links for themselves (no impersonation).
CREATE POLICY review_links_owner_select ON core.review_links
  FOR SELECT TO authenticated
  USING (subject_user_id = auth.uid());

CREATE POLICY review_links_owner_insert ON core.review_links
  FOR INSERT TO authenticated
  WITH CHECK (subject_user_id = auth.uid());

CREATE POLICY review_links_owner_update ON core.review_links
  FOR UPDATE TO authenticated
  USING (subject_user_id = auth.uid())
  WITH CHECK (subject_user_id = auth.uid());

CREATE POLICY review_links_owner_delete ON core.review_links
  FOR DELETE TO authenticated
  USING (subject_user_id = auth.uid());

-- Deliberately no anon SELECT policy. The public review-submit Edge
-- Function uses the service role (which bypasses RLS) to look up by
-- token, so direct anon SELECT access isn't needed — and granting it
-- would expose tokens to enumeration via the Supabase REST API. All
-- anon access flows through the API layer, where future rate
-- limiting and anti-bot live.

-- =========================================================
-- core.reviews: allow nullable author + relax UNIQUE
-- =========================================================

-- Drop the UNIQUE constraint that requires a non-null author_user_id.
-- The auto-generated name is reviews_kind_subject_type_subject_id_author_user_id_key;
-- guard with IF EXISTS in case it differs across environments.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
   WHERE nsp.nspname = 'core'
     AND rel.relname = 'reviews'
     AND con.contype = 'u';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE core.reviews DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Allow author_user_id to be NULL for anon reviews.
ALTER TABLE core.reviews ALTER COLUMN author_user_id DROP NOT NULL;

-- Re-add dedup as a partial unique index — only enforced when an
-- authenticated user is the author. Anon dedup is handled by the API
-- (per token + reviewer email).
CREATE UNIQUE INDEX idx_reviews_unique_authored
  ON core.reviews (kind, subject_type, subject_id, author_user_id)
  WHERE author_user_id IS NOT NULL;

-- Index anon reviews by the link they came in through, for analytics
-- and for the worker's "Reviews I've requested" UI.
CREATE INDEX idx_reviews_via_review_link
  ON core.reviews ((metadata->>'via_review_link'))
  WHERE author_user_id IS NULL;

-- =========================================================
-- Lock down direct anon INSERTs into core.reviews
-- =========================================================
-- The existing reviews_insert policy (005_policies.sql) only allows
-- authenticated INSERTs with author_user_id = auth.uid(). We do NOT
-- add an anon-insert policy here — anonymous review submissions MUST
-- go through the Edge Function which uses the service role to insert
-- after validating the token. This forces token validation through
-- the API layer where rate-limiting and abuse mitigation can live.

COMMIT;
