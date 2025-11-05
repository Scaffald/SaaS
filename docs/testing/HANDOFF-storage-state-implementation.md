# Playwright Storage State Implementation - Handoff Document

**Date**: 2025-11-05
**Status**: ⚠️ **Partial Implementation** - Root cause identified, solution designed, implementation blocked by authentication issues

---

## Executive Summary

We successfully identified the root cause of 140+ failing Playwright tests and designed the proper solution (Storage State). However, implementation hit authentication challenges that need to be resolved before tests can pass.

### What We Accomplished ✅

1. **Identified Root Cause** - See `docs/testing/auth-timeout-root-cause.md`
   - "Timeouts" are actually authentication rejections causing redirects
   - Manual localStorage doesn't properly initialize Supabase sessions
   - 401 errors cause immediate redirects that Playwright sees as timeouts

2. **Designed Proper Solution** - Playwright Storage State approach
   - Capture complete browser state after REAL authentication
   - Reuse authenticated states across all tests
   - Official Playwright pattern, faster and more reliable

3. **Created Infrastructure**
   - `tests/setup/` - Setup scripts for auth state generation
   - `tests/.auth/` - Directory for storage state files
   - Updated `playwright.config.ts` with setup dependencies
   - Created `tests/setup/create-auth-states.ts` - Standalone state creator

### What's Blocking Us ⚠️

**The authentication system itself is having issues:**

1. **Supabase API Timeouts** - 504 Gateway Timeout errors during sign-in
2. **Session Recognition** - Even when localStorage is set correctly, Supabase doesn't recognize it
3. **Redirect Loops** - Dashboard navigation causes redirects back to `/auth`

**These are the SAME issues the tests are experiencing**, which means we need to fix the underlying authentication system before Storage State will help.

---

## Technical Deep Dive

### Root Cause Analysis

See full details in `docs/testing/auth-timeout-root-cause.md`.

**TL;DR**:
- Tests set localStorage with session data
- Supabase JS SDK doesn't recognize manually-set localStorage
- First tRPC call returns 401 Unauthorized
- App redirects to `/auth`
- Playwright reports "timeout" because page redirected before loading

**Evidence**:
```
✅ Dashboard page loaded!
❌ Auth state: INITIAL_SESSION undefined  ← Supabase doesn't see our session
❌ 401 (Unauthorized) from tRPC
❌ Redirect to /auth
```

### Storage State Solution (Designed but Not Working Yet)

**Concept**:
```typescript
// 1. ONE-TIME: Create auth states by signing in FOR REAL
const context = await browser.newContext()
const page = await context.newPage()

// Perform REAL sign-in (UI or API)
await signInForReal(page)

// Save COMPLETE browser state (localStorage, cookies, IndexedDB, etc.)
await context.storageState({ path: 'tests/.auth/admin.json' })

// 2. REUSE in all tests
test.use({ storageState: 'tests/.auth/admin.json' })

test('my test', async ({ page }) => {
  // Already authenticated! Just navigate
  await page.goto('/dashboard')
  // Test continues...
})
```

**Benefits**:
- ✅ Official Playwright pattern
- ✅ Captures complete browser state (not just localStorage)
- ✅ Faster tests (no per-test authentication)
- ✅ More reliable (real auth, not simulated)

**Why It's Not Working**:
The "REAL sign-in" part is failing because authentication itself is broken:
- API endpoints timing out (504 errors)
- Sessions not being recognized even when set correctly
- Dashboard redirecting to auth

---

## Files Created

### Documentation
- `docs/testing/auth-timeout-root-cause.md` - Complete root cause analysis
- `docs/testing/HANDOFF-storage-state-implementation.md` - This file

### Test Infrastructure
- `tests/setup/auth.setup.ts` - Playwright setup file (not working yet)
- `tests/setup/create-auth-states.ts` - Standalone state creator
- `tests/.auth/` - Directory for auth state files (empty - creation failed)

### Configuration
- `playwright.config.ts` - Updated with setup project and storage state configuration

### Debug Files (Can be deleted)
- `tests/debug-auth.spec.ts`
- `tests/debug-storage-key.spec.ts`
- `tests/debug-localstorage-format.spec.ts`
- `tests/debug-supabase-global.spec.ts`
- `tests/debug-auth-fixed.spec.ts`
- `tests/debug-real-signin.spec.ts`
- `.playwright-mcp/debug-*.png`

---

## Next Steps

### Immediate Action Required

**Before Storage State will work, we need to fix the underlying authentication**:

#### 1. Debug Why Supabase API is Timing Out (504 errors)

Check if Supabase is running properly:
```bash
pnpm supa status
curl http://127.0.0.1:54321/health
```

If Supabase is having issues, restart it:
```bash
pnpm supa stop
pnpm supa start
```

#### 2. Fix the Session Recognition Issue

The problem:
- We set `localStorage['sb-127-0-0-1-auth-token']` with correct session data
- Supabase still reports `INITIAL_SESSION undefined`
- Sessions aren't being recognized

