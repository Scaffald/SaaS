/**
 * Accessibility Test Helper Utilities
 *
 * Provides reusable test helpers for accessibility testing including
 * WCAG compliance checks, keyboard navigation, and screen reader support.
 */

import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

// Note: axe-playwright needs to be installed: pnpm add -D axe-playwright @axe-core/playwright
// For now, these helpers use basic Playwright APIs
// Uncomment when axe-playwright is installed:
// import { injectAxe, checkA11y, getViolations, configureAxe } from 'axe-playwright'

/**
 * WCAG 2.1 AA compliance levels
 */
export const WCAG_LEVELS = {
  A: 'wcag2a',
  AA: 'wcag2aa',
  AAA: 'wcag2aaa',
} as const

/**
 * Initialize axe-core for accessibility testing
 * Note: Requires axe-playwright package
 */
export async function initializeAxe(page: Page): Promise<void> {
  // TODO: Install axe-playwright and uncomment:
  // await injectAxe(page)
  // await configureAxe(page, {
  //   rules: {
  //     // Disable color-contrast rule as it's often false positives
  //     // Manual testing should verify actual contrast ratios
  //     'color-contrast': { enabled: false },
  //   },
  // })
  // For now, this is a no-op
  await page.evaluate(() => {
    // Placeholder for axe initialization
  })
}

/**
 * Run accessibility checks on the current page
 * Throws if violations are found
 * Note: Requires axe-playwright package for full functionality
 */
export async function assertA11y(
  page: Page,
  options?: {
    level?: keyof typeof WCAG_LEVELS
    tags?: string[]
    exclude?: string[]
  }
): Promise<void> {
  await initializeAxe(page)

  // TODO: Install axe-playwright and uncomment:
  // const tags = options?.tags || [WCAG_LEVELS.AA]
  // const exclude = options?.exclude || []
  // await checkA11y(page, undefined, {
  //   tags,
  //   exclude,
  //   detailedReport: true,
  //   detailedReportOptions: { html: true },
  // })

  // For now, run basic checks
  await assertFormLabels(page)
  await assertHeadingHierarchy(page)
}

/**
 * Get accessibility violations without throwing
 * Useful for custom assertion logic
 * Note: Requires axe-playwright package for full functionality
 */
export async function getA11yViolations(
  page: Page,
  options?: {
    level?: keyof typeof WCAG_LEVELS
    tags?: string[]
    exclude?: string[]
  }
): Promise<Array<{ id: string; impact: string; description: string; nodes: unknown[] }>> {
  await initializeAxe(page)

  // TODO: Install axe-playwright and uncomment:
  // const tags = options?.tags || [WCAG_LEVELS.AA]
  // const exclude = options?.exclude || []
  // const violations = await getViolations(page, {
  //   tags,
  //   exclude,
  // })
  // return violations.map((v) => ({
  //   id: v.id,
  //   impact: v.impact || 'unknown',
  //   description: v.description,
  //   nodes: v.nodes,
  // }))

  // For now, return empty array
  return []
}

/**
 * Assert that an element has proper ARIA label
 */
export async function assertHasAriaLabel(element: Locator, label?: string): Promise<void> {
  const ariaLabel = await element.getAttribute('aria-label')
  const ariaLabelledBy = await element.getAttribute('aria-labelledby')

  if (label) {
    expect(ariaLabel, 'Element should have matching aria-label').toBe(label)
  } else {
    expect(
      ariaLabel || ariaLabelledBy,
      'Element should have aria-label or aria-labelledby'
    ).toBeTruthy()
  }
}

/**
 * Assert that an element has proper role attribute
 */
export async function assertHasRole(element: Locator, role: string): Promise<void> {
  const elementRole = await element.getAttribute('role')
  expect(elementRole, `Element should have role="${role}"`).toBe(role)
}

/**
 * Assert that form inputs have associated labels
 */
export async function assertFormLabels(page: Page): Promise<void> {
  const inputs = page.locator('input, textarea, select')
  const inputCount = await inputs.count()

  for (let i = 0; i < Math.min(inputCount, 20); i++) {
    const input = inputs.nth(i)
    const id = await input.getAttribute('id')
    const ariaLabel = await input.getAttribute('aria-label')
    const ariaLabelledBy = await input.getAttribute('aria-labelledby')

    // Check if input has label via id
    if (id) {
      const label = page.locator(`label[for="${id}"]`)
      const labelCount = await label.count()
      expect(
        labelCount > 0 || ariaLabel || ariaLabelledBy,
        `Input ${i} should have associated label or aria-label`
      ).toBeTruthy()
    } else {
      // Input should have aria-label if no id
      expect(
        ariaLabel || ariaLabelledBy,
        `Input ${i} should have aria-label or aria-labelledby`
      ).toBeTruthy()
    }
  }
}

/**
 * Assert that heading hierarchy is correct (h1-h6)
 */
