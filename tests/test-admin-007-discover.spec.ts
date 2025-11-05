// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

test.describe('Admin • /dashboard/discover', () => {
  test('explore discover route UI elements', async ({ page }: { page: Page }) => {
    // Sign in as admin
  // Authentication handled by storage state (tests/.auth/admin.json)

    // Navigate to discover route
    await page.goto('/dashboard/discover')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-007-discover-route.png',
      fullPage: true
    })

    // Verify page loaded
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Get current URL
    const currentURL = page.url()
    console.log(`Current URL: ${currentURL}`)

    // Check for common navigation elements
    const hasDiscoverLink = await page.locator('text=/discover/i').count() > 0
    const hasNavigation = await page.locator('[role="navigation"]').count() > 0

    console.log(`Has Discover link: ${hasDiscoverLink}`)
    console.log(`Has Navigation: ${hasNavigation}`)

    // Log all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    console.log(`Headings found: ${headings.join(', ')}`)

    // Log all buttons
    const buttons = await page.locator('button').allTextContents()
    console.log(`Buttons found (${buttons.length}): ${buttons.slice(0, 10).join(', ')}...`)

    // Log all links
    const links = await page.locator('a').count()
    console.log(`Links found: ${links}`)
  })
})
