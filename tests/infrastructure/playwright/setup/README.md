# Playwright Auth Setup

This directory contains the authentication setup infrastructure for Playwright tests.

## Overview

The auth setup system creates reusable authentication state files that tests can use to authenticate without needing to sign in for each test. This significantly speeds up test execution and eliminates the need for CDN dependencies that previously caused timeout issues.

## How It Works

### Architecture

1. **Setup Project**: Playwright runs a special "setup" project before all other tests
2. **API-Based Authentication**: Uses Node.js Supabase client (no CDN) to get authentication tokens
3. **Storage State Files**: Saves complete browser state (localStorage, cookies) to JSON files
4. **Reuse**: Tests load these files to start with authenticated sessions

### Key Files

- `setup/auth.setup.ts` - Main setup file that creates auth state files
- `playwright-helpers/auth.ts` - Helper functions for authentication
- `tests/.auth/` - Directory containing auth state files (admin.json, user.json, super-admin.json)

## Auth State Files

### File Locations

- `tests/.auth/admin.json` - Admin user authentication state
- `tests/.auth/user.json` - Regular user authentication state
- `tests/.auth/super-admin.json` - Super admin authentication state

### File Structure

Each auth file contains:
```json
{
  "cookies": [],
  "origins": [{
    "origin": "http://localhost:8081",
    "localStorage": [{
      "name": "sb-127-0-0-1-54321-auth-token",
      "value": "{...session data...}"
    }]
  }]
}
```

### File Expiration

Auth files are valid for 7 days. After 7 days, the setup will regenerate them automatically. This ensures tokens don't expire and cause test failures.

## Usage in Tests

### Basic Usage

```typescript
import { test } from '@playwright/test'

// Use admin auth state
test.use({ storageState: 'tests/.auth/admin.json' })

test('my test', async ({ page }) => {
  // Already authenticated!
  await page.goto('/dashboard')
  // Test continues...
})
```

### Multiple Personas

```typescript
// Admin tests
test.describe('Admin features', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })
  
  test('admin can do X', async ({ page }) => {
    // ...
  })
})

// User tests
test.describe('User features', () => {
  test.use({ storageState: 'tests/.auth/user.json' })
  
  test('user can do Y', async ({ page }) => {
    // ...
  })
})
```

## Regenerating Auth Files

### Automatic Regeneration

Auth files are automatically regenerated when:
- The file doesn't exist
- The file is older than 7 days

### Manual Regeneration

To manually regenerate auth files:

1. Delete the auth files:
   ```bash
   rm tests/.auth/*.json
   ```

2. Run the setup project:
   ```bash
   pnpm test:playwright --project=setup
   ```

3. Or run any test (setup runs automatically):
   ```bash
   pnpm test:playwright
   ```

## Troubleshooting

### Auth Files Not Created

**Problem**: Auth files are not being created during setup.

**Solutions**:
1. Check that Supabase is running: `pnpm supa status`
2. Verify test user credentials are correct in `auth.setup.ts`
3. Check network connectivity to Supabase (should be `http://127.0.0.1:54321`)
4. Look for errors in the setup output

### Tests Failing with 401 Errors

**Problem**: Tests are getting 401 Unauthorized errors.

**Solutions**:
1. Regenerate auth files (they may have expired)
2. Check that storage state is being loaded correctly
3. Verify the localStorage key matches your Supabase URL
4. Ensure auth files contain valid session data

### Timeout Errors

**Problem**: Setup is timing out.

**Solutions**:
1. Check Supabase is running and accessible
2. Verify network connectivity
3. Check that test users exist in the database
4. Look for errors in the console output

### Auth Files Expired

**Problem**: Tests fail because auth files are too old.

**Solutions**:
1. Delete old auth files: `rm tests/.auth/*.json`
2. Run setup again to regenerate
3. Or wait for automatic regeneration (happens when files are >7 days old)

## Implementation Details

### No CDN Dependencies

The current implementation uses API-based authentication via the `getSession()` helper function. This eliminates the previous CDN timeout issues by:

- Using Node.js Supabase client (runs in test environment, not browser)
- Setting localStorage directly (no browser-side Supabase import needed)
- Avoiding dynamic imports from `esm.sh` that would timeout

### Storage Key Format

The localStorage key format is: `sb-{normalized-host}-auth-token`

For localhost Supabase (`http://127.0.0.1:54321`):
- Normalized host: `127-0-0-1-54321`
- Storage key: `sb-127-0-0-1-54321-auth-token`

### Session Data Structure

The session data stored in localStorage:
```typescript
{
  currentSession: {
    access_token: string,
    refresh_token: string,
    expires_at: number,
    expires_in: number,
    token_type: string,
    user: {...}
  },
  expiresAt: number
}
```

## Testing the Auth Setup

### Unit Tests

Run unit tests for auth setup utilities:
```bash
pnpm test:unit tests/infrastructure/playwright/setup/auth.setup.test.ts
```

### Integration Tests

Run integration tests:
```bash
pnpm test:playwright tests/infrastructure/playwright/setup/auth.setup.integration.spec.ts
```

### E2E Verification Tests

Run E2E verification tests:
```bash
pnpm test:playwright tests/e2e/auth/test-auth-setup-verification.spec.ts
```

### Performance Tests

Run performance tests:
```bash
pnpm test:playwright tests/infrastructure/playwright/setup/auth.setup.performance.spec.ts
```

## Related Documentation

- [Playwright Storage State Documentation](https://playwright.dev/docs/auth#reuse-authentication-state)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## History

### Fix CDN Timeout Issue

Previously, the auth setup used dynamic CDN imports (`import('https://esm.sh/@supabase/supabase-js@2')`) which would consistently timeout after 30 seconds. This was fixed by:

1. Using API-based authentication via `getSession()` helper
2. Setting localStorage directly instead of using browser-side Supabase client
3. Eliminating all CDN dependencies

The new implementation completes in <10 seconds and is much more reliable.

