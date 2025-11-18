-- 122_id_verification_badge_views.sql
-- Adds helper view for latest ID verification badges

BEGIN;

CREATE OR REPLACE VIEW core.v_id_verification_latest AS
SELECT DISTINCT ON (iv.worker_user_id)
  iv.id,
  iv.worker_user_id,
  iv.badge_status,
  iv.badge_expires_at,
  iv.persona_status,
  iv.verified_at,
  iv.revoked_at,
  iv.revocation_reason,
  iv.updated_at
FROM core.id_verifications iv
WHERE iv.worker_user_id IS NOT NULL
ORDER BY
  iv.worker_user_id,
  CASE iv.badge_status
    WHEN 'active' THEN 1
    WHEN 'expired' THEN 2
    WHEN 'revoked' THEN 3
    ELSE 4
  END,
  iv.verified_at DESC NULLS LAST,
  iv.created_at DESC;

COMMENT ON VIEW core.v_id_verification_latest IS
  'Latest ID verification badge per worker, prioritizing active badges.';

GRANT SELECT ON core.v_id_verification_latest TO authenticated;

COMMIT;

