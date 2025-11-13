# REQ-65 Implementation Plan
## Fix organization form selectors and save functionality

**Status**: IN_PROGRESS  
**Project ID**: 0f70d273-f528-4cc4-a1fa-8daab9111973  
**Requirement ID**: REQ-65

## Overview

Complete the remaining 2 tasks for REQ-65:
- **Task 4**: Debug and fix organization save/update timing issues
- **Task 5**: Verify all organization tests pass and document patterns

**Current Status**: 3/5 tasks completed (data-testid attributes added)  
**Target**: 5/5 tasks completed, 100% test pass rate (23/23 tests)

## Workflow

After each task completion:
1. Run `pnpm test` (format, lint, typecheck, vitest, API tests)
2. Run `pnpm check` (format, lint, typecheck)
3. If checks pass and new tests are passing:
   - Commit changes with descriptive message
   - Update BrainGrid task status to COMPLETED
   - Continue to next task automatically
4. If checks fail:
   - Fix issues before proceeding
   - Re-run checks until passing

When all tasks complete:
- Update REQ-65 status to REVIEW in BrainGrid

---

## Task 4: Debug and fix organization save/update timing issues

**Task ID**: 16f3c9c4-9361-48db-886b-4d03758180e9  
**Status**: PLANNED  
**Complexity**: 3/5  
**Readiness**: 4/5

### Goal
Fix timing or functionality issues causing organization create/update tests to fail, ensuring successful save operations and proper navigation.

### Failing Tests
1. **Line 235**: "creates organization successfully with all fields"
   - Issue: Navigation timing after form submission
   - Expected: Organization created, redirected to list, appears in search

2. **Line 432**: "updates organization name successfully"
   - Issue: Update mutation timing or navigation
   - Expected: Organization updated, redirected to list, updated name appears

3. **Line 489**: "cancel button on edit returns to list without saving changes"
   - Issue: Cancel button navigation
   - Expected: Navigates back to list without saving

### Potential Issues Identified

#### 1. Save Button Disabled State in Edit Mode
**Location**: `packages/core/features/office/components/OrganizationForm.tsx:335`
```typescript
disabled={!isDirty || isLoading}
```

**Problem**: In edit mode, when form is pre-populated with `initialData`, the form might not be considered "dirty" after `reset(initialData)` is called. This could prevent saving even when user makes changes.

**Solution**: 
- Ensure form properly tracks dirty state after user modifications
- Consider allowing save in edit mode even if not dirty (to allow re-saving unchanged data)
- Or ensure `isDirty` correctly reflects user changes

#### 2. Mutation Callback Timing
**Location**: `packages/core/features/office/components/OrganizationForm.tsx:95-113`

**Current Implementation**:
```typescript
const createMutation = api.office.createOrganization.useMutation({
  onSuccess: () => {
    toast.show('Success', { message: 'Organization created successfully' })
    router.push('/office/organizations')
  },
  // ...
})
```

**Potential Issues**:
- Navigation might occur before mutation fully completes
- Toast might not appear before navigation
- Tests might not wait long enough for async operations

**Solution**:
- Ensure `mutateAsync` properly awaits completion
- Add explicit waits in tests for toast notifications
- Consider adding loading states that tests can wait for

#### 3. Test Wait Conditions
**Location**: `tests/test-office-organizations.spec.ts`

**Current Waits**:
- `waitForNavigation(page, { timeout: 15000 })` - waits for URL change
- `waitForPageLoad(page)` - waits for React hydration

**Potential Issues**:
- Not waiting for toast notifications
- Not waiting for mutation completion indicator
- Race conditions between navigation and data persistence

**Solution**:
- Add explicit wait for toast: `await page.waitForSelector('[data-testid="toast"]')` or similar
- Wait for loading spinner to disappear
- Add wait for list data to load after navigation

### Implementation Steps

1. **Mark Task 4 as IN_PROGRESS in BrainGrid**

2. **Run failing tests to identify specific issues**
   ```bash
   pnpm exec playwright test test-office-organizations.spec.ts \
     --grep "creates organization successfully|updates organization name successfully|cancel button"
   ```

3. **Fix save button disabled state**
   - Review form dirty state tracking in edit mode
   - Ensure button enables when user makes changes
   - Test with both create and edit modes

