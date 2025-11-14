import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  
  // Global timeout for entire test run (30 minutes) - prevents SIGTERM from timeout
  globalTimeout: 30 * 60 * 1000,
  
  // Timeout per test (90 seconds) - increased for office admin tests
  timeout: 90_000,
  
  expect: {
    timeout: 5_000,
  },
  
  // Limit parallel workers to prevent resource exhaustion
  // Use 2-4 workers instead of fully parallel to avoid memory/CPU issues
  workers: process.env.CI ? 1 : 4,
  fullyParallel: true,
  
  // Retry failed tests once (helps with flaky tests)
  retries: process.env.CI ? 2 : 0,
  
  reporter: [['list']],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
    trace: 'on-first-retry',
    
    // Improve browser cleanup to prevent hanging processes
    launchOptions: {
      args: [
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-extensions',     // Disable extensions
        '--no-sandbox',            // Disable sandbox (helps with resource issues)
      ],
    },
  },
  
  projects: [
    // Setup project - runs first to create auth state files
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    /* Multi-viewport responsive testing - Priority 1 viewports */
    {
      name: 'iPhone SE',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPhone Pro Max',
      use: {
        ...devices['iPhone 12 Pro Max'],
        viewport: { width: 428, height: 926 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop 1080p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'Desktop 1440p',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1440 },
      },
      dependencies: ['setup'],
    },
  ],
})
