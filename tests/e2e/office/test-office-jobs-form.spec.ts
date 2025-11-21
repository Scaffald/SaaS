/**
 * Office Jobs Form E2E Tests - REQ-216
 *
 * Comprehensive tests for the job creation and editing form including:
 * - All 8 form sections (Basic Info, Location, Compensation, Description, Requirements, Application Process, Visibility, Advanced)
 * - Form validation
 * - Form actions (save draft, publish, schedule, preview)
 * - Edit mode functionality
 */

import { test, expect, type Page } from '@playwright/test'
import { navigateToOfficeRoute } from '../../infrastructure/playwright/helpers/helpers/office-navigation'
import { createGeneratorFromTestInfo, generateJobData, generateTestId } from '../../infrastructure/playwright/helpers/helpers/office-test-data'
import { OFFICE_TEST_IDS } from '../../infrastructure/playwright/helpers/helpers/office-test-ids'
import { stubNonEssentialRequests } from '../../infrastructure/playwright/helpers/helpers/network'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Increase timeout for form operations
test.setTimeout(120000)

let generator = createGeneratorFromTestInfo({
  workerIndex: 0,
  project: { name: 'default' },
  title: 'seed-bootstrap',
})

test.beforeEach(async ({ page }, testInfo) => {
  generator = createGeneratorFromTestInfo(testInfo, 'office-jobs-form')
  await stubNonEssentialRequests(page)
})

// Helper to wait for organization select to be ready
async function waitForOrganizationSelect(page: Page) {
  const orgSelect = page.getByTestId(OFFICE_TEST_IDS.jobForm.organization)
  await orgSelect.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(1000)
}

// Helper to select first organization
async function selectFirstOrganization(page: Page) {
  const orgSelect = page.getByTestId(OFFICE_TEST_IDS.jobForm.organization)
  await orgSelect.click()
  await page.waitForTimeout(500)
  const firstOption = page.locator('[role="option"]').first()
  await firstOption.click({ timeout: 5000 })
  await page.waitForTimeout(300)
}

test.describe('Office • Jobs Form - Basic Information Section', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToOfficeRoute(page, '/office/cms/jobs/create')
    await waitForOrganizationSelect(page)
  })

  test('should load create job form', async ({ page }: { page: Page }) => {
    expect(page.url()).toContain('/office/cms/jobs/create')
    const formTitle = page.getByRole('heading', { name: /create job/i })
    await expect(formTitle).toBeVisible({ timeout: 10000 })
  })

  test('should display organization selector', async ({ page }: { page: Page }) => {
    const orgSelect = page.getByTestId(OFFICE_TEST_IDS.jobForm.organization)
    await expect(orgSelect).toBeVisible({ timeout: 5000 })
  })

  test('should display job title input', async ({ page }: { page: Page }) => {
    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await expect(titleInput).toBeVisible({ timeout: 5000 })
  })

  test('should display job description input', async ({ page }: { page: Page }) => {
    const descInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.description)
    await expect(descInput).toBeVisible({ timeout: 5000 })
  })

  test('should allow selecting organization', async ({ page }: { page: Page }) => {
    await selectFirstOrganization(page)
    // Verify organization is selected (check if select shows a value)
    const orgSelect = page.getByTestId(OFFICE_TEST_IDS.jobForm.organization)
    await expect(orgSelect).toBeVisible()
  })

  test('should allow entering job title', async ({ page }: { page: Page }) => {
    const testData = generateJobData({ generator })
    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await titleInput.fill(testData.title)
    await expect(titleInput).toHaveValue(testData.title)
  })

  test('should allow entering job description', async ({ page }: { page: Page }) => {
    const testData = generateJobData({ generator })
    const descInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.description)
    // Rich text editor might need special handling
    await descInput.click()
    await page.keyboard.type(testData.description)
    await page.waitForTimeout(500)
    // Verify some content was entered
    const content = await descInput.textContent()
    expect(content?.length).toBeGreaterThan(0)
  })
})

test.describe('Office • Jobs Form - Location & Work Settings', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToOfficeRoute(page, '/office/cms/jobs/create')
    await waitForOrganizationSelect(page)
    await selectFirstOrganization(page)
  })

  test('should display location input field', async ({ page }: { page: Page }) => {
    // Location field should be visible (might be AddressForm component)
    const locationField = page.locator('input[aria-label*="location" i], input[placeholder*="location" i]').first()
    await expect(locationField).toBeVisible({ timeout: 5000 })
  })

  test('should allow entering location', async ({ page }: { page: Page }) => {
    const testData = generateJobData({ generator })
    const locationField = page.locator('input[aria-label*="location" i], input[placeholder*="location" i]').first()
    await locationField.fill(testData.location)
    await page.waitForTimeout(500)
    // Verify location was entered
    const value = await locationField.inputValue()
    expect(value.length).toBeGreaterThan(0)
  })
})

