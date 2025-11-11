# Test ID Reference (`data-testid` Attributes)

This document provides a comprehensive reference of all `data-testid` attributes available in the application for Playwright testing.

## Table of Contents

- [Naming Convention](#naming-convention)
- [Office Components](#office-components)
  - [Job Form](#job-form)
  - [Organization Form](#organization-form)
  - [User Form](#user-form)
  - [University Form](#university-form)
  - [List Views](#list-views)
  - [Kanban Board](#kanban-board)
- [Widget Components](#widget-components)
  - [Prerequisites Widget](#prerequisites-widget)
  - [News Feed Widget](#news-feed-widget)
- [Quick Reference](#quick-reference)

## Naming Convention

Test IDs follow a consistent naming pattern:

**Pattern**: `{component}-{field|action}-{type}[-{id}]`

**Components**:
- `job-` - Job-related fields
- `org-` - Organization-related fields
- `user-` - User-related fields
- `university-` - University-related fields
- `prereq-` - Prerequisites form fields
- `news-` - News feed fields
- `kanban-` - Kanban board elements
- `status-change-` - Status change modal elements

**Types**:
- `-input` - Text input fields
- `-select` - Dropdown selectors
- `-button` - Clickable buttons
- `-checkbox` - Checkbox inputs
- `-textarea` - Multi-line text areas

**Dynamic IDs**:
Some test IDs include dynamic values (marked with `{id}` in this document):
- `{id}` - Entity ID (e.g., `user-edit-button-abc123`)
- `{status}` - Status value (e.g., `kanban-column-interview`)

---

## Office Components

### Job Form

**Location**: `packages/core/features/office/components/JobForm.tsx`

**Form Fields**:
- `job-organization-select` - Organization dropdown selector
- `job-title-input` - Job title text input
- `job-description-input` - Job description textarea
- `job-employment-type-select` - Employment type selector (Full-time, Part-time, etc.)
- `job-remote-option-select` - Remote work option selector (Remote, Hybrid, On-site)
- `job-pay-min-input` - Minimum pay range input
- `job-pay-max-input` - Maximum pay range input
- `job-pay-type-select` - Pay type selector (Hourly, Salary, etc.)
- `job-position-level-input` - Position level input

**Action Buttons**:
- `job-cancel-button` - Cancel button
- `job-save-draft-button` - Save as draft button
- `job-publish-button` - Publish job button

**Usage Example**:
```typescript
await page.getByTestId('job-title-input').fill('Senior Software Engineer')
await page.getByTestId('job-employment-type-select').selectOption('Full-time')
await page.getByTestId('job-publish-button').click()
```

---

### Organization Form

**Location**: `packages/core/features/office/components/OrganizationForm.tsx`

**Form Fields**:
- `org-name-input` - Organization name text input
- `org-slug-input` - Organization slug (URL-safe identifier)
- `org-industry-select` - Industry dropdown selector
- `org-logo-input` - Logo upload input
- `org-visibility-select` - Visibility setting selector (Public, Private, etc.)

**Action Buttons**:
- `save-button` - Save organization button
- `cancel-button` - Cancel button

**Usage Example**:
```typescript
await page.getByTestId('org-name-input').fill('Acme Construction')
await page.getByTestId('org-industry-select').selectOption('Construction')
await page.getByTestId('save-button').click()
```

---

### User Form

**Location**: `packages/core/features/office/components/UserForm.tsx`

**Profile Section**:
- `user-first-name-input` - First name text input
- `user-last-name-input` - Last name text input
- `user-display-name-input` - Display name text input
- `user-bio-input` - Bio textarea

**Private Section**:
- `user-email-input` - Email text input (typically read-only)
- `user-phone-input` - Phone number text input
- `user-birth-date-input` - Birth date input
- `user-location-input` - Location/address input

**Employment Section**:
- `user-employment-status-input` - Employment status input
- `user-job-search-status-input` - Job search status input
- `user-years-experience-input` - Years of experience input
- `user-current-title-input` - Current job title input
- `user-current-employer-input` - Current employer input

**Action Buttons** (appear twice in form - top and bottom):
- `save-button` - Save user changes
- `cancel-button` - Cancel and go back

**Usage Example**:
```typescript
await page.getByTestId('user-first-name-input').fill('John')
await page.getByTestId('user-last-name-input').fill('Doe')
await page.getByTestId('user-phone-input').fill('(555) 123-4567')
await page.getByTestId('save-button').first().click() // Use .first() since button appears twice
```

---

### University Form

**Location**: `packages/core/features/office/office-universities-form.tsx`

**Form Fields**:
- `university-name-input` - University name text input
- `university-slug-input` - University slug (auto-generated from name)
- `university-country-input` - Country text input
- `university-country-code-input` - Two-letter country code input
- `university-state-input` - State/province text input (optional)
- `university-domains-input` - Email domains textarea (comma-separated)
- `university-webpages-input` - Web pages textarea (comma-separated URLs)

**Action Buttons**:
- `save-button` - Save university
- `cancel-button` - Cancel and return to list

**Error Messages** (appear when validation fails):
- `name-error` - Name validation error
- `slug-error` - Slug validation error
- `country-error` - Country validation error
- `country-code-error` - Country code validation error
- `domains-error` - Domains validation error
- `webpages-error` - Webpages validation error

**Usage Example**:
```typescript
await page.getByTestId('university-name-input').fill('Stanford University')
await page.getByTestId('university-country-input').fill('United States')
await page.getByTestId('university-country-code-input').fill('US')
await page.getByTestId('university-domains-input').fill('stanford.edu')
await page.getByTestId('save-button').click()

// Check for validation errors
const nameError = await page.getByTestId('name-error').isVisible()
```

---

### List Views

**Locations**:
- `packages/core/features/office/office-jobs-list.tsx`
- `packages/core/features/office/office-organizations-list.tsx`
- `packages/core/features/office/office-users-list.tsx`
- `packages/core/features/office/office-universities-list.tsx`

**Jobs List**:
- `job-edit-button-{id}` - Edit button for specific job
- `job-delete-button-{id}` - Delete button for specific job

**Organizations List**:
- `org-edit-button-{id}` - Edit button for specific organization
- `org-delete-button-{id}` - Delete button for specific organization

**Users List**:
- `user-edit-button-{id}` - Edit button for specific user
- `user-delete-button-{id}` - Delete button for specific user

**Universities List**:
- `university-edit-button-{id}` - Edit button for specific university
- `university-delete-button-{id}` - Delete button for specific university

**Usage Example**:
```typescript
// Click edit button for specific user
const userId = 'abc-123-def-456'
await page.getByTestId(`user-edit-button-${userId}`).click()

// Click delete button for specific organization
const orgId = 'org-789'
await page.getByTestId(`org-delete-button-${orgId}`).click()
```

---

### Kanban Board

**Locations**:
- `packages/core/features/office/applications/components/ApplicationsKanbanBoard.tsx`
- `packages/core/features/office/applications/components/ApplicationStatusChangeModal.tsx`

**Kanban Columns**:
- `kanban-column-new` - New applications column
- `kanban-column-screen` - Screening column
- `kanban-column-interview` - Interview column
- `kanban-column-offer` - Offer column
- `kanban-column-hired` - Hired column
- `kanban-column-rejected` - Rejected column

**Kanban Cards**:
- `kanban-card-{id}` - Individual application card (drag-and-drop enabled)

**Status Change Modal**:
- `status-change-reason-input` - Reason/notes textarea
- `status-change-cancel-button` - Cancel button
- `status-change-confirm-button` - Confirm button
- `reason-error` - Error message when rejection reason is required

**Usage Example**:
```typescript
// Find column
const newColumn = page.getByTestId('kanban-column-new')
await expect(newColumn).toBeVisible()

// Drag card to different column
const card = page.getByTestId('kanban-card-app-123')
const targetColumn = page.getByTestId('kanban-column-interview')
await card.dragTo(targetColumn)

// Handle status change modal
await page.getByTestId('status-change-reason-input').fill('Great candidate!')
await page.getByTestId('status-change-confirm-button').click()

// Verify card moved
await expect(
  targetColumn.locator('[data-testid="kanban-card-app-123"]')
).toBeVisible()
```

---

## Widget Components

### Prerequisites Widget

**Location**: `packages/core/features/prerequisites/PrerequisiteWidget.tsx`

**Personal Information**:
- `prereq-first-name-input` - First name text input
- `prereq-last-name-input` - Last name text input

**User Type Selection**:
- `prereq-user-type-worker-checkbox` - Worker user type checkbox
- `prereq-user-type-employer-checkbox` - Employer user type checkbox
- `prereq-user-type-customer-checkbox` - Customer user type checkbox

**Additional Fields**:
- `prereq-industry-select` - Industry dropdown selector
- `prereq-privacy-checkbox` - Privacy policy agreement checkbox
- `prereq-terms-checkbox` - Terms of service agreement checkbox

**Action Button**:
- `prereq-submit-button` - Submit prerequisites button

**Error Messages** (appear when validation fails):
- `first-name-error` - First name validation error
- `last-name-error` - Last name validation error
- `address-error` - Address validation error
- `user-types-error` - User types selection validation error
- `industry-error` - Industry selection validation error
- `privacy-error` - Privacy policy agreement validation error
- `terms-error` - Terms of service agreement validation error

**Usage Example**:
```typescript
// Fill prerequisites form
await page.getByTestId('prereq-first-name-input').fill('John')
await page.getByTestId('prereq-last-name-input').fill('Doe')
await page.getByTestId('prereq-user-type-worker-checkbox').check()
await page.getByTestId('prereq-industry-select').selectOption('Construction')
await page.getByTestId('prereq-privacy-checkbox').check()
await page.getByTestId('prereq-terms-checkbox').check()
await page.getByTestId('prereq-submit-button').click()

// Check for validation errors
const firstNameError = await page.getByTestId('first-name-error').isVisible()
```

---

### News Feed Widget

**Location**: `packages/core/features/news/NewsWidget.tsx`

**Interactive Elements**:
- `news-feed-select` - Feed selector dropdown (to switch between different news sources)
- `news-refresh-button` - Refresh feed button
- `news-try-again-button` - Try again button (appears in error state)

**Usage Example**:
```typescript
// Switch feed
await page.getByTestId('news-feed-select').selectOption('Construction News')

// Refresh feed
await page.getByTestId('news-refresh-button').click()

// Retry after error
const tryAgainButton = page.getByTestId('news-try-again-button')
if (await tryAgainButton.isVisible()) {
  await tryAgainButton.click()
}
```

---

## Quick Reference

### By Component Type

**Forms** (Input Fields):
```typescript
// Job form
page.getByTestId('job-title-input')
page.getByTestId('job-description-input')
page.getByTestId('job-pay-min-input')

// Org form
page.getByTestId('org-name-input')
page.getByTestId('org-slug-input')

// User form
page.getByTestId('user-first-name-input')
page.getByTestId('user-email-input')
page.getByTestId('user-phone-input')

// University form
page.getByTestId('university-name-input')
page.getByTestId('university-country-input')

// Prerequisites
page.getByTestId('prereq-first-name-input')
page.getByTestId('prereq-industry-select')
```

**Dropdowns** (Select Fields):
```typescript
page.getByTestId('job-organization-select')
page.getByTestId('job-employment-type-select')
page.getByTestId('org-industry-select')
page.getByTestId('org-visibility-select')
page.getByTestId('prereq-industry-select')
page.getByTestId('news-feed-select')
```

**Buttons** (Action Elements):
```typescript
// Form actions
page.getByTestId('save-button')
page.getByTestId('cancel-button')
page.getByTestId('job-publish-button')
page.getByTestId('job-save-draft-button')
page.getByTestId('prereq-submit-button')

// List actions (require ID)
page.getByTestId('user-edit-button-{id}')
page.getByTestId('org-delete-button-{id}')

// Widget actions
page.getByTestId('news-refresh-button')
page.getByTestId('status-change-confirm-button')
```

**Complex Components**:
```typescript
// Kanban
page.getByTestId('kanban-column-new')
page.getByTestId('kanban-card-{id}')

// Modals
page.getByTestId('status-change-reason-input')
page.getByTestId('status-change-cancel-button')
```

---

### By Feature

**User Management**:
```typescript
// List
page.getByTestId('user-edit-button-{id}')
page.getByTestId('user-delete-button-{id}')

// Form
page.getByTestId('user-first-name-input')
page.getByTestId('user-last-name-input')
page.getByTestId('user-email-input')
page.getByTestId('user-phone-input')
page.getByTestId('user-bio-input')
page.getByTestId('save-button')
```

**Job Management**:
```typescript
// List
page.getByTestId('job-edit-button-{id}')
page.getByTestId('job-delete-button-{id}')

// Form
page.getByTestId('job-title-input')
page.getByTestId('job-description-input')
page.getByTestId('job-organization-select')
page.getByTestId('job-employment-type-select')
page.getByTestId('job-publish-button')
```

**Organization Management**:
```typescript
// List
page.getByTestId('org-edit-button-{id}')
page.getByTestId('org-delete-button-{id}')

// Form
page.getByTestId('org-name-input')
page.getByTestId('org-slug-input')
page.getByTestId('org-industry-select')
page.getByTestId('save-button')
```

**University Management**:
```typescript
// List
page.getByTestId('university-edit-button-{id}')
page.getByTestId('university-delete-button-{id}')

// Form
page.getByTestId('university-name-input')
page.getByTestId('university-country-input')
page.getByTestId('university-domains-input')
page.getByTestId('save-button')
```

**Applications (Kanban)**:
```typescript
// Columns
page.getByTestId('kanban-column-new')
page.getByTestId('kanban-column-screen')
page.getByTestId('kanban-column-interview')
page.getByTestId('kanban-column-offer')
page.getByTestId('kanban-column-hired')
page.getByTestId('kanban-column-rejected')

// Cards
page.getByTestId('kanban-card-{id}')

// Modal
page.getByTestId('status-change-reason-input')
page.getByTestId('status-change-confirm-button')
page.getByTestId('status-change-cancel-button')
```

**Prerequisites**:
```typescript
page.getByTestId('prereq-first-name-input')
page.getByTestId('prereq-last-name-input')
page.getByTestId('prereq-user-type-worker-checkbox')
page.getByTestId('prereq-user-type-employer-checkbox')
page.getByTestId('prereq-industry-select')
page.getByTestId('prereq-privacy-checkbox')
page.getByTestId('prereq-terms-checkbox')
page.getByTestId('prereq-submit-button')
```

**News Feed**:
```typescript
page.getByTestId('news-feed-select')
page.getByTestId('news-refresh-button')
page.getByTestId('news-try-again-button')
```

---

## Best Practices

### 1. Use Test IDs as Primary Selectors

**Prefer** test IDs over other selectors for reliability:

```typescript
// Good - Stable across UI changes
await page.getByTestId('user-first-name-input').fill('John')

// Less stable - Breaks if label text changes
await page.getByLabel('First Name').fill('John')

// Fragile - Breaks with CSS changes
await page.locator('input[name="firstName"]').fill('John')
```

### 2. Handle Dynamic IDs Correctly

When using test IDs with dynamic values, construct them properly:

```typescript
const userId = 'abc-123'

// Good - Dynamic construction
await page.getByTestId(`user-edit-button-${userId}`).click()

// Bad - Hardcoded
await page.getByTestId('user-edit-button-abc-123').click() // Won't work with different ID
```

### 3. Check for Existence Before Using

For optional elements, check visibility first:

```typescript
const errorMessage = page.getByTestId('name-error')

if (await errorMessage.isVisible()) {
  const text = await errorMessage.textContent()
  console.log('Error:', text)
}
```

### 4. Use Specific Test IDs Over Generic Selectors

```typescript
// Good - Specific
await page.getByTestId('job-title-input').fill('Software Engineer')

// Bad - Generic
await page.locator('input').first().fill('Software Engineer')
```

---

## Adding New Test IDs

When adding new test IDs to components:

1. **Follow the naming convention**: `{component}-{field}-{type}[-{id}]`
2. **Add to the appropriate component** in this document
3. **Use consistent types**: `-input`, `-select`, `-button`, `-checkbox`, etc.
4. **Test your IDs** before committing:
   ```typescript
   await page.getByTestId('your-new-test-id').isVisible()
   ```
5. **Update this document** with the new test ID

---

**Last Updated**: November 5, 2025
**Requirement**: REQ-2 (Task 14)
**Total Test IDs**: 53+ across 12 components
