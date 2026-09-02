-- 349: reporting and blocking for user-generated content.
--
-- Scaffald carries UGC — community posts and comments, inquiry threads between
-- an employer and a candidate, worker profiles, job posts — and until now had
-- no way for anyone to report any of it, or to block another person. Both
-- stores require all three (report content, report a person, block a person):
-- Google Play's User Generated Content policy, and Apple's Guideline 1.2.
-- See #690.
--
-- Two tables, deliberately separate:
--
--   content_reports  — "somebody should look at this". Many-to-one, keeps
--                      history, never deleted by the reporter.
--   user_blocks      — "I do not want to hear from this person". One row per
--                      direction, removable, and enforced on read paths.
--
-- A report is a request for moderator attention. A block is a user's own
-- boundary and takes effect immediately without anyone reviewing it. Conflating
-- them would mean either blocks wait on moderation or reports silently mute
-- people, and both are wrong.

BEGIN;

-- =========================================================
-- Enums
-- =========================================================

-- What is being reported. Polymorphic because the surfaces are genuinely
-- different tables; a per-surface reports table would multiply the moderation
-- queue by the number of places a user can type.
CREATE TYPE core.report_subject_type AS ENUM (
  'community_post',
  'community_comment',
  'inquiry_message',
  'user',
  'job'
);
COMMENT ON TYPE core.report_subject_type IS
  'Which kind of thing a content report points at.';

-- Deliberately short. A long list produces worse data, not better: reporters
-- pick the first plausible row, and the free-text `details` column carries the
-- specifics anyway.
CREATE TYPE core.report_reason AS ENUM (
  'spam',
  'harassment',
  'hate_speech',
  'sexual_content',
  'violence_or_threats',
  'scam_or_fraud',
  'off_platform_solicitation',
  'other'
);
COMMENT ON TYPE core.report_reason IS
  'Reporter-selected category. `other` requires details; enforced in the API.';

CREATE TYPE core.report_status AS ENUM (
  'open',
  'reviewing',
  'actioned',
  'dismissed'
);
COMMENT ON TYPE core.report_status IS
  'Moderation lifecycle. `actioned` means the content or account was acted on.';

-- =========================================================
-- content_reports
-- =========================================================
CREATE TABLE core.content_reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id        UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  subject_type       core.report_subject_type NOT NULL,
  -- The reported row's id. For subject_type='user' this is the reported user.
  -- Not a foreign key: it points into five different tables, and a FK per type
  -- would need five nullable columns and a CHECK to keep exactly one filled.
  subject_id         UUID NOT NULL,

  -- Who authored the reported thing, resolved at report time. Denormalised on
  -- purpose: it lets a moderator see repeat offenders across surfaces without
  -- joining five tables, and it survives the content being deleted — which is
  -- exactly when a report matters most.
  reported_user_id   UUID REFERENCES core.users(id) ON DELETE SET NULL,

  reason             core.report_reason NOT NULL,
  details            TEXT,

  status             core.report_status NOT NULL DEFAULT 'open',
  resolution_note    TEXT,
  reviewed_by        UUID REFERENCES core.users(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT content_reports_no_self_report
    CHECK (reported_user_id IS NULL OR reported_user_id <> reporter_id),
  CONSTRAINT content_reports_details_length
    CHECK (details IS NULL OR length(details) <= 2000)
);

COMMENT ON TABLE core.content_reports IS
  'User reports of objectionable content or people. Required by Play UGC policy and Apple Guideline 1.2 (#690).';

