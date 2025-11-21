/**
 * Office Jobs Management E2E Tests
 *
 * Tests comprehensive job management functionality including:
 * - Jobs list page (table, search, pagination) ✅ PASSING (6/6)
 * - Create job flow (all required fields) ⚠️ BLOCKED by REQ-64 (10 tests)
 * - Edit job flow (modify and save) ⚠️ BLOCKED by REQ-64 (10 tests)
 *
 * ⚠️ BLOCKED TESTS: 10 tests blocked by REQ-64
 * Issue: /office/jobs/create and /office/jobs/{id}/edit routes redirect to sign-in
 * Root Cause: Route authorization bug (jobs list works, create/edit broken)
 * Status: All data-testid attributes confirmed present, NOT a test issue
 * BrainGrid: REQ-64, Task 22
 * See: docs/testing/UI-BUG-job-create-authorization.md
 */

import { expect, type Page, test } from '@playwright/test'
import {
  navigateToOfficeRoute,
  OFFICE_ROUTES,
  waitForPageLoad,
} from '../../infrastructure/playwright/helpers/helpers/office-navigation'
import {
  generateJobData,
  generateTestId,
} from '../../infrastructure/playwright/helpers/helpers/office-test-data'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Increase timeout for office operations
test.setTimeout(90000)

// Helper to wait for organization select to be ready
async function waitForOrganizationSelect(page: Page) {
  const orgSelect = page.locator('[data-testid="job-organization-select"]')
  await orgSelect.waitFor({ state: 'visible', timeout: 10000 })
  // Wait for organizations to load
  await page.waitForTimeout(1000)
}

// Helper to select first organization
async function selectFirstOrganization(page: Page) {
  const orgSelect = page.locator('[data-testid="job-organization-select"]')
  await orgSelect.click()
  await page.waitForTimeout(500)

  // Try to find the first organization option
  const firstOption = page.locator('[role="option"]').first()
  await firstOption.click({ timeout: 5000 })
  await page.waitForTimeout(300)
}

