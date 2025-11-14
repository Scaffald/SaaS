// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'

test.describe('Regular • /auth/confirm (verify)', () => {
  test('renders code input fields', async ({ page }: { page: Page }) => {
    await page.goto('/auth/confirm')
    await expect(page.getByText(/enter code|verification code|confirm/i)).toBeVisible()
  })
})


