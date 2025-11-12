---
title: Teams API Reference
description: End-to-end reference for the REQ-91 team management tRPC surface, including core team operations, member management, invitations, analytics, and job assignments.
date: 2025-11-12
---

## Overview

The `teams` tRPC router powers all team management capabilities introduced in REQ-91. It covers:

- Creating and managing teams within an organization
- Managing membership, roles, invitations, and workload settings
- Tracking analytics, activity, and workload snapshots
- Assigning teams to jobs and keeping audit trails up to date

All procedures return JSON-friendly payloads. Types shown below mirror the structures produced by the helper transformers in `packages/supabase/functions/trpc/routers/teams.router.ts`.

> **Base Paths**
>
> - Authenticated clients call `teams.*` via the standard protected tRPC context.
> - Office admin flows reuse the same procedures under `office.teams.*` (identical inputs/outputs, different auth policy).
> - External invite acceptance uses the public `teams.respondToInvitation` procedure.

## Authorization & Permissions

All requests must be authenticated unless otherwise noted. Access is enforced with organization / team-scoped permissions backed by `team_role_permissions`.

| Role Key  | Permissions Granted                                                                                          |
|-----------|---------------------------------------------------------------------------------------------------------------|
| `admin`   | `VIEW`, `MANAGE`, `MANAGE_MEMBERS`, `MANAGE_ROLES`, `MANAGE_INVITATIONS`, `VIEW_ANALYTICS`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `lead`    | `VIEW`, `MANAGE_MEMBERS`, `MANAGE_INVITATIONS`, `VIEW_ANALYTICS`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `recruiter` | `VIEW`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `reviewer`  | `VIEW`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `member`    | `VIEW`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |

Use `teams.members.roles` to fetch the concrete role list seeded per-organization (roles are duplicated per org to support overrides).

## Core Team Operations

### `teams.list`

Lists teams visible to the current user. Owners and org admins see all teams in their organizations; members see teams they belong to.

```ts
input?: {
  organizationId?: string;
  includeArchived?: boolean; // default false
}

type Team = {
  id: string;
  organizationId: string;
  name: string;
  slug: string | null;
  visibility: 'organization' | 'private';
  invitationPolicy: 'invite_only' | 'open' | 'request_to_join';
  description: string | null;
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
  allowSelfJoin: boolean;
  autoAssignJobs: boolean;
  defaultRoleKey: string;
  defaultRoleId: string | null;
  defaultRole: { id: string; key: string; name: string } | null;
  analyticsMetadata: Record<string, unknown>;
  analyticsRefreshIntervalMinutes: number;
  invitationExpirationDays: number;
  workloadStrategy: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings: Record<string, unknown>;
  analyticsLastRefreshedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};

output: { teams: Team[] }
```

**Permissions**: Requires membership or admin access to each returned team. Passing `organizationId` requires membership/admin for that org.

**Errors**: `UNAUTHORIZED` (missing session), `FORBIDDEN` (no org access).

---

### `teams.byId`

Fetches a single team with metadata and default role.

```ts
input: { teamId: string }
output: { team: Team }
```

**Permissions**: `TeamPermissions.VIEW` for the team (members, admins, org owners, super admins).

---

### `teams.create`

Creates a team within an organization and seeds default role information.

```ts
input: {
  organizationId: string;
  name: string;
  slug?: string;
  purpose?: string | null;
  visibility?: 'organization' | 'private';
  invitationPolicy?: 'invite_only' | 'open' | 'request_to_join';
  description?: unknown;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  defaultRoleId?: string;
  defaultRoleKey?: 'admin' | 'lead' | 'recruiter' | 'reviewer' | 'member';
  allowSelfJoin?: boolean;
  autoAssignJobs?: boolean;
  invitationExpirationDays?: number;
  workloadStrategy?: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings?: Record<string, unknown>;
  analyticsMetadata?: Record<string, unknown>;
  analyticsRefreshIntervalMinutes?: number;
}

output: { team: Team }
```

**Permissions**: Organization-level `TeamPermissions.MANAGE`.

**Notes**:

- Either `defaultRoleId` or `defaultRoleKey` must be provided.
- Automatically records an audit log event and seeds role permissions if missing.

