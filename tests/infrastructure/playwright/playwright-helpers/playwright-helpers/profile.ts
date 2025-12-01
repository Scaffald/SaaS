import type { Page } from '@playwright/test'

/**
 * Ensure the regular user's profile gate is completed.
 * This uses the known behavior: clickable Text labels toggle custom checkboxes.
 * IMPORTANT: Assumes the page is already on /dashboard (called after signInAsUser navigates there).
 */
export async function ensureProfileComplete(page: Page): Promise<void> {
  try {
    // We're already on /dashboard from signInAsUser, just wait for page to settle
    await page.waitForTimeout(1000)

    // Dismiss cookie consent if present
    try {
      await page.getByRole('button', { name: /accept|reject/i }).click({ timeout: 2000 })
      await page.waitForTimeout(500)
    } catch {}

    // If the completion form isn't present, return quickly (with short timeout)
    const gateVisible = await Promise.race([
      page.getByText(/complete profile|privacy policy|terms of service/i).isVisible(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
    ]).catch(() => false)
    if (!gateVisible) {
      // Profile might already be complete, wait a bit for page to settle
      await page.waitForTimeout(500)
      return
    }
  } catch (error) {
    // If there's an error, just continue - profile might already be complete
    console.warn('ensureProfileComplete: Error (assuming profile complete):', error)
    return
  }

  // Fill common fields defensively; ignore failures to keep this resilient
  try {
    await page.getByPlaceholder(/first name/i).fill('Test')
  } catch {}
  try {
    await page.getByPlaceholder(/last name/i).fill('User')
  } catch {}

  // Address: either full address field or switch to individual editors if present
  try {
    await page.getByPlaceholder(/address/i).fill('123 Main St')
  } catch {}

  // Roles: click label text to toggle custom checkbox implementations
  try {
    await page.getByText(/worker seeking employment|keeping options open/i).click()
  } catch {}

  // Industry: open combobox and select first option
  try {
    await page.getByRole('combobox').first().click()
    const firstOption = page.locator('[role="option"]').first()
    await firstOption.click({ timeout: 1000 })
  } catch {}

  // Privacy/Terms: click the text labels
  try {
    await page.getByText(/privacy policy/i).click()
  } catch {}
  try {
    await page.getByText(/terms of service/i).click()
  } catch {}

  // Submit
  try {
    await page.getByRole('button', { name: /complete profile|continue|submit/i }).click()
  } catch {}

  // Wait briefly for navigation/state change (don't wait for networkidle - pages may never finish loading)
  await page.waitForTimeout(500)
}

/**
 * Ensure the admin user's profile gate is completed.
 * Similar to ensureProfileComplete but for admin users.
 * IMPORTANT: Assumes the page is already on /dashboard (called after signInAsUser navigates there).
 */
export async function ensureAdminProfileComplete(page: Page): Promise<void> {
  try {
    // We're already on /dashboard from signInAsUser, just wait for page to settle
    await page.waitForTimeout(1000)

    // Dismiss cookie consent if present
    try {
      await page.getByRole('button', { name: /accept|reject/i }).click({ timeout: 2000 })
      await page.waitForTimeout(500)
    } catch {}

    // If the completion form isn't present, return quickly
    const gateVisible = await Promise.race([
      page.getByText(/complete profile|privacy policy|terms of service/i).isVisible(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2000)),
    ]).catch(() => false)
    if (!gateVisible) {
      await page.waitForTimeout(500)
      return
    }
  } catch (error) {
    console.warn('ensureAdminProfileComplete: Error (assuming profile complete):', error)
    return
  }

  // Fill common fields defensively
  try {
    await page.getByPlaceholder(/first name/i).fill('Admin')
  } catch {}
  try {
    await page.getByPlaceholder(/last name/i).fill('User')
  } catch {}

  // Address
  try {
    await page.getByPlaceholder(/address/i).fill('456 Admin Ave')
  } catch {}

  // Roles: For admin, likely different role selection
  try {
    await page.getByText(/employer hiring workers|worker seeking employment/i).click()
  } catch {}

  // Industry: open combobox and select first option
  try {
    await page.getByRole('combobox').first().click()
    const firstOption = page.locator('[role="option"]').first()
    await firstOption.click({ timeout: 1000 })
  } catch {}

  // Privacy/Terms
  try {
    await page.getByText(/privacy policy/i).click()
  } catch {}
  try {
    await page.getByText(/terms of service/i).click()
  } catch {}

  // Submit
  try {
    await page.getByRole('button', { name: /complete profile|continue|submit/i }).click()
  } catch {}

  await page.waitForTimeout(500)
}
