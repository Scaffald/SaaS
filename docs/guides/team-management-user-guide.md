---
title: Team Management User Guide
description: How organization owners, admins, and team members use the new REQ-91 team management experience inside Office.
date: 2025-11-12
---

## Audience

This guide targets:

- **Organization owners & admins** managing hiring teams.
- **Team leads** coordinating interviewers, recruiters, and reviewers.
- **Members** collaborating on applications, analytics, and workload sharing.

## Getting Started

### Accessing Teams

1. Open the Office app (web or mobile).
2. Navigate to **Dashboard → Teams**.
3. Use the left navigation to switch between organizations (if you belong to multiple).

> Owners and admins see every team in their organization. Members only see teams they belong to, plus invitations awaiting action.

### Creating a Team

1. Click **Create Team** on the Teams list view.
2. Provide a **Name** and optional **Slug** (used for shareable URLs).
3. Select a **Purpose** and **Visibility**:
   - `Organization`: visible to all org members, but actions still require permissions.
   - `Private`: only invited members and admins can view.
4. (Optional) Configure:
   - **Default Role** (e.g., `member`, `reviewer`, `recruiter`).
   - **Invitation Policy** (`invite_only`, `open`, or `request_to_join`).
   - **Workload strategy** (`manual`, `round_robin`, `load_balance`).
   - **Team metadata** (labels, hiring focus areas, etc.).
5. Click **Create**. The team appears in the list and you’re redirected to the detail view.

## Managing Members

### Adding Members

1. From a team detail page, open the **Members** tab.
2. Choose **Add Member**.
3. Select an existing user or enter an email address.
4. Assign a **Role**:
   - `Admin`: full management access.
   - `Lead`: manage members/invitations, view analytics.
   - `Recruiter`: manage and review applications.
   - `Reviewer`: review applications and comment.
   - `Member`: collaborate and view shared resources.
5. (Optional) Set initial status (`active`, `pending`) and add onboarding notes.
6. Confirm to send an invitation or direct add (based on role and status).

### Invitation Management

- **Create Invitation**: Send an email- or user-based invite. Invitees receive a tokenized link and in-app notification.
- **Resend Invitation**: Regenerate the token, extend expiration, and resend notifications. Resend history is tracked.
- **Cancel Invitation**: Revoke pending invites; optionally include a reason for audit logs.
- **Self-Service**: Invitees can accept/decline via the invitation center (Dashboard → Teams → Invitations) or email link.

### Role & Status Updates

- Use the member action menu to **Change Role**, **Adjust Status** (active, pending, inactive, removed), or **Transfer Ownership**.
- Removed members lose access immediately and receive a notification.
- Members can also **Remove themselves** from a team if they no longer participate.

## Team Configuration

- **Settings tab** controls:
  - Default role and workload strategy.
  - Allowing self-join or automatic job assignment.
  - Invitation expiration days.
  - Custom metadata used for automations or analytics.
- **Archive Team** when a project finishes:
  - Moves the team to read-only state.
  - Preserves analytics and history but hides it from active views.
  - Requires an archive reason for future audits.

## Analytics & Workload

### Overview Dashboard

- Shows daily metrics: member counts, invitations, job activity, workload pressure.
- Filter by date range (default last 30 days).
- Refresh schedule defaults to every 60 minutes; admins can adjust in settings.

### Activity Feed

- Tracks key events: invitations, member changes, workload updates, comments.
- Use filters to narrow by timeframe.
- Mention teammates in comments with `@username` to notify them.

### Workload Snapshot

- Visualizes per-member assignment load:
  - Pending, active, overdue tasks.
  - Completed reviews.
  - Weekly capacity and availability scores.
- Use the historical toggle to review demand trends when balancing assignments.

## Job Collaboration

- Attach teams to open jobs from the team **Jobs** tab or from the job detail view.
- Mark a team as **Primary** to route new applications to it.
- Add multiple teams for cross-functional collaboration (e.g., engineering + recruiting).
- Removing an assignment does not delete historical activity; it simply stops new routing.

## Notifications

- **Email / In-App / Push** notifications fire for:
  - New invitations and resends.
  - Member added/removed events.
  - Mentions in discussions.
- Ensure you have the correct channels enabled in **Account Settings → Notifications**.

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| I can’t see the Teams menu | Confirm you’re signed in with an organization that has teams. Owners must grant access via Organization settings. |
| “You do not have permission” error | Request the appropriate role (`admin`, `lead`, `recruiter`, etc.) or ask an admin to perform the action. |
| Invitation link expired | Ask the team admin to resend the invitation. Resends extend the expiration automatically. |
| Workload data missing | Ensure analytics ingest ran recently. Admins can trigger a manual refresh from the Settings tab. |
| Job assignments not appearing | Verify the job belongs to the same organization and that the team isn’t archived. |

## Related Resources

- [Teams API Reference](../api/teams.md)
- [Team Management Developer Guide](./team-management-developer-guide.md)
- [Team Migration Plan](../../packages/supabase/docs/REQ-91-team-migration-plan.md)
- [Integration Tests](../../packages/supabase/functions/trpc/__tests__/integration/teams.test.ts)

