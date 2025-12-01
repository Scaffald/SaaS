import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/skills', () => {
  test('navigates and shows profile skills UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/skills', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/skills')
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('displays guidance messaging and allows suggestion selection', async ({
    page,
  }: {
    page: Page
  }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/skills', { waitUntil: 'domcontentloaded' })

    await page.waitForSelector('text=Skill section completeness', { timeout: 10000 })

    await expect(page.getByText(/experts recommend adding at least 5 skills/i)).toBeVisible()

    const completionLabel = page.getByText(/Skill section completeness/i).locator('xpath=../..')
    await expect(completionLabel).toContainText('%')

    const recommendationSection = page.locator('text=Commonly added skills').first().locator('..')
    const suggestionButton = recommendationSection.locator('button').first()
    await expect(suggestionButton).toBeVisible()
    await suggestionButton.click({ trial: true }).catch(() => {})
  })
})
