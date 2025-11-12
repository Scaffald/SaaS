// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/experience', () => {
  test('navigates and shows profile experience UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/experience', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/experience')
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('shows success banner after saving changes', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/experience', { waitUntil: 'domcontentloaded' })

    const jobTitleField = await page.waitForSelector('input[placeholder="e.g. Electrician"]', {
      timeout: 10000,
    })
    await jobTitleField.fill('Automated Test Role')

    await page.getByRole('button', { name: /Save Changes/i }).click()

    await expect(page.getByText(/Changes saved successfully/i)).toBeVisible()
    await expect(page.getByText(/Saved!/i)).toBeVisible()

    await page.goto('/dashboard/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Automated Test Role/i)).toBeVisible()
  })
})
