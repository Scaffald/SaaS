/**
 * Office Form Helpers
 *
 * Provides utilities for interacting with office admin forms
 */

import type { Locator, Page } from '@playwright/test'

/**
 * Fill a text field by label
 * Supports various label patterns (Label, Label *, etc.)
 */
export async function fillTextField(
  page: Page,
  label: string,
  value: string,
  options?: { exact?: boolean; timeout?: number }
): Promise<void> {
  try {
    // Try to find input by label
    const input = page.getByLabel(label, { exact: options?.exact ?? false })
    await input.fill(value, { timeout: options?.timeout ?? 5000 })
  } catch (error) {
    // Fallback: try finding by placeholder
    const input = page.getByPlaceholder(new RegExp(label, 'i'))
    await input.fill(value, { timeout: options?.timeout ?? 5000 })
  }
}

/**
 * Select an option from a dropdown by label
 * Works with both native selects and custom Select components
 */
export async function selectDropdown(
  page: Page,
  label: string,
  value: string,
  options?: { exact?: boolean; timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Try to find the select trigger
  const trigger = page.getByLabel(label, { exact: options?.exact ?? false })

  // Check if it's a native select or a custom component
  const tagName = await trigger.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'div')

  if (tagName === 'select') {
    // Native select
    await trigger.selectOption(value, { timeout })
  } else {
    // Custom select (React)
    await trigger.click({ timeout })
    await page.waitForTimeout(300) // Wait for dropdown to open

    // Find and click the option
    const option = page.getByRole('option', { name: new RegExp(value, 'i') })
    await option.click({ timeout })
  }
}

/**
 * Fill an address autocomplete field
 * Handles Mapbox/Google Places autocomplete interactions
 */
export async function fillAddressAutocomplete(
  page: Page,
  address: string,
  options?: {
    selectFirst?: boolean
    timeout?: number
    waitForSuggestions?: number
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const waitTime = options?.waitForSuggestions ?? 1000
  const selectFirst = options?.selectFirst ?? true

  // Find address input (try multiple patterns)
  let input: Locator
  try {
    input = page.getByLabel(/address/i).first()
  } catch {
    input = page.getByPlaceholder(/address/i).first()
  }

  // Type the address
  await input.fill(address, { timeout })
  await page.waitForTimeout(waitTime)

  if (selectFirst) {
    // Try to find and click the first suggestion
    try {
      // Look for various autocomplete suggestion patterns
      const suggestion = page
        .locator('[role="option"]')
        .first()
        .or(page.locator('.mapbox-gl-geocoder--suggestion').first())
        .or(page.locator('[class*="suggestion"]').first())

      await suggestion.click({ timeout: 3000 })
    } catch (error) {
      console.warn('Could not find address suggestion, address typed but not selected')
    }
  }
}

/**
 * Accept a checkbox by clicking its label
 * Works with custom checkbox implementations
 */
export async function acceptCheckbox(
  page: Page,
  label: string,
  options?: { exact?: boolean; timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  try {
    // Try to click the checkbox directly
    const checkbox = page.getByRole('checkbox', { name: new RegExp(label, 'i') })
    await checkbox.click({ timeout })
  } catch {
    // Fallback: click the label text (works for custom checkboxes)
    const labelElement = page.getByText(new RegExp(label, 'i'))
    await labelElement.click({ timeout })
  }
}

/**
 * Toggle a switch by label
 * Works with custom Switch components
 */
export async function toggleSwitch(
  page: Page,
  label: string,
  value: boolean,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  const switchElement = page.getByLabel(label)
  const currentState = await switchElement.isChecked().catch(() => false)

  // Only click if we need to change the state
  if (currentState !== value) {
    await switchElement.click({ timeout })
  }
}

/**
 * Fill a multi-line textarea by label
 */
export async function fillTextarea(
  page: Page,
  label: string,
  value: string,
  options?: { exact?: boolean; timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  try {
    const textarea = page.getByLabel(label, { exact: options?.exact ?? false })
    await textarea.fill(value, { timeout })
  } catch {
    // Fallback: try by placeholder
    const textarea = page.getByPlaceholder(new RegExp(label, 'i'))
    await textarea.fill(value, { timeout })
  }
}

/**
 * Wait for form validation errors to appear
 * Returns true if errors are present, false if form is valid
 */
export async function waitForValidationErrors(
  page: Page,
  options?: { timeout?: number }
): Promise<boolean> {
  const timeout = options?.timeout ?? 2000

  try {
    // Look for common error patterns
    await page
      .locator('[role="alert"]')
      .or(page.locator('[class*="error"]'))
      .or(page.locator('[class*="invalid"]'))
      .first()
      .waitFor({ state: 'visible', timeout })

    return true
  } catch {
    return false
  }
}

/**
 * Get validation error messages from the form
 */
export async function getValidationErrors(page: Page): Promise<string[]> {
  const errors: string[] = []

  // Find all error elements
  const errorElements = page
    .locator('[role="alert"]')
    .or(page.locator('[class*="error"]'))
    .or(page.locator('[class*="invalid"]'))

  const count = await errorElements.count()

  for (let i = 0; i < count; i++) {
    const text = await errorElements.nth(i).textContent()
    if (text?.trim()) {
      errors.push(text.trim())
    }
  }

  return errors
}

/**
 * Submit a form by finding and clicking the submit button
 */
export async function submitForm(
  page: Page,
  options?: {
    buttonText?: string
    timeout?: number
    waitForNavigation?: boolean
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const buttonText = options?.buttonText ?? /submit|save|create|update/i
  const waitForNavigation = options?.waitForNavigation ?? true

  const submitButton = page.getByRole('button', { name: buttonText })

  if (waitForNavigation) {
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout }),
      submitButton.click({ timeout }),
    ])
  } else {
    await submitButton.click({ timeout })
  }
}

