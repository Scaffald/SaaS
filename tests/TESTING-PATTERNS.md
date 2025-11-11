# Playwright Testing Patterns for SCF-Neue

## Critical Pattern: Authentication and Navigation

### ❌ INCORRECT Pattern (Causes Timeouts)

```typescript
test('should load dashboard', async ({ page }) => {
  await signInAsAdmin(page)

  // ❌ DON'T DO THIS - signInAsAdmin already navigated to /dashboard
  await page.goto('/dashboard')  // This triggers re-auth and causes 401 errors

  // Test will timeout here because app redirects to /auth
})
```

### ✅ CORRECT Pattern

```typescript
test('should load dashboard', async ({ page }) => {
  // ✅ signInAsAdmin() handles:
  //    1. Authentication
  //    2. Navigation to /dashboard
  //    3. Profile completion (if needed)
  await signInAsAdmin(page)

  // ✅ You're already on /dashboard - start testing!
  expect(page.url()).toContain('/dashboard')

  // Wait for loading states
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading...'),
    { timeout: 10000 }
  ).catch(() => {})

  // Test your UI
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

## Testing Different Routes from Dashboard

### Pattern 1: Testing a Sub-Route

```typescript
test('should navigate to profile', async ({ page }) => {
  await signInAsAdmin(page)  // Now on /dashboard

  // Navigate to sub-route from dashboard
  await page.goto('/dashboard/profile')

  // Test profile page
  await expect(page.getByText('Profile Information')).toBeVisible()
})
```

### Pattern 2: Testing Navigation Flow

```typescript
test('should navigate through menu', async ({ page }) => {
  await signInAsAdmin(page)  // Now on /dashboard

  // Click navigation elements
  await page.getByRole('link', { name: 'Discover' }).click()
  await page.waitForURL('**/discover')

  // Test discover page
  await expect(page.url()).toContain('/discover')
})
```

## Why This Matters

### The Problem

The `signInAsAdmin()` helper (in `tests/playwright-helpers/auth.ts`) already:

1. **Authenticates** the user with Supabase
2. **Sets auth state** in localStorage
3. **Navigates to** `/dashboard` (line 143: `await page.goto('/dashboard')`)
4. **Calls** `ensureAdminProfileComplete()` which handles profile completion
5. **Returns** with user on `/dashboard` and ready to test

When you call `page.goto('/dashboard')` AGAIN after `signInAsAdmin()`:
- The page reloads completely
- React Native Web re-initializes
- tRPC makes a fresh `prerequisites.check` call
- Gets 401 Unauthorized (session not properly re-initialized)
- App redirects to `/auth`
- Your test times out waiting for `/dashboard`

### The Diagnostic Evidence

From `scripts/diagnose-dashboard.mjs` output:

```
✅ Dashboard loaded in 2440ms
[CONSOLE error] Failed to load resource: the server responded with a status of 401 (Unauthorized)
[CONSOLE log] [tRPC] UNAUTHORIZED error detected - invalid or expired session
[CONSOLE log] [tRPC] Triggering comprehensive auth cleanup and redirect
```

The dashboard loads fine (2.4s), but the second navigation triggers auth invalidation.

## Working Examples

### ✅ test-a001-root.spec.ts (WORKING)

```typescript
test('navigates to dashboard and page loads correctly', async ({ page }) => {
  await signInAsAdmin(page)  // Auth + navigate + profile completion

  // ✅ NO additional page.goto() call
  expect(page.url()).toContain('/dashboard')

  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading...'),
    { timeout: 10000 }
  ).catch(() => {})

  const pageContent = await page.locator('body').textContent() || ''
  expect(pageContent.length).toBeGreaterThan(0)
})
```

## Quick Reference

| Scenario | Correct Approach |
|----------|------------------|
| Test `/dashboard` | `await signInAsAdmin(page)` - You're already there! |
| Test `/dashboard/profile` | `await signInAsAdmin(page)` then `await page.goto('/dashboard/profile')` |
| Test navigation | `await signInAsAdmin(page)` then click nav elements |
| Test from `/auth` | Don't use `signInAsAdmin()` - manually test auth flow |

## Helper Function Behavior

### signInAsAdmin(page)
- **Returns**: Promise<void>
- **Side Effects**:
  - Authenticates user
  - Navigates to `/dashboard`
  - Completes profile if needed
- **Final State**: User on `/dashboard`, authenticated, profile complete

### signInAsTestUser(page)
- Same behavior as `signInAsAdmin` but for regular users
- Uses `ensureProfileComplete()` instead of `ensureAdminProfileComplete()`

## When to NOT Use signInAsAdmin()

If you're testing the authentication flow itself (like `/auth` page), don't use the helper:

```typescript
test('auth page shows email input', async ({ page }) => {
  // ❌ Don't use signInAsAdmin() - it bypasses the auth flow

  // ✅ Navigate directly to auth page
  await page.goto('/auth')

  // Test the auth UI
  await expect(page.getByPlaceholder(/email/i)).toBeVisible()
})
```

## Summary

**Golden Rule**: After `signInAsAdmin(page)` completes, you are on `/dashboard` and authenticated. Don't navigate again to `/dashboard` or you'll trigger re-authentication failures.