Keep this guide handy for onboarding new admins and team leads. For deeper customization or integration work, refer to the developer guide and API reference.
---
title: Team Management User Guide
description: How organization owners, admins, and team members use the new REQ-91 team management experience inside Office.
date: 2025-11-12
---

## Audience

This guide targets:

- **Organization owners & admins** managing hiring teams.
- **Team leads** coordinating interviewers, recruiters, and reviewers.
- **Members** collaborating on applications, analytics, and workload sharing.

## Getting Started

### Accessing Teams

1. Open the Office app (web or mobile).
2. Navigate to **Dashboard → Teams**.
3. Use the left navigation to switch between organizations (if you belong to multiple).

> Owners and admins see every team in their organization. Members only see teams they belong to, plus invitations awaiting action.

### Creating a Team

1. Click **Create Team** on the Teams list view.
2. Provide a **Name** and optional **Slug** (used for shareable URLs).
3. Select a **Purpose** and **Visibility**:
   - `Organization`: visible to all org members, but actions still require permissions.
   - `Private`: only invited members and admins can view.
4. (Optional) Configure:
   - **Default Role** (e.g., `member`, `reviewer`, `recruiter`).
   - **Invitation Policy** (`invite_only`, `open`, or `request_to_join`).
   - **Workload strategy** (manual, round robin, load balance).
   - **Team metadata** (labels, hiring focus areas, etc.).
5. Click **Create**. The team appears in the list and you’re redirected to the detail view.

## Managing Members

### Adding Members

1. From a team detail page, open the **Members** tab.
2. Choose **Add Member**.
3. Select an existing user or enter an email address.
4. Assign a **Role**:
   - `Admin`: full management access.
   - `Lead`: manage members/invitations, view analytics.
   - `Recruiter`: manage and review applications.
   - `Reviewer`: review applications and comment.
   - `Member`: collaborate and view shared resources.
5. (Optional) Set initial status (`active`, `pending`) and add onboarding notes.
6. Confirm to send an invitation or direct add (based on role and status).

### Invitation Management

- **Create Invitation**: Send an email- or user-based invite. Invitees receive a tokenized link and in-app notification.
- **Resend Invitation**: Regenerate the token, extend expiration, and resend notifications. Resend history is tracked.
- **Cancel Invitation**: Revoke pending invites; optionally include a reason for audit logs.
- **Self-Service**: Invitees can accept/decline via the invitation center (Dashboard → Teams → Invitations) or email link.

### Role & Status Updates

- Use the member action menu to **Change Role**, **Adjust Status** (active, pending, inactive, removed), or **Transfer Ownership**.
- Removed members lose access immediately and receive a notification.
- Members can also **Remove themselves** from a team if they no longer participate.

## Team Configuration

- **Settings tab** controls:
  - Default role and workload strategy.
  - Allowing self-join or automatic job assignment.
  - Invitation expiration days.
  - Custom metadata used for automations or analytics.
- **Archive Team** when a project finishes:
  - Moves the team to read-only state.
  - Preserves analytics and history but hides it from active views.
  - Requires an archive reason for future audits.

## Analytics & Workload

### Overview Dashboard

- Shows daily metrics: member counts, invitations, job activity, workload pressure.
- Filter by date range (default last 30 days).
- Refresh schedule defaults to every 60 minutes; admins can adjust in settings.

### Activity Feed

- Tracks key events: invitations, member changes, workload updates, comments.
- Use filters to narrow by timeframe.
- Mention teammates in comments with `@username` to notify them.

### Workload Snapshot

- Visualizes per-member assignment load:
  - Pending, active, overdue tasks.
  - Completed reviews.
  - Weekly capacity and availability scores.
- Use the historical toggle to review demand trends when balancing assignments.

## Job Collaboration

- Attach teams to open jobs from the team **Jobs** tab or from the job detail view.
- Mark a team as **Primary** to route new applications to it.
- Add multiple teams for cross-functional collaboration (e.g., engineering + recruiting).
- Removing an assignment does not delete historical activity; it simply stops new routing.

## Notifications

- **Email / In-App / Push** notifications fire for:
  - New invitations and resends.
  - Member added/removed events.
  - Mentions in discussions.
- Ensure you have the correct channels enabled in **Account Settings → Notifications**.

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| I can’t see the Teams menu | Confirm you’re signed in with an organization that has teams. Owners must grant access via Organization settings. |
| “You do not have permission” error | Request the appropriate role (`admin`, `lead`, `recruiter`, etc.) or ask an admin to perform the action. |
| Invitation link expired | Ask the team admin to resend the invitation. Resends extend the expiration automatically. |
| Workload data missing | Ensure analytics ingest ran recently. Admins can trigger a manual refresh from the Settings tab. |
| Job assignments not appearing | Verify the job belongs to the same organization and that the team isn’t archived. |

## Related Resources

- [Teams API Reference](../api/teams.md)
- [Team Management Developer Guide](./team-management-developer-guide.md)
- [Team Migration Plan](../../packages/supabase/docs/REQ-91-team-migration-plan.md)
- [Integration Tests](../../packages/supabase/functions/trpc/__tests__/integration/teams.test.ts)

Keep this guide handy for onboarding new admins and team leads. For deeper customization or integration work, refer to the developer guide and API reference.

