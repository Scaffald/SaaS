# Scaffald Testing Guide

Complete guide to testing in the Scaffald application.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Prerequisites](#prerequisites)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock Validation Framework](#mock-validation-framework)
- [Test Factories](#test-factories)
- [Coverage Requirements](#coverage-requirements)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Testing Philosophy

### No Mocking of Owned Code

**CRITICAL PRINCIPLE**: We ONLY mock external services, NEVER our own code.

✅ **DO mock**:
- External APIs (Stripe, OpenAI, Mapbox, etc.)
- Third-party services
- Platform-specific APIs (when necessary)

❌ **NEVER mock**:
- Database (Supabase)
- tRPC endpoints
- Internal business logic
- Supabase Auth/Storage/Realtime

**Why?** Mocking our own code leads to false confidence. Tests should validate real behavior against real systems.

### Mock Validation Framework

Our **unique innovation**: All mocks are validated **before tests run** to ensure they match real implementations. If a mock is broken or outdated, tests won't run.

Example output:
```
Starting Mock Validation
Running 3 validator(s)...

✓ Sentry Mock (11ms)
✓ Mapbox Mock (12ms)
✓ Google Sign-In Mock (12ms)

All mock validations passed!
```

---

## Test Types

### 1. Unit Tests (Vitest)
**What**: Individual components, hooks, utilities
**Location**: `tests/**/*.test.{ts,tsx}`
**Run**: `pnpm test:unit`

### 2. Integration Tests (Vitest + Real DB)
**What**: Features using real Supabase database
**Location**: `tests/**/*.test.{ts,tsx}`
**Run**: `pnpm test:unit` (same command, different patterns)

### 3. E2E Tests - Web (Playwright)
**What**: Full user flows in browser (Expo Web)
**Location**: `tests/e2e/**/*.spec.ts`
**Run**: `pnpm test:e2e`

### 4. E2E Tests - Native (Detox)
**What**: Full user flows on iOS/Android simulators
**Location**: `tests/e2e/**/*.detox.ts`
**Run**: `pnpm test:e2e:ios` or `pnpm test:e2e:android`

---

## Prerequisites

### For All Tests

1. **Supabase Running Locally**:
   ```bash
   pnpm supa:start
   ```
   Verify at http://localhost:54321

2. **Environment Variables**:
   ```bash
   # Automatically set in tests/setup.ts
   EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   ```

### For E2E Tests (Web)

```bash
# Install Playwright browsers (first time)
pnpm exec playwright install chromium
```

### For E2E Tests (Native)

**iOS**:
- Xcode 15+
- iOS Simulator

**Android**:
- Android Studio
- Android Emulator (API 33+)
- Create AVD: `avdmanager create avd -n Pixel_5_API_33 -k "system-images;android-33;google_apis;x86_64"`

---

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
pnpm test:unit

# Run specific file
pnpm vitest run tests/testDb.test.ts

# Watch mode (auto-rerun on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### E2E Tests (Web)

```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with browser visible
pnpm test:e2e:headed

# Interactive UI mode (best for debugging)
pnpm test:e2e:ui

# Run specific test
pnpm playwright test auth.spec.ts
```

### E2E Tests (Native)

```bash
# iOS
pnpm test:e2e:ios:build    # Build app (first time or after changes)
pnpm test:e2e:ios           # Run tests

# Android
pnpm test:e2e:android:build # Build app
pnpm test:e2e:android       # Run tests
```

---

## Writing Tests

### Unit Tests (Components/Hooks)

```typescript
import { describe, test, expect } from 'vitest';
import { render, screen } from '../tests/test-utils'; // Custom render with providers
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

**Key Points**:
- Import `render` from `tests/test-utils` (includes providers)
- Uses React Native Testing Library
- Runs against real components (no mocking)

### Integration Tests (Database)

```typescript
import { describe, test, expect, afterEach } from 'vitest';
import { createTestDataTracker, cleanupTestData } from '../tests/testDb';
import { createTestUser } from '../tests/factories/userFactory';
import { createTestOrganization } from '../tests/factories/organizationFactory';

describe('Organization Management', () => {
  const tracker = createTestDataTracker();

  afterEach(async () => {
    await cleanupTestData(tracker); // Auto-cleanup
  });

  test('creates organization for user', async () => {
    // Arrange: Create test data using factories
    const user = await createTestUser({ tracker });

    // Act: Create organization
    const org = await createTestOrganization({
      ownerId: user.id,
      name: 'Test Company',
      tracker,
    });

    // Assert: Verify database state
    expect(org.id).toBeDefined();
    expect(org.owner_user_id).toBe(user.id);
    expect(org.name).toBe('Test Company');
  });
});
```

**Key Points**:
- Uses **real Supabase database**
- Test factories create data
- `tracker` enables automatic cleanup
- Clean slate for each test

### E2E Tests (Web - Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in', async ({ page }) => {
    // Navigate
    await page.goto('/');

    // Fill form
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPassword123!');

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify redirect
    await page.waitForURL('/dashboard');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
```

### E2E Tests (Native - Detox)

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('displays home screen', async () => {
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('navigates to profile', async () => {
    await element(by.id('profile-tab')).tap();
    await detoxExpect(element(by.id('profile-screen'))).toBeVisible();
  });
});
```

**Key Point**: Add `testID` props to React Native components for reliable selectors.

---

## Mock Validation Framework

### How It Works

1. **Before Tests Run**: Framework validates all mocks
2. **Parallel Execution**: All validators run concurrently
3. **Fail Fast**: Tests blocked if any mock is broken
4. **Clear Errors**: Shows exactly what's wrong

### Adding a Mock Validator

See [tests/mockValidation/README.md](./mockValidation/README.md) for complete guide.

**Quick Example**:

```typescript
// tests/mockValidation/validators/StripeValidator.ts
import { MockValidator, ValidationResult } from '../types';
import { createSuccessResult, createFailedResult, createValidationError } from '../MockValidationFramework';

export class StripeValidator implements MockValidator {
  readonly name = 'Stripe Mock';

  async validate(): Promise<ValidationResult> {
    const start = Date.now();
    const errors = [];

    const { mockStripe } = await import('../../mocks/externalServices');

    // Validate structure
    if (typeof mockStripe.customers?.create !== 'function') {
      errors.push(createValidationError(
        'customers.create',
        'function',
        typeof mockStripe.customers?.create,
        'Stripe mock missing customers.create method'
      ));
    }

    const duration = Date.now() - start;
    return errors.length > 0
      ? createFailedResult(this.name, errors, duration)
      : createSuccessResult(this.name, duration);
  }
}
```

**Register in setup.ts**:
```typescript
const { StripeValidator } = await import('./mockValidation/validators/StripeValidator');
framework.registerValidator(new StripeValidator());
```

---

## Test Factories

Factories create test data with automatic cleanup.

### Available Factories

- `createTestUser()` - Supabase Auth users
- `createTestOrganization()` - Organizations
- `createTestTeam()` - Teams
- `createTestProject()` - Projects

### Usage Pattern

```typescript
import { createTestDataTracker, cleanupTestData } from '../tests/testDb';
import { createTestUser } from '../tests/factories/userFactory';
import { createTestOrganization } from '../tests/factories/organizationFactory';

const tracker = createTestDataTracker();

// Create test data
const user = await createTestUser({ tracker });
const org = await createTestOrganization({ ownerId: user.id, tracker });

// Run tests...

// Cleanup (in afterEach or afterAll)
await cleanupTestData(tracker);
```

### Batch Creation

```typescript
import { createTestUsers } from '../tests/factories/userFactory';
import { createTestTeams } from '../tests/factories/teamFactory';

// Create 5 users at once
const users = await createTestUsers(5, { tracker });

// Create 3 teams
const teams = await createTestTeams(3, {
  organizationId: org.id,
  tracker
});
```

### Cleanup Order

Factories are cleaned up in **reverse dependency order**:
1. Applications
2. Job Postings
3. Invitations
4. Team Members
5. Role Assignments
6. Teams
7. Projects
8. Organizations
9. Users (via Auth API)

---

## Coverage Requirements

### Thresholds

Configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

### Critical Paths

Functions marked critical must have **90% coverage**:
- Authentication flows
- Payment processing
- Data validation
- Security checks

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/index.html
```

---

## Troubleshooting

### "Mock validation failed"

**Symptom**: Tests won't run, mock validation errors shown

**Solution**:
1. Read the error message carefully
2. Update the mock in `tests/mocks/externalServices.ts`
3. Ensure mock matches real API structure

### "Cannot connect to Supabase"

**Symptom**: Database tests fail with connection errors

**Solution**:
```bash
# Check Supabase is running
pnpm supa:status

# Start if not running
pnpm supa:start

# Verify at http://localhost:54321
```

### "Element not found" (E2E)

**Playwright**:
```bash
# Use codegen to find selectors
pnpm playwright codegen http://localhost:8081
```

**Detox**:
```typescript
// Capture view hierarchy
await device.captureViewHierarchy();
// Check artifacts/ folder
```

### "Test timeout"

**Cause**: Async operation taking too long

**Solution**:
```typescript
// Increase timeout for specific test
test('slow operation', async () => {
  // ...
}, 30000); // 30 seconds

// Or use waitFor
await waitFor(element).toBeVisible().withTimeout(10000);
```

### "Tests pass locally but fail in CI"

**Common causes**:
1. Supabase not running in CI
2. Environment variables not set
3. Dependencies not installed
4. Different Node/Deno versions

**Fix**: Check CI logs and compare to local environment

---

## Best Practices

### 1. Test Isolation

✅ **GOOD**: Each test is independent
```typescript
afterEach(async () => {
  await cleanupTestData(tracker);
});
```

❌ **BAD**: Tests depend on each other
```typescript
let sharedUser; // Don't do this!
test('creates user', () => { sharedUser = ... });
test('uses user', () => { /* uses sharedUser */ });
```

### 2. Descriptive Test Names

✅ **GOOD**: Clear what's being tested
```typescript
test('displays error when email is invalid')
test('allows user to create project when authenticated')
```

❌ **BAD**: Vague or unclear
```typescript
test('works')
test('test1')
```

### 3. Arrange-Act-Assert Pattern

```typescript
test('creates organization', async () => {
  // Arrange: Set up test state
  const user = await createTestUser({ tracker });

  // Act: Perform action
  const org = await createTestOrganization({
    ownerId: user.id,
    tracker
  });

  // Assert: Verify outcome
  expect(org.owner_user_id).toBe(user.id);
});
```

### 4. Use Factories

✅ **GOOD**: Use factories for test data
```typescript
const user = await createTestUser({ tracker });
```

❌ **BAD**: Manual database inserts
```typescript
await supabase.from('users').insert({ ... }); // Don't do this
```

### 5. Real User Actions (E2E)

✅ **GOOD**: Simulate real user behavior
```typescript
await page.getByLabel('Email').fill('test@example.com');
await page.getByRole('button', { name: 'Submit' }).click();
```

❌ **BAD**: Direct API calls or shortcuts
```typescript
await page.evaluate(() => localStorage.setItem('token', '...')); // Bad
```

### 6. Wait for Elements

✅ **GOOD**: Wait for async operations
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

❌ **BAD**: Fixed delays
```typescript
await page.waitForTimeout(5000); // Don't do this
```

### 7. Clean Test Data

✅ **GOOD**: Always clean up
```typescript
afterEach(async () => {
  await cleanupTestData(tracker);
});
```

❌ **BAD**: Leave test data in database
```typescript
// No cleanup - pollutes database
```

---

## Quick Reference

### Commands

```bash
# Unit/Integration
pnpm test:unit              # Run all tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage

# E2E Web
pnpm test:e2e               # Headless
pnpm test:e2e:headed        # With browser
pnpm test:e2e:ui            # Interactive UI

# E2E Native
pnpm test:e2e:ios:build     # Build iOS
pnpm test:e2e:ios           # Test iOS
pnpm test:e2e:android:build # Build Android
pnpm test:e2e:android       # Test Android
```

### File Locations

```
tests/
├── testDb.ts                    # Database utilities
├── test-utils.tsx               # React Native test utils
├── setup.ts                     # Vitest setup
├── factories/                   # Test data factories
│   ├── userFactory.ts
│   ├── organizationFactory.ts
│   └── ...
├── mocks/                       # External service mocks
│   └── externalServices.ts
├── mockValidation/              # Mock validation framework
│   ├── types.ts
│   ├── MockValidationFramework.ts
│   └── validators/
└── e2e/                         # E2E tests
    ├── playwright.config.ts     # Playwright config
    ├── *.spec.ts                # Web E2E tests
    └── *.detox.ts               # Native E2E tests
```

---

## Additional Resources

- [Mock Validation README](./mockValidation/README.md)
- [Playwright E2E Guide](./e2e/README.md)
- [Detox E2E Guide](./e2e/README-DETOX.md)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Detox Documentation](https://wix.github.io/Detox/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

---

**Need Help?** Check the troubleshooting section or ask in #engineering-help
