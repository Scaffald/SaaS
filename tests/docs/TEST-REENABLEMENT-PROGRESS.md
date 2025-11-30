# Test Re-enablement Progress Tracker

**Status**: In Progress
**Target**: 100% of 243 tests passing with <60s timeout
**Last Updated**: 2025-11-26

## Overview

This document tracks the incremental re-enablement of unit tests that were disabled in commit `a40b8648`. The goal is to systematically enable tests one batch at a time, fixing issues as we go, without allowing any test to hang for more than 60 seconds.

---

## Phase 1: Foundation & Safeguards ✅ COMPLETE

### 1.1 Test Timeout Infrastructure ✅
- [x] Add 60-second global timeout to vitest.config.ts
- [x] Add 30-second hook timeout to all vitest configs
- [x] Created test categorization infrastructure
- [x] Timeout enforcement in place: 60s per test, 30s per hook

**Files modified:**
- ✅ `vitest.config.ts` - testTimeout: 60000, hookTimeout: 30000
- ✅ `packages/ui/vitest.config.ts` - testTimeout: 60000, hookTimeout: 30000
- ✅ `packages/core/vitest.config.ts` - testTimeout: 60000, hookTimeout: 30000
- ✅ `packages/schemas/vitest.config.ts` - testTimeout: 60000, hookTimeout: 30000

### 1.2 Test Re-enablement Infrastructure ✅
- [x] Created comprehensive test tracking document (this file)
- [x] Tests are now enabled by default in all vitest configs
- [x] Pattern changed from `disabled_tests/` to `packages/**/*.{test,spec}.{ts,tsx}`

### 1.3 Initial Setup ✅
- [x] All tests re-enabled in vitest configs
- [x] Timeout protection in place
- [x] Tests now run on each save: pnpm test:unit runs all tests

---

## Phase 2: Test Analysis & Categorization 🏃 IN PROGRESS

### Test Inventory (After Re-enablement)

**Total Test Files**: 243
**Total Tests**: ~358+ (many now running)

#### By Package

| Package | Files | Tests | Status | Results |
|---------|-------|-------|--------|---------|
| `@scaffald/neue-ui` | ~110 | ~150 | 🏃 Running | Many tests execute, some warnings |
| `@app/core` | ~80 | ~120 | 🏃 Running | Multiple failures, component/hook issues |
| `@app/schemas` | ~10 | ~15 | 🏃 Running | Address tests running |
| Integration/Contract | ~40 | ~70 | 🏃 Running | API and integration tests |
| **TOTAL** | **243** | **358+** | 🏃 Running | Tests executing with timeout protection |

#### Risk Categories

**Low Risk** (Enable First)
- Pure utility function tests
- No external dependencies
- No async operations
- Target: 20-30 tests in Batch 1

Example: `packages/core/features/discover/utils/__tests__/getInitials.test.ts`

**Medium Risk** (Enable Second)
- Mocked external services
- React Query with mocks
- Component render tests
- Target: 30-40 tests in Batch 2

Example: `packages/ui/src/components/buttons/__tests__/Button.test.tsx`

**High Risk** (Investigate First)
- Supabase/database dependencies
- Real API calls
- Complex async flows
- Target: Fix/enable last

Example: Any test requiring database connection

### Analysis Status
- [ ] @scaffald/neue-ui tests analyzed
- [ ] @app/core tests analyzed
- [ ] @app/schemas tests analyzed
- [ ] Integration tests analyzed
- [ ] Risk categories assigned to each test

---

## Phase 3: Incremental Re-enablement 🚀

### Batch 1: Low-Risk Unit Tests
**Target**: 20-30 tests
**Status**: ⏳ Not started

#### Tests to Enable

