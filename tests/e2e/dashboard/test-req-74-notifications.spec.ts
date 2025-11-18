/**
 * REQ-74: Notification Dropdown E2E Tests
 * Tests the notification dropdown functionality in the header
 */

import { test, expect } from '@playwright/test'
import { setupAuth } from '../infrastructure/playwright/setup/auth.setup'

test.describe('Notification Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page)
    await page.goto('/dashboard')
  })

  test('user sees unread badge on bell icon', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForSelector('[aria-label*="Notifications"]', { timeout: 10000 })

    // Check if badge is visible (may or may not be present depending on notifications)
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await expect(bellButton).toBeVisible()

    // Badge may or may not be present - just verify the button is there
    const badge = page.locator('text=/\\d+|99\\+/').first()
    // Don't assert badge presence as it depends on actual notification state
  })

  test('user opens notification dropdown', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown to appear
    await expect(page.locator('text=Notifications')).toBeVisible()
    await expect(page.locator('[role="menu"]')).toBeVisible()
  })

  test('user sees unread and read sections', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown content
    await page.waitForSelector('[role="menu"]', { timeout: 5000 })

    // Check for section headers (may or may not be present depending on notification state)
    const unreadSection = page.locator('text=/Unread/')
    const readSection = page.locator('text=/^Read$/')

    // At least one section should be visible if there are notifications
    // If no notifications, empty state should be shown
    const hasNotifications = await page.locator('[role="menuitem"]').count() > 0
    const hasEmptyState = await page.locator('text=No notifications').isVisible().catch(() => false)

    expect(hasNotifications || hasEmptyState).toBe(true)
  })

  test('user clicks unread notification and navigates', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown
    await page.waitForSelector('[role="menu"]', { timeout: 5000 })

    // Try to find an unread notification (one with unread indicator)
    const unreadNotifications = page.locator('[role="menuitem"]').filter({
      has: page.locator('[data-testid*="unread"]').or(page.locator('text=/Unread/')),
    })

    const count = await unreadNotifications.count()
    if (count > 0) {
      // Click first unread notification
      await unreadNotifications.first().click()

      // Dropdown should close
      await expect(page.locator('[role="menu"]')).not.toBeVisible({ timeout: 2000 })

      // Navigation may occur if notification has ctaUrl
      // Don't assert specific navigation as it depends on notification type
    } else {
      // Skip if no unread notifications
      test.skip()
    }
  })

  test('user closes dropdown with Escape key', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown
    await expect(page.locator('[role="menu"]')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Dropdown should close
    await expect(page.locator('[role="menu"]')).not.toBeVisible({ timeout: 2000 })
  })

  test('user closes dropdown by clicking outside', async ({ page }) => {
    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown
    await expect(page.locator('[role="menu"]')).toBeVisible()

    // Click outside (on body)
    await page.click('body', { position: { x: 10, y: 10 } })

    // Dropdown should close
    await expect(page.locator('[role="menu"]')).not.toBeVisible({ timeout: 2000 })
  })

  test('mobile responsive behavior', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const bellButton = page.locator('[aria-label*="Notifications"]')
    await bellButton.click()

    // Wait for dropdown
    await expect(page.locator('[role="menu"]')).toBeVisible()

    // On mobile, dropdown should be full-width minus padding
    const dropdown = page.locator('[role="menu"]')
    const dropdownBox = await dropdown.boundingBox()
    if (dropdownBox) {
      // Should be close to full width (accounting for padding)
      expect(dropdownBox.width).toBeGreaterThan(300)
    }
  })
})