---

### `teams.update`

Partial update for mutable team fields (name, visibility, policies, workload settings, etc.).

```ts
input: {
  teamId: string;
  name?: string;
  slug?: string | null;
  purpose?: string | null;
  visibility?: 'organization' | 'private';
  invitationPolicy?: 'invite_only' | 'open' | 'request_to_join';
  description?: unknown;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  defaultRoleId?: string;
  defaultRoleKey?: string;
  allowSelfJoin?: boolean;
  autoAssignJobs?: boolean;
  invitationExpirationDays?: number;
  workloadStrategy?: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings?: Record<string, unknown>;
  analyticsMetadata?: Record<string, unknown>;
  analyticsRefreshIntervalMinutes?: number;
}

output: { team: Team }
```

**Permissions**: `TeamPermissions.MANAGE`.

**Errors**: `BAD_REQUEST` if no fields provided, `NOT_FOUND` if team missing.

---

### `teams.archive`

Marks a team as archived and records the actor/reason.

```ts
input: {
  teamId: string;
  reason?: string;
}

output: { team: Team }
```

**Permissions**: `TeamPermissions.MANAGE`.

**Behavior**: Sets `isArchived`, `archivedAt`, `archivedBy`, and optionally embeds the reason inside `team.metadata.archivedReason`.

---

### `teams.respondToInvitation` (public)

Allows unauthenticated invitees to accept/decline with a token (typically used by the invite landing page).

```ts
input: {
  token: string; // raw invitation token from email
  responderId?: string; // optional override (defaults to invitation.invited_user_id)
  action: 'accept' | 'decline';
  metadata?: Record<string, unknown>;
}

output:
  | { status: 'accepted'; teamId: string }
  | { status: 'declined'; teamId: string }
```

**Notes**:

- Validates token hash, expiration, and team state.
- Accept flow adds or reinstates the member (uses default or invitation-specified role).
- Decline updates invitation status and audit logs the action.

## Member Management (`teams.members.*`)

| Procedure | Description | Required Permission |
|-----------|-------------|---------------------|
| `roles` | List available team roles for an org or specific team. | `MANAGE_ROLES` |
| `list` | Return active members with profile & role details. | `VIEW` |
| `add` | Add a member (active or pending) with role assignment. | `MANAGE_MEMBERS` |
| `update` | Update member role, status, metadata, or timestamps. | `MANAGE_MEMBERS` |
| `remove` | Hard-remove a member (sets status `removed`). | `MANAGE_MEMBERS` |
| `statusChange` | Convenience mutation to flip member status (active/removed/etc.). | `MANAGE_MEMBERS` |
| `transferOwnership` | Move organization/team ownership to another member. | `MANAGE` + organization-specific checks |
| `selfRemove` | Allows a member to remove themselves from a team. | Authenticated member |

### Common Payloads

- `TeamMember`: derived from `transformMember` (includes ids, role snapshot, status, joined/removed timestamps, metadata, and basic user profile info).
- Status values come from `TEAM_MEMBER_STATUSES` (`active`, `pending`, `inactive`, `removed`, etc.).

### Notable Behaviors

- `add` triggers notifications (`notifyTeamMemberAdded`) and audit logs.
- `remove` / `statusChange` handle audit events and optionally notify the affected member.
- `transferOwnership` ensures ownership invariants and updates organization-level admin assignments.
- `selfRemove` records an audit log and cleans up access gracefully.

## Invitation Management (`teams.invitations.*`)

| Procedure | Description | Required Permission |
|-----------|-------------|---------------------|
| `list` | List invitations for a team with status filtering. | `MANAGE_INVITATIONS` |
| `mine` | Invitations targeting the current user/email. | Authenticated user |
| `create` | Issue an invitation (email or user id). Generates token & sends notification. | `MANAGE_INVITATIONS` |
| `resend` | Regenerate token, extend expiration, trigger resend notification. | `MANAGE_INVITATIONS` |
| `cancel` | Revoke a pending invitation, annotate metadata. | `MANAGE_INVITATIONS` |
| `respond` | Authenticated acceptance/decline path (used inside the app). | Invitee auth (must match user/email) |

