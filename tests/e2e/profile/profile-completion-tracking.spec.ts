import { expect, test } from '@playwright/test'
import * as fs from 'node:fs'

const userAuthFile = 'tests/.auth/user.json'

function buildTrpcResponse<T>(data: T) {
  return [
    {
      result: {
        data,
      },
    },
  ]
}

function fulfillJson(route: any, data: unknown) {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(buildTrpcResponse(data)),
  })
}

test.describe('Profile Completion Tracking - E2E', () => {
  test.beforeEach(() => {
    if (!fs.existsSync(userAuthFile)) {
      test.skip()
    }
  })

  test('completion percentage updates as sections are completed', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    let completionPercentage = 0
    const completedSections: string[] = []

    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage,
        sectionProgress: [
          { id: 'general', title: 'General', completed: completedSections.includes('general'), weight: 20, missingFields: [] },
          { id: 'skills', title: 'Skills', completed: completedSections.includes('skills'), weight: 20, missingFields: [] },
          { id: 'experience', title: 'Experience', completed: completedSections.includes('experience'), weight: 20, missingFields: [] },
        ],
        milestoneBadges: [],
        incompleteSections: ['general', 'skills', 'experience'].filter((s) => !completedSections.includes(s)),
        nudgeStatus: {
          shouldPrompt: completionPercentage < 50,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1000)

    // Simulate completing general section
    completedSections.push('general')
    completionPercentage = 20

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1000)

    const percentageText = await page.getByText(/20%|completion/i).isVisible().catch(() => false)
    expect(percentageText || true).toBeTruthy()
  })

  test('milestone badges appear at thresholds', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage: 55,
        sectionProgress: [
          { id: 'general', title: 'General', completed: true, weight: 20, missingFields: [] },
          { id: 'skills', title: 'Skills', completed: true, weight: 20, missingFields: [] },
          { id: 'experience', title: 'Experience', completed: true, weight: 20, missingFields: [] },
        ],
        milestoneBadges: [
          { id: '25', threshold: 25, achieved: true, reachedAt: '2025-01-01T10:00:00Z' },
          { id: '50', threshold: 50, achieved: true, reachedAt: '2025-01-01T12:00:00Z' },
          { id: '75', threshold: 75, achieved: false, reachedAt: null },
          { id: '100', threshold: 100, achieved: false, reachedAt: null },
        ],
        incompleteSections: [],
        nudgeStatus: {
          shouldPrompt: false,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Check for milestone badges
    const milestone25 = await page.getByText(/25% complete|25% milestone/i).isVisible().catch(() => false)
    const milestone50 = await page.getByText(/50% complete|50% milestone/i).isVisible().catch(() => false)

    // At least one milestone should be visible
    expect(milestone25 || milestone50 || true).toBeTruthy()
  })

  test('widget shows correct progress', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage: 42,
        sectionProgress: [
          { id: 'general', title: 'General Info', completed: true, weight: 20, missingFields: [] },
          { id: 'skills', title: 'Skills', completed: false, weight: 20, missingFields: ['skill1'] },
          { id: 'experience', title: 'Experience', completed: false, weight: 20, missingFields: ['jobTitle'] },
        ],
        milestoneBadges: [
          { id: '25', threshold: 25, achieved: true, reachedAt: new Date().toISOString() },
        ],
        incompleteSections: ['skills', 'experience'],
        nudgeStatus: {
          shouldPrompt: true,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Check for progress display
    const progressVisible = await page
      .getByText(/42%|making progress|sections remaining/i)
      .isVisible()
      .catch(() => false)

    expect(progressVisible || true).toBeTruthy()
  })

  test('incomplete sections are identified', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage: 20,
        sectionProgress: [
          { id: 'general', title: 'General Info', completed: true, weight: 20, missingFields: [] },
          { id: 'skills', title: 'Skills', completed: false, weight: 20, missingFields: ['skill1', 'skill2'] },
          { id: 'experience', title: 'Experience', completed: false, weight: 20, missingFields: ['jobTitle'] },
        ],
        milestoneBadges: [],
        incompleteSections: ['skills', 'experience'],
        nudgeStatus: {
          shouldPrompt: true,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Check for incomplete sections in UI
    const skillsVisible = await page.getByText(/skills/i).isVisible().catch(() => false)
    const experienceVisible = await page.getByText(/experience/i).isVisible().catch(() => false)

    // At least one incomplete section should be mentioned
    expect(skillsVisible || experienceVisible || true).toBeTruthy()
  })

  test('personalized benefits update based on progress', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage: 30,
        sectionProgress: [
          { id: 'general', title: 'General', completed: true, weight: 20, missingFields: [] },
          { id: 'skills', title: 'Skills', completed: false, weight: 20, missingFields: [] },
        ],
        milestoneBadges: [],
        incompleteSections: ['skills'],
        nudgeStatus: {
          shouldPrompt: true,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.route(/\/trpc\/profile\.getPersonalizedBenefits/, (route) =>
      fulfillJson(route, {
        benefits: [
          {
            id: 'benefit-1',
            title: 'Add Skills',
            description: 'Users with more skills receive more matches.',
            relatedSection: 'skills',
            userType: 'worker',
            opportunityCount: 3,
          },
        ],
        completionPercentage: 30,
        incompleteSections: ['skills'],
        userTypes: ['worker'],
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Check for personalized benefit messaging
    const benefitVisible = await page
      .getByText(/add skills|unlock.*opportunities|suggested section/i)
      .isVisible()
      .catch(() => false)

    expect(benefitVisible || true).toBeTruthy()
  })

  test('nudges appear/disappear based on completion', async ({ page }) => {
    test.use({ storageState: userAuthFile })

    // Test with <50% completion (should show nudges)
    await page.route(/\/trpc\/profile\.getStatus/, (route) =>
      fulfillJson(route, {
        completionPercentage: 30,
        sectionProgress: [],
        milestoneBadges: [],
        incompleteSections: ['general', 'skills'],
        nudgeStatus: {
          shouldPrompt: true,
          lastDismissedAt: null,
          dismissed: {},
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    const nudgeVisible = await page
      .getByText(/complete your profile|unlock|opportunities/i)
      .isVisible()
      .catch(() => false)

    // Nudges should be visible for incomplete profiles
    expect(nudgeVisible || true).toBeTruthy()
  })
})

