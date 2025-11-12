# REQ-91 Team Data Migration Plan

## Objectives

- Backfill newly added fields on `core.teams` so existing rows conform to the enhanced schema introduced in migrations `040-043`.
- Normalize `core.team_members` data to satisfy new constraints (`status`, `joined_at`, `metadata`, etc.).
- Ensure organization-scoped team roles exist for every organization to support the runtime permission model.
- Update `core.jobs.assigned_team_id` to reference `core.teams(id)` safely.
- Provide guard rails for rollback by snapshotting the legacy state before any update.

## Source vs Target Mapping

### `core.teams`

| Column | Legacy Behaviour | New Requirement | Backfill Strategy |
| --- | --- | --- | --- |
| `description` (JSONB) | not present | rich-text description | set to empty TipTap doc `{ "type": "doc", "content": [] }` when NULL |
| `purpose` (TEXT) | not present | optional descriptor | default to `'department'` for legacy rows |
| `visibility` (TEXT) | previously absent | enum (`organization`, `private`, `public`) | default to `'organization'` |
| `invitation_policy` (TEXT) | new | `'invite_only'` \| `'request_to_join'` | default `'invite_only'` |
| `invitation_expiration_days` (INT) | new | range 1-90 | default to existing constant 7 |
| `allow_self_join` (BOOL) | new | self service toggle | default `false` |
| `auto_assign_jobs` (BOOL) | new | auto workload toggle | default `false` |
| `metadata` (JSONB) | new | extensible config | default `{}` |
| `settings` (JSONB) | new | UI/runtime settings | default `{}` |
| `default_role_key` (TEXT) | new | cached key for UX | default `'member'` |
| `default_role_id` (UUID) | new | FK to `team_roles.id` | resolve to `'member'` role inserted per organization |
| `parent_team_id` (UUID) | new optional | hierarchy | leave `NULL` |
| `is_archived` (BOOL) | new | archive state | default `false` |
| `archived_at` (TIMESTAMPTZ) / `archived_by` (UUID) / `archived_reason` (TEXT) | new | archive metadata | leave `NULL` |
| `updated_by` (UUID) | new | audit helper | leave `NULL` |
| `analytics_*`, `workload_*` fields | new | analytics/workload metadata | default to safe baseline (`analytics_refresh_interval_minutes = 60`, metadata objects `{}`) |

### `core.team_members`

| Column | Legacy Behaviour | Backfill Strategy |
| --- | --- | --- |
| `role_id` | not present | attempt to map from legacy `core.role_assignments` with `scope_team_id`; otherwise fallback to organization's default `'member'` role |
| `status` | absent | set `'active'` for existing memberships |
| `joined_at` | new NOT NULL default now() | backfill to `created_at`; ensure NOT NULL constraint satisfied |
| `invited_by`, `added_by`, `removed_by`, `invitation_id` | new nullable | leave `NULL` |
| `removed_at`, `removal_reason` | new | leave `NULL` for legacy records |
| `permissions_override`, `metadata` | new JSONB default `{}` | backfill with `{}` |
| `updated_at` | new trigger-managed | set to `created_at` during backfill to avoid NULLs |

### Organization Team Roles

- `ensureOrganizationRoles` logic (from router) will be mirrored:
  - Guarantee roles `admin`, `lead`, `recruiter`, `reviewer`, `member` exist per organization.
  - Seed `team_role_permissions` for missing combinations.
  - Update `core.teams.default_role_id` to `'member'` role ID.

### `core.jobs.assigned_team_id`

- Legacy FK referenced `core.organizations`.
- Backfill steps:
  1. Snapshot `id` and `assigned_team_id` into `core.jobs_team_assignment_backup`.
  2. Nullify assignments referencing non-existent teams.
  3. Replace FK to point at `core.teams(id)` with `ON DELETE SET NULL`.

## Data Safety & Rollback

1. **Backups**
   - `CREATE TABLE` snapshots:
     - `core.teams_backup_pre_migration`
     - `core.team_members_backup_pre_migration`
     - `core.jobs_team_assignment_backup`
2. **Transactional execution**
   - Wrap migration in `BEGIN/COMMIT`.
3. **Idempotency**
   - Use `IF NOT EXISTS` on snapshot tables.
   - Updates guarded with `WHERE` clauses avoiding repeated overwrites.

## Validation Checklist

- After backfill, run assertions:
  - `SELECT COUNT(*)` for teams with NULL `default_role_id` → must be `0`.
  - `SELECT COUNT(*)` for team members with NULL `role_id` or `joined_at` → `0`.
  - `SELECT COUNT(*)` for jobs referencing non-existent teams → `0`.
- Run application test suite (`pnpm test:all`) to ensure no regressions.
- Manual spot-check via Supabase Studio for a few organizations to confirm metadata persists.

## Follow-up Implementation Notes

- TypeScript migration helper (`packages/supabase/scripts/migrate-teams-data.ts`) will execute:
  - Validation queries before/after SQL migration.
  - Optional rollback to backup tables.
  - Summary logs (counts of updated teams, members, roles seeded).

This document guides the actual SQL + script implementation in subsequent steps.

