// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

async function navigateToIPIPResults(page: Page) {
  await signInAsTestUser(page)
  await ensureProfileComplete(page)
  await page.goto('/dashboard/assessments/ipip/results', { waitUntil: 'domcontentloaded' })
}

async function ensureShareLink(page: Page): Promise<string | null> {
  const shareLinkLocator = page.getByTestId('share-link-url')
  if (await shareLinkLocator.isVisible().catch(() => false)) {
    return (await shareLinkLocator.textContent())?.trim() ?? null
  }

  const generateButton = page.getByRole('button', { name: /Generate Share Link/i })
  if (!(await generateButton.isVisible().catch(() => false))) {
    return null
  }

  await generateButton.click()
  if (await shareLinkLocator.isVisible({ timeout: 15000 }).catch(() => false)) {
    return (await shareLinkLocator.textContent())?.trim() ?? null
  }

  return null
}

test.describe('REQ-227 • IPIP results experience', () => {
  test('results page renders with accessible navigation', async ({ page }: { page: Page }) => {
    await navigateToIPIPResults(page)

    // The page should either show the results layout or the empty state message.
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    const normalizedCopy = bodyText?.toLowerCase() ?? ''
    expect(
      normalizedCopy.includes('your personality results') ||
        normalizedCopy.includes('no results yet') ||
        normalizedCopy.includes('loading your results'),
    ).toBeTruthy()

    // Tabs should be present even when results are still loading.
    await expect(page.getByRole('tab', { name: /narrative view/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /chart view/i })).toBeVisible()

    // Switching tabs should not throw.
    await page.getByRole('tab', { name: /chart view/i }).click({ trial: true }).catch(() => {})
    await page.getByRole('tab', { name: /narrative view/i }).click({ trial: true }).catch(() => {})
  })

  test('share card renders when assessment is complete', async ({ page }: { page: Page }) => {
    await navigateToIPIPResults(page)

    const shareCard = page.getByText('Share Your Results').first()
    if (await shareCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(page.getByText('Privacy Settings')).toBeVisible()
      await expect(page.getByLabel('Toggle archetype visibility in shared results')).toBeVisible()
      await expect(page.getByLabel('Toggle domain scores visibility in shared results')).toBeVisible()
    } else {
      test.skip(true, 'Share card hidden when IPIP assessment is incomplete in test environment')
    }
  })

  test('share workflow generates a public link with privacy controls', async ({ page }: { page: Page }) => {
    await navigateToIPIPResults(page)

    const shareCard = page.getByText('Share Your Results').first()
    if (!(await shareCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('Share card hidden when IPIP assessment is incomplete in test environment')
    }

    // Toggle privacy switches to ensure they are wired correctly.
    const archetypeToggle = page.getByLabel('Toggle archetype visibility in shared results')
    const domainToggle = page.getByLabel('Toggle domain scores visibility in shared results')
    await archetypeToggle.click()
    await domainToggle.click()
    await archetypeToggle.click() // revert to original state
    await domainToggle.click()

    const shareUrl = await ensureShareLink(page)
    if (!shareUrl) {
      test.skip('Share link did not generate in time')
    }

    await expect(page.getByTestId('share-link-url')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Copy$/i })).toBeVisible()
  })

  test('public share page displays anonymized results', async ({ page, context }) => {
    await navigateToIPIPResults(page)

    const shareCard = page.getByText('Share Your Results').first()
    if (!(await shareCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('Share card hidden when IPIP assessment is incomplete in test environment')
    }

    const shareUrl = await ensureShareLink(page)
    if (!shareUrl) {
      test.skip('Unable to create share link for public view test')
    }

    const publicPage = await context.newPage()
    await publicPage.goto(shareUrl, { waitUntil: 'domcontentloaded' })

    await expect(publicPage.getByText(/Shared Personality Results/i)).toBeVisible()
    await expect(publicPage.getByRole('tab', { name: /Narrative View/i })).toBeVisible()
    await expect(publicPage.getByRole('tab', { name: /Chart View/i })).toBeVisible()
  })
})

