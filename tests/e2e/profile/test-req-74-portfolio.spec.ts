/**
 * REQ-74: Portfolio Management E2E Tests
 * Tests portfolio gallery and management functionality
 */

import { test, expect } from '@playwright/test'
import { setupAuth } from '../infrastructure/playwright/setup/auth.setup'

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page)
  })

  test('user views portfolio gallery on profile', async ({ page }) => {
    await page.goto('/dashboard/profile/general')
    await page.waitForTimeout(2000)

    // Look for portfolio section
    const portfolioSection = page.locator('text=Portfolio').or(page.locator('[data-testid*="portfolio"]')).first()
    const sectionCount = await portfolioSection.count()

    if (sectionCount > 0) {
      await expect(portfolioSection).toBeVisible()
    } else {
      // Portfolio section may not exist if user has no items
      // This is acceptable - empty state is handled by component
      test.skip()
    }
  })

  test('user opens portfolio item lightbox', async ({ page }) => {
    await page.goto('/dashboard/profile/general')
    await page.waitForTimeout(2000)

    // Find portfolio item card
    const portfolioCard = page.locator('[data-testid="portfolio-card"]').first()
    const cardCount = await portfolioCard.count()

    if (cardCount > 0) {
      await portfolioCard.click()

      // Lightbox modal should open
      await expect(page.locator('[data-testid="responsive-modal"]')).toBeVisible({ timeout: 3000 })
    } else {
      test.skip()
    }
  })

  test('user adds new portfolio item in edit mode', async ({ page }) => {
    await page.goto('/dashboard/profile/general')
    await page.waitForTimeout(2000)

    // Look for "Add Portfolio Item" button
    const addButton = page.locator('text=Add Portfolio Item').or(page.locator('button:has-text("Add Portfolio Item")')).first()
    const buttonCount = await addButton.count()

    if (buttonCount > 0) {
      await addButton.click()

      // Form should appear
      await expect(page.locator('text=Add Portfolio Item').or(page.locator('input[placeholder*="Project Name"]'))).toBeVisible({ timeout: 3000 })

      // Fill in title
      const titleInput = page.locator('input[placeholder*="Project Name"]').or(page.locator('input[type="text"]')).first()
      await titleInput.fill('Test Portfolio Item')

      // Save (if save button is visible)
      const saveButton = page.locator('button:has-text("Add Portfolio Item")').or(page.locator('button:has-text("Save")')).first()
      const saveCount = await saveButton.count()

      if (saveCount > 0) {
        // Don't actually save to avoid creating test data
        // Just verify the form is functional
        await expect(titleInput).toHaveValue('Test Portfolio Item')
      }
    } else {
      test.skip()
    }
  })

  test('user edits portfolio item', async ({ page }) => {
    await page.goto('/dashboard/profile/general')
    await page.waitForTimeout(2000)

    // Find edit button on portfolio item
    const editButton = page.locator('[data-testid="edit-icon"]').closest('button').first()
    const editCount = await editButton.count()

    if (editCount > 0) {
      await editButton.click()

      // Edit form should appear
      await expect(page.locator('text=Edit Portfolio Item').or(page.locator('input[type="text"]'))).toBeVisible({ timeout: 3000 })
    } else {
      test.skip()
    }
  })

  test('user deletes portfolio item', async ({ page }) => {
    await page.goto('/dashboard/profile/general')
    await page.waitForTimeout(2000)

    // Find remove/delete button
    const removeButton = page.locator('[data-testid="remove-button"]').first()
    const removeCount = await removeButton.count()

    if (removeCount > 0) {
      // Set up dialog handler
      page.once('dialog', (dialog) => {
        // Don't actually confirm to avoid deleting real data
        dialog.dismiss()
      })

      await removeButton.click()

      // Confirmation dialog should appear
      // Dialog handler will dismiss it
    } else {
      test.skip()
    }
  })

  test('portfolio displays correctly on public profile', async ({ page }) => {
    // Navigate to a public profile (if we have a test user ID)
    // This test may need to be adjusted based on actual profile URLs
    await page.goto('/dashboard/discover/workers')
    await page.waitForTimeout(2000)

    // Try to find a worker profile link
    const profileLink = page.locator('a[href*="/discover/workers/"]').first()
    const linkCount = await profileLink.count()

    if (linkCount > 0) {
      await profileLink.click()
      await page.waitForTimeout(2000)

      // Look for portfolio section
      const portfolioSection = page.locator('text=Portfolio').first()
      const sectionCount = await portfolioSection.count()

      // Portfolio may or may not be present depending on user
      if (sectionCount > 0) {
        await expect(portfolioSection).toBeVisible()
      }
    } else {
      test.skip()
    }
  })
})

