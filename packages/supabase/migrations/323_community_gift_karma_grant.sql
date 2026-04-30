-- Allow authenticated users to call community.gift_karma directly via PostgREST.
-- The function is SECURITY DEFINER and validates inputs internally (amount range,
-- self-gift, sufficient balance), so it is safe to expose to the authenticated
-- role. The original migration only granted EXECUTE to service_role, which left
-- the gift-karma flow unreachable from the API edge function (which runs in the
-- caller's auth context).

GRANT EXECUTE ON FUNCTION community.gift_karma(UUID, UUID, INTEGER, TEXT) TO authenticated;

-- The original scaffold_scores RLS only allowed service_role to write, so the
-- lazy-init upsert in the /reputation/me handler (which runs in the user's
-- auth context) silently failed and the row never existed. gift_karma then
-- threw "Insufficient karma bank balance" because the giver's row was missing.
-- Allow authenticated users to insert their own row so lazy-init works.
CREATE POLICY scores_self_init ON community.scaffold_scores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;
