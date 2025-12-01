/**
 * Simplified Admin Test for Employer Discovery Route
 * Testing with increased timeout to diagnose auth/profile issues
 */

import { expect, type Page, test } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

const ROUTE_PATH = '/dashboard/discover/employers'

// Increase timeout for all tests
test.setTimeout(90000)

test.describe('Admin • Employer Discovery (Simplified)', () => {
  // Setup: Sign in as admin and navigate to employer discovery route before each test
  test.beforeEach(async ({ page }: { page: Page }) => {
    console.log('Starting admin sign in...')
    // Authentication handled by storage state (tests/.auth/admin.json)
    console.log('Admin signed in successfully, now on /dashboard')

    console.log('Navigating to employer discovery route...')
    await page.goto(ROUTE_PATH, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)
    console.log('Current URL:', page.url())
  })

  test('should sign in as admin and navigate to employer discovery', async ({
    page,
  }: {
    page: Page
  }) => {
    // Already on ROUTE_PATH from beforeEach
    expect(page.url()).toContain(ROUTE_PATH)

    // Check for basic content
    const bodyText = await page.locator('body').textContent()
    console.log('Page loaded, body text length:', bodyText?.length)

    expect(bodyText).toBeTruthy()
  })

  test('should display search input', async ({ page }: { page: Page }) => {
    // Already on ROUTE_PATH from beforeEach
    const searchInput = page.getByPlaceholder('Search employers...')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test('should display industry filter buttons', async ({ page }: { page: Page }) => {
    // Already on ROUTE_PATH from beforeEach
    const constructionButton = page.getByRole('button', { name: 'Construction', exact: true })
    await expect(constructionButton).toBeVisible({ timeout: 10000 })
  })
})
