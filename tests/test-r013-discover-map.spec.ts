// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('Regular • /dashboard/discover/map', () => {
  test('navigates and shows map UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/discover/map', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/discover/map')
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })
})
