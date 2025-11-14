// @ts-nocheck
import type { Page, Locator } from '@playwright/test'

/**
 * Get the Primary Industry dropdown trigger element
 */
export async function getPrimaryIndustryTrigger(page: Page): Promise<Locator> {
  // Wait for the page to load and the trigger to be available
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Loading...'),
    { timeout: 10000 }
  ).catch(() => {})
  await page.waitForTimeout(1000)

  // Use data-testid for reliable selection
  const trigger = page.getByTestId('primary-industry-select-trigger')
  await trigger.waitFor({ state: 'visible', timeout: 5000 })
  return trigger
}

/**
 * Hover over the Primary Industry trigger and wait for hover state
 */
export async function hoverPrimaryIndustryTrigger(page: Page): Promise<Locator> {
  const trigger = await getPrimaryIndustryTrigger(page)
  await trigger.hover()
  // Wait a bit for hover styles to apply
  await page.waitForTimeout(100)
  return trigger
}

/**
 * Open the Primary Industry dropdown via click
 */
export async function openPrimaryIndustryDropdown(page: Page): Promise<void> {
  const trigger = await getPrimaryIndustryTrigger(page)
  await trigger.click()
  // Wait for dropdown to open
  await page.waitForTimeout(300)
}

/**
 * Open the Primary Industry dropdown via keyboard (Enter key)
 */
export async function openPrimaryIndustryDropdownKeyboard(page: Page): Promise<void> {
  const trigger = await getPrimaryIndustryTrigger(page)
  await trigger.focus()
  await page.keyboard.press('Enter')
  // Wait for dropdown to open
  await page.waitForTimeout(300)
}

/**
 * Select an industry option from the dropdown
 */
export async function selectIndustryOption(
  page: Page,
  industryName: string
): Promise<void> {
  // Wait for dropdown content to be visible
  const option = page.getByRole('option', { name: new RegExp(industryName, 'i') })
  await option.waitFor({ state: 'visible', timeout: 5000 })
  await option.click()
  // Wait for selection to complete
  await page.waitForTimeout(500)
}

/**
 * Get the dropdown content element (when open)
 */
export async function getDropdownContent(page: Page): Promise<Locator | null> {
  // Try to find the dropdown content by role or data attribute
  const content = page.locator('[role="listbox"], [data-radix-select-content]').first()
  const isVisible = await content.isVisible().catch(() => false)
  return isVisible ? content : null
}

/**
 * Check if dropdown is open
 */
export async function isDropdownOpen(page: Page): Promise<boolean> {
  const content = await getDropdownContent(page)
  return content !== null && (await content.isVisible())
}

/**
 * Get all industry options from the dropdown
 */
export async function getIndustryOptions(page: Page): Promise<Locator[]> {
  const options = page.getByRole('option')
  await options.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  return await options.all()
}

