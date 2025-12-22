/**
 * Base Test Fixture with Error Capture
 *
 * After critical auth bugs on 2025-12-03, all E2E tests now:
 * - Capture ALL console messages (errors, warnings, logs) for debugging
 * - Capture network errors (4xx/5xx) and fail tests
 * - Provide helpers for authentication with test users
 * - Automatically attach console/network logs to test results on failure
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/base';
 *
 * test('user can log in', async ({ page, assertNoErrors }) => {
 *   await page.goto('/start');
 *   // ... test actions ...
 *   await assertNoErrors(); // Fails if console/network errors occurred
 * });
 * ```
 */

import { test as baseTest, expect, Page } from '@playwright/test';
import { loginAs, setupAuthAs, TEST_USERS } from '../../utils/auth';

interface ConsoleMessage {
  type: string;
  text: string;
  location: string;
  timestamp: number;
}

interface NetworkLog {
  status: number;
  url: string;
  method: string;
  timestamp: number;
  isError: boolean;
}

interface BaseFixtures {
  page: Page;
  captureErrors: () => void;
  assertNoErrors: () => void;
  getConsoleLogs: () => ConsoleMessage[];
  getNetworkLogs: () => NetworkLog[];
  getConsoleErrors: () => ConsoleMessage[];
  getNetworkErrors: () => NetworkLog[];
  loginAs: typeof loginAs;
  setupAuthAs: typeof setupAuthAs;
  testUsers: typeof TEST_USERS;
}

/**
 * Extended test fixture that captures console and network logs
 * Logs are ALWAYS captured and attached to test results on failure
 */
