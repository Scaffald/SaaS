-- Allow authenticated users to call community.gift_karma directly via PostgREST.
-- The function is SECURITY DEFINER and validates inputs internally (amount range,
-- self-gift, sufficient balance), so it is safe to expose to the authenticated
-- role. The original migration only granted EXECUTE to service_role, which left
-- the gift-karma flow unreachable from the API edge function (which runs in the
-- caller's auth context).

GRANT EXECUTE ON FUNCTION community.gift_karma(UUID, UUID, INTEGER, TEXT) TO authenticated;

COMMIT;
