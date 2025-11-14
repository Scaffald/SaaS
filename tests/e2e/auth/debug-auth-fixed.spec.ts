import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

/**
 * Test the fixed authentication helper
 */
test.describe('Fixed Authentication Test', () => {
  test('should successfully authenticate and navigate to dashboard', async ({ page }) => {
    console.log('\n=== Testing Fixed Authentication ===')

    // Enable console logging
    page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))
    page.on('pageerror', (err) => console.error('[PAGE ERROR]:', err.message))

    // Use the fixed sign-in helper
    await signInAsAdmin(page)

    console.log('\n=== Verifying Authentication ===')
    console.log('Current URL:', page.url())

    // Take a screenshot
    await page.screenshot({ path: '.playwright-mcp/auth-fixed-result.png', fullPage: true })

    // Verify we're on the dashboard (not redirected to /auth)
    expect(page.url()).toContain('/dashboard')

    console.log('✅ Authentication successful!')
  })
})