-- One open report per person per thing. A user hammering the button should not
-- create fifty rows for a moderator to wade through — but they can report the
-- same content again once an earlier report has been resolved, because the
-- content may have changed or the situation escalated.
--
-- Partial rather than plain UNIQUE: it constrains only rows that are still
-- open. All four columns are NOT NULL, so there is no NULL-distinctness trap
-- here (the one that made core.role_assignments' constraint decorative — #675).
CREATE UNIQUE INDEX content_reports_one_open_per_reporter
  ON core.content_reports (reporter_id, subject_type, subject_id)
  WHERE status IN ('open', 'reviewing');

CREATE INDEX content_reports_triage_idx
  ON core.content_reports (status, created_at DESC);
CREATE INDEX content_reports_subject_idx
  ON core.content_reports (subject_type, subject_id);
CREATE INDEX content_reports_reported_user_idx
  ON core.content_reports (reported_user_id)
  WHERE reported_user_id IS NOT NULL;

-- =========================================================
-- user_blocks
-- =========================================================
CREATE TABLE core.user_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  blocked_id   UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_blocks_no_self_block CHECK (blocker_id <> blocked_id),
  -- Both columns are NOT NULL, so ordinary UNIQUE is genuinely unique here.
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

COMMENT ON TABLE core.user_blocks IS
  'One row per blocker→blocked direction. Enforcement is symmetric: see core.users_are_blocked().';

CREATE INDEX user_blocks_blocker_idx ON core.user_blocks (blocker_id);
CREATE INDEX user_blocks_blocked_idx ON core.user_blocks (blocked_id);

-- =========================================================
-- Symmetric block check
-- =========================================================
-- A block stops delivery BOTH ways. If A blocks B, then B must not be able to
-- message A either — otherwise blocking is a mute that leaves the blocked
-- person able to keep talking, which is the opposite of what a user means when
-- they press it.
CREATE OR REPLACE FUNCTION core.users_are_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

COMMENT ON FUNCTION core.users_are_blocked IS
  'True if either user has blocked the other. Blocking is symmetric in effect, asymmetric in storage.';

-- Everyone blocked relative to me, in one call.
--
-- RLS lets a user see only rows where they are the blocker, so a client cannot
-- discover who has blocked THEM — correct for privacy, useless for filtering a
-- feed. Enforcement has to be symmetric, so it needs a definer function rather
-- than a select the caller could have written themselves.
--
-- Returns the other party's id for both directions.
CREATE OR REPLACE FUNCTION core.blocked_user_ids(for_user UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = core, pg_temp
AS $$
  SELECT blocked_id FROM core.user_blocks WHERE blocker_id = for_user
  UNION
  SELECT blocker_id FROM core.user_blocks WHERE blocked_id = for_user;
$$;

COMMENT ON FUNCTION core.blocked_user_ids IS
  'Ids to filter out of any feed or thread shown to for_user. Both directions — a block hides you from them AND them from you.';

-- =========================================================
-- RLS
-- =========================================================
ALTER TABLE core.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_blocks ENABLE ROW LEVEL SECURITY;

-- A reporter can see their own reports and nothing else. Deliberately no
-- policy granting the reported person sight of reports against them.
CREATE POLICY content_reports_select_own ON core.content_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY content_reports_insert_own ON core.content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- No UPDATE or DELETE policy for `authenticated` on purpose: a reporter cannot
-- withdraw or edit a report, and cannot resolve one. Moderation runs through
-- the service role.

CREATE POLICY user_blocks_select_own ON core.user_blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY user_blocks_insert_own ON core.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY user_blocks_delete_own ON core.user_blocks
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());

-- =========================================================
-- Grants
-- =========================================================
-- Explicit, because RLS without a GRANT is a 500 rather than a denial — the
-- gap #481 catalogued and migrations 332/335 had to repair after the fact.
GRANT SELECT, INSERT ON core.content_reports TO authenticated;
GRANT SELECT, INSERT, DELETE ON core.user_blocks TO authenticated;
GRANT ALL ON core.content_reports TO service_role;
GRANT ALL ON core.user_blocks TO service_role;
GRANT EXECUTE ON FUNCTION core.users_are_blocked(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core.blocked_user_ids(UUID) TO authenticated, service_role;

COMMIT;
