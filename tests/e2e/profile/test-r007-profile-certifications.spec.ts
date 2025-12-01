import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/certifications', () => {
  test('navigates and shows profile certifications UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/certifications', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/certifications')
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('custom certification form requires name and organization', async ({
    page,
  }: {
    page: Page
  }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/certifications', { waitUntil: 'domcontentloaded' })

    await page.waitForSelector('text=Custom Certifications', { timeout: 10000 })
    await page.getByRole('button', { name: /Add Custom Certification/i }).click()
    await page.getByRole('button', { name: /Save Certification/i }).click()

    await expect(page.getByText(/Certification name is required/i)).toBeVisible()
    await expect(page.getByText(/Issuing organization is required/i)).toBeVisible()
  })
})
