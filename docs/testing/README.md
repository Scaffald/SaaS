# Testing Documentation

This directory tracks the evolving Vitest rollout for REQ-172. It now captures the latest coverage snapshot, how to reproduce the new suites, and the open items that still block `pnpm check`/`pnpm test` from succeeding end-to-end.

---

## Coverage Snapshot — 2025‑11‑11

| Scope | Notes | Command |
| --- | --- | --- |
| **Overall** | `vitest run --coverage` yields **80.6 % statements / 71.4 % branches** across the monorepo. | `pnpm vitest run --coverage` |
| **Discovery features** | New suites for nearest-results, scroll helpers, user-location (web + native) and employer filters drive hooks/components well past the 45 % requirement. | `pnpm vitest run "packages/core/features/discover/**/__tests__/*.test.*"` |
| **Office features** | `useApplicationStatusChange` hook is covered alongside existing forms; refer to task notes for pending Expo type fixes. | `pnpm vitest run packages/core/features/office/applications/hooks/__tests__/useApplicationStatusChange.test.ts` |
| **UI package** | Added coverage for `DashboardWidget` (light/dark + responsive) and `EmptyState` (icon/action handling), supplementing existing button/input suites. | `pnpm vitest run packages/ui/src/components/cards/__tests__/DashboardWidget.test.tsx packages/ui/src/components/states/__tests__/EmptyState.test.tsx` |

> 📌 **Reminder:** `pnpm check` and `pnpm test` still fail because of pre-existing Expo/teams TypeScript errors (see [Open Issues](#open-issues-blocking-ci)). Run targeted commands above until those files are cleaned up.

---

## How the Targets Were Met

- **Discovery**: `useDataHooks.test.ts` now covers error, empty, and normalization paths. Fresh suites exercise `useFindNearestResults`, `useScrollToCard`, `useUserLocation` (web & native), plus `employerFilters` and `getInitials`.
- **Office**: Added a fully mocked Vitest suite for `useApplicationStatusChange` and updated the `TeamForm` tests with an isolated `@app/schemas` mock so validation still runs under Vitest.
- **UI**: Component-level tests verify token usage and state behavior for `DashboardWidget` and `EmptyState`. These run fast and do not rely on React Native primitives.

Coverage artifacts are written to `coverage/` whenever you run `pnpm vitest run --coverage`. Upload the HTML report (`coverage/index.html`) to confirm the totals if you prefer a visual view.

---

## Open Issues Blocking CI

The following TypeScript errors predate this effort and still break `pnpm check` / `pnpm test`. Tackle them before expecting green pipelines:

1. **Expo teams screens** (`apps/office/teams/create.tsx`, `TeamForm.tsx`, `OfficeTeamsList.tsx`) – mismatched Tamagui props and missing type annotations.
2. **Legacy test doubles** (`packages/core/features/office/applications/hooks/__tests__/useApplications.test.ts`) – mock helpers now require explicit arguments.
3. **Supabase background-check utilities** – Deno modules (`npm:posthog-node`, `https://deno.land/std@...`) need typed imports or stubs.

Until these are resolved, run filtered commands (see [Running Tests](./running-tests.md)) rather than the full `pnpm check` pipeline.

---

## Getting Started Quickly

1. **Read** [`running-tests.md`](./running-tests.md) – updated with targeted commands and the safest way to gather coverage while the Expo issues are outstanding.
2. **Reference** [`test-patterns.md`](./test-patterns.md) – patterns reused in the new suites (mocking Tamagui, React Native bridges, Vitest snapshots).
3. **Log updates** in the relevant task documents (`office-test-suite-analysis.md`, `test-results-visual.md`) if you change coverage-critical suites.

---

## Historical Playwright Reports (Archived)

The original Playwright analysis from 2025‑11‑04 is preserved for comparison:

- [Executive Summary](./OFFICE-TEST-SUMMARY.md)
- [Visual Dashboard](./test-results-visual.md)
- [Detailed Analysis](./office-test-suite-analysis.md)
- [Task Breakdown](./office-test-suite-tasks.md)

Those pages describe the legacy 74 % Playwright pass rate and are still useful for UI automation work, but the Vitest push has superseded them for REQ‑172.

---

## Need Something Else?

- **Vitest troubleshooting:** [troubleshooting.md](./troubleshooting.md)  
- **Mocking patterns:** [mocking-guide.md](./mocking-guide.md)  
- **Documentation updates:** ping `docs/testing/SESSION-*.md` if you add a substantial suite.

**Last Updated:** 2025‑11‑11  
**Maintainer:** clay@unicorn.love  
**Next Review:** When the remaining Expo/Supabase type errors are cleared and `pnpm check` succeeds.
