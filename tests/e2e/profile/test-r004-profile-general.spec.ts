import { expect, type Page, test } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

test.describe('Regular • /dashboard/profile/general', () => {
  test('navigates and shows profile general UI', async ({ page }: { page: Page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/general', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/dashboard/profile/general')
    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  test('About editor focuses on click and keeps a stable height', async ({
    page,
  }: {
    page: Page
  }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/general', { waitUntil: 'domcontentloaded' })

    const editorContainer = page.locator('.rich-text-editor-container').first()
    await expect(editorContainer).toBeVisible()

    const initialHeight = await editorContainer.evaluate((element) => element.clientHeight)
    await editorContainer.click()
    await page.keyboard.type(' Automated test input.')

    const aboutText = await editorContainer.locator('p').first().textContent()
    expect(aboutText).toContain('Automated test input.')

    const afterHeight = await editorContainer.evaluate((element) => element.clientHeight)
    expect(afterHeight).toBe(initialHeight)
  })
})
