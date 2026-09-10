-- 354: the two tables that three live features were written against and that
-- never existed (#658, the last of #660's schema half).
--
-- Both routers, both SDK resources, their hooks, and thirteen components were
-- built as though these tables were there. Nothing in this migration is a
-- design decision of its own: every column, constraint and access rule below
-- is read off what the code already does. Where the code was silent, the
-- comment says what was chosen and why.
--
-- The third table in #658, core.profile_completion_nudges, is NOT created. Its
-- one route had a hook and no component behind the hook, and its upsert named
-- no conflict target, so it never worked as an upsert. Retired instead.

BEGIN;

-- =========================================================
-- core.soft_skills_ratings
-- =========================================================
-- A worker's self-assessment of the soft-skill taxonomy in core.soft_skills.
--
-- Versioned, append-only. PATCH /v1/profiles/skills/soft writes a whole new
-- version (max(version)+1) rather than updating rows, GET /soft reads the
-- latest, /soft/history reads every version, and /soft/comparison reads the
-- latest against the catalogue. So a version is a snapshot of one sitting,
-- and there is deliberately no UPDATE or DELETE for the user: a corrected
-- assessment is a new version, and the old one stays in the history that
-- SoftSkillsHistoryTimeline renders.
CREATE TABLE core.soft_skills_ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  -- RESTRICT, not CASCADE: the taxonomy retires a skill by is_active=false, and
  -- a history should not lose rows because a label was retired.
  skill_id         UUID NOT NULL REFERENCES core.soft_skills(id) ON DELETE RESTRICT,
  -- The route validates z.number().min(1).max(5); the database says the same
  -- so a second writer cannot store a 7.
  rating           SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  version          INTEGER NOT NULL CHECK (version >= 1),
  self_assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One rating per skill per sitting. All three NOT NULL, so plain UNIQUE
  -- genuinely constrains (#675 was a UNIQUE over nullable columns that never
  -- fired).
  CONSTRAINT soft_skills_ratings_one_per_skill_per_version
    UNIQUE (user_id, skill_id, version)
);

COMMENT ON TABLE core.soft_skills_ratings IS
  'Versioned soft-skill self-assessments. Append-only; a new sitting is a new version (#658).';

-- "latest version for this user" and "history newest-first" are both this.
CREATE INDEX soft_skills_ratings_user_version_idx
  ON core.soft_skills_ratings (user_id, version DESC);

ALTER TABLE core.soft_skills_ratings ENABLE ROW LEVEL SECURITY;

-- Read: own rows, or anyone's when that profile's skills are visible. This is
-- the house rule for profile skill data, copied from skill_snapshots_select —
-- GET /soft accepts ?userId= precisely so an employer can view a candidate's
-- ratings with the request client. (user_skills_select_public has the same
-- intent but compares prefs.user_id to itself, a tautology; the form below is
-- the correct one.)
CREATE POLICY soft_skills_ratings_select ON core.soft_skills_ratings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(
      (SELECT (prefs.profile_visibility ->> 'skills')::boolean
         FROM core.preferences prefs
        WHERE prefs.user_id = soft_skills_ratings.user_id),
      true
    )
  );

CREATE POLICY soft_skills_ratings_insert_own ON core.soft_skills_ratings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE / DELETE policy for authenticated, on purpose — see the table note.

CREATE POLICY soft_skills_ratings_service_role ON core.soft_skills_ratings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- core.profile_import_data
-- =========================================================
-- Staging for a resume / LinkedIn / JSON import awaiting the user's review on
-- /profile/resume/review. The route enforces a 24-hour expiry in code and
-- deletes on read when past it; the payload is the parsed import, shaped as
-- the SDK's ImportPayload (general / experience / education / skills /
-- certifications), stored whole because the review screen renders it whole.
CREATE TABLE core.profile_import_data (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  -- The SDK's union, verbatim.
  source     TEXT NOT NULL CHECK (source IN ('resume', 'json', 'linkedin', 'manual')),
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- The route already does delete-then-insert to keep one staged import per
  -- user, but that pair is not atomic. This makes the invariant the
  -- database's: a concurrent second save fails with 23505 instead of leaving
  -- two rows for GET's .limit(1).single() to choose between.
  CONSTRAINT profile_import_data_one_per_user UNIQUE (user_id)
);

COMMENT ON TABLE core.profile_import_data IS
  'One staged profile import per user, pending review. Expiry (24h) is enforced by the API, not here (#658).';

ALTER TABLE core.profile_import_data ENABLE ROW LEVEL SECURITY;

-- Transient staging: own rows only, every operation. Never public.
CREATE POLICY profile_import_data_own_select ON core.profile_import_data
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY profile_import_data_own_insert ON core.profile_import_data
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY profile_import_data_own_delete ON core.profile_import_data
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY profile_import_data_service_role ON core.profile_import_data
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =========================================================
-- Grants
-- =========================================================
-- Explicit, because RLS without a GRANT is a 500 rather than a denial — the
-- gap #481 catalogued and 352 had to repair after the fact.
GRANT SELECT, INSERT ON core.soft_skills_ratings TO authenticated;
GRANT ALL ON core.soft_skills_ratings TO service_role;

GRANT SELECT, INSERT, DELETE ON core.profile_import_data TO authenticated;
GRANT ALL ON core.profile_import_data TO service_role;

COMMIT;
