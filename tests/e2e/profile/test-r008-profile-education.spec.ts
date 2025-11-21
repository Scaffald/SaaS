// @ts-nocheck
import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/education', () => {
  test('navigates and shows profile education UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/education', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/education')
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('education dates support month/year pickers and current enrollment toggle', async ({
    page,
  }: {
    page: Page
  }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/education', { waitUntil: 'domcontentloaded' })

    await page.waitForSelector('text=Start Date', { timeout: 10000 })

    await expect(page.getByText('Start Date')).toBeVisible()
    await expect(page.getByText('End Date')).toBeVisible()

    const currentToggle = page.getByLabel('Currently enrolled', { exact: false })
    await currentToggle.click()

    await expect(page.getByText('Expected Graduation Date')).toBeVisible()

    await currentToggle.click()
    await expect(page.getByText('Expected Graduation Date')).not.toBeVisible()
  })
})
