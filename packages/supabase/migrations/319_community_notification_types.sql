-- =========================================================
-- 414_community_notification_types.sql
-- Add community-related notification types for Communities v1
-- =========================================================

BEGIN;

DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'community.post_comment',
    'community.post_rating',
    'community.reputation_change',
    'community.new_follower',
    'community.followed_user_post',
    'community.karma_received'
  ];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END;
$$;

COMMIT;
