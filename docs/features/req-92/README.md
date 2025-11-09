# REQ-92 Prep Work Summary

This document captures the foundational changes and the remaining follow-up items a new agent should tackle while implementing **REQ-92**.

## What Shipped

- Added `AddOrganizationWidget` to the right column of `DiscoverEmployersRight`, allowing users to check for existing employers and route to the creation flow only when the organization appears new.
- Enabled search filtering on the public `employers.getEmployers` tRPC endpoint so the widget can identify duplicates by name, slug, or website.
- Refactored `/dashboard/discover/employers/[id]` to render inside `DashboardLayout` using a new `DiscoverEmployerDetailScreen`, splitting the page into:
  - **Left column:** Primary organization details displayed via `DiscoverEmployerDetailLeft`.
  - **Right column:** Engagement CTA widget (`DiscoverEmployerDetailRight`) that previews follow and “I Work Here” actions.
- Documented and fixed a Biome lint warning in `profile-education-left.tsx` that surfaced while running `pnpm check`.
- Added a moderated `organizations.createOrganizationRequest` flow, dashboard widget integration, and review form for non-office users.
- Delivered live follow/unfollow endpoints with optimistic React Query state in `DiscoverEmployerDetailRight`.
- Wired “I Work Here” to create lightweight employment claims backed by `core.user_experience`.

## Follow-Up Work for REQ-92

1. ✅ **Expose organization creation for dashboard context**
   - Dashboard users can now submit requests via `organizations.createOrganizationRequest`, including a dedicated form pre-filled from discovery.

2. ✅ **Implement follow/unfollow APIs and UI state**
   - `core.follows` is surfaced through new tRPC procedures with optimistic UI updates in `DiscoverEmployerDetailRight`.

3. ✅ **Connect “I Work Here” to employment data**
   - Employment claims create lightweight `core.user_experience` rows and update the CTA to reflect real-time status.

4. **Notifications and onboarding CTA polish**
   - Plan how follows trigger notifications or digest emails (Supabase functions/cron).
   - Expand onboarding messaging to highlight new follow + employment flows across dashboard entry points.

5. **Testing & QA**
   - Added `req-92-engagement` tRPC integration coverage to validate organization requests, follows, and employment claims end to end.
   - Next: expand widget duplicate detection tests and responsive layout checks across web + native surfaces.

## Getting Started

1. Review the updated files:
   - `packages/core/features/discover/components/AddOrganizationWidget.tsx`
   - `packages/core/features/discover/discover-employer-detail-{left,right,screen}.tsx`
   - `apps/expo/app/dashboard/discover/employers/[id]/index.tsx`
   - `packages/supabase/functions/trpc/routers/employers.router.ts`
2. Confirm `pnpm check` passes before making further changes; the lint fixes above are part of the current baseline.
3. Coordinate with backend on new mutations (follow/claim) before wiring the UI, or scaffold mocked services for local development.

