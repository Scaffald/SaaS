-- =============================================================================
-- 408: Skill Snapshots & Evidence Tables
-- Tracks skill progression over time via automatic snapshots and user-provided
-- evidence items linked to specific skills.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. skill_snapshots — point-in-time captures of a user's skill state
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE core.skill_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- What triggered this snapshot
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN (
    'review_received',   -- auto: peer review submitted for this user
    'self_assessment',   -- auto: user updated their soft skills
    'manual',            -- user explicitly saved a snapshot
    'periodic'           -- system cron (monthly, future)
  )),
  trigger_id      UUID,   -- optional FK to the review or assessment that triggered this

  -- Full skill state at this point in time (JSONB for flexibility)
  snapshot_data   JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Pre-computed deltas from previous snapshot (NULL for first snapshot)
  summary         JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookups: user's snapshots in reverse chronological order
CREATE INDEX idx_skill_snapshots_user_date
  ON core.skill_snapshots(user_id, created_at DESC);

-- Find snapshots by trigger
CREATE INDEX idx_skill_snapshots_trigger
  ON core.skill_snapshots(trigger_type, trigger_id)
  WHERE trigger_id IS NOT NULL;

COMMENT ON TABLE core.skill_snapshots IS
  'Point-in-time captures of user skill state for tracking progression over time';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. skill_evidence — proof items linked to specific skills
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE core.skill_evidence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Which skill this evidence supports (soft skill or hard skill)
  soft_skill_id   UUID REFERENCES core.soft_skills(id) ON DELETE SET NULL,
  skill_taxonomy  TEXT CHECK (skill_taxonomy IS NULL OR skill_taxonomy IN ('csi', 'onet')),
  skill_ref_id    UUID,   -- csi_skill_id or onet_occupation_id (stored as UUID for csi)

  -- Evidence details
  evidence_type   TEXT NOT NULL CHECK (evidence_type IN (
    'certification',     -- link to a cert or credential
    'project',           -- reference to a completed project
    'review_excerpt',    -- auto-extracted from a peer review
    'work_log',          -- link to a work log entry
    'custom'             -- user-provided freeform evidence
  )),
  title           TEXT NOT NULL,
  description     TEXT,
  url             TEXT,

  -- Verification
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_by     UUID REFERENCES core.users(id),
  verified_at     TIMESTAMPTZ,

  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- At least one skill reference must be present
  CONSTRAINT skill_evidence_has_skill CHECK (
    soft_skill_id IS NOT NULL
    OR (skill_taxonomy IS NOT NULL AND skill_ref_id IS NOT NULL)
  )
);

-- User's evidence items
CREATE INDEX idx_skill_evidence_user
  ON core.skill_evidence(user_id);

-- Evidence by soft skill
CREATE INDEX idx_skill_evidence_soft_skill
  ON core.skill_evidence(soft_skill_id)
  WHERE soft_skill_id IS NOT NULL;

-- Evidence by hard skill
CREATE INDEX idx_skill_evidence_hard_skill
  ON core.skill_evidence(skill_taxonomy, skill_ref_id)
  WHERE skill_taxonomy IS NOT NULL;

COMMENT ON TABLE core.skill_evidence IS
  'Evidence items (certs, projects, review excerpts) linked to specific skills';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE core.skill_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.skill_evidence ENABLE ROW LEVEL SECURITY;

-- skill_snapshots: users can read their own + public profiles can be viewed
CREATE POLICY skill_snapshots_select ON core.skill_snapshots
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(
      (
        SELECT (prefs.profile_visibility ->> 'skills')::BOOLEAN
        FROM core.preferences prefs
        WHERE prefs.user_id = skill_snapshots.user_id
      ),
      true
    )
  );

CREATE POLICY skill_snapshots_insert ON core.skill_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No user update/delete — snapshots are immutable audit records
-- Only service_role can modify (for system-generated snapshots)

CREATE POLICY skill_snapshots_select_service_role ON core.skill_snapshots
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY skill_snapshots_insert_service_role ON core.skill_snapshots
  FOR INSERT TO service_role
  WITH CHECK (true);

-- skill_evidence: owner full CRUD, others read via profile visibility
CREATE POLICY skill_evidence_select ON core.skill_evidence
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(
      (
        SELECT (prefs.profile_visibility ->> 'skills')::BOOLEAN
        FROM core.preferences prefs
        WHERE prefs.user_id = skill_evidence.user_id
      ),
      true
    )
  );

CREATE POLICY skill_evidence_insert ON core.skill_evidence
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY skill_evidence_update ON core.skill_evidence
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY skill_evidence_delete ON core.skill_evidence
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY skill_evidence_service_role ON core.skill_evidence
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Grants
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT ON core.skill_snapshots TO authenticated;
GRANT ALL ON core.skill_snapshots TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.skill_evidence TO authenticated;
GRANT ALL ON core.skill_evidence TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Function: create_skill_snapshot
-- Called after review submission or self-assessment update
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION core.create_skill_snapshot(
  p_user_id UUID,
  p_trigger_type TEXT,
  p_trigger_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_snapshot_id UUID;
  v_snapshot_data JSONB;
  v_previous_data JSONB;
  v_summary JSONB;
BEGIN
  -- Build snapshot_data from current user skill state
  SELECT jsonb_build_object(
    'soft_skills', COALESCE((
      SELECT jsonb_build_object(
        'categories', jsonb_object_agg(
          ss.category,
          jsonb_build_object(
            'average', ROUND(AVG(us.proficiency_level)::numeric, 2),
            'count', COUNT(*)
          )
        ),
        'overall_average', ROUND(AVG(us.proficiency_level)::numeric, 2)
      )
      FROM core.user_skills us
      JOIN core.soft_skills ss ON ss.id = us.soft_skill_id
      WHERE us.user_id = p_user_id
        AND us.skill_taxonomy = 'soft_skills'
    ), '{}'::jsonb),
    'evidence_count', (
      SELECT COUNT(*) FROM core.skill_evidence WHERE user_id = p_user_id
    ),
    'review_count', (
      SELECT COUNT(*) FROM core.reviews
      WHERE subject_type = 'user' AND subject_id = p_user_id::text
    )
  ) INTO v_snapshot_data;

  -- Get previous snapshot for delta computation
  SELECT snapshot_data INTO v_previous_data
  FROM core.skill_snapshots
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Compute summary (deltas from previous)
  IF v_previous_data IS NOT NULL THEN
    v_summary := jsonb_build_object(
      'delta_overall',
        COALESCE((v_snapshot_data -> 'soft_skills' ->> 'overall_average')::numeric, 0) -
        COALESCE((v_previous_data -> 'soft_skills' ->> 'overall_average')::numeric, 0),
      'previous_overall',
        COALESCE((v_previous_data -> 'soft_skills' ->> 'overall_average')::numeric, 0)
    );
  END IF;

  INSERT INTO core.skill_snapshots (user_id, trigger_type, trigger_id, snapshot_data, summary)
  VALUES (p_user_id, p_trigger_type, p_trigger_id, v_snapshot_data, v_summary)
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION core.create_skill_snapshot(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.create_skill_snapshot(UUID, TEXT, UUID) TO service_role;
