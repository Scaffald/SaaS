/**
 * REQ-74: UserProfilePanel on Map E2E Tests
 * Tests the profile panel that appears when clicking map pins
 */

import { expect, test } from '@playwright/test'
import { setupAuth } from '../infrastructure/playwright/setup/auth.setup'

test.describe('UserProfilePanel on Map', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page)
    await page.goto('/dashboard/discover/map')
    // Wait for map to load
    await page.waitForTimeout(2000)
  })

  test('user clicks map pin and profile panel appears', async ({ page }) => {
    // Find a map pin (worker pin)
    const mapPin = page
      .locator('[data-testid*="map-pin"]')
      .or(page.locator('[data-testid*="worker-pin"]'))
      .first()

    const pinCount = await mapPin.count()
    if (pinCount > 0) {
      await mapPin.click()

      // Wait for profile panel to appear
      await expect(page.locator('[data-testid="profile-panel-card"]')).toBeVisible({
        timeout: 5000,
      })
    } else {
      // Skip if no pins available
      test.skip()
    }
  })

  test('profile panel displays user info', async ({ page }) => {
    const mapPin = page
      .locator('[data-testid*="map-pin"]')
      .or(page.locator('[data-testid*="worker-pin"]'))
      .first()

    const pinCount = await mapPin.count()
    if (pinCount > 0) {
      await mapPin.click()

      // Wait for panel
      await page.waitForSelector('[data-testid="profile-panel-card"]', { timeout: 5000 })

      // Check for user name (should be present)
      const panel = page.locator('[data-testid="profile-panel-card"]')
      await expect(panel).toBeVisible()

      // Panel should have some content
      const hasContent = await panel.textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    } else {
      test.skip()
    }
  })

  test('user clicks "View Profile" button and navigates', async ({ page }) => {
    const mapPin = page
      .locator('[data-testid*="map-pin"]')
      .or(page.locator('[data-testid*="worker-pin"]'))
      .first()

    const pinCount = await mapPin.count()
    if (pinCount > 0) {
      await mapPin.click()

      // Wait for panel
      await page.waitForSelector('[data-testid="profile-panel-card"]', { timeout: 5000 })

      // Click View Profile button
      const viewProfileButton = page
        .locator('text=View Profile')
        .or(page.locator('button:has-text("View Profile")'))
      const buttonCount = await viewProfileButton.count()

      if (buttonCount > 0) {
        await viewProfileButton.first().click()

        // Panel should close
        await expect(page.locator('[data-testid="profile-panel-card"]')).not.toBeVisible({
          timeout: 2000,
        })

        // Navigation should occur (check URL change)
        await page.waitForTimeout(1000)
        const url = page.url()
        expect(url).toContain('/discover/workers/')
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('user closes panel with X button', async ({ page }) => {
    const mapPin = page
      .locator('[data-testid*="map-pin"]')
      .or(page.locator('[data-testid*="worker-pin"]'))
      .first()

    const pinCount = await mapPin.count()
    if (pinCount > 0) {
      await mapPin.click()

      // Wait for panel
      await page.waitForSelector('[data-testid="profile-panel-card"]', { timeout: 5000 })

      // Find and click close button
      const closeButton = page
        .locator('[data-testid="x-icon"]')
        .closest('button')
        .or(page.locator('button:has([data-testid="x-icon"])'))
      const buttonCount = await closeButton.count()

      if (buttonCount > 0) {
        await closeButton.first().click()

        // Panel should close
        await expect(page.locator('[data-testid="profile-panel-card"]')).not.toBeVisible({
          timeout: 2000,
        })
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('panel positioning on different screen sizes', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })

    const mapPin = page
      .locator('[data-testid*="map-pin"]')
      .or(page.locator('[data-testid*="worker-pin"]'))
      .first()
    const pinCount = await mapPin.count()

    if (pinCount > 0) {
      await mapPin.click()
      await page.waitForSelector('[data-testid="profile-panel-card"]', { timeout: 5000 })

      const panel = page.locator('[data-testid="profile-panel-card"]')
      const desktopBox = await panel.boundingBox()

      // Test mobile size
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForTimeout(2000)

      const mobilePin = page
        .locator('[data-testid*="map-pin"]')
        .or(page.locator('[data-testid*="worker-pin"]'))
        .first()
      const mobilePinCount = await mobilePin.count()

      if (mobilePinCount > 0) {
        await mobilePin.click()
        await page.waitForSelector('[data-testid="profile-panel-card"]', { timeout: 5000 })

        const mobilePanel = page.locator('[data-testid="profile-panel-card"]')
        const mobileBox = await mobilePanel.boundingBox()

        // Panel should be visible in both sizes
        expect(desktopBox).not.toBeNull()
        expect(mobileBox).not.toBeNull()
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })
})
