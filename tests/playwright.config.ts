import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for SCF-Neue tests
 * See https://playwright.dev/docs/test-configuration
 */
const jsonReportFile = process.env.PLAYWRIGHT_JSON_OUTPUT ?? 'playwright-report.json'

export default defineConfig({
  // Config file lives in ./tests, so point testDir to current directory
  testDir: '.',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['list'], ['json', { outputFile: jsonReportFile }], ['html']]
    : [['html'], ['json', { outputFile: jsonReportFile }]],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8081',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Multi-viewport responsive testing - Priority 1 viewports */
    {
      name: 'iPhone SE',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'iPhone Pro Max',
      use: {
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 428, height: 926 },
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
    {
      name: 'Desktop 1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop 1440p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm web',
    url: 'http://localhost:8081',
    reuseExistingServer: !process.env.CI,
  },
})



