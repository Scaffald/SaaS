/**
 * E2E Tests: Office Applications Kanban Board
 *
 * Tests drag-and-drop functionality for the applications Kanban board
 * using @dnd-kit/core implementation with status change modals
 *
 * Office applications Kanban board - drag-and-drop and status change modals.
 */

import { expect, type Page, test } from '@playwright/test'
import {
  dragApplicationToColumn,
  findApplicationCard,
  getColumnCardCount,
  getKanbanColumn,
  getKanbanSummary,
  KANBAN_COLUMNS,
  type KanbanColumn,
  verifyApplicationInColumn,
  waitForKanbanLoad,
} from '../../infrastructure/playwright/helpers/helpers/kanban-helpers'
import { signInAsAdmin } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

test.describe('Office • /office/applications - Kanban Board', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authentication handled by storage state (tests/.auth/super-admin.json)
    await page.goto('/office/applications', { waitUntil: 'domcontentloaded' })
    await waitForKanbanLoad(page)
  })

  /**
   * Every behavioural test below calls `test.skip()` when its column is empty,
   * so on an unseeded board they all opt out and the suite reports green
   * having exercised nothing. It stayed green throughout the period when
   * `useApplications()` returned a hardcoded [] and no application had ever
   * appeared in /office.
   *
   * This block is the guard: it *fails* rather than skips, so a missing
   * fixture is a red suite with an actionable message instead of a silent
   * pass. Seed 006 populates every stage (#538).
   */
  test.describe('Fixture preconditions', () => {
    test('the board has seeded applications to act on', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)
      const total = Object.values(summary).reduce((sum, n) => sum + n, 0)

      expect(
        total,
        'The kanban is empty, so every drag and modal test below will skip ' +
          'and the suite will report green having tested nothing. Load the ' +
          'ATS fixtures first:\n\n' +
          '  pnpm supa db seed --file seeds/006_seed-unicorn-ats.sql\n'
      ).toBeGreaterThan(0)
    })

    test('the stages the behavioural tests need are populated', async ({
      page,
    }: {
      page: Page
    }) => {
      const summary = await getKanbanSummary(page)

      // These three are the sources the drag tests pick their card from. A
      // board with everything sitting in one column still skips most of the
      // suite, so a non-zero total is not sufficient on its own.
      for (const column of [KANBAN_COLUMNS.NEW, KANBAN_COLUMNS.SCREEN, KANBAN_COLUMNS.INTERVIEW]) {
        expect(
          summary[column],
          `No applications in the "${column}" column, so the tests that drag ` +
            `out of it will skip. Seed 006 puts applications in every stage.`
        ).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Kanban Board Structure', () => {
    test('displays all 6 status columns', async ({ page }: { page: Page }) => {
      // Verify all 6 columns are visible
      const newColumn = await getKanbanColumn(page, KANBAN_COLUMNS.NEW)
      await expect(newColumn).toBeVisible()

      const screenColumn = await getKanbanColumn(page, KANBAN_COLUMNS.SCREEN)
      await expect(screenColumn).toBeVisible()

      const interviewColumn = await getKanbanColumn(page, KANBAN_COLUMNS.INTERVIEW)
      await expect(interviewColumn).toBeVisible()

      const offerColumn = await getKanbanColumn(page, KANBAN_COLUMNS.OFFER)
      await expect(offerColumn).toBeVisible()

      const hiredColumn = await getKanbanColumn(page, KANBAN_COLUMNS.HIRED)
      await expect(hiredColumn).toBeVisible()

      const rejectedColumn = await getKanbanColumn(page, KANBAN_COLUMNS.REJECTED)
      await expect(rejectedColumn).toBeVisible()
    })

    test('displays correct column labels', async ({ page }: { page: Page }) => {
      const pageContent = (await page.locator('#root').textContent()) || ''

      expect(pageContent).toContain('New Applications')
      expect(pageContent).toContain('Screening')
      expect(pageContent).toContain('Interview')
      expect(pageContent).toContain('Offer')
      expect(pageContent).toContain('Hired')
      expect(pageContent).toContain('Rejected')
    })

    test('displays card counts for each column', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)

      // Verify we got counts for all columns
      expect(summary).toHaveProperty(KANBAN_COLUMNS.NEW)
      expect(summary).toHaveProperty(KANBAN_COLUMNS.SCREEN)
      expect(summary).toHaveProperty(KANBAN_COLUMNS.INTERVIEW)
      expect(summary).toHaveProperty(KANBAN_COLUMNS.OFFER)
      expect(summary).toHaveProperty(KANBAN_COLUMNS.HIRED)
      expect(summary).toHaveProperty(KANBAN_COLUMNS.REJECTED)

      // Each count should be a non-negative number
      Object.values(summary).forEach((count) => {
        expect(count).toBeGreaterThanOrEqual(0)
      })
    })

    test('displays application cards with correct data-testid', async ({
      page,
    }: {
      page: Page
    }) => {
      // Find any application card
      const card = page.locator('[data-testid^="kanban-card-"]').first()

      // Check if cards exist (might be zero if no applications)
      const cardCount = await page.locator('[data-testid^="kanban-card-"]').count()

      if (cardCount > 0) {
        await expect(card).toBeVisible()

        // Verify card has proper testid format
        const testId = await card.getAttribute('data-testid')
        expect(testId).toMatch(/^kanban-card-/)
      }
    })
  })

  // office.applications.list endpoint available
  // All drag and drop tests should work with the implemented endpoint
  test.describe('Basic Drag and Drop', () => {
    test('drags application from new to screen column', async ({ page }: { page: Page }) => {
      // Get initial counts
      const initialSummary = await getKanbanSummary(page)

      // Skip if no applications in new column
      if (initialSummary.new === 0) {
        test.skip(
          true,
          'No applications in new column to test. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      // Find first card in new column
      const newColumn = await getKanbanColumn(page, KANBAN_COLUMNS.NEW)
      const firstCard = newColumn.locator('[data-testid^="kanban-card-"]').first()
      const cardId = await firstCard.getAttribute('data-testid')
      const applicationId = cardId?.replace('kanban-card-', '') || ''

      // Get candidate name for verification
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to screen column
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.SCREEN, {
        waitForConfirmation: false,
      })

      // Wait for animation to complete
      await page.waitForTimeout(1000)

      // Verify card moved to screen column
      const isInScreen = await verifyApplicationInColumn(page, candidateName, KANBAN_COLUMNS.SCREEN)
      expect(isInScreen).toBe(true)

      // Verify counts updated
      const newSummary = await getKanbanSummary(page)
      expect(newSummary.new).toBe(initialSummary.new - 1)
      expect(newSummary.screen).toBe(initialSummary.screen + 1)
    })

    test('drags application from screen to interview column', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      // Skip if no applications in screen column
      if (initialSummary.screen === 0) {
        test.skip(
          true,
          'No applications in screen column to test. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      // Find first card in screen column
      const screenColumn = await getKanbanColumn(page, KANBAN_COLUMNS.SCREEN)
      const firstCard = screenColumn.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to interview column
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.INTERVIEW, {
        waitForConfirmation: false,
      })

      // Wait for animation
      await page.waitForTimeout(1000)

      // Verify move
      const isInInterview = await verifyApplicationInColumn(
        page,
        candidateName,
        KANBAN_COLUMNS.INTERVIEW
      )
      expect(isInInterview).toBe(true)
    })

    test('drags application from interview to offer column', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      if (initialSummary.interview === 0) {
        test.skip(
          true,
          'No applications in interview column to test. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const interviewColumn = await getKanbanColumn(page, KANBAN_COLUMNS.INTERVIEW)
      const firstCard = interviewColumn.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.OFFER, {
        waitForConfirmation: false,
      })

      await page.waitForTimeout(1000)

      const isInOffer = await verifyApplicationInColumn(page, candidateName, KANBAN_COLUMNS.OFFER)
      expect(isInOffer).toBe(true)
    })
  })

  test.describe('Critical Status Changes with Modal', () => {
    test('shows modal when dragging to rejected column', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      // Find any non-rejected application
      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.NEW
      if (initialSummary.new > 0) {
        sourceColumn = KANBAN_COLUMNS.NEW
      } else if (initialSummary.screen > 0) {
        sourceColumn = KANBAN_COLUMNS.SCREEN
      } else if (initialSummary.interview > 0) {
        sourceColumn = KANBAN_COLUMNS.INTERVIEW
      } else if (initialSummary.offer > 0) {
        sourceColumn = KANBAN_COLUMNS.OFFER
      } else {
        test.skip(
          true,
          'No applications available to test rejection modal. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to rejected column
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.REJECTED, {
        waitForConfirmation: true,
      })

      // Wait for modal to appear
      await page.waitForTimeout(1000)

      // Verify modal is visible
      const modal = page.getByRole('dialog').or(page.locator('[role="alertdialog"]'))
      await expect(modal.first()).toBeVisible()

      // Verify modal title
      const modalContent = (await page.locator('#root').textContent()) || ''
      expect(modalContent).toMatch(/reject|rejection/i)
    })

    test('requires reason for rejection and confirms', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.NEW
      if (initialSummary.new > 0) {
        sourceColumn = KANBAN_COLUMNS.NEW
      } else if (initialSummary.screen > 0) {
        sourceColumn = KANBAN_COLUMNS.SCREEN
      } else {
        test.skip(
          true,
          'No applications available to test rejection with reason. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to rejected
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)

      await page.waitForTimeout(1000)

      // Try to confirm without reason (should be disabled)
      const confirmButton = page.getByTestId('status-change-confirm-button')
      await expect(confirmButton).toBeDisabled()

      // Fill in rejection reason
      const reasonInput = page.getByTestId('status-change-reason-input')
      await reasonInput.fill('Candidate does not meet required qualifications')

      // Confirm button should now be enabled
      await expect(confirmButton).toBeEnabled()

      // Click confirm
      await confirmButton.click()

      // Wait for modal to close and status to update
      await page.waitForTimeout(2000)

      // Verify application moved to rejected
      const isInRejected = await verifyApplicationInColumn(
        page,
        candidateName,
        KANBAN_COLUMNS.REJECTED
      )
      expect(isInRejected).toBe(true)

      // Verify counts updated
      const newSummary = await getKanbanSummary(page)
      expect(newSummary.rejected).toBeGreaterThan(initialSummary.rejected)
    })

    test('shows modal when dragging to hired column', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      // Prefer offer column for hiring
      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.OFFER
      if (initialSummary.offer > 0) {
        sourceColumn = KANBAN_COLUMNS.OFFER
      } else if (initialSummary.interview > 0) {
        sourceColumn = KANBAN_COLUMNS.INTERVIEW
      } else if (initialSummary.screen > 0) {
        sourceColumn = KANBAN_COLUMNS.SCREEN
      } else if (initialSummary.new > 0) {
        sourceColumn = KANBAN_COLUMNS.NEW
      } else {
        test.skip(
          true,
          'No applications available to test hiring modal. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to hired
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.HIRED, {
        waitForConfirmation: true,
      })

      await page.waitForTimeout(1000)

      // Verify modal appears
      const modal = page.getByRole('dialog').or(page.locator('[role="alertdialog"]'))
      await expect(modal.first()).toBeVisible()

      const modalContent = (await page.locator('#root').textContent()) || ''
      expect(modalContent).toMatch(/hired|hire/i)
    })

    test('confirms hiring with optional notes', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.OFFER
      if (initialSummary.offer > 0) {
        sourceColumn = KANBAN_COLUMNS.OFFER
      } else if (initialSummary.interview > 0) {
        sourceColumn = KANBAN_COLUMNS.INTERVIEW
      } else {
        test.skip(
          true,
          'No applications available to test hiring with notes. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.HIRED)

      await page.waitForTimeout(1000)

      // Add optional notes
      const reasonInput = page.getByTestId('status-change-reason-input')
      await reasonInput.fill('Great culture fit, strong technical skills')

      // Confirm
      const confirmButton = page.getByTestId('status-change-confirm-button')
      await confirmButton.click()

      await page.waitForTimeout(2000)

      // Verify moved to hired
      const isInHired = await verifyApplicationInColumn(page, candidateName, KANBAN_COLUMNS.HIRED)
      expect(isInHired).toBe(true)
    })
  })

  test.describe('Modal Cancel Flow', () => {
    test('cancels rejection and returns card to original column', async ({
      page,
    }: {
      page: Page
    }) => {
      const initialSummary = await getKanbanSummary(page)

      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.NEW
      if (initialSummary.new > 0) {
        sourceColumn = KANBAN_COLUMNS.NEW
      } else if (initialSummary.screen > 0) {
        sourceColumn = KANBAN_COLUMNS.SCREEN
      } else {
        test.skip(
          true,
          'No applications available to test rejection cancel. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to rejected
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)

      await page.waitForTimeout(1000)

      // Click cancel button
      const cancelButton = page.getByTestId('status-change-cancel-button')
      await expect(cancelButton).toBeVisible()
      await cancelButton.click()

      await page.waitForTimeout(1000)

      // Verify modal closed
      const modal = page.getByRole('dialog').or(page.locator('[role="alertdialog"]'))
      await expect(modal.first()).not.toBeVisible()

      // Verify card returned to original column
      const isInOriginal = await verifyApplicationInColumn(page, candidateName, sourceColumn)
      expect(isInOriginal).toBe(true)

      // Verify counts unchanged
      const newSummary = await getKanbanSummary(page)
      expect(newSummary[sourceColumn]).toBe(initialSummary[sourceColumn])
      expect(newSummary.rejected).toBe(initialSummary.rejected)
    })

    test('cancels hiring and returns card to original column', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      let sourceColumn: KanbanColumn = KANBAN_COLUMNS.OFFER
      if (initialSummary.offer > 0) {
        sourceColumn = KANBAN_COLUMNS.OFFER
      } else if (initialSummary.interview > 0) {
        sourceColumn = KANBAN_COLUMNS.INTERVIEW
      } else {
        test.skip(
          true,
          'No applications available to test hiring cancel. ' +
            'The Fixture preconditions suite explains how to load them.'
        )
      }

      const column = await getKanbanColumn(page, sourceColumn)
      const firstCard = column.locator('[data-testid^="kanban-card-"]').first()
      const candidateName = (await firstCard.locator('text').first().textContent()) || ''

      // Drag to hired
      await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.HIRED)

      await page.waitForTimeout(1000)

      // Cancel
      const cancelButton = page.getByTestId('status-change-cancel-button')
      await cancelButton.click()

      await page.waitForTimeout(1000)

      // Verify returned
      const isInOriginal = await verifyApplicationInColumn(page, candidateName, sourceColumn)
      expect(isInOriginal).toBe(true)

      // Verify counts unchanged
      const newSummary = await getKanbanSummary(page)
      expect(newSummary[sourceColumn]).toBe(initialSummary[sourceColumn])
      expect(newSummary.hired).toBe(initialSummary.hired)
    })
  })

  test.describe('Kanban Summary and Metrics', () => {
    test('gets accurate summary of all columns', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)

      // Verify structure
      expect(summary).toHaveProperty('new')
      expect(summary).toHaveProperty('screen')
      expect(summary).toHaveProperty('interview')
      expect(summary).toHaveProperty('offer')
      expect(summary).toHaveProperty('hired')
      expect(summary).toHaveProperty('rejected')

      // All values should be non-negative integers
      Object.entries(summary).forEach(([column, count]) => {
        expect(count).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(count)).toBe(true)
      })
    })

    test('summary counts match visual column counts', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)

      // For each column, verify the count badge matches the summary
      for (const [columnKey, columnValue] of Object.entries(KANBAN_COLUMNS)) {
        const column = await getKanbanColumn(page, columnValue)
        const countBadge = column.locator('text').filter({ hasText: /^\d+$/ })

        const displayedCount = await countBadge.textContent()
        const numericCount = parseInt(displayedCount || '0', 10)

        expect(numericCount).toBe(summary[columnValue])
      }
    })

    test('calculates total applications across all columns', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)

      const totalApplications = Object.values(summary).reduce((sum, count) => sum + count, 0)

      // Should have some applications (or could be 0 if empty)
      expect(totalApplications).toBeGreaterThanOrEqual(0)

      // Count all cards on page
      const allCards = await page.locator('[data-testid^="kanban-card-"]').count()
      expect(allCards).toBe(totalApplications)
    })
  })

  test.describe('Edge Cases', () => {
    test('handles empty columns gracefully', async ({ page }: { page: Page }) => {
      const summary = await getKanbanSummary(page)

      // Find an empty column (if any)
      const emptyColumn = Object.entries(summary).find(([_, count]) => count === 0)

      if (emptyColumn) {
        const [columnName] = emptyColumn
        const column = await getKanbanColumn(page, columnName as any)

        // Should show "No applications" message
        const columnContent = await column.textContent()
        expect(columnContent).toMatch(/no applications/i)
      }
    })

    test('preserves card data after drag', async ({ page }: { page: Page }) => {
      const initialSummary = await getKanbanSummary(page)

      if (initialSummary.new === 0) {
        test.skip(true, 'No applications in new column to test card data preservation')
      }

      const newColumn = await getKanbanColumn(page, KANBAN_COLUMNS.NEW)
      const firstCard = newColumn.locator('[data-testid^="kanban-card-"]').first()

      // Capture card details before drag
      const beforeName = await firstCard.locator('text').first().textContent()
      const beforeContent = await firstCard.textContent()

      // Drag to screen
      await dragApplicationToColumn(page, beforeName || '', KANBAN_COLUMNS.SCREEN, {
        waitForConfirmation: false,
      })

      await page.waitForTimeout(1000)

      // Find card in new location
      const screenColumn = await getKanbanColumn(page, KANBAN_COLUMNS.SCREEN)
      const movedCard = screenColumn
        .locator('[data-testid^="kanban-card-"]')
        .filter({ hasText: beforeName || '' })
        .first()

      // Verify card data is preserved
      const afterContent = await movedCard.textContent()
      expect(afterContent).toBe(beforeContent)
    })
  })
})
