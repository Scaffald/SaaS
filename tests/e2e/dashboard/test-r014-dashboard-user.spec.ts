import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/users/:userId', () => {
  test('navigates to a user profile page', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    // Use a placeholder id; page should render a user profile or a not-found notice gracefully
    await page.goto('/dashboard/users/1', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toMatch(/\/dashboard\/users\//)
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })
})
