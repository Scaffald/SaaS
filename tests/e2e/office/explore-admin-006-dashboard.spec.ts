// @ts-nocheck
/**
 * Exploration script for admin-route-explore-006: /dashboard
 * This script explores the main dashboard page as an admin user
 */
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

test.describe('Admin • /dashboard exploration', () => {
  test('explore dashboard page', async ({ page }: { page: Page }) => {
    // Sign in as admin (this handles profile completion automatically)
    await signInAsAdmin(page)

    // Navigate to dashboard
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard')

    // Wait for page to load
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(2000)

    // Take full page screenshot
    await page.screenshot({
      path: '.playwright-mcp/admin-006-dashboard-full.png',
      fullPage: true
    })

    // Document UI elements
    console.log('\n=== DASHBOARD PAGE UI ELEMENTS ===')

    const pageText = await page.locator('body').textContent() || ''

    // Page title/headers
    const headings = await page.locator('h1, h2, h3').allTextContents()
    console.log('Headings:', headings.filter(h => h.trim().length > 0))

    // Buttons
    const buttons = await page.locator('button').allTextContents()
    console.log('Buttons:', buttons.filter(b => b.trim().length > 0))

    // Links
    const links = await page.locator('a[href]').allTextContents()
    console.log('Navigation Links:', links.filter(l => l.trim().length > 0).slice(0, 20))

    // Check for key dashboard sections
    const hasProfileCompletion = pageText.includes('Complete Your Profile') || pageText.includes('Profile')
    const hasNews = pageText.includes('News') || pageText.includes('news')
    const hasNotifications = pageText.includes('Notification') || pageText.includes('notification')
    const hasNavigation = pageText.includes('Dashboard') || pageText.includes('Discover')
    const hasJobRecommendations = pageText.includes('Recommended') || pageText.includes('Jobs')

    console.log('\nKey Sections Present:')
    console.log('- Profile Completion Widget:', hasProfileCompletion)
    console.log('- News Feed:', hasNews)
    console.log('- Notifications:', hasNotifications)
    console.log('- Navigation Menu:', hasNavigation)
    console.log('- Job Recommendations:', hasJobRecommendations)

    // Get specific dashboard widgets
    console.log('\n=== DASHBOARD WIDGETS ===')

    // Profile completion widget
    const profileWidget = page.locator('text=Complete Your Profile').first()
    if (await profileWidget.count() > 0) {
      console.log('Profile Completion Widget: FOUND')
      const profileText = await profileWidget.locator('..').textContent()
      console.log('Widget content preview:', profileText?.slice(0, 200))
    }

    // News widget
    const newsWidget = page.locator('text=News').first()
    if (await newsWidget.count() > 0) {
      console.log('News Widget: FOUND')
    }

    // Get page accessibility tree
    const pageSnapshot = await page.accessibility.snapshot()
    console.log('\nPage Accessibility Tree:')
    console.log(JSON.stringify(pageSnapshot, null, 2))

    // Final assertion
    expect(pageText.length).toBeGreaterThan(0)
    console.log('\n✅ Dashboard exploration complete')
  })
})
