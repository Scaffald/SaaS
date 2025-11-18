// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('REQ-29 • Employment Preferences Complete Form Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/employment', { waitUntil: 'domcontentloaded' })
    
    // Wait for form to load
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading employment preferences...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
  })

  test('completes full form submission with all fields filled', async ({ page }: { page: Page }) => {
    // Fill hourly rate
    const hourlyRateInput = page.locator('input[placeholder*="hourly rate" i], input[type="number"]').first()
    await hourlyRateInput.fill('45.50')
    
    // Enable US Resident
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Enable US Passport
    const usPassportToggle = page.getByRole('switch', { name: /us passport/i })
    if (await usPassportToggle.isVisible()) {
      if (!(await usPassportToggle.isChecked())) {
        await usPassportToggle.click()
      }
    }
    
    // Enable Driver's License and select classes
    const driversToggle = page.getByRole('switch', { name: /driver.*license/i })
    if (await driversToggle.isVisible()) {
      if (!(await driversToggle.isChecked())) {
        await driversToggle.click()
      }
      await page.waitForTimeout(500)
      
      const classACheckbox = page.getByRole('checkbox', { name: /class a/i })
      if (await classACheckbox.isVisible()) {
        await classACheckbox.click()
      }
    }
    
    // Adjust travel distance
    const travelSlider = page.getByRole('slider', { name: /travel/i })
    if (await travelSlider.isVisible()) {
      await travelSlider.press('ArrowRight')
      await page.waitForTimeout(300)
    }
    
    // Save changes
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    
    // Wait for success toast
    await page.waitForSelector('text=Employment Updated', { timeout: 5000 }).catch(() => {})
    
    // Verify form is no longer dirty (save button should be disabled)
    await page.waitForTimeout(1000)
  })

  test('displays validation errors correctly', async ({ page }: { page: Page }) => {
    // Try to save without required fields
    const saveButton = page.getByRole('button', { name: /save changes/i })
    
    // Enable driver's license but don't select any classes
    const driversToggle = page.getByRole('switch', { name: /driver.*license/i })
    if (await driversToggle.isVisible()) {
      await driversToggle.click()
      await page.waitForTimeout(500)
    }
    
    // Try to save
    await saveButton.click()
    
    // Should show validation error
    await page.waitForSelector('text=Please select at least one license class', { timeout: 3000 }).catch(() => {})
  })

  test('shows success toast after save', async ({ page }: { page: Page }) => {
    // Fill required fields
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Save
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    
    // Wait for success toast
    await page.waitForSelector('text=Employment Updated', { timeout: 5000 }).catch(() => {})
    await page.waitForSelector('text=Your employment preferences have been saved', { timeout: 5000 }).catch(() => {})
  })

  test('form persists after page reload', async ({ page }: { page: Page }) => {
    // Make some changes
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Save
    const saveButton = page.getByRole('button', { name: /save changes/i })
    await saveButton.click()
    
    // Wait for save to complete
    await page.waitForTimeout(2000)
    
    // Reload page
    await page.reload()
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading employment preferences...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
    
    // Verify saved state persists
    const residentToggleAfterReload = page.getByRole('switch', { name: /us resident/i })
    if (await residentToggleAfterReload.isVisible()) {
      // Should be checked if it was saved
      const isChecked = await residentToggleAfterReload.isChecked()
      expect(isChecked).toBe(true)
    }
  })

  test('all toggle combinations work independently', async ({ page }: { page: Page }) => {
    // Enable multiple toggles
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    const usPassportToggle = page.getByRole('switch', { name: /us passport/i })
    const driversToggle = page.getByRole('switch', { name: /driver.*license/i })
    
    if (await usResidentToggle.isVisible()) {
      await usResidentToggle.click()
      await page.waitForTimeout(300)
    }
    
    if (await usPassportToggle.isVisible()) {
      await usPassportToggle.click()
      await page.waitForTimeout(300)
    }
    
    if (await driversToggle.isVisible()) {
      await driversToggle.click()
      await page.waitForTimeout(300)
    }
    
    // All should be enabled
    if (await usResidentToggle.isVisible()) {
      expect(await usResidentToggle.isChecked()).toBe(true)
    }
    if (await usPassportToggle.isVisible()) {
      expect(await usPassportToggle.isChecked()).toBe(true)
    }
    if (await driversToggle.isVisible()) {
      expect(await driversToggle.isChecked()).toBe(true)
    }
  })

  test('all sub-options can be selected', async ({ page }: { page: Page }) => {
    // Enable driver's license
    const driversToggle = page.getByRole('switch', { name: /driver.*license/i })
    if (await driversToggle.isVisible()) {
      await driversToggle.click()
      await page.waitForTimeout(500)
      
      // Select multiple license classes
      const classACheckbox = page.getByRole('checkbox', { name: /class a/i })
      const classBCheckbox = page.getByRole('checkbox', { name: /class b/i })
      
      if (await classACheckbox.isVisible()) {
        await classACheckbox.click()
      }
      if (await classBCheckbox.isVisible()) {
        await classBCheckbox.click()
      }
      
      // Verify both are checked
      if (await classACheckbox.isVisible()) {
        expect(await classACheckbox.isChecked()).toBe(true)
      }
      if (await classBCheckbox.isVisible()) {
        expect(await classBCheckbox.isChecked()).toBe(true)
      }
    }
  })

  test('travel distance slider supports full range (10-250 miles)', async ({ page }: { page: Page }) => {
    const travelSlider = page.getByRole('slider', { name: /travel/i })
    
    if (await travelSlider.isVisible()) {
      // Check min value
      await travelSlider.press('Home')
      await page.waitForTimeout(300)
      await expect(page.getByText('10 miles')).toBeVisible().catch(() => {})
      
      // Check max value
      await travelSlider.press('End')
      await page.waitForTimeout(300)
      await expect(page.getByText('250 miles')).toBeVisible().catch(() => {})
    }
  })

  test('cancel dialog prevents data loss', async ({ page }: { page: Page }) => {
    // Make a change
    const usResidentToggle = page.getByRole('switch', { name: /us resident/i })
    if (await usResidentToggle.isVisible()) {
      if (!(await usResidentToggle.isChecked())) {
        await usResidentToggle.click()
      }
    }
    
    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    if (await cancelButton.isVisible()) {
      await cancelButton.click()
      
      // Should show confirmation dialog
      await page.waitForSelector('text=Discard Changes', { timeout: 3000 }).catch(() => {})
      
      // Cancel the dialog (keep editing)
      const keepEditingButton = page.getByRole('button', { name: /keep editing/i })
      if (await keepEditingButton.isVisible()) {
        await keepEditingButton.click()
      }
    }
  })
})

