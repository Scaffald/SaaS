# Forsured Testing Guide

## Testing Policy (REQ-9)

**If we own it or write it, we test it directly - we do NOT mock it.**

- Do NOT mock the database or the internal API
- Use a real database instance and real HTTP calls
- Mocks are only allowed for external third-party services (Stripe, SendGrid, OpenAI, Mapbox)
- Tables, code, configuration, and definitions that we own should be tested against real systems

## Prerequisites

Before running tests, ensure:

```bash
# Start local Supabase
pnpm supa start

# Verify Supabase is running
pnpm supa status
```

## Test Fixtures

All tests should import fixtures from `tests/fixtures`:

```typescript
import {
  // Supabase clients
  testSupabase,        // Regular user client
  testSupabaseAdmin,   // Service role client (bypasses RLS)
  forsured,            // Helper for forsured.* tables
  core,                // Helper for core.* tables

  // Test IDs (seeded data)
  TEST_USER_IDS,
  TEST_ORG_IDS,
  TEST_PROJECT_IDS,

  // Factory functions
  createTestTask,
  createTestProject,
  createTestSubcontractor,
  createTestPolicy,

  // Cleanup helpers
  cleanupTestData,
  cleanupByPrefix,

  // Wait helper
  waitForSupabase,
} from '../../../../../tests/fixtures';
```

## Test Pattern for tRPC Routers

```typescript
/**
 * Router Tests Template
 * REQ-XXX: Feature Name
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { featureRouter } from '../feature';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  forsured,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data references
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;
let createdDataId: string | null = null;

describe('Feature Router', () => {
  beforeAll(async () => {
    // Wait for Supabase to be available
    await waitForSupabase();

    // Create test data if needed
    const { data } = await forsured('table_name')
      .insert({ /* test data */ })
      .select()
      .single();

    if (data) {
      createdDataId = data.id;
    }
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdDataId) {
      await forsured('table_name').delete().eq('id', createdDataId);
    }
  });

  // Helper to create caller context
  const createContext = (
    userId: string | null = testUserId,
    organizationId: string | null = testOrgId
  ) => {
    const mockUser: User | null = userId
      ? ({ id: userId, email: 'test@example.com' } as User)
      : null;

    return {
      db: testSupabaseAdmin as any,
      session: mockUser,
      userId,
      organizationId,
    };
  };

  // Tests...
});
```

## Test Categories

### 1. Pure Function Tests (Compliant)
Tests for utility functions, formatters, validators that don't touch the database.

```typescript
import { formatDate } from '../date-formatting';

describe('formatDate', () => {
  it('formats valid ISO strings', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 2024');
  });
});
```

### 2. tRPC Router Tests (Migrated)
Tests for tRPC endpoints using real Supabase connections.

See pattern above.

### 3. Component Tests

**Pure UI Components (Compliant):**
```typescript
import { render, screen } from '@/test/test-utils';
import { TaskStatusBadge } from '../TaskStatusBadge';

it('renders pending status', () => {
  render(<TaskStatusBadge status="pending" />);
  expect(screen.getByText('Pending')).toBeInTheDocument();
});
```

**Connected Components (Needs Review):**
Components that mock hooks/tRPC should be migrated to integration tests or use the validated mock pattern.

### 4. Mock Validation Tests
When mocks are necessary (e.g., for third-party services), create a companion `.mockValidation.test.ts` file that verifies mock behavior against real APIs.

```typescript
// invitations.mockValidation.test.ts
describe('Mock Validation', () => {
  it('forsured() returns query builder with expected methods', () => {
    const builder = forsured('table');
    expect(typeof builder.select).toBe('function');
    expect(typeof builder.eq).toBe('function');
    // ... verify mock matches real API
  });
});
```

## Running Tests

```bash
# Run all Forsured tests
pnpm test:forsured

# Run specific test file
pnpm vitest run path/to/test.ts

# Run with verbose logging
TEST_LOG_VERBOSE=1 pnpm test:forsured

# Run in watch mode (development)
pnpm vitest --watch
```

## Test IDs Reference

Seeded test data IDs available in `tests/fixtures/supabase.ts`:

| Constant | Description |
|----------|-------------|
| `TEST_USER_IDS.manager` | Manager user for GC organization |
| `TEST_USER_IDS.contractor` | Contractor user |
| `TEST_USER_IDS.broker` | Broker user |
| `TEST_ORG_IDS.primary` | Primary test organization |
| `TEST_PROJECT_IDS.project1` | First test project |

## Cleanup Best Practices

1. **Create in beforeAll, cleanup in afterAll:**
   ```typescript
   let testId: string | null = null;

   beforeAll(async () => {
     const { data } = await forsured('table').insert({...}).select().single();
     testId = data?.id ?? null;
   });

   afterAll(async () => {
     if (testId) {
       await forsured('table').delete().eq('id', testId);
     }
   });
   ```

2. **Use unique identifiers for test data:**
   ```typescript
   const testName = `Test Item ${Date.now()}`;
   ```

3. **Clean up related data in correct order:**
   ```typescript
   afterAll(async () => {
     // Delete child records first
     await forsured('child_table').delete().eq('parent_id', parentId);
     // Then parent
     await forsured('parent_table').delete().eq('id', parentId);
   });
   ```

## Authorization Testing

All tests should verify authorization boundaries:

```typescript
describe('Authorization Tests', () => {
  it('rejects user without organization', async () => {
    const ctx = createContext(testUserId, null);
    const caller = router.createCaller(ctx);

    await expect(
      caller.get({ organizationId: testOrgId, id: testId })
    ).rejects.toThrow(TRPCError);
  });

  it('rejects cross-organization access', async () => {
    const ctx = createContext(testUserId, testOrgId);
    const caller = router.createCaller(ctx);
    const otherOrgId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

    await expect(
      caller.get({ organizationId: otherOrgId, id: testId })
    ).rejects.toThrow('You do not have permission');
  });
});
```

## Compliance Summary

| Category | Status | Notes |
|----------|--------|-------|
| tRPC Router Tests | Migrated | Use real Supabase via fixtures |
| Pure Function Tests | Compliant | No mocking needed |
| Pure UI Component Tests | Compliant | Props-based testing |
| Library/Service Tests | Validated Mocks | Mock validation tests verify parity |
| Connected Component Tests | Needs Review | Consider integration testing |

## Related Files

- `tests/fixtures/supabase.ts` - Supabase client fixtures and helpers
- `tests/fixtures/index.ts` - Public fixture exports
- `vitest.config.ts` - Test configuration
- `src/test/test-utils.tsx` - React testing utilities