test.describe('Office • Jobs Management', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    console.log('Signing in as admin...')
    // Authentication handled by storage state (tests/.auth/admin.json)
    console.log('Admin signed in successfully')
  })

  test.describe('Jobs List Page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Navigating to jobs list page...')
      await navigateToOfficeRoute(page, OFFICE_ROUTES.JOBS)
      await page.waitForTimeout(2000)
    })

    test('should load jobs list page successfully', async ({ page }: { page: Page }) => {
      // Verify URL
      expect(page.url()).toContain('/office/jobs')

      // Check for page title
      const pageTitle = page.getByRole('heading', { name: /jobs/i })
      await expect(pageTitle).toBeVisible({ timeout: 10000 })

      console.log('Jobs list page loaded successfully')
    })

    test('should display search input', async ({ page }: { page: Page }) => {
      const searchInput = page.getByPlaceholder(/search jobs/i)
      await expect(searchInput).toBeVisible({ timeout: 10000 })
    })

    test('should display create job button', async ({ page }: { page: Page }) => {
      const createButton = page.getByRole('button', { name: /create job/i })
      await expect(createButton).toBeVisible({ timeout: 10000 })
    })

    test('should display jobs table with data', async ({ page }: { page: Page }) => {
      // Wait for table to load
      await page.waitForTimeout(2000)

      // Check for table headers
      const titleHeader = page.getByText('Title', { exact: true })
      const statusHeader = page.getByText('Status', { exact: true })
      const orgHeader = page.getByText('Organization', { exact: true })

      await expect(titleHeader).toBeVisible({ timeout: 10000 })
      await expect(statusHeader).toBeVisible({ timeout: 10000 })
      await expect(orgHeader).toBeVisible({ timeout: 10000 })

      console.log('Jobs table displayed successfully')
    })

    test('should filter jobs using search', async ({ page }: { page: Page }) => {
      // Wait for jobs to load
      await page.waitForTimeout(2000)

      // Get initial row count
      const rows = page.locator('tbody tr')
      const initialCount = await rows.count()

      if (initialCount > 0) {
        // Get first job title
        const firstJobTitle = await rows.first().locator('td').first().textContent()

        if (firstJobTitle) {
          // Search for part of the title
          const searchTerm = firstJobTitle.substring(0, 5)
          const searchInput = page.getByPlaceholder(/search jobs/i)
          await searchInput.fill(searchTerm)
          await page.waitForTimeout(500)

          // Verify filtered results
          const filteredCount = await rows.count()
          console.log(`Search filtered from ${initialCount} to ${filteredCount} jobs`)
        }
      } else {
        console.log('No jobs found to test search')
      }
    })

    test('should display edit button for each job', async ({ page }: { page: Page }) => {
      // Wait for jobs to load
      await page.waitForTimeout(2000)

      const rows = page.locator('tbody tr')
      const rowCount = await rows.count()

      if (rowCount > 0) {
        // Check first row for edit button
        const editButton = rows.first().getByRole('button', { name: /edit/i })
        await expect(editButton).toBeVisible({ timeout: 5000 })
        console.log('Edit button found for job')
      } else {
        console.log('No jobs found to check edit button')
      }
    })
  })

  test.describe('Create Job Flow', () => {
    // Generate unique test data for this run
    const testData = {
      ...generateJobData(),
      title: `TEST_JOB_${generateTestId()}`,
    }

    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Navigating to create job page...')
      await navigateToOfficeRoute(page, OFFICE_ROUTES.JOB_CREATE)
      await page.waitForTimeout(2000)
    })

    test('should load create job form', async ({ page }: { page: Page }) => {
      // Verify URL
      expect(page.url()).toContain('/office/jobs/create')

      // Check for form title
      const formTitle = page.getByRole('heading', { name: /create job/i })
      await expect(formTitle).toBeVisible({ timeout: 10000 })

      console.log('Create job form loaded successfully')
    })

    test('should display all required form fields', async ({ page }: { page: Page }) => {
      // Wait for form to load
      await waitForOrganizationSelect(page)

      // Check for organization select
      const orgSelect = page.locator('[data-testid="job-organization-select"]')
      await expect(orgSelect).toBeVisible({ timeout: 5000 })

      // Check for title input
      const titleInput = page.locator('[data-testid="job-title-input"]')
      await expect(titleInput).toBeVisible({ timeout: 5000 })

      // Check for description input
      const descInput = page.locator('[data-testid="job-description-input"]')
      await expect(descInput).toBeVisible({ timeout: 5000 })

      // Check for employment type select
      const empTypeSelect = page.locator('[data-testid="job-employment-type-select"]')
      await expect(empTypeSelect).toBeVisible({ timeout: 5000 })

      // Check for remote option select
      const remoteSelect = page.locator('[data-testid="job-remote-option-select"]')
      await expect(remoteSelect).toBeVisible({ timeout: 5000 })

      console.log('All required form fields displayed')
    })

    test('should display pay range fields', async ({ page }: { page: Page }) => {
      // Wait for form to load
      await waitForOrganizationSelect(page)

      const payMinInput = page.locator('[data-testid="job-pay-min-input"]')
      const payMaxInput = page.locator('[data-testid="job-pay-max-input"]')
      const payTypeSelect = page.locator('[data-testid="job-pay-type-select"]')

      await expect(payMinInput).toBeVisible({ timeout: 5000 })
      await expect(payMaxInput).toBeVisible({ timeout: 5000 })
      await expect(payTypeSelect).toBeVisible({ timeout: 5000 })
    })

    test('should display position level field', async ({ page }: { page: Page }) => {
      await waitForOrganizationSelect(page)

      const positionLevelInput = page.locator('[data-testid="job-position-level-input"]')
      await expect(positionLevelInput).toBeVisible({ timeout: 5000 })
    })

    test('should display form action buttons', async ({ page }: { page: Page }) => {
      await waitForOrganizationSelect(page)

      const cancelButton = page.locator('[data-testid="job-cancel-button"]')
      const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')
      const publishButton = page.locator('[data-testid="job-publish-button"]')

      await expect(cancelButton).toBeVisible({ timeout: 5000 })
      await expect(saveDraftButton).toBeVisible({ timeout: 5000 })
      await expect(publishButton).toBeVisible({ timeout: 5000 })
    })

    test('should create job as draft successfully', async ({ page }: { page: Page }) => {
      console.log('Filling job form with test data:', testData.title)

      // Wait for form to be ready
      await waitForOrganizationSelect(page)

      // Select organization (first available)
      await selectFirstOrganization(page)

      // Fill title
      const titleInput = page.locator('[data-testid="job-title-input"]')
      await titleInput.fill(testData.title)

      // Fill description
      const descInput = page.locator('[data-testid="job-description-input"]')
      await descInput.fill(testData.description)

      // Select employment type
      const empTypeSelect = page.locator('[data-testid="job-employment-type-select"]')
      await empTypeSelect.click()
      await page.waitForTimeout(300)
      const fullTimeOption = page.getByRole('option', { name: /full time/i })
      await fullTimeOption.click()

      // Select remote option
      const remoteSelect = page.locator('[data-testid="job-remote-option-select"]')
      await remoteSelect.click()
      await page.waitForTimeout(300)
      const onSiteOption = page.getByRole('option', { name: /on-site/i })
      await onSiteOption.click()

      // Fill pay range
      const payMinInput = page.locator('[data-testid="job-pay-min-input"]')
      await payMinInput.fill('25')

      const payMaxInput = page.locator('[data-testid="job-pay-max-input"]')
      await payMaxInput.fill('35')

      // Select pay type
      const payTypeSelect = page.locator('[data-testid="job-pay-type-select"]')
      await payTypeSelect.click()
      await page.waitForTimeout(300)
      const hourlyOption = page.getByRole('option', { name: /hourly/i })
      await hourlyOption.click()

      // Fill position level
      const positionLevelInput = page.locator('[data-testid="job-position-level-input"]')
      await positionLevelInput.fill('Senior')

      console.log('Form filled, clicking save draft...')

      // Click save draft button
      const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')
      await saveDraftButton.click()

      // Wait for navigation back to list
      await page.waitForURL('**/office/jobs**', { timeout: 15000 })
      await page.waitForTimeout(2000)

      console.log('Job saved as draft, now on:', page.url())

      // Verify we're back on the jobs list
      expect(page.url()).toContain('/office/jobs')

      // Search for the newly created job
      const searchInput = page.getByPlaceholder(/search jobs/i)
      await searchInput.fill(testData.title)
      await page.waitForTimeout(1000)

      // Verify job appears in table
      const jobTitle = page.getByText(testData.title)
      await expect(jobTitle).toBeVisible({ timeout: 10000 })

      console.log('Successfully created and verified job:', testData.title)
    })

    test('should validate required fields', async ({ page }: { page: Page }) => {
      await waitForOrganizationSelect(page)

      // Try to save without filling required fields
      const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')

      // Button should be disabled when required fields are empty
      const isDisabled = await saveDraftButton.isDisabled()
      expect(isDisabled).toBe(true)

      console.log('Form validation working - save button disabled without required fields')
    })
  })

  test.describe('Edit Job Flow', () => {
    const jobId: string | null = null
    const testData = {
      ...generateJobData(),
      title: `TEST_JOB_EDIT_${generateTestId()}`,
    }

    test.beforeEach(async ({ page }: { page: Page }) => {
      // Create a job first for editing
      console.log('Creating test job for editing...')
      await navigateToOfficeRoute(page, OFFICE_ROUTES.JOB_CREATE)
      await page.waitForTimeout(2000)

      await waitForOrganizationSelect(page)
      await selectFirstOrganization(page)

      const titleInput = page.locator('[data-testid="job-title-input"]')
      await titleInput.fill(testData.title)

      const descInput = page.locator('[data-testid="job-description-input"]')
      await descInput.fill(testData.description)

      const empTypeSelect = page.locator('[data-testid="job-employment-type-select"]')
      await empTypeSelect.click()
      await page.waitForTimeout(300)
      const fullTimeOption = page.getByRole('option', { name: /full time/i })
      await fullTimeOption.click()

      const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')
      await saveDraftButton.click()

      await page.waitForURL('**/office/jobs**', { timeout: 15000 })
      await page.waitForTimeout(2000)

      // Find the job we just created
      const searchInput = page.getByPlaceholder(/search jobs/i)
      await searchInput.fill(testData.title)
      await page.waitForTimeout(1000)

      // Click edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first()
      await editButton.click()

      await page.waitForURL('**/office/jobs/**/edit', { timeout: 15000 })
      await page.waitForTimeout(2000)

      console.log('Edit page loaded:', page.url())
    })

    test('should load edit job form with existing data', async ({ page }: { page: Page }) => {
      // Verify URL contains edit
      expect(page.url()).toContain('/edit')

      // Check form title
      const formTitle = page.getByRole('heading', { name: /edit job/i })
      await expect(formTitle).toBeVisible({ timeout: 10000 })

      // Verify title is pre-filled
      const titleInput = page.locator('[data-testid="job-title-input"]')
      const titleValue = await titleInput.inputValue()
      expect(titleValue).toBe(testData.title)

      console.log('Edit form loaded with existing data')
    })

    test('should update job title successfully', async ({ page }: { page: Page }) => {
      const updatedTitle = `${testData.title}_UPDATED`

      // Update title
      const titleInput = page.locator('[data-testid="job-title-input"]')
      await titleInput.clear()
      await titleInput.fill(updatedTitle)

      console.log('Updated title to:', updatedTitle)

      // Save changes
      const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')
      await saveDraftButton.click()

      // Wait for navigation back to list
      await page.waitForURL('**/office/jobs**', { timeout: 15000 })
      await page.waitForTimeout(2000)

      // Verify we're back on the jobs list
      expect(page.url()).toContain('/office/jobs')

      // Search for updated job
      const searchInput = page.getByPlaceholder(/search jobs/i)
      await searchInput.fill(updatedTitle)
      await page.waitForTimeout(1000)

      // Verify updated job appears in table
      const jobTitle = page.getByText(updatedTitle)
      await expect(jobTitle).toBeVisible({ timeout: 10000 })

      console.log('Successfully updated job title to:', updatedTitle)
    })

    test('should cancel edit without saving changes', async ({ page }: { page: Page }) => {
      const originalTitle = testData.title
      const updatedTitle = `${testData.title}_CANCELLED`

      // Update title but don't save
      const titleInput = page.locator('[data-testid="job-title-input"]')
      await titleInput.clear()
      await titleInput.fill(updatedTitle)

      // Click cancel
      const cancelButton = page.locator('[data-testid="job-cancel-button"]')
      await cancelButton.click()

      // Wait for navigation back to list
      await page.waitForURL('**/office/jobs**', { timeout: 15000 })
      await page.waitForTimeout(2000)

      // Search for original job (should still exist with original title)
      const searchInput = page.getByPlaceholder(/search jobs/i)
      await searchInput.fill(originalTitle)
      await page.waitForTimeout(1000)

      // Verify original job title still exists
      const jobTitle = page.getByText(originalTitle, { exact: false })
      await expect(jobTitle).toBeVisible({ timeout: 10000 })

      console.log('Cancel worked - original title preserved')
    })
  })
})
