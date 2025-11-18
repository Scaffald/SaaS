-- =========================================================
-- 120_req_92_invites_tracking.sql
-- REQ-92: Enhanced organization invite tracking metadata
-- =========================================================

BEGIN;

-- =========================================================
-- Extend invites table with richer tracking fields
-- =========================================================
ALTER TABLE core.invites
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS personal_note TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resent_count INTEGER NOT NULL DEFAULT 0 CHECK (resent_count >= 0),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE core.invites
  ALTER COLUMN role_name SET DEFAULT 'member';

-- Expand status enum check to cover sent/viewed lifecycle
ALTER TABLE core.invites
  DROP CONSTRAINT IF EXISTS invites_status_check;
ALTER TABLE core.invites
  ADD CONSTRAINT invites_status_check
  CHECK (
    status IN ('pending', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'canceled')
  );

-- Ensure organization_id mirrors organization target rows for existing data
UPDATE core.invites
SET organization_id = target_id
WHERE organization_id IS NULL
  AND target_type = 'organization';

-- Prevent duplicate pending invites to the same email per target
DROP INDEX IF EXISTS invites_unique_email_per_target_idx;
CREATE UNIQUE INDEX invites_unique_email_per_target_idx
  ON core.invites (target_type, target_id, invitee_email)
  WHERE status IN ('pending', 'sent', 'viewed');

-- Track updates automatically
CREATE TRIGGER invites_set_updated_at
  BEFORE UPDATE ON core.invites
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMENT ON COLUMN core.invites.message
  IS 'Optional message included in the invitation email body.';
COMMENT ON COLUMN core.invites.personal_note
  IS 'Private note visible to moderators/admins.';
COMMENT ON COLUMN core.invites.resent_count
  IS 'Number of times the invite email has been resent.';
COMMENT ON COLUMN core.invites.viewed_at
  IS 'Timestamp when the invite link was first opened.';

COMMIT;

