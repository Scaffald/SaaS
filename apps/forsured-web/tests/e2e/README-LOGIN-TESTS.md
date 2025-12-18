# Login Flow E2E Tests

## Overview

The login flow tests (`login-flow.spec.ts`) test the complete authentication flow for Forsured using **real Supabase and Mailpit**. These tests verify that:

1. Users can submit their email on the Start page
2. Magic link emails are sent and captured in Mailpit
3. Users can click magic links to authenticate
4. New users are redirected to signup
5. Existing users are redirected to their dashboard

## Environment Variables

### Development Environment Detection

The codebase uses **`NODE_ENV`** to determine the environment:
- `NODE_ENV=development` - Development mode
- `NODE_ENV=production` - Production mode
- `NODE_ENV=test` - Test mode

**Location**: `apps/forsured-web/src/server/env.ts`

### Authentication Mode

The authentication mode is controlled by **`VITE_FORSURED_USE_OAUTH`**:
- `VITE_FORSURED_USE_OAUTH=false` (default) - Uses magic link flow (Supabase Auth)
- `VITE_FORSURED_USE_OAUTH=true` - Uses Scaffald OAuth flow

**Locations**:
- `apps/forsured-web/src/pages/Start.tsx`
- `apps/forsured-web/src/pages/Callback.tsx`
- `apps/forsured-web/src/lib/auth/oauth.ts`

## Mailpit Configuration

### Mailpit URL

**Mailpit runs on**: `http://127.0.0.1:54324`

This is configured in:
- `packages/scf-supabase/config.toml` (port 54324)
- `apps/forsured-web/tests/utils/mailpit.ts` (default URL)

### Accessing Mailpit

1. **Via Supabase CLI**: `pnpm supa:mailpit` (opens web UI)
2. **Direct URL**: http://127.0.0.1:54324
3. **API**: http://127.0.0.1:54324/api/v1/messages

### Environment Variable

You can override the Mailpit URL with:
```bash
MAILPIT_URL=http://127.0.0.1:54324
```

## Test Requirements

### Prerequisites

1. **Local Supabase running**:
   ```bash
   pnpm supa start
   ```

2. **Mailpit running** (automatically started with Supabase):
   - Verify: `curl http://127.0.0.1:54324/api/v1/messages`
   - Or open: http://127.0.0.1:54324

3. **Automatic Service Waiting**:
   - ✅ **Tests automatically wait for services to be ready**
   - The global setup (`tests/global-setup.ts`) checks Supabase API, Auth, and Mailpit
   - Tests will wait up to 30 attempts with exponential backoff
   - No manual waiting required - just start Supabase and run tests!

4. **Environment variables**:
   ```bash
   VITE_FORSURED_USE_OAUTH=false  # Use magic link mode
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

4. **Migrations applied**:
   - All migrations must be applied (including RPC functions for user_profiles)

### Running Tests

```bash
# Run all login flow tests
pnpm test:playwright tests/e2e/login-flow.spec.ts

# Run specific test
pnpm test:playwright tests/e2e/login-flow.spec.ts -g "new user can submit email"
```

## Test Coverage

### Current Tests

✅ **Email Submission**: Verifies users can submit email and receive magic link  
✅ **Magic Link Flow**: Tests complete login flow from email to signup  
⏭️ **Existing User Login**: Skipped (requires test data setup)  
✅ **Scaffald OAuth Button**: Tests OAuth button functionality  
✅ **Form Validation**: Tests email validation  
✅ **Loading States**: Tests UI feedback during submission  
✅ **Error Handling**: Tests network errors and invalid links  

### What's Tested

1. **Start Page** (`/start`):
   - Email input form
   - "Continue with Email" button
   - "Continue with Scaffald Account" button
   - Form validation
   - Loading states

2. **Magic Link Flow**:
   - Email sent to Mailpit
   - Magic link extraction from email
   - Authentication via magic link
   - Redirect to callback
   - Profile creation
   - Redirect to signup (new users)

3. **Error Handling**:
   - Network failures
   - Invalid magic links
   - Missing parameters

## Test Utilities

### Mailpit Helpers

Located in `apps/forsured-web/tests/utils/mailpit.ts`:

- `getLatestEmail(recipient, timeout)` - Get latest email for recipient
- `extractMagicLinkFromEmail(emailBody)` - Extract magic link from email HTML/text
- `clearMailpit()` - Clear all emails (test cleanup)

### Usage Example

```typescript
import { getLatestEmail, extractMagicLinkFromEmail } from '../utils/mailpit';

// Get email from Mailpit
const email = await getLatestEmail('test@example.com', 10000);

// Extract magic link
const magicLink = extractMagicLinkFromEmail(email.body.html || email.body.text || '');

// Navigate to magic link
await page.goto(magicLink);
```

## Comparison with Existing Tests

### Old Tests (`auth.spec.ts`)

The old tests in `auth.spec.ts` were **skipped** because they:
- Used mocked OAuth flow
- Required complex Supabase setup
- Didn't test real email delivery

### New Tests (`login-flow.spec.ts`)

The new tests:
- ✅ Use **real Supabase** and **real Mailpit**
- ✅ Test **actual email delivery**
- ✅ Test **complete magic link flow**
- ✅ Verify **real authentication**
- ✅ Test **profile creation**
- ✅ Test **redirect logic**

## Future Improvements

1. **Test Data Setup**: Create helper to set up test users with completed onboarding
2. **OAuth Tests**: Add tests for OAuth flow when `VITE_FORSURED_USE_OAUTH=true`
3. **Existing User Tests**: Enable and complete existing user login tests
4. **Performance Tests**: Test email delivery time and redirect speed
5. **Edge Cases**: Test expired links, rate limiting, etc.

## Troubleshooting

### Tests Fail: "Email not found in Mailpit"

1. Verify Mailpit is running: `curl http://127.0.0.1:54324/api/v1/messages`
2. Check Supabase is running: `pnpm supa status`
3. Increase timeout in test: `getLatestEmail(email, 20000)`
4. Check email was actually sent (check Supabase logs)

### Tests Fail: "Magic link not found"

1. Check email HTML/text content in Mailpit UI
2. Verify magic link format matches expected pattern
3. Check Supabase email template configuration

### Tests Fail: "Redirect timeout"

1. Verify callback handler is working
2. Check profile creation is successful
3. Verify redirect logic in `Callback.tsx`
4. Increase timeout: `toHaveURL(..., { timeout: 20000 })`

## Related Files

- `apps/forsured-web/tests/e2e/login-flow.spec.ts` - Main test file
- `apps/forsured-web/tests/utils/mailpit.ts` - Mailpit utilities
- `apps/forsured-web/src/pages/Start.tsx` - Login page
- `apps/forsured-web/src/pages/Callback.tsx` - Auth callback handler
- `apps/forsured-web/src/lib/auth/oauth.ts` - OAuth initiation
- `packages/scf-supabase/config.toml` - Mailpit configuration

