/**
 * System Integration & End-to-End Testing
 * Playwright configuration for E2E tests
 *
 * CRITICAL: After auth bugs on 2025-12-03, we now enforce:
 * - Fail-fast: Stop on first failure to fix issues immediately
 * - Console error capture: Tests fail if console.error() is called
 * - Network error capture: Tests fail on 4xx/5xx responses
 * - Real database mode: Tests use real Supabase, not mocked APIs
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Stop after 3 failures - allows us to see multiple issues at once
  maxFailures: 3,

  // Global setup - waits for Supabase and Mailpit to be ready
  globalSetup: './tests/global-setup.ts',

  reporter: [
    ['html'],
    ['list'], // Console output with clear failure messages
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Strict mode: fail on console errors and network failures
    // This is overridden by base fixture for more granular control
    
    // Isolated mode: prevent browser instance conflicts
    // Each test gets a fresh browser context
    launchOptions: {
      // Use isolated user data directory to prevent conflicts
      args: process.env.CI ? [] : ['--user-data-dir=/tmp/playwright-isolated'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable console logging in tests
        // Use isolated mode to prevent browser instance conflicts
        launchOptions: {
          args: ['--enable-logging'],
        },
        // Isolated mode: each test gets its own browser context
        // This prevents conflicts when multiple tests run or when MCP browser is active
        contextOptions: {
          // Isolated storage and cookies per test
          storageState: undefined, // Each test starts fresh
        },
      },
    },
    // Run Firefox and WebKit in CI only to speed up local dev
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ] : []),
  ],

  webServer: {
    // In monorepo, run from the forsured-web app directory
    command: 'pnpm --filter @unicornlove/forsured-app dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    // Run command from monorepo root
    cwd: '../..',
  },
});
