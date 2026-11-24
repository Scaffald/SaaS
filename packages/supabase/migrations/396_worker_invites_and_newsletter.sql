-- 396: worker invites, referral attribution, newsletter double opt-in (#1392)
--
-- Data for epic #1399 (plan: docs/plans/2026-11-23-invites-and-newsletter.md).
--
-- 1. core.generic_invitations (221, unused until now) carries worker-to-friend
--    invites: phone-only and link invites, the channel and source, and the
--    NevarMail `email_id` its webhooks report events by.
-- 2. Writes to generic_invitations become service-role only. 221 let any
--    signed-in user INSERT as inviter and UPDATE any row they were party to,
--    including an invitee flipping `status` to accepted: a referral could be
--    faked straight through PostgREST. The api function (#1393) is the only
--    writer, so it can enforce rate limits and dedupe. Reads keep to the
--    inviter and the invitee who has claimed the row; the old match on the
--    caller's auth.users email is dropped with the write path.
-- 3. core.users.referral_code: one reusable personal link per user
--    (scaffald.com/i/<code>), backfilled, defaulted for new rows (seed users
--    included, since seeds run after migrations), and not changeable by its
--    owner.
-- 4. core.referral_attributions: who brought each new user in.
-- 5. core.newsletter_signups: the pending step of double opt-in for anonymous
--    signups. Confirmed subscribers live on the NevarMail list, and NevarMail
--    owns suppression, so there is no subscriber or suppression table here.

-- ---------------------------------------------------------------------------
-- 1. generic_invitations: worker referral invites
-- ---------------------------------------------------------------------------

ALTER TABLE core.generic_invitations
  ALTER COLUMN invitee_email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS invitee_phone TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'targeted',
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS nevarmail_email_id TEXT,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE core.generic_invitations
  DROP CONSTRAINT IF EXISTS generic_invitations_kind_check,
  ADD CONSTRAINT generic_invitations_kind_check
    CHECK (kind IN ('targeted', 'link')),
  DROP CONSTRAINT IF EXISTS generic_invitations_channel_check,
  ADD CONSTRAINT generic_invitations_channel_check
    CHECK (channel IS NULL OR channel IN ('email', 'sms_self', 'share', 'import')),
  DROP CONSTRAINT IF EXISTS generic_invitations_invitee_phone_e164,
  ADD CONSTRAINT generic_invitations_invitee_phone_e164
    CHECK (invitee_phone IS NULL OR invitee_phone ~ '^\+[1-9][0-9]{6,14}$'),
  DROP CONSTRAINT IF EXISTS generic_invitations_has_contact,
  ADD CONSTRAINT generic_invitations_has_contact
    CHECK (invitee_email IS NOT NULL OR invitee_phone IS NOT NULL OR kind = 'link');

COMMENT ON COLUMN core.generic_invitations.kind IS
  'targeted: one named recipient; link: the inviter''s reusable personal link';
COMMENT ON COLUMN core.generic_invitations.channel IS
  'email: sent by us through NevarMail; sms_self: the inviter texted it from their own phone (we never text imported numbers); share: OS share sheet; import: scripts/invite-list.ts';
COMMENT ON COLUMN core.generic_invitations.source IS
  'Where the invite came from, e.g. app, onboarding, script:<file>';
COMMENT ON COLUMN core.generic_invitations.nevarmail_email_id IS
  'The id NevarMail''s send returned; its webhooks report events by this as email_id';

CREATE INDEX IF NOT EXISTS idx_generic_invitations_inviter_created
  ON core.generic_invitations (inviter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generic_invitations_phone
  ON core.generic_invitations (invitee_phone) WHERE invitee_phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_generic_invitations_nevarmail_email_id
  ON core.generic_invitations (nevarmail_email_id) WHERE nevarmail_email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generic_invitations_reminder_due
  ON core.generic_invitations (created_at)
  WHERE status = 'pending' AND kind = 'targeted' AND reminder_sent_at IS NULL;

INSERT INTO core.invitation_rules
  (source_role, target_role, relationship_type, name, description, requires_project, allow_referral_only)
VALUES
  ('worker', 'worker', 'referral', 'Invite your crew',
   'A worker invites a friend or co-worker to join Scaffald', false, true)
ON CONFLICT (source_role, target_role) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. generic_invitations: the api function is the only writer
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "generic_invitations_insert_own" ON core.generic_invitations;
DROP POLICY IF EXISTS "generic_invitations_update_own" ON core.generic_invitations;
REVOKE INSERT, UPDATE, DELETE ON core.generic_invitations FROM authenticated, anon;

DROP POLICY IF EXISTS "generic_invitations_select_own" ON core.generic_invitations;
CREATE POLICY "generic_invitations_select_own" ON core.generic_invitations
  FOR SELECT TO authenticated
  USING (inviter_id = (SELECT auth.uid()) OR invitee_user_id = (SELECT auth.uid()));

GRANT SELECT ON core.generic_invitations TO authenticated;
GRANT ALL ON core.generic_invitations TO service_role;

-- ---------------------------------------------------------------------------
-- 3. users.referral_code
-- ---------------------------------------------------------------------------

-- 8 characters from a 31-letter alphabet with no 0/o, 1/l/i: ~8.5e11 codes,
-- easy to read aloud and type from a text message. Randomness comes from the
-- built-in pg_catalog.gen_random_uuid() rather than pgcrypto, whose schema
-- differs between environments (public locally). A v4 uuid's bytes 0-5 and
-- 10-15 are fully random; 6 and 8 carry version/variant bits and are skipped.
CREATE OR REPLACE FUNCTION core.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = ''
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'abcdefghjkmnpqrstuvwxyz23456789';
  bytes BYTEA := pg_catalog.uuid_send(pg_catalog.gen_random_uuid());
  positions CONSTANT INT[] := ARRAY[0, 1, 2, 3, 4, 5, 10, 11];
  code TEXT := '';
  pos INT;
BEGIN
  FOREACH pos IN ARRAY positions LOOP
    code := code || substr(alphabet, (get_byte(bytes, pos) % 31) + 1, 1);
  END LOOP;
  RETURN code;
END;
$$;

REVOKE ALL ON FUNCTION core.generate_referral_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.generate_referral_code() TO service_role;

ALTER TABLE core.users ADD COLUMN IF NOT EXISTS referral_code TEXT;
UPDATE core.users SET referral_code = core.generate_referral_code() WHERE referral_code IS NULL;
ALTER TABLE core.users
  ALTER COLUMN referral_code SET DEFAULT core.generate_referral_code(),
  ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE core.users
  DROP CONSTRAINT IF EXISTS users_referral_code_format,
  ADD CONSTRAINT users_referral_code_format CHECK (referral_code ~ '^[a-z0-9]{6,32}$');
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_referral_code ON core.users (referral_code);

COMMENT ON COLUMN core.users.referral_code IS
  'Personal invite link code (/i/<code>). Set by default; only the service role may change it.';

-- A user who could rename their own code could take someone else's-looking
-- one ("clay"), so the column is fixed for everyone but the service role.
-- Column-level REVOKE would not help while the table-level UPDATE grant stands.
CREATE OR REPLACE FUNCTION core.users_referral_code_locked()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code
     AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'referral_code cannot be changed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_referral_code_locked ON core.users;
CREATE TRIGGER users_referral_code_locked
  BEFORE UPDATE OF referral_code ON core.users
  FOR EACH ROW EXECUTE FUNCTION core.users_referral_code_locked();

-- ---------------------------------------------------------------------------
-- 4. referral_attributions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS core.referral_attributions (
  user_id UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  invitation_id UUID REFERENCES core.generic_invitations(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  landed_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT referral_attributions_not_self CHECK (referrer_id IS DISTINCT FROM user_id)
);

COMMENT ON TABLE core.referral_attributions IS
  'One row per user who arrived through an invite or a personal link (#1392). Written only by POST /v1/invites/claim.';

CREATE INDEX IF NOT EXISTS idx_referral_attributions_referrer
  ON core.referral_attributions (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_attributions_invitation
  ON core.referral_attributions (invitation_id);

ALTER TABLE core.referral_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_attributions_select_party" ON core.referral_attributions;
CREATE POLICY "referral_attributions_select_party" ON core.referral_attributions
  FOR SELECT TO authenticated
  USING (referrer_id = (SELECT auth.uid()) OR user_id = (SELECT auth.uid()));

REVOKE ALL ON core.referral_attributions FROM anon, authenticated;
GRANT SELECT ON core.referral_attributions TO authenticated;
GRANT ALL ON core.referral_attributions TO service_role;

-- ---------------------------------------------------------------------------
-- 5. newsletter_signups (double opt-in, pending step only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS core.newsletter_signups (
  email TEXT PRIMARY KEY,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confirm_token TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  source TEXT,
  ip INET,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  CONSTRAINT newsletter_signups_status_check CHECK (status IN ('pending', 'confirmed')),
  CONSTRAINT newsletter_signups_email_normalised CHECK (email = lower(btrim(email)))
);

COMMENT ON TABLE core.newsletter_signups IS
  'Pending newsletter double opt-ins (#1392, #1396). Confirmed subscribers live on the NevarMail list; NevarMail owns unsubscribes and suppression.';

CREATE INDEX IF NOT EXISTS idx_newsletter_signups_user
  ON core.newsletter_signups (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE core.newsletter_signups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON core.newsletter_signups FROM anon, authenticated;
GRANT ALL ON core.newsletter_signups TO service_role;
