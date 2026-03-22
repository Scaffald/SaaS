import { expect, type Page, test } from '@playwright/test'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

test.describe('Admin • /profile', () => {
  // Test 1: Profile page loads (no index page - shows subsection content)
  test('loads /profile and displays profile content', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Profile route exists and loads
    const url = page.url()
    expect(url).toContain('/profile')

    // Page should have loaded successfully
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })

  // Test 2: General profile subsection
  test('loads and renders /profile/general correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/general', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/general')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    // Check for form elements - flexible selector to handle various form field types
    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for general profile content
    expect(pageContent.toLowerCase()).toMatch(/(name|email|phone|address|bio|profile)/i)
  })

  // Test 3: Employment subsection
  test('loads and renders /profile/employment correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/employment', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/employment')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for employment-related content
    expect(pageContent.toLowerCase()).toMatch(/(employment|availability|travel|salary|location)/i)
  })

  // Test 4: Education subsection
  test('loads and renders /profile/education correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/education', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/education')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for education-related content
    expect(pageContent.toLowerCase()).toMatch(/(education|university|degree|school)/i)
  })

  // Test 5: Skills subsection
  test('loads and renders /profile/skills correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/skills', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/skills')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for skills-related content
    expect(pageContent.toLowerCase()).toMatch(/(skill|industry|search)/i)
  })

  // Test 6: Certifications subsection
  test('loads and renders /profile/certifications correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/certifications', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/certifications')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for certification-related content
    expect(pageContent.toLowerCase()).toMatch(/(certification|certificate|license|credential)/i)
  })

  // Test 7: Experience subsection
  test('loads and renders /profile/experience correctly', async ({
    page,
  }: {
    page: Page
  }) => {
    // Authentication handled by storage state (tests/.auth/admin.json)
    await page.goto('/profile/experience', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('/profile/experience')

    await page
      .waitForFunction(() => !document.body.textContent?.includes('Loading...'), { timeout: 10000 })
      .catch(() => {})
    await page.waitForTimeout(1000)

    const pageContent = (await page.locator('body').textContent()) || ''
    expect(pageContent.length).toBeGreaterThan(0)

    // Check for experience-related content
    expect(pageContent.toLowerCase()).toMatch(/(experience|work|job|company|position)/i)
  })
})
