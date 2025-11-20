// @ts-nocheck
import { expect, type Page, test } from '@playwright/test'

/**
 * Test Suite: Admin • /auth/confirm (Route Does Not Exist)
 *
 * This test suite verifies that the /auth/confirm route correctly displays
 * a 404 "Unmatched Route" error page, as the route does not exist in the
 * application codebase.
 *
 * Note: These tests do not require authentication since 404 pages are
 * publicly accessible. This avoids timeout issues with profile completion.
 *
 * Discovered during: admin-route-explore-003
 * Documentation: docs/testing/admin-route-explore-003-COMPLETE.md
 */

test.describe('Admin • /auth/confirm (Route Does Not Exist)', () => {
  // Run tests serially to avoid dev server overload
  test.describe.configure({ mode: 'serial' })

  test('shows unmatched route error for /auth/confirm', async ({ page }: { page: Page }) => {
    // Navigate directly to the non-existent route
    // Use 'load' instead of 'domcontentloaded' for better reliability
    await page.goto('/auth/confirm', { waitUntil: 'load', timeout: 30000 })

    // Verify URL is correct
    expect(page.url()).toContain('/auth/confirm')

    // Wait for React to render the 404 page
    await page.waitForSelector('h1', { timeout: 15000 })

    // Verify unmatched route error is displayed
    await expect(page.locator('h1')).toContainText('Unmatched Route', { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('Page could not be found', { timeout: 10000 })

    // Verify the URL is displayed on the error page
    await expect(page.locator('body')).toContainText('/auth/confirm', { timeout: 10000 })
  })

  test('provides navigation options from 404 page', async ({ page }: { page: Page }) => {
    await page.goto('/auth/confirm', { waitUntil: 'load', timeout: 30000 })

    // Wait for React to render the 404 page
    await page.waitForSelector('h1', { timeout: 15000 })

    // Verify "Go back" link exists
    const goBackLink = page.getByText('Go back')
    await expect(goBackLink).toBeVisible({ timeout: 10000 })

    // Verify "Sitemap" link exists
    const sitemapLink = page.getByRole('link', { name: 'Sitemap' })
    await expect(sitemapLink).toBeVisible({ timeout: 10000 })
  })

  test('sitemap link navigates away from 404 page', async ({ page }: { page: Page }) => {
    await page.goto('/auth/confirm', { waitUntil: 'load', timeout: 30000 })

    // Wait for React to render the 404 page
    await page.waitForSelector('h1', { timeout: 15000 })

    // Store original URL to verify navigation occurred
    const originalUrl = page.url()
    expect(originalUrl).toContain('/auth/confirm')

    // Click sitemap link
    const sitemapLink = page.getByRole('link', { name: 'Sitemap' })
    await sitemapLink.click({ timeout: 10000 })

    // Wait for navigation to complete
    await page.waitForTimeout(2000)

    // Verify URL changed (we navigated away from the 404 page)
    const newUrl = page.url()
    expect(newUrl).not.toBe(originalUrl)
    expect(newUrl).toContain('_sitemap')
  })
})