**Invitation Record** (`transformInvitation`):

```ts
type Invitation = {
  id: string;
  teamId: string;
  email: string | null;
  invitedUserId: string | null;
  roleId: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  expiresAt: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
  lastDeliveryStatus: string | null;
  lastDeliveryError: string | null;
  lastDeliveryChannels: string[] | null;
  metadata: Record<string, unknown>;
  role?: { id: string; key: string; name: string } | null;
  team?: { id: string; name: string | null; organizationId: string | null; organizationName?: string | null } | null;
};
```

### Token Handling

- Tokens are generated via `generateInvitationToken` and SHA-256 hashed before persistence.
- `create` returns the **raw token** once so the caller can embed it in emails.
- `resend` resets delivery metadata and records resend counts in invitation metadata.

## Analytics & Activity (`teams.analytics.*`)

| Procedure | Purpose | Key Inputs |
|-----------|---------|------------|
| `overview` | Time-series metrics for team performance (members, invitations, job activity, workload). | `{ teamId, startDate?, endDate?, limit? }` |
| `activity` | Activity feed backed by `team_activity_events`, cursor-based pagination. | `{ teamId, startDate?, endDate?, cursor?, pageSize }` |
| `workload` | Snapshot(s) of team member workload & capacity. | `{ teamId, asOf?, includeHistorical? }` |
| `postComment` | Adds a discussion comment event and notifies mentioned members. | `{ teamId, body, mentions: string[] }` |

**Permissions**:

- `overview`, `activity`, `workload`: require `TeamPermissions.MANAGE`.
- `postComment`: requires `TeamPermissions.PARTICIPATE_DISCUSSION`.

**Outputs**:

- `overview.metrics`: array per day with member counts, workload, application metrics.
- `activity.events`: event log referencing actor, subject, related member/job/app, and payload metadata.
- `workload.snapshots`: per-member capacity and assignment stats (latest or historical).
- `postComment.comment`: inserted discussion payload (id, actor, timestamps).

## Job Assignment Management (`teams.jobs.*`)

| Procedure | Description | Key Notes |
|-----------|-------------|-----------|
| `list` | Lists team assignments for a job (primary flag, metadata). | Requires job-level `TeamPermissions.MANAGE` via organization scope. |
| `assign` | Adds a team to a job with optional role key, primary flag, metadata. | Validates team/job org alignment. |
| `updateAssignment` | Updates assignment metadata, primary flag, role key. | Prevents duplicate primary assignment conflicts. |
| `unassign` | Removes a team from a job (records audit event). | Requires `MANAGE` permission. |

Assignments return objects shaped like:

```ts
type JobTeamAssignment = {
  id: string;
  jobId: string;
  teamId: string;
  organizationId: string;
  roleKey: string | null;
  isPrimary: boolean;
  assignedBy: string | null;
  assignedAt: string;
  metadata: Record<string, unknown>;
  team?: {
    id: string;
    name: string | null;
    slug: string | null;
    defaultRole?: { id: string; key: string; name: string } | null;
  } | null;
};
```

## Error Handling & Common Patterns

