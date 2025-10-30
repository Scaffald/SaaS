// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/skills', () => {
  test('navigates and shows profile skills UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/skills')
    expect(page.url()).toContain('/dashboard/profile/skills')
    const any = page.getByText(/skills|add skill|proficiency/i)
    await expect(any).toBeVisible()
  })
})
