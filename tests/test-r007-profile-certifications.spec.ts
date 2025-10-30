// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/certifications', () => {
  test('navigates and shows profile certifications UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/certifications')
    expect(page.url()).toContain('/dashboard/profile/certifications')
    const any = page.getByText(/certification|license|credential/i)
    await expect(any).toBeVisible()
  })
})
