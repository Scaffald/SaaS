# REQ-91 Team Migration Validation Notes

## Local Verification Checklist

1. **Apply SQL migration**
   ```bash
   pnpm supa migration:up --filter 098_migrate_existing_teams_data.sql
   ```
2. **Run data helper script**
   ```bash
   pnpm ts-node packages/supabase/scripts/migrate-teams-data.ts
   ```
3. **Post-migration assertions**
   - `SELECT COUNT(*) FROM core.teams WHERE default_role_id IS NULL;` → `0`
   - `SELECT COUNT(*) FROM core.team_members WHERE role_id IS NULL;` → `0`
   - `SELECT COUNT(*) FROM core.jobs j LEFT JOIN core.teams t ON t.id = j.assigned_team_id WHERE j.assigned_team_id IS NOT NULL AND t.id IS NULL;` → `0`
4. **Regression suite**
   ```bash
   pnpm check
   pnpm test:all   # optional but recommended before release
   ```

## Current Workspace Status

- ✅ `pnpm check`
- ✅ Fixture + integration test suite updates (`packages/supabase/functions/trpc/__tests__/integration/teams.test.ts`, `team-invitations.test.ts`)
- ✅ Migration artefacts ready (`098_migrate_existing_teams_data.sql`, `migrate-teams-data.ts`)

The Supabase script logs the number of teams and members updated, making it easy to compare before/after counts during QA. Use the SQL assertions above after running in staging to confirm a clean backfill before promoting to production.

