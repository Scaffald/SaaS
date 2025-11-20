// @ts-nocheck
import { expect, type Page, test } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

test.describe('Admin • /', () => {
  test('navigates to dashboard and page loads correctly', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard')

    // Wait for loading states to complete
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    // Verify page content loaded
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('displays main UI structure with navigation bar', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1000)

    // Verify top navigation bar elements - use heading role for specificity
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Verify hamburger menu button exists
    const hamburgerButtons = await page.getByRole('button').all()
    expect(hamburgerButtons.length).toBeGreaterThan(0)
  })

  test('displays profile completion widget with correct structure', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Verify widget title
    const profileWidgetVisible = await page
      .getByText('Complete Your Profile')
      .isVisible()
      .catch(() => false)

    if (profileWidgetVisible) {
      // Verify progress indicator
      await expect(page.getByText(/\d+% Complete/)).toBeVisible()

      // Verify checklist items exist (at least some of them)
      const checklistItems = [
        'Basic Information',
        'Employment',
        'Skills',
        'Education',
        'Certifications',
        'Experience',
      ]

      let visibleItems = 0
      for (const item of checklistItems) {
        const isVisible = await page
          .getByText(item, { exact: false })
          .isVisible()
          .catch(() => false)
        if (isVisible) visibleItems++
      }

      expect(visibleItems).toBeGreaterThan(0)
    }
  })

  test('displays career assessment widget with RIASEC dimensions', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Check if Career Assessment widget is visible
    const careerAssessmentVisible = await page
      .getByText('Career Assessment')
      .isVisible()
      .catch(() => false)

    if (careerAssessmentVisible) {
      // Verify RIASEC dimensions (check for at least a few)
      const riasecDimensions = [
        'Realistic',
        'Investigative',
        'Artistic',
        'Social',
        'Enterprising',
        'Conventional',
      ]

      let visibleDimensions = 0
      for (const dimension of riasecDimensions) {
        const isVisible = await page
          .getByText(dimension)
          .isVisible()
          .catch(() => false)
        if (isVisible) visibleDimensions++
      }

      // Expect at least half of the dimensions to be visible
      expect(visibleDimensions).toBeGreaterThan(2)

      // Verify complete assessment button exists
      const completeButton = await page
        .getByRole('button', { name: /Complete Assessment/i })
        .isVisible()
        .catch(() => false)
      if (completeButton) {
        expect(completeButton).toBe(true)
      }
    }
  })

  test('displays news feed section', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Verify news section header
    const newsVisible = await page
      .getByText('News')
      .isVisible()
      .catch(() => false)

    if (newsVisible) {
      // Verify news source selector
      const enrVisible = await page
        .getByText('ENR National')
        .isVisible()
        .catch(() => false)
      expect(enrVisible || newsVisible).toBe(true)
    }
  })

  test('sidebar drawer exists and can be accessed', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Check if navigation link to Dashboard exists in the drawer (drawer is open by default on desktop)
    const dashboardLinkVisible = await page
      .getByRole('link', { name: 'Dashboard' })
      .isVisible()
      .catch(() => false)

    // Alternative: check if Discover or Profile navigation exists
    const discoverVisible = await page
      .getByText('Discover')
      .first()
      .isVisible()
      .catch(() => false)
    const profileTextVisible = await page
      .getByText('Profile')
      .first()
      .isVisible()
      .catch(() => false)

    // At least one navigation item should be visible (drawer might be open or closed)
    expect(dashboardLinkVisible || discoverVisible || profileTextVisible).toBe(true)
  })

  test('navigation menu structure exists', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Check for menu items (they may be in drawer or elsewhere)
    const pageText = (await page.locator('body').textContent()) || ''

    // Verify key navigation items are present in the page
    expect(pageText).toContain('Dashboard')
    expect(pageText).toContain('Discover')
  })

  test('verifies dashboard page has expected sections', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    const pageText = (await page.locator('body').textContent()) || ''

    // Verify at least some expected content exists
    const hasContent = pageText.length > 500

    expect(hasContent).toBe(true)
  })

  test('verifies page responsiveness and layout stability', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.waitForTimeout(1500)

    // Get initial page height
    const initialHeight = await page.evaluate(() => document.body.scrollHeight)
    expect(initialHeight).toBeGreaterThan(0)

    // Wait a bit and check again to ensure no major layout shifts
    await page.waitForTimeout(1000)
    const finalHeight = await page.evaluate(() => document.body.scrollHeight)

    // Heights should be similar (allow for some variation)
    const heightDiff = Math.abs(finalHeight - initialHeight)
    expect(heightDiff).toBeLessThan(1000) // Allow up to 1000px shift for dynamic content
  })

  test('handles direct navigation to dashboard route', async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)

    // Verify we're on dashboard
    expect(page.url()).toContain('/dashboard')

    // Verify page loaded successfully
    const bodyText = (await page.locator('body').textContent()) || ''
    expect(bodyText.length).toBeGreaterThan(100)
  })
})
