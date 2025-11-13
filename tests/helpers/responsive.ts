/**
 * Responsive Test Helper Utilities
 *
 * Provides reusable test helpers for validating responsive layout behavior
 * across multiple viewport sizes.
 */

import type { Page, Locator } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Assert that no horizontal scrolling is required
 * Verifies that the page content fits within the viewport width
 */
export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

/**
 * Assert that an element is fully visible within the viewport
 * Checks that element exists, is visible, and is within viewport bounds
 */
export async function assertElementVisible(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector)
  await expect(element).toBeVisible()
  
  const box = await element.boundingBox()
  expect(box).toBeTruthy()
  
  if (box) {
    // Element should be within viewport bounds
    const viewport = page.viewportSize()
    if (viewport) {
      expect(box.x).toBeGreaterThanOrEqual(-1) // Allow 1px tolerance for borders
      expect(box.y).toBeGreaterThanOrEqual(-1)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
    }
  }
}

/**
 * Assert that two elements do not overlap
 * Checks that the bounding boxes of two elements don't intersect
 */
export async function assertNoOverlap(
  page: Page,
  selector1: string,
  selector2: string
): Promise<void> {
  const box1 = await page.locator(selector1).boundingBox()
  const box2 = await page.locator(selector2).boundingBox()
  
  expect(box1).toBeTruthy()
  expect(box2).toBeTruthy()
  
  if (box1 && box2) {
    // Check if boxes don't overlap
    // Boxes overlap if:
    // - box1.x < box2.x + box2.width AND box1.x + box1.width > box2.x
    // - AND box1.y < box2.y + box2.height AND box1.y + box1.height > box2.y
    const horizontalOverlap =
      box1.x < box2.x + box2.width && box1.x + box1.width > box2.x
    const verticalOverlap =
      box1.y < box2.y + box2.height && box1.y + box1.height > box2.y
    
    const noOverlap = !(horizontalOverlap && verticalOverlap)
    expect(noOverlap).toBeTruthy()
  }
}

/**
 * Assert that a modal displays correctly for the current viewport size
 * - On mobile (≤800px): Should be full-screen Sheet
 * - On desktop (>800px): Should be centered Dialog
 * - Content should be accessible via scrolling
 * - No horizontal overflow
 */
export async function assertModalResponsive(
  page: Page,
  modalSelector: string
): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('Viewport size not available')
  }
  
  const isMobile = viewport.width <= 800
  
  // Modal should be visible
  const modal = page.locator(modalSelector)
  await expect(modal).toBeVisible()
  
  // Modal should be fully within viewport
  const modalBox = await modal.boundingBox()
  expect(modalBox).toBeTruthy()
  
  if (modalBox) {
    // On mobile: Modal should be full-screen (within small margin)
    // On desktop: Modal should be centered with reasonable margins
    if (isMobile) {
      // Allow small margin for safe areas
      expect(modalBox.x).toBeLessThanOrEqual(10)
      expect(modalBox.y).toBeLessThanOrEqual(10)
      expect(modalBox.width).toBeGreaterThanOrEqual(viewport.width - 20)
      expect(modalBox.height).toBeGreaterThanOrEqual(viewport.height - 20)
    } else {
      // Desktop: Modal should not be full-width (centered dialog)
      expect(modalBox.width).toBeLessThan(viewport.width - 100) // At least 50px margin on each side
      expect(modalBox.x).toBeGreaterThan(0) // Centered, not at edge
      expect(modalBox.x + modalBox.width).toBeLessThan(viewport.width) // Not extending beyond
    }
  }
  
  // Check for horizontal overflow within modal
  const modalScrollWidth = await modal.evaluate((el) => el.scrollWidth)
  const modalClientWidth = await modal.evaluate((el) => el.clientWidth)
  expect(modalScrollWidth).toBeLessThanOrEqual(modalClientWidth + 1) // Allow 1px tolerance
}

