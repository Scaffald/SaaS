-- =========================================================
-- 339_work_logs_team_id.sql
--
-- Give work logs a real team column and retire the `[team:slug]` prefix that
-- was being jammed into the free-text description. Issue #425.
--
-- The prefix was a documented workaround in scripts/dogfood-log.ts, but it made
-- team attribution depend on nobody editing a description, could not be indexed
-- or joined, and silently corrupted the description a human reads.
--
-- Backfill resolves the encoded slug WITHIN the log's own organization, reached
-- via core.construction_projects (which is what work_logs.project_id actually
-- references — not core.projects, despite the column name). Team slugs are
-- org-prefixed, so the short `frontend` in the description corresponds to
-- `unicorn-frontend` in core.teams; deriving the prefix from the organization
-- rather than hardcoding 'unicorn-' keeps this correct for any org.
--
-- Verified against the 54 prefixed rows in local before writing: all four
-- distinct encoded slugs resolve, none orphan. Production work_logs is empty,
-- so there is nothing to backfill there yet.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. The column.
-- ---------------------------------------------------------

ALTER TABLE core.work_logs
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL;

COMMENT ON COLUMN core.work_logs.team_id IS
  'Team the work was done for. Nullable: a log need not belong to a team, and ON DELETE SET NULL so removing a team does not destroy work history. Replaces the [team:slug] prefix formerly encoded in work_description (#425).';

-- Team reporting filters on (team_id, log_date), which is the query the prefix
-- could never serve.
CREATE INDEX IF NOT EXISTS work_logs_team_id_log_date_idx
  ON core.work_logs (team_id, log_date DESC)
  WHERE team_id IS NOT NULL;

-- ---------------------------------------------------------
-- 2. Backfill from the encoded prefix, org-scoped.
-- ---------------------------------------------------------

-- Correlated subquery rather than UPDATE ... FROM: the target table is not
-- referenceable from inside a join's ON clause there, and the slug match needs
-- the row's own work_description.
UPDATE core.work_logs w
SET team_id = (
  SELECT t.id
  FROM core.construction_projects cp
  JOIN core.organizations o ON o.id = cp.organization_id
  JOIN core.teams t
    ON t.organization_id = o.id
   AND t.slug = o.slug || '-' || substring(w.work_description from '^\[team:([a-z0-9-]+)\]')
  WHERE cp.id = w.project_id
  LIMIT 1
)
WHERE w.team_id IS NULL
  AND w.work_description ~ '^\[team:[a-z0-9-]+\]';

-- ---------------------------------------------------------
-- 3. Strip the prefix now the data lives in a column.
--
-- Only from rows where the team was actually captured, so an unresolvable
-- prefix is left visible rather than silently discarded — it is the only
-- remaining record of the intent.
-- ---------------------------------------------------------

UPDATE core.work_logs
SET work_description = btrim(regexp_replace(work_description, '^\[team:[a-z0-9-]+\]\s*', ''))
WHERE team_id IS NOT NULL
  AND work_description ~ '^\[team:[a-z0-9-]+\]';

COMMIT;
