---
title: Team Management Developer Guide
description: Technical architecture, extension guidance, and operational practices for REQ-91 team management features.
date: 2025-11-12
---

## Architecture Overview

### Stack

- **Supabase Postgres**: core data (`core.teams`, `team_members`, `team_invitations`, `team_roles`, `team_role_permissions`, `team_activity_events`, workload/analytics tables).
- **tRPC (Deno Edge)**: `packages/supabase/functions/trpc/routers/teams.router.ts` consolidates all team APIs.
- **Edge Functions**: `send-team-invitation` for notifications, `notify-publish` for in-app pushes.
- **Clients**: Office web & Expo apps consume the router via shared core packages (`packages/core/features/office/teams/*`).

### Data Flow

1. **Mutation** invoked via tRPC.
2. Router validates input with Zod schemas (shared from `@app/schemas`).
3. Supabase admin client executes SQL operations with row-level security.
4. Helpers (`transformTeam`, `transformMember`, etc.) normalize records.
5. Side effects trigger:
   - Audit logging (`recordTeamAuditLog`).
   - Notifications (`publishTeamNotification`, `sendTeamInvitationNotification`).
   - Analytics/workload recalculation jobs (triggered asynchronously).

### Key Helpers

- `ensureOrganizationRoles`: seeds default roles + permissions per org.
- `ensureTeamActionPermission`: guards operations using `TeamPermissions`.
- `resolveRoleId`: normalizes role keys/IDs across teams and migration aliases.
- `notifyTeamMemberAdded/Removed`: unifies notification payloads.

## Database Schema

See `packages/supabase/migrations`:

- `040_req_91_team_management_schema.sql`: core tables/columns.
- `048_req_91_team_analytics_seed.sql`: analytics seed data.
- `098_migrate_existing_teams_data.sql`: data backfill and referential clean-up.

### Tables & Views

- `core.teams`: extended metadata, invitation policies, workload settings, analytics fields.
- `core.team_members`: role assignments, status history, metadata for permissions overrides.
- `core.team_invitations`: hashed tokens, delivery history, metadata.
- `core.team_roles` & `core.team_role_permissions`: per-org RBAC.
- `core.team_activity_events`: audit/activity feed (also powers comments).
- `core.team_daily_metrics`, `core.team_member_workloads`, `v_team_member_workloads_latest`: analytics sources.
- `core.job_team_assignments`: cross-link jobs to teams.

### RLS Highlights

- RLS policies allow:
  - Org admins / owners full CRUD.
  - Team members read access to their teams.
  - Invitation recipients read their invitations.
- Supabase service role is required for mutation paths; enforce permission checks in the router before writing.

## API Surface

Refer to the [Teams API Reference](../api/teams.md) for exhaustive request/response shapes.

Important namespaces:

- `teams.*`: core CRUD, analytics, job assignments.
- `teams.members.*`: role & membership management.
- `teams.invitations.*`: invitation lifecycle.
- `teams.analytics.*`: metrics, workload, activity comments.
- `teams.jobs.*`: job-to-team assignments.

### Adding New Procedures

1. Extend schemas in `@app/schemas/src/teams`.
2. Add business logic inside the appropriate builder (`buildTeamsRouter`, `buildMembersRouter`, etc.).
3. Ensure permission helpers or new permission constants cover the scenario.
4. Update integration tests (`packages/supabase/functions/trpc/__tests__/integration/teams.test.ts` / `team-invitations.test.ts`).
5. Document the endpoint in the API reference and guides.

## Notifications & Edge Functions

