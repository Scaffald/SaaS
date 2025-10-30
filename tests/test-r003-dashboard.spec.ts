// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard', () => {
  test('requires auth (unauthenticated users redirect to /auth)', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard')
    expect(page.url()).toMatch(/\/auth/)
  })

  test('renders dashboard after login', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard')
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })
})
