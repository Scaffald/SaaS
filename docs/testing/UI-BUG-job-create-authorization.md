# UI Bug: Job Create Route Authorization Failure

**Date**: 2025-11-05
**Status**: 🔴 **CRITICAL BUG** - Blocks 10 tests
**Priority**: P0 - Critical
**Filed as**: REQ-64

---

## Problem Summary

The `/office/jobs/create` route redirects authenticated super-admin users (with 'office' role) to the sign-in page, preventing job creation functionality.

### Impact
- **Users affected**: Office administrators
- **Functionality blocked**: Cannot create new jobs
- **Tests blocked**: 10 Playwright tests failing
- **Workaround**: None - route completely inaccessible

---

## Evidence

### Test Results
```bash
✅ Jobs List Tests (6/6 passing)
  ✓ should load jobs list page successfully
  ✓ should display create job button
  ✓ should display search input
  ✓ should display jobs table with data
  ✓ should filter jobs using search
  ✓ should display edit button for each job

❌ Create Job Tests (0/10 passing)
  ✘ should load create job form
  ✘ should display all required form fields
  ✘ should display pay range fields
  ✘ should display position level field
  ✘ should display form action buttons
  ✘ should create job as draft successfully
  ✘ should validate required fields
  ✘ should load edit job form with existing data
  ✘ should cancel edit without saving changes
  ✘ should update job title successfully
```

### Screenshots
![Job Create Redirect](../../../test-results/test-office-jobs-Office-•--19d3f-ay-all-required-form-fields-chromium/test-failed-1.png)

**What we see**: Sign-in page instead of job creation form

### Authentication Details
- **User**: Zach (zach@unicorn.love)
- **User ID**: 00000000-0000-0000-0000-000000000001
- **Roles**: `worker` + `office` ✅
- **Storage State**: `tests/.auth/super-admin.json`
- **Auth Status**: ✅ Authenticated successfully
- **Other Office Routes**: ✅ Working (`/office/jobs`, `/office/users`, `/office/organizations`)

---

## Root Cause Analysis

### Working Routes
- `/office/jobs` - Jobs list page ✅
- `/office/users` - Users list ✅
- `/office/organizations` - Organizations list ✅

### Failing Routes
- `/office/jobs/create` - Redirects to sign-in ❌
- `/office/jobs/{id}/edit` - Redirects to sign-in ❌

### Hypothesis
The issue appears to be specific to job **create** and **edit** routes, not the jobs list route. This suggests:
1. Additional authorization check on create/edit pages
2. Different role requirement for create/edit operations
3. Missing route configuration for create/edit pages
4. Bug in route protection middleware for dynamic routes

### Files to Investigate
```
packages/core/features/office/jobs/
├── office-jobs-screen.tsx (list - working)
├── office-jobs-create-screen.tsx (create - broken)
└── office-jobs-[id]-edit-screen.tsx (edit - broken)
```

**Key Question**: Do create/edit screens have additional `useRoleProtectedRoute()` checks or different role requirements?

---

## Expected Behavior

1. User with 'office' role navigates to `/office/jobs`
2. User clicks "Create Job" button
3. User navigates to `/office/jobs/create`
4. **Expected**: Job creation form loads
5. **Actual**: Redirected to sign-in page

---

## Technical Details

### Test Configuration
```typescript
// tests/test-office-jobs.spec.ts
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Storage state contains valid authenticated session
// with access_token, refresh_token, and user object
```

### Console Output
```
Signing in as admin...
Admin signed in successfully
Navigating to create job page...
[REDIRECT TO /auth/sign-in]
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
waiting for locator('[data-testid="job-organization-select"]') to be visible
```

### Data-testid Attributes
✅ **ALL selectors present** in `JobForm.tsx`:
- `job-organization-select`
- `job-title-input`
- `job-description-input`
- `job-pay-min-input`, `job-pay-max-input`
- `job-position-level-input`
- `job-save-draft-button`
- `job-cancel-button`
- `job-publish-button`
- ... and 4 more

**Conclusion**: Not a missing selector issue - the form never loads due to redirect

---

## Comparison: Organizations Create Route

Organization tests show 83% pass rate (19/23), with some create/edit tests passing:
```
✅ navigates to create organization page
✅ displays all required form fields
✅ creates organization successfully with all fields
✅ creates organization with minimal required fields
```

**Key Difference**: Organization create route (`/office/organizations/create`) works correctly with same auth state.

**Investigation Needed**: What's different between jobs and organizations route protection?

---

## Recommended Fix

1. **Investigate route protection**:
   ```bash
   # Check route protection in create screen
   grep -r "useRoleProtectedRoute" packages/core/features/office/jobs/
   ```

2. **Compare with working routes**:
   ```bash
   # Compare jobs vs organizations protection
   diff packages/core/features/office/jobs/office-jobs-create-screen.tsx \
        packages/core/features/office/organizations/office-organizations-create-screen.tsx
   ```

3. **Verify _layout.tsx**:
   ```bash
   # Check if create routes have additional layout protection
   find packages/core/features/office -name "_layout.tsx" -exec grep -l "useRoleProtectedRoute" {} \;
   ```

4. **Check router configuration**:
   - Verify Expo Router file-based routing
   - Ensure create routes inherit office role protection
   - Check for any route-specific middleware

---

## Test Actions

### Blocked Tests (10)
All create/edit flow tests in `tests/test-office-jobs.spec.ts`:
- Lines 151-160: should load create job form
- Lines 162-186: should display all required form fields
- Lines 189-199: should display pay range fields
- Lines 202-206: should display position level field
- Lines 209-218: should display form action buttons
- Lines 221-295: should create job as draft successfully
- Lines 297-356: should validate required fields
- Lines 360-406: should load edit job form with existing data
- Lines 409-479: should cancel edit without saving changes
- Lines 376-406: should update job title successfully

### Temporary Solution
```typescript
// Skip blocked tests until REQ-64 is resolved
test.describe.skip('Create Job Flow', () => {
  // BLOCKED: REQ-64 - /office/jobs/create redirects to sign-in
  // Route authorization issue for create/edit pages
  // ...tests...
})

test.describe.skip('Edit Job Flow', () => {
  // BLOCKED: REQ-64 - /office/jobs/{id}/edit redirects to sign-in
  // ...tests...
})
```

---

## Success Criteria

1. ✅ Super-admin user can navigate to `/office/jobs/create`
2. ✅ Job creation form loads without redirect
3. ✅ All form fields visible and functional
4. ✅ User can create jobs as draft
5. ✅ User can create jobs as published
6. ✅ User can navigate to `/office/jobs/{id}/edit`
7. ✅ Job edit form loads with existing data
8. ✅ All 10 blocked tests pass

---

## Related Issues

- **REQ-2**: Comprehensive Playwright Testing for Office Admin Routes (parent)
- **REQ-63**: Missing office.applications.list API endpoint (Kanban blocker)
- **Task 21**: Fix Kanban modal tests (blocked by REQ-63)
- **Task 22**: Job form tests (blocked by REQ-64)

---

## Timeline

- **Discovered**: 2025-11-05, during Task 22 investigation
- **Filed**: 2025-11-05
- **Estimated Fix**: 2-4 hours
- **Priority**: P0 - Critical (blocks user functionality + 10 tests)

---

## Notes

- Jobs **list** route works perfectly - only create/edit broken
- Same auth state works for organizations create/edit
- No missing data-testid attributes - pure authorization issue
- Affects production functionality, not just tests
