# Playwright Tests

This directory contains Playwright E2E tests for the SCF-Neue application using Supabase authentication.

## Setup

1. **Install Playwright** (if not already installed):
   ```bash
   pnpm add -D @playwright/test
   pnpm exec playwright install
   ```

2. **Start Supabase**:
   ```bash
   pnpm supa start
   ```

3. **Start the development server**:
   ```bash
   pnpm web
   ```

## Running Tests

```bash
# Run all tests
pnpm exec playwright test

# Run tests in headed mode
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/example-auth.spec.ts

# Debug tests
pnpm exec playwright test --debug
```

## Authentication Helpers

We provide Supabase authentication helpers similar to Clerk's `@clerk/playwright`:

### Available Functions

```typescript
import {
  signInAsUser,
  signInAsTestUser,
  signInAsAdmin,
  getBearerToken,
  getRegularUserToken,
  getAdminToken,
  TEST_USERS,
} from './playwright-helpers/auth'
```

### Quick Login

```typescript
// Login with seeded test user
await signInAsTestUser(page)

// Login with admin
await signInAsAdmin(page)

// Login with custom credentials
await signInAsUser(page, email, password)
```

### Get Bearer Token for API Testing

```typescript
// Get token for API requests
const token = await getBearerToken(email, password)

// Or use convenience functions
const token = await getRegularUserToken()
const adminToken = await getAdminToken()
```

## Test Users

Pre-seeded users available in your Supabase database:

```typescript
TEST_USERS = {
  regular: {
    email: 'testuser1@example.com',
    password: 'TestUser123!',
  },
  admin: {
    email: 'ewongagent@gmail.com',
    password: 'password123',
  },
  superAdmin: {
    email: 'zach@unicorn.love',
    password: 'password123',
  },
}
```

## Example Usage

See `example-auth.spec.ts` for complete examples of:
- Page authentication tests
- API request testing with bearer tokens
- Different user role testing

## Configuration

Create `playwright.config.ts` in the root to customize:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8081',
    headless: false,
  },
  projects: [
    {
      name: 'authenticated',
      use: {
        storageState: 'tests/.auth/user.json',
      },
    },
  ],
})
```

## Differences from Clerk

Unlike Clerk's `@clerk/playwright`, Supabase doesn't provide an official testing helper. Our custom implementation:

- ✅ Provides similar API to Clerk's helpers
- ✅ Works with Supabase auth
- ✅ Supports bearer tokens for API testing
- ✅ Integrates with your seeded test users
- ⚠️  Requires manual storage state management (unlike Clerk's automatic handling)



