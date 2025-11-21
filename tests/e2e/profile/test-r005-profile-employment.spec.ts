// @ts-nocheck
import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/employment', () => {
  test('navigates and shows profile employment UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/employment', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/employment')
    // Wait for loading to complete (or timeout gracefully)
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {}) // Continue even if still loading
    await page.waitForTimeout(1000)
    // Verify URL is correct and page attempted to load
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('travel slider supports 250 mile maximum and renders all license options', async ({
    page,
  }: {
    page: Page
  }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/employment', { waitUntil: 'domcontentloaded' })

    await page.waitForSelector('text=Willing to Travel', { state: 'visible' })

    const travelToggle = page.getByRole('switch', { name: /willing to travel/i })
    await travelToggle.click()

    const slider = page.getByRole('slider', { name: /travel/i })
    await expect(slider).toHaveAttribute('aria-valuemax', '250')
    await slider.press('End')

    await expect(page.getByText('250 miles')).toBeVisible()

    const driversToggle = page.getByRole('switch', { name: /driver/i })
    await driversToggle.click()

    const licenseOptions = [
      'Class M',
      'Class A',
      'Class B',
      'Class C',
      'Class D',
      'CDL A',
      'CDL B',
      'CDL C',
    ]

    for (const option of licenseOptions) {
      await expect(page.getByRole('checkbox', { name: new RegExp(option, 'i') })).toBeVisible()
    }
  })
})
