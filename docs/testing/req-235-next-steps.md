# REQ-235 Next Steps: Test Improvements and Fixes

## Current Status

✅ **Completed:**
- Global timeout configuration (5s) implemented
- Hanging test detection reporter created
- Deno test sanitization with timeout handling
- Fetch timeout wrappers in test utilities
- ResponsiveSelect mock fix

## Immediate Next Steps

### 1. Fix Broken Test Mocks

**Priority: High**

Several tests are failing due to incomplete mocks. The ResponsiveSelect mock was fixed, but other components may need similar treatment.

**Tasks:**
- [ ] Audit all test files that mock `@app/ui` and ensure all used components are mocked
- [ ] Add missing `data-testid` attributes to mock components where tests expect them
- [ ] Standardize mock patterns across test files to reduce duplication

**Files to check:**
- `packages/core/features/office/components/__tests__/JobForm.test.tsx` - Missing `data-testid="job-organization-select"`
- Other test files using `@app/ui` mocks

### 2. Run Full Test Suite and Identify Failures

**Priority: High**

**Tasks:**
- [ ] Run `pnpm test:unit` and capture all failures
- [ ] Categorize failures:
  - Mock-related (missing exports, incorrect mocks)
  - Timeout-related (tests exceeding 5s)
  - Logic errors (actual test failures)
  - Flaky tests (intermittent failures)

**Command:**
```bash
pnpm test:unit 2>&1 | tee test-results.log
```

### 3. Address Timeout Violations

**Priority: Medium**

With the new 5-second timeout, some tests may legitimately need more time or should be optimized.

**Tasks:**
- [ ] Review hanging test reporter output for slow tests (>3s)
- [ ] For tests approaching timeout:
  - Optimize test logic (reduce unnecessary waits, mock more aggressively)
  - Split large tests into smaller, focused tests
  - Consider if timeout should be increased for specific test suites (with justification)
- [ ] Document any tests that legitimately need longer timeouts

**Files to check:**
- Review hanging test reporter output after full test run
- Check for hard-coded `setTimeout` calls that could be reduced

### 4. Fix Deno Test Issues

**Priority: Medium**

**Tasks:**
- [ ] Run Deno tests: `deno test --allow-all packages/supabase/functions/trpc/__tests__/auth.test.ts`
- [ ] Verify timeout protection works for `getLatestEmail` calls
- [ ] Update any tests that still use old `getLatestEmail` signature (with `maxRetries` parameter)
- [ ] Ensure all Deno tests with external resources have AbortController timeouts

**Files to check:**
- All Deno test files in `packages/supabase/functions/trpc/__tests__/`
- All Deno test files in `packages/supabase/tests/routers/`

### 5. Improve Test Utilities

**Priority: Low**

**Tasks:**
- [ ] Create shared test utilities for common mocking patterns
- [ ] Document timeout best practices in test utilities
- [ ] Add helper functions for common test scenarios (auth, form submission, etc.)
- [ ] Consider creating a `renderWithProviders` utility as mentioned in REQ-235 requirements

**Location:**
- `tests/infrastructure/vitest/helpers/` (create if needed)

### 6. Monitor Test Performance

**Priority: Low**

**Tasks:**
- [ ] Set up regular monitoring of test execution times
- [ ] Track slow test trends over time
- [ ] Set up alerts for tests consistently exceeding thresholds
- [ ] Document performance improvements

## Test Fix Checklist

When fixing individual tests:

1. **Identify the failure type:**
   - [ ] Missing mock export
   - [ ] Incorrect mock implementation
   - [ ] Missing test data/state
   - [ ] Logic error in test
   - [ ] Timeout violation

2. **Fix the issue:**
   - [ ] Add missing mocks/exports
   - [ ] Update mock implementations
   - [ ] Add required test data
   - [ ] Fix test logic
   - [ ] Optimize or split slow tests

3. **Verify the fix:**
   - [ ] Test passes locally
   - [ ] Test completes within timeout
   - [ ] No new warnings from hanging test reporter
   - [ ] Related tests still pass

4. **Document if needed:**
   - [ ] Add comments for complex mocks
   - [ ] Document any timeout exceptions
   - [ ] Update test documentation

## Common Issues and Solutions

### Issue: Missing Component in Mock

**Solution:**
```typescript
// In test file or global setup
vi.mock('@app/ui', () => ({
  // ... existing mocks
  MissingComponent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
```

### Issue: Test Exceeding 5s Timeout

**Solutions:**
1. Optimize test by reducing waits:
   ```typescript
   // Instead of: await new Promise(resolve => setTimeout(resolve, 2000))
   // Use: await waitFor(() => expect(...).toBeInTheDocument())
   ```

2. Mock external dependencies more aggressively
3. Split large test into multiple smaller tests
4. If legitimately needs more time, document why:
   ```typescript
   test('slow integration test', async () => {
     // This test needs 10s due to external API calls
   }, { timeout: 10000 })
   ```

### Issue: getLatestEmail Signature Change

**Solution:**
```typescript
// Old (no longer works):
const email = await getLatestEmail(recipient, 10, 500)

// New:
const email = await getLatestEmail(recipient, 5000) // timeout in ms
```

## Success Metrics

- [ ] All tests pass with 5s timeout
- [ ] No tests exceed 3s (hanging test reporter threshold)
- [ ] Test suite completes in <5 minutes
- [ ] Zero hanging tests in CI/CD
- [ ] All Deno tests pass with timeout protection

## Related Documentation

- REQ-235 Implementation Plan
- `docs/testing/running-tests.md`
- `docs/testing/troubleshooting.md`
- `tests/infrastructure/vitest/reporters/hanging-test-reporter.ts`