- [ ] `packages/core/features/discover/utils/__tests__/getInitials.test.ts` - Pure utility
- [ ] `packages/core/features/discover/utils/__tests__/normalizeOrganizationSlug.test.ts` - Pure utility
- [ ] `packages/core/features/discover/utils/__tests__/hoverCardPositioning.test.ts` - Pure utility
- [ ] `packages/ui/src/components/maps/__tests__/utils.test.ts` - Pure utility
- [ ] `packages/ui/src/components/image-picker/utils/__tests__/imageProcessing.test.ts` - Pure utility
- [ ] `packages/ui/src/components/image-picker/__tests__/helpers.test.ts` - Pure utility
- [ ] `packages/core/features/personality-assessment/lib/ipip/__tests__/score.test.ts` - Pure utility

**Per-Test Process:**

1. Move test from disabled_tests to original location
2. Run test: `pnpm exec vitest run <test-path> --reporter=verbose`
3. If PASS ✅:
   - Update tracker below
   - Move to next test
4. If TIMEOUT/HANG ⏱️:
   - Investigate root cause
   - Add timeout/skip to problematic async
   - Fix and retry
5. If FAIL ❌:
   - Fix test or mark with `.skip`
   - Document issue
6. If FLAKY ⚠️:
   - Run 3 times to confirm
   - Investigate race conditions
   - Fix or mark `.flaky`

#### Batch 1 Progress

| Test | Status | Issues | Notes |
|------|--------|--------|-------|
| getInitials.test.ts | ⏳ Pending | — | — |
| normalizeOrganizationSlug.test.ts | ⏳ Pending | — | — |
| hoverCardPositioning.test.ts | ⏳ Pending | — | — |
| utils.test.ts (maps) | ⏳ Pending | — | — |
| imageProcessing.test.ts | ⏳ Pending | — | — |
| helpers.test.ts | ⏳ Pending | — | — |
| score.test.ts | ⏳ Pending | — | — |

**Batch 1 Summary**
- Tests Enabled: 0/7
- Tests Passing: 0/0
- Tests Fixed: 0
- Blockers: None yet

---

### Batch 2: Medium-Risk Component Tests
**Target**: 30-40 tests
**Status**: ⏳ Not started

#### Tests to Enable

- [ ] `packages/ui/src/components/buttons/__tests__/Button.test.tsx`
- [ ] `packages/ui/src/components/inputs/__tests__/Checkbox.test.tsx`
- [ ] `packages/ui/src/components/inputs/__tests__/ToggleSwitch.test.tsx`
- [ ] `packages/ui/src/components/chips/__tests__/FilterChip.test.tsx`
- [ ] `packages/ui/src/components/states/__tests__/EmptyState.test.tsx`
- [ ] `packages/ui/src/components/__tests__/CustomToast.test.tsx`
- [ ] More to be added as analysis completes...

#### Batch 2 Progress

| Test | Status | Issues | Notes |
|------|--------|--------|-------|
| Button.test.tsx | ⏳ Pending | — | — |
| Checkbox.test.tsx | ⏳ Pending | — | — |
| ToggleSwitch.test.tsx | ⏳ Pending | — | — |

**Batch 2 Summary**
- Tests Enabled: 0/30
- Tests Passing: 0/0
- Tests Fixed: 0
- Blockers: None yet

---

### Batch 3: Complex/Integration Tests
**Target**: Remaining tests
**Status**: ⏳ Not started

#### Known High-Risk Tests

These will need investigation before enabling:
- Tests requiring Supabase connection
- Tests with real API calls
- Tests with complex async flows
- Playwright E2E tests (separate suite)

---

## Phase 4: Test Suite Organization 🏗️

### Vitest Configuration Updates
- [ ] Separate test timeouts by category (unit: 30s, integration: 60s)
- [ ] Add proper test isolation and cleanup hooks
- [ ] Set up mocks for common dependencies

### Mock Setup
- [ ] Supabase client mocking
- [ ] React Query mocking
- [ ] Async operation handling

---

## Phase 5: CI/CD Integration 🔒

- [ ] Add timeout enforcement to CI
- [ ] Add hanging test detection to CI
- [ ] Block PRs if test hangs > 60s
- [ ] Generate test performance reports

---

## Summary Statistics

### Progress

