// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'

test.describe('Regular • /auth', () => {
  test('renders email input and submit button', async ({ page }: { page: Page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link|sign in/i })).toBeVisible()
  })

  test('shows validation for invalid email', async ({ page }: { page: Page }) => {
    await page.goto('/auth')
    await page.getByPlaceholder(/email/i).fill('not-an-email')
    await page.getByRole('button', { name: /send magic link|sign in/i }).click()
    const anyError = page.getByText(/invalid email|enter a valid email/i)
    await expect(anyError).toBeVisible()
  })
})


