# Test Infrastructure TODO

**Last Updated:** 2025-01-XX  
**Status:** Active Development

## Overview

This document consolidates all remaining test infrastructure work, unit test fixes, and E2E test re-enablement tasks.

---

## 🔴 High Priority - Unit Test Fixes

### Component Rendering Issues (~150+ tests)

**Problem:** Components render but produce empty `<body />` output in tests.

**Affected Components:**
- Profile Wizard Steps: `CertificationsStep` (11), `ExperienceStep` (8), `EducationStep` (1), `GeneralInfoStep` (2)
- Profile Completion: `MilestoneBadge` (4)
- Office/Teams: `TeamCommentThread` (3), `TeamInviteModal` (2), `TeamMembersList` (3)
- Office/Jobs: `JobsKanbanBoard` (1)

**Investigation Findings:**
- Components import and call correctly
- Mocks appear set up correctly (Card.Header, Tamagui components)
- No render errors thrown (error boundary shows none)
- Component structure looks correct

**Possible Root Causes:**
1. Component conditionally rendering with unmet conditions
2. Silent null/undefined returns
3. React suppressing render errors in test environment
4. Missing provider/context (tRPC, theme, etc.)
5. Hooks failing silently in test environment

**Next Steps:**
- [x] Add React error boundary to catch render errors (added, no errors found)
- [x] Check if components need providers (components don't use context directly)
- [x] Verify Card.Header mock is properly accessible (updated mock, issue persists)
- [x] Add detailed debugging (confirmed: component renders empty `<body />`)
- [ ] **CRITICAL**: Investigate why React renders empty body - component structure is correct, no errors thrown
- [ ] Check if `useId()` hook works correctly in vitest/jsdom environment
- [ ] Verify if React 18 features are properly supported in test setup
- [ ] Compare with working component tests to identify differences
- [ ] Consider if component needs to be wrapped in a provider (even though it doesn't use context)
- [ ] Try creating a minimal reproduction to isolate the issue

### Missing Test IDs (~30+ tests)

**Status:** ✅ **FIXED** - Test IDs added to components

**Fixed:**
- ✅ `data-testid="trophy-icon"` - Added to MilestoneBadge Trophy icon
- ✅ `data-testid="toggle-current-job"` - Added to ExperienceStep ToggleSwitch
- ✅ `testID="modal"` - Added to TeamInviteModal ResponsiveModal
- ✅ Updated ResponsiveModal mock to accept testID prop

**Note:** Tests will pass once component rendering issues are resolved (components currently render empty body).

### Missing Form Inputs/Placeholders (~50+ tests)

**Status:** ✅ **VERIFIED** - Placeholders exist in components and match tests

**Verified Placeholders:**
- ✅ "OSHA 30-Hour Construction Safety" - CertificationsStep (line 154)
- ✅ "Occupational Safety and Health Administration" - CertificationsStep (line 165)
- ✅ "Lead Carpenter" - ExperienceStep (line 101)
- ✅ "Summit Builders" - ExperienceStep (line 117)
- ✅ "First name", "Last name" - GeneralInfoStep (lines 113, 135)
- ✅ All other placeholders verified in component code

**Note:** Tests will pass once component rendering issues are resolved (components currently render empty body).

### Missing Buttons/Actions (~40+ tests)

**Status:** ✅ **FIXED** - Button mocks updated to use correct labels

**Fixed:**
- ✅ StepNavigation mock in CertificationsStep test now uses `nextLabel` and `skipLabel` props
- ✅ ExperienceStep test already had correct mock
- ✅ Button labels verified in components:
  - "Next: Preferences" - CertificationsStep (line 192)
  - "Skip Certifications" - CertificationsStep (line 193)
  - "Next: Certifications" - ExperienceStep (line 200)
  - "Next: Skills" - GeneralInfoStep
  - "Save & Continue Later" - Default in StepNavigation
  - "Skip This Step" - Default in StepNavigation

**Note:** Tests will pass once component rendering issues are resolved (components currently render empty body).

---

## 🟠 Medium Priority - Test Infrastructure

### Tamagui Component Mocking

**Problem:** Tamagui props warnings (non-blocking but noisy).

**Warnings:**
- `borderColor`, `borderWidth` - MilestoneBadge, JobsKanbanBoard
- `themeInverse`, `flexWrap`, `chromeless` - EducationStep, ExperienceStep, CertificationsStep
- `padded`, `bordered` - CertificationsStep

**Tasks:**
- [ ] Ensure proper component mocking
- [ ] Verify props are being filtered correctly
- [ ] May fix some rendering issues once resolved

### Additional Mock Helpers

**Tasks:**
- [ ] Add tRPC client mocks in `tests/infrastructure/vitest/helpers/`
- [ ] Add comprehensive Expo modules mocks
- [ ] Create reusable test utilities for common patterns

### Test Performance

**Tasks:**
- [ ] Run full test suite - should complete < 5 minutes
- [ ] Target: 0 hanging tests, < 60s per test
- [ ] Optimize slow tests

---

## 🟡 Low Priority - E2E Test Re-enablement

### Phase 2: Identify Flaky Tests

**Objective:** Run each test category 3x to identify flaky tests.

**Tasks:**
- [ ] Run flakiness detection script for each test category
- [ ] Document flaky tests with root causes
- [ ] Assign flaky test owners
- [ ] Classify all tests as stable/flaky/skip

**Test Categories to Evaluate:**
- `auth/` (12 files) - Expected: Low flakiness
- `dashboard/` (4 files) - Expected: Low flakiness
- `discover/` (8 files) - Expected: Medium flakiness
- `office/` (13 files) - Expected: High flakiness
- `profile/` (19 files) - Expected: Medium flakiness
- `other/` (3 files) - Expected: Low flakiness

### Phase 3: Timeout Optimization

**Current Issues:**
- Some tests may have suboptimal timeouts
- Need per-category timeout configuration

**Tasks:**
- [ ] Optimize timeouts per test category
- [ ] Ensure no tests timeout in normal conditions
- [ ] Target: P95 test duration < 30 seconds

### Phase 4: Full Suite Enablement

**Incremental Enablement Order:**
1. Auth tests (12 files) - Foundation for all other tests
2. Dashboard tests (4 files) - Core navigation
3. Profile tests (19 files) - User data flows
4. Discover tests (8 files) - Search/map features
5. Office tests (13 files) - Admin features (last, most complex)

**Tasks:**
- [ ] Enable auth tests
- [ ] Enable dashboard tests
- [ ] Enable profile tests
- [ ] Enable discover tests
- [ ] Enable office tests
- [ ] Verify all tests passing in CI
- [ ] Generate coverage report for E2E tests

---

## Commands Reference

```bash
# Unit tests
pnpm test:unit              # Run all unit tests
pnpm vitest run --coverage  # With coverage report

# E2E tests (smoke tests only)
pnpm playwright test        # Run enabled E2E tests
pnpm playwright test --ui   # Interactive UI mode

# Full suite
pnpm test:all               # Integration + build verification
pnpm check                  # Format, lint, and type check
```

---

## Success Criteria

### Unit Tests
- [ ] All component rendering issues resolved
- [ ] 0 hanging tests
- [ ] Test suite completes < 5 minutes
- [ ] > 95% pass rate

### E2E Tests
- [ ] All phases complete (currently Phase 1 done)
- [ ] > 95% pass rate
- [ ] < 5% flake rate
- [ ] P95 test duration < 30 seconds

---

## Notes

- **Test Environment:** jsdom with Tamagui mocks
- **Coverage Thresholds:** 60% minimum (50% branches)
- **Test Timeouts:** 10s per test, 5s for setup/teardown
- **E2E Timeouts:** 45s default, 10min global

---

**Status Legend:**
- ✅ Complete
- 🔄 In Progress
- 📋 Planned
- ❌ Blocked
- ⚠️ Needs Attention

