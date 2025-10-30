// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/experience', () => {
  test('navigates and shows profile experience UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/experience')
    expect(page.url()).toContain('/dashboard/profile/experience')
    const any = page.getByText(/experience|employer|position/i)
    await expect(any).toBeVisible()
  })
})
