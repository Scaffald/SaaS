# Troubleshooting

Common hiccups when running the Vitest and Supabase suites, plus the fixes that worked during REQ-172.

## Vitest Cannot Open Modules (`EPERM: operation not permitted`)

When running inside restricted environments (e.g. remote sandboxes) Node may not have permission to read `node_modules`. Re-run the command with elevated permissions or outside the sandbox. Locally this error usually means the repo is on a read-only volume.

## Vitest Appears to Hang After a Suite Fails

Vitest defaults to watch mode when it detects an interactive shell. Our shared config now sets `watch: false`, so every standard command (`pnpm test`, `pnpm --filter … test`, `pnpm test:unit`) exits after one run. If you intentionally invoke `vitest` directly—or need live re-runs—pass `--watch` (or use `pnpm test:watch`). This prevents accidental hangs while still allowing opt-in watch workflows.

## Supabase Integration Tests Fail with `TRPC response should include data`

The O*NET integration relies on the `onet.search_occupations` RPC. If your local database lacks the function, the test exits early with a warning and the assertion fails. Options:

1. Run `pnpm supa seed:onet` to populate the O*NET tables and functions.
2. Set `ONET_BASE_URL` to point at a reachable upstream service.
3. When working on unrelated features, skip the step by running the Vitest suites only: `pnpm test:unit`.

A follow-up task will harden the fallback path to query `onet.occupation_data` automatically.

## Missing Supabase Service Role Key

The helpers in `test/helpers/database.ts` require a service-role key to reset or seed data. Without it you will see a warning:  
`Skipping Supabase reset step for tests because no service role key is configured.`  
Add `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_TEST_SERVICE_ROLE_KEY`) to your shell environment, or set `shouldReset: false` when calling `setupTestDatabase`.

## Expo Module Errors in Tests

If you see messages like `Cannot find module expo-constants`, ensure:

- You are importing from the Expo package name (`expo-constants`, `expo-linking`) rather than a relative path.
- The module is listed in `test/mocks/` if it requires custom behaviour.
- You are running tests through Vitest (`pnpm test:unit`), which applies the shared setup mocks.

## Coverage Threshold Failures

The root configuration enforces 50% line/function/branch/statement coverage. When adding new packages or large components:

- Start by tagging TODO tests or `test.skip` to land scaffolding, then follow up to raise coverage.
- Check `coverage/index.html` for gaps. Files under `packages/ui` and `packages/core/features` typically benefit from enumerating user interactions rather than simple render assertions.

## EADDRINUSE / Port Conflicts

When the Supabase test runner reports `EADDRINUSE`, verify a previous `pnpm supa start` process shut down cleanly. Use `pnpm supa stop` or `pkill -f supabase` then rerun the test command.

## React Native Event Warnings

If a React Native suite warns about missing gesture handlers or native modules, check that you are importing the component under test from the correct wrapper. Many Expo screens re-export modules from `packages/core`; make sure the test file matches the production entry point so the shared mocks apply.

Keeping these fixes in mind should get most local runs back on track quickly. Update this document whenever new edge cases surface so future contributors waste less time debugging the same issues.

---

## Playwright E2E Test Issues

### Tests Fail with "Element not visible"

**Cause**: Element hasn't loaded yet or is hidden behind loading state.

**Solution**: Add proper wait before interacting with element.

```typescript
// Bad - No wait
await page.getByTestId('save-button').click()

// Good - Wait for element
await page.waitForSelector('[data-testid="save-button"]')
await page.getByTestId('save-button').click()

// Better - Use expect with timeout
await expect(page.getByTestId('save-button')).toBeVisible({ timeout: 10000 })
await page.getByTestId('save-button').click()
```

### Tests Fail with "Navigation timeout"

**Cause**: Navigation taking longer than default 30s timeout, or page not loading properly.

**Solution**: Increase timeout or wait for specific condition.

```typescript
// Increase navigation timeout
await page.goto('/office/users', { timeout: 60000 })

// Or use helper with timeout
import { navigateToOfficeRoute, waitForNavigation } from './helpers/office-navigation'
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
await waitForNavigation(page, { timeout: 15000 })
```

### Tests Are Flaky (Pass Sometimes, Fail Other Times)

**Cause**: Race conditions, timing issues, or resource contention.

