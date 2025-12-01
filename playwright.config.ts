import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Phase 1: Smoke Tests Only
 * - Only critical tests are enabled initially
 * - See tests/docs/TODO.md for full re-enablement strategy
 */
export default defineConfig({
  // Phase 1: Enable E2E tests (previously disabled_tests)
  testDir: "./tests/e2e",

  // Phase 1: Only run smoke tests (critical path tests)
  // Comment out testMatch to enable all tests in Phase 4
  testMatch: [
    "**/test-a001-*.spec.ts", // Root page loads
    "**/test-a002-*.spec.ts", // Auth page renders
    "**/test-r003-*.spec.ts", // Dashboard navigation
    "**/user-journeys.spec.ts", // Basic user flows
  ],

  // Exclude debug/exploration files permanently
  testIgnore: [
    "**/debug-*.spec.ts",
    "**/explore-*.spec.ts",
    "**/*.js", // Skip JS files (only TS tests)
  ],

  // Phase 3: Optimized timeouts
  globalTimeout: 10 * 60 * 1000, // 10 minutes max (was 30 minutes)
  timeout: 45_000, // 45s per test (reduced from 90s)

  expect: {
    timeout: 10_000, // 10s for assertions (increased from 5s)
  },

  // Limit parallel workers to prevent resource exhaustion
  workers: process.env.CI ? 1 : 4,
  fullyParallel: true,

  // Retry failed tests (helps with flaky tests)
  retries: process.env.CI ? 2 : 1,

  // Reporters: quiet for CI, HTML for local debugging
  reporter: [
    ["./tests/infrastructure/playwright/quiet-reporter.ts"],
    ["html", { outputFolder: "tests/reports/playwright", open: "never" }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",

    // Improve browser cleanup to prevent hanging processes
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--no-sandbox",
      ],
    },
  },

  // Phase 1: Start with chromium only for stability
  // Expand to multi-viewport in Phase 4
  projects: [
    // Setup project - runs first to create auth state files
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      testDir: "./tests/e2e",
    },
    // Primary browser - desktop Chrome
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      timeout: 45_000,
      dependencies: ["setup"],
    },
    // Phase 4: Uncomment to enable multi-viewport testing
    // {
    //   name: 'iPhone SE',
    //   use: {
    //     ...devices['iPhone SE'],
    //     viewport: { width: 375, height: 667 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'iPhone 12',
    //   use: {
    //     ...devices['iPhone 12'],
    //     viewport: { width: 390, height: 844 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'iPad',
    //   use: {
    //     ...devices['iPad'],
    //     viewport: { width: 768, height: 1024 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Desktop 1080p',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    //   timeout: 45_000,
    //   dependencies: ['setup'],
    // },
  ],
});
