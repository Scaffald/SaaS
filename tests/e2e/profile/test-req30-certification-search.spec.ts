// @ts-nocheck
import { test, expect } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

test.describe('REQ-30 • Certification Search & Immediate Add', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsTestUser(page)
    await ensureProfileComplete(page)
    await page.goto('/dashboard/profile/certifications', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=Certifications & Credentials', { timeout: 15000 })
  })

  test('groups multi-level results and adds certifications with highlight + toast', async ({ page }) => {
    const searchInput = page.getByTestId('cert-search-input')
    await searchInput.fill('OSHA')

    const resultsPanel = page.getByTestId('cert-search-results')
    await expect(resultsPanel).toBeVisible()
    await expect(page.getByTestId('cert-search-section-depth0')).toBeVisible()
    await expect(page.getByTestId('cert-search-section-depth1')).toBeVisible()
    await expect(page.getByTestId('cert-search-section-depth2')).toBeVisible()

    const specificCards = page.getByTestId('cert-search-card-2')
    const availableCount = await specificCards.count()
    expect(availableCount).toBeGreaterThan(0)

    const targetCard = specificCards.first()
    const cardTitle = (await targetCard.locator('span').first().innerText()).trim()

    await targetCard.click()

    await expect(searchInput).toHaveValue('OSHA')
    await expect(page.getByTestId('cert-search-card-2').filter({ hasText: cardTitle })).toHaveCount(0)

    const toastMessage = page.getByText(new RegExp(`${escapeRegExp(cardTitle)} added successfully`, 'i'))
    await expect(toastMessage).toBeVisible()

    const highlightBadge = page.locator('text=✓ Added to profile').first()
    await expect(highlightBadge).toBeVisible()

    const rightPanelCard = page.getByRole('button', { name: new RegExp(`^${escapeRegExp(cardTitle)}`) }).first()
    await expect(rightPanelCard).toBeVisible()

    // Clean up by removing the certification so the test can run repeatedly
    const removeButton = rightPanelCard.locator('button:has-text("Remove")')
    if (await removeButton.count()) {
      await removeButton.click()
      await expect(page.locator('text=Removed from profile').first()).toBeVisible()
    }
  })
})

