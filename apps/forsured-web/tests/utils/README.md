# Test Authentication Utilities

This directory contains the authentication utilities for E2E tests. The system auto-detects the authentication mode based on the `VITE_FORSURED_USE_OAUTH` environment variable.

## Quick Start

```typescript
import { setupAuthAs, loginAs, TEST_USERS } from '../utils/auth';

test('example test', async ({ page }) => {
  // Option 1: Setup auth without navigation (then navigate yourself)
  await setupAuthAs(page, 'test-gc@forsured.test');
  await page.goto('/manager/dashboard');

  // Option 2: Login and navigate automatically
  await loginAs(page, 'test-gc@forsured.test');
  // Already navigated to /manager/dashboard
});
```

## File Structure

```
tests/utils/
├── auth.ts           # CENTRAL DISPATCHER - Always import from here
├── supabaseAuth.ts   # Supabase password auth (used when VITE_FORSURED_USE_OAUTH=false)
├── httpOnlyAuth.ts   # httpOnly cookie auth (used when VITE_FORSURED_USE_OAUTH=true)
└── README.md         # This file
```

## How It Works

The central `auth.ts` reads the `VITE_FORSURED_USE_OAUTH` environment variable:

| `VITE_FORSURED_USE_OAUTH` | Auth Method | Description |
|---------------------------|-------------|-------------|
| `false` (default) | Supabase password auth | Uses `signInWithPassword()` + localStorage session injection. Matches the "Test Login" buttons on Start.tsx |
| `true` | httpOnly cookie auth | Creates httpOnly cookie sessions + mocks edge functions. Matches production OAuth flow with Scaffald |

**You don't need to change your test code** - just import from `auth.ts` and the right method is used automatically.

## Available Functions

### `setupAuthAs(page, email)`

Sets up authentication without navigating. Use this when you want to control where the test navigates.

```typescript
await setupAuthAs(page, 'test-contractor@forsured.test');
await page.goto('/subcontractor/documents'); // Navigate to specific page
```

### `loginAs(page, email, options?)`

Sets up authentication AND navigates to the user's default dashboard.

```typescript
// Navigates to /manager/dashboard automatically
await loginAs(page, 'test-gc@forsured.test');

// Skip navigation (same as setupAuthAs)
await loginAs(page, 'test-gc@forsured.test', { navigate: false });
```

### `getTestUserProfile(email)`

Returns the test user profile data for assertions.

```typescript
const profile = getTestUserProfile('test-gc@forsured.test');
console.log(profile.user_type); // 'gc'
```

### `waitForProfileReady(page, userType, timeout?)`

Waits for the user profile to be loaded in React state. **Called automatically by `loginAs`.**

Use this after `setupAuthAs` + manual navigation if you need to ensure profile is ready before proceeding.

```typescript
await setupAuthAs(page, 'test-contractor@forsured.test');
await page.goto('/subcontractor/broker');
await waitForProfileReady(page, 'contractor'); // Wait for profile before assertions
```

### `getAuthMode()`

Returns which auth mode is active (for debugging).

```typescript
console.log(getAuthMode()); // 'supabase' or 'oauth'
```

## Available Test Users

All test users have the password `ForsuredTest123!` and are seeded in the database.

| Email | User Type | Dashboard Route |
|-------|-----------|-----------------|
| `test-gc@forsured.test` | gc (Manager) | `/manager/dashboard` |
| `test-contractor@forsured.test` | contractor (Subcontractor) | `/subcontractor/dashboard` |
| `test-broker@forsured.test` | broker | `/broker/dashboard` |
| `test-admin@forsured.test` | admin | `/admin/dashboard` |

### Legacy Email Aliases

These legacy emails are mapped to the actual seeded users above:

```typescript
// GC/Manager aliases → test-gc@forsured.test
'active.gc@test.forsured.com'
'fresh.gc@test.forsured.com'
'onboarding.gc@test.forsured.com'
'multiproject.gc@test.forsured.com'

// Contractor/Subcontractor aliases → test-contractor@forsured.test
'active.contractor@test.forsured.com'
'fresh.contractor@test.forsured.com'
'noncompliant.contractor@test.forsured.com'

// Broker aliases → test-broker@forsured.test
'active.broker@test.forsured.com'
'fresh.broker@test.forsured.com'

// Admin aliases → test-admin@forsured.test
'admin@test.forsured.com'
```

## Using the Base Test Fixture

The base fixture at `tests/e2e/fixtures/base.ts` provides these auth helpers as fixture properties:

```typescript
import { test, expect } from './fixtures/base';

test('example', async ({ page, setupAuthAs, loginAs, testUsers }) => {
  // Use the fixture helpers
  await setupAuthAs(page, 'test-gc@forsured.test');

  // Access test user data
  console.log(testUsers['test-gc@forsured.test'].user_type);
});
```

## Common Patterns

### Testing a specific page as a specific user

```typescript
test('contractor can view documents page', async ({ page }) => {
  await setupAuthAs(page, 'test-contractor@forsured.test');
  await page.goto('/subcontractor/documents');

  await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
});
```

### Testing role-based access

```typescript
test('manager cannot access admin pages', async ({ page }) => {
  await setupAuthAs(page, 'test-gc@forsured.test');
  await page.goto('/admin/dashboard');

  // Should redirect to manager dashboard or show access denied
  await expect(page).not.toHaveURL('/admin/dashboard');
});
```

### Testing with assertions after login

```typescript
test('dashboard shows user name', async ({ page }) => {
  await loginAs(page, 'test-broker@forsured.test');

  // loginAs already navigated to /broker/dashboard
  await expect(page.getByText('Test Broker User')).toBeVisible();
});
```

## Troubleshooting

### Auth not working?

1. **Check the database is running**: `pnpm supabase status`
2. **Check test users are seeded**: Run `pnpm supabase db reset` to reset and re-seed
3. **Check console logs**: Auth functions log to console, look for `[Auth]` or `[E2E Auth]` prefixes

### Redirecting to `/` after navigation?

This usually means the profile wasn't loaded in React state when `ProtectedRoute` checked it.

**If using `loginAs`**: This should be fixed automatically - `loginAs` now waits for profile.

**If using `setupAuthAs` + manual navigation**: Call `waitForProfileReady` after navigation:

```typescript
await setupAuthAs(page, 'test-contractor@forsured.test');
await page.goto('/subcontractor/broker');
await waitForProfileReady(page, 'contractor');
// Now safe to make assertions
```

### Wrong dashboard route?

The user types map to routes as follows:
- `gc` → `/manager/...`
- `contractor` → `/subcontractor/...`
- `broker` → `/broker/...`
- `admin` → `/admin/...`

### Need to check which auth mode is active?

```typescript
import { getAuthMode } from '../utils/auth';
console.log('Auth mode:', getAuthMode()); // 'supabase' or 'oauth'
```

## Important Notes

1. **Always import from `auth.ts`** - Never import directly from `supabaseAuth.ts` or `httpOnlyAuth.ts` in tests
2. **Test users are real** - They exist in the database, created by migrations
3. **Sessions are real** - We use actual Supabase authentication, not mocks
4. **No mocking internal services** - Per testing policy, we only mock external third-party services
