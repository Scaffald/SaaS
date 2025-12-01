# Contributing to the Playwright Test Suite

This guide will help you write effective, maintainable Playwright tests for the SCF-Scaffald application.

## Table of Contents

- [Test Writing Guidelines](#test-writing-guidelines)
- [Naming Conventions](#naming-conventions)
- [Using Fixtures and Helpers](#using-fixtures-and-helpers)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Test Writing Guidelines

### Test File Structure

Each test file should follow this structure:

```typescript
import { test, expect, type Page } from '@playwright/test'
import { signInAsAdmin, signInAsTestUser } from './playwright-helpers/auth'
import { navigateToOfficeRoute, OFFICE_ROUTES } from './helpers/office-navigation'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: authentication, navigation, etc.
    await signInAsAdmin(page)
    await navigateToOfficeRoute(page, OFFICE_ROUTES.SOME_ROUTE)
  })

  test.describe('Sub-Feature Group', () => {
    test('should do something specific', async ({ page }) => {
      // Arrange
      const testData = generateTestData()

      // Act
      await performAction(page, testData)

      // Assert
      await expect(page.getByText(/expected text/i)).toBeVisible()
    })
  })
})
```

### Test Organization

Group related tests using `test.describe()`:

- **Top Level**: Feature name (e.g., "Office • Users Management")
- **Second Level**: Functionality group (e.g., "Users List Page", "Create User Flow")
- **Test Level**: Specific behavior (e.g., "should display edit button for users")

Example:
```typescript
test.describe('Office • Users Management', () => {
  test.describe('Users List Page', () => {
    test('should navigate to users list and load correctly', async ({ page }) => {
      // Test implementation
    })

    test('should display users table with data', async ({ page }) => {
      // Test implementation
    })
  })

  test.describe('Create User Flow', () => {
    test('should load create user form', async ({ page }) => {
      // Test implementation
    })
  })
})
```

## Naming Conventions

### Test File Names

Follow the pattern: `test-{area}-{feature}.spec.ts`

**Examples:**
- `test-office-users.spec.ts` - Office user management
- `test-office-jobs.spec.ts` - Office job management
- `test-office-applications-kanban.spec.ts` - Applications Kanban board
- `test-news-feed.spec.ts` - News feed widget
- `test-prerequisites.spec.ts` - Prerequisites form

### Test Names

Use descriptive names that explain **what** the test does and **what** it expects:

**Good:**
```typescript
test('should display edit button for users')
test('should filter users by first name')
test('should create organization successfully with all fields')
test('requires reason for rejection and confirms')
```

**Bad:**
```typescript
test('test users page') // Too vague
test('button works') // Doesn't explain what button or what "works" means
test('test1') // Not descriptive
```

### data-testid Naming

Follow the pattern: `{component}-{field|action}-{type}`

**Examples:**
- `user-first-name-input` - Input field
- `user-edit-button-{id}` - Action button with ID
- `org-industry-select` - Select dropdown
- `kanban-column-{status}` - Kanban column
- `status-change-confirm-button` - Modal button

See `TEST_IDS.md` for a complete reference.

## Using Fixtures and Helpers

### Authentication Helpers

Always use authentication helpers instead of manually logging in:

```typescript
import {
  signInAsTestUser,
  signInAsAdmin,
  signInAsSuperAdmin,
} from './playwright-helpers/auth'

// Use in beforeEach or individual tests
test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page)
})
```

### Navigation Helpers

Use navigation helpers for consistent routing:

```typescript
import {
  navigateToOfficeRoute,
  OFFICE_ROUTES,
  buildOfficeRoute,
} from './helpers/office-navigation'

// Navigate to static route
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)

// Navigate to dynamic route
await navigateToOfficeRoute(page, buildOfficeRoute.userEdit('user-123'))
```

### Form Helpers

Use form helpers for consistent form interaction:

```typescript
import {
  fillTextField,
  selectDropdown,
  fillTextarea,
  acceptCheckbox,
  submitForm,
} from './helpers/office-forms'

await fillTextField(page, 'Organization Name', 'Test Org')
await selectDropdown(page, 'Industry', 'Construction')
await fillTextarea(page, 'Description', 'A test organization')
await acceptCheckbox(page, 'Privacy Policy')
await submitForm(page, { buttonText: 'Save' })
```

### Test Data Generators

Use test data generators for realistic, randomized data:

```typescript
import {
  generateOrganizationData,
  generateJobData,
  generateUserProfileData,
} from './helpers/office-test-data'

const orgData = generateOrganizationData()
await fillTextField(page, 'Organization Name', orgData.name)
await fillTextField(page, 'Website', orgData.website)
```

## Best Practices

### 1. Use Explicit Waits

Always wait for elements to be visible before interacting:

```typescript
// Good
await expect(page.getByTestId('user-edit-button-123')).toBeVisible()
await page.getByTestId('user-edit-button-123').click()

// Bad
await page.getByTestId('user-edit-button-123').click() // May fail if not visible yet
```

### 2. Use data-testid for Reliable Selectors

Prefer `data-testid` over text or CSS selectors:

```typescript
// Good - Stable and specific
await page.getByTestId('user-first-name-input').fill('John')

// Less good - Can break with text changes
await page.getByPlaceholder('Enter first name').fill('John')

// Bad - Fragile, breaks with CSS changes
await page.locator('.input-field-container input[name="firstName"]').fill('John')
```

### 3. Group Assertions Logically

Group related assertions together:

```typescript
// Good
test('should display user profile fields', async ({ page }) => {
  await expect(page.getByTestId('user-first-name-input')).toBeVisible()
  await expect(page.getByTestId('user-last-name-input')).toBeVisible()
  await expect(page.getByTestId('user-email-input')).toBeVisible()
})

// Less good - Split across multiple tests unnecessarily
test('should display first name field', async ({ page }) => {
  await expect(page.getByTestId('user-first-name-input')).toBeVisible()
})

test('should display last name field', async ({ page }) => {
  await expect(page.getByTestId('user-last-name-input')).toBeVisible()
})
```

### 4. Make Tests Independent

Each test should be able to run independently:

```typescript
// Good - Creates its own test data
test('should edit organization', async ({ page }) => {
  const orgData = generateOrganizationData()

  // Create organization for this test
  await createOrganization(page, orgData)

  // Now test editing it
  await navigateToOfficeRoute(page, buildOfficeRoute.orgEdit(orgData.id))
  // ... test editing
})

// Bad - Depends on previous test's data
test('should create organization', async ({ page }) => {
  // Creates org with known ID
})

test('should edit organization', async ({ page }) => {
  // Assumes org from previous test exists
  await navigateToOfficeRoute(page, '/office/organizations/edit/known-id')
})
```

### 5. Use Descriptive Variable Names

```typescript
// Good
const organizationName = 'Acme Construction Co.'
const industryOption = 'Construction'
const expectedSuccessMessage = 'Organization created successfully'

// Bad
const org = 'Acme Construction Co.'
const val = 'Construction'
const msg = 'Organization created successfully'
```

### 6. Handle Async Properly

Always await asynchronous operations:

```typescript
// Good
await page.goto('/office/users')
await page.getByTestId('create-user-button').click()
await expect(page).toHaveURL(/\/office\/users\/create/)

// Bad
page.goto('/office/users') // Missing await
await page.getByTestId('create-user-button').click()
```

### 7. Use Page Object Patterns for Complex Workflows

For complex workflows, create helper functions:

```typescript
// helpers/user-workflows.ts
export async function createUser(page: Page, userData: UserData) {
  await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_CREATE)
  await fillTextField(page, 'First Name', userData.firstName)
  await fillTextField(page, 'Last Name', userData.lastName)
  await fillTextField(page, 'Email', userData.email)
  await submitForm(page)
  await expect(page.getByText(/user created/i)).toBeVisible()
  return userData
}

// In test file
test('should edit newly created user', async ({ page }) => {
  const user = await createUser(page, generateUserProfileData())
  await navigateToOfficeRoute(page, buildOfficeRoute.userEdit(user.id))
  // ... test editing
})
```

### 8. Clean Up Test Data (Optional)

While our strategy is to preserve test data for manual verification, you can optionally clean up if needed:

```typescript
test('should delete organization', async ({ page }) => {
  const org = await createOrganization(page, generateOrganizationData())

  // Test deletion
  await page.getByTestId(`org-delete-button-${org.id}`).click()
  await page.getByRole('button', { name: /confirm/i }).click()

  // Verify deletion
  await expect(page.getByText(org.name)).not.toBeVisible()
})
```

## Common Patterns

### Pattern 1: Testing CRUD Operations

```typescript
test.describe('Organization Management', () => {
  let testOrg: OrganizationData

  test('should create organization', async ({ page }) => {
    testOrg = generateOrganizationData()

    await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)
    await fillTextField(page, 'Organization Name', testOrg.name)
    await selectDropdown(page, 'Industry', testOrg.industry)
    await submitForm(page)

    await expect(page.getByText(/created successfully/i)).toBeVisible()
  })

  test('should list organization', async ({ page }) => {
    await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATIONS_INDEX)
    await expect(page.getByText(testOrg.name)).toBeVisible()
  })

  test('should edit organization', async ({ page }) => {
    await navigateToOfficeRoute(page, buildOfficeRoute.orgEdit(testOrg.id))

    const newName = `${testOrg.name} Updated`
    await fillTextField(page, 'Organization Name', newName)
    await submitForm(page)

    await expect(page.getByText(/updated successfully/i)).toBeVisible()
  })

  test('should delete organization', async ({ page }) => {
    await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATIONS_INDEX)
    await page.getByTestId(`org-delete-button-${testOrg.id}`).click()
    await page.getByRole('button', { name: /confirm delete/i }).click()

    await expect(page.getByText(testOrg.name)).not.toBeVisible()
  })
})
```

### Pattern 2: Testing Search and Filters

```typescript
test('should filter users by search term', async ({ page }) => {
  const searchTerm = 'john'

  await page.getByPlaceholder(/search/i).fill(searchTerm)
  await page.waitForTimeout(500) // Wait for debounce

  const results = page.locator('[data-testid^="user-row-"]')
  const count = await results.count()

  // Verify all results contain search term
  for (let i = 0; i < count; i++) {
    const text = await results.nth(i).textContent()
    expect(text?.toLowerCase()).toContain(searchTerm)
  }
})
```

### Pattern 3: Testing Form Validation

```typescript
test('should validate required fields', async ({ page }) => {
  await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)

  // Try to submit without filling required fields
  await submitForm(page)

  // Verify validation errors appear
  await expect(page.getByTestId('name-error')).toBeVisible()
  await expect(page.getByTestId('industry-error')).toBeVisible()
  await expect(page.getByTestId('name-error')).toHaveText(/required/i)
})
```

### Pattern 4: Testing Modals and Dialogs

```typescript
test('should confirm deletion in modal', async ({ page }) => {
  await page.getByTestId('user-delete-button-123').click()

  // Verify modal appears
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText(/are you sure/i)).toBeVisible()

  // Confirm deletion
  await page.getByRole('button', { name: /confirm/i }).click()

  // Verify modal closes and action completes
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText(/deleted successfully/i)).toBeVisible()
})
```

### Pattern 5: Testing Drag and Drop (Kanban)

```typescript
test('should drag application to different column', async ({ page }) => {
  const cardSelector = page.getByTestId('kanban-card-app-123')
  const targetColumn = page.getByTestId('kanban-column-interview')

  await cardSelector.dragTo(targetColumn)

  // Verify modal appears for status change confirmation
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByTestId('status-change-confirm-button').click()

  // Verify card moved to new column
  await expect(
    targetColumn.locator('[data-testid="kanban-card-app-123"]')
  ).toBeVisible()
})
```

## Troubleshooting

### Tests Timing Out

**Problem**: Tests timeout waiting for page loads or elements

**Solutions**:
1. Verify dev server is running (`pnpm dev`)
2. Verify Supabase is running (`pnpm supa start`)
3. Check authentication credentials are correct
4. Increase timeout for slow operations:
   ```typescript
   await page.goto('/office/users', { timeout: 60000 })
   ```
5. Use more specific selectors that load faster

### Flaky Tests

**Problem**: Tests pass sometimes and fail other times

**Solutions**:
1. Add explicit waits for elements:
   ```typescript
   await expect(page.getByTestId('element')).toBeVisible()
   await page.getByTestId('element').click()
   ```
2. Wait for network requests to complete:
   ```typescript
   await page.waitForLoadState('networkidle')
   ```
3. Use test data that doesn't conflict (randomized data)
4. Make tests independent (don't rely on previous test state)

### Authentication Failures

**Problem**: Tests fail during authentication

**Solutions**:
1. Verify test users exist in database (run `pnpm supa:seed`)
2. Check `playwright-helpers/auth.ts` for correct credentials
3. Verify Supabase URL and keys are correct
4. Try signing in manually with test credentials to verify they work

### Elements Not Found

**Problem**: Tests can't find elements with `data-testid`

**Solutions**:
1. Verify the element exists in the component
2. Check `TEST_IDS.md` for correct test ID name
3. Use Playwright Inspector to verify selectors:
   ```bash
   pnpm exec playwright test --debug
   ```
4. Try alternative selectors (role, text, placeholder)

### Database State Issues

**Problem**: Tests fail due to unexpected database state

**Solutions**:
1. Reset database between test runs:
   ```bash
   pnpm supa db reset
   pnpm supa:seed
   ```
2. Use randomized test data that won't conflict
3. Create fresh test data in `beforeEach` hooks
4. Don't rely on specific IDs or existing data

## Adding New Tests

### Step-by-Step Guide

1. **Create test file**:
   ```bash
   touch tests/test-office-{feature}.spec.ts
   ```

2. **Import dependencies**:
   ```typescript
   import { test, expect } from '@playwright/test'
   import { signInAsAdmin } from './playwright-helpers/auth'
   import { navigateToOfficeRoute, OFFICE_ROUTES } from './helpers/office-navigation'
   ```

3. **Add describe block**:
   ```typescript
   test.describe('Office • Feature Name', () => {
     test.beforeEach(async ({ page }) => {
       await signInAsAdmin(page)
     })

     // Tests here
   })
   ```

4. **Write tests following patterns above**

5. **Run tests**:
   ```bash
   pnpm exec playwright test tests/test-office-{feature}.spec.ts
   ```

6. **Debug if needed**:
   ```bash
   pnpm exec playwright test tests/test-office-{feature}.spec.ts --debug
   ```

## Code Review Checklist

Before submitting tests for review:

- [ ] Tests follow naming conventions
- [ ] Tests use authentication helpers
- [ ] Tests use data-testid selectors where available
- [ ] Tests are independent (can run in any order)
- [ ] Tests have descriptive names
- [ ] No hard-coded waits (`page.waitForTimeout(5000)`) unless necessary
- [ ] Tests use test data generators for realistic data
- [ ] Tests have proper arrange-act-assert structure
- [ ] All async operations are awaited
- [ ] Tests pass consistently (run 3+ times to verify)

## Questions?

If you have questions about testing:
1. Check existing test files for examples
2. Review this guide and `README.md`
3. Check `TEST_IDS.md` for available test IDs
4. Ask the team in Slack

Happy testing! 🎭