**Solutions**:
1. Add proper wait strategies (see [Wait Strategy Patterns](../docs/testing/playwright-testing-patterns.md#wait-strategy-patterns))
2. Use `waitForResponse` for API-dependent operations
3. Run tests with `--workers=1` to isolate parallelization issues

```typescript
// Wait for API response
const responsePromise = page.waitForResponse(url => url.includes('/api/users'))
await page.click('[data-testid="search-input"]')
await responsePromise
```

```bash
# Run with single worker to isolate issues
pnpm exec playwright test tests/test-office-*.spec.ts --workers=1
```

### Tests Fail with "Storage state not found"

**Cause**: Auth state file doesn't exist or path is incorrect.

**Solution**: Create auth state file.

```bash
# Run auth state creation script
pnpm exec tsx tests/setup/create-auth-states.ts
```

Verify file exists at `tests/.auth/super-admin.json`.

### Tests Fail with "Route not accessible" or Redirects to Sign-in

**Cause**: User doesn't have 'office' role or auth state is invalid.

**Solution**: Use super-admin auth state which has 'office' role.

```typescript
// Use super-admin auth state
test.use({ storageState: 'tests/.auth/super-admin.json' })
```

Verify user in auth state has 'office' role in database:
```sql
SELECT email, raw_user_meta_data->>'role' FROM auth.users WHERE email = 'ewongagent@gmail.com';
```

### Modal Interactions Fail

**Cause**: Modal hasn't fully opened yet or animation still in progress.

**Solution**: Wait for modal to be visible before interacting.

```typescript
// Wait for modal animation
await page.waitForTimeout(1000)

// Verify modal is visible
const modal = page.getByRole('dialog')
await expect(modal.first()).toBeVisible()

// Now interact with modal
await page.getByTestId('modal-input').fill('value')
```

### Form Submissions Don't Work

**Cause**: Form not fully loaded, validation errors, or API not ready.

**Solution**: Wait for form fields, check for validation, wait for API.

```typescript
// 1. Wait for form fields
await expect(page.getByTestId('org-name-input')).toBeVisible({ timeout: 10000 })

// 2. Fill form
await page.getByTestId('org-name-input').fill('Test Org')

// 3. Check for validation errors before submitting
const errors = await page.locator('[role="alert"]').count()
if (errors > 0) {
  console.log('Validation errors present')
}

// 4. Wait for API response after submit
const responsePromise = page.waitForResponse(url => url.includes('/api/organizations'))
await page.getByTestId('save-button').click()
await responsePromise
```

### Drag-and-Drop Doesn't Work

**Cause**: Card not found, column not found, or drag operation not completing.

**Solution**: Use helper functions and wait for operations to complete.

```typescript
import { dragApplicationToColumn, verifyApplicationInColumn } from './helpers/kanban-helpers'

// Use helper function
await dragApplicationToColumn(page, 'John Doe', KANBAN_COLUMNS.INTERVIEW)

// Wait for operation to complete
await page.waitForTimeout(2000)

// Verify result
const isInColumn = await verifyApplicationInColumn(page, 'John Doe', KANBAN_COLUMNS.INTERVIEW)
expect(isInColumn).toBe(true)
```

### Tests Interrupt with SIGTERM (Exit Code 144)

**Cause**: Test suite timeout, resource exhaustion, or too many parallel workers.

**Solution**: 
1. Check `playwright.config.ts` has `globalTimeout` set (30 minutes recommended)
2. Limit workers to prevent resource exhaustion
3. Check system resources (memory, CPU)

```typescript
// playwright.config.ts
export default defineConfig({
  globalTimeout: 30 * 60 * 1000,  // 30 minutes
  workers: process.env.CI ? 1 : 4,  // Limit workers
  // ... rest of config
})
```

### Selector Not Found

**Cause**: `data-testid` attribute missing or selector syntax incorrect.

**Solution**: 
1. Verify `data-testid` exists in component
2. Use correct selector syntax
3. Check for typos

```typescript
// Verify element exists
const element = page.getByTestId('org-name-input')
await expect(element).toBeVisible({ timeout: 10000 })

// Or use locator directly
const element = page.locator('[data-testid="org-name-input"]')
await expect(element).toBeVisible({ timeout: 10000 })
```

See [TEST_IDS.md](../../tests/TEST_IDS.md) for complete list of available test IDs.

### Browser Process Hangs or Crashes

**Cause**: Resource limits, memory leaks, or too many browser instances.

**Solution**: 
1. Add browser launch args to improve resource management
2. Reduce worker count
3. Check for memory leaks in tests

```typescript
// playwright.config.ts
use: {
  launchOptions: {
    args: [
      '--disable-dev-shm-usage',  // Overcome limited resource problems
      '--disable-extensions',      // Disable extensions
      '--no-sandbox',             // Disable sandbox
    ],
  },
}
```

### Tests Pass Locally but Fail in CI

**Cause**: Environment differences, timing issues, or resource constraints.

**Solutions**:
1. Use same test environment as CI locally
2. Add retries for flaky tests
3. Check CI logs for specific errors

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Retry on CI
  workers: process.env.CI ? 1 : 4,  // Single worker on CI
  // ... rest of config
})
```

For more Playwright-specific troubleshooting, see:
- [Office Routes Testing Guide](./office-routes-testing-guide.md)
- [Playwright Testing Patterns](./playwright-testing-patterns.md)

---

**Last Updated**: November 13, 2025  
**Playwright Section Added**: REQ-2 (Task 26)


