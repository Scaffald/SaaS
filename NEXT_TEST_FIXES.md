# Next Test Fixes - Prioritized Action Items

## Overview
These are the specific, actionable items needed to get tests from "running with warnings" to "100% passing".

---

## Priority 1: Suppress Tamagui Props Warnings (Quick Win)

**Issue**: Tests are passing but printing warnings about Tamagui-specific props in DOM
**Impact**: ~15-20 tests
**Time**: 15-30 minutes
**Difficulty**: Easy

### Action
Update test setup file to suppress warnings for known Tamagui props:

**File**: `tests/infrastructure/vitest/setup.ts` (or create new setup)

```typescript
// Suppress known Tamagui prop warnings
const originalWarn = console.warn
console.warn = (...args) => {
  const message = args[0]?.toString?.() ?? ''

  // Suppress Tamagui prop warnings
  if (message.includes('React does not recognize the')) {
    const tamagui_props = ['flexWrap', 'pressStyle', 'borderColor', 'hoverStyle',
      'borderBottomWidth', 'numberOfLines', 'minW', 'minH', 'themeInverse', 'chromeless',
      'padded', 'bordered', 'iconAfter', 'onValueChange']
    if (tamagui_props.some(prop => message.includes(`\`${prop}\``))) {
      return // suppress
    }
  }

  // Pass through other warnings
  originalWarn(...args)
}
```

### Tests Affected
- `packages/core/features/profile-wizard/components/steps/__tests__/CertificationsStep.test.tsx`
- `packages/core/features/profile-wizard/components/steps/__tests__/EducationStep.test.tsx`
- `packages/core/features/profile-wizard/components/steps/__tests__/ExperienceStep.test.tsx`
- `packages/core/features/profile-wizard/components/steps/__tests__/GeneralInfoStep.test.tsx`
- `packages/ui/src/components/navigation/__tests__/OfficeAccordion.test.tsx`
- And ~10 more component tests

---

## Priority 2: Fix PostHog Mock (API Tests)

**Issue**: Analytics tests fail with "() => mockPostHogInstance is not a constructor"
**Impact**: ~4-6 tests in `packages/core/utils/analytics/__tests__/client.test.ts`
**Time**: 10-20 minutes
**Difficulty**: Easy-Medium

### Action
Fix the PostHog mock implementation:

**File**: `packages/core/utils/analytics/__tests__/client.test.ts` (in test setup area)

**Current Problem**:
```typescript
const mockPostHogInstance = vi.fn() // This won't work as constructor
```

**Fix**:
```typescript
const mockPostHogInstance = class MockPostHog {
  capture = vi.fn()
  identify = vi.fn()
  reset = vi.fn()
  // add other methods as needed
}

// Then when mocking:
vi.mocked(PostHog).mockImplementation(() => new mockPostHogInstance())
```

### Tests Affected
- `initAnalytics` tests (3 tests)
- `captureEvent` tests (3 tests)

---

## Priority 3: Fix Expo Module Mocks

**Issue**: Some tests fail with "Cannot read properties of undefined (reading 'get')" for ExpoModulesCoreJSLogger
**Impact**: ~5-10 tests
**Time**: 20-30 minutes
**Difficulty**: Medium

### Action
Enhance the Expo constants mock:

**File**: `tests/infrastructure/vitest/mocks/expo-constants.ts`

**Current State**: Likely a basic mock
**Enhancement Needed**:
```typescript
// Make it a more complete mock that handles module registry lookups
export const getExpoModuleAsync = vi.fn()
export const requireNativeModule = vi.fn()
export const NativeModulesProxy = new Proxy({}, {
  get: (target, prop) => {
    // Return mock implementations for requested modules
    return vi.fn()
  }
})
```

### Tests Affected
- `packages/core/features/auth/components/__tests__/SocialLogin.test.tsx` (2 tests)
- Other Expo-dependent component tests

---

## Priority 4: Fix Nested Button Elements

**Issue**: React warnings about `<button> cannot contain a nested <button>`
**Impact**: ~2-3 tests
**Time**: 30-45 minutes
**Difficulty**: Medium

### Action
Two options:

**Option A**: Suppress warning in test setup
```typescript
// In test setup, suppress the specific warning
const originalError = console.error
console.error = (...args) => {
  if (args[0]?.toString?.().includes('<button> cannot contain a nested <button>')) {
    return // suppress
  }
  originalError(...args)
}
```

**Option B**: Fix component structure
Review the component and change button to a div or pressable element where nested buttons shouldn't exist.

**Affected Component**:
- `packages/core/features/profile/__tests__/profile-certifications-right.test.tsx`

---

## Priority 5: Fix API/TRPC Test Mocking

**Issue**: Tests like `packages/core/utils/__tests__/api.test.ts` timeout or fail
**Impact**: ~3-5 tests
**Time**: 45 minutes - 1 hour
**Difficulty**: Medium-Hard

### Action
Review and enhance TRPC/API client mocking:

**File**: `packages/core/utils/__tests__/api.test.ts`

**Problem**: Tests likely trying to create real TRPC clients or calling real APIs
**Solution**:
- Mock the HTTP client
- Mock the session/auth functions
- Provide stub responses for TRPC procedures

---

## Implementation Order

1. **First**: Priority 1 (Tamagui props) - Easiest, highest impact on test output clarity
2. **Second**: Priority 2 (PostHog) - Quick fix, enables analytics tests
3. **Third**: Priority 3 (Expo mocks) - Medium effort
4. **Fourth**: Priority 4 (Nested buttons) - Quick decision on suppress vs fix
5. **Fifth**: Priority 5 (API mocks) - More complex, lower priority

---

## Testing Each Fix

After each fix:

```bash
# Run all tests to see overall progress
pnpm test:unit

# Run specific package to focus
pnpm --filter @app/core test:unit
pnpm --filter @app/ui test:unit

# Run specific test file
pnpm exec vitest run packages/core/utils/__tests__/api.test.ts
```

---

## Expected Outcome

After completing all 5 priorities:
- ✅ All test files passing
- ✅ All warning/error messages cleaned up
- ✅ Tests completing in <5 minutes total
- ✅ Ready to merge test fixes

---

## Questions Before Starting?

Before implementing these fixes, consider:

1. **Tamagui Props (Priority 1)**:
   - Should we suppress warnings or fix components?
   - (Recommend: Suppress in tests, component code is correct)

2. **PostHog Mock (Priority 2)**:
   - Should mock match full PostHog API or just what's needed?
   - (Recommend: Just match what tests need)

3. **Nested Buttons (Priority 4)**:
   - Should we suppress or fix component structure?
   - (Recommend: Check if it's a real UX issue first)

---

## Reference Docs

- **Progress Tracker**: `tests/docs/TEST-REENABLEMENT-PROGRESS.md`
- **Full Plan**: `TEST_FIX_PLAN.md`
- **Summary**: `TEST_FIX_SUMMARY.md`

---

**Status**: Ready to implement fixes
**Safety**: All changes isolated to test setup, no app code changes needed
