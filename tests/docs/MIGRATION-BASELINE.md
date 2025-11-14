# Test Migration Baseline

Date: 2025-01-16 (before migration)
Command: `pnpm test:vitest`

## Metrics

- **Total Test Files**: 104 (65 passed, 36 failed, 3 skipped)
- **Total Tests**: 358 (300 passed, 54 failed, 3 skipped, 1 todo)
- **Test Execution Duration**: ~25.31s
- **Errors**: 2 unhandled errors

## Test Infrastructure

- **Vitest Setup**: `test/setup.ts`
- **Vitest Helpers**: `test/helpers/database.ts`
- **Vitest Mocks**: `test/mocks/expo-constants.ts`, `test/mocks/testing-library-react-native.ts`
- **Configuration**: `vitest.config.ts` references `test/` paths

## Known Issues

These are pre-existing test failures unrelated to the migration:
- Several tests fail due to missing mocks (Palette, useMedia, Button, etc.)
- Some tests require service role key for Supabase (office-role-access.test.ts)
- Some tests have syntax errors (profile-education.spec.tsx)
- Some tests have invalid hook usage (profile-cancel.test.tsx)

## Files to Migrate

- `test/setup.ts` → `tests/infrastructure/vitest/setup.ts`
- `test/helpers/database.ts` → `tests/infrastructure/vitest/helpers/database.ts`
- `test/mocks/expo-constants.ts` → `tests/infrastructure/vitest/mocks/expo-constants.ts`
- `test/mocks/testing-library-react-native.ts` → `tests/infrastructure/vitest/mocks/testing-library-react-native.ts`

## Import Paths to Update

- `vitest.config.ts`: Update setupFiles and alias paths
- `packages/core/features/office/__tests__/office-role-access.test.ts`: Update database helper import

