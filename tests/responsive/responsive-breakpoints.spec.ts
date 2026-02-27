/**
 * Responsive Layout Testing
 *
 * Tests for responsive layouts across all breakpoints.
 * Validates that layouts work correctly on mobile, tablet, and desktop.
 *
 * Task 9: Validate Responsive Layouts Across All Breakpoints
 */

import { expect, test } from '@playwright/test'
import {
  assertFormResponsive,
  assertNoHorizontalScroll,
  getViewportCategory,
} from '../infrastructure/playwright/helpers/helpers/responsive'

/**
 * Viewports to test (responsive layout)
 */
const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Desktop 1440p', width: 2560, height: 1440 },
]

/**
 * Key pages to test
 */
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/profile/general', name: 'Profile General' },
  { path: '/dashboard/profile/employment', name: 'Profile Employment' },
  { path: '/dashboard/profile/education', name: 'Profile Education' },
  { path: '/dashboard/discover/workers', name: 'Discover Workers' },
  { path: '/dashboard/discover/jobs', name: 'Discover Jobs' },
  { path: '/dashboard/discover/employers', name: 'Discover Employers' },
  { path: '/dashboard/discover/map', name: 'Discover Map' },
]

test.describe('Responsive Layout Testing', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      for (const { path, name } of TEST_PAGES) {
        test(`${name} - no horizontal scroll`, async ({ page }) => {
          await page.goto(path, { waitUntil: 'networkidle' })
          await page.waitForTimeout(2000) // Allow time for layout to settle

          await assertNoHorizontalScroll(page)
        })

        test(`${name} - responsive layout`, async ({ page }) => {
          await page.goto(path, { waitUntil: 'networkidle' })
          await page.waitForTimeout(2000)

          // Check that page content fits within viewport
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

          expect(scrollWidth, 'Page should fit within viewport width').toBeLessThanOrEqual(
            clientWidth
          )
        })

        test(`${name} - forms are responsive`, async ({ page }) => {
          await page.goto(path, { waitUntil: 'networkidle' })
          await page.waitForTimeout(2000)

          // Look for forms
          const form = page.locator('form').first()
          const formCount = await form.count()

          if (formCount > 0) {
            await assertFormResponsive(page, 'form')
          }
        })

        test(`${name} - breakpoint category`, async ({ page }) => {
          await page.goto(path, { waitUntil: 'networkidle' })

          const category = getViewportCategory(page)
          const expectedCategory =
            viewport.width <= 800 ? 'mobile' : viewport.width <= 1024 ? 'tablet' : 'desktop'

          expect(category, `Viewport category should match expected: ${expectedCategory}`).toBe(
            expectedCategory
          )
        })
      }
    })
  }

  test.describe('Breakpoint transitions', () => {
    test('layout adapts to viewport size changes', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' })

      // Test mobile layout
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)
      await assertNoHorizontalScroll(page)

      // Test tablet layout
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(500)
      await assertNoHorizontalScroll(page)

      // Test desktop layout
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(500)
      await assertNoHorizontalScroll(page)
    })

    test('forms stack vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // Mobile
      await page.goto('/dashboard/profile/general', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)

      const inputs = page.locator('input, textarea, select')
      const inputCount = await inputs.count()

      if (inputCount >= 2) {
        const input1 = inputs.first()
        const input2 = inputs.nth(1)

        const box1 = await input1.boundingBox()
        const box2 = await input2.boundingBox()

        if (box1 && box2) {
          // On mobile, inputs should stack vertically
          const isStacked = box2.y >= box1.y + box1.height * 0.5
          expect(isStacked, 'Inputs should stack vertically on mobile').toBeTruthy()
        }
      }
    })

    test('modals are responsive', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' })

      // Test mobile modal (Sheet)
      await page.setViewportSize({ width: 375, height: 667 })
      // Trigger modal if available
      const modalTrigger = page
        .locator('button[aria-label*="open" i], button[aria-label*="menu" i]')
        .first()
      if ((await modalTrigger.count()) > 0) {
        await modalTrigger.click()
        await page.waitForTimeout(500)

        const modal = page.locator('[role="dialog"], [data-modal]').first()
        if ((await modal.count()) > 0) {
          const modalBox = await modal.boundingBox()
          const viewportSize = page.viewportSize()
          if (modalBox && viewportSize) {
            // On mobile, modal should be full-screen
            expect(modalBox.width, 'Mobile modal should be full-width').toBeGreaterThan(
              viewportSize.width - 20
            )
          }
        }
      }

      // Test desktop modal (Dialog)
      await page.setViewportSize({ width: 1920, height: 1080 })
      if ((await modalTrigger.count()) > 0) {
        await modalTrigger.click()
        await page.waitForTimeout(500)

        const modal = page.locator('[role="dialog"], [data-modal]').first()
        if ((await modal.count()) > 0) {
          const modalBox = await modal.boundingBox()
          const viewportSize = page.viewportSize()
          if (modalBox && viewportSize) {
            // On desktop, modal should be centered
            expect(modalBox.width, 'Desktop modal should not be full-width').toBeLessThan(
              viewportSize.width - 100
            )
          }
        }
      }
    })
  })
})