- **Invitation Emails**: `send-team-invitation` edge function consumes `invitationId`, `token`, `actorId`, `resend`.
- **General Notifications**: `notify-publish` handles in-app/email push for member add/remove, comments, workload alerts.
- **Configuration**: Requires `SUPABASE_FUNCTIONS_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

## Audit Logging

- `recordTeamAuditLog` writes to `core.team_activity_events`.
- Every key mutation logs:
  - Invite creation/resend/revoke.
  - Member add/update/remove/status changes.
  - Ownership transfers.
  - Invitation responses (accepted/declined).
  - Discussion comments (`teams.analytics.postComment`).
- Keep action strings consistent (`joined`, `removed`, `invited`, `invitation_rescinded`, etc.) for analytics dashboards.

## Data Migration Strategy

1. Run SQL migration `098_migrate_existing_teams_data.sql` to backfill columns and clean foreign keys.
2. Execute `packages/supabase/scripts/migrate-teams-data.ts`:
   - Seeds roles & permissions for each org.
   - Aligns `default_role_id` with canonical role records.
   - Ensures members inherit default roles when missing.
3. Validate with `packages/supabase/docs/REQ-91-team-migration-validation.md`.

> Use `pnpm supa migration:up` followed by the TypeScript helper for staging rollouts. Capture before/after counts for QA using the SQL in the validation doc.

## Testing

- **Integration**: `packages/supabase/functions/trpc/__tests__/integration/teams.test.ts` and `team-invitations.test.ts`.
  - Shared fixture: `setupTeamManagementFixture` inside `seed-utils.ts`.
- **Unit**: Add targeted tests for helpers or analytics reducers as needed.
- Run via `pnpm test:all` or `pnpm --filter @app/supabase test`.

## Client Integration Notes

- Shared Tamagui UI resides in `packages/core/features/office/teams` and `packages/ui`.
- React Query hooks wrap tRPC procedures; maintain consistent query keys when adding endpoints.
- Analytics/workload calls may return empty arrays without error—guard UI accordingly.

## Operational Playbook

### Deployments

- Run `pnpm test:local` prior to commits (lint + changed-file Vitest coverage without blocking on known Expo/Supabase issues).
- Apply Supabase migrations with workspace commands (`pnpm supa migration:up`).
- Redeploy edge functions whenever notification payloads change.

### Observability

- `team_activity_events` powers audit reports and comments feed.
- Posthog dashboards monitor feature adoption (`docs/analytics/validation-rollout.md`).
- Maintain runbooks for invitation troubleshooting using metadata fields (delivery channels, resend counts).

### Troubleshooting

| Symptom | Possible Cause | Next Steps |
|---------|----------------|------------|
| Invitation tokens invalid | Hash mismatch or expired TTL | Resend invitation (regenerates token & expiry). |
| Missing analytics data | Worker not running or team not refreshed | Trigger manual refresh or inspect cron logs. |
| Unauthorized errors for admins | Role seeding incomplete | Re-run `ensureOrganizationRoles`; verify `team_role_permissions`. |
| Workload snapshots empty | ETL not populated | Confirm `team_member_workloads` job ran; check feature flag toggles. |

## Extension Points

- **Custom Roles**: Extend `TEAM_ROLE_KEYS` + `ROLE_PERMISSIONS` and update migrations/scripts.
- **Additional Notifications**: Wrap new audit events with `publishTeamNotification`.
- **Integrations**: Build webhooks off `team_activity_events` or poll analytics endpoints.

## References

- [Teams API Reference](../api/teams.md)
- [Team Management User Guide](./team-management-user-guide.md)
- [Migration Plan](../../packages/supabase/docs/REQ-91-team-migration-plan.md)
- [Migration Validation](../../packages/supabase/docs/REQ-91-team-migration-validation.md)
- [Migration Script](../../packages/supabase/scripts/migrate-teams-data.ts)
- [Integration Fixture Helpers](../../packages/supabase/functions/trpc/__tests__/integration/seed-utils.ts)

Keep this guide updated whenever schema, permissions, or operational practices evolve.
---
title: Team Management Developer Guide
description: Technical architecture, extension guidance, and operational practices for REQ-91 team management features.
date: 2025-11-12
---

## Architecture Overview

### Stack

- **Supabase Postgres**: core data (`core.teams`, `team_members`, `team_invitations`, `team_roles`, `team_role_permissions`, `team_activity_events`, workload/analytics tables).
- **tRPC (Deno Edge)**: `packages/supabase/functions/trpc/routers/teams.router.ts` consolidates all team APIs.
- **Edge Functions**: `send-team-invitation` for notifications, `notify-publish` for in-app pushes.
- **Clients**: Office web & Expo apps consume the router via shared core packages (`packages/core/features/office/teams/*`).

### Data Flow

1. **Mutation** invoked via tRPC.
2. Router validates input with Zod schemas (shared from `@app/schemas`).
3. Supabase admin client executes SQL operations with row-level security.
4. Helpers (`transformTeam`, `transformMember`, etc.) normalize records.
5. Side effects trigger:
   - Audit logging (`recordTeamAuditLog`).
   - Notifications (`publishTeamNotification`, `sendTeamInvitationNotification`).
   - Analytics/workload recalculation jobs (triggered asynchronously).

### Key Helpers

- `ensureOrganizationRoles`: seeds default roles + permissions per org.
- `ensureTeamActionPermission`: guards operations using `TeamPermissions`.
- `resolveRoleId`: normalizes role keys/IDs across teams and migration aliases.
- `notifyTeamMemberAdded/Removed`: unifies notification payloads.

## Database Schema

See `packages/supabase/migrations`:

- `040_req_91_team_management_schema.sql`: core tables/columns.
- `048_req_91_team_analytics_seed.sql`: analytics seed data.
- `098_migrate_existing_teams_data.sql`: data backfill and referential clean-up.

### Tables & Views

- `core.teams`: extended metadata, invitation policies, workload settings, analytics fields.
- `core.team_members`: role assignments, status history, metadata for permissions overrides.
- `core.team_invitations`: hashed tokens, delivery history, metadata.
- `core.team_roles` & `core.team_role_permissions`: per-org RBAC.
- `core.team_activity_events`: audit/activity feed (also powers comments).
- `core.team_daily_metrics`, `core.team_member_workloads`, `v_team_member_workloads_latest`: analytics sources.
- `core.job_team_assignments`: cross-link jobs to teams.

### RLS Highlights

- RLS policies allow:
  - Org admins / owners full CRUD.
  - Team members read access to their teams.
  - Invitation recipients read their invitations.
- Supabase service role is required for mutation paths; enforce permission checks in the router before writing.

## API Surface

Refer to the [Teams API Reference](../api/teams.md) for exhaustive request/response shapes.

Important namespaces:

- `teams.*`: core CRUD, analytics, job assignments.
- `teams.members.*`: role & membership management.
- `teams.invitations.*`: invitation lifecycle.
- `teams.analytics.*`: metrics, workload, activity comments.
- `teams.jobs.*`: job-to-team assignments.

### Adding New Procedures

1. Extend schemas in `@app/schemas/src/teams`.
2. Add business logic inside the appropriate builder (`buildTeamsRouter`, `buildMembersRouter`, etc.).
3. Ensure permission helpers or new permission constants cover the scenario.
4. Update integration tests (`packages/supabase/functions/trpc/__tests__/integration/teams.test.ts` / `team-invitations.test.ts`).
5. Document the endpoint in the API reference and guides.

## Notifications & Edge Functions

- **Invitation Emails**: `send-team-invitation` edge function consumes `invitationId`, `token`, `actorId`, `resend`.
- **General Notifications**: `notify-publish` handles in-app/email push for member add/remove, comments, workload alerts.
- **Configuration**: Requires `SUPABASE_FUNCTIONS_URL` + `SUPABASE_SERVICE_ROLE_KEY` (set in env and managed via `pnpm supa` scripts).

## Audit Logging

- `recordTeamAuditLog` writes to `core.team_activity_events`.
- Every key mutation logs:
  - Invite creation/resend/revoke.
  - Member add/update/remove/status changes.
  - Ownership transfers.
  - Invitation responses (accepted/declined).
  - Discussion comments (`team.analytics.postComment`).
- Keep action strings consistent (`joined`, `removed`, `invited`, `invitation_rescinded`, etc.) for analytics dashboards.

## Data Migration Strategy

1. Run SQL migration `098_migrate_existing_teams_data.sql` to backfill columns and clean foreign keys.
2. Execute TypeScript helper `packages/supabase/scripts/migrate-teams-data.ts`:
   - Seeds roles & permissions for each org.
   - Aligns `default_role_id` with canonical role records.
   - Ensures members inherit default roles when missing.
3. Validate with `packages/supabase/docs/REQ-91-team-migration-validation.md`.

> Use `pnpm supa migration:up` followed by `pnpm supa -- --project-ref dev supabase db execute` (see Supabase rulebook) for controlled rollouts.

## Testing

- **Integration Tests**: Located under `packages/supabase/functions/trpc/__tests__/integration`.
  - `teams.test.ts`: CRUD, role enforcement, analytics entry points.
  - `team-invitations.test.ts`: invitation issuance, roles, permissions.
  - Shared fixtures: `seed-utils.ts` (`setupTeamManagementFixture`) seeds organizations, users, roles, teams.
- **Unit Tests**: Add targeted tests for helpers or analytics reducers if needed.
- Run via `pnpm test:all` or filtered `pnpm --filter @app/supabase test`.

## Client Integration Notes

- Shared TAMAGUI UI components live under `packages/core/features/office/teams` and `packages/ui`.
- Use React Query hooks auto-generated from tRPC clients (see `packages/core/api/teams`).
- Maintain loading & error boundaries around analytics and workload queries—they can return empty arrays without error when data is unavailable.

## Operational Playbook

### Deployments

- Always run `pnpm check` before committing (pre-commit hook mirrors CI).
- For Supabase migrations, use the environment-specific refs (`pnpm supa:status`) to confirm state.
- Edge Functions must be redeployed when notification payloads or contract changes.

### Observability

- Use `team_activity_events` for audit dashboards.
- `validation-rollout.md` outlines rollout validation steps (paired with this guide).
- Posthog dashboards track user interaction; see `docs/analytics/validation-rollout.md`.

### Troubleshooting

| Symptom | Possible Cause | Next Steps |
|---------|----------------|------------|
| Invitation tokens invalid | Hash mismatch or expired TTL | Check `team_invitations` record; resend (resets token) |
| Missing analytics data | Worker not running or team not refreshed | Trigger manual refresh (admin) or inspect cron logs |
| Unauthorized errors for admins | Role seeding incomplete | Re-run `ensureOrganizationRoles`; verify `team_role_permissions` |
| Workload snapshots empty | ETL not populated | Confirm background job populates `team_member_workloads`; check feature flag toggles |

## Extension Points

- **Custom Roles**: Extend `TEAM_ROLE_KEYS` and update `ROLE_PERMISSIONS` + migration script to seed new permissions.
- **Additional Notifications**: Wrap new audit events with `publishTeamNotification`.
- **Integrations**: Use `team_activity_events` webhook emitter (planned) or poll analytics endpoints.

## References

- [API Reference](../api/teams.md)
- [User Guide](./team-management-user-guide.md)
- [Migration Plan](../../packages/supabase/docs/REQ-91-team-migration-plan.md)
- [Migration Validation](../../packages/supabase/docs/REQ-91-team-migration-validation.md)
- [Migration Script](../../packages/supabase/scripts/migrate-teams-data.ts)
- [Integration Fixture Helpers](../../packages/supabase/functions/trpc/__tests__/integration/seed-utils.ts)

Keep this guide updated whenever schema, permissions, or operational practices evolve.

