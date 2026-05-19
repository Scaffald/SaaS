-- =========================================================
-- 325_tasks_and_punchlists.sql
--
-- Phase 3 of the dogfood plan: introduce first-class Tasks and
-- Punchlists so we can manage our own work inside this product instead
-- of Linear/Notion. Tasks are scoped to an organization (+ optional
-- project + team slug) with assignee, status, priority, and due date.
-- Punchlists are named buckets of tasks (sprint / milestone / release).
-- Tasks can be linked to the work logs that completed them via the
-- junction `core.work_log_tasks`.
--
-- See docs/agents/DOGFOODING.md (Phase 3) for the why.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- core.punchlists — named bucket of tasks (sprint / milestone)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.punchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations (id) ON DELETE CASCADE,
  project_id UUID REFERENCES core.construction_projects (id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  target_date DATE,
  created_by_user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS punchlists_org_idx ON core.punchlists (organization_id, status);
CREATE INDEX IF NOT EXISTS punchlists_project_idx ON core.punchlists (project_id) WHERE project_id IS NOT NULL;

DROP TRIGGER IF EXISTS punchlists_set_updated_at ON core.punchlists;
CREATE TRIGGER punchlists_set_updated_at
  BEFORE UPDATE ON core.punchlists
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ---------------------------------------------------------
-- core.tasks — the unit of work
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations (id) ON DELETE CASCADE,
  project_id UUID REFERENCES core.construction_projects (id) ON DELETE SET NULL,
  punchlist_id UUID REFERENCES core.punchlists (id) ON DELETE SET NULL,
  -- Team scoping is by slug for now so we can store the same identifier we
  -- already put into work_log descriptions (e.g. 'frontend'). Phase 3
  -- follow-up: introduce a proper team_id FK once teams have a stable
  -- public identity in the API surface.
  team_slug TEXT,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT,
  assignee_user_id UUID REFERENCES core.users (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  -- For audit / source-of-record on tasks that were migrated in from
  -- markdown files. Free-form tag; no FK.
  source TEXT,
  created_by_user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_org_status_idx ON core.tasks (organization_id, status);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON core.tasks (assignee_user_id, status) WHERE assignee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_project_idx ON core.tasks (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_punchlist_idx ON core.tasks (punchlist_id) WHERE punchlist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tasks_team_slug_idx ON core.tasks (organization_id, team_slug) WHERE team_slug IS NOT NULL;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON core.tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON core.tasks
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Auto-stamp completed_at when status transitions to/from 'done'.
CREATE OR REPLACE FUNCTION core.tasks_handle_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
  ELSIF NEW.status <> 'done' AND OLD.status = 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_completion_stamp ON core.tasks;
CREATE TRIGGER tasks_completion_stamp
  BEFORE UPDATE ON core.tasks
  FOR EACH ROW EXECUTE FUNCTION core.tasks_handle_completion();

-- ---------------------------------------------------------
-- core.work_log_tasks — junction: a log can complete N tasks
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.work_log_tasks (
  work_log_id UUID NOT NULL REFERENCES core.work_logs (id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES core.tasks (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (work_log_id, task_id)
);

CREATE INDEX IF NOT EXISTS work_log_tasks_task_idx ON core.work_log_tasks (task_id);

-- =========================================================
-- RLS — any member of the org can see/create/update tasks;
-- the task creator OR an org admin can delete.
-- =========================================================

ALTER TABLE core.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE core.punchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.punchlists FORCE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_tasks FORCE ROW LEVEL SECURITY;

-- tasks
DROP POLICY IF EXISTS tasks_select_org_member ON core.tasks;
CREATE POLICY tasks_select_org_member
  ON core.tasks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = tasks.organization_id
  ));

DROP POLICY IF EXISTS tasks_insert_org_member ON core.tasks;
CREATE POLICY tasks_insert_org_member
  ON core.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.role_assignments ra
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = tasks.organization_id
    )
  );

DROP POLICY IF EXISTS tasks_update_org_member ON core.tasks;
CREATE POLICY tasks_update_org_member
  ON core.tasks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = tasks.organization_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = tasks.organization_id
  ));

DROP POLICY IF EXISTS tasks_delete_creator_or_admin ON core.tasks;
CREATE POLICY tasks_delete_creator_or_admin
  ON core.tasks
  FOR DELETE
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = tasks.organization_id
        AND r.scope = 'organization' AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS tasks_service_role ON core.tasks;
CREATE POLICY tasks_service_role
  ON core.tasks
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- punchlists (same shape)
DROP POLICY IF EXISTS punchlists_select_org_member ON core.punchlists;
CREATE POLICY punchlists_select_org_member
  ON core.punchlists
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = punchlists.organization_id
  ));

DROP POLICY IF EXISTS punchlists_insert_org_member ON core.punchlists;
CREATE POLICY punchlists_insert_org_member
  ON core.punchlists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.role_assignments ra
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = punchlists.organization_id
    )
  );

DROP POLICY IF EXISTS punchlists_update_org_member ON core.punchlists;
CREATE POLICY punchlists_update_org_member
  ON core.punchlists
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = punchlists.organization_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM core.role_assignments ra
    WHERE ra.user_id = auth.uid()
      AND ra.scope_org_id = punchlists.organization_id
  ));

DROP POLICY IF EXISTS punchlists_delete_creator_or_admin ON core.punchlists;
CREATE POLICY punchlists_delete_creator_or_admin
  ON core.punchlists
  FOR DELETE
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = punchlists.organization_id
        AND r.scope = 'organization' AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS punchlists_service_role ON core.punchlists;
CREATE POLICY punchlists_service_role
  ON core.punchlists
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- work_log_tasks (link table): visible / editable if the caller can see
-- the underlying work log AND the task's org (same membership check as tasks).
DROP POLICY IF EXISTS work_log_tasks_select_authorized ON core.work_log_tasks;
CREATE POLICY work_log_tasks_select_authorized
  ON core.work_log_tasks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.tasks t
    JOIN core.role_assignments ra
      ON ra.user_id = auth.uid() AND ra.scope_org_id = t.organization_id
    WHERE t.id = work_log_tasks.task_id
  ));

DROP POLICY IF EXISTS work_log_tasks_modify_log_owner ON core.work_log_tasks;
CREATE POLICY work_log_tasks_modify_log_owner
  ON core.work_log_tasks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM core.work_logs wl
    WHERE wl.id = work_log_tasks.work_log_id
      AND wl.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM core.work_logs wl
    WHERE wl.id = work_log_tasks.work_log_id
      AND wl.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS work_log_tasks_service_role ON core.work_log_tasks;
CREATE POLICY work_log_tasks_service_role
  ON core.work_log_tasks
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON core.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.punchlists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.work_log_tasks TO authenticated;
GRANT ALL ON core.tasks TO service_role;
GRANT ALL ON core.punchlists TO service_role;
GRANT ALL ON core.work_log_tasks TO service_role;

COMMIT;
