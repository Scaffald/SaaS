# Testing Overview

This workspace now ships with a shared Vitest configuration that covers the Expo application and the internal packages. The goals of this document are to highlight the entry points, explain how to run the suites, and call out known limitations uncovered during the REQ-172 discovery work.

## Quick Start

```bash
# Install dependencies if you have not already
pnpm install --no-frozen-lockfile

# Run the Vitest suite across apps and packages
pnpm test:vitest

# Target a specific workspace (examples)
pnpm test:core         # runs Vitest inside @app/core
pnpm test:schemas      # runs Vitest inside @app/schemas
pnpm test:expo         # runs Vitest inside apps/expo
```

Vitest results are surfaced inside the terminal; coverage reporting will be added in a follow-up phase once flaky suites are stabilised.

## Repo Integration

* `vitest.config.ts` provides a shared root configuration (React plugin, alias support, setup file, dependency inlining).
* Package level configs (`packages/*/vitest.config.ts`, `apps/expo/vitest.config.ts`) simply scope the included files so `pnpm --filter … test` executes quickly.
* New scripts have been added to `package.json` to help run the suites directly or filter by workspace (`test:core`, `test:schemas`, etc.).
* The shared setup file `test/setup.ts` applies `@testing-library/jest-dom`, registers a light-weight `react-native` mock, and ensures every test is isolated with `afterEach`.

## Known Gaps

* Legacy React Native tests that rely on `require('react-native') as typeof import('react-native')` still throw at runtime because the upstream library ships Flow syntax. The modules are now aliased to `react-native-web`, but the suite needs light refactors (convert CJS mocks to ESM) before they will execute under Vitest.
* tRPC/Deno integration tests continue to run via the existing Deno scripts (`pnpm test:api`). A future milestone will decide whether to keep the Deno runner or port them to Vitest.
* Coverage thresholds are intentionally unset for the first pass while the flaky RN suites are stabilised.

## Next Steps

1. Convert the React Native heavy tests (`useProtectedRoute`, profile form suites) to use ESM-friendly mocks so they run under Vitest.
2. Layer in coverage reporting (`vitest --coverage` + CI upload) once suites are green.
3. Expand foundational coverage for shared utilities and schemas — see [`slugify.test.ts`](../../packages/core/utils/__tests__/slugify.test.ts) and [`general-profile-schema.test.ts`](../../packages/schemas/src/__tests__/general-profile-schema.test.ts) for examples created in this iteration.

