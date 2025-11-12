---
title: Team Invitation Notifications
description: Email, in-app, and push notifications for team invitations including resend tracking and acceptance flow.
date: 2025-11-12
---

## Overview

REQ-91 Task 8 introduces a complete notification flow for team invitations:

- **Supabase Edge Function `send-team-invitation`** handles email delivery, notification routing, delivery logging, and push queuing.
- **Schema enhancements** on `core.team_invitations` record delivery timestamps, associated notification IDs, last delivery status, error details, and channel history.
- **Router updates** automatically trigger notifications when invites are created or resent, and when members are added or removed directly.
- **Dashboard experience** now includes dedicated teams pages, public invitation acceptance handling, and updated widgets.
- **Office management UI** surfaces last delivery status, channels, and errors to help administrators troubleshoot resends.

## Key Components

### Backend

- `packages/supabase/functions/send-team-invitation/index.ts`
- `packages/supabase/migrations/045_req_91_team_invitation_notifications.sql`
- `packages/supabase/functions/trpc/routers/teams.router.ts`

### Frontend (Expo App)

- Public acceptance route: `apps/expo/app/teams/invitations/accept.tsx`
- Teams dashboard: `apps/expo/app/dashboard/teams/index.tsx`
- Team detail view: `apps/expo/app/dashboard/teams/[id]/index.tsx`
- Office invitation list enhancements: `packages/core/features/office/teams/components/TeamInvitationsList.tsx`
- Dashboard widget improvements: `packages/core/features/dashboard/components/TeamInvitationsWidget.tsx`

## Manual Test Plan

1. **Send invitation (existing user)**
   - From Office → Teams → Edit → Invitations, send an invite to an existing organization member.
   - Confirm:
     - Edge function logs delivery (`core.team_invitations.sent_at`, `last_delivery_status` = `queued`).
     - In-app notification appears for invitee (Dashboard widget).
     - API response includes acceptance token (for verification only).

2. **Resend invitation**
   - Use “Resend” in Office invitation list.
   - Confirm:
     - `sent_at` updates.
     - `metadata.lastDelivery.status` updates to `queued`.
     - UI shows new delivery timestamp and channel.

3. **Email-only invitation**
   - Invite via email (non-existing user).
   - Confirm:
     - SendGrid receives request (check Mailpit in local env or SendGrid sandbox logs).
     - Delivery metadata records `channels = ['email']`.
     - Resend extends expiration and regenerates token.

4. **Invitation acceptance (authenticated user)**
   - Login as invitee, open `/teams/invitations/accept?token=...`.
   - Choose “Accept”.
   - Confirm:
     - Invitation status becomes `accepted`.
     - User redirected to `/dashboard/teams/:teamId`.
     - Team detail page shows membership.

5. **Invitation acceptance (logged out)**
   - Open acceptance URL in private window.
   - Verify sign-in prompt and redirect back to acceptance after login.

6. **Decline invitation**
   - From acceptance page, decline.
   - Confirm status `declined` and widget list updates.

7. **Direct member add/remove notifications**
   - From Office team edit page, add an existing user directly.
   - Confirm notification event delivered (Dashboard widget).
   - Remove the member, ensure removal notification appears.

8. **Office invitation status UI**
   - Verify new delivery status block shows:
     - Status text.
     - Last attempt timestamp.
     - Channel list.
     - Error message (simulate by temporarily removing `SENDGRID_API_KEY` and resending).

## Automated Tests

- Vitest coverage: `packages/core/features/dashboard/components/__tests__/TeamInvitationList.test.tsx`.
  - Ensures new “Sent” status renders.
  - Verifies accept/decline callbacks remain intact.

## Rollout Checklist

- [ ] Run `pnpm supa:generate` after applying migrations.
- [ ] Deploy Supabase Edge Functions (`send-team-invitation`).
- [ ] Ensure environment variables set: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SUPABASE_FUNCTIONS_URL`.
- [ ] Communicate new dashboard routes `/dashboard/teams` & `/dashboard/teams/:id` to product/QA.
- [ ] Update operational runbooks for invitation troubleshooting (refer to new delivery status fields).