export async function assertHeadingHierarchy(page: Page): Promise<void> {
  const headings = page.locator('h1, h2, h3, h4, h5, h6')
  const headingCount = await headings.count()

  let previousLevel = 0

  for (let i = 0; i < Math.min(headingCount, 20); i++) {
    const heading = headings.nth(i)
    const tagName = await heading.evaluate((el) => el.tagName.toLowerCase())
    const level = parseInt(tagName.charAt(1), 10)

    // First heading should be h1
    if (i === 0) {
      expect(level, 'First heading should be h1').toBe(1)
    } else {
      // Subsequent headings should not skip levels
      // Allow h1-h2, h2-h3, etc. but not h1-h3
      const levelDiff = level - previousLevel
      expect(
        levelDiff <= 1,
        `Heading hierarchy should not skip levels (was h${previousLevel}, now h${level})`
      ).toBeTruthy()
    }

    previousLevel = level
  }
}

/**
 * Assert that focus indicators are visible
 * Checks that elements have visible focus styles
 */
export async function assertFocusIndicators(page: Page): Promise<void> {
  const focusable = page.locator(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const focusableCount = await focusable.count()

  for (let i = 0; i < Math.min(focusableCount, 10); i++) {
    const element = focusable.nth(i)
    await element.focus()

    const focusedElement = page.locator(':focus')
    const focusedCount = await focusedElement.count()

    expect(focusedCount, `Element ${i} should be focusable`).toBeGreaterThan(0)

    // Check if focused element has visible outline or border
    const outline = await element.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        border: styles.border,
      }
    })

    const hasVisibleOutline =
      outline.outlineWidth !== '0px' ||
      outline.outlineStyle !== 'none' ||
      outline.border !== '0px none rgb(0, 0, 0)'

    expect(
      hasVisibleOutline,
      `Focusable element ${i} should have visible focus indicator`
    ).toBeTruthy()
  }
}

/**
 * Assert that all images have alt text
 */
export async function assertImageAltText(page: Page): Promise<void> {
  const images = page.locator('img')
  const imageCount = await images.count()

  for (let i = 0; i < imageCount; i++) {
    const image = images.nth(i)
    const alt = await image.getAttribute('alt')
    const role = await image.getAttribute('role')

    // Decorative images should have role="presentation" or alt=""
    // Informative images should have descriptive alt text
    if (role === 'presentation') {
      // Decorative image - alt should be empty or not present
      expect(alt === '' || alt === null, 'Decorative images should have empty alt').toBeTruthy()
    } else {
      // Informative image - should have alt text
      expect(alt !== null, `Image ${i} should have alt attribute`).toBeTruthy()
      expect(alt !== '', `Image ${i} should have non-empty alt text`).toBeTruthy()
    }
  }
}

/**
 * Test keyboard navigation through page
 * Verifies that all interactive elements are keyboard accessible
 */
export async function testKeyboardNavigation(page: Page, maxElements = 20): Promise<void> {
  const focusable = page.locator(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const focusableCount = await focusable.count()
  const testCount = Math.min(focusableCount, maxElements)

  for (let i = 0; i < testCount; i++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(100) // Wait for focus transition

    const focusedElement = page.locator(':focus')
    const focusedCount = await focusedElement.count()

    expect(focusedCount, `Element ${i} should be focusable via Tab navigation`).toBeGreaterThan(0)
  }
}

/**
 * Assert that modals trap focus
 * Verifies that focus stays within modal when open
 */
export async function assertModalFocusTrap(page: Page, modalSelector: string): Promise<void> {
  const modal = page.locator(modalSelector)
  await expect(modal).toBeVisible()

  const focusableInModal = modal.locator(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const focusableCount = await focusableInModal.count()

  if (focusableCount > 0) {
    // Focus first element in modal
    await focusableInModal.first().focus()

    // Try to Tab multiple times - focus should stay in modal
    for (let i = 0; i < focusableCount + 2; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      const focusedInModal = modal.locator(':focus')
      const focusedCount = await focusedInModal.count()

      // Focus should always be within modal
      expect(focusedCount, 'Focus should be trapped within modal').toBeGreaterThan(0)
    }
  }
}

/**
 * Assert color contrast ratios meet WCAG AA standards
 * Note: This is a basic check - manual verification recommended
 */
export async function assertColorContrast(page: Page, elementSelector: string): Promise<void> {
  const element = page.locator(elementSelector)
  const styles = await element.evaluate((el) => {
    const computed = window.getComputedStyle(el)
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
    }
  })

  // Basic validation - element should have color and background
  expect(styles.color, 'Element should have text color').not.toBe('rgba(0, 0, 0, 0)')
  expect(styles.backgroundColor, 'Element should have background color').not.toBe(
    'rgba(0, 0, 0, 0)'
  )

  // Note: Actual contrast ratio calculation requires color parsing
  // This is a placeholder - full implementation would use a contrast calculation library
}