4. **Improve mutation handling**
   - Verify `mutateAsync` properly awaits
   - Ensure onSuccess callbacks execute after mutation completes
   - Add error handling for failed mutations

5. **Add test wait conditions**
   - Wait for toast notifications to appear
   - Wait for loading states to clear
   - Wait for list data to load after navigation
   - Increase timeout if needed for slow operations

6. **Test fixes**
   - Run specific failing tests
   - Verify create flow works end-to-end
   - Verify update flow works end-to-end
   - Verify cancel button navigation

7. **Run full test suite**
   ```bash
   pnpm test
   pnpm check
   ```

8. **If passing**: Commit, update BrainGrid task 4 to COMPLETED

### Files to Modify

- `packages/core/features/office/components/OrganizationForm.tsx`
  - Fix save button disabled logic
  - Improve mutation error handling
  - Ensure proper async/await handling

- `tests/test-office-organizations.spec.ts`
  - Add wait conditions for toast notifications
  - Add wait conditions for loading states
  - Improve navigation wait logic
  - Add explicit waits for data persistence

### Success Criteria
- Test "creates organization successfully" (line 235) passes
- Test "updates organization name successfully" (line 432) passes
- Test "cancel button on edit returns to list" (line 489) passes
- Organization data persists correctly in database
- Navigation to list page occurs reliably after save
- Toast notifications appear on success
- No race conditions between mutation and navigation

---

## Task 5: Verify all organization tests pass and document patterns

**Task ID**: e3de79ad-ee94-4f06-9fbd-6bc36f73b4d8  
**Status**: PLANNED  
**Complexity**: 2/5  
**Readiness**: 5/5

### Goal
Run complete test suite for organizations, verify all 23 tests pass (100% pass rate), and document the data-testid patterns for consistency across other office features.

### Implementation Steps

1. **Mark Task 5 as IN_PROGRESS in BrainGrid**

2. **Run full organization test suite**
   ```bash
   pnpm exec playwright test test-office-organizations.spec.ts
   ```

3. **Verify all 23 tests pass**
   - Check for any remaining failures
   - Verify the 4 previously failing tests now pass:
     - Line 52: "displays organizations table with data"
     - Line 174: "displays all required form fields"
     - Line 235: "creates organization successfully"
     - Line 432: "updates organization name successfully"
     - Line 489: "cancel button returns to list"

4. **Run tests 3 times to verify consistency**
   - Ensure no flaky tests
   - Document any intermittent failures

5. **Document data-testid naming conventions**
   - Create or update testing patterns documentation
   - Document naming conventions:
     - Form fields: `{feature}-form-{field-name}`
     - Buttons: `{feature}-form-{action}-btn`
     - Tables: `{feature}-table`
     - List items: `{feature}-list-item-{id}`
     - Edit/Delete buttons: `{feature}-{action}-button-{id}`

6. **Document testing patterns**
   - Form submission patterns
   - Navigation wait patterns
   - Toast notification patterns
   - Table data verification patterns

7. **Run full test suite**
   ```bash
   pnpm test
   pnpm check
   ```

8. **If passing**: Commit, update BrainGrid task 5 to COMPLETED

### Files to Create/Modify

- `docs/testing/office-test-patterns.md` (create if doesn't exist)
  - Document data-testid naming conventions
  - Document common testing patterns
  - Provide examples for other office features

### Success Criteria
- All 23 tests in test-office-organizations.spec.ts pass
- Tests pass consistently (3 consecutive runs)
- No regressions in previously passing tests
- Test execution completes in reasonable time (<5 minutes)
- Testing patterns documented for reuse
- data-testid conventions clearly defined

---

## Final Steps

1. **Update REQ-65 status to REVIEW**
   - All 5 tasks completed
   - All 23 tests passing
   - Documentation complete

2. **Summary**
   - Document what was fixed
   - Note any patterns established
   - Highlight any follow-up work needed

---

## Notes

- **Test Command**: Use `pnpm exec playwright test test-office-organizations.spec.ts` for Playwright tests
- **Check Command**: Use `pnpm test` and `pnpm check` as specified by user
- **Commit Strategy**: Commit after each task completion if checks pass
- **BrainGrid Updates**: Update task status immediately after completion, before moving to next task

