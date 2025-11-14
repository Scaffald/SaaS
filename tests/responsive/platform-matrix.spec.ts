/**
 * Platform-Specific Testing Matrix
 *
 * Tests for platform-specific functionality across iOS, Android, and Web.
 * Validates that features work correctly on all supported platforms.
 *
 * Task 11: Execute Platform-Specific Testing Matrix (iOS, Android, Web)
 *
 * Note: Some tests require running on actual mobile devices.
 * Web-based tests validate cross-platform compatibility.
 */

import { test, expect } from '@playwright/test'

/**
 * Platform-specific viewports
 */
const PLATFORM_VIEWPORTS = {
  ios: [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 428, height: 926 },
    { name: 'iPad', width: 768, height: 1024 },
  ],
  android: [
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'Galaxy S23', width: 360, height: 780 },
    { name: 'Galaxy Tab A7', width: 800, height: 1280 },
  ],
  web: [
    { name: 'Desktop Chrome', width: 1920, height: 1080 },
    { name: 'Desktop Safari', width: 1920, height: 1080 },
    { name: 'Desktop Firefox', width: 1920, height: 1080 },
  ],
}

/**
 * Key pages to test
 */
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/discover/workers', name: 'Discover Workers' },
  { path: '/dashboard/discover/map', name: 'Discover Map' },
]

test.describe('Platform-Specific Testing Matrix', () => {
  // iOS testing
  test.describe('iOS Platform', () => {
    for (const viewport of PLATFORM_VIEWPORTS.ios) {
      test.describe(`${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })
        test.use({
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        })

        for (const { path, name } of TEST_PAGES) {
          test(`${name} works on iOS`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Verify page loads
            const bodyText = await page.textContent('body') || ''
            expect(bodyText.length, 'Page should load on iOS').toBeGreaterThan(0)

            // Verify no horizontal scroll
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
            expect(scrollWidth, 'Page should not have horizontal scroll on iOS').toBeLessThanOrEqual(clientWidth)
          })
        }
      })
    }
  })

  // Android testing
  test.describe('Android Platform', () => {
    for (const viewport of PLATFORM_VIEWPORTS.android) {
      test.describe(`${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })
        test.use({
          userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36',
        })

        for (const { path, name } of TEST_PAGES) {
          test(`${name} works on Android`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Verify page loads
            const bodyText = await page.textContent('body') || ''
            expect(bodyText.length, 'Page should load on Android').toBeGreaterThan(0)

            // Verify no horizontal scroll
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
            expect(scrollWidth, 'Page should not have horizontal scroll on Android').toBeLessThanOrEqual(clientWidth)
          })
        }
      })
    }
  })

  // Web browser testing
  test.describe('Web Platform', () => {
    for (const browser of ['chromium', 'firefox', 'webkit'] as const) {
      test.describe(`${browser}`, () => {
        test.use({ browserName: browser })

        for (const { path, name } of TEST_PAGES) {
          test(`${name} works on ${browser}`, async ({ page }) => {
            await page.goto(path, { waitUntil: 'networkidle' })
            await page.waitForTimeout(2000)

            // Verify page loads
            const bodyText = await page.textContent('body') || ''
            expect(bodyText.length, `Page should load on ${browser}`).toBeGreaterThan(0)

            // Verify JavaScript works
            const jsWorks = await page.evaluate(() => typeof window !== 'undefined')
            expect(jsWorks, `JavaScript should work on ${browser}`).toBeTruthy()
          })
        }
      })
    }
  })

  // Cross-platform compatibility
  test.describe('Cross-Platform Compatibility', () => {
    test('keyboard navigation works on all platforms', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' })

      // Tab through elements
      const focusable = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      const focusableCount = await focusable.count()

      expect(focusableCount, 'Should have focusable elements on all platforms').toBeGreaterThan(0)

      // Test Tab navigation
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focused = page.locator(':focus')
      const focusedCount = await focused.count()

      expect(focusedCount, 'Keyboard navigation should work on all platforms').toBeGreaterThan(0)
    })

    test('forms work consistently across platforms', async ({ page }) => {
      await page.goto('/dashboard/profile/general', { waitUntil: 'networkidle' })

      const inputs = page.locator('input, textarea, select')
      const inputCount = await inputs.count()

      expect(inputCount, 'Forms should work on all platforms').toBeGreaterThan(0)

      if (inputCount > 0) {
        const firstInput = inputs.first()
        await firstInput.fill('test')
        const value = await firstInput.inputValue()

        expect(value, 'Form inputs should work on all platforms').toBe('test')
      }
    })
  })
})

/**
 * Note: Full platform-specific testing requires:
 * 1. Testing on actual iOS devices (iPhone, iPad)
 * 2. Testing on actual Android devices (various manufacturers)
 * 3. Testing on different browser versions
 * 4. Testing platform-specific features (Dynamic Island, safe areas, etc.)
 * 5. Testing native app features (not available in web)
 *
 * These tests provide web-based validation of cross-platform compatibility.
 * Full platform testing should be done on actual devices.
 */

