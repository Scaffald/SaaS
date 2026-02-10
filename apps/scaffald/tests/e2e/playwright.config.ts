/**
 * Playwright Configuration for Scaffald E2E Tests
 *
 * Tests run against Expo Web (localhost:8081)
 * Uses real Supabase instance (no mocking)
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  // Run tests in files in parallel
  fullyParallel: false, // Serial execution for E2E to avoid conflicts

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker for test isolation
  workers: 1,

  // Reporter to use
  reporter: [
    ["html"],
    ["json", { outputFile: "../../tests/reports/e2e-results.json" }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for Expo Web
    baseURL: "http://localhost:8081",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "pnpm expo start:web",
    url: "http://localhost:8081",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },

  // Global setup script
  globalSetup: require.resolve("./global-setup.ts"),
});
