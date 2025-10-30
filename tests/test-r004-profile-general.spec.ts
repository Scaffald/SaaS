// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/general', () => {
  test('navigates and shows profile general UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/general')
    expect(page.url()).toContain('/dashboard/profile/general')
    // Try common markers
    const any = page.getByText(/general|profile/i)
    await expect(any).toBeVisible()
  })
})
