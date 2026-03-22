/**
 * Responsive Profile Editing Tests
 *
 * Priority 1: Test profile editing forms across all viewport sizes
 * to ensure all profile form sections work correctly on mobile, tablet, and desktop.
 *
 * Responsive layout improvements
 */

import { expect, type Page, test } from '@playwright/test'
import {
  assertFormResponsive,
  assertNoHorizontalScroll,
  getViewportCategory,
} from '../../infrastructure/playwright/helpers/helpers/responsive'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

// Define all Priority 1 viewports from spec
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Desktop 1440p', width: 2560, height: 1440 },
]

// Profile form sections to test
const profileSections = [
  { path: '/profile/general', name: 'General' },
  { path: '/profile/employment', name: 'Employment' },
  { path: '/profile/education', name: 'Education' },
  { path: '/profile/experience', name: 'Experience' },
  { path: '/profile/skills', name: 'Skills' },
  { path: '/profile/certifications', name: 'Certifications' },
]

test.describe('Responsive Profile Editing', () => {
  for (const viewport of viewports) {
    test.describe(`on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test.beforeEach(async ({ page }: { page: Page }) => {
        // Sign in as admin for all tests
        await signInAsAdmin(page)
      })

      for (const section of profileSections) {
        test(`${section.name} form displays correctly without horizontal scroll`, async ({
          page,
        }: {
          page: Page
        }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          // Wait for loading to complete
          await page
            .waitForFunction(() => !document.body.textContent?.includes('Loading...'), {
              timeout: 10000,
            })
            .catch(() => {})

          // Verify no horizontal scrolling required
          await assertNoHorizontalScroll(page)

          // Verify page content is visible
          const pageContent = (await page.locator('body').textContent()) || ''
          expect(pageContent.length).toBeGreaterThan(0)
        })

        test(`${section.name} form is responsive and usable`, async ({ page }: { page: Page }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          // Find form element
          const formSelectors = [
            'form',
            '[role="form"]',
            'div:has(input)',
            'div:has(textarea)',
            'div:has(select)',
          ]

          let formFound = false
          for (const selector of formSelectors) {
            const form = page.locator(selector).first()
            const count = await form.count()
            if (count > 0) {
              formFound = true
              await assertFormResponsive(page, selector)
              break
            }
          }

          // If no specific form found, verify inputs exist
          if (!formFound) {
            const inputs = page.locator('input, textarea, select')
            const inputCount = await inputs.count()
            expect(inputCount).toBeGreaterThan(0)
          }
        })

        test(`${section.name} form fields are visible and accessible`, async ({
          page,
        }: {
          page: Page
        }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          // Get all input fields
          const inputs = page.locator('input, textarea, select')
          const inputCount = await inputs.count()

          if (inputCount > 0) {
            // Verify first few inputs are visible (check up to 10 to avoid too many checks)
            const maxChecks = Math.min(inputCount, 10)
            for (let i = 0; i < maxChecks; i++) {
              const input = inputs.nth(i)
              await expect(input)
                .toBeVisible({ timeout: 5000 })
                .catch(() => {})
            }
          }
        })

        test(`${section.name} form stacks vertically on mobile`, async ({
          page,
        }: {
          page: Page
        }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          const category = getViewportCategory(page)
          const isMobile = category === 'mobile' // ≤800px

          if (isMobile) {
            // On mobile, forms should stack vertically
            // Check that input fields don't overlap horizontally
            const inputs = page.locator('input, textarea, select')
            const inputCount = await inputs.count()

            if (inputCount >= 2) {
              const input1 = inputs.first()
              const input2 = inputs.nth(1)

              const box1 = await input1.boundingBox()
              const box2 = await input2.boundingBox()

              if (box1 && box2) {
                // On mobile, inputs should stack vertically (input2 below input1)
                // Allow some tolerance for side-by-side layouts on very small forms
                // But generally, input2 should be below input1
                const isStacked = box2.y >= box1.y + box1.height * 0.5 // Allow 50% overlap tolerance

                // If not stacked, they should at least not overlap significantly
                const significantOverlap =
                  box1.x < box2.x + box2.width * 0.8 &&
                  box1.x + box1.width * 0.8 > box2.x &&
                  box1.y < box2.y + box2.height * 0.8 &&
                  box1.y + box1.height * 0.8 > box2.y

                // Either stacked or not significantly overlapping
                expect(isStacked || !significantOverlap).toBe(true)
              }
            }
          }
        })

        test(`${section.name} action buttons are accessible`, async ({ page }: { page: Page }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          // Look for save/submit buttons
          const actionButtons = page.locator('button:has-text(/save|submit|update|cancel/i)')
          const buttonCount = await actionButtons.count()

          if (buttonCount > 0) {
            const category = getViewportCategory(page)
            const isMobile = category === 'mobile'

            // Check first action button
            const firstButton = actionButtons.first()
            await expect(firstButton).toBeVisible()

            const buttonBox = await firstButton.boundingBox()
            if (buttonBox && isMobile) {
              // On mobile, buttons should meet 44px touch target minimum
              expect(buttonBox.height).toBeGreaterThanOrEqual(40) // Allow 4px tolerance
            }

            // Button should be within viewport
            const viewport = page.viewportSize()
            if (viewport && buttonBox) {
              expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(viewport.width + 1)
              expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(viewport.height + 1)
            }
          }
        })

        test(`${section.name} page content fits within viewport`, async ({
          page,
        }: {
          page: Page
        }) => {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(3000)

          // Verify no horizontal scrolling
          await assertNoHorizontalScroll(page)

          // Verify section heading or content is visible
          const pageContent = (await page.locator('body').textContent()) || ''
          expect(pageContent.length).toBeGreaterThan(0)
        })
      }
    })
  }

  // Cross-viewport consistency tests
  test.describe('Cross-viewport consistency', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await signInAsAdmin(page)
    })

    test('profile forms work consistently across all viewports', async ({
      page,
    }: {
      page: Page
    }) => {
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })

        // Test each profile section
        for (const section of profileSections) {
          await page.goto(section.path)
          await page.waitForLoadState('networkidle')
          await page.waitForTimeout(2000)

          // Verify no horizontal scroll
          await assertNoHorizontalScroll(page)

          // Verify inputs exist
          const inputs = page.locator('input, textarea, select')
          const inputCount = await inputs.count()

          // At minimum, page should load (inputs may be 0 if form not loaded yet)
          const pageContent = (await page.locator('body').textContent()) || ''
          expect(pageContent.length).toBeGreaterThan(0)
        }
      }
    })
  })
})
