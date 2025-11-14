# Testing Guide

## Overview

This directory contains all test-related files for the project, organized by test type and feature.

## Directory Structure

### Unit Tests (`tests/unit/`)
Future location for Vitest unit tests organized by feature/domain.

**Current Location**: Unit tests are currently co-located with source code:
- `{apps,packages}/**/*.{test,spec}.{ts,tsx}`

### E2E Tests (`tests/e2e/`)
Playwright end-to-end tests organized by feature:
- `profile/` - Profile management flows (18 files)
- `discover/` - Job/worker/employer discovery flows (13 files)
- `auth/` - Authentication flows (14 files)
- `office/` - Office admin functionality (14 files)
- `applications/` - Application submission flows
- `dashboard/` - Dashboard user flows (4 files)
- `other/` - Utility tests and prerequisites (5 files)

### Infrastructure (`tests/infrastructure/`)
Shared test infrastructure:
- `vitest/` - Vitest setup, mocks, and helpers
  - `setup.ts` - Main Vitest setup file
  - `helpers/` - Test helper utilities (database, etc.)
  - `mocks/` - Shared mocks (expo-constants, testing-library-react-native)
- `playwright/` - Playwright helpers and fixtures
  - `helpers/` - Playwright-specific helpers (office-forms, responsive, etc.)
  - `playwright-helpers/` - Auth, fixtures, prerequisites
  - `setup/` - Auth setup and state creation

### Documentation (`tests/docs/`)
Testing documentation and guides:
- `README.md` - This file (main testing guide)
- `CONTRIBUTING.md` - Contribution guidelines
- `TESTING-PATTERNS.md` - Testing patterns and best practices
- `MIGRATION-BASELINE.md` - Pre-migration test metrics
- `MIGRATION-RESULTS.md` - Post-migration test metrics
- `REMOVED-TESTS.md` - Log of removed tests

## Running Tests

### All Tests
```bash
pnpm test
```

This runs:
- Code quality checks (`pnpm check`)
- Vitest unit tests (`pnpm test:vitest`)
- API tests (`pnpm test:api`)

### Unit Tests Only
```bash
pnpm test:vitest
# or
pnpm test:unit
```

### E2E Tests Only
```bash
pnpm test:playwright
# or
pnpm exec playwright test
```

### With Coverage
```bash
pnpm test:coverage
```

### Watch Mode
```bash
pnpm test:watch
# or
pnpm test:vitest:watch
```

## Writing Tests

### Unit Tests
Place unit tests co-located with source code in `{apps,packages}/**/*.{test,spec}.{ts,tsx}`:

```typescript
// packages/core/features/profile/utils/__tests__/date-formatting.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '../date-formatting'

describe('Date Formatting', () => {
  it('should format dates correctly', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024')
  })
})
```

### E2E Tests
Place E2E tests in `tests/e2e/` organized by feature:

```typescript
// tests/e2e/profile/skills.spec.ts
import { test, expect } from '@playwright/test'

test('user can add skills to profile', async ({ page }) => {
  await page.goto('/dashboard/profile/skills')
  // Test implementation
})
```

## Test Infrastructure

### Vitest Setup
Global test setup is in `tests/infrastructure/vitest/setup.ts`

This file configures:
- React and React Native mocks
- Expo modules mocks
- Environment variables
- Cleanup after each test

### Mocks
Shared mocks are in `tests/infrastructure/vitest/mocks/`:
- `expo-constants.ts` - Expo constants mock
- `testing-library-react-native.ts` - React Native testing library mock

These are automatically aliased in `vitest.config.ts`:
```typescript
alias: [
  {
    find: '@testing-library/react-native',
    replacement: resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/testing-library-react-native.ts'),
  },
  {
    find: 'expo-constants',
    replacement: resolve(workspaceRoot, 'tests/infrastructure/vitest/mocks/expo-constants.ts'),
  },
]
```

### Helpers
Test helpers are in `tests/infrastructure/vitest/helpers/`:
- `database.ts` - Supabase test client helpers
  - `createTestClient()` - Create anonymous Supabase client
  - `createServiceRoleClient()` - Create service role Supabase client
  - `setupTestDatabase()` - Setup test database state
  - `teardownTestDatabase()` - Cleanup test database state

Example usage:
```typescript
import { createServiceRoleClient } from '../../../../../../tests/infrastructure/vitest/helpers/database'

describe('My Feature', () => {
  it('should work with database', async () => {
    const supabase = await createServiceRoleClient()
    // Test implementation
  })
})
```

### Playwright Helpers
Playwright helpers are in `tests/infrastructure/playwright/`:

**Authentication** (`playwright-helpers/auth.ts`):
```typescript
import { signInAsTestUser, signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/auth'

test('admin can access office', async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto('/office')
  // Test implementation
})
```

**Auth Setup** (`setup/auth.setup.ts`):
The auth setup system creates reusable authentication state files that tests can use. See [Auth Setup README](../infrastructure/playwright/setup/README.md) for details.

**Using Storage State** (Recommended):
```typescript
test.use({ storageState: 'tests/.auth/admin.json' })

test('admin can access office', async ({ page }) => {
  // Already authenticated!
  await page.goto('/office')
  // Test implementation
})
```

**Office Helpers** (`helpers/office-forms.ts`, `helpers/office-navigation.ts`):
- Form helpers for office CRUD operations
- Navigation helpers for office routes

**Responsive Helpers** (`helpers/responsive.ts`):
- Viewport helpers for responsive testing

## Migration Notes

This structure was established during the test folder consolidation migration (REQ-203).

**Before Migration:**
- Vitest infrastructure: `test/`
- Playwright tests: `tests/` (scattered)

**After Migration:**
- Vitest infrastructure: `tests/infrastructure/vitest/`
- Playwright tests: `tests/e2e/` (organized by feature)
- All infrastructure: `tests/infrastructure/`

See `MIGRATION-RESULTS.md` for detailed migration metrics and `MIGRATION-BASELINE.md` for pre-migration state.

## Additional Resources

- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute tests
- [TESTING-PATTERNS.md](./TESTING-PATTERNS.md) - Testing patterns and best practices
- [REMOVED-TESTS.md](./REMOVED-TESTS.md) - Log of removed tests
