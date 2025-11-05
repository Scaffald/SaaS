# Playwright Tests

This directory contains Playwright E2E tests for the SCF-Neue application using Supabase authentication.

## Setup

1. **Install Playwright** (if not already installed):
   ```bash
   pnpm add -D @playwright/test
   pnpm exec playwright install
   ```

2. **Start Supabase**:
   ```bash
   pnpm supa start
   ```

3. **Start the development server**:
   ```bash
   pnpm web
   ```

## Running Tests

```bash
# Run all tests
pnpm exec playwright test

# Run tests in headed mode
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/example-auth.spec.ts

# Debug tests
pnpm exec playwright test --debug
```

## Authentication Helpers

We provide Supabase authentication helpers similar to Clerk's `@clerk/playwright`:

### Available Functions

```typescript
import {
  signInAsUser,
  signInAsTestUser,
  signInAsAdmin,
  getBearerToken,
  getRegularUserToken,
  getAdminToken,
  TEST_USERS,
} from './playwright-helpers/auth'
```

### Quick Login

```typescript
// Login with seeded test user
await signInAsTestUser(page)

// Login with admin
await signInAsAdmin(page)

// Login with custom credentials
await signInAsUser(page, email, password)
```

### Get Bearer Token for API Testing

```typescript
// Get token for API requests
const token = await getBearerToken(email, password)

// Or use convenience functions
const token = await getRegularUserToken()
const adminToken = await getAdminToken()
```

## Test Users

Pre-seeded users available in your Supabase database:

```typescript
TEST_USERS = {
  regular: {
    email: 'testuser1@example.com',
    password: 'TestUser123!',
  },
  admin: {
    email: 'ewongagent@gmail.com',
    password: 'password123',
  },
  superAdmin: {
    email: 'zach@unicorn.love',
    password: 'password123',
  },
}
```

## Example Usage

See `example-auth.spec.ts` for complete examples of:
- Page authentication tests
- API request testing with bearer tokens
- Different user role testing

## Configuration

