import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/playwright',
  
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
