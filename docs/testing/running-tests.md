# Running Tests

This guide translates the Vitest tooling introduced for REQ-172 into practical workflows the whole team can adopt. Everything below assumes you are inside the workspace root (`/Users/clay/Development/SCF-Neue`).

## Prerequisites

- Install dependencies at least once: `pnpm install --no-frozen-lockfile`.
- Ensure the local Supabase stack is running when you need the Deno integration suites: `pnpm supa start` launches Supabase, Inbucket (mail testing) and supporting services.
- Populate the basic Expo environment variables (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`). The shared test setup seeds safe defaults so unit suites work even when these values are missing.

## Core Commands

| Scenario | Command | Notes |
| --- | --- | --- |
| Full preflight (formatting, linting, type check) | `pnpm check` | Mirrors the CI `turbo check` pipeline. ⚠️ **Currently fails** because Expo teams screens still have invalid Tamagui props and Supabase helpers require typed Deno imports. |
| Complete test stack | `pnpm test` | Runs `pnpm check`, then all Vitest suites, followed by Supabase Deno endpoint tests.⚠️ Blocked for the same reasons as `pnpm check`. |
| Vitest across the monorepo | `pnpm test:unit` | Uses the shared configuration defined in `vitest.config.ts`. |
| Watch mode for active development | `pnpm test:watch` | Re-runs impacted suites as files change. |
| Coverage summary (50% thresholds enforced) | `pnpm test:coverage` | Emits HTML (`coverage/index.html`), JSON, and text reports. Prefer running after fixing the Expo/Supabase errors or by filtering to specific packages (see below). |
| Vitest UI dashboard | `pnpm test:vitest:ui` | Hosts an interactive runner at `http://localhost:51204`. |
| Target a workspace | `pnpm --filter @app/core test` | Replace `@app/core` with any workspace (`@app/ui`, `@app/schemas`, `expo-app`). |

> ℹ️ All of the commands above run Vitest in **non-watch mode by default**. Use `pnpm test:watch` (or pass `--watch` when invoking `vitest` directly) whenever you need automatic re-runs while editing files.

## Test Logging & Diagnostics

- **Vitest + Playwright now default to quiet reporters.** Successful specs stay silent; instead you get `queued apps/.../file.test.ts` when a suite enters the execution plan and `completed apps/.../file.test.ts` when it finishes. Even if workers run suites out of order, the final “completed …” line tells you which file finished last (and therefore which one is currently running or hung).
- **Preserve summaries.** Both reporters still delegate to the standard summary output, so you continue to see total tests, pass/fail counts, and durations at the end of each run.
- **Opt-in verbose logging globally:** `TEST_LOG_VERBOSE=1 pnpm test:unit` (or `TEST_LOG_VERBOSE=1 pnpm test:playwright`) restores success logs for every test.
- **Opt-in verbose logging per file:** add a pragma comment to the top of the spec you want to monitor while it is flaky:

```
// @testlog verbose
import { describe, it, expect } from 'vitest'
```

  Only files with this pragma (or when the env var is set) will print `✓` entries for passing tests. Remove the pragma once the suite is stable to keep the console noise-free.

These reporters live under `tests/infrastructure/vitest/reporters/quiet-progress.ts` and `tests/infrastructure/playwright/quiet-reporter.ts`. Update them if future scenarios need richer metadata (e.g., linking to trace IDs).

## Running Individual Suites

Vitest respects native filtering flags:

- `pnpm test:unit -- packages/core/utils/__tests__/slugify.test.ts` runs a single file.
- `pnpm test:unit -- --testNamePattern="Vanity URL"` focuses on a matching describe/it block.
- `pnpm --filter expo-app test -- --runInBand` executes Expo-focused suites serially when debugging timing-sensitive hooks.
- `pnpm vitest run packages/core/features/discover/hooks/__tests__/useFindNearestResults.test.ts` executes the new discovery coverage without touching the Expo type errors.
- `pnpm vitest run packages/ui/src/components/cards/__tests__/DashboardWidget.test.tsx packages/ui/src/components/states/__tests__/EmptyState.test.tsx` exercises the UI coverage milestone quickly.

For Deno-based tRPC tests, use the existing script: `pnpm --filter @app/supabase test:endpoints`. The runner automatically checks Supabase status, warms authentication tokens, and caches fixtures under `packages/supabase/functions/trpc/__tests__/`.

## Local Database Hygiene

Integration suites often rely on a clean dataset. The helper module added in `test/helpers/database.ts` exposes lifecycle methods for Vitest:

- `setupTestDatabase()` resets and seeds data (skips gracefully if no service-role key is available).
- `teardownTestDatabase()` clears any generated records.
- `createTestClient()` and `createServiceRoleClient()` return Supabase clients with predictable auth settings.

Use these utilities from your test files to guarantee deterministic setups:

```ts
import { beforeAll, afterAll } from 'vitest'
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../../test/helpers/database'

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})
```

When service-role credentials are not configured locally the helpers emit a warning and continue, allowing unit suites to run without elevated privileges.

## CI Expectations

The GitHub Actions workflow (Task 2) mirrors the local flow: install dependencies, run `pnpm supa start`, execute `pnpm test`, upload coverage, and shut Supabase down. Keeping local runs aligned with this sequence prevents “works on my machine” surprises.

### Interim CI workaround

Until the Expo/Supabase TypeScript issues are addressed, CI will red-line after the type-check step. You can still collect coverage artifacts by running the filtered commands above, archiving `coverage/`, and attaching the results to your PR description. Once the type errors are cleaned up, remove the filters and rely on the standard `pnpm test` workflow again.


