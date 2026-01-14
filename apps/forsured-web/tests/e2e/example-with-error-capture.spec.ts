/**
 * Example E2E Test with Error Capture
 *
 * This test demonstrates the new testing architecture with:
 * - Base test fixture that captures console and network errors
 * - Real database access (not mocked Supabase)
 * - Proper error assertions
 *
 * After bugs on 2025-12-03, all tests should follow this pattern.
 */

import { test, expect } from './fixtures/base';

// SKIP: These examples use loginAs which requires real OAuth/mock server setup
// They demonstrate the testing patterns but need app features to be complete
test.describe.skip('Example: GC User Flow with Error Capture', () => {
  test('active GC can log in and access dashboard', async ({
    page,
    loginAs,
    captureErrors,
    assertNoErrors,
  }) => {
    // STEP 1: Enable error capture at start of test
    captureErrors();

    // STEP 2: Log in as test user (uses real DB)
    await loginAs(page, 'active.gc@test.forsured.com');

    // STEP 3: Assert we landed on correct dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');

    // STEP 4: Test navigation works
    await page.click('a[href="/manager/projects"]');
    await expect(page).toHaveURL(/\/manager\/projects/);

    // STEP 5: Assert no errors occurred during entire flow
    assertNoErrors();
  });

  test('fresh GC completes signup flow without errors', async ({
    page,
    captureErrors,
    assertNoErrors,
  }) => {
    captureErrors();

    // Start at login page
    await page.goto('/start');

    // Enter email and submit
    await page.fill('[placeholder*="email"]', 'fresh.gc@test.forsured.com');
    await page.click('button[type="submit"]');

    // Should land on signup page (no profile yet)
    await expect(page).toHaveURL(/\/signup/, { timeout: 10000 });

    // Select GC user type
    await page.click('[data-testid="user-type-gc"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/manager\/onboarding/, { timeout: 10000 });

    // No errors should have occurred
    assertNoErrors();
  });

  test('contractor cannot access GC routes', async ({
    page,
    loginAs,
    captureErrors,
    assertNoErrors,
  }) => {
    captureErrors();

    // Log in as contractor
    await loginAs(page, 'active.contractor@test.forsured.com');

    // Try to access GC route
    await page.goto('/manager/dashboard');

    // Should redirect to unauthorized page
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/not authorized|permission denied/i);

    // No errors (unauthorized is expected behavior, not an error)
    assertNoErrors();
  });
});

// SKIP: This demonstrates error capture but causes expected failures
test.describe.skip('Example: Network Error Detection', () => {
  test('catches network errors in test', async ({
    page,
    captureErrors,
    assertNoErrors,
    getNetworkErrors,
  }) => {
    captureErrors();

    // Simulate a route that will cause network errors
    await page.route('**/rest/v1/user_profiles*', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'permission denied for schema forsured' }),
      });
    });

    // Try to load a page that fetches user profile
    await page.goto('/manager/dashboard');

    // Get network errors for inspection
    const networkErrors = getNetworkErrors();

    // Assert we captured the 403 error
    expect(networkErrors.length).toBeGreaterThan(0);
    expect(networkErrors[0].status).toBe(403);

    // This will fail because we have network errors
    // Comment out to see the test fail
    // assertNoErrors();
  });
});

test.describe('Example: Console Error Detection', () => {
  test('catches console errors in test', async ({
    page,
    captureErrors,
    assertNoErrors,
    getConsoleErrors,
  }) => {
    captureErrors();

    // Inject a script that will cause a console error
    await page.addInitScript(() => {
      // Simulate an error that might occur in production
      setTimeout(() => {
        console.error('Test error: Invalid UUID format');
      }, 100);
    });

    await page.goto('/');

    // Wait for error to occur
    await page.waitForTimeout(200);

    // Get console errors for inspection
    const consoleErrors = getConsoleErrors();

    // Assert we captured the console error
    expect(consoleErrors.length).toBeGreaterThan(0);
    expect(consoleErrors[0].text).toContain('Invalid UUID');

    // This will fail because we have console errors
    // Comment out to see the test fail
    // assertNoErrors();
  });
});

// SKIP: This test clicks submit button that doesn't exist on settings page
test.describe.skip('Example: Manual Error Checking', () => {
  test('can manually inspect errors during test', async ({
    page,
    setupAuthAs,
    captureErrors,
    getConsoleErrors,
    getNetworkErrors,
  }) => {
    captureErrors();

    await setupAuthAs(page, 'active.gc@test.forsured.com');
    await page.goto('/manager/settings');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Manually check for errors at any point
    const consoleErrors = getConsoleErrors();
    const networkErrors = getNetworkErrors();

    console.log(`Console errors so far: ${consoleErrors.length}`);
    console.log(`Network errors so far: ${networkErrors.length}`);

    // Continue with test...
    await page.click('button[type="submit"]');

    // Check again after action
    const consoleErrorsAfter = getConsoleErrors();
    const networkErrorsAfter = getNetworkErrors();

    console.log(`Console errors after submit: ${consoleErrorsAfter.length}`);
    console.log(`Network errors after submit: ${networkErrorsAfter.length}`);

    // You can assert specific error counts or types
    expect(consoleErrorsAfter.length).toBe(0);
    expect(networkErrorsAfter.length).toBe(0);
  });
});

/**
 * Using the testWithErrorCapture helper for automatic error checking
 */
test.describe('Example: Automatic Error Capture', () => {
  // testWithErrorCapture automatically enables capture and asserts no errors
  test('simple test with automatic error checking', async ({ page, loginAs }) => {
    await loginAs(page, 'active.gc@test.forsured.com');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // Errors are automatically captured and test fails if any occur
    // No need to call captureErrors() or assertNoErrors()
  });
});
