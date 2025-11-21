import type { Page } from '@playwright/test'

const NON_ESSENTIAL_PATTERNS = [
  /https?:\/\/app\.posthog\.com\//i,
  /https?:\/\/cdn\.posthog\.com\//i,
  /https?:\/\/.*\.sentry\.io\//i,
  /https?:\/\/www\.google-analytics\.com\//i,
]

/**
 * Prevent non-essential analytics and observability traffic from leaving the
 * test environment. This keeps tests hermetic and safe to run in parallel.
 */
export async function stubNonEssentialRequests(page: Page) {
  for (const pattern of NON_ESSENTIAL_PATTERNS) {
    await page.route(pattern, async route => {
      try {
        await route.fulfill({
          status: 204,
          body: 'stubbed by Playwright test harness',
        })
      } catch {
        await route.abort('failed')
      }
    })
  }
}
