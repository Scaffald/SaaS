// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/education', () => {
  test('navigates and shows profile education UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/education')
    expect(page.url()).toContain('/dashboard/profile/education')
    const any = page.getByText(/education|school|degree/i)
    await expect(any).toBeVisible()
  })
})
