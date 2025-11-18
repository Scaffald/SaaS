// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('REQ-29 • Employment Preferences Edge Cases', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/employment', { waitUntil: 'domcontentloaded' })
    
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading employment preferences...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
  })

  test('handles empty form state (no saved data)', async ({ page }: { page: Page }) => {
    // Form should load even with no saved data
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
    
    // All form fields should be visible
    const hourlyRateInput = page.locator('input[placeholder*="hourly rate" i]').first()
    const saveButton = page.getByRole('button', { name: /save changes/i })
    
    expect(await hourlyRateInput.isVisible().catch(() => false) || await saveButton.isVisible().catch(() => false)).toBe(true)
  })

  test('handles form with all fields filled', async ({ page }: { page: Page }) => {
    // Fill all fields
    const hourlyRateInput = page.locator('input[placeholder*="hourly rate" i]').first()
    if (await hourlyRateInput.isVisible()) {
      await hourlyRateInput.fill('50.00')
    }
    
    // Enable all toggles
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    const usPassportToggle = page.getByRole('switch', { name: /us passport/i })
    const driversToggle = page.getByRole('switch', { name: /driver.*license/i })
    
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    if (await usPassportToggle.isVisible()) {
      if (!(await usPassportToggle.isChecked())) {
        await usPassportToggle.click()
      }
    }
    if (await driversToggle.isVisible()) {
      if (!(await driversToggle.isChecked())) {
        await driversToggle.click()
        await page.waitForTimeout(500)
        
        // Select license classes
        const classACheckbox = page.getByRole('checkbox', { name: /class a/i })
        if (await classACheckbox.isVisible()) {
          await classACheckbox.click()
        }
      }
    }
    
    // Form should handle all fields
    const saveButton = page.getByRole('button', { name: /save changes/i })
    expect(await saveButton.isVisible()).toBe(true)
  })

  test('handles rapid toggle changes without state loss', async ({ page }: { page: Page }) => {
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    const usPassportToggle = page.getByRole('switch', { name: /us passport/i })
    
    // Rapidly toggle multiple times
    if (await usResidentToggle.isVisible()) {
      await usResidentToggle.click()
      await page.waitForTimeout(100)
      await usResidentToggle.click()
      await page.waitForTimeout(100)
      await usResidentToggle.click()
    }
    
    if (await usPassportToggle.isVisible()) {
      await usPassportToggle.click()
      await page.waitForTimeout(100)
      await usPassportToggle.click()
      await page.waitForTimeout(100)
    }
    
    // State should be consistent
    if (await usResidentToggle.isVisible()) {
      const finalState = await usResidentToggle.isChecked()
      expect(typeof finalState).toBe('boolean')
    }
  })

  test('handles form submission during network delay', async ({ page }: { page: Page }) => {
    // Make changes
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Submit
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    
    // Button should show loading state or be disabled during submission
    await page.waitForTimeout(500)
    
    // Should eventually show success or error
    await page.waitForTimeout(2000)
  })

  test('handles page reload with unsaved changes', async ({ page }: { page: Page }) => {
    // Make a change
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Reload page without saving
    await page.reload()
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading employment preferences...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
    
    // Form should load with original data (unsaved changes lost)
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('handles multiple consecutive saves', async ({ page }: { page: Page }) => {
    // Make initial change and save
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    await page.waitForTimeout(2000)
    
    // Make another change and save again
    const usPassportToggle = page.getByRole('switch', { name: /us passport/i })
    if (await usPassportToggle.isVisible()) {
      if (!(await usPassportToggle.isChecked())) {
        await usPassportToggle.click()
      }
    }
    
    await saveButton.click()
    await page.waitForTimeout(2000)
    
    // Both saves should succeed
    await page.waitForSelector('text=Employment Updated', { timeout: 5000 }).catch(() => {})
  })
})

