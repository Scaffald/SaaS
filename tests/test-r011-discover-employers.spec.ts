// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/discover/employers', () => {
  test('navigates and shows employers UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/discover/employers')
    expect(page.url()).toContain('/dashboard/discover/employers')
    const any = page.getByText(/employers|company|organization/i)
    await expect(any).toBeVisible()
  })
})
