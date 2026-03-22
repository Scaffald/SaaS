/**
 * Screen Reader Testing
 *
 * Tests for screen reader compatibility validation.
 * Validates that pages are accessible via screen readers (NVDA, JAWS, VoiceOver).
 *
 * Task 20: Execute Manual Screen Reader and Keyboard Testing
 *
 * Note: Full screen reader testing requires manual testing with actual screen readers.
 * These tests validate ARIA attributes and semantic HTML that screen readers rely on.
 */

import { expect, test } from '@playwright/test'
import {
  assertFormLabels,
  assertHasAriaLabel,
  assertHasRole,
  assertHeadingHierarchy,
} from '../infrastructure/playwright/helpers/accessibility'

/**
 * Key pages to test for screen reader compatibility
 */
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/profile/general', name: 'Profile General' },
  { path: '/dashboard/discover/workers', name: 'Discover Workers' },
]

test.describe('Screen Reader Testing', () => {
  for (const { path, name } of TEST_PAGES) {
    test.describe(name, () => {
      test('semantic HTML structure for screen readers', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check for semantic HTML elements
        const semanticElements = await page.evaluate(() => {
          return {
            main: document.querySelector('main') !== null,
            nav: document.querySelector('nav') !== null,
            header: document.querySelector('header') !== null,
            footer: document.querySelector('footer') !== null,
            article: document.querySelector('article') !== null,
            section: document.querySelector('section') !== null,
          }
        })

        // Page should have semantic structure
        expect(
          semanticElements.main || semanticElements.article,
          'Page should have main or article element'
        ).toBeTruthy()
      })

      test('ARIA landmarks are present', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check for ARIA landmarks
        const landmarks = await page
          .locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]')
          .count()

        // Page should have at least main landmark
        expect(landmarks, 'Page should have ARIA landmarks').toBeGreaterThan(0)
      })

      test('heading structure is screen reader friendly', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertHeadingHierarchy(page)
      })

      test('form labels are screen reader accessible', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await assertFormLabels(page)
      })

      test('interactive elements have accessible names', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check buttons
        const buttons = page.locator('button')
        const buttonCount = await buttons.count()

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = buttons.nth(i)
          const text = await button.textContent()
          const ariaLabel = await button.getAttribute('aria-label')
          const ariaLabelledBy = await button.getAttribute('aria-labelledby')

          // Button should have accessible name
          expect(
            (text && text.trim().length > 0) || ariaLabel || ariaLabelledBy,
            `Button ${i} should have accessible name for screen readers`
          ).toBeTruthy()
        }
      })

      test('live regions for dynamic content', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        // Check for live regions (aria-live)
        const liveRegions = await page.locator('[aria-live]').count()

        // Live regions should be present for dynamic content updates
        // Note: Not all pages need live regions, so this is informational
        if (liveRegions > 0) {
          const liveRegion = page.locator('[aria-live]').first()
          const ariaLive = await liveRegion.getAttribute('aria-live')

          // Live region should have valid value
          expect(
            ariaLive === 'polite' || ariaLive === 'assertive',
            'Live regions should have aria-live="polite" or aria-live="assertive"'
          ).toBeTruthy()
        }
      })

      test('alt text for images is descriptive', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })

        const images = page.locator('img')
        const imageCount = await images.count()

        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const image = images.nth(i)
          const alt = await image.getAttribute('alt')
          const role = await image.getAttribute('role')

          // Decorative images should have role="presentation" or alt=""
          if (role === 'presentation' || alt === '') {
            continue // Decorative image - okay
          }

          // Informative images should have descriptive alt text
          expect(
            alt !== null && alt.length > 0,
            `Image ${i} should have descriptive alt text for screen readers`
          ).toBeTruthy()
        }
      })
    })
  }
})

/**
 * Manual Screen Reader Testing Checklist
 *
 * These tests validate technical prerequisites for screen reader compatibility.
 * Full screen reader testing requires manual testing with:
 *
 * 1. NVDA (Windows)
 *    - Free, open-source screen reader
 *    - Download from: https://www.nvaccess.org/
 *    - Test keyboard navigation, announcements, landmarks
 *
 * 2. JAWS (Windows)
 *    - Commercial screen reader
 *    - Test with 40-minute demo mode
 *    - Validate complex interactions
 *
 * 3. VoiceOver (macOS/iOS)
 *    - Built-in screen reader
 *    - Enable with Cmd+F5
 *    - Test gesture navigation, rotor
 *
 * 4. TalkBack (Android)
 *    - Built-in screen reader
 *    - Enable in Accessibility settings
 *    - Test touch navigation, gestures
 *
 * Manual Testing Steps:
 * 1. Navigate page using screen reader commands
 * 2. Verify all content is announced
 * 3. Verify navigation is logical
 * 4. Verify forms are accessible
 * 5. Verify error messages are announced
 * 6. Verify dynamic content updates are announced
 */
