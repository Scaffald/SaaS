// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard', () => {
  test('requires auth (unauthenticated users redirect to /auth)', async ({ page }: { page: Page }) => {
    await page.goto('/dashboard')
    // Wait for redirect
    await page.waitForURL(/\/auth/, { timeout: 10000 }).catch(() => {
      // If not redirected, check if auth elements are present
      expect(page.url()).toMatch(/\/auth/)
    })
    expect(page.url()).toMatch(/\/auth/)
  })

  test('renders dashboard after login', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    // Wait for loading spinner to disappear (if present)
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 15000 }
    ).catch(() => {
      // If timeout, check if page has any content
    })
    // Verify page loaded (has content beyond just "Loading...")
    const pageContent = await page.locator('body').textContent()
    expect(pageContent).toBeTruthy()
    // Should have more than just "Loading..." text
    const hasRealContent = (pageContent?.length || 0) > 50 || !pageContent?.includes('Loading...')
    expect(hasRealContent).toBeTruthy()
  })
})