- All procedures throw `TRPCError` with standard codes (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`).
- Team/membership lookups rely on Supabase's row-level security; missing rows return `NOT_FOUND` when PGRST reports `PGRST116`.
- Metadata fields default to `{}` to keep downstream consumers simple.
- Date/time inputs accept ISO strings; helpers like `coerceDateInput` gracefully ignore invalid values.

## Related Documentation

- `docs/guides/team-management-user-guide.md`
- `docs/guides/team-management-developer-guide.md`
- `packages/supabase/docs/REQ-91-team-migration-plan.md`
- `packages/supabase/docs/REQ-91-team-migration-validation.md`
- `packages/supabase/functions/trpc/__tests__/integration/teams.test.ts`

Keep this reference in sync with the tRPC router when procedures evolve (permissions, analytics payloads, assignment logic, etc.).
---
title: Teams API Reference
description: End-to-end reference for the REQ-91 team management tRPC surface, including core team operations, member management, invitations, analytics, and job assignments.
date: 2025-11-12
---

## Overview

The `teams` tRPC router powers all team management capabilities introduced in REQ-91. It covers:

- Creating and managing teams within an organization
- Managing membership, roles, invitations, and workload settings
- Tracking analytics, activity, and workload snapshots
- Assigning teams to jobs and keeping audit trails up to date

All procedures return JSON-friendly payloads. Types shown below mirror the structures produced by the helper transformers in `packages/supabase/functions/trpc/routers/teams.router.ts`.

> **Base Paths**
>
> - Authenticated clients call `teams.*` via the standard protected tRPC context.
> - Office admin flows reuse the same procedures under `office.teams.*` (identical inputs/outputs, different auth policy).
> - External invite acceptance uses the public `teams.respondToInvitation` procedure.

## Authorization & Permissions

All requests must be authenticated unless otherwise noted. Access is enforced with organization / team-scoped permissions backed by `team_role_permissions`.

| Role Key  | Permissions Granted                                                                                          |
|-----------|---------------------------------------------------------------------------------------------------------------|
| `admin`   | `VIEW`, `MANAGE`, `MANAGE_MEMBERS`, `MANAGE_ROLES`, `MANAGE_INVITATIONS`, `VIEW_ANALYTICS`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `lead`    | `VIEW`, `MANAGE_MEMBERS`, `MANAGE_INVITATIONS`, `VIEW_ANALYTICS`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `recruiter` | `VIEW`, `MANAGE_APPLICATIONS`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `reviewer`  | `VIEW`, `REVIEW_APPLICATIONS`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |
| `member`    | `VIEW`, `VIEW_APPLICATIONS`, `PARTICIPATE_DISCUSSION` |

Use `teams.members.roles` to fetch the concrete role list seeded per-organization (roles are duplicated per org to support overrides).

## Core Team Operations

### `teams.list`

Lists teams visible to the current user. Owners and org admins see all teams in their organizations; members see teams they belong to.

```ts
input?: {
  organizationId?: string;
  includeArchived?: boolean; // default false
}

type Team = {
  id: string;
  organizationId: string;
  name: string;
  slug: string | null;
  visibility: 'organization' | 'private';
  invitationPolicy: 'invite_only' | 'open' | 'request_to_join';
  description: string | null;
  metadata: Record<string, unknown>;
  settings: Record<string, unknown>;
  allowSelfJoin: boolean;
  autoAssignJobs: boolean;
  defaultRoleKey: string;
  defaultRoleId: string | null;
  defaultRole: { id: string; key: string; name: string } | null;
  analyticsMetadata: Record<string, unknown>;
  analyticsRefreshIntervalMinutes: number;
  invitationExpirationDays: number;
  workloadStrategy: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings: Record<string, unknown>;
  analyticsLastRefreshedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};

output: { teams: Team[] }
```

**Permissions**: Requires membership or admin access to each returned team. Passing `organizationId` requires membership/admin for that org.

**Errors**: `UNAUTHORIZED` (missing session), `FORBIDDEN` (no org access).

---

### `teams.byId`

Fetches a single team with metadata and default role.

```ts
input: { teamId: string }
output: { team: Team }
```

**Permissions**: `TeamPermissions.VIEW` for the team (members, admins, org owners, super admins).

---

### `teams.create`

Creates a team within an organization and seeds default role information.

```ts
input: {
  organizationId: string;
  name: string;
  slug?: string;
  purpose?: string | null;
  visibility?: 'organization' | 'private';
  invitationPolicy?: 'invite_only' | 'open' | 'request_to_join';
  description?: unknown;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  defaultRoleId?: string;
  defaultRoleKey?: 'admin' | 'lead' | 'recruiter' | 'reviewer' | 'member';
  allowSelfJoin?: boolean;
  autoAssignJobs?: boolean;
  invitationExpirationDays?: number;
  workloadStrategy?: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings?: Record<string, unknown>;
  analyticsMetadata?: Record<string, unknown>;
  analyticsRefreshIntervalMinutes?: number;
}

output: { team: Team }
```

**Permissions**: Organization-level `TeamPermissions.MANAGE`.

**Notes**:

- Either `defaultRoleId` or `defaultRoleKey` must be provided.
- Automatically records an audit log event and seeds role permissions if missing.

---

### `teams.update`

Partial update for mutable team fields (name, visibility, policies, workload settings, etc.).

```ts
input: {
  teamId: string;
  name?: string;
  slug?: string | null;
  purpose?: string | null;
  visibility?: 'organization' | 'private';
  invitationPolicy?: 'invite_only' | 'open' | 'request_to_join';
  description?: unknown;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  defaultRoleId?: string;
  defaultRoleKey?: string;
  allowSelfJoin?: boolean;
  autoAssignJobs?: boolean;
  invitationExpirationDays?: number;
  workloadStrategy?: 'manual' | 'round_robin' | 'load_balance';
  workloadSettings?: Record<string, unknown>;
  analyticsMetadata?: Record<string, unknown>;
  analyticsRefreshIntervalMinutes?: number;
}

output: { team: Team }
```

**Permissions**: `TeamPermissions.MANAGE`.

**Errors**: `BAD_REQUEST` if no fields provided, `NOT_FOUND` if team missing.

---

### `teams.archive`

Marks a team as archived and records the actor/reason.

```ts
input: {
  teamId: string;
  reason?: string;
}

output: { team: Team }
```

**Permissions**: `TeamPermissions.MANAGE`.

**Behavior**: Sets `isArchived`, `archivedAt`, `archivedBy`, and optionally embeds the reason inside `team.metadata.archivedReason`.

---

### `teams.respondToInvitation` (public)

Allows unauthenticated invitees to accept/decline with a token (typically used by the invite landing page).

```ts
input: {
  token: string; // raw invitation token from email
  responderId?: string; // optional override (defaults to invitation.invited_user_id)
  action: 'accept' | 'decline';
  metadata?: Record<string, unknown>;
}

output:
  | { status: 'accepted'; teamId: string }
  | { status: 'declined'; teamId: string }
```

**Notes**:

- Validates token hash, expiration, and team state.
- Accept flow adds or reinstates the member (uses default or invitation-specified role).
- Decline updates invitation status and audit logs the action.

## Member Management (`teams.members.*`)

| Procedure | Description | Required Permission |
|-----------|-------------|---------------------|
| `roles` | List available team roles for an org or specific team. | `MANAGE_ROLES` |
| `list` | Return active members with profile & role details. | `VIEW` |
| `add` | Add a member (active or pending) with role assignment. | `MANAGE_MEMBERS` |
| `update` | Update member role, status, metadata, or timestamps. | `MANAGE_MEMBERS` |
| `remove` | Hard-remove a member (sets status `removed`). | `MANAGE_MEMBERS` |
| `statusChange` | Convenience mutation to flip member status (active/removed/etc.). | `MANAGE_MEMBERS` |
| `transferOwnership` | Move organization/team ownership to another member. | `MANAGE` + organization-specific checks |
| `changeStatus` | (Alias exported as `statusChange`) Manage status transitions. | `MANAGE_MEMBERS` |
| `selfRemove` | Allows a member to remove themselves from a team. | Authenticated member |

### Common Payloads

- `TeamMember`: derived from `transformMember` (includes ids, role snapshot, status, joined/removed timestamps, metadata, and basic user profile info).
- Status values come from `TEAM_MEMBER_STATUSES` (`active`, `pending`, `inactive`, `removed`, etc.).

### Notable Behaviors

- `add` triggers notifications (`notifyTeamMemberAdded`) and audit logs.
- `remove` / `statusChange` handle audit events and optionally notify the affected member.
- `transferOwnership` ensures ownership invariants and updates organization-level admin assignments (see router implementation for guard rails).
- `selfRemove` requires a valid session; it records an audit log and handles notifications gracefully.

## Invitation Management (`teams.invitations.*`)

| Procedure | Description | Required Permission |
|-----------|-------------|---------------------|
| `list` | List invitations for a team with status filtering. | `MANAGE_INVITATIONS` |
| `mine` | Invitations targeting the current user/email. | Authenticated user |
| `create` | Issue an invitation (email or user id). Generates token & sends notification. | `MANAGE_INVITATIONS` |
| `resend` | Regenerate token, extend expiration, trigger resend notification. | `MANAGE_INVITATIONS` |
| `cancel` | Revoke a pending invitation, annotate metadata. | `MANAGE_INVITATIONS` |
| `respond` | Authenticated acceptance/decline path (used inside the app). | Invitee auth (must match user/email) |

**Invitation Record** (`transformInvitation`):

```ts
type Invitation = {
  id: string;
  teamId: string;
  email: string | null;
  invitedUserId: string | null;
  roleId: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  expiresAt: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
  lastDeliveryStatus: string | null;
  lastDeliveryError: string | null;
  lastDeliveryChannels: string[] | null;
  metadata: Record<string, unknown>;
  role?: { id: string; key: string; name: string } | null;
  team?: { id: string; name: string | null; organizationId: string | null; organizationName?: string | null } | null;
};
```

### Token Handling

- Tokens are generated via `generateInvitationToken` and SHA-256 hashed before persistence.
- `create` returns the **raw token** once so the caller can embed it in emails.
- `resend` resets delivery metadata and records resend counts in invitation metadata.

## Analytics & Activity (`teams.analytics.*`)

| Procedure | Purpose | Key Inputs |
|-----------|---------|------------|
| `overview` | Time-series metrics for team performance (members, applications, workload). | `{ teamId, startDate?, endDate?, limit? }` |
| `activity` | Activity feed backed by `team_activity_events`, cursor-based pagination. | `{ teamId, startDate?, endDate?, cursor?, pageSize }` |
| `workload` | Snapshot(s) of team member workload & capacity. | `{ teamId, asOf?, includeHistorical? }` |
| `postComment` | Adds a discussion comment event and notifies mentioned members. | `{ teamId, body, mentions: string[] }` |

**Permissions**:

- `overview`, `activity`, `workload`: require `TeamPermissions.MANAGE` (admins/leads).
- `postComment`: requires `TeamPermissions.PARTICIPATE_DISCUSSION` (typically `member` or above).

**Outputs**:

- `overview.metrics`: array per day with member counts, workload, application metrics.
- `activity.events`: event log referencing actor, subject, related member/job/app, and payload metadata.
- `workload.snapshots`: per-member capacity and assignment stats (latest or historical).
- `postComment.comment`: inserted discussion payload (id, actor, timestamps).

## Job Assignment Management (`teams.jobs.*`)

| Procedure | Description | Key Notes |
|-----------|-------------|-----------|
| `list` | Lists team assignments for a job (primary flag, metadata). | Requires job-level `TeamPermissions.MANAGE` via organization scope. |
| `assign` | Adds a team to a job with optional role key, primary flag, metadata. | Validates team/job org alignment. |
| `updateAssignment` | Updates assignment metadata, primary flag, role key. | Prevents duplicate primary assignment conflicts. |
| `unassign` | Removes a team from a job (records audit event). | Requires `MANAGE` permission. |

Assignments return objects shaped like:

```ts
type JobTeamAssignment = {
  id: string;
  jobId: string;
  teamId: string;
  organizationId: string;
  roleKey: string | null;
  isPrimary: boolean;
  assignedBy: string | null;
  assignedAt: string;
  metadata: Record<string, unknown>;
  team?: {
    id: string;
    name: string | null;
    slug: string | null;
    defaultRole?: { id: string; key: string; name: string } | null;
  } | null;
};
```

## Error Handling & Common Patterns

- All procedures throw `TRPCError` with standard codes (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`).
- Team/membership lookups rely on Supabase's row-level security; missing rows return `NOT_FOUND` when PGRST reports `PGRST116`.
- Metadata fields default to `{}` to keep downstream consumers simple (no `null` checks required).
- Date/time inputs accept ISO strings; use helpers like `coerceDateInput` to gracefully ignore invalid values.

## Related Documentation

- `docs/guides/team-management-user-guide.md` — End-user walkthroughs.
- `docs/guides/team-management-developer-guide.md` — Architecture, extension points, and operational notes.
- `packages/supabase/scripts/migrate-teams-data.ts` — Backfill script ensuring role alignment.
- `packages/supabase/functions/trpc/__tests__/integration/teams.test.ts` — Integration tests covering core contract flows.

Keep this reference in sync with the tRPC router when procedures evolve (particularly when expanding permissions, analytics payloads, or job assignment logic).

