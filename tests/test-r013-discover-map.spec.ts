// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/discover/map', () => {
  test('navigates and shows map UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/discover/map')
    expect(page.url()).toContain('/dashboard/discover/map')
    const any = page.getByText(/map|location|nearby/i)
    await expect(any).toBeVisible()
  })
})
