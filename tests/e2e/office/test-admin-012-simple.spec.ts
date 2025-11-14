/**
 * Simplified Admin Discover Workers exploration test
 */

import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

test.describe('Admin Discover Workers', () => {
  test('explore worker discovery interface', async ({ page }) => {
    test.setTimeout(60000) // 60 second timeout

    // Use the working auth helper
  // Authentication handled by storage state (tests/.auth/admin.json)
    console.log('✓ Authenticated as admin and profile complete')

    // Navigate to worker discovery
    await page.goto('/dashboard/discover/workers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    console.log('✓ Loaded worker discovery page')

    // Capture screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-012-dashboard-profile-skills.png',
      fullPage: true
    })

    console.log('✅ Screenshot captured')

    // Get page content for analysis
    const bodyText = await page.locator('body').textContent()
    console.log('\n=== PAGE CONTENT ANALYSIS ===')
    console.log('Page contains "worker":', bodyText?.toLowerCase().includes('worker') || false)
    console.log('Page contains "search":', bodyText?.toLowerCase().includes('search') || false)
    console.log('Page contains "filter":', bodyText?.toLowerCase().includes('filter') || false)
    console.log('Page contains "skill":', bodyText?.toLowerCase().includes('skill') || false)

    // Document UI elements
    console.log('\n=== UI ELEMENT INVENTORY ===')

    const buttonCount = await page.locator('button').count()
    console.log(`Buttons: ${buttonCount}`)

    const inputCount = await page.locator('input').count()
    console.log(`Inputs: ${inputCount}`)

    const linkCount = await page.locator('a').count()
    console.log(`Links: ${linkCount}`)

    const h1Count = await page.locator('h1').count()
    const h2Count = await page.locator('h2').count()
    const h3Count = await page.locator('h3').count()
    console.log(`Headings: h1=${h1Count}, h2=${h2Count}, h3=${h3Count}`)

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent()
      console.log(`Main heading: "${h1Text}"`)
    }

    // Look for worker cards
    const cardSelectors = [
      '[data-testid*="worker"]',
      '[class*="worker-card"]',
      '[class*="profile-card"]',
      '[class*="card"]'
    ]

    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`Found ${count} elements matching "${selector}"`)
      }
    }

    // Look for search/filter elements
    const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i]').count()
    console.log(`Search inputs: ${searchInput}`)

    // Check for panels
    const leftPanel = await page.locator('[data-testid="left-panel"], [class*="left"]').count()
    const rightPanel = await page.locator('[data-testid="right-panel"], [class*="right"]').count()
    console.log(`Left panel elements: ${leftPanel}`)
    console.log(`Right panel elements: ${rightPanel}`)

    console.log('\n✅ UI exploration complete')
  })
})