/**
 * Assert that a form is responsive and usable
 * - Form fields should be visible and accessible
 * - Forms should stack vertically on mobile (≤800px)
 * - Multi-column layouts allowed on desktop (>800px)
 * - Action buttons should meet 44px touch target minimum on mobile
 * - No horizontal scrolling required
 */
export async function assertFormResponsive(
  page: Page,
  formSelector: string
): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('Viewport size not available')
  }
  
  const isMobile = viewport.width <= 800
  
  const form = page.locator(formSelector)
  await expect(form).toBeVisible()
  
  // Form should not require horizontal scrolling
  const formScrollWidth = await form.evaluate((el) => el.scrollWidth)
  const formClientWidth = await form.evaluate((el) => el.clientWidth)
  expect(formScrollWidth).toBeLessThanOrEqual(formClientWidth + 1) // Allow 1px tolerance
  
  // Get all input fields in the form
  const inputs = form.locator('input, textarea, select')
  const inputCount = await inputs.count()
  
  // Verify all inputs are visible and accessible
  for (let i = 0; i < Math.min(inputCount, 10); i++) {
    // Check first 10 inputs to avoid too many checks
    const input = inputs.nth(i)
    await expect(input).toBeVisible()
    
    const inputBox = await input.boundingBox()
    if (inputBox && isMobile) {
      // On mobile, inputs should meet minimum touch target (44px)
      expect(inputBox.height).toBeGreaterThanOrEqual(40) // Allow 4px tolerance
    }
  }
  
  // Check action buttons (submit, cancel, etc.)
  const buttons = form.locator('button[type="submit"], button:has-text("Save"), button:has-text("Cancel"), button:has-text("Submit")')
  const buttonCount = await buttons.count()
  
  for (let i = 0; i < Math.min(buttonCount, 5); i++) {
    // Check first 5 buttons
    const button = buttons.nth(i)
    await expect(button).toBeVisible()
    
    if (isMobile) {
      const buttonBox = await button.boundingBox()
      if (buttonBox) {
        // Touch target should be at least 44px
        expect(buttonBox.height).toBeGreaterThanOrEqual(40) // Allow 4px tolerance
        expect(buttonBox.width).toBeGreaterThanOrEqual(40) // Allow 4px tolerance
      }
    }
  }
}

/**
 * Assert that text content is readable and properly wrapped
 * Checks that text doesn't extend beyond viewport width
 */
export async function assertTextResponsive(
  page: Page,
  textSelector: string
): Promise<void> {
  const element = page.locator(textSelector)
  await expect(element).toBeVisible()
  
  const elementBox = await element.boundingBox()
  if (elementBox) {
    const viewport = page.viewportSize()
    if (viewport) {
      // Text element should fit within viewport (with small margin)
      expect(elementBox.x + elementBox.width).toBeLessThanOrEqual(viewport.width + 1)
    }
  }
}

/**
 * Assert that an element respects the safe area on mobile devices
 * Useful for checking that modals/drawers respect notches and safe areas
 */
export async function assertSafeArea(
  page: Page,
  elementSelector: string
): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport || viewport.width > 800) {
    // Only check on mobile devices
    return
  }
  
  const element = page.locator(elementSelector)
  const box = await element.boundingBox()
  
  if (box) {
    // Safe area insets are typically 20-50px on mobile devices
    // We check that element doesn't extend to absolute edges
    const safeAreaInset = 20 // Conservative safe area inset
    expect(box.x).toBeGreaterThanOrEqual(safeAreaInset - 5) // Allow 5px tolerance
    expect(box.y).toBeGreaterThanOrEqual(safeAreaInset - 5)
  }
}

/**
 * Get viewport size category for conditional testing
 * Returns 'mobile', 'tablet', or 'desktop' based on viewport width
 */
export function getViewportCategory(page: Page): 'mobile' | 'tablet' | 'desktop' {
  const viewport = page.viewportSize()
  if (!viewport) {
    return 'desktop' // Default fallback
  }
  
  if (viewport.width <= 800) {
    return 'mobile'
  } else if (viewport.width <= 1024) {
    return 'tablet'
  }
  return 'desktop'
}

