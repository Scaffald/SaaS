-- =========================================================
-- 410_community_reputation_tables.sql
-- Scaffold Score reputation system and Karma Bank
-- =========================================================

BEGIN;

-- =========================================================
-- Table: community.scaffold_scores
-- Primary reputation metric (0-100 displayed, excess in Karma Bank)
-- =========================================================
CREATE TABLE community.scaffold_scores (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 100 CHECK (score BETWEEN 0 AND 100),
  karma_bank INTEGER NOT NULL DEFAULT 0 CHECK (karma_bank >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE community.scaffold_scores IS 'Scaffold Score — primary trust signal for employers (0-100, starts at 100)';
COMMENT ON COLUMN community.scaffold_scores.score IS 'Current displayed score capped at 100';
COMMENT ON COLUMN community.scaffold_scores.karma_bank IS 'Excess reputation above 100 — spendable points the member can gift to others';
COMMENT ON COLUMN community.scaffold_scores.total_earned IS 'Lifetime reputation earned (for analytics)';
COMMENT ON COLUMN community.scaffold_scores.total_spent IS 'Lifetime reputation spent via karma gifts';

-- =========================================================
-- Table: community.reputation_events
-- Audit trail of all score changes
-- =========================================================
CREATE TABLE community.reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  action community.reputation_action NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT,
  source_type TEXT,  -- 'post', 'comment', 'rating', 'karma_gift'
  source_id UUID,    -- ID of the post, comment, rating, or gift
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE community.reputation_events IS 'Immutable audit trail of all Scaffold Score changes';
COMMENT ON COLUMN community.reputation_events.delta IS 'Positive = gain, negative = loss';
COMMENT ON COLUMN community.reputation_events.source_type IS 'Type of entity that caused the reputation change';
COMMENT ON COLUMN community.reputation_events.source_id IS 'ID of the entity that caused the change';

-- =========================================================
-- Table: community.karma_gifts
-- Record of karma transferred between members
-- =========================================================
CREATE TABLE community.karma_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 10),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE community.karma_gifts IS 'Karma Bank transfers — gifting excess reputation to other members';
COMMENT ON COLUMN community.karma_gifts.amount IS 'Amount of karma gifted (max 10 per gift)';

-- =========================================================
-- Function: community.update_scaffold_score
-- Atomically updates score, handles overflow to karma_bank
-- =========================================================
CREATE OR REPLACE FUNCTION community.update_scaffold_score(
  p_user_id UUID,
  p_delta INTEGER,
  p_action community.reputation_action,
  p_reason TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
) RETURNS community.scaffold_scores AS $$
DECLARE
  v_result community.scaffold_scores;
  v_new_score INTEGER;
  v_overflow INTEGER;
BEGIN
  -- Ensure scaffold_scores row exists (lazy init)
  INSERT INTO community.scaffold_scores (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Calculate new score
  IF p_delta > 0 THEN
    -- Positive delta: add to score, overflow goes to karma_bank
    UPDATE community.scaffold_scores
    SET
      score = LEAST(score + p_delta, 100),
      karma_bank = karma_bank + GREATEST((score + p_delta) - 100, 0),
      total_earned = total_earned + p_delta,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  ELSE
    -- Negative delta: subtract from score, floor at 0
    UPDATE community.scaffold_scores
    SET
      score = GREATEST(score + p_delta, 0),
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  END IF;

  -- Log the reputation event
  INSERT INTO community.reputation_events (user_id, action, delta, reason, source_type, source_id)
  VALUES (p_user_id, p_action, p_delta, p_reason, p_source_type, p_source_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION community.update_scaffold_score IS 'Atomically update a members Scaffold Score with overflow to Karma Bank';

-- Grant execute to service_role only (called from API, not directly by users)
REVOKE ALL ON FUNCTION community.update_scaffold_score FROM PUBLIC;
GRANT EXECUTE ON FUNCTION community.update_scaffold_score TO service_role;

-- =========================================================
-- Function: community.gift_karma
-- Transfer karma from giver's bank to receiver's score
-- =========================================================
CREATE OR REPLACE FUNCTION community.gift_karma(
  p_giver_id UUID,
  p_receiver_id UUID,
  p_amount INTEGER,
  p_message TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_giver_karma INTEGER;
BEGIN
  -- Validate amount
  IF p_amount < 1 OR p_amount > 10 THEN
    RAISE EXCEPTION 'Karma gift amount must be between 1 and 10';
  END IF;

  -- Can't gift to self
  IF p_giver_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot gift karma to yourself';
  END IF;

  -- Check giver has enough karma
  SELECT karma_bank INTO v_giver_karma
  FROM community.scaffold_scores
  WHERE user_id = p_giver_id
  FOR UPDATE;

  IF v_giver_karma IS NULL OR v_giver_karma < p_amount THEN
    RAISE EXCEPTION 'Insufficient karma bank balance';
  END IF;

  -- Deduct from giver's karma bank
  UPDATE community.scaffold_scores
  SET
    karma_bank = karma_bank - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_giver_id;

  -- Add to receiver's score (with overflow)
  PERFORM community.update_scaffold_score(
    p_receiver_id,
    p_amount,
    'karma_received',
    'Karma gift from another member',
    'karma_gift',
    NULL
  );

  -- Log the gift
  INSERT INTO community.karma_gifts (giver_id, receiver_id, amount, message)
  VALUES (p_giver_id, p_receiver_id, p_amount, p_message);

  -- Log the giver's event
  INSERT INTO community.reputation_events (user_id, action, delta, reason, source_type)
  VALUES (p_giver_id, 'karma_gifted', 0, 'Gifted ' || p_amount || ' karma', 'karma_gift');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION community.gift_karma IS 'Transfer karma from givers bank to receivers Scaffold Score';

REVOKE ALL ON FUNCTION community.gift_karma FROM PUBLIC;
GRANT EXECUTE ON FUNCTION community.gift_karma TO service_role;

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX idx_reputation_events_user_created
  ON community.reputation_events (user_id, created_at DESC);

CREATE INDEX idx_karma_gifts_giver_created
  ON community.karma_gifts (giver_id, created_at DESC);

CREATE INDEX idx_karma_gifts_receiver_created
  ON community.karma_gifts (receiver_id, created_at DESC);

CREATE INDEX idx_scaffold_scores_score_desc
  ON community.scaffold_scores (score DESC);

COMMIT;