/**
 * Clear all form fields
 */
export async function clearForm(page: Page): Promise<void> {
  // Find all input elements
  const inputs = page.locator(
    'input[type="text"], input[type="email"], input[type="tel"], textarea'
  )
  const count = await inputs.count()

  for (let i = 0; i < count; i++) {
    await inputs
      .nth(i)
      .clear()
      .catch(() => {
        // Ignore errors for read-only or disabled fields
      })
  }
}

/**
 * Expand a collapsible form section by clicking its header
 */
export async function expandFormSection(
  page: Page,
  sectionName: string,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Find the section header (usually a button or clickable element)
  const header = page
    .getByRole('button', { name: new RegExp(sectionName, 'i') })
    .or(page.getByText(new RegExp(sectionName, 'i')).filter({ has: page.locator('svg') }))

  // Check if already expanded (look for aria-expanded attribute)
  const isExpanded = await header.getAttribute('aria-expanded').catch(() => null)

  if (isExpanded !== 'true') {
    await header.click({ timeout })
    await page.waitForTimeout(300) // Wait for animation
  }
}

/**
 * Add an item to a list field (like locations, domains, etc.)
 */
export async function addListItem(
  page: Page,
  fieldLabel: string,
  value: string,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Find the add button for this field
  const addButton = page.getByRole('button', { name: new RegExp(`add ${fieldLabel}`, 'i') })
  await addButton.click({ timeout })

  // Wait for new input to appear
  await page.waitForTimeout(300)

  // Fill the newly added field (usually the last one with that label)
  const inputs = page.getByLabel(new RegExp(fieldLabel, 'i'))
  const lastInput = inputs.last()
  await lastInput.fill(value, { timeout })
}

/**
 * Remove an item from a list field
 */
export async function removeListItem(
  page: Page,
  index: number,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Find remove buttons (usually have trash/X icons)
  const removeButtons = page.getByRole('button', { name: /remove|delete/i })
  await removeButtons.nth(index).click({ timeout })

  // Wait for removal animation
  await page.waitForTimeout(300)
}