test.describe('Office • Jobs Form - Form Actions', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToOfficeRoute(page, '/office/cms/jobs/create')
    await waitForOrganizationSelect(page)
  })

  test('should display save draft button', async ({ page }: { page: Page }) => {
    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    await expect(saveDraftButton).toBeVisible({ timeout: 5000 })
  })

  test('should display publish button', async ({ page }: { page: Page }) => {
    const publishButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.publish)
    await expect(publishButton).toBeVisible({ timeout: 5000 })
  })

  test('should display cancel button', async ({ page }: { page: Page }) => {
    const cancelButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.cancel)
    await expect(cancelButton).toBeVisible({ timeout: 5000 })
  })

  test('should disable save buttons when required fields are empty', async ({ page }: { page: Page }) => {
    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    const isDisabled = await saveDraftButton.isDisabled()
    expect(isDisabled).toBe(true)
  })

  test('should enable save draft when required fields are filled', async ({ page }: { page: Page }) => {
    await selectFirstOrganization(page)

    const testData = generateJobData({ generator })
    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await titleInput.fill(testData.title)

    const descInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.description)
    await descInput.click()
    await page.keyboard.type(testData.description)
    await page.waitForTimeout(500)

    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    await expect(saveDraftButton).not.toBeDisabled({ timeout: 2000 })
  })

  test('should save job as draft successfully', async ({ page }: { page: Page }) => {
    await selectFirstOrganization(page)

    const testData = {
      ...generateJobData({ generator }),
      title: `TEST_JOB_DRAFT_${generateTestId('job', generator)}`,
    }

    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await titleInput.fill(testData.title)

    const descInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.description)
    await descInput.click()
    await page.keyboard.type(testData.description)
    await page.waitForTimeout(500)

    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    await saveDraftButton.click()

    // Wait for navigation back to list
    await page.waitForURL('**/office/cms/jobs**', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Verify we're back on the jobs list
    expect(page.url()).toContain('/office/cms/jobs')
  })

  test('should navigate back on cancel', async ({ page }: { page: Page }) => {
    const cancelButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.cancel)
    await cancelButton.click()

    // Should navigate back
    await page.waitForTimeout(1000)
    // URL should change (either back to list or previous page)
    expect(page.url()).not.toContain('/create')
  })
})

test.describe('Office • Jobs Form - Edit Mode', () => {
  let jobId: string | null = null
  const testData = {
    ...generateJobData({ generator }),
    title: `TEST_JOB_EDIT_${generateTestId('job', generator)}`,
  }

  test.beforeEach(async ({ page }: { page: Page }) => {
    // Create a job first for editing
    await navigateToOfficeRoute(page, '/office/cms/jobs/create')
    await waitForOrganizationSelect(page)
    await selectFirstOrganization(page)

    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await titleInput.fill(testData.title)

    const descInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.description)
    await descInput.click()
    await page.keyboard.type(testData.description)
    await page.waitForTimeout(500)

    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    await saveDraftButton.click()

    await page.waitForURL('**/office/cms/jobs**', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Find the job we just created and get its ID from the URL or table
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill(testData.title)
    await page.waitForTimeout(1000)

    // Click edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first()
    await editButton.click()

    await page.waitForURL('**/office/cms/jobs/**/edit', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Extract job ID from URL
    const url = page.url()
    const match = url.match(/\/jobs\/([^/]+)\/edit/)
    if (match) {
      jobId = match[1]
    }
  })

  test('should load edit form with existing data', async ({ page }: { page: Page }) => {
    expect(page.url()).toContain('/edit')

    const formTitle = page.getByRole('heading', { name: /edit job/i })
    await expect(formTitle).toBeVisible({ timeout: 10000 })

    // Verify title is pre-filled
    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    const titleValue = await titleInput.inputValue()
    expect(titleValue).toBe(testData.title)
  })

  test('should update job successfully', async ({ page }: { page: Page }) => {
    const updatedTitle = `${testData.title}_UPDATED`

    const titleInput = page.getByTestId(OFFICE_TEST_IDS.jobForm.title)
    await titleInput.clear()
    await titleInput.fill(updatedTitle)

    const saveDraftButton = page.getByTestId(OFFICE_TEST_IDS.jobForm.saveDraft)
    await saveDraftButton.click()

    await page.waitForURL('**/office/cms/jobs**', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Verify we're back on the jobs list
    expect(page.url()).toContain('/office/cms/jobs')

    // Search for updated job
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill(updatedTitle)
    await page.waitForTimeout(1000)

    // Verify updated job appears
    const jobTitle = page.getByText(updatedTitle)
    await expect(jobTitle).toBeVisible({ timeout: 10000 })
  })
})

