# TEST Ticket for /auth/verify

**Title:** test-admin-auth-verify: /auth/verify — Comprehensive Playwright tests

**Note:** This ticket could not be created in Vibe-Kanban due to API error. Create manually or retry later.

---

## Context
- **Discovered in**: `admin-route-explore-005` (de54c81a-3815-4f71-9e79-c94b02ee3bd3)
- **Route**: `/auth/verify`
- **User Level**: `admin`
- **User Credential**: `ewongagent@gmail.com`
- **Exploration Doc**: `.playwright-mcp/admin-005-auth-verify-exploration.md`

## Test File Location
- **Path**: `tests/test-a005-auth-verify.spec.ts`

## Route Overview

The `/auth/verify` route is an email verification screen for the magic link authentication flow. It displays a 6-digit OTP (One-Time Password) input interface for users to verify their email address.

### Key Behavioral Characteristics:
- **Auto-redirects when authenticated**: If a user is already authenticated, navigating to this route redirects them to `/dashboard`
- **Requires email parameter**: Designed to be accessed with an `email` query parameter (e.g., `/auth/verify?email=test@example.com`)
- **Part of magic link flow**: This is not a standalone page - it's a step in the authentication journey

## Test Coverage Requirements

### Core Functionality Tests
- [ ] **Authenticated User Redirect**: Verify that an authenticated user is redirected to `/dashboard`
- [ ] **Email Verification UI**: Confirm UI renders correctly with email parameter
- [ ] **6-Digit OTP Input**: Test that the code input accepts 6 digits and auto-submits
- [ ] **Email Header Display**: Verify email address is shown in the header
- [ ] **Resend Timer**: Test countdown timer and resend button functionality
- [ ] **Error Handling**: Test error messages for invalid/expired codes
- [ ] **Success State**: Verify success animation and redirect to `/auth/success`
- [ ] **Loading State**: Confirm spinner displays during OTP verification

### Edge Cases
- [ ] Missing email parameter handling
- [ ] Direct access without authentication context
- [ ] Network failure scenarios
- [ ] Code expiration handling
- [ ] Rate limiting on verification attempts

## Key UI Elements to Test

### Main Container
- Centered card with border (max-width: 450px)
- Rounded corners with proper padding
- Responsive layout

### Code Input Component
- 6-digit input fields
- Auto-submit on completion
- Visual feedback on entry
- Clear on error

### Email Header
- Displays verification message
- Shows email address or fallback text

### Resend Timer
- Countdown display before enabling resend
- Clickable resend button
- Triggers new OTP request

### Error Display
- Red text for errors
- User-friendly error messages:
  - "Invalid verification code"
  - "Code has expired"
  - "Too many attempts"

### Success State
- Green checkmark icon
- "Success" text
- Smooth animation
- Auto-redirect

### Loading State
- Full-screen spinner
- Appears during verification

## Test Implementation Strategy

### Challenge
This route is tightly integrated with the authentication flow and is designed to be accessed by unauthenticated users who are in the middle of signing in. Testing this route in isolation presents challenges:

1. **Unauthenticated Context**: Most tests use authenticated helpers, but this route needs unauthenticated access
2. **Email Parameter Dependency**: The route requires an email parameter from the previous auth step
3. **OTP Token**: Real OTP verification requires valid tokens from Supabase

### Recommended Approaches

**Option 1: Integration Test**
Test this route as part of the complete magic link authentication flow in `tests/test-r001-auth.spec.ts`:
- User requests sign-in
- User receives OTP
- User enters OTP on `/auth/verify`
- User is redirected to dashboard

**Option 2: Standalone Test with Mocking**
Create standalone tests but mock the authentication state:
- Test redirect behavior with authenticated user (easy)
- Test UI rendering with unauthenticated context (requires careful setup)

**Option 3: Minimal Coverage**
Only test the redirect behavior (authenticated user → dashboard) as this can be easily tested with existing helpers.

### Recommended: Option 1 (Integration Test)
This route's value is best demonstrated in the context of the complete authentication flow. Consider enhancing `tests/test-r001-auth.spec.ts` to cover this route rather than creating a standalone test file.

## Sample Test Structure

```typescript
// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

test.describe('Admin • /auth/verify', () => {
  test('redirects authenticated user to dashboard', async ({ page }: { page: Page }) => {
    // Sign in first
    await signInAsAdmin(page)

    // Navigate to verify route
    await page.goto('/auth/verify', { waitUntil: 'domcontentloaded' })

    // Wait for redirect
    await page.waitForTimeout(2000)

    // Should redirect to dashboard
    expect(page.url()).toContain('/dashboard')
  })

  // Additional tests would require unauthenticated context
  // Consider testing in full auth flow instead
})
```

## Related Files

### Route Implementation
- `apps/expo/app/auth/verify.tsx` - Route file
- `packages/core/features/auth/components/MagicLinkPending.tsx` - Main component

### Sub-components
- `CodeConfirmation` - 6-digit OTP input
- `EmailHeader` - Email display and instructions
- `ResendTimer` - Countdown and resend button

### Related Tests
- `tests/test-r001-auth.spec.ts` - Existing authentication flow tests

## Running Tests

```bash
# Run this specific test (if created standalone)
npx playwright test tests/test-a005-auth-verify.spec.ts

# Run all tests
npx playwright test

# Run with UI mode for debugging
npx playwright test tests/test-a005-auth-verify.spec.ts --ui

# Run with headed browser
npx playwright test tests/test-a005-auth-verify.spec.ts --headed
```

## Related Tickets
- **Exploration**: `admin-route-explore-005` (de54c81a-3815-4f71-9e79-c94b02ee3bd3) - DONE
- **Related Auth Test**: `test-r001-auth.spec.ts` (existing)

## Decision Required

Before implementing this test, decide:
1. **Standalone test file** vs. **integration into existing auth tests**?
2. If standalone, how to handle unauthenticated context?
3. Is testing the redirect behavior alone sufficient?

**Recommendation**: Integrate into `test-r001-auth.spec.ts` as part of the complete magic link authentication flow for maximum value and minimal complexity.
