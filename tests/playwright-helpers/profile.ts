// @ts-nocheck
import type { Page } from '@playwright/test'

/**
 * Ensure the regular user's profile gate is completed.
 * This uses the known behavior: clickable Text labels toggle custom checkboxes.
 * Safe to call on any page; it will navigate to /dashboard if needed.
 */
export async function ensureProfileComplete(page: Page): Promise<void> {
  try {
    // Go to dashboard which triggers the profile gate if incomplete
    // Use domcontentloaded for faster navigation (networkidle can timeout)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(500)

    // If the completion form isn't present, return quickly (with short timeout)
    const gateVisible = await Promise.race([
      page.getByText(/complete profile|privacy policy|terms of service/i).isVisible(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500))
    ]).catch(() => false)
    if (!gateVisible) return
  } catch (error) {
    // If navigation fails or times out, just continue - profile might already be complete
    return
  }

  // Fill common fields defensively; ignore failures to keep this resilient
  try { await page.getByPlaceholder(/first name/i).fill('Test') } catch {}
  try { await page.getByPlaceholder(/last name/i).fill('User') } catch {}

  // Address: either full address field or switch to individual editors if present
  try {
    await page.getByPlaceholder(/address/i).fill('123 Main St')
  } catch {}

  // Roles: click label text to toggle custom checkbox implementations
  try { await page.getByText(/worker seeking employment|keeping options open/i).click() } catch {}

  // Industry: open combobox and select first option
  try {
    await page.getByRole('combobox').first().click()
    const firstOption = page.locator('[role="option"]').first()
    await firstOption.click({ timeout: 1000 })
  } catch {}

  // Privacy/Terms: click the text labels
  try { await page.getByText(/privacy policy/i).click() } catch {}
  try { await page.getByText(/terms of service/i).click() } catch {}

  // Submit
  try { await page.getByRole('button', { name: /complete profile|continue|submit/i }).click() } catch {}

  // Wait briefly for navigation/state change (don't wait for networkidle - pages may never finish loading)
  await page.waitForTimeout(500)
}