Create `playwright.config.ts` in the root to customize:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8081',
    headless: false,
  },
  projects: [
    {
      name: 'authenticated',
      use: {
        storageState: 'tests/.auth/user.json',
      },
    },
  ],
})
```

## Differences from Clerk

Unlike Clerk's `@clerk/playwright`, Supabase doesn't provide an official testing helper. Our custom implementation:

- ✅ Provides similar API to Clerk's helpers
- ✅ Works with Supabase auth
- ✅ Supports bearer tokens for API testing
- ✅ Integrates with your seeded test users
- ⚠️  Requires manual storage state management (unlike Clerk's automatic handling)

---

## Office Admin Test Suite

The office admin test suite provides comprehensive E2E testing for all `/office` admin routes. The suite includes **140+ test cases** across **7 test files** covering user management, job posting, organization management, applications Kanban board, universities, and widget components.

### Test Suite Overview

| Test File | Test Count | Features Tested |
|-----------|------------|-----------------|
| `test-office-users.spec.ts` | 35 | User management (list, edit, search) |
| `test-office-organizations.spec.ts` | 26 | Organization CRUD operations |
| `test-office-applications-kanban.spec.ts` | 18 | Kanban board drag-and-drop, status changes |
| `test-office-jobs.spec.ts` | 16 | Job management (create, edit, publish) |
| `test-prerequisites.spec.ts` | 15 | First-time user prerequisites form |
| `test-news-feed.spec.ts` | 12 | News feed widget functionality |
| `test-office-universities.spec.ts` | ~20 | University management |

**Total**: 140+ comprehensive E2E test cases

### Current Status

⚠️ **Environmental Setup Required**: All tests are currently failing due to environmental issues (auth timeouts, page navigation issues). See `docs/testing/test-suite-bugs-discovered.md` for detailed information on discovered issues and recommended fixes.

**Known Blockers**:
1. Authentication timeout during `signInAsAdmin()` helper
2. Profile completion helper causing page context crashes
3. Office routes failing to load (`/office/*` timeout)
4. Dev server or Supabase may not be running

**Expected Status After Fixes**: ✅ 95%+ passing once environmental issues are resolved

### Documentation

- **`README.md`** (this file) - Complete setup and usage guide
- **`CONTRIBUTING.md`** - Test writing guidelines and best practices
- **`TEST_IDS.md`** - Complete reference of all `data-testid` attributes
- **`docs/testing/test-suite-bugs-discovered.md`** - Detailed bug report and fixes

### Office Test Helpers

Located in `tests/helpers/`, these helpers are specifically designed for testing office admin functionality:

#### Form Helpers (`office-forms.ts`)

```typescript
import {
  fillTextField,
  selectDropdown,
  fillAddressAutocomplete,
  acceptCheckbox,
  toggleSwitch,
  fillTextarea,
  submitForm,
  expandFormSection,
  addListItem,
  removeListItem,
  waitForValidationErrors,
  getValidationErrors,
} from './helpers/office-forms'

// Fill a text field
await fillTextField(page, 'Organization Name', 'Test Org')

// Select from dropdown
await selectDropdown(page, 'Industry', 'Construction')

// Fill address with autocomplete
await fillAddressAutocomplete(page, '123 Main St, Springfield, CA')

// Accept checkboxes
await acceptCheckbox(page, 'Privacy Policy')

// Expand collapsible sections
await expandFormSection(page, 'Compensation & Benefits')

// Submit the form
await submitForm(page, { buttonText: 'Save Changes' })
```

#### Navigation Helpers (`office-navigation.ts`)

```typescript
import {
  navigateToOfficeRoute,
  navigateToOfficeDashboard,
  waitForPageLoad,
  clickNavLink,
  clickButton,
  hasOfficeAccess,
  dismissModal,
  OFFICE_ROUTES,
  buildOfficeRoute,
} from './helpers/office-navigation'

// Navigate to office routes
await navigateToOfficeRoute(page, OFFICE_ROUTES.USERS_INDEX)
await navigateToOfficeDashboard(page)

// Navigate to dynamic routes
await navigateToOfficeRoute(page, buildOfficeRoute.jobEdit('job-123'))

// Wait for page to fully load
await waitForPageLoad(page)

// Check if user has office access
const hasAccess = await hasOfficeAccess(page)
```

#### Test Data Generators (`office-test-data.ts`)

```typescript
import {
  generateRandomName,
  generateRandomEmail,
  generateRandomPhone,
  generateRandomAddress,
  generateOrganizationData,
  generateJobData,
  generateUniversityData,
  generateUserProfileData,
  generateTestData,
} from './helpers/office-test-data'

// Generate random user data
const { firstName, lastName, fullName } = generateRandomName()
const email = generateRandomEmail()
const phone = generateRandomPhone()

// Generate entity-specific data
const orgData = generateOrganizationData()
const jobData = generateJobData()
const universityData = generateUniversityData()

// Or use the generic generator
const testOrg = generateTestData('organization')
```

#### Kanban Board Helpers (`kanban-helpers.ts`)

```typescript
import {
  dragApplicationToColumn,
  verifyApplicationInColumn,
  confirmStatusChange,
  cancelStatusChange,
  clickApplicationCard,
  getKanbanSummary,
  waitForKanbanLoad,
  KANBAN_COLUMNS,
} from './helpers/kanban-helpers'

// Wait for Kanban to load
await waitForKanbanLoad(page)

// Drag application to different column
await dragApplicationToColumn(page, 'John Doe', KANBAN_COLUMNS.INTERVIEW)

// Confirm status change modal
await confirmStatusChange(page)

// Verify card moved to correct column
const isInColumn = await verifyApplicationInColumn(
  page,
  'John Doe',
  KANBAN_COLUMNS.INTERVIEW
)

// Get summary of all columns
const summary = await getKanbanSummary(page)
// { new: 5, screen: 3, interview: 2, offer: 1, hired: 10, rejected: 4 }
```

### Office Test File Naming

Office tests follow the naming pattern: `test-office-{feature}.spec.ts`

Examples:
- `test-office-auth.spec.ts` - Authentication and prerequisites
- `test-office-dashboard.spec.ts` - Dashboard index
- `test-office-applications.spec.ts` - Applications Kanban board
- `test-office-users.spec.ts` - User management
- `test-office-jobs.spec.ts` - Job management
- `test-office-organizations.spec.ts` - Organization management
- `test-office-universities.spec.ts` - University management

### Running Office Tests

```bash
# Run all office tests
pnpm exec playwright test test-office-

# Run specific office test suite
pnpm exec playwright test test-office-users.spec.ts

# Run office tests in headed mode
pnpm exec playwright test test-office- --headed

# Debug office tests
pnpm exec playwright test test-office-users.spec.ts --debug
```

### Office Test Structure

Each office test suite typically includes:

1. **Authentication Setup** - Sign in as admin user
2. **Navigation Tests** - Verify routes load correctly
3. **List/Index Tests** - Test data tables, search, pagination
4. **Create Tests** - Test entity creation with form validation
5. **Edit Tests** - Test entity updates and data persistence
6. **Interaction Tests** - Test specific UI interactions (Kanban, modals, etc.)
7. **Validation Tests** - Test form validation and error handling

### Example Office Test

```typescript
import { test, expect } from '@playwright/test'
import { signInAsAdmin } from './playwright-helpers/auth'
import { navigateToOfficeRoute, OFFICE_ROUTES } from './helpers/office-navigation'
import {
  fillTextField,
  selectDropdown,
  submitForm,
} from './helpers/office-forms'
import { generateOrganizationData } from './helpers/office-test-data'

test.describe('Office Organizations', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  test('should create new organization', async ({ page }) => {
    // Navigate to create page
    await navigateToOfficeRoute(page, OFFICE_ROUTES.ORGANIZATION_CREATE)

    // Generate test data
    const orgData = generateOrganizationData()

    // Fill form
    await fillTextField(page, 'Organization Name', orgData.name)
    await selectDropdown(page, 'Industry', orgData.industry)
    await fillTextField(page, 'Website', orgData.website)

    // Submit
    await submitForm(page, { buttonText: 'Create Organization' })

    // Verify success
    await expect(page.getByText(/organization created/i)).toBeVisible()
  })
})
```

### Test Data Strategy

Office tests use **randomized test data** that is:
- ✅ Generated fresh for each test run
- ✅ Unique to avoid conflicts
- ✅ Preserved after tests (no cleanup) for manual verification
- ✅ Realistic and valid for the application

This approach ensures:
- Tests can run in any order
- No data conflicts between tests
- Easy manual verification of test results
- Realistic test coverage

### Prerequisites

Before running office tests, ensure:
1. ✅ Supabase is running (`pnpm supa start`)
2. ✅ Development server is running (`pnpm web`)
3. ✅ Admin user exists (`ewongagent@gmail.com`)
4. ✅ Test database is seeded with industries and base data



