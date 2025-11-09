# REQ-92 Prep Work Summary

This document captures the foundational changes and the remaining follow-up items a new agent should tackle while implementing **REQ-92**.

## What Shipped

- Added `AddOrganizationWidget` to the right column of `DiscoverEmployersRight`, allowing users to check for existing employers and route to the creation flow only when the organization appears new.
- Enabled search filtering on the public `employers.getEmployers` tRPC endpoint so the widget can identify duplicates by name, slug, or website.
- Refactored `/dashboard/discover/employers/[id]` to render inside `DashboardLayout` using a new `DiscoverEmployerDetailScreen`, splitting the page into:
  - **Left column:** Primary organization details displayed via `DiscoverEmployerDetailLeft`.
  - **Right column:** Engagement CTA widget (`DiscoverEmployerDetailRight`) that previews follow and “I Work Here” actions.
- Documented and fixed a Biome lint warning in `profile-education-left.tsx` that surfaced while running `pnpm check`.

## Follow-Up Work for REQ-92

1. **Expose organization creation for dashboard context**
   - The `office.createOrganization` mutation still requires office-level permissions.
   - Design a moderated or request-based flow so standard dashboard users can submit new orgs.
   - Pre-fill the creation form (name + slug) based on the widget’s validated input.

2. **Implement follow/unfollow APIs and UI state**
   - Build tRPC procedures around the `core.follows` table for user→organization relationships.
   - Store follow state in React Query and reflect current status in `DiscoverEmployerDetailRight`.
   - Hook the button up to real mutations + optimistic updates once APIs land.

3. **Connect “I Work Here” to employment data**
   - Decide on the source of truth (likely `core.user_experience` or a new join table).
   - Provide mutations to request verification or directly link the worker to the organization.
   - Update the widget copy and disable states once the workflow is functional.

4. **Notifications and onboarding CTA polish**
   - Plan how follows trigger notifications or digest emails (Supabase functions/cron).
   - Update the CTA messaging to reflect live functionality (remove “coming soon” toasts).

5. **Testing & QA**
   - Add frontend tests for the widget duplicate detection flows.
   - Ensure new APIs have integration coverage (supabase edge tests or e2e).
   - Verify responsive layout on web/mobile for the new two-column experience.

## Getting Started

1. Review the updated files:
   - `packages/core/features/discover/components/AddOrganizationWidget.tsx`
   - `packages/core/features/discover/discover-employer-detail-{left,right,screen}.tsx`
   - `apps/expo/app/dashboard/discover/employers/[id]/index.tsx`
   - `packages/supabase/functions/trpc/routers/employers.router.ts`
2. Confirm `pnpm check` passes before making further changes; the lint fixes above are part of the current baseline.
3. Coordinate with backend on new mutations (follow/claim) before wiring the UI, or scaffold mocked services for local development.

