/**
 * Verification test - Does storage state authentication work?
 * This test will tell us if the Storage State approach is viable.
 */
import { test, expect } from '@playwright/test'

// Use the admin storage state
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Storage State Verification', () => {
  test('should be authenticated using storage state', async ({ page }) => {
    console.log('🔍 Testing storage state authentication...')

    // Enable console logging to see auth state
    page.on('console', msg => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))

    // Navigate to dashboard
    console.log('📍 Navigating to /dashboard...')
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Log final URL
    const finalUrl = page.url()
    console.log(`📍 Final URL: ${finalUrl}`)

    // Check if we stayed on dashboard (not redirected to /auth)
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Stayed on dashboard - authentication worked!')
      await expect(page).toHaveURL(/dashboard/)
    } else {
      console.log('❌ FAILED: Redirected away from dashboard')
      console.log('   This means storage state did not preserve authentication')

      // Take screenshot for debugging
      await page.screenshot({ path: '.playwright-mcp/verify-storage-state-failed.png' })

      // Still check URL to see where we ended up
      console.log(`   Expected: /dashboard`)
      console.log(`   Got: ${finalUrl}`)

      // This will fail the test with clear error
      await expect(page).toHaveURL(/dashboard/)
    }
  })

  test('should have localStorage with auth token', async ({ page }) => {
    console.log('🔍 Checking if localStorage has auth data...')

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const localStorage = await page.evaluate(() => {
      const result: Record<string, any> = {}
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          const value = window.localStorage.getItem(key)
          if (key.includes('auth') || key.includes('sb-')) {
            result[key] = value ? 'present' : 'missing'
          }
        }
      }
      return result
    })

    console.log('📦 localStorage auth keys:', JSON.stringify(localStorage, null, 2))

    // Check if we have any auth-related keys
    const hasAuthKey = Object.keys(localStorage).length > 0
    expect(hasAuthKey).toBe(true)
  })
})
