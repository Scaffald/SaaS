# REQ-82: Fix React App Rendering in Playwright Tests - Progress Summary

**Date**: November 6, 2025
**Status**: In Progress (Task 1 ✅ Complete, Task 4 🔍 In Progress)
**Priority**: P0 - Critical (Blocks REQ-65 completion)

---

## Executive Summary

Playwright tests fail with "You need to enable JavaScript" message, but investigation reveals **JavaScript loads and executes correctly**. The real issue is the **React app renders empty content** (98-byte empty flexbox) due to a **route protection hook failure**.

---

## Completed Work

### ✅ Task 1: Debug Authentication State Loading (COMPLETED)

**Finding**: Authentication token storage works perfectly!

#### What Works:
- ✅ Storage state from `tests/.auth/super-admin.json` loads correctly
- ✅ localStorage has `sb-127-auth-token` key with 1613-byte valid JWT
- ✅ Token contains valid Supabase session for super-admin user (ID: `00000000-0000-0000-0000-000000000001`)
- ✅ No redirects - URL stays on `/office/organizations`
- ✅ No error alerts or console errors

#### What Doesn't Work:
- ❌ React `#root` renders only 98 bytes (empty flexbox div)
- ❌ No office layout, organizations table, or page content
- ❌ `useRoleProtectedRoute` hook returns `isAuthorized=false`

**Debug Test Created**: `tests/debug-js-loading.spec.ts` with comprehensive auth state checking

**Files Modified**:
- `tests/debug-js-loading.spec.ts` - Added auth debugging test with localStorage/sessionStorage checks
- Screenshot: `.playwright-mcp/admin-debug-auth-state.png`

**Conclusion**: Auth token storage is NOT the problem. Issue is in route protection logic.

---

## Current Investigation

### 🔍 Task 4: Verify Routing and Route Protection (IN PROGRESS)

**Root Cause Identified**: `useRoleProtectedRoute` hook chain failure

#### Auth Flow Chain:

```
1. ✅ localStorage → sb-127-auth-token (WORKS)
2. ✅ Supabase session stored in token (WORKS)
3. ❌ useUserRoles() → api.auth.getUserRoles.useQuery() (FAILS)
4. ❌ tRPC query to fetch roles from database (NOT EXECUTING)
5. ❌ useRoleProtectedRoute() → isAuthorized=false (FAILS)
6. ❌ Office layout returns null → empty content (RENDERS NOTHING)
```

#### Code Path Analysis:

**1. Office Layout Protection** (`apps/expo/app/office/_layout.tsx:7-22`):
```typescript
const { isAuthorized, isLoading } = useRoleProtectedRoute(['office'])

if (isLoading) {
  return <Spinner />  // Loading spinner
}

if (!isAuthorized) {
  return null  // ← RETURNS EMPTY CONTENT!
}

return <DrawerLayout>...</DrawerLayout>
```

**2. Role Protection Hook** (`packages/core/utils/auth/useRoleProtectedRoute.ts:6-12`):
```typescript
const { isAuthenticated, isLoading: authLoading } = useProtectedRoute()
const { roles, isLoading: rolesLoading } = useUserRoles()  // ← PROBLEM HERE

const hasRequiredRole = requiredRoles.some((role) => roles.includes(role))
const isLoading = authLoading || rolesLoading

return {
  isAuthorized: hasRequiredRole,  // ← Returns false
  isLoading,
  roles,
}
```

**3. User Roles Hook** (`packages/core/utils/auth/useUserRoles.ts:5-18`):
```typescript
const { data, isLoading, error } = api.auth.getUserRoles.useQuery()  // ← tRPC QUERY

useEffect(() => {
  if (!isLoading) {
    console.log("[useUserRoles] Loading complete", {  // ← LOGS DON'T APPEAR!
      roles: data?.roles,
      hasRoles: !!data?.roles?.length,
      error: error?.message,
    })
  }
}, [isLoading, data, error])

return {
  roles: data?.roles ?? [],  // ← Returns empty array
  isLoading,
}
```

#### Key Evidence:

**Console Logs Missing**:
- ❌ No `[useUserRoles] Loading complete` logs appear
- ❌ No `[useRoleProtectedRoute] State check` logs appear
- ✅ React initialization logs DO appear: "Running application 'main'"
- ✅ Supabase logs DO appear: "[web] Supabase URL: http://127.0.0.1:54321"

**This proves**: The hooks are either not running OR stuck in `isLoading=true` state.

#### Root Cause Hypothesis:

The **tRPC query `api.auth.getUserRoles.useQuery()` is not executing** in Playwright tests. Possible causes:

