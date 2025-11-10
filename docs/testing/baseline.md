<!-- Baseline audit for REQ-172 (generated 2025-11-09) -->

# Testing Baseline Snapshot

This document captures the initial audit for BrainGrid `REQ-172` before introducing the new testing infrastructure.

## Repository Test Surface

- **Vitest-aware files (18 total)**
  - `apps/expo/app/tests/import-review.test.tsx`
  - `packages/core/features/discover/utils/__tests__/normalizeOrganizationSlug.test.ts`
  - `packages/core/features/profile/__tests__/profile-employment-left.test.tsx`
  - `packages/core/utils/auth/__tests__/useProtectedRoute.test.tsx`
  - `packages/ui/src/components/image-picker/__tests__/helpers.test.ts`
  - `packages/ui/src/components/image-picker/utils/__tests__/imageProcessing.test.ts`
  - `packages/supabase/functions/_shared/schemas/__tests__/uploadAvatarInputSchema.test.ts`
  - `packages/supabase/functions/trpc/__tests__/auth.test.ts`
  - `packages/supabase/functions/trpc/__tests__/integration/profile.test.ts`
  - `packages/supabase/functions/trpc/__tests__/integration/user-profile.test.ts`
  - `packages/supabase/functions/trpc/__tests__/map-functions.test.ts`
  - `packages/supabase/functions/trpc/__tests__/notifications-preferences.test.ts`
  - `packages/supabase/functions/trpc/__tests__/office-profiles-utils.test.ts`
  - `packages/supabase/functions/trpc/__tests__/profile-completion-utils.test.ts`
  - `packages/supabase/functions/trpc/__tests__/profile-experience.test.ts`
  - `packages/supabase/functions/trpc/__tests__/profile-import-heuristics.test.ts`
  - `packages/supabase/functions/trpc/__tests__/req-92-engagement.test.ts`
  - `packages/supabase/functions/trpc/__tests__/universities.test.ts`

- **Deno-only scripts**
  - `packages/supabase/functions/trpc/__tests__/run-tests.sh`
  - Supporting files: `setup.ts`, `test-context.ts`, `test-endpoints.sh`

## Vitest Execution (2025-11-09)

Command: `pnpm vitest run`

- Suites: 18 discovered, **4 passed**, **14 failed**
- Passing suites:
  - `packages/core/features/discover/utils/__tests__/normalizeOrganizationSlug.test.ts`
  - `packages/ui/src/components/image-picker/__tests__/helpers.test.ts`
  - `packages/ui/src/components/image-picker/utils/__tests__/imageProcessing.test.ts`
  - `packages/supabase/functions/_shared/schemas/__tests__/uploadAvatarInputSchema.test.ts`
- Failure categories:
  - **No tests defined**: placeholder files (`import-review.test.tsx`, several Supabase unit specs)
  - **Missing path alias resolution**: `@app/core/utils/api` and similar imports fail in Vitest
  - **Syntax/runtime incompatibilities**: Deno-first suites rely on `jsr:` imports and HTTPS Fetch (unsupported by Vitest loader)
  - **JSX transform mismatch**: `useProtectedRoute` suite blocked by ESM transform error

Duration: ~1.2s (transform dominated by unresolved imports)

## Gaps & Risks

- Supabase Deno tests are not runnable under the current Vitest configuration; they depend on Deno tooling via `run-tests.sh`.
- No shared test setup (`test/setup.ts`) exists, so React Native Testing Library and Jest-DOM globals are missing.
- Package-level `package.json` files do not expose `test` scripts, preventing targeted execution (`pnpm --filter @app/core test`).
- Baseline coverage cannot be calculated: Vitest errors before running majority of suites; Deno coverage is not aggregated.
- GitHub Actions currently lacks a workflow to execute any of the suites.

## Clarifications Needed

1. Confirm if Deno-based tRPC suites should remain standalone or be migrated/bridged to Vitest.
2. Validate target coverage thresholds per surface (auth, profile, office, discover, UI, schemas) before enforcing CI gates.
3. Align on acceptable CI runtime and whether Supabase must run during every PR test pass.

> _Next audit update should occur after Phase 1 configuration work is complete._

