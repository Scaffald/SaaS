/**
 * WCAG 2.1 AA Compliance Testing
 *
 * Tests for WCAG 2.1 AA accessibility compliance validation.
 * Validates that all pages meet WCAG 2.1 AA standards.
 *
 * Task 19: Implement WCAG 2.1 AA Accessibility Compliance
 */

import { test, expect } from '@playwright/test'
import {
  assertFormLabels,
  assertHeadingHierarchy,
  assertFocusIndicators,
  assertImageAltText,
  assertHasAriaLabel,
  assertHasRole,
} from '../infrastructure/playwright/helpers/accessibility'

/**
 * Key pages to test for WCAG compliance
 */
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/profile/general', name: 'Profile General' },
  { path: '/dashboard/discover/workers', name: 'Discover Workers' },
  { path: '/dashboard/discover/jobs', name: 'Discover Jobs' },
  { path: '/dashboard/discover/employers', name: 'Discover Employers' },
  { path: '/dashboard/discover/map', name: 'Discover Map' },
]

test.describe('WCAG 2.1 AA Compliance Testing', () => {
  for (const { path, name } of TEST_PAGES) {
    test.describe(name, () => {
      test('form labels are associated with inputs', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertFormLabels(page)
      })

      test('heading hierarchy is correct', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertHeadingHierarchy(page)
      })

      test('focus indicators are visible', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertFocusIndicators(page)
      })

      test('images have alt text', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertImageAltText(page)
      })

      test('interactive elements have ARIA labels', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check buttons have labels
        const buttons = page.locator('button')
        const buttonCount = await buttons.count()

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = buttons.nth(i)
          const text = await button.textContent()
          const ariaLabel = await button.getAttribute('aria-label')
          const ariaLabelledBy = await button.getAttribute('aria-labelledby')

          // Button should have text or ARIA label
          expect(
            (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy,
            `Button ${i} should have accessible label`
          ).toBeTruthy()
        }

        // Check links have labels
        const links = page.locator('a')
        const linkCount = await links.count()

        for (let i = 0; i < Math.min(linkCount, 10); i++) {
          const link = links.nth(i)
          const text = await link.textContent()
          const ariaLabel = await link.getAttribute('aria-label')
          const ariaLabelledBy = await link.getAttribute('aria-labelledby')

          // Link should have text or ARIA label
          expect(
            (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy,
            `Link ${i} should have accessible label`
          ).toBeTruthy()
        }
      })

      test('error messages are accessible', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check for error messages with ARIA attributes
        const errors = page.locator('[role="alert"], [aria-live], [aria-atomic]')
        const errorCount = await errors.count()

        // If errors exist, they should have proper ARIA attributes
        if (errorCount > 0) {
          for (let i = 0; i < Math.min(errorCount, 5); i++) {
            const error = errors.nth(i)
            const role = await error.getAttribute('role')
            const ariaLive = await error.getAttribute('aria-live')
            const ariaAtomic = await error.getAttribute('aria-atomic')

            // Error should have role="alert" or aria-live
            expect(
              role === 'alert' || ariaLive,
              `Error ${i} should have role="alert" or aria-live`
            ).toBeTruthy()
          }
        }
      })
    })
  }
})