1. **React Query Context Not Initialized**: The QueryProvider may not be wrapping the app properly in test environment
2. **tRPC Client Not Using Auth Token**: tRPC client may not read from `sb-127-auth-token` localStorage key
3. **Supabase Client Not Initialized**: The tRPC endpoint depends on Supabase client having an active session
4. **Query Suspended/Hanging**: The query may be waiting for something that never resolves in tests

#### Next Steps:

1. **Debug tRPC Context**: Add logging to see if React Query provider is initialized
2. **Check tRPC Auth Headers**: Verify if auth token is being sent in tRPC requests
3. **Inspect Network**: Check if `getUserRoles` API call is being made
4. **Test Database Connection**: Verify Supabase is accessible from the test environment

---

## Pending Tasks

### Task 2: Fix Test Selectors (body → #root) - NOT STARTED
**Blocked by**: Need React to render content first

**What needs to change**:
```typescript
// BEFORE (incorrect):
const pageContent = await page.locator('body').textContent()
expect(pageContent).toMatch(/organizations/i)

// AFTER (correct):
const rootContent = await page.locator('#root').textContent()
expect(rootContent).toMatch(/organizations/i)
```

**Why**: The `<noscript>` tag is outside `#root`, causing false positives when checking `body.textContent()`.

**Files to update**:
- `tests/test-office-organizations.spec.ts`
- `tests/test-office-jobs.spec.ts`
- `tests/test-office-applications-kanban.spec.ts`
- `tests/test-office-users.spec.ts`

---

### Task 3: Add Proper Content Waiting - NOT STARTED
**Blocked by**: Need React to render content first

**What needs to change**:
Replace arbitrary `waitForTimeout()` with meaningful waits:

```typescript
// Option 1: Wait for specific element
await page.waitForSelector('[data-testid="organizations-table"]', { timeout: 10000 })

// Option 2: Wait for substantial content
await page.waitForFunction(
  () => document.querySelector('#root')?.innerHTML.length > 500,
  { timeout: 10000 }
)

// Option 3: Wait for network idle
await page.goto('http://localhost:8081/office/organizations')
await page.waitForLoadState('networkidle')
```

**Why**: Tests need to wait for React to render content, not just arbitrary time delays.

---

## Related Issues

### REQ-65: Organization Forms Testability
**Status**: BLOCKED by REQ-82
**Reason**: Cannot test organization forms until React renders content

**Blocked Tasks**:
- Task 4: Debug organization save/update timing issues
- Task 5: Verify all organization tests pass and document patterns

---

## Technical Details

### Test Environment:
- **Browser**: Chromium via Playwright
- **URL**: `http://localhost:8081/office/organizations`
- **Auth**: Storage state from `tests/.auth/super-admin.json`
- **User**: Super admin (zach@unicorn.love, ID: 00000000-0000-0000-0000-000000000001)

### Expected Behavior:
1. Page loads with auth token in localStorage
2. React initializes and renders office layout
3. `useUserRoles` fetches roles from database via tRPC
4. `useRoleProtectedRoute` verifies user has 'office' role
5. Office layout renders with organizations table

### Actual Behavior:
1. ✅ Page loads with auth token in localStorage
2. ✅ React initializes successfully
3. ❌ `useUserRoles` tRPC query doesn't execute (no logs)
4. ❌ `useRoleProtectedRoute` returns `isAuthorized=false` (no roles found)
5. ❌ Office layout returns `null` → empty 98-byte flexbox

---

## Files Modified

### Created:
- `docs/testing/PLAYWRIGHT-JS-LOADING-INVESTIGATION.md` - Initial investigation
- `docs/testing/test-a082-summary.md` - This file (progress summary)
- `tests/debug-js-loading.spec.ts` - Debug test with auth checks
- `.playwright-mcp/admin-debug-auth-state.png` - Screenshot evidence

### Read for Investigation:
- `apps/expo/app/office/_layout.tsx` - Route protection logic
- `apps/expo/app/office/organizations/index.tsx` - Organizations route
- `packages/core/utils/auth/useRoleProtectedRoute.ts` - Role protection hook
- `packages/core/utils/auth/useUserRoles.ts` - User roles hook (tRPC query)
- `tests/.auth/super-admin.json` - Auth storage state file

---

## Commits

1. **1d499b7** - docs: Add BrainGrid integration requirements and Playwright investigation
2. **5c22703** - feat(tests): enhance debug test with comprehensive auth state checking

---

## Next Actions

1. ✅ **Immediate**: Debug why tRPC query isn't executing
2. **Short term**: Fix or bypass role checking for tests
3. **Medium term**: Complete Tasks 2-3 once content renders
4. **Long term**: Ensure role-based access control works in all test scenarios

---

**Last Updated**: November 6, 2025, 7:45 PM
**Investigator**: Claude Code (Sonnet 4.5)
**Related Requirements**: REQ-82 (P0), REQ-65 (blocked), REQ-72 (completed)
