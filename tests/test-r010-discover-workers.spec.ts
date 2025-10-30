// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/discover/workers', () => {
  test('navigates and shows workers UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/discover/workers')
    expect(page.url()).toContain('/dashboard/discover/workers')
    const any = page.getByText(/workers|people|talent/i)
    await expect(any).toBeVisible()
  })
})
