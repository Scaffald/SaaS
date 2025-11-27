# Test Fixing Plan - Incremental Re-enablement Strategy

## Current State
- **Total Test Files**: 243 across packages
- **Current Configuration**: All tests disabled, only allow tests in `disabled_tests/` directory
- **Main Packages**: `@app/ui`, `@app/core`, `@app/schemas`
- **Issues**: Tests hanging for extended periods, unpredictable failures

## Goal
Bring tests to 100% passing rate with safeguards to prevent hanging and failures.

---

## Phase 1: Foundation & Safeguards (Setup)

### 1.1 Create Test Timeout Infrastructure
- **Add global timeout**: 60 seconds per test (vitest config)
- **Add timeout warning threshold**: 30 seconds (alert if test approaches limit)
- **Create hanging test reporter** to identify problematic tests
- **Add test categorization** tags (unit, integration, slow)

### 1.2 Create Test Re-enablement Directory Structure
```
disabled_tests/
├── packages/
│   ├── ui/
│   ├── core/
│   └── schemas/
├── MANIFEST.md  (tracks which tests are enabled)
```

### 1.3 Create Test Management Script
Build a helper script that:
- Moves test files from `disabled_tests/` to their original locations
- Updates vitest config
- Tracks which tests are enabled in MANIFEST.md
- Provides ability to quickly disable problematic tests

---

## Phase 2: Test Analysis & Categorization

### 2.1 Analyze All Tests
For each test file:
1. Identify test count and structure
2. Estimate complexity (unit vs integration vs async)
3. Flag potential issues:
   - External API calls
   - Database dependencies
   - Long async operations
   - Flaky patterns

### 2.2 Categorize Tests by Risk
**Low Risk** (enable first):
- Pure unit tests with no dependencies
- Simple component renders
- Utility function tests

**Medium Risk** (enable with monitoring):
- Tests with mocked external services
- Tests using React Query
- Component interaction tests

**High Risk** (investigate before enabling):
- Tests requiring Supabase/database
- Tests with real API calls
- Tests with timeouts or async complexity

---

## Phase 3: Incremental Re-enablement

### 3.1 Per-Test Process
For each test file to enable:

1. **Pre-enable Checklist**:
   - [ ] Review test file for dependencies
   - [ ] Identify and mock external services
   - [ ] Add `.skip` or `.only` to isolate the test
   - [ ] Run with 60s timeout to identify hangers

2. **Run Test**:
   ```bash
   # Run single test file with timeout
   pnpm exec vitest run packages/ui/src/components/buttons/__tests__/Button.test.tsx --reporter=verbose
   ```

3. **Classify Result**:
   - ✅ **PASS**: Move to enabled tests, update MANIFEST.md
   - ⏱️ **TIMEOUT/HANG**: Mark as HIGH_RISK, investigate root cause
   - ❌ **FAIL**: Categorize failure type, fix or skip individual tests
   - ⚠️ **FLAKY**: Mark with `.flaky` tag, investigate intermittent behavior

4. **Fix Issues**:
   - Add missing mocks
   - Fix race conditions
   - Reduce test scope
   - Isolate integration tests
   - Add explicit timeouts to async operations

5. **Verify Clean State**:
   - Run test multiple times (verify it's not flaky)
   - Run test with other tests (verify no cross-contamination)
   - Check memory/resource usage

### 3.2 Batching Strategy
- Enable tests in groups of 5-10 per iteration
- After each batch, run full test suite with timeout enforcement
- If batch passes, move to next batch
- If batch fails, bisect to identify problematic test

---

## Phase 4: Test Suite Organization

### 4.1 Vitest Configuration Updates
After identifying problematic areas:
1. Create test-specific timeout configs
2. Separate integration tests from unit tests
3. Add before/after hooks for cleanup
4. Implement proper test isolation

### 4.2 Test Dependencies
Set up proper mocking for:
- [ ] Supabase client
- [ ] React Query (useQuery, useMutation)
- [ ] Async operations
- [ ] External API calls (Mapbox, Stripe, etc.)
- [ ] React Router/Navigation

---

## Phase 5: CI/CD Integration

### 5.1 Prevent Regression
- Add timeout enforcement to CI
- Add hanging test detection to CI
- Generate hanging test reports
- Block PRs if test hangs > 60s

### 5.2 Test Performance Monitoring
- Track test execution time
- Alert on slow tests (>30s)
- Generate performance reports

---

## Implementation Checklist

### Setup Phase
- [ ] Create test timeout infrastructure in vitest.config.ts
- [ ] Create test re-enablement script
- [ ] Create MANIFEST.md to track test status
- [ ] Set up hanging test reporter

### Analysis Phase
- [ ] Categorize all 243 tests
- [ ] Identify dependencies per test
- [ ] Document high-risk tests

### Re-enablement Phase
- [ ] Batch 1: Enable low-risk unit tests (target: 20-30 tests)
- [ ] Batch 2: Enable medium-risk tests (target: 30-40 tests)
- [ ] Batch 3: Enable integration tests (target: 40-50 tests)
- [ ] Batch 4: Fix/enable remaining tests
- [ ] Full suite pass with all tests enabled

### Validation Phase
- [ ] Run full test suite 3x (verify no flakiness)
- [ ] Run tests with different timings (verify race conditions)
- [ ] Generate coverage report
- [ ] Update CI/CD configuration

---

## Success Criteria

1. ✅ All 243 tests enabled and passing
2. ✅ No test takes longer than 60 seconds
3. ✅ No hanging tests (timeout detection in place)
4. ✅ No flaky tests (consistent passes across multiple runs)
5. ✅ Test suite completes in < 5 minutes total
6. ✅ CI/CD enforces timeout and detects hangers
7. ✅ MANIFEST.md documents all test status

---

## Expected Timeline (Estimate - Not Commitment)

- **Phase 1 (Setup)**: 30 mins
- **Phase 2 (Analysis)**: 1-2 hours
- **Phase 3 (Re-enablement)**: 4-8 hours (depends on issue complexity)
- **Phase 4-5 (Polish & CI)**: 1-2 hours

---

## Key Principles

1. **One test at a time**: Don't batch enable multiple failing tests
2. **Safeguards first**: Ensure timeout protection before enabling
3. **Root cause investigation**: Don't skip/ignore failing tests
4. **Isolation**: Each test should run independently
5. **Documentation**: Track every decision in MANIFEST.md
6. **No hanging**: 60-second hard limit, no exceptions

---

## Test Package Breakdown (243 Total)

### `@app/ui` (~110 tests)
- Components: Button, Modal, Input, Chips, Address, Navigation, etc.
- Utilities: Image processing, positioning, filters
- Hooks: useAddressAutocomplete, useFilePicker, etc.

### `@app/core` (~80 tests)
- Features: Personality assessment, Discover, Drawer, etc.
- Providers: MapStateProvider
- Utilities: Occupation matching, org slug normalization, etc.

### `@app/schemas` (~10 tests)
- Address validation
- General schema tests

### Integration/Contract Tests (~40)
- Multi-package integration tests
- Contract suite tests
- API endpoint tests

---

## Notes

- Vitest config currently points to `disabled_tests/` directory (empty)
- Previous commit disabled all tests to start fresh
- Use `// @ts-nocheck` temporarily for problematic tests during migration
- Create PR after each major phase for review
