# Playwright Testing Patterns

Common testing patterns for Playwright E2E tests in office admin routes. This guide provides runnable code examples for common scenarios.

## Table of Contents

- [Form Testing Patterns](#form-testing-patterns)
- [Modal Testing Patterns](#modal-testing-patterns)
- [Drag-and-Drop Patterns](#drag-and-drop-patterns)
- [Wait Strategy Patterns](#wait-strategy-patterns)
- [Test Data Generation](#test-data-generation)
- [Error Handling](#error-handling)

## Form Testing Patterns

### Complete Form Fill and Submit

```typescript
import { test, expect } from '@playwright/test'
import { navigateToOfficeRoute, waitForPageLoad, waitForNavigation, OFFICE_ROUTES } from './helpers/office-navigation'
import { generateOrganizationData } from './helpers/office-test-data'

test('creates organization successfully', async ({ page }) => {
  // 1. Navigate to create page
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
  await waitForPageLoad(page)

  // 2. Generate test data
  const orgData = generateOrganizationData()

  // 3. Wait for form fields to be visible
  const nameInput = page.getByTestId('org-name-input')
  await expect(nameInput).toBeVisible({ timeout: 10000 })

  // 4. Fill all form fields
  await nameInput.fill(orgData.name)
  await page.getByTestId('org-slug-input').fill(orgData.slug)
  await page.getByTestId('org-industry-select').selectOption(orgData.industry)
  
  // 5. Submit form
  await page.getByTestId('save-button').click()

  // 6. Wait for navigation to list page
  await waitForNavigation(page, { timeout: 15000 })

  // 7. Verify success (redirected to list)
  expect(page.url()).toContain('/office/organizations')
  
  // 8. Verify organization appears in list
  const pageContent = await page.locator('body').textContent() || ''
  expect(pageContent).toContain(orgData.name)
})
```

### Form Validation Testing

```typescript
test('shows validation errors for required fields', async ({ page }) => {
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
  await waitForPageLoad(page)

  // Try to submit without filling required fields
  await page.getByTestId('save-button').click()

  // Wait for validation to trigger
  await page.waitForTimeout(500)

  // Check for validation errors
  const nameError = page.getByTestId('name-error')
  await expect(nameError).toBeVisible({ timeout: 5000 })

  // Verify error message
  const errorText = await nameError.textContent()
  expect(errorText).toMatch(/required/i)
})
```

### Form Edit Workflow

```typescript
test('updates organization name successfully', async ({ page }) => {
  // 1. Navigate to list page
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATIONS_INDEX)
  await waitForPageLoad(page)

  // 2. Get first organization's ID (assuming there's at least one)
  const editButton = page.getByTestId(/org-edit-button-/).first()
  await expect(editButton).toBeVisible({ timeout: 10000 })
  
  // 3. Extract ID from test ID attribute
  const buttonId = await editButton.getAttribute('data-testid')
  const orgId = buttonId?.replace('org-edit-button-', '') || ''

  // 4. Click edit button
  await editButton.click()
  await waitForNavigation(page)

  // 5. Wait for form to load
  const nameInput = page.getByTestId('org-name-input')
  await expect(nameInput).toBeVisible({ timeout: 10000 })

  // 6. Get current value
  const currentValue = await nameInput.inputValue()

  // 7. Update value
  const newName = `Updated ${currentValue}`
  await nameInput.clear()
  await nameInput.fill(newName)

  // 8. Save changes
  await page.getByTestId('save-button').click()

  // 9. Wait for navigation back to list
  await waitForNavigation(page, { timeout: 15000 })

  // 10. Verify update persisted
  const pageContent = await page.locator('body').textContent() || ''
  expect(pageContent).toContain(newName)
})
```

## Modal Testing Patterns

### Modal Open, Interact, and Close

```typescript
import { dragApplicationToColumn, verifyApplicationInColumn, KANBAN_COLUMNS } from './helpers/kanban-helpers'

test('requires reason for rejection and confirms', async ({ page }) => {
  const candidateName = 'John Doe'

  // 1. Open modal via drag-and-drop
  await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)

  // 2. Wait for modal animation
  await page.waitForTimeout(1000)

  // 3. Verify modal is visible
  const modal = page.getByRole('dialog').or(page.locator('[role="alertdialog"]'))
  await expect(modal.first()).toBeVisible()

  // 4. Test initial state (confirm button disabled)
  const confirmButton = page.getByTestId('status-change-confirm-button')
  await expect(confirmButton).toBeDisabled()

  // 5. Fill required field
  const reasonInput = page.getByTestId('status-change-reason-input')
  await reasonInput.fill('Candidate does not meet required qualifications')

  // 6. Verify state change (button enabled)
  await expect(confirmButton).toBeEnabled()

  // 7. Submit modal
  await confirmButton.click()

  // 8. Wait for modal to close and state to update
  await page.waitForTimeout(2000)
  await expect(modal.first()).not.toBeVisible()

  // 9. Verify result
  const isInRejected = await verifyApplicationInColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)
  expect(isInRejected).toBe(true)
})
```

### Modal Cancel Pattern

```typescript
test('cancel button closes modal without changes', async ({ page }) => {
  // 1. Open modal
  await page.click('[data-testid="open-modal-button"]')
  await page.waitForTimeout(500)

  // 2. Verify modal is open
  const modal = page.getByRole('dialog')
  await expect(modal.first()).toBeVisible()

  // 3. Interact with modal (optional)
  await page.getByTestId('modal-input').fill('Some value')

  // 4. Click cancel
  await page.getByTestId('cancel-button').click()

  // 5. Wait for modal to close
  await page.waitForTimeout(500)
  await expect(modal.first()).not.toBeVisible()

  // 6. Verify changes were not saved
  // (check state is unchanged)
})
```

## Drag-and-Drop Patterns

### Kanban Card Drag-and-Drop

```typescript
import { 
  dragApplicationToColumn, 
  getKanbanSummary, 
  verifyApplicationInColumn,
  KANBAN_COLUMNS 
} from './helpers/kanban-helpers'

test('moves application to interview column', async ({ page }) => {
  // 1. Get initial state
  const initialSummary = await getKanbanSummary(page)
  const candidateName = 'John Doe'

  // 2. Drag card to target column
  await dragApplicationToColumn(
    page,
    candidateName,
    KANBAN_COLUMNS.INTERVIEW,
    { waitForConfirmation: false }
  )

  // 3. Wait for state update (animation + API)
  await page.waitForTimeout(2000)

  // 4. Verify card moved
  const isInColumn = await verifyApplicationInColumn(
    page,
    candidateName,
    KANBAN_COLUMNS.INTERVIEW
  )
  expect(isInColumn).toBe(true)

  // 5. Verify counts updated
  const newSummary = await getKanbanSummary(page)
  expect(newSummary.interview).toBeGreaterThan(initialSummary.interview)
})
```

### Kanban with Modal Confirmation

```typescript
test('shows modal when dragging to rejected column', async ({ page }) => {
  const candidateName = 'Jane Smith'

  // 1. Drag to rejected (triggers modal)
  await dragApplicationToColumn(
    page,
    candidateName,
    KANBAN_COLUMNS.REJECTED,
    { waitForConfirmation: true }
  )

  // 2. Wait for modal to appear
  await page.waitForTimeout(1000)
  
  // 3. Verify modal is visible
  const modal = page.getByRole('dialog')
  await expect(modal.first()).toBeVisible()

  // 4. Verify modal content
  const modalContent = await page.locator('body').textContent() || ''
  expect(modalContent).toMatch(/reject|rejection/i)

  // 5. Fill required field
  await page.getByTestId('status-change-reason-input').fill('Not qualified')

  // 6. Confirm
  await page.getByTestId('status-change-confirm-button').click()

  // 7. Wait for modal to close
  await page.waitForTimeout(2000)

  // 8. Verify application moved
  const isInRejected = await verifyApplicationInColumn(
    page,
    candidateName,
    KANBAN_COLUMNS.REJECTED
  )
  expect(isInRejected).toBe(true)
})
```

## Wait Strategy Patterns

### Pattern 1: Page Load + Selector

```typescript
// Navigate and wait for content
await page.goto('/office/users')
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="main-content"]')

// Or use helper
import { navigateToOfficeRoute, waitForPageLoad } from './helpers/office-navigation'
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
await waitForPageLoad(page)
```

### Pattern 2: API Response Wait

```typescript
// Wait for API response before asserting
const responsePromise = page.waitForResponse(url => 
  url.includes('/api/users')
)

await page.click('[data-testid="search-input"]')
await responsePromise

// Now safe to assert on results
const results = page.getByTestId('user-row')
await expect(results.first()).toBeVisible()
```

### Pattern 3: Element Visibility Wait

```typescript
// Wait for element before interacting
const button = page.getByTestId('save-button')
await button.waitFor({ state: 'visible', timeout: 10000 })
await button.click()

// Or use expect with timeout
await expect(page.getByTestId('save-button')).toBeVisible({ timeout: 10000 })
await page.getByTestId('save-button').click()
```

### Pattern 4: Modal Wait

```typescript
// Wait for modal to appear
await page.click('[data-testid="open-modal"]')
await page.waitForSelector('[data-testid="modal-container"]:visible')

// Interact with modal
await page.getByTestId('modal-input').fill('value')
```

### Pattern 5: Loading State Wait

```typescript
// Wait for loading spinner to disappear
await page.waitForSelector('[data-testid="loading-spinner"]:hidden')

// Or wait for content to appear
await page.waitForSelector('[data-testid="results"]:visible')
```

### Pattern 6: Navigation Wait

```typescript
import { waitForNavigation } from './helpers/office-navigation'

// After form submission
await page.getByTestId('save-button').click()
await waitForNavigation(page, { timeout: 15000 })

// Verify new URL
expect(page.url()).toContain('/office/organizations')
```

## Test Data Generation

### Using Test Data Helpers

```typescript
import { generateJobData, generateOrganizationData, generateTestId } from './helpers/office-test-data'

test('creates job with generated data', async ({ page }) => {
  // Generate unique test data
  const jobData = {
    ...generateJobData(),
    title: `TEST_JOB_${generateTestId()}`,
  }

  // Use in test
  await page.getByTestId('job-title-input').fill(jobData.title)
  await page.getByTestId('job-description-input').fill(jobData.description)
  
  // ... rest of test
})
```

### Custom Test Data

```typescript
// Create custom test data
const customOrgData = {
  name: `Test Org ${Date.now()}`,
  slug: `test-org-${Date.now()}`,
  industry: 'Construction',
  website: 'https://example.com',
}

// Use in test
await page.getByTestId('org-name-input').fill(customOrgData.name)
await page.getByTestId('org-slug-input').fill(customOrgData.slug)
```

## Error Handling

### Handling Flaky Elements

```typescript
// Retry pattern for flaky elements
async function clickElementWithRetry(page: Page, selector: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.getByTestId(selector).click({ timeout: 5000 })
      return
    } catch (error) {
      if (i === retries - 1) throw error
      await page.waitForTimeout(1000)
    }
  }
}
```

### Graceful Error Handling

```typescript
// Handle optional elements gracefully
const errorMessage = page.getByTestId('error-message')
const isVisible = await errorMessage.isVisible().catch(() => false)

if (isVisible) {
  const text = await errorMessage.textContent()
  console.log('Error occurred:', text)
  // Handle error state
} else {
  // Continue with success path
}
```

### Skip Tests Conditionally

```typescript
test('moves application when applications exist', async ({ page }) => {
  const summary = await getKanbanSummary(page)
  
  // Skip if no applications available
  if (summary.new === 0 && summary.screen === 0) {
    test.skip()
    return
  }

  // Continue with test...
})
```

## Complete Example: Full CRUD Workflow

```typescript
import { test, expect } from '@playwright/test'
import { navigateToOfficeRoute, waitForPageLoad, waitForNavigation, OFFICE_ROUTES } from './helpers/office-navigation'
import { generateOrganizationData } from './helpers/office-test-data'

test.describe('Organization CRUD', () => {
  test('complete CRUD workflow', async ({ page }) => {
    const orgData = generateOrganizationData()

    // CREATE
    await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
    await waitForPageLoad(page)
    
    await page.getByTestId('org-name-input').fill(orgData.name)
    await page.getByTestId('org-slug-input').fill(orgData.slug)
    await page.getByTestId('org-industry-select').selectOption(orgData.industry)
    await page.getByTestId('save-button').click()
    await waitForNavigation(page, { timeout: 15000 })

    // READ (verify in list)
    expect(page.url()).toContain('/office/organizations')
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent).toContain(orgData.name)

    // UPDATE
    const editButton = page.getByTestId(/org-edit-button-/).first()
    await editButton.click()
    await waitForNavigation(page)
    
    const nameInput = page.getByTestId('org-name-input')
    const updatedName = `Updated ${orgData.name}`
    await nameInput.clear()
    await nameInput.fill(updatedName)
    await page.getByTestId('save-button').click()
    await waitForNavigation(page, { timeout: 15000 })

    // Verify update
    const updatedContent = await page.locator('body').textContent() || ''
    expect(updatedContent).toContain(updatedName)

    // DELETE (if delete button exists)
    const deleteButton = page.getByTestId(/org-delete-button-/).first()
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click()
      
      // Handle confirmation modal if present
      const confirmDelete = page.getByTestId('confirm-delete')
      if (await confirmDelete.isVisible().catch(() => false)) {
        await confirmDelete.click()
      }
      
      await waitForNavigation(page, { timeout: 15000 })
      
      // Verify deletion
      const finalContent = await page.locator('body').textContent() || ''
      expect(finalContent).not.toContain(updatedName)
    }
  })
})
```

## Additional Resources

- [Office Routes Testing Guide](./office-routes-testing-guide.md) - Complete testing guide
- [data-testid Conventions](./data-testid-conventions.md) - Naming conventions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

**Last Updated**: November 13, 2025  
**Requirement**: REQ-2 (Task 26)