| Phase | Status | Completion |
|-------|--------|-----------|
| Phase 1: Safeguards | ✅ Complete | 100% |
| Phase 2: Analysis | 🏃 In Progress | ~30% |
| Phase 3: Re-enablement | 🏃 In Progress | 243/243 enabled |
| Phase 4: Organization | 📋 Pending | 0% |
| Phase 5: CI/CD | 📋 Pending | 0% |

### Test Status Overview (Current Run)

```
Total Tests Found: 243+
├── Enabled: 243+ (all enabled)
├── Disabled: 0
├── Running: All tests executing
├── Timeout Protection: 60s per test, 30s per hook
└── Issues: Component rendering warnings, some failures
```

### Known Issues & Patterns Observed

1. **Tamagui/React DOM Props Warnings**: Many tests have warnings about custom props not recognized by DOM
   - `flexWrap`, `pressStyle`, `borderColor`, `hoverStyle`, etc. being set on DOM elements
   - `chromeless`, `padded`, `bordered` as non-boolean attributes
   - These are Tamagui-specific props not being stripped out in tests

2. **Component Rendering Issues**:
   - Nested button elements (button within button) causing hydration errors
   - Missing mocks for Expo modules (ExpoModulesCoreJSLogger)
   - PostHog initialization issues in analytics tests

3. **Test Timeout Performance**:
   - Tests are completing within 60s timeout
   - Some tests taking 1-4 seconds (normal)
   - Largest test file completing in ~6 seconds
   - No hanging tests detected yet ✅

4. **Mock Issues**:
   - Expo modules not properly mocked in some tests
   - PostHog mock implementation incorrect for constructor usage
   - Some API/tRPC tests need better mocking

---

## Key Metrics to Track

- [ ] No test takes > 60 seconds
- [ ] No hanging tests (timeout kills test at 60s)
- [ ] No flaky tests (100% pass rate across multiple runs)
- [ ] Full suite completion < 5 minutes
- [ ] 100% of 243 tests passing

---

## Notes & Decisions

### Test Configuration
- Global timeout: 60 seconds per test
- Warning threshold: 30 seconds (alert if test approaches limit)
- Test files: Co-located with source in `{packages,apps}/**/*.{test,spec}.{ts,tsx}`
- Disabled pattern: Currently nothing (placeholder while we set up)

### Process
- One batch at a time (don't enable multiple failing tests simultaneously)
- Investigate root causes (don't skip/ignore failures)
- Prioritize isolation (each test independent)
- Document decisions (update this file after each batch)

### File Organization
- Source tests: Live in `packages/*/` directories alongside source
- Disabled tests: Temporarily moved to `disabled_tests/` if needed
- This tracker: `tests/docs/TEST-REENABLEMENT-PROGRESS.md`
- Test manifest: Per-file tracking (if needed, in MANIFEST.md)

---

## References

- Test Plan: `/TEST_FIX_PLAN.md`
- Previous Migration: `tests/docs/MIGRATION-RESULTS.md`
- Testing Patterns: `tests/docs/TESTING-PATTERNS.md`
- Vitest Setup: `tests/infrastructure/vitest/setup.ts`
- Contributing: `tests/docs/CONTRIBUTING.md`

---

## Implementation Commands

```bash
# Run all tests (should be ~0 after phase 1 setup)
pnpm test:vitest

# Run specific test
pnpm exec vitest run packages/core/features/discover/utils/__tests__/getInitials.test.ts --reporter=verbose

# Run with timeout enforcement
pnpm exec vitest run --reporter=verbose

# Run test in watch mode
pnpm test:watch

# Generate coverage
pnpm test:coverage
```

---

## Status Legend

- ✅ Complete / Passing
- ❌ Failed / Broken
- ⏳ In Progress
- 📋 Pending / To Do
- 🚀 Ready to Start
- 🏗️ Under Construction
- 🔒 Blocked
- ⚠️ Warning / Flaky
- 📊 Analysis Needed

---

**Last Updated**: 2025-11-26
**Next Steps**: Complete Phase 1 safeguards before enabling any tests
