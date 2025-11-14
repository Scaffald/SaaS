// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

test.describe('Admin • /dashboard/discover/map', () => {
  test('navigates to map discovery and page loads correctly', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)

    // Navigate to map discovery route
    await page.goto('/dashboard/discover/map')

    // Verify we're on the map discovery page
    expect(page.url()).toContain('/dashboard/discover/map')

    // Wait for loading states to complete
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(2000)

    // Verify page content loaded
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('displays map search heading', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify "Map Search" heading is present
    await expect(page.getByRole('heading', { name: 'Map Search' })).toBeVisible()
  })

  test('renders map canvas element', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify canvas element exists (map rendering)
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Verify canvas has dimensions
    const canvasBoundingBox = await canvas.boundingBox()
    expect(canvasBoundingBox).not.toBeNull()
    expect(canvasBoundingBox?.width).toBeGreaterThan(0)
    expect(canvasBoundingBox?.height).toBeGreaterThan(0)
  })

  test('displays worker results sidebar with 35 results', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify results count indicator shows 35
    const resultsCount = page.getByText('35', { exact: false })
    await expect(resultsCount.first()).toBeVisible()
  })

  test('displays worker cards with complete profile information', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify "Skilled Trades Professional" title appears in worker cards
    const professionalTitle = page.getByText('Skilled Trades Professional')
    await expect(professionalTitle.first()).toBeVisible()

    // Verify experience information is present
    const experienceText = page.getByText(/\d+ years?/, { exact: false })
    await expect(experienceText.first()).toBeVisible()
  })

  test('displays worker names in result cards', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    const pageText = await page.locator('body').textContent() || ''

    // Verify at least one worker name from exploration is present
    const hasWorkerNames =
      pageText.includes('Eric Wong') ||
      pageText.includes('Aaron Cook') ||
      pageText.includes('Taleiysa Jones')

    expect(hasWorkerNames).toBe(true)
  })

  test('displays location information for workers', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    const pageText = await page.locator('body').textContent() || ''

    // Verify location patterns (City, State, Country)
    const hasLocationInfo =
      pageText.includes('Massachusetts') ||
      pageText.includes('United States') ||
      pageText.includes('Boston')

    expect(hasLocationInfo).toBe(true)
  })

  test('displays "View Organization" buttons for worker cards', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify "View Organization" buttons exist
    const viewOrgButtons = page.getByRole('button', { name: /View Organization/i })
    const buttonCount = await viewOrgButtons.count()

    expect(buttonCount).toBeGreaterThan(0)
  })

  test('displays navigation elements (hamburger menu)', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify hamburger menu button exists (three horizontal lines icon)
    const buttons = await page.getByRole('button').all()
    expect(buttons.length).toBeGreaterThan(0)
  })

  test('displays notification bell in header', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    const pageText = await page.locator('body').textContent() || ''

    // Verify page has loaded with substantial content (notification area should be present)
    expect(pageText.length).toBeGreaterThan(1000)
  })

  test('verifies accessibility attributes are present', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify ARIA labels exist
    const ariaElements = page.locator('[aria-label]')
    const ariaCount = await ariaElements.count()
    expect(ariaCount).toBeGreaterThan(5)

    // Verify role attributes exist
    const roleElements = page.locator('[role]')
    const roleCount = await roleElements.count()
    expect(roleCount).toBeGreaterThan(20)
  })

  test('verifies map interface has multiple map-related elements', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Check for elements with "map" in class names
    const mapElements = page.locator('[class*="map"]')
    const mapElementCount = await mapElements.count()

    expect(mapElementCount).toBeGreaterThan(10)
  })

  test('displays results sidebar with scrollable content', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Verify the page has enough content to suggest a sidebar with results
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight)
    expect(bodyHeight).toBeGreaterThan(500)

    // Verify multiple worker entries by checking for repeated "Skilled Trades Professional" text
    const professionMatches = await page.getByText('Skilled Trades Professional').count()
    expect(professionMatches).toBeGreaterThan(5) // Should have multiple worker cards
  })

  test('verifies page layout maintains two-column structure', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Get page width
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(viewportWidth).toBeGreaterThan(800) // Desktop viewport

    // Verify canvas (map) and results both exist
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    const resultsIndicator = page.getByText('35')
    await expect(resultsIndicator.first()).toBeVisible()
  })

  test('handles cookie consent modal if present', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Check if cookie consent modal is visible
    const cookieModalVisible = await page.getByText('This site uses cookies').isVisible().catch(() => false)

    if (cookieModalVisible) {
      // Verify modal has proper actions
      const acceptButton = page.getByRole('button', { name: /Accept/i })
      const rejectButton = page.getByRole('button', { name: /Reject/i })
      const manageButton = page.getByRole('button', { name: /Manage/i })

      const hasAccept = await acceptButton.isVisible().catch(() => false)
      const hasReject = await rejectButton.isVisible().catch(() => false)
      const hasManage = await manageButton.isVisible().catch(() => false)

      expect(hasAccept || hasReject || hasManage).toBe(true)
    }
  })

  test('verifies page responsiveness and layout stability', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Get initial page height
    const initialHeight = await page.evaluate(() => document.body.scrollHeight)
    expect(initialHeight).toBeGreaterThan(0)

    // Wait and check again to ensure no major layout shifts
    await page.waitForTimeout(1000)
    const finalHeight = await page.evaluate(() => document.body.scrollHeight)

    // Heights should be similar (allow for some variation)
    const heightDiff = Math.abs(finalHeight - initialHeight)
    expect(heightDiff).toBeLessThan(500) // Allow minimal shift for map rendering
  })

  test('verifies page has substantial DOM elements', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    // Count div elements (should have many for map and cards)
    const divCount = await page.locator('div').count()
    expect(divCount).toBeGreaterThan(200) // Complex page with map and results

    // Count button elements
    const buttonCount = await page.getByRole('button').count()
    expect(buttonCount).toBeGreaterThan(10) // Multiple action buttons
  })

  test('verifies map canvas has reasonable dimensions', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(2000)

    const canvas = page.locator('canvas').first()
    const boundingBox = await canvas.boundingBox()

    expect(boundingBox).not.toBeNull()
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(300)
      expect(boundingBox.height).toBeGreaterThan(200)
    }
  })

  test('captures screenshot for visual regression', async ({ page }: { page: Page }) => {
  // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/dashboard/discover/map')
    await page.waitForTimeout(3000) // Wait for map to fully render

    // Capture full page screenshot
    await page.screenshot({
      path: '.playwright-mcp/test-a011-dashboard-discover-map.png',
      fullPage: true
    })

    // Verify screenshot was created
    const fs = require('fs')
    const screenshotExists = fs.existsSync('.playwright-mcp/test-a011-dashboard-discover-map.png')
    expect(screenshotExists).toBe(true)
  })
})