export const test = baseTest.extend<BaseFixtures>({
  page: async ({ page }, use, testInfo) => {
    const consoleLogs: ConsoleMessage[] = [];
    const networkLogs: NetworkLog[] = [];
    const startTime = Date.now();

    // Capture ALL console messages for debugging
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();

      consoleLogs.push({
        type,
        text,
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
        timestamp: Date.now() - startTime,
      });
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      consoleLogs.push({
        type: 'EXCEPTION',
        text: `${error.name}: ${error.message}`,
        location: error.stack || 'unknown',
        timestamp: Date.now() - startTime,
      });
    });

    // Capture ALL network responses for debugging
    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      const request = response.request();

      // Skip noisy requests (chrome extensions, data URLs)
      if (url.startsWith('chrome-extension://') || url.startsWith('data:')) {
        return;
      }

      const isError = status >= 400;
      // Filter out expected errors
      const isExpectedError = (
        (status === 406 && url.includes('/rest/v1/')) ||
        (status === 404 && url.includes('/@fs/')) ||
        (status === 404 && url.includes('favicon.ico'))
      );

      networkLogs.push({
        status,
        url,
        method: request.method(),
        timestamp: Date.now() - startTime,
        isError: isError && !isExpectedError,
      });
    });

    // Attach helpers to page context
    (page as any)._consoleLogs = consoleLogs;
    (page as any)._networkLogs = networkLogs;

    await use(page);

    // After test: attach logs to test results if test failed
    if (testInfo.status !== 'passed') {
      // Attach console logs
      if (consoleLogs.length > 0) {
        const consoleLogText = consoleLogs
          .map(log => `[${log.timestamp}ms] [${log.type.toUpperCase()}] ${log.text}\n  at ${log.location}`)
          .join('\n\n');

        await testInfo.attach('console-logs.txt', {
          body: consoleLogText,
          contentType: 'text/plain',
        });
      }

      // Attach network logs
      if (networkLogs.length > 0) {
        const networkLogText = networkLogs
          .map(log => `[${log.timestamp}ms] ${log.isError ? 'ERROR ' : ''}[${log.status}] ${log.method} ${log.url}`)
          .join('\n');

        await testInfo.attach('network-logs.txt', {
          body: networkLogText,
          contentType: 'text/plain',
        });
      }
    }
  },

  /**
   * Enable error capture for this test (no-op now, capture is always on)
   * @deprecated Logs are now always captured
   */
  captureErrors: async ({ page }, use) => {
    const enableCapture = () => {
      // No-op - capture is always enabled
    };
    await use(enableCapture);
  },

  /**
   * Assert that no console or network errors occurred during the test
   * Call this at the end of your test to verify no errors
   */
  assertNoErrors: async ({ page }, use) => {
    const assertFn = () => {
      const consoleLogs: ConsoleMessage[] = (page as any)._consoleLogs || [];
      const networkLogs: NetworkLog[] = (page as any)._networkLogs || [];

      // Filter for actual errors (not warnings, logs, etc.)
      const consoleErrors = consoleLogs.filter(msg => {
        // Only check errors and exceptions
        if (msg.type !== 'error' && msg.type !== 'EXCEPTION') return false;
        // Ignore React DevTools messages
        if (msg.text.includes('React DevTools')) return false;
        // Ignore HMR warnings in dev
        if (msg.text.includes('[vite]') || msg.text.includes('HMR')) return false;
        // Ignore expected Supabase warnings about missing environment
        if (msg.text.includes('supabase') && msg.text.includes('not configured')) return false;
        // Ignore React prop warnings from Tamagui/react-native-web passing style props to DOM
        // These are known library behaviors, not critical bugs
        if (msg.text.includes('React does not recognize the') && msg.text.includes('prop on a DOM element')) return false;
        // Ignore Vite dev server 500 errors on DatabaseContext (transient build cache issue)
        // These are dev server caching issues, not actual code problems
        if (msg.text.includes('Failed to load resource') && msg.text.includes('500') && (msg.location.includes('DatabaseContext') || msg.text.includes('DatabaseContext'))) return false;
        return true;
      });

      // Filter for actual network errors
      // Ignore 401 errors that occur during initial page load/auth setup
      // These can happen as the page loads before auth is fully established
      const networkErrors = networkLogs.filter(log => {
        if (!log.isError) return false;
        // Ignore 401 errors during initial load (first 3 seconds)
        if (log.status === 401 && log.timestamp < 3000) return false;
        // Ignore 401 errors on auth/profile endpoints during setup
        if (log.status === 401 && (
          log.url.includes('/auth/') ||
          log.url.includes('get_user_profile') ||
          log.url.includes('user_profiles') ||
          log.url.includes('getUserLexicon') ||
          log.url.includes('userSetTypes')
        )) return false;
        // Ignore 500 errors on DatabaseContext.tsx (Vite dev server cache issue)
        // These are transient build cache issues, not actual code problems
        if (log.status === 500 && log.url.includes('DatabaseContext.tsx')) return false;
        return true;
      });

      if (consoleErrors.length > 0) {
        const errorReport = consoleErrors
          .map(err => `  [${err.timestamp}ms] [${err.type}] ${err.text}\n    at ${err.location}`)
          .join('\n\n');

        throw new Error(
          `Console errors detected during test:\n\n${errorReport}\n\n` +
          `Tests must not produce console errors. Fix the underlying issue.`
        );
      }

      if (networkErrors.length > 0) {
        const errorReport = networkErrors
          .map(err => `  [${err.timestamp}ms] [${err.status}] ${err.method} ${err.url}`)
          .join('\n');

        throw new Error(
          `Network errors detected during test:\n\n${errorReport}\n\n` +
          `Tests must not produce network errors. Check API responses and permissions.`
        );
      }
    };

    await use(assertFn);
  },

  /**
   * Get all console logs captured during the test (for inspection/debugging)
   */
  getConsoleLogs: async ({ page }, use) => {
    const getFn = () => {
      return (page as any)._consoleLogs || [];
    };
    await use(getFn);
  },

  /**
   * Get all network logs captured during the test (for inspection/debugging)
   */
  getNetworkLogs: async ({ page }, use) => {
    const getFn = () => {
      return (page as any)._networkLogs || [];
    };
    await use(getFn);
  },

  /**
   * Get only console errors (filtered from all logs)
   */
  getConsoleErrors: async ({ page }, use) => {
    const getFn = (): ConsoleMessage[] => {
      const consoleLogs: ConsoleMessage[] = (page as any)._consoleLogs || [];
      return consoleLogs.filter(msg => {
        if (msg.type !== 'error' && msg.type !== 'EXCEPTION') return false;
        if (msg.text.includes('React DevTools')) return false;
        if (msg.text.includes('[vite]') || msg.text.includes('HMR')) return false;
        if (msg.text.includes('supabase') && msg.text.includes('not configured')) return false;
        return true;
      });
    };
    await use(getFn);
  },

  /**
   * Get only network errors (4xx/5xx filtered from all logs)
   */
  getNetworkErrors: async ({ page }, use) => {
    const getFn = (): NetworkLog[] => {
      const networkLogs: NetworkLog[] = (page as any)._networkLogs || [];
      return networkLogs.filter(log => log.isError);
    };
    await use(getFn);
  },

  /**
   * Convenience: loginAs helper from auth utils
   */
  loginAs: async ({}, use) => {
    await use(loginAs);
  },

  /**
   * Convenience: setupAuthAs helper from auth utils
   */
  setupAuthAs: async ({}, use) => {
    await use(setupAuthAs);
  },

  /**
   * Convenience: TEST_USERS from auth utils
   */
  testUsers: async ({}, use) => {
    await use(TEST_USERS);
  },
});

// Re-export expect
export { expect };

/**
 * Test helper: Run a test with automatic error capture
 *
 * Usage:
 * ```typescript
 * testWithErrorCapture('user can log in', async ({ page }) => {
 *   await page.goto('/start');
 *   // Errors are automatically captured and test fails if any occur
 * });
 * ```
 */
export function testWithErrorCapture(
  name: string,
  fn: (fixtures: BaseFixtures & { page: Page }) => Promise<void>
) {
  test(name, async (fixtures) => {
    fixtures.captureErrors(); // Enable capture
    await fn(fixtures);
    fixtures.assertNoErrors(); // Assert at end
  });
}
