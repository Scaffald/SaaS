# E2E Tests with Playwright

End-to-end tests for Scaffald running on Expo Web.

## Prerequisites

1. **Supabase Running**: E2E tests use real Supabase
   ```bash
   pnpm supa:start
   ```

2. **Install Playwright Browsers** (first time only):
   ```bash
   pnpm exec playwright install chromium
   ```

## Running E2E Tests

### Run all tests (headless)
```bash
pnpm test:e2e
```

### Run with browser visible (headed mode)
```bash
pnpm test:e2e:headed
```

### Run with Playwright UI (best for development)
```bash
pnpm test:e2e:ui
```

### Run specific test file
```bash
pnpm playwright test auth.spec.ts
```

### Debug a test
```bash
pnpm playwright test auth.spec.ts --debug
```

## Test Structure

```
tests/e2e/
├── playwright.config.ts    # Playwright configuration
├── global-setup.ts         # Pre-test setup (verifies Supabase)
├── auth.spec.ts           # Authentication flow tests
└── navigation.spec.ts     # Navigation tests
```

## Writing E2E Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('does something', async ({ page }) => {
    // Arrange: Set up test state

    // Act: Perform user actions
    await page.getByRole('button', { name: /click me/i }).click();

    // Assert: Verify results
    const result = page.getByText(/success/i);
    await expect(result).toBeVisible();
  });
});
```

### Finding Elements

**Prefer accessible selectors** (in order of preference):

1. **By role**: `page.getByRole('button', { name: /submit/i })`
2. **By label**: `page.getByLabel(/email/i)`
3. **By text**: `page.getByText(/welcome/i)`
4. **By test ID**: `page.getByTestId('submit-button')`
5. **By CSS** (last resort): `page.locator('.my-class')`

### Common Patterns

**Navigate and wait for network**:
```typescript
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
```

**Fill form**:
```typescript
await page.getByLabel(/email/i).fill('test@example.com');
await page.getByLabel(/password/i).fill('password123');
await page.getByRole('button', { name: /sign in/i }).click();
```

**Wait for URL change**:
```typescript
await page.waitForURL('/dashboard', { timeout: 10000 });
```

**Take screenshot on failure** (automatic with config):
```typescript
// Screenshots are automatically saved to test-results/
```

## No Mocking Internal Systems

✅ **DO use real**:
- Real Supabase database
- Real authentication flows
- Real API calls

❌ **DO NOT mock**:
- Database queries
- tRPC endpoints
- Supabase Auth

✅ **OK to mock**:
- External services (Stripe, Maps, etc.)
- Third-party APIs

## Debugging Tips

### View last test run
```bash
pnpm playwright show-report
```

### Inspect element selectors
```bash
pnpm playwright codegen http://localhost:8081
```

### Trace viewer (after test failure)
```bash
pnpm playwright show-trace test-results/.../trace.zip
```

### Common Issues

**"Timeout waiting for page to load"**
- Check that Expo Web is running on port 8081
- Increase timeout in playwright.config.ts

**"Cannot find element"**
- Use `page.pause()` to inspect the page
- Use Playwright Inspector: `pnpm playwright test --debug`
- Check element selector with `pnpm playwright codegen`

**"Supabase connection failed"**
- Ensure Supabase is running: `pnpm supa:start`
- Check EXPO_PUBLIC_SUPABASE_URL is correct

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Install Playwright
  run: pnpm exec playwright install chromium --with-deps

- name: Run E2E tests
  run: pnpm test:e2e
```

Results are uploaded as artifacts for debugging failures.

## Best Practices

1. **Keep tests independent**: Each test should work in isolation
2. **Use data-testid sparingly**: Prefer accessible selectors
3. **Wait for elements**: Don't assume instant rendering
4. **Clean up test data**: Use afterEach hooks when needed
5. **Test user flows**: Focus on complete user journeys
6. **Keep tests fast**: Aim for <1 minute per test suite

## Example: Complete User Flow

```typescript
test('user can create a project', async ({ page }) => {
  // 1. Sign in
  await page.goto('/');
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('TestPassword123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/dashboard');

  // 2. Navigate to projects
  await page.getByRole('link', { name: /projects/i }).click();

  // 3. Create new project
  await page.getByRole('button', { name: /new project/i }).click();
  await page.getByLabel(/project name/i).fill('Test Project');
  await page.getByRole('button', { name: /create/i }).click();

  // 4. Verify project appears
  const projectCard = page.getByText(/test project/i);
  await expect(projectCard).toBeVisible();
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Expo Web Testing](https://docs.expo.dev/guides/testing-with-playwright/)
- [Testing Library Query Priority](https://testing-library.com/docs/queries/about#priority)
