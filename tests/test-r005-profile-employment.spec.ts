// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/employment', () => {
  test('navigates and shows profile employment UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/employment')
    expect(page.url()).toContain('/dashboard/profile/employment')
    const any = page.getByText(/employment|job|experience/i)
    await expect(any).toBeVisible()
  })
})
