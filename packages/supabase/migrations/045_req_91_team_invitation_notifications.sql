-- ====================================================================================
-- 045_req_91_team_invitation_notifications.sql
-- Extends team invitation records to track notification delivery metadata.
-- ====================================================================================

BEGIN;

ALTER TABLE core.team_invitations
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_id UUID REFERENCES core.notifications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_delivery_status TEXT
    CHECK (
      last_delivery_status IN (
        'queued',
        'sending',
        'sent',
        'delivered',
        'failed',
        'bounce',
        'blocked',
        'retry',
        'error',
        'cancelled'
      )
    ),
  ADD COLUMN IF NOT EXISTS last_delivery_error TEXT,
  ADD COLUMN IF NOT EXISTS last_delivery_channels TEXT[];

CREATE INDEX IF NOT EXISTS team_invitations_notification_id_idx
  ON core.team_invitations (notification_id);

CREATE INDEX IF NOT EXISTS team_invitations_sent_at_idx
  ON core.team_invitations (sent_at);

COMMENT ON COLUMN core.team_invitations.sent_at IS
  'Timestamp of the most recent invitation delivery attempt.';

COMMENT ON COLUMN core.team_invitations.notification_id IS
  'Notification record associated with the most recent invitation delivery.';

COMMENT ON COLUMN core.team_invitations.last_delivery_status IS
  'Last known delivery status for the invitation notification.';

COMMENT ON COLUMN core.team_invitations.last_delivery_error IS
  'Most recent delivery error captured for the invitation notification.';

COMMENT ON COLUMN core.team_invitations.last_delivery_channels IS
  'Channels (email, push, etc.) used during the last invitation delivery attempt.';

COMMIT;

