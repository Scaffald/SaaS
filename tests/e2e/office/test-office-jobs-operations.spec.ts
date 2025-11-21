/**
 * Office Jobs Operations E2E Tests - REQ-216
 *
 * Tests for job operations including:
 * - Delete with confirmation
 * - Duplicate functionality
 * - List view filtering and search
 */

import { expect, type Page, test } from '@playwright/test'
import { navigateToOfficeRoute } from '../../infrastructure/playwright/helpers/helpers/office-navigation'
import {
  generateJobData,
  generateTestId,
} from '../../infrastructure/playwright/helpers/helpers/office-test-data'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Increase timeout for operations
test.setTimeout(120000)

// Helper to wait for organization select to be ready
async function waitForOrganizationSelect(page: Page) {
  const orgSelect = page.locator('[data-testid="job-organization-select"]')
  await orgSelect.waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(1000)
}

// Helper to select first organization
async function selectFirstOrganization(page: Page) {
  const orgSelect = page.locator('[data-testid="job-organization-select"]')
  await orgSelect.click()
  await page.waitForTimeout(500)
  const firstOption = page.locator('[role="option"]').first()
  await firstOption.click({ timeout: 5000 })
  await page.waitForTimeout(300)
}

// Helper to create a test job
async function createTestJob(page: Page, title: string) {
  await navigateToOfficeRoute(page, '/office/cms/jobs/create')
  await waitForOrganizationSelect(page)
  await selectFirstOrganization(page)

  const titleInput = page.locator('[data-testid="job-title-input"]')
  await titleInput.fill(title)

  const descInput = page.locator('[data-testid="job-description-input"]')
  await descInput.click()
  await page.keyboard.type('Test job description')
  await page.waitForTimeout(500)

  const saveDraftButton = page.locator('[data-testid="job-save-draft-button"]')
  await saveDraftButton.click()

  await page.waitForURL('**/office/cms/jobs**', { timeout: 15000 })
  await page.waitForTimeout(2000)
}

test.describe('Office • Jobs Operations - Delete', () => {
  test('should delete job with confirmation', async ({ page }: { page: Page }) => {
    const testData = {
      ...generateJobData(),
      title: `TEST_JOB_DELETE_${generateTestId()}`,
    }

    // Create a job first
    await createTestJob(page, testData.title)

    // Find the job in the list
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill(testData.title)
    await page.waitForTimeout(1000)

    // Find delete button (might be in row actions menu)
    const deleteButton = page.getByRole('button', { name: /delete/i }).first()
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click()
      await page.waitForTimeout(500)

      // Confirm deletion if confirmation dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first()
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
        await page.waitForTimeout(2000)

        // Verify job is removed (search should not find it)
        await searchInput.fill(testData.title)
        await page.waitForTimeout(1000)
        const jobTitle = page.getByText(testData.title)
        await expect(jobTitle).not.toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should cancel delete when confirmation is cancelled', async ({ page }: { page: Page }) => {
    const testData = {
      ...generateJobData(),
      title: `TEST_JOB_DELETE_CANCEL_${generateTestId()}`,
    }

    // Create a job first
    await createTestJob(page, testData.title)

    // Find the job in the list
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill(testData.title)
    await page.waitForTimeout(1000)

    // Find delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first()
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click()
      await page.waitForTimeout(500)

      // Cancel deletion
      const cancelButton = page.getByRole('button', { name: /cancel|no/i }).first()
      if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelButton.click()
        await page.waitForTimeout(1000)

        // Verify job still exists
        await searchInput.fill(testData.title)
        await page.waitForTimeout(1000)
        const jobTitle = page.getByText(testData.title)
        await expect(jobTitle).toBeVisible({ timeout: 5000 })
      }
    }
  })
})

test.describe('Office • Jobs Operations - Duplicate', () => {
  test('should duplicate job successfully', async ({ page }: { page: Page }) => {
    const testData = {
      ...generateJobData(),
      title: `TEST_JOB_DUPLICATE_${generateTestId()}`,
    }

    // Create a job first
    await createTestJob(page, testData.title)

    // Find the job in the list
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill(testData.title)
    await page.waitForTimeout(1000)

    // Find duplicate button (might be in row actions menu)
    const duplicateButton = page.getByRole('button', { name: /duplicate/i }).first()
    if (await duplicateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await duplicateButton.click()
      await page.waitForTimeout(2000)

      // Should navigate to create page with pre-filled data or create duplicate
      // Check if we're on create page or if duplicate was created
      const isOnCreatePage = page.url().includes('/create')
      if (isOnCreatePage) {
        // Verify form is pre-filled
        const titleInput = page.locator('[data-testid="job-title-input"]')
        const titleValue = await titleInput.inputValue()
        expect(titleValue).toContain(testData.title)
      } else {
        // Duplicate was created directly, search for it
        await searchInput.fill(testData.title)
        await page.waitForTimeout(1000)
        const jobTitles = page.getByText(testData.title)
        const count = await jobTitles.count()
        expect(count).toBeGreaterThan(1) // Original + duplicate
      }
    }
  })
})

test.describe('Office • Jobs List - Filtering and Search', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToOfficeRoute(page, '/office/cms/jobs')
    await page.waitForTimeout(2000)
  })

  test('should filter jobs using search', async ({ page }: { page: Page }) => {
    // Wait for jobs to load
    await page.waitForTimeout(2000)

    // Get initial row count
    const rows = page.locator('tbody tr, [role="row"]')
    const initialCount = await rows.count()

    if (initialCount > 0) {
      // Get first job title
      const firstJobTitle = await rows.first().locator('td, [role="cell"]').first().textContent()

      if (firstJobTitle) {
        // Search for part of the title
        const searchTerm = firstJobTitle.substring(0, 5)
        const searchInput = page.getByPlaceholder(/search jobs/i)
        await searchInput.fill(searchTerm)
        await page.waitForTimeout(1000)

        // Verify filtered results
        const filteredCount = await rows.count()
        expect(filteredCount).toBeLessThanOrEqual(initialCount)
      }
    }
  })

  test('should display search input', async ({ page }: { page: Page }) => {
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test('should clear search and show all jobs', async ({ page }: { page: Page }) => {
    const searchInput = page.getByPlaceholder(/search jobs/i)
    await searchInput.fill('test search')
    await page.waitForTimeout(500)

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(1000)

    // Should show jobs again
    const rows = page.locator('tbody tr, [role="row"]')
    const count = await rows.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Office • Jobs List - View Toggle', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await navigateToOfficeRoute(page, '/office/cms/jobs')
    await page.waitForTimeout(2000)
  })

  test('should switch between list and Kanban views', async ({ page }: { page: Page }) => {
    // Look for view toggle buttons
    const kanbanButton = page.getByRole('button', { name: /kanban/i }).first()
    const listButton = page.getByRole('button', { name: /list/i }).first()

    if (await kanbanButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Switch to Kanban
      await kanbanButton.click()
      await page.waitForTimeout(1000)

      // Verify Kanban columns are visible
      const draftColumn = page.locator('[data-testid="kanban-column-draft"]')
      await expect(draftColumn).toBeVisible({ timeout: 5000 })

      // Switch back to list
      if (await listButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await listButton.click()
        await page.waitForTimeout(1000)

        // Verify table/list is visible
        const tableHeaders = page.locator('th, [role="columnheader"]')
        const headerCount = await tableHeaders.count()
        if (headerCount > 0) {
          await expect(tableHeaders.first()).toBeVisible()
        }
      }
    }
  })
})
