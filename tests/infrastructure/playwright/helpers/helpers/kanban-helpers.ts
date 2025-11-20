/**
 * Kanban Board Helpers
 *
 * Provides utilities for interacting with Kanban boards (drag-and-drop, etc.)
 * Specifically designed for @dnd-kit/core implementation used in ApplicationsKanbanBoard
 */

import type { Locator, Page } from '@playwright/test'

/**
 * Application status columns in the Kanban board
 */
export const KANBAN_COLUMNS = {
  NEW: 'new',
  SCREEN: 'screen',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
} as const

export type KanbanColumn = (typeof KANBAN_COLUMNS)[keyof typeof KANBAN_COLUMNS]

/**
 * Get a Kanban column by status
 */
export async function getKanbanColumn(
  page: Page,
  column: KanbanColumn,
  options?: { timeout?: number }
): Promise<Locator> {
  const timeout = options?.timeout ?? 5000

  // Try multiple selector strategies for finding columns
  const columnLocator = page
    .locator(`[data-column="${column}"]`)
    .or(page.locator(`[data-status="${column}"]`))
    .or(page.getByTestId(`kanban-column-${column}`))
    .first()

  await columnLocator.waitFor({ state: 'visible', timeout })
  return columnLocator
}

/**
 * Get all application cards in a column
 */
export async function getCardsInColumn(
  page: Page,
  column: KanbanColumn,
  options?: { timeout?: number }
): Promise<Locator[]> {
  const timeout = options?.timeout ?? 5000

  const columnLocator = await getKanbanColumn(page, column, { timeout })

  // Find all draggable cards within the column
  const cards = columnLocator
    .locator('[draggable="true"]')
    .or(columnLocator.locator('[data-draggable="true"]'))
    .or(columnLocator.locator('[role="button"]'))

  const count = await cards.count()
  const cardArray: Locator[] = []

  for (let i = 0; i < count; i++) {
    cardArray.push(cards.nth(i))
  }

  return cardArray
}

/**
 * Get card count in a column
 */
export async function getColumnCardCount(
  page: Page,
  column: KanbanColumn,
  options?: { timeout?: number }
): Promise<number> {
  const cards = await getCardsInColumn(page, column, options)
  return cards.length
}

/**
 * Find an application card by candidate name or application ID
 */
export async function findApplicationCard(
  page: Page,
  identifier: string,
  options?: { timeout?: number }
): Promise<Locator | null> {
  const timeout = options?.timeout ?? 5000

  try {
    // Try finding by text content (candidate name)
    const cardByText = page.getByText(identifier).locator('..').locator('[draggable="true"]')
    await cardByText.first().waitFor({ state: 'visible', timeout })
    return cardByText.first()
  } catch {
    // Try finding by data attribute (application ID)
    try {
      const cardById = page.locator(`[data-application-id="${identifier}"]`)
      await cardById.first().waitFor({ state: 'visible', timeout })
      return cardById.first()
    } catch {
      return null
    }
  }
}

/**
 * Drag an application card to a different column
 * Uses Playwright's drag and drop API with @dnd-kit/core
 */
