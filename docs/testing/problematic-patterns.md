# Problematic Test Patterns That Can Cause Hangs

This document lists patterns found in the codebase that could cause tests to hang indefinitely.

## 1. `waitFor` Without Explicit Timeout

**Risk**: High - Default timeout may be too long or tests may wait forever

**Files Found**:
- `packages/core/features/profile/__tests__/profile-experience-improvements.test.tsx` - Has timeout
- `packages/core/features/profile/__tests__/profile-education.spec.tsx` - Multiple waitFor calls
- `packages/core/features/office/teams/components/__tests__/TeamForm.test.tsx` - Some have timeouts, some don't
- `packages/core/features/inquiries/components/__tests__/InquiryCommentThread.test.tsx` - No explicit timeouts
- `packages/core/features/profile-wizard/components/steps/__tests__/EmploymentPrefsStep.test.tsx` - Multiple waitFor calls

**Recommendation**: Always provide explicit `{ timeout: X }` to waitFor calls, especially when waiting for async operations.

## 2. `setInterval`/`setTimeout` Without Cleanup

**Risk**: High - Timers can continue running after tests complete

**Files Found**:
- `packages/core/features/discover/hooks/useMapPinState.ts` - Uses setTimeout in useEffect (has cleanup)
- `packages/core/features/applications/hooks/useApplicationForm.ts` - Uses setInterval with cleanup
- `packages/core/features/luscher-test/components/CooldownStep.tsx` - Uses setInterval with cleanup
- `packages/core/features/personality-assessment/components/CooldownStep.tsx` - Similar pattern

**Recommendation**: 
- Always return cleanup function from useEffect
- Use `afterEach` to clear any remaining timers
- Consider using `vi.useFakeTimers()` for timer-dependent tests

## 3. Promises That Never Resolve/Reject

**Risk**: High - Tests will hang waiting for promise resolution

**Files Found**:
- `packages/core/features/discover/hooks/__tests__/useDataHooks.test.ts` - Has Promise.resolve pattern
- `packages/core/features/profile-wizard/hooks/__tests__/useProfileWizard.test.ts` - Creates promises that may not resolve
- `packages/ui/src/components/address/hooks/__tests__/useAddressAutocomplete.test.ts` - Creates promises with manual resolution

**Recommendation**:
- Always ensure promises resolve or reject in tests
- Use `vi.fn().mockResolvedValue()` instead of manual Promise construction when possible
- Add timeout guards to promise-based waits

## 4. Infinite Loops

**Risk**: Critical - Will hang indefinitely

**Files Found**:
- `packages/supabase/scripts/seed-csi.ts` - Has `while (true)` loop (not a test file, but pattern exists)

**Recommendation**: Never use infinite loops in test code. Use bounded loops or condition-based exits.

## 5. Missing `vi.useFakeTimers()` Cleanup

**Risk**: Medium - Can cause timer-related tests to interfere with each other

**Files Found**:
- Most timer-using tests properly use `afterEach(() => vi.useRealTimers())`
- `packages/core/utils/__tests__/useDebounce.test.tsx` - ✅ Has proper cleanup
- `packages/core/utils/auth/__tests__/useProtectedRoute.test.tsx` - ✅ Has proper cleanup
- `packages/core/features/profile/utils/__tests__/profile-sync-store.test.ts` - ✅ Has proper cleanup

**Recommendation**: Always restore real timers in `afterEach` when using fake timers.

## 6. Network Mocks That Never Complete

**Risk**: High - Tests waiting for network calls will hang

**Pattern**: Mock functions that return promises but never resolve/reject

**Recommendation**:
- Always mock network calls with `mockResolvedValue` or `mockRejectedValue`
- Use `vi.fn().mockImplementation()` with proper promise handling
- Add timeout guards for network-dependent tests

## 7. React Query Mocks Without Proper Resolution

**Risk**: High - Tests using `useQuery` will hang if mocks don't resolve

**Files Found**:
- Multiple test files mock `useQuery` - need to verify all resolve properly

**Recommendation**:
- Ensure all `useQuery` mocks return `{ data, isLoading, error }` with proper values
- Use `mockReturnValue` with synchronous data when possible
- For async scenarios, ensure promises resolve in test lifecycle

## 8. Missing `act()` Wrappers

**Risk**: Medium - Can cause React warnings and unpredictable behavior

**Recommendation**: Wrap state updates and async operations in `act()` from `@testing-library/react`

## Action Items

1. ✅ Add global `testTimeout` to vitest.config.ts (completed)
2. ⏳ Audit all `waitFor` calls and add explicit timeouts
3. ⏳ Verify all timer-using tests have proper cleanup
4. ⏳ Check all promise-based mocks resolve/reject properly
5. ⏳ Run tests in batches to identify specific hanging suites

