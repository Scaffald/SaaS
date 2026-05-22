-- =========================================================
-- 329_review_pins.sql
-- SC-30: worker-curated review pinning (up to 3 per profile).
--
-- A worker can pin up to 3 reviews to the top of their public
-- profile. Pins are positioned 0..2 (left-to-right). Unique
-- per (subject, position), so changing a pin is a delete-then-
-- insert (or use the RPC, which handles it atomically).
--
-- Author of the review and the pin operator are different actors:
-- the *subject* of the review owns the pins, not the author.
--
-- ROLLBACK INSTRUCTIONS:
--   DROP FUNCTION IF EXISTS core.pin_review(UUID, SMALLINT);
--   DROP FUNCTION IF EXISTS core.unpin_review(UUID);
--   DROP TABLE IF EXISTS core.review_pins;
-- =========================================================

BEGIN;

-- =========================================================
-- review_pins table
-- =========================================================

CREATE TABLE core.review_pins (
  subject_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES core.reviews(id) ON DELETE CASCADE,
  position SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subject_user_id, review_id),
  CONSTRAINT review_pins_position_range CHECK (position >= 0 AND position < 3),
  CONSTRAINT review_pins_unique_position UNIQUE (subject_user_id, position)
);

CREATE INDEX idx_review_pins_subject ON core.review_pins(subject_user_id, position);

COMMENT ON TABLE core.review_pins IS
  'SC-30: up to 3 review pins per profile subject. position 0..2 left-to-right. Subject owns the pins; insertion validated by RPC that checks the review belongs to subject_user_id.';

-- =========================================================
-- RLS
-- =========================================================

ALTER TABLE core.review_pins ENABLE ROW LEVEL SECURITY;

-- Anyone can read pins (so public profile pages render them).
CREATE POLICY review_pins_public_select ON core.review_pins
  FOR SELECT TO anon, authenticated
  USING (TRUE);

-- Only the subject (the worker being reviewed) can mutate their own pins.
CREATE POLICY review_pins_owner_insert ON core.review_pins
  FOR INSERT TO authenticated
  WITH CHECK (subject_user_id = auth.uid());

CREATE POLICY review_pins_owner_update ON core.review_pins
  FOR UPDATE TO authenticated
  USING (subject_user_id = auth.uid())
  WITH CHECK (subject_user_id = auth.uid());

CREATE POLICY review_pins_owner_delete ON core.review_pins
  FOR DELETE TO authenticated
  USING (subject_user_id = auth.uid());

-- =========================================================
-- RPC: pin_review(review_id, position)
--
-- Pins a review at the given position (0..2). If a different
-- review is already pinned at that position for this subject,
-- it gets unpinned first (atomic swap). Subject is derived
-- from the review row, not passed in — caller must own the
-- review subject (subject_id = auth.uid()).
-- =========================================================

CREATE OR REPLACE FUNCTION core.pin_review(
  p_review_id UUID,
  p_position SMALLINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_subject_id UUID;
  v_subject_type TEXT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'pin_review: not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_position IS NULL OR p_position < 0 OR p_position > 2 THEN
    RAISE EXCEPTION 'pin_review: position must be 0..2 (got %)', p_position
      USING ERRCODE = '22023';
  END IF;

  SELECT r.subject_id, r.subject_type
    INTO v_subject_id, v_subject_type
    FROM core.reviews r
   WHERE r.id = p_review_id;

  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'pin_review: review % not found', p_review_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_subject_type <> 'user' THEN
    RAISE EXCEPTION 'pin_review: only user-subject reviews can be pinned (got %)', v_subject_type
      USING ERRCODE = '22023';
  END IF;

  IF v_subject_id <> v_caller THEN
    RAISE EXCEPTION 'pin_review: caller does not own the review subject'
      USING ERRCODE = '42501';
  END IF;

  -- Free up the slot at this position (if another review held it).
  DELETE FROM core.review_pins
   WHERE subject_user_id = v_caller
     AND position = p_position
     AND review_id <> p_review_id;

  -- Upsert this review at the requested position.
  INSERT INTO core.review_pins (subject_user_id, review_id, position)
  VALUES (v_caller, p_review_id, p_position)
  ON CONFLICT (subject_user_id, review_id)
  DO UPDATE SET position = EXCLUDED.position;
END;
$$;

COMMENT ON FUNCTION core.pin_review(UUID, SMALLINT) IS
  'SC-30: pin a review to the caller''s profile at position 0..2. Caller must own the review subject (review.subject_id = auth.uid()). Atomically displaces any review currently held at that position.';

GRANT EXECUTE ON FUNCTION core.pin_review(UUID, SMALLINT) TO authenticated;

-- =========================================================
-- RPC: unpin_review(review_id)
-- =========================================================

CREATE OR REPLACE FUNCTION core.unpin_review(
  p_review_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'unpin_review: not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM core.review_pins
   WHERE subject_user_id = v_caller
     AND review_id = p_review_id;
END;
$$;

COMMENT ON FUNCTION core.unpin_review(UUID) IS
  'SC-30: remove a review pin from the caller''s profile. No-op if not pinned.';

GRANT EXECUTE ON FUNCTION core.unpin_review(UUID) TO authenticated;

COMMIT;
