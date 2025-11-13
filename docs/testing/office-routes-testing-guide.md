# Office Routes Testing Guide

Comprehensive guide for testing `/office/*` admin routes using Playwright. This guide covers authentication, navigation, form testing, modal interactions, and best practices for maintaining reliable E2E tests.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Navigation](#navigation)
- [Testing Patterns](#testing-patterns)
- [Wait Strategies](#wait-strategies)
- [Helper Functions](#helper-functions)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

## Overview

The office admin test suite provides comprehensive E2E testing for all `/office` admin routes accessible to users with the 'office' role. The suite includes 140+ test cases across 7 test files covering:

- User management (list, edit, search)
- Job management (create, edit, publish)
- Organization management (CRUD operations)
- Applications Kanban board (drag-and-drop, status changes)
- University management
- News feed widget
- Prerequisites form (first-time login flow)

### Test Suite Structure

```
tests/
├── test-office-users.spec.ts          # 35 tests - User management
├── test-office-jobs.spec.ts           # 16 tests - Job management
├── test-office-organizations.spec.ts  # 23 tests - Organization CRUD
├── test-office-applications-kanban.spec.ts  # 18 tests - Kanban board
├── test-office-universities.spec.ts   # ~20 tests - University management
├── test-news-feed.spec.ts             # 12 tests - News feed widget
├── test-prerequisites.spec.ts         # 15 tests - Prerequisites form
├── helpers/
│   ├── office-navigation.ts           # Navigation helpers
│   ├── office-forms.ts                # Form interaction helpers
│   ├── office-test-data.ts            # Test data generators
│   └── kanban-helpers.ts              # Kanban board helpers
└── playwright-helpers/
    ├── auth.ts                        # Authentication helpers
    └── prerequisites.ts               # Prerequisites form helpers
```

## Getting Started

### Prerequisites

Before running office tests, ensure:

1. **Supabase is running**: `pnpm supa start`
2. **Development server is running**: `pnpm web`
3. **Admin user exists**: `ewongagent@gmail.com` (or super-admin user)
4. **Test database is seeded**: `pnpm supa:seed`
5. **Auth state files exist**: `tests/.auth/super-admin.json`

### Quick Start

```bash
# Run all office tests
pnpm exec playwright test tests/test-office-*.spec.ts

# Run specific test suite
pnpm exec playwright test tests/test-office-users.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test tests/test-office-users.spec.ts --headed

# Debug tests
pnpm exec playwright test tests/test-office-users.spec.ts --debug
```

## Authentication

Office tests use pre-authenticated storage state to avoid repeated authentication flows. The super-admin user (`tests/.auth/super-admin.json`) has the 'office' role required for accessing `/office` routes.

### Using Storage State

```typescript
import { test } from '@playwright/test'

// Use super-admin auth state for all tests in this file
test.use({ storageState: 'tests/.auth/super-admin.json' })

test.describe('Office • Feature', () => {
  test('should access office route', async ({ page }) => {
    // Already authenticated, navigate directly
    await page.goto('/office/users')
  })
})
```

### Creating Auth States

Auth states are created using the `tests/setup/create-auth-states.ts` script. See [Authentication Setup](#authentication-setup) for details.

## Navigation

Use the `office-navigation` helpers for consistent navigation patterns:

```typescript
import { navigateToOfficeRoute, OFFICE_ROUTES } from './helpers/office-navigation'

// Navigate to a specific route
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)

// Use route constants
OFFICE_ROUTES.DASHBOARD              // /office
OFFICE_ROUTES.USERS_INDEX            // /office/users/index
OFFICE_ROUTES.USER_CREATE            // /office/users/create
OFFICE_ROUTES.JOBS_INDEX             // /office/jobs/index
OFFICE_ROUTES.JOB_CREATE             // /office/jobs/create
OFFICE_ROUTES.ORGANIZATIONS_INDEX    // /office/organizations/index
OFFICE_ROUTES.ORGANIZATION_CREATE    // /office/organizations/create

// Dynamic routes
import { buildOfficeRoute } from './helpers/office-navigation'
await navigateToOfficeRoute(page, buildOfficeRoute.userEdit(userId))
await navigateToOfficeRoute(page, buildOfficeRoute.jobEdit(jobId))
```

### Wait for Page Load

Always wait for pages to fully load after navigation:

```typescript
import { navigateToOfficeRoute, waitForPageLoad } from './helpers/office-navigation'

await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
await waitForPageLoad(page)  // Waits for React hydration and loading states
```

## Testing Patterns

### Form Testing

**Pattern**: Test form fields, validation, and submission

```typescript
test('should create organization successfully', async ({ page }) => {
  // 1. Navigate to create page
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
  await waitForPageLoad(page)

  // 2. Wait for form fields
  const nameInput = page.getByTestId('org-name-input')
  await expect(nameInput).toBeVisible({ timeout: 10000 })

  // 3. Fill form fields
  await nameInput.fill('Test Organization')
  await page.getByTestId('org-industry-select').selectOption('Construction')

  // 4. Submit form
  await page.getByTestId('save-button').click()

  // 5. Wait for navigation/response
  await waitForNavigation(page, { timeout: 15000 })

  // 6. Verify success (redirect to list page)
  expect(page.url()).toContain('/office/organizations')
})
```

**Key Points**:
- Always wait for form fields to be visible before interacting
- Use `data-testid` selectors for reliability
- Wait for navigation/API responses after form submission
- Verify success state (redirect, success message, etc.)

### Modal Testing

**Pattern**: Test modal open, interaction, and close

```typescript
test('requires reason for rejection and confirms', async ({ page }) => {
  // 1. Open modal (via drag-and-drop or button click)
  await dragApplicationToColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)
  await page.waitForTimeout(1000)  // Wait for modal animation

  // 2. Verify modal is visible
  const modal = page.getByRole('dialog')
  await expect(modal.first()).toBeVisible()

  // 3. Interact with modal
  const confirmButton = page.getByTestId('status-change-confirm-button')
  await expect(confirmButton).toBeDisabled()  // Verify initial state

  await page.getByTestId('status-change-reason-input').fill('Not qualified')
  await expect(confirmButton).toBeEnabled()  // Verify state change

  // 4. Submit modal
  await confirmButton.click()

  // 5. Wait for modal to close and state to update
  await page.waitForTimeout(2000)
  await expect(modal.first()).not.toBeVisible()

  // 6. Verify result
  const isInRejected = await verifyApplicationInColumn(page, candidateName, KANBAN_COLUMNS.REJECTED)
  expect(isInRejected).toBe(true)
})
```

**Key Points**:
- Wait for modal animations before interacting
- Test modal state changes (disabled/enabled buttons)
- Wait for modal to close after submission
- Verify state changes persist after modal closes

### Drag-and-Drop Testing (Kanban)

**Pattern**: Test Kanban board drag-and-drop operations

```typescript
import { dragApplicationToColumn, getKanbanSummary } from './helpers/kanban-helpers'

test('should move application to interview column', async ({ page }) => {
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

  // 3. Wait for state update
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

**Key Points**:
- Use helper functions for drag-and-drop operations
- Wait for animations and state updates
- Verify both UI state (card position) and data state (counts)

### List/Table Testing

**Pattern**: Test list pages, search, and pagination

```typescript
test('should filter users by search term', async ({ page }) => {
  // 1. Navigate to list page
  await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
  await waitForPageLoad(page)

  // 2. Wait for search input
  const searchInput = page.getByTestId('search-input')
  await expect(searchInput).toBeVisible({ timeout: 10000 })

  // 3. Perform search
  await searchInput.fill('John')
  await page.waitForTimeout(500)  // Wait for debounce

  // 4. Verify results
  const pageContent = await page.locator('body').textContent() || ''
  expect(pageContent).toMatch(/John/i)
})
```

**Key Points**:
- Wait for search input to be visible
- Account for debounce delays
- Verify results appear in page content or table

### Validation Testing

**Pattern**: Test form validation and error states

```typescript
test('should show validation errors for required fields', async ({ page }) => {
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
  await waitForPageLoad(page)

  // Try to submit without filling required fields
  await page.getByTestId('save-button').click()

  // Wait for validation errors
  await page.waitForTimeout(500)

  // Check for error messages
  const nameError = page.getByTestId('name-error')
  await expect(nameError).toBeVisible({ timeout: 5000 })

  // Verify error message content
  const errorText = await nameError.textContent()
  expect(errorText).toMatch(/required/i)
})
```

## Wait Strategies

Proper wait strategies are critical for reliable tests. Avoid arbitrary timeouts where possible.

### Page Load Waits

```typescript
// Pattern 1: Page load + selector
await page.goto('/office/users')
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="main-content"]')
```

### API Response Waits

```typescript
// Pattern 2: Wait for API response
const responsePromise = page.waitForResponse(url => url.includes('/api/users'))
await page.click('[data-testid="search-input"]')
await responsePromise
```

### Modal Waits

```typescript
// Pattern 3: Wait for modal to appear
await page.click('[data-testid="open-modal"]')
await page.waitForSelector('[data-testid="modal-container"]:visible')
```

### Element Disappear Waits

```typescript
// Pattern 4: Wait for element to disappear
await page.waitForSelector('[data-testid="loading-spinner"]:hidden')
```

### Helper-Based Waits

```typescript
import { waitForPageLoad, waitForNavigation } from './helpers/office-navigation'

// Use helper functions for consistent wait patterns
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
await waitForPageLoad(page)

// After form submission
await waitForNavigation(page, { timeout: 15000 })
```

**Best Practices**:
- Always wait for page loads after navigation
- Wait for selectors before interacting with elements
- Use `waitForResponse` for API-dependent operations
- Avoid `waitForTimeout` unless absolutely necessary (animations)
- Use helper functions for common wait patterns

## Helper Functions

### Navigation Helpers

See `tests/helpers/office-navigation.ts`:

- `navigateToOfficeRoute(page, route)` - Navigate to office route
- `waitForPageLoad(page)` - Wait for page to fully load
- `waitForNavigation(page)` - Wait for navigation after actions
- `waitForLoadingComplete(page)` - Wait for loading indicators

### Form Helpers

See `tests/helpers/office-forms.ts`:

- `fillTextField(page, label, value)` - Fill text input by label
- `selectDropdown(page, label, value)` - Select dropdown option
- `submitForm(page, options)` - Submit form with navigation wait
- `waitForValidationErrors(page)` - Check for validation errors

### Kanban Helpers

See `tests/helpers/kanban-helpers.ts`:

- `dragApplicationToColumn(page, name, column)` - Drag card to column
- `getKanbanSummary(page)` - Get count summary of all columns
- `verifyApplicationInColumn(page, name, column)` - Verify card in column
- `getKanbanColumn(page, columnName)` - Get column locator

### Test Data Helpers

See `tests/helpers/office-test-data.ts`:

- `generateJobData()` - Generate randomized job data
- `generateOrganizationData()` - Generate randomized org data
- `generateTestId()` - Generate unique test ID

## Running Tests

### Run All Office Tests

```bash
pnpm exec playwright test tests/test-office-*.spec.ts
```

### Run Specific Test Suite

```bash
pnpm exec playwright test tests/test-office-users.spec.ts
```

### Run Tests in Headed Mode

```bash
pnpm exec playwright test tests/test-office-users.spec.ts --headed
```

### Debug Tests

```bash
pnpm exec playwright test tests/test-office-users.spec.ts --debug
```

### Run with Reporter

```bash
pnpm exec playwright test tests/test-office-*.spec.ts --reporter=html,list
```

### Run Single Test

```bash
pnpm exec playwright test tests/test-office-users.spec.ts -g "should filter users"
```

### Run with Single Worker (Debug Flaky Tests)

```bash
pnpm exec playwright test tests/test-office-*.spec.ts --workers=1
```

## Troubleshooting

### Tests Fail with "Element not visible"

**Cause**: Element hasn't loaded yet or is hidden

**Solution**: Add proper wait before interacting

```typescript
// Bad
await page.getByTestId('save-button').click()

// Good
await page.waitForSelector('[data-testid="save-button"]')
await page.getByTestId('save-button').click()
```

### Tests Fail with Navigation Timeout

**Cause**: Navigation taking longer than default timeout

**Solution**: Increase timeout or wait for specific condition

```typescript
await waitForNavigation(page, { timeout: 15000 })
```

### Tests Are Flaky (Pass Sometimes, Fail Other Times)

**Cause**: Race conditions or timing issues

**Solution**: 
1. Add proper wait strategies (see [Wait Strategies](#wait-strategies))
2. Use `waitForResponse` for API-dependent operations
3. Run tests with `--workers=1` to isolate parallelization issues

### Tests Fail with "Storage state not found"

**Cause**: Auth state file doesn't exist

**Solution**: Run auth state creation script

```bash
pnpm exec tsx tests/setup/create-auth-states.ts
```

### Tests Fail with "Route not accessible"

**Cause**: User doesn't have 'office' role

**Solution**: Use super-admin auth state (`tests/.auth/super-admin.json`)

### Modal Interactions Fail

**Cause**: Modal hasn't fully opened yet

**Solution**: Wait for modal to be visible before interacting

```typescript
await page.waitForTimeout(1000)  // Wait for animation
const modal = page.getByRole('dialog')
await expect(modal.first()).toBeVisible()
```

See [Troubleshooting Guide](./troubleshooting.md) for more detailed solutions.

## Additional Resources

- [data-testid Conventions](./data-testid-conventions.md) - Naming conventions for test IDs
- [Testing Patterns](./testing-patterns.md) - Common testing patterns and examples
- [Troubleshooting](./troubleshooting.md) - Detailed troubleshooting guide
- [TEST_IDS.md](../../tests/TEST_IDS.md) - Complete reference of all test IDs
- [CONTRIBUTING.md](../../tests/CONTRIBUTING.md) - Contributing guidelines

---

**Last Updated**: November 13, 2025  
**Requirement**: REQ-2 (Task 26)  
**Test Coverage**: 140+ tests across 7 test files