export async function dragApplicationToColumn(
  page: Page,
  cardIdentifier: string,
  targetColumn: KanbanColumn,
  options?: {
    timeout?: number
    waitForConfirmation?: boolean
    activationDistance?: number
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const waitForConfirmation = options?.waitForConfirmation ?? true

  // Find the card to drag
  const card = await findApplicationCard(page, cardIdentifier, { timeout })
  if (!card) {
    throw new Error(`Could not find application card: ${cardIdentifier}`)
  }

  // Get the target column
  const targetColumnLocator = await getKanbanColumn(page, targetColumn, { timeout })

  // Get bounding boxes
  const cardBox = await card.boundingBox()
  const targetBox = await targetColumnLocator.boundingBox()

  if (!cardBox || !targetBox) {
    throw new Error('Could not get bounding boxes for drag operation')
  }

  // Perform drag and drop
  // @dnd-kit requires 8px movement to activate drag, so we'll use a deliberate path
  const startX = cardBox.x + cardBox.width / 2
  const startY = cardBox.y + cardBox.height / 2
  const endX = targetBox.x + targetBox.width / 2
  const endY = targetBox.y + targetBox.height / 2

  // Move mouse to card
  await page.mouse.move(startX, startY)

  // Press mouse button
  await page.mouse.down()

  // Wait briefly to allow drag start detection
  await page.waitForTimeout(100)

  // Move past activation distance (8px for @dnd-kit)
  await page.mouse.move(startX + 10, startY + 10, { steps: 2 })

  // Wait for drag overlay to appear
  await page.waitForTimeout(200)

  // Move to target column (with steps for smooth animation)
  await page.mouse.move(endX, endY, { steps: 10 })

  // Wait for drop zone to be active
  await page.waitForTimeout(200)

  // Release mouse button
  await page.mouse.up()

  // Wait for drop animation
  await page.waitForTimeout(500)

  if (waitForConfirmation) {
    // Check if confirmation modal appears
    try {
      await waitForStatusChangeModal(page, { timeout: 2000 })
      // Modal appeared, will need to be confirmed separately
    } catch {
      // No modal appeared, that's okay
    }
  }
}

/**
 * Wait for status change confirmation modal to appear
 */
export async function waitForStatusChangeModal(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Look for modal/dialog with confirmation text
  await page
    .getByRole('dialog')
    .or(page.locator('[role="alertdialog"]'))
    .or(page.getByText(/confirm|are you sure/i))
    .first()
    .waitFor({ state: 'visible', timeout })
}

/**
 * Confirm a status change in the modal
 */
export async function confirmStatusChange(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Find and click confirm button
  const confirmButton = page.getByRole('button', { name: /confirm|yes|ok|continue/i })
  await confirmButton.click({ timeout })

  // Wait for modal to close
  await page.waitForTimeout(500)
}

/**
 * Cancel a status change in the modal
 */
export async function cancelStatusChange(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  // Find and click cancel button
  const cancelButton = page.getByRole('button', { name: /cancel|no|dismiss/i })
  await cancelButton.click({ timeout })

  // Wait for modal to close
  await page.waitForTimeout(500)
}

/**
 * Verify an application card is in a specific column
 */
export async function verifyApplicationInColumn(
  page: Page,
  cardIdentifier: string,
  expectedColumn: KanbanColumn,
  options?: { timeout?: number }
): Promise<boolean> {
  const timeout = options?.timeout ?? 5000

  try {
    const column = await getKanbanColumn(page, expectedColumn, { timeout })
    const card = await findApplicationCard(page, cardIdentifier, { timeout })

    if (!card) {
      return false
    }

    // Check if card is within the column's bounding box
    const cardBox = await card.boundingBox()
    const columnBox = await column.boundingBox()

    if (!cardBox || !columnBox) {
      return false
    }

    // Check if card center point is within column bounds
    const cardCenterX = cardBox.x + cardBox.width / 2
    const cardCenterY = cardBox.y + cardBox.height / 2

    const isInColumn =
      cardCenterX >= columnBox.x &&
      cardCenterX <= columnBox.x + columnBox.width &&
      cardCenterY >= columnBox.y &&
      cardCenterY <= columnBox.y + columnBox.height

    return isInColumn
  } catch {
    return false
  }
}

/**
 * Click an application card to open details modal
 */
export async function clickApplicationCard(
  page: Page,
  cardIdentifier: string,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  const card = await findApplicationCard(page, cardIdentifier, { timeout })
  if (!card) {
    throw new Error(`Could not find application card: ${cardIdentifier}`)
  }

  await card.click({ timeout })

  // Wait for modal to open
  await page.waitForTimeout(500)
}

/**
 * Get application details from a card
 */
export async function getApplicationCardDetails(
  page: Page,
  cardIdentifier: string,
  options?: { timeout?: number }
): Promise<{
  candidateName: string | null
  jobTitle: string | null
  score: string | null
  date: string | null
}> {
  const card = await findApplicationCard(page, cardIdentifier, options)
  if (!card) {
    return {
      candidateName: null,
      jobTitle: null,
      score: null,
      date: null,
    }
  }

  const candidateName = await card
    .locator('[data-candidate-name]')
    .or(card.locator('h3, h4').first())
    .textContent()
    .catch(() => null)

  const jobTitle = await card
    .locator('[data-job-title]')
    .textContent()
    .catch(() => null)

  const score = await card
    .locator('[data-score]')
    .or(card.getByText(/\d+%/))
    .textContent()
    .catch(() => null)

  const date = await card
    .locator('[data-date]')
    .or(card.locator('time'))
    .textContent()
    .catch(() => null)

  return {
    candidateName: candidateName?.trim() || null,
    jobTitle: jobTitle?.trim() || null,
    score: score?.trim() || null,
    date: date?.trim() || null,
  }
}

/**
 * Wait for Kanban board to finish loading
 */
export async function waitForKanbanLoad(page: Page, options?: { timeout?: number }): Promise<void> {
  const timeout = options?.timeout ?? 30000

  // First, wait for the page to load and any loading spinner to disappear
  try {
    // Wait for "Loading applications..." text to disappear
    await page.getByText('Loading applications...').waitFor({ state: 'hidden', timeout: 15000 })
  } catch {
    // Loading text might not exist, that's okay
  }

  // Wait for error state to not be visible (if it appears, we'll handle it)
  try {
    const errorText = page.getByText('Error Loading Applications')
    const isVisible = await errorText.isVisible().catch(() => false)
    if (isVisible) {
      // If there's an error, wait a bit and check if it resolves
      await page.waitForTimeout(2000)
    }
  } catch {
    // No error state, that's good
  }

  // Wait for at least one column to be visible (even if empty)
  // Increase timeout since API might take time
  const firstColumn = await getKanbanColumn(page, KANBAN_COLUMNS.NEW, { timeout })
  await firstColumn.waitFor({ state: 'visible', timeout })

  // Wait for loading indicators to disappear
  try {
    await page
      .locator('[role="progressbar"]')
      .or(page.locator('[class*="loading"]'))
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 })
  } catch {
    // No loading indicators, that's okay
  }

  // Wait a bit for cards to render
  await page.waitForTimeout(500)
}

/**
 * Get all column names and their card counts
 */
export async function getKanbanSummary(
  page: Page,
  options?: { timeout?: number }
): Promise<Record<KanbanColumn, number>> {
  const timeout = options?.timeout ?? 10000

  const summary: Partial<Record<KanbanColumn, number>> = {}

  for (const [key, column] of Object.entries(KANBAN_COLUMNS)) {
    const count = await getColumnCardCount(page, column, { timeout })
    summary[column] = count
  }

  return summary as Record<KanbanColumn, number>
}

/**
 * Check if Kanban board is empty
 */
export async function isKanbanEmpty(page: Page, options?: { timeout?: number }): Promise<boolean> {
  const summary = await getKanbanSummary(page, options)
  const totalCards = Object.values(summary).reduce((sum, count) => sum + count, 0)
  return totalCards === 0
}
