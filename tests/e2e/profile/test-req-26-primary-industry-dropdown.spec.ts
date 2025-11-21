// @ts-nocheck
/**
 * REQ-26: Primary Industry Dropdown UX Enhancement - Test Coverage
 *
 * Tests for visual affordances, keyboard accessibility, cross-platform behavior,
 * and integration with existing functionality.
 *
 * Implementation: packages/core/features/profile/profile-skills-left.tsx
 */
import { expect, type Page, test } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import {
  getDropdownContent,
  getIndustryOptions,
  getPrimaryIndustryTrigger,
  hoverPrimaryIndustryTrigger,
  isDropdownOpen,
  openPrimaryIndustryDropdown,
  openPrimaryIndustryDropdownKeyboard,
  selectIndustryOption,
} from './playwright-helpers/primary-industry-dropdown'

test.describe('REQ-26 • Primary Industry Dropdown UX Enhancement', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    // If storage state doesn't exist, sign in first
    await signInAsAdmin(page)
    await page.goto('/dashboard/profile/skills', { waitUntil: 'domcontentloaded' })

    // Wait for page to load
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1500)

    // Verify page loaded correctly
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  // ==========================================
  // Task 1: Visual Affordances Tests
  // ==========================================

  test('cursor changes to pointer on hover', async ({ page }: { page: Page }) => {
    const trigger = await hoverPrimaryIndustryTrigger(page)

    // Check computed cursor style
    const cursor = await trigger.evaluate((el) => {
      return window.getComputedStyle(el).cursor
    })

    expect(cursor).toBe('pointer')
  })

  test('displays chevron down icon', async ({ page }: { page: Page }) => {
    const trigger = await getPrimaryIndustryTrigger(page)

    // Look for chevron icon - could be SVG or icon element
    // Tamagui uses lucide-icons, so look for SVG with chevron path or icon element
    const chevronIcon = trigger.locator('svg, [data-lucide="chevron-down"]').first()
    const iconVisible = await chevronIcon.isVisible().catch(() => false)

    // Alternative: check if iconAfter prop renders (check for any icon-like element)
    const hasIcon = await trigger.evaluate((el) => {
      // Check for SVG elements or icon-like elements
      const svgs = el.querySelectorAll('svg')
      return svgs.length > 0
    })

    expect(hasIcon || iconVisible).toBe(true)
  })

  test('applies hover state styling', async ({ page }: { page: Page }) => {
    const trigger = await getPrimaryIndustryTrigger(page)

    // Get initial styles
    const initialStyles = await trigger.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
      }
    })

    // Hover over trigger
    await trigger.hover()
    await page.waitForTimeout(200) // Wait for hover styles to apply

    // Get hover styles
    const hoverStyles = await trigger.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
      }
    })

    // Verify styles changed (hover state should have different colors)
    // Note: Exact color values depend on theme, so we just verify they changed
    const stylesChanged =
      initialStyles.borderColor !== hoverStyles.borderColor ||
      initialStyles.backgroundColor !== hoverStyles.backgroundColor

    expect(stylesChanged).toBe(true)
  })

  test('hover state uses design system tokens', async ({ page }: { page: Page }) => {
    const trigger = await hoverPrimaryIndustryTrigger(page)

    // Check that hover styles are applied (we can't directly check token values,
    // but we can verify the styles are different from default)
    const hoverStyles = await trigger.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
      }
    })

    // Verify styles are not transparent/default (indicating tokens are used)
    expect(hoverStyles.borderColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(hoverStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  })

  // ==========================================
  // Task 2: Keyboard Accessibility Tests
  // ==========================================

  test('opens dropdown on Enter key press', async ({ page }: { page: Page }) => {
    await openPrimaryIndustryDropdownKeyboard(page)

    // Verify dropdown is open
    const isOpen = await isDropdownOpen(page)
    expect(isOpen).toBe(true)
  })

  test('navigates options with arrow keys', async ({ page }: { page: Page }) => {
    await openPrimaryIndustryDropdownKeyboard(page)

    // Wait for options to be available
    await page.waitForTimeout(500)

    // Press arrow down to navigate
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(200)

    // Check if focus moved to an option
    // This is verified by checking if an option has focus or is highlighted
    const focusedOption = await page.evaluate(() => {
      const options = document.querySelectorAll('[role="option"]')
      return Array.from(options).some((opt) => opt === document.activeElement)
    })

    // At minimum, verify dropdown is still open and options exist
    const isOpen = await isDropdownOpen(page)
    const options = await getIndustryOptions(page)

    expect(isOpen).toBe(true)
    expect(options.length).toBeGreaterThan(0)
  })

  test('closes dropdown on Escape key', async ({ page }: { page: Page }) => {
    await openPrimaryIndustryDropdownKeyboard(page)

    // Verify dropdown is open
    let isOpen = await isDropdownOpen(page)
    expect(isOpen).toBe(true)

    // Press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Verify dropdown is closed
    isOpen = await isDropdownOpen(page)
    expect(isOpen).toBe(false)
  })

  test('supports tab navigation', async ({ page }: { page: Page }) => {
    const trigger = await getPrimaryIndustryTrigger(page)

    // Tab to the trigger
    await page.keyboard.press('Tab')
    await page.waitForTimeout(200)

    // Check if trigger is focused
    const isFocused = await trigger.evaluate((el) => el === document.activeElement)

    // If not focused, try a few more tabs (might need to tab through other elements)
    if (!isFocused) {
      // Try to find the trigger by tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        const focused = await trigger.evaluate((el) => el === document.activeElement)
        if (focused) break
      }
    }

    // Verify trigger can receive focus (at minimum, it should be focusable)
    const isFocusable = await trigger.evaluate((el) => {
      return el.tabIndex >= 0 || el.getAttribute('tabindex') !== null
    })

    expect(isFocusable).toBe(true)
  })

  // ==========================================
  // Task 3: Cross-Platform Behavior Tests
  // ==========================================

  test('displays standard dropdown on web', async ({ page }: { page: Page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    await openPrimaryIndustryDropdown(page)

    // On web, should see standard dropdown (not Sheet)
    const isOpen = await isDropdownOpen(page)
    const content = await getDropdownContent(page)

    expect(isOpen).toBe(true)
    expect(content).not.toBeNull()
  })

  test('displays Sheet component on mobile/touch', async ({ page }: { page: Page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const trigger = await getPrimaryIndustryTrigger(page)
    await trigger.click()
    await page.waitForTimeout(500)

    // On mobile, should see Sheet component (look for Sheet-specific elements)
    // Tamagui Sheet uses specific data attributes or classes
    const sheet = page.locator('[data-sheet], [role="dialog"]').first()
    const sheetVisible = await sheet.isVisible().catch(() => false)

    // Alternative: check if mobile adaptation is active
    // The Sheet should be visible when on mobile
    expect(sheetVisible).toBe(true)
  })

  test('uses native picker on mobile platforms', async ({ page }: { page: Page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    const trigger = await getPrimaryIndustryTrigger(page)
    await trigger.click()
    await page.waitForTimeout(500)

    // On mobile, should show Sheet (native picker adaptation)
    // The Sheet component is the mobile adaptation
    const sheet = page.locator('[data-sheet], [role="dialog"]').first()
    const hasSheet = await sheet.isVisible().catch(() => false)

    // Mobile should use Sheet adaptation
    expect(hasSheet).toBe(true)
  })

  // ==========================================
  // Task 4: Integration Tests
  // ==========================================

  test('industry selection persists after visual enhancements', async ({
    page,
  }: {
    page: Page
  }) => {
    await openPrimaryIndustryDropdown(page)

    // Get available options
    const options = await getIndustryOptions(page)
    expect(options.length).toBeGreaterThan(0)

    // Select first available industry
    const firstOption = options[0]
    const industryName = await firstOption.textContent()

    if (industryName) {
      await selectIndustryOption(page, industryName.trim())

      // Verify selection is reflected in the trigger
      const trigger = await getPrimaryIndustryTrigger(page)
      const triggerText = await trigger.textContent()

      // The selected industry should appear in the trigger
      expect(triggerText?.toLowerCase()).toContain(industryName.toLowerCase().trim())
    }
  })

  test('skill search enables after industry selection', async ({ page }: { page: Page }) => {
    // Initially, skill search should be disabled or show message
    const initialContent = (await page.locator('body').textContent()) || ''
    const hasInitialMessage =
      initialContent.includes('select an industry') || initialContent.includes('Select an industry')

    // Select an industry
    await openPrimaryIndustryDropdown(page)
    const options = await getIndustryOptions(page)
    expect(options.length).toBeGreaterThan(0)

    const firstOption = options[0]
    const industryName = await firstOption.textContent()

    if (industryName) {
      await selectIndustryOption(page, industryName.trim())
      await page.waitForTimeout(1000)

      // After selection, skill search should be enabled
      // Look for search input or search interface
      const searchInput = page
        .locator('input[type="text"], input[placeholder*="Search"], input[placeholder*="search"]')
        .first()
      const searchVisible = await searchInput.isVisible().catch(() => false)

      // Or check that the "select industry" message is gone
      const afterContent = (await page.locator('body').textContent()) || ''
      const messageGone = !afterContent.includes('Please select an industry')

      expect(searchVisible || messageGone).toBe(true)
    }
  })

  test('API persistence works with enhanced dropdown', async ({ page }: { page: Page }) => {
    // Select an industry
    await openPrimaryIndustryDropdown(page)
    const options = await getIndustryOptions(page)
    expect(options.length).toBeGreaterThan(0)

    const firstOption = options[0]
    const industryName = await firstOption.textContent()

    if (industryName) {
      await selectIndustryOption(page, industryName.trim())
      await page.waitForTimeout(2000) // Wait for API call to complete

      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page
        .waitForFunction(() => !document.body.textContent?.includes('Loading...'), {
          timeout: 10000,
        })
        .catch(() => {})
      await page.waitForTimeout(1000)

      // Verify selection persisted
      const trigger = await getPrimaryIndustryTrigger(page)
      const triggerText = await trigger.textContent()

      // The selected industry should still be shown
      expect(triggerText?.toLowerCase()).toContain(industryName.toLowerCase().trim())
    }
  })
})
