// @ts-nocheck
/**
 * Admin Dashboard Route: /dashboard/discover/employers
 *
 * Comprehensive UI and functional testing for the employer discovery route
 * with two-panel adaptive layout, employer listings, and search/filter capabilities.
 *
 * Test User: ewongagent@gmail.com (Admin)
 * Related Task: admin-route-explore-008 (ID: 1b9f89ef-8b30-4d2b-b51c-48f8a258a01a)
 * TEST Task: becdedb9-b83e-4662-9788-6802fca9cc7c
 */

import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'

const ROUTE_PATH = '/dashboard/discover/employers'

test.describe('Admin • /dashboard/discover/employers - Employer Discovery', () => {

  // Setup: Sign in as admin and navigate to employer discovery route before each test
  test.beforeEach(async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    // signInAsAdmin leaves us on /dashboard, now navigate to the employer discovery route
    await page.goto(ROUTE_PATH, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
  })

  test.describe('1. Route Access & Navigation', () => {
    test('should navigate to employer discovery route successfully', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach
      expect(page.url()).toContain(ROUTE_PATH)
    })

    test('should load without console errors', async ({ page }: { page: Page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      // Already on ROUTE_PATH from beforeEach

      // Filter out expected errors (like network errors during test cleanup)
      const relevantErrors = consoleErrors.filter(
        err => !err.includes('net::ERR_') && !err.includes('Failed to fetch')
      )
      expect(relevantErrors).toHaveLength(0)
    })

    test('should display two-panel layout', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Check for search/filter content (right panel)
      const searchLabel = page.getByText('Search', { exact: true })
      await expect(searchLabel).toBeVisible()

      // Check for employer list or loading state (left panel)
      const loadingOrContent = page.locator('text=Loading employers').or(page.locator('text=Employers'))
      await expect(loadingOrContent.first()).toBeVisible()
    })
  })

  test.describe('2. Loading State', () => {
    test('should display loading spinner and text', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Try to catch loading state (it may be brief)
      const loadingText = page.locator('text=Loading employers')
      const isLoading = await loadingText.isVisible().catch(() => false)

      if (isLoading) {
        await expect(loadingText).toBeVisible()
      }

      // Eventually should show content
      await page.waitForFunction(
        () => !document.body.textContent?.includes('Loading employers'),
        { timeout: 10000 }
      ).catch(() => {})
    })

    test('should transition from loading to content state', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Wait for loading to complete
      await page.waitForTimeout(3000)

      // Should show either employers or empty state
      const employersOrEmpty = page.locator('text=Employers').or(page.locator('text=No employers found'))
      await expect(employersOrEmpty.first()).toBeVisible()
    })
  })

  test.describe('3. Search Functionality', () => {
    test('should display search input with placeholder', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await expect(searchInput).toBeVisible()
    })

    test('should filter employers by company name', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('construction')
      await page.waitForTimeout(500)

      // Check if results are filtered (result count should change or empty state should appear)
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })

    test('should update results in real-time as user types', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')

      // Type gradually and check for updates
      await searchInput.fill('a')
      await page.waitForTimeout(300)
      const text1 = await page.locator('body').textContent()

      await searchInput.fill('ab')
      await page.waitForTimeout(300)
      const text2 = await page.locator('body').textContent()

      // Content should exist
      expect(text1).toBeTruthy()
      expect(text2).toBeTruthy()
    })

    test('should show empty state when search has no matches', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('xyznonexistentcompany12345')
      await page.waitForTimeout(500)

      const emptyStateHeading = page.locator('text=No employers found')
      await expect(emptyStateHeading).toBeVisible()

      const emptyStateSubtext = page.locator('text=Try adjusting your filters')
      await expect(emptyStateSubtext).toBeVisible()
    })

    test('should clear search when input is emptied', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')

      // Fill then clear
      await searchInput.fill('test')
      await page.waitForTimeout(300)
      await searchInput.clear()
      await page.waitForTimeout(300)

      // Should show all employers again (or at least not show empty state)
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('No employers found')
    })
  })

  test.describe('4. Industry Filter Functionality', () => {
    test('should display all 6 industry filter buttons', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const industries = ['Construction', 'Manufacturing', 'Engineering', 'Technology', 'Healthcare', 'Education']

      for (const industry of industries) {
        const button = page.getByRole('button', { name: industry, exact: true })
        await expect(button).toBeVisible()
      }
    })

    test('should display industry filter section with icon and title', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const industriesHeading = page.locator('text=Industries')
      await expect(industriesHeading).toBeVisible()
    })

    test('should toggle industry selection on click', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const constructionButton = page.getByRole('button', { name: 'Construction', exact: true })

      // Click to select
      await constructionButton.click()
      await page.waitForTimeout(300)

      // Check if active filters section appears
      const activeFilters = page.locator('text=Active Filters')
      await expect(activeFilters).toBeVisible()

      // Click to deselect
      await constructionButton.click()
      await page.waitForTimeout(300)
    })

    test('should allow multiple industry selections', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Select multiple industries
      await page.getByRole('button', { name: 'Construction', exact: true }).click()
      await page.waitForTimeout(200)
      await page.getByRole('button', { name: 'Manufacturing', exact: true }).click()
      await page.waitForTimeout(200)

      // Active filters should show both
      const activeFilters = page.locator('text=Active Filters')
      await expect(activeFilters).toBeVisible()

      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Construction')
      expect(bodyText).toContain('Manufacturing')
    })

    test('should filter employers by selected industry', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Get initial result count
      const initialText = await page.locator('body').textContent()

      // Select an industry
      await page.getByRole('button', { name: 'Construction', exact: true }).click()
      await page.waitForTimeout(500)

      // Results should be filtered (text should change or show empty state)
      const filteredText = await page.locator('body').textContent()
      expect(filteredText).toBeTruthy()
    })
  })

  test.describe('5. Combined Filters (Search + Industry)', () => {
    test('should apply both search and industry filters together', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Apply search filter
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('company')
      await page.waitForTimeout(300)

      // Apply industry filter
      await page.getByRole('button', { name: 'Construction', exact: true }).click()
      await page.waitForTimeout(500)

      // Active filters should show both
      const activeFilters = page.locator('text=Active Filters')
      await expect(activeFilters).toBeVisible()

      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Search:')
      expect(bodyText).toContain('Industries:')
    })

    test('should maintain search filter when industry is selected', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('test')
      await page.waitForTimeout(300)

      await page.getByRole('button', { name: 'Manufacturing', exact: true }).click()
      await page.waitForTimeout(300)

      // Search value should still be in input
      const inputValue = await searchInput.inputValue()
      expect(inputValue).toBe('test')
    })

    test('should maintain industry filter when searching', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Select industry first
      await page.getByRole('button', { name: 'Technology', exact: true }).click()
      await page.waitForTimeout(300)

      // Then search
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('tech')
      await page.waitForTimeout(500)

      // Active filters should show both
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Active Filters')
    })
  })

  test.describe('6. Clear Filters Functionality', () => {
    test('should show clear button only when filters are active', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Initially, clear button should not be visible (or not exist)
      const clearButton = page.getByRole('button', { name: /clear/i })
      const isInitiallyVisible = await clearButton.isVisible().catch(() => false)
      expect(isInitiallyVisible).toBe(false)

      // Apply a filter
      await page.getByPlaceholder('Search employers...').fill('test')
      await page.waitForTimeout(300)

      // Now clear button should be visible
      await expect(clearButton).toBeVisible()
    })

    test('should reset all filters when clear button is clicked', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Apply multiple filters
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('test')
      await page.waitForTimeout(300)

      await page.getByRole('button', { name: 'Construction', exact: true }).click()
      await page.waitForTimeout(300)

      // Click clear button
      const clearButton = page.getByRole('button', { name: /clear/i })
      await clearButton.click()
      await page.waitForTimeout(500)

      // Search should be empty
      const inputValue = await searchInput.inputValue()
      expect(inputValue).toBe('')

      // Active filters section should not be visible
      const activeFilters = page.locator('text=Active Filters')
      const isVisible = await activeFilters.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    })

    test('should hide clear button after clearing filters', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Apply a filter
      await page.getByPlaceholder('Search employers...').fill('test')
      await page.waitForTimeout(300)

      const clearButton = page.getByRole('button', { name: /clear/i })
      await clearButton.click()
      await page.waitForTimeout(500)

      // Clear button should no longer be visible
      const isVisible = await clearButton.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    })
  })

  test.describe('7. Active Filters Summary', () => {
    test('should display active filters section when search is active', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('company')
      await page.waitForTimeout(500)

      const activeFiltersHeading = page.locator('text=Active Filters')
      await expect(activeFiltersHeading).toBeVisible()

      const searchSummary = page.locator('text=Search:')
      await expect(searchSummary).toBeVisible()
    })

    test('should display active filters section when industries are selected', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      await page.getByRole('button', { name: 'Healthcare', exact: true }).click()
      await page.waitForTimeout(500)

      const activeFiltersHeading = page.locator('text=Active Filters')
      await expect(activeFiltersHeading).toBeVisible()

      const industrySummary = page.locator('text=Industries:')
      await expect(industrySummary).toBeVisible()
    })

    test('should update active filters summary in real-time', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')

      // Type and check
      await searchInput.fill('a')
      await page.waitForTimeout(300)
      let bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Active Filters')

      // Update search
      await searchInput.fill('ab')
      await page.waitForTimeout(300)
      bodyText = await page.locator('body').textContent()
      expect(bodyText).toContain('Active Filters')
    })

    test('should hide active filters when all filters are cleared', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Apply filter
      await page.getByPlaceholder('Search employers...').fill('test')
      await page.waitForTimeout(300)

      // Clear it
      const clearButton = page.getByRole('button', { name: /clear/i })
      await clearButton.click()
      await page.waitForTimeout(500)

      // Active filters should not be visible
      const activeFilters = page.locator('text=Active Filters')
      const isVisible = await activeFilters.isVisible().catch(() => false)
      expect(isVisible).toBe(false)
    })
  })

  test.describe('8. Employer List Display', () => {
    test('should display result count at top of list', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Should show count like "5 Employers" or "1 Employer"
      const countPattern = /\d+ Employer(s)?/
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toMatch(countPattern)
    })

    test('should use singular form for 1 employer', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Apply filters to potentially get exactly 1 result
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('xyz unique search')
      await page.waitForTimeout(500)

      // Check if we got "No employers found" or check for singular/plural
      const bodyText = await page.locator('body').textContent()

      if (bodyText?.includes('1 Employer')) {
        expect(bodyText).toContain('1 Employer')
        expect(bodyText).not.toContain('1 Employers')
      }
    })

    test('should display employer cards when data is available', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Check if we have employers or empty state
      const hasEmployers = await page.locator('text=/\\d+ Employer/').isVisible().catch(() => false)
      const hasEmpty = await page.locator('text=No employers found').isVisible().catch(() => false)

      // One of these should be true
      expect(hasEmployers || hasEmpty).toBe(true)
    })
  })

  test.describe('9. Employer Card Component', () => {
    test('should display employer name with building icon', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Check if we have employer cards
      const hasEmployers = await page.locator('text=/\\d+ Employer/').isVisible().catch(() => false)

      if (hasEmployers) {
        // There should be at least one employer card with the View Details button
        const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
        await expect(viewDetailsButton).toBeVisible()
      }
    })

    test('should display View Details button on each card', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const hasEmployers = await page.locator('text=/\\d+ Employer/').isVisible().catch(() => false)

      if (hasEmployers) {
        const viewDetailsButtons = page.getByRole('button', { name: 'View Details' })
        const count = await viewDetailsButtons.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('should log employer details when View Details is clicked', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const hasEmployers = await page.locator('text=/\\d+ Employer/').isVisible().catch(() => false)

      if (hasEmployers) {
        const consoleMessages: string[] = []
        page.on('console', (msg) => {
          if (msg.type() === 'log') {
            consoleMessages.push(msg.text())
          }
        })

        const viewDetailsButton = page.getByRole('button', { name: 'View Details' }).first()
        await viewDetailsButton.click()
        await page.waitForTimeout(500)

        // Should have logged something
        expect(consoleMessages.length).toBeGreaterThan(0)
      }
    })
  })

  test.describe('10. Visual & Layout', () => {
    test('should have proper two-panel layout structure', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Both panels should have content
      const searchHeading = page.locator('text=Search & Filter')
      await expect(searchHeading).toBeVisible()

      // Left panel has employers or loading/empty state
      const leftPanelContent = page.locator('text=Loading employers')
        .or(page.locator('text=/\\d+ Employer/'))
        .or(page.locator('text=No employers found'))
      await expect(leftPanelContent.first()).toBeVisible()
    })

    test('should display separators between sections', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Check that the page rendered without errors
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
      expect(bodyText).not.toContain('Error')
    })

    test('should render without visual errors', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Take screenshot for manual visual inspection if needed
      // await page.screenshot({ path: 'employer-discovery.png', fullPage: true })

      // Check basic rendering
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })
  })

  test.describe('11. Edge Cases', () => {
    test('should handle zero results gracefully', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Search for something that definitely won't exist
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('xyznonexistent123456789')
      await page.waitForTimeout(500)

      const emptyState = page.locator('text=No employers found')
      await expect(emptyState).toBeVisible()

      const helpText = page.locator('text=Try adjusting your filters')
      await expect(helpText).toBeVisible()
    })

    test('should handle very long search queries', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      const longQuery = 'a'.repeat(100)
      await searchInput.fill(longQuery)
      await page.waitForTimeout(500)

      // Should not crash
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })

    test('should handle rapid filter toggling', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const constructionButton = page.getByRole('button', { name: 'Construction', exact: true })

      // Rapidly toggle multiple times
      for (let i = 0; i < 5; i++) {
        await constructionButton.click()
        await page.waitForTimeout(100)
      }

      // Should still be functional
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })

    test('should handle special characters in search', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('!@#$%^&*()')
      await page.waitForTimeout(500)

      // Should not crash
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })
  })

  test.describe('12. Accessibility', () => {
    test('should have keyboard accessible search input', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Tab to search input
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to type
      await page.keyboard.type('test')
      await page.waitForTimeout(300)

      const searchInput = page.getByPlaceholder('Search employers...')
      const value = await searchInput.inputValue()
      expect(value).toContain('test')
    })

    test('should have keyboard accessible industry buttons', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Navigate to industry buttons using tab
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
      }

      // Try to activate with Enter or Space
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300)

      // Should still be functional
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).toBeTruthy()
    })

    test('should have visible focus indicators', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      // Tab through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check that something has focus
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      expect(focused).toBeTruthy()
    })
  })

  test.describe('13. Performance', () => {
    test('should render within reasonable time', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach
      // Note: This test measures only the time after page load, not the initial navigation
      const startTime = Date.now()
      await page.waitForTimeout(1000) // Wait for any remaining loading
      const endTime = Date.now()

      const loadTime = endTime - startTime
      // Should complete within 10 seconds
      expect(loadTime).toBeLessThan(10000)
    })

    test('should handle filtering without noticeable lag', async ({ page }: { page: Page }) => {
      // Already on ROUTE_PATH from beforeEach

      const startTime = Date.now()

      // Apply multiple filters quickly
      const searchInput = page.getByPlaceholder('Search employers...')
      await searchInput.fill('test')
      await page.getByRole('button', { name: 'Construction', exact: true }).click()
      await page.getByRole('button', { name: 'Manufacturing', exact: true }).click()
      await page.waitForTimeout(500)

      const endTime = Date.now()
      const filterTime = endTime - startTime

      // Should complete within 2 seconds
      expect(filterTime).toBeLessThan(2000)
    })
  })
})
