// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/users/:userId', () => {
  test('navigates to a user profile page', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    // Use a placeholder id; page should render a user profile or a not-found notice gracefully
    await page.goto('/dashboard/users/1')
    expect(page.url()).toMatch(/\/dashboard\/users\//)
    // Generic content check
    const any = page.getByText(/user|profile|details/i)
    await expect(any).toBeVisible()
  })
})