**Possible causes**:
- Wrong localStorage key format
- Missing required fields in session data
- Supabase version incompatibility
- Need to use Supabase's `setSession()` API instead of manual localStorage

**Investigation needed**:
```typescript
// Test if we can sign in through the UI manually
// Then inspect what localStorage keys Supabase actually creates
// Compare to what our helpers are setting
```

#### 3. Fix Dashboard Redirect Loop

Even when localStorage is set, navigating to `/dashboard` causes redirect to `/auth`.

**Check**:
- Is there middleware protecting `/dashboard`?
- Is the auth check happening before Supabase initializes?
- Are there RLS policies blocking the dashboard query?

### After Auth is Fixed

Once authentication works properly, Storage State implementation is straightforward:

1. **Create Auth States**:
   ```bash
   npx tsx tests/setup/create-auth-states.ts
   ```
   This should create:
   - `tests/.auth/admin.json`
   - `tests/.auth/user.json`
   - `tests/.auth/super-admin.json`

2. **Verify State Files Work**:
   Create a simple test:
   ```typescript
   import { test, expect } from '@playwright/test'

   test.use({ storageState: 'tests/.auth/admin.json' })

   test('should be authenticated', async ({ page }) => {
     await page.goto('/dashboard')
     await expect(page).toHaveURL(/dashboard/)
   })
   ```

3. **Update All Test Files** (7 files):
   - Remove `signInAsAdmin()` calls from `beforeEach`
   - Tests will automatically use storage state from config
   - Keep the sign-in helper for reference but it won't be called

4. **Run Full Test Suite**:
   ```bash
   pnpm exec playwright test --project=chromium
   ```

5. **Expected Result**: 140+ tests should now pass!

---

## Alternative Approaches

If Storage State continues to have issues, consider:

### Option A: Fix the Existing Auth Helper

Instead of Storage State, fix the current localStorage approach:

1. Find the EXACT localStorage keys Supabase uses
2. Replicate the EXACT data structure
3. Ensure Supabase reads it properly

**Pros**: Simpler, uses existing helper
**Cons**: Slower (auth per test), less official

### Option B: Use Supabase's Test Helpers

Check if Supabase provides official test utilities:
- `@supabase/supabase-js` might have test helpers
- Could use `supabase.auth.setSession()` if we can expose the client

**Pros**: Official approach
**Cons**: Might not exist

### Option C: Mock the Auth System

Use Playwright's route mocking to intercept auth calls:
```typescript
await page.route('**/auth/v1/**', route => {
  route.fulfill({ /* mock response */ })
})
```

**Pros**: Fast, reliable
**Cons**: Not testing real auth, complex to set up

---

## Key Learnings

1. **The "timeout" error was misleading** - It's actually an auth rejection + redirect

2. **Manual localStorage is insufficient** - Supabase JS SDK needs more than just localStorage to initialize properly

3. **Storage State is the right solution** - But only if we can authenticate successfully first

4. **Authentication must work before tests can** - Can't test what isn't working

---

## Questions to Answer

Before proceeding, we need to understand:

1. **Why is Supabase returning 504 timeouts?**
   - Is the service overloaded?
   - Are there rate limits?
   - Is Docker having issues?

2. **What's the correct way to restore a Supabase session?**
   - What localStorage keys does Supabase actually use?
   - What's the complete data structure required?
   - Can we use `supabase.auth.setSession()` in tests?

3. **Why does dashboard redirect even with valid localStorage?**
   - Is there a race condition?
   - Is Supabase initialized too late?
   - Are there additional auth checks?

---

## Recommended Path Forward

### Phase 1: Fix Authentication (Priority 1)

1. Restart Supabase and verify it's healthy
2. Test manual sign-in through the UI - does it work?
3. If UI sign-in works, inspect localStorage to see what Supabase creates
4. Update our helpers to match EXACTLY what Supabase creates
5. Test that helpers work outside of tests (standalone script)

### Phase 2: Complete Storage State (After Auth Works)

1. Run `npx tsx tests/setup/create-auth-states.ts` successfully
2. Verify `tests/.auth/*.json` files are created
3. Test one file with storage state
4. Update all 7 test files
5. Run full suite

### Phase 3: Cleanup and Documentation

1. Delete debug test files
2. Update README with new auth approach
3. Document how to regenerate auth states
4. Add to CI/CD pipeline

---

## Contact Points

**Files to Reference**:
- Root Cause: `docs/testing/auth-timeout-root-cause.md`
- This Document: `docs/testing/HANDOFF-storage-state-implementation.md`
- Auth Helpers: `tests/playwright-helpers/auth.ts`
- Setup Script: `tests/setup/create-auth-states.ts`
- Config: `playwright.config.ts`

**Key Insights**:
- Authentication is broken at a fundamental level
- Storage State is the right approach but needs working auth first
- The solution is designed and partially implemented
- Just needs auth system debugging to complete

---

**Status**: Ready for authentication debugging. Once auth works, Storage State implementation can be completed quickly.
