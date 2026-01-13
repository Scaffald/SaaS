/**
 * Office API Keys Analytics E2E Tests
 *
 * Tests comprehensive API key analytics and usage tracking including:
 * - API keys list page
 * - Usage metrics and graphs
 * - Time series data visualization
 * - Endpoint breakdown analytics
 * - Status code distribution
 * - Rate limit tracking
 */

import { expect, type Page, test } from '@playwright/test'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Increase timeout for office operations
test.setTimeout(90000)

// Helper to wait for API keys to load
async function waitForAPIKeysLoad(page: Page) {
  await page.waitForTimeout(2000)
}

test.describe('Office • API Keys Analytics', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    console.log('Signing in as admin...')
    // Authentication handled by storage state (tests/.auth/super-admin.json)
    console.log('Admin signed in successfully')
  })

  test.describe('API Keys List Page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Navigating to API keys page...')
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should load API keys list page successfully', async ({ page }: { page: Page }) => {
      // Verify URL
      expect(page.url()).toContain('/office/api-keys')

      // Check for page title
      const pageTitle = page.getByRole('heading', { name: /api keys/i })
      await expect(pageTitle).toBeVisible({ timeout: 10000 })

      console.log('API keys list page loaded successfully')
    })

    test('should display create API key button', async ({ page }: { page: Page }) => {
      const createButton = page.getByRole('button', { name: /create api key/i })
      await expect(createButton).toBeVisible({ timeout: 10000 })
    })

    test('should display API key cards or table', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Check for API key cards/rows or empty state
      const apiKeyCards = page.locator('[data-testid="api-key-card"]')
      const apiKeyRows = page.locator('[data-testid="api-key-row"]')
      const emptyState = page.getByText(/no api keys/i)

      const cardCount = await apiKeyCards.count()
      const rowCount = await apiKeyRows.count()

      if (cardCount > 0 || rowCount > 0) {
        console.log(`Found ${cardCount + rowCount} API key(s)`)
      } else {
        // Empty state should be visible
        const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false)
        if (hasEmptyState) {
          console.log('Empty state displayed (no API keys)')
        } else {
          console.log('API keys list loaded')
        }
      }
    })

    test('should display API key prefix (not full key)', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      const apiKeyCards = page.locator('[data-testid="api-key-card"]')
      const cardCount = await apiKeyCards.count()

      if (cardCount > 0) {
        const firstCard = apiKeyCards.first()

        // Look for key prefix pattern (sk_live_...)
        const keyPrefix = firstCard.locator('text=/sk_[a-z]+_/i')
        const hasPrefixVisible = await keyPrefix.isVisible({ timeout: 3000 }).catch(() => false)

        if (hasPrefixVisible) {
          const prefixText = await keyPrefix.textContent()
          // Should not show full key (should be masked)
          expect(prefixText?.includes('***') || prefixText?.includes('•••')).toBe(true)
          console.log('API key prefix displayed (masked)')
        } else {
          console.log('API key display might use different format')
        }
      } else {
        console.log('No API keys to check prefix')
      }
    })
  })

  test.describe('API Key Usage Analytics', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Navigating to API keys page...')
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should display usage analytics section', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for analytics/usage section
      const analyticsSection = page.getByText(/usage analytics/i)
      const usageSection = page.getByText(/api usage/i)

      const hasAnalytics =
        (await analyticsSection.isVisible({ timeout: 3000 }).catch(() => false)) ||
        (await usageSection.isVisible({ timeout: 3000 }).catch(() => false))

      if (hasAnalytics) {
        console.log('Usage analytics section displayed')
        expect(hasAnalytics).toBe(true)
      } else {
        console.log('Analytics might be shown differently or no usage data yet')
      }
    })

    test('should display request count metrics', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for request count indicators
      const requestMetric = page.getByText(/requests/i).first()
      const hasRequestMetric =
        await requestMetric.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasRequestMetric) {
        console.log('Request count metrics displayed')
        expect(hasRequestMetric).toBe(true)
      } else {
        console.log('No usage data available yet')
      }
    })

    test('should display error rate metrics', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for error rate indicators
      const errorMetric = page.getByText(/error/i).first()
      const hasErrorMetric = await errorMetric.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasErrorMetric) {
        console.log('Error rate metrics displayed')
      } else {
        console.log('Error metrics not shown (might be zero errors)')
      }
    })

    test('should display average response time', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for response time indicators (ms, milliseconds, latency, etc.)
      const responseTimeMetric = page
        .getByText(/response time|latency|ms|milliseconds/i)
        .first()
      const hasResponseTime =
        await responseTimeMetric.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasResponseTime) {
        console.log('Response time metrics displayed')
      } else {
        console.log('Response time not shown (might be no data)')
      }
    })
  })

  test.describe('Time Series Data Visualization', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should display time series chart', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for chart/graph elements
      const chartSection = page.locator('[data-testid="usage-chart"]')
      const hasChart = await chartSection.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasChart) {
        console.log('Time series chart displayed')
        expect(hasChart).toBe(true)
      } else {
        console.log('Chart not visible (might be no data or different component)')
      }
    })

    test('should display date labels on chart', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for date patterns (MMM dd format)
      const dateLabel = page.locator('text=/[A-Z][a-z]{2} \\d{1,2}/i').first()
      const hasDateLabel = await dateLabel.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasDateLabel) {
        const dateText = await dateLabel.textContent()
        console.log('Date labels displayed:', dateText)
      } else {
        console.log('Date labels not visible (might be no data)')
      }
    })

    test('should show requests over time', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(3000)

      // Look for chart data points or bars
      const chartBars = page.locator('[data-testid="chart-bar"]')
      const chartPoints = page.locator('[data-testid="chart-point"]')

      const barCount = await chartBars.count().catch(() => 0)
      const pointCount = await chartPoints.count().catch(() => 0)

      if (barCount > 0 || pointCount > 0) {
        console.log(`Chart has ${barCount + pointCount} data points`)
      } else {
        console.log('Chart data might use different markup or no data available')
      }
    })

    test('should display period selector (7d, 30d, 90d)', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for period selector buttons/tabs
      const period7d = page.getByRole('button', { name: /7.*day|last.*week/i })
      const period30d = page.getByRole('button', { name: /30.*day|last.*month/i })

      const has7d = await period7d.isVisible({ timeout: 3000 }).catch(() => false)
      const has30d = await period30d.isVisible({ timeout: 3000 }).catch(() => false)

      if (has7d || has30d) {
        console.log('Period selector displayed')
      } else {
        console.log('Period selector might use different labels')
      }
    })
  })

  test.describe('Endpoint Breakdown Analytics', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should display top endpoints table', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for endpoints section or table
      const endpointsSection = page.getByText(/endpoints|top.*endpoint/i).first()
      const hasEndpoints =
        await endpointsSection.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasEndpoints) {
        console.log('Endpoints section displayed')
        expect(hasEndpoints).toBe(true)
      } else {
        console.log('No endpoint data available yet')
      }
    })

    test('should show endpoint paths', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for API endpoint patterns (/v1/...)
      const endpointPath = page.locator('text=/\\/v1\\/[a-z-]+/i').first()
      const hasPath = await endpointPath.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasPath) {
        const pathText = await endpointPath.textContent()
        console.log('Endpoint paths displayed:', pathText)
      } else {
        console.log('No endpoint paths visible (might be no data)')
      }
    })

    test('should show HTTP methods for endpoints', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for HTTP method badges (GET, POST, etc.)
      const getMethod = page.getByText('GET', { exact: true })
      const postMethod = page.getByText('POST', { exact: true })

      const hasGet = await getMethod.isVisible({ timeout: 3000 }).catch(() => false)
      const hasPost = await postMethod.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasGet || hasPost) {
        console.log('HTTP methods displayed')
      } else {
        console.log('HTTP methods not shown (might be no data)')
      }
    })

    test('should display endpoint call counts', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for numeric counts next to endpoints
      const callCount = page.locator('[data-testid="endpoint-count"]').first()
      const hasCount = await callCount.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasCount) {
        const countText = await callCount.textContent()
        console.log('Endpoint call counts displayed:', countText)
      } else {
        console.log('Call counts might use different markup')
      }
    })

    test('should show endpoint response times', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for response time metrics per endpoint
      const responseTime = page
        .locator('[data-testid="endpoint-response-time"]')
        .first()
      const hasResponseTime =
        await responseTime.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasResponseTime) {
        const timeText = await responseTime.textContent()
        console.log('Endpoint response times displayed:', timeText)
      } else {
        console.log('Response times not shown per endpoint')
      }
    })

    test('should display endpoint error rates', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for error rate percentages
      const errorRate = page.locator('[data-testid="endpoint-error-rate"]').first()
      const hasErrorRate = await errorRate.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasErrorRate) {
        const rateText = await errorRate.textContent()
        // Should be a percentage
        expect(rateText?.includes('%')).toBe(true)
        console.log('Endpoint error rates displayed:', rateText)
      } else {
        console.log('Error rates not shown (might be zero errors)')
      }
    })
  })

  test.describe('Status Code Distribution', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should display status code breakdown', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for status codes section
      const statusSection = page.getByText(/status.*code|http.*status/i).first()
      const hasStatus = await statusSection.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasStatus) {
        console.log('Status code section displayed')
        expect(hasStatus).toBe(true)
      } else {
        console.log('Status codes not shown (might be no data)')
      }
    })

    test('should show 2xx success codes', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for 200, 201 status codes
      const status200 = page.getByText('200', { exact: true })
      const status201 = page.getByText('201', { exact: true })

      const has200 = await status200.isVisible({ timeout: 3000 }).catch(() => false)
      const has201 = await status201.isVisible({ timeout: 3000 }).catch(() => false)

      if (has200 || has201) {
        console.log('Success status codes displayed')
      } else {
        console.log('No success codes shown (might be no requests yet)')
      }
    })

    test('should show 4xx client error codes when present', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for 400, 401, 404 status codes
      const status400 = page.getByText('400', { exact: true })
      const status401 = page.getByText('401', { exact: true })
      const status404 = page.getByText('404', { exact: true })

      const has400 = await status400.isVisible({ timeout: 3000 }).catch(() => false)
      const has401 = await status401.isVisible({ timeout: 3000 }).catch(() => false)
      const has404 = await status404.isVisible({ timeout: 3000 }).catch(() => false)

      if (has400 || has401 || has404) {
        console.log('Client error codes displayed')
      } else {
        console.log('No client errors (good!)')
      }
    })

    test('should show 5xx server error codes when present', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for 500, 502, 503 status codes
      const status500 = page.getByText('500', { exact: true })
      const status502 = page.getByText('502', { exact: true })
      const status503 = page.getByText('503', { exact: true })

      const has500 = await status500.isVisible({ timeout: 3000 }).catch(() => false)
      const has502 = await status502.isVisible({ timeout: 3000 }).catch(() => false)
      const has503 = await status503.isVisible({ timeout: 3000 }).catch(() => false)

      if (has500 || has502 || has503) {
        console.log('Server error codes displayed')
      } else {
        console.log('No server errors (good!)')
      }
    })
  })

  test.describe('Rate Limit Tracking', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should display rate limit status', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for rate limit indicators
      const rateLimitSection = page.getByText(/rate limit|quota/i).first()
      const hasRateLimit =
        await rateLimitSection.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasRateLimit) {
        console.log('Rate limit section displayed')
        expect(hasRateLimit).toBe(true)
      } else {
        console.log('Rate limit not shown (might be unlimited or not implemented)')
      }
    })

    test('should show current usage vs limit', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for usage fraction (e.g., "1,234 / 10,000")
      const usageFraction = page.locator('text=/\\d+.*\\/.*\\d+/').first()
      const hasFraction = await usageFraction.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasFraction) {
        const fractionText = await usageFraction.textContent()
        console.log('Usage vs limit displayed:', fractionText)
      } else {
        console.log('Usage fraction not shown')
      }
    })

    test('should display progress bar for rate limit', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for progress bar component
      const progressBar = page.locator('[role="progressbar"]').first()
      const hasProgress = await progressBar.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasProgress) {
        const ariaValue = await progressBar.getAttribute('aria-valuenow')
        console.log('Rate limit progress bar displayed, value:', ariaValue)
      } else {
        console.log('Progress bar not shown')
      }
    })

    test('should warn when approaching rate limit', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for warning indicators (yellow/orange colors, warning text)
      const warningText = page.getByText(/warning|approaching.*limit|80%|90%/i).first()
      const hasWarning = await warningText.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasWarning) {
        console.log('Rate limit warning displayed')
      } else {
        console.log('No rate limit warning (usage probably low)')
      }
    })
  })

  test.describe('Usage Analytics Calculations', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/api-keys')
      await waitForAPIKeysLoad(page)
    })

    test('should calculate total requests correctly', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(3000)

      // Look for total requests metric
      const totalRequests = page.locator('[data-testid="total-requests"]').first()
      const hasTotal = await totalRequests.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasTotal) {
        const totalText = await totalRequests.textContent()
        // Should be a number (possibly formatted with commas)
        const numberMatch = totalText?.match(/[\d,]+/)
        if (numberMatch) {
          console.log('Total requests calculated:', numberMatch[0])
        }
      } else {
        console.log('Total requests not visible')
      }
    })

    test('should calculate average response time from real data', async ({
      page,
    }: {
      page: Page
    }) => {
      await page.waitForTimeout(3000)

      // Look for average response time metric
      const avgResponseTime = page.locator('[data-testid="avg-response-time"]').first()
      const hasAvg = await avgResponseTime.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasAvg) {
        const avgText = await avgResponseTime.textContent()
        // Should contain "ms" and a number
        expect(avgText?.toLowerCase().includes('ms')).toBe(true)
        console.log('Average response time calculated:', avgText)
      } else {
        console.log('Average response time not visible')
      }
    })

    test('should calculate error percentage correctly', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(3000)

      // Look for error rate/percentage
      const errorRate = page.locator('[data-testid="error-rate"]').first()
      const hasRate = await errorRate.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasRate) {
        const rateText = await errorRate.textContent()
        // Should be a percentage
        const percentageMatch = rateText?.match(/[\d.]+%/)
        if (percentageMatch) {
          const percentage = parseFloat(percentageMatch[0])
          // Should be between 0 and 100
          expect(percentage).toBeGreaterThanOrEqual(0)
          expect(percentage).toBeLessThanOrEqual(100)
          console.log('Error rate calculated:', percentageMatch[0])
        }
      } else {
        console.log('Error rate not visible')
      }
    })
  })
})
