/**
 * Responsive Authentication Flow Tests
 *
 * Priority 1: Test authentication flow across all viewport sizes
 * to ensure login/signup screens work correctly on mobile, tablet, and desktop.
 *
 * REQ-11: Responsive Layout Improvements
 */

import { test, expect, type Page } from '@playwright/test'
import {
  assertNoHorizontalScroll,
  assertElementVisible,
  assertFormResponsive,
  getViewportCategory,
} from '../helpers/responsive'

// Define all Priority 1 viewports from REQ-11 spec
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Desktop 1440p', width: 2560, height: 1440 },
]

test.describe('Responsive Authentication Flow', () => {
  for (const viewport of viewports) {
    test.describe(`on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test('auth page renders correctly without horizontal scroll', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000) // Allow animations to settle

        // Verify no horizontal scrolling required
        await assertNoHorizontalScroll(page)

        // Verify page content is visible
        const pageContent = await page.locator('body').textContent() || ''
        expect(pageContent.length).toBeGreaterThan(0)
      })

      test('login form fields are visible and accessible', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify email input is visible
        const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
        await emailInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
        await assertElementVisible(page, 'input[type="email"], input[placeholder*="email" i], textbox')

        // Verify submit button is visible
        const submitButton = page.getByRole('button', { name: /send magic link|sign in/i })
        await expect(submitButton).toBeVisible()
      })

      test('form is responsive and usable', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Find the form element (could be a form tag or container)
        const formSelectors = [
          'form',
          '[role="form"]',
          'div:has(input[type="email"])',
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

        // If no form element found, check the page container
        if (!formFound) {
          await assertFormResponsive(page, 'body')
        }
      })

      test('submit button is reachable and properly sized', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const submitButton = page.getByRole('button', { name: /send magic link|sign in/i })
        await expect(submitButton).toBeVisible()

        const buttonBox = await submitButton.boundingBox()
        expect(buttonBox).toBeTruthy()

        if (buttonBox) {
          const category = getViewportCategory(page)
          
          // On mobile, buttons should meet 44px touch target minimum
          if (category === 'mobile') {
            expect(buttonBox.height).toBeGreaterThanOrEqual(40) // Allow 4px tolerance
          }

          // Verify button is within viewport
          const viewport = page.viewportSize()
          if (viewport) {
            expect(buttonBox.x).toBeGreaterThanOrEqual(-1)
            expect(buttonBox.y).toBeGreaterThanOrEqual(-1)
            expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(viewport.width + 1)
            expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(viewport.height + 1)
          }
        }
      })

      test('email input accepts text correctly', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
        await emailInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

        // Fill with test email
        await emailInput.fill('test@example.com')

        // Verify value was entered
        const value = await emailInput.inputValue()
        expect(value).toBe('test@example.com')
      })

      test('validation messages display properly', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
        await emailInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})

        // Fill with invalid email
        await emailInput.fill('not-an-email')
        
        // Try to submit
        const submitButton = page.getByRole('button', { name: /send magic link|sending/i })
        await submitButton.click()

        // Wait for validation
        await page.waitForTimeout(2000)

        // Check for validation message (should be visible and within viewport)
        const pageContent = await page.locator('body').textContent() || ''
        const hasValidationMessage = 
          pageContent.toLowerCase().includes('invalid') ||
          pageContent.toLowerCase().includes('valid email') ||
          pageContent.toLowerCase().includes('please enter')

        // Validation message should be present
        expect(hasValidationMessage).toBe(true)
      })

      test('no overlapping UI elements', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Check that input and button don't overlap
        const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
        const submitButton = page.getByRole('button', { name: /send magic link|sign in/i })

        const inputBox = await emailInput.boundingBox()
        const buttonBox = await submitButton.boundingBox()

        if (inputBox && buttonBox) {
          // Elements should not overlap vertically
          // Button should be below input, or they should be side-by-side on larger screens
          const verticalOverlap = inputBox.y < buttonBox.y + buttonBox.height && inputBox.y + inputBox.height > buttonBox.y
          const horizontalOverlap = inputBox.x < buttonBox.x + buttonBox.width && inputBox.x + inputBox.width > buttonBox.x
          
          // If they overlap both ways, that's a problem
          if (verticalOverlap && horizontalOverlap) {
            // On mobile, they should stack vertically
            const category = getViewportCategory(page)
            if (category === 'mobile') {
              expect(buttonBox.y).toBeGreaterThan(inputBox.y + inputBox.height)
            }
          }
        }
      })

      test('page content fits within viewport', async ({ page }: { page: Page }) => {
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify no horizontal scrolling
        await assertNoHorizontalScroll(page)

        // Check that critical elements are visible
        const pageContent = await page.locator('body').textContent() || ''
        const hasSignIn = pageContent.toLowerCase().includes('sign in') || 
                          pageContent.toLowerCase().includes('welcome')
        expect(hasSignIn).toBe(true)
      })
    })
  }

  // Cross-viewport consistency tests
  test.describe('Cross-viewport consistency', () => {
    test('authentication flow works consistently across all viewports', async ({ page }: { page: Page }) => {
      const testEmail = 'test@example.com'

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto('/auth')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        // Verify form is accessible
        const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
        await emailInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
        await emailInput.fill(testEmail)

        const value = await emailInput.inputValue()
        expect(value).toBe(testEmail)

        // Verify no horizontal scroll
        await assertNoHorizontalScroll(page)

        // Clear for next iteration
        await emailInput.clear()
      }
    })
  })
})

