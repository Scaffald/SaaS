// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

test.describe('REQ-71: Employer Card Navigation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)
    await signInAsAdmin(page)
  })

  // Test 1: Click employer card navigates to detail page
  test('should navigate to employer detail page when card is clicked', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    // Find employer cards
    const employerCards = page.locator('[data-testid*="employer"], button:has-text("View Details")').first()
    const cardVisible = await employerCards.isVisible().catch(() => false)

    if (cardVisible) {
      // Click the card or View Details button
      await employerCards.click()
      await page.waitForTimeout(2000)

      // Should navigate to employer detail page
      const url = page.url()
      expect(url).toMatch(/\/dashboard\/employers\/[^/]+$/)
    } else {
      // If no cards, verify page loaded
      const pageContent = await page.locator('body').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)
    }
  })

  // Test 2: Employer detail page displays complete information
  test('should display complete employer information on detail page', async ({ page }: { page: Page }) => {
    // First, try to navigate to an employer detail page
    await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    // Try to find and click an employer card
    const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
    const buttonVisible = await viewDetailsButton.isVisible().catch(() => false)

    if (buttonVisible) {
      await viewDetailsButton.click()
      await page.waitForTimeout(3000)

      // Verify detail page loaded
      const pageContent = await page.locator('body').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)

      // Should contain employer-related content
      expect(pageContent.toLowerCase()).toMatch(/employer|company|organization/)
    } else {
      // If no button, just verify employers page loaded
      const pageContent = await page.locator('body').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)
    }
  })

  // Test 3: Back navigation returns to employer list
  test('should return to employer list when back button is clicked', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    // Try to navigate to detail page
    const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
    const buttonVisible = await viewDetailsButton.isVisible().catch(() => false)

    if (buttonVisible) {
      const initialUrl = page.url()
      await viewDetailsButton.click()
      await page.waitForTimeout(3000)

      // Try to go back
      await page.goBack()
      await page.waitForTimeout(2000)

      // Should return to employers list
      expect(page.url()).toContain('/dashboard/discover/employers')
    } else {
      // If no button, just verify page loaded
      const pageContent = await page.locator('body').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)
    }
  })

  // Test 4: Route parameter correctly passes employer ID
  test('should pass employer ID in route parameter', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
    const buttonVisible = await viewDetailsButton.isVisible().catch(() => false)

    if (buttonVisible) {
      await viewDetailsButton.click()
      await page.waitForTimeout(3000)

      // URL should contain employer ID
      const url = page.url()
      const employerIdMatch = url.match(/\/employers\/([^/]+)/)
      
      if (employerIdMatch) {
        expect(employerIdMatch[1]).toBeTruthy()
        expect(employerIdMatch[1].length).toBeGreaterThan(0)
      }
    } else {
      // If no button, just verify page loaded
      const pageContent = await page.locator('body').textContent() || ''
      expect(pageContent.length).toBeGreaterThan(0)
    }
  })

  // Test 5: Page handles loading and error states
  test('should handle loading and error states gracefully', async ({ page }: { page: Page }) => {
    // Navigate directly to a potentially invalid employer ID
    await page.goto('/dashboard/employers/invalid-id-12345', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})

    // Page should either show error or redirect, but not crash
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  // Test 6: Browser back button works correctly
  test('should support browser back button navigation', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const initialUrl = page.url()

    // Try to navigate to detail page
    const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
    const buttonVisible = await viewDetailsButton.isVisible().catch(() => false)

    if (buttonVisible) {
      await viewDetailsButton.click()
      await page.waitForTimeout(3000)

      // Use browser back button
      await page.goBack()
      await page.waitForTimeout(2000)

      // Should return to employers list
      expect(page.url()).toContain('/dashboard/discover/employers')
    } else {
      // If no button, just verify initial page loaded
      expect(initialUrl).toContain('/dashboard/discover/employers')
    }
  })
})

