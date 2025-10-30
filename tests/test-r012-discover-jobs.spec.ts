// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/discover/jobs', () => {
  test('navigates and shows jobs UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/discover/jobs')
    expect(page.url()).toContain('/dashboard/discover/jobs')
    const any = page.getByText(/jobs|positions|openings/i)
    await expect(any).toBeVisible()
  })
})
