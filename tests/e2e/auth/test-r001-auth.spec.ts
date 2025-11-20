// @ts-nocheck
import { expect, type Page, test } from '@playwright/test'

test.describe('Regular • /auth', () => {
  test('renders email input and submit button', async ({ page }: { page: Page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link|sign in/i })).toBeVisible()
  })

  test('shows validation for invalid email', async ({ page }: { page: Page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    // Find input by placeholder or role
    const emailInput = page
      .getByPlaceholder(/your@email|email/i)
      .or(page.getByRole('textbox'))
      .first()
    await emailInput.waitFor({ state: 'visible', timeout: 10000 })
    await emailInput.fill('not-an-email')
    const submitButton = page.getByRole('button', { name: /send magic link|sending/i })
    await submitButton.click()
    // Wait for validation error - check page content
    await page.waitForTimeout(1500)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.toLowerCase()).toMatch(/invalid|valid email|please enter/i)
  })
})
