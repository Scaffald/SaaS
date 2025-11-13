# data-testid Naming Conventions

Standardized naming conventions for `data-testid` attributes used in Playwright tests for office admin routes.

## Naming Pattern

**Format**: `{component}-{field|action}-{type}[-{id}]`

### Components

| Prefix | Component | Example |
|--------|-----------|---------|
| `job-` | Job-related fields | `job-title-input` |
| `org-` | Organization-related fields | `org-name-input` |
| `user-` | User-related fields | `user-first-name-input` |
| `university-` | University-related fields | `university-name-input` |
| `prereq-` | Prerequisites form fields | `prereq-first-name-input` |
| `news-` | News feed fields | `news-feed-select` |
| `kanban-` | Kanban board elements | `kanban-column-new` |
| `status-change-` | Status change modal elements | `status-change-reason-input` |

### Types

| Suffix | Element Type | Example |
|--------|--------------|---------|
| `-input` | Text input fields | `job-title-input` |
| `-textarea` | Multi-line text areas | `job-description-input` |
| `-select` | Dropdown selectors | `job-employment-type-select` |
| `-button` | Clickable buttons | `save-button` |
| `-checkbox` | Checkbox inputs | `prereq-user-type-worker-checkbox` |
| `-modal` | Modal containers | `status-change-modal` |
| `-column` | Kanban columns | `kanban-column-new` |
| `-card` | Kanban cards | `kanban-card-{id}` |

### Dynamic IDs

Some test IDs include dynamic values for entity-specific elements:

- `{id}` - Entity ID (e.g., `user-edit-button-abc123`)
- `{status}` - Status value (e.g., `kanban-column-interview`)

## Component-Specific Conventions

### Form Containers

**Pattern**: `{feature}-form`

```typescript
// Organization form
<div data-testid="organization-form">
  {/* form fields */}
</div>

// Job form
<div data-testid="job-form">
  {/* form fields */}
</div>
```

### Input Fields

**Pattern**: `{feature}-{field}-input`

```typescript
// Organization form
<input data-testid="org-name-input" />
<input data-testid="org-slug-input" />
<textarea data-testid="org-description-input" />

// Job form
<input data-testid="job-title-input" />
<textarea data-testid="job-description-input" />
<input data-testid="job-pay-min-input" />
<input data-testid="job-pay-max-input" />
```

### Select Fields

**Pattern**: `{feature}-{field}-select`

```typescript
// Organization form
<select data-testid="org-industry-select">
  {/* options */}
</select>

// Job form
<select data-testid="job-organization-select">
  {/* options */}
</select>
<select data-testid="job-employment-type-select">
  {/* options */}
</select>
```

### Buttons

**Pattern**: `{feature}-form-{action}` or `{action}-button`

```typescript
// Generic save/cancel buttons
<button data-testid="save-button">Save</button>
<button data-testid="cancel-button">Cancel</button>

// Feature-specific buttons
<button data-testid="job-publish-button">Publish</button>
<button data-testid="job-save-draft-button">Save Draft</button>
<button data-testid="job-cancel-button">Cancel</button>

// Prerequisites form
<button data-testid="prereq-submit-button">Submit</button>
```

### List Actions

**Pattern**: `{feature}-{action}-button-{id}`

```typescript
// User list actions
<button data-testid="user-edit-button-abc123">Edit</button>
<button data-testid="user-delete-button-abc123">Delete</button>

// Organization list actions
<button data-testid="org-edit-button-xyz789">Edit</button>
<button data-testid="org-delete-button-xyz789">Delete</button>
```

### Modals

**Pattern**: `{feature}-{type}-modal` for containers, `{action}-{feature}` for actions

```typescript
// Status change modal
<div data-testid="status-change-modal" role="dialog">
  <textarea data-testid="status-change-reason-input" />
  <button data-testid="status-change-confirm-button">Confirm</button>
  <button data-testid="status-change-cancel-button">Cancel</button>
</div>

// Delete confirmation modal
<div data-testid="delete-confirmation-modal" role="dialog">
  <button data-testid="confirm-delete">Delete</button>
  <button data-testid="cancel-delete">Cancel</button>
</div>
```

### Kanban Board

**Pattern**: `kanban-{element}-{identifier}`

```typescript
// Columns
<div data-testid="kanban-column-new">New</div>
<div data-testid="kanban-column-screen">Screen</div>
<div data-testid="kanban-column-interview">Interview</div>
<div data-testid="kanban-column-offer">Offer</div>
<div data-testid="kanban-column-hired">Hired</div>
<div data-testid="kanban-column-rejected">Rejected</div>

// Cards (with dynamic ID)
<div data-testid="kanban-card-app-123">Card content</div>
```

### Error Messages

**Pattern**: `{field}-error` or `{error-type}-error`

```typescript
// Field-specific errors
<span data-testid="name-error">Name is required</span>
<span data-testid="email-error">Email is invalid</span>

// Generic error
<span data-testid="form-error">Form has errors</span>
```

## Complete Examples by Component

### Organization Form

```typescript
<form data-testid="organization-form">
  <input data-testid="org-name-input" />
  <input data-testid="org-slug-input" />
  <textarea data-testid="org-description-input" />
  <select data-testid="org-industry-select">
    {/* options */}
  </select>
  <input type="file" data-testid="org-logo-input" />
  <select data-testid="org-visibility-select">
    {/* options */}
  </select>
  
  <button data-testid="save-button">Save</button>
  <button data-testid="cancel-button">Cancel</button>
</form>
```

### Job Form

```typescript
<form data-testid="job-form">
  <select data-testid="job-organization-select">
    {/* options */}
  </select>
  <input data-testid="job-title-input" />
  <textarea data-testid="job-description-input" />
  <select data-testid="job-employment-type-select">
    {/* options */}
  </select>
  <select data-testid="job-remote-option-select">
    {/* options */}
  </select>
  <input data-testid="job-pay-min-input" />
  <input data-testid="job-pay-max-input" />
  <select data-testid="job-pay-type-select">
    {/* options */}
  </select>
  <input data-testid="job-position-level-input" />
  
  <button data-testid="job-cancel-button">Cancel</button>
  <button data-testid="job-save-draft-button">Save Draft</button>
  <button data-testid="job-publish-button">Publish</button>
</form>
```

### User Form

```typescript
<form data-testid="user-form">
  {/* Profile Section */}
  <input data-testid="user-first-name-input" />
  <input data-testid="user-last-name-input" />
  <input data-testid="user-display-name-input" />
  <textarea data-testid="user-bio-input" />
  
  {/* Private Section */}
  <input data-testid="user-email-input" type="email" />
  <input data-testid="user-phone-input" type="tel" />
  <input data-testid="user-birth-date-input" type="date" />
  <input data-testid="user-location-input" />
  
  {/* Employment Section */}
  <input data-testid="user-employment-status-input" />
  <input data-testid="user-job-search-status-input" />
  <input data-testid="user-years-experience-input" type="number" />
  <input data-testid="user-current-title-input" />
  <input data-testid="user-current-employer-input" />
  
  <button data-testid="save-button">Save</button>
  <button data-testid="cancel-button">Cancel</button>
</form>
```

### Prerequisites Form

```typescript
<form data-testid="prereq-form">
  <input data-testid="prereq-first-name-input" />
  <input data-testid="prereq-last-name-input" />
  <input data-testid="prereq-address-input" />
  
  <label>
    <input type="checkbox" data-testid="prereq-user-type-worker-checkbox" />
    Worker
  </label>
  <label>
    <input type="checkbox" data-testid="prereq-user-type-employer-checkbox" />
    Employer
  </label>
  
  <select data-testid="prereq-industry-select">
    {/* options */}
  </select>
  
  <label>
    <input type="checkbox" data-testid="prereq-privacy-checkbox" />
    Accept Privacy Policy
  </label>
  <label>
    <input type="checkbox" data-testid="prereq-terms-checkbox" />
    Accept Terms of Service
  </label>
  
  <button data-testid="prereq-submit-button">Submit</button>
</form>
```

## Usage in Tests

### Basic Usage

```typescript
// Wait for element to be visible
await page.waitForSelector('[data-testid="org-name-input"]')

// Interact with element
await page.getByTestId('org-name-input').fill('Test Organization')

// Verify element state
await expect(page.getByTestId('save-button')).toBeEnabled()
```

### Dynamic IDs

```typescript
// Construct test ID with dynamic value
const userId = 'abc-123'
await page.getByTestId(`user-edit-button-${userId}`).click()

// Or use regex pattern
await page.getByTestId(/user-edit-button-/).first().click()
```

### Multiple Elements

```typescript
// Get all elements with pattern
const editButtons = page.getByTestId(/user-edit-button-/)
const count = await editButtons.count()

// Get first/last
await editButtons.first().click()
await editButtons.last().click()

// Get by index
await editButtons.nth(0).click()
```

## Best Practices

### 1. Use Descriptive Names

**Good**:
```typescript
data-testid="org-name-input"
data-testid="job-publish-button"
data-testid="status-change-confirm-button"
```

**Bad**:
```typescript
data-testid="input1"
data-testid="btn"
data-testid="modal-btn"
```

### 2. Be Consistent

Use the same naming pattern across similar components:

```typescript
// Consistent pattern for all form fields
org-name-input
org-slug-input
org-industry-select

// Consistent pattern for all buttons
save-button
cancel-button
submit-button
```

### 3. Include Component Context

Include the component/feature in the test ID:

```typescript
// Good - Clear which form this belongs to
job-title-input
job-description-input

// Bad - Ambiguous
title-input
description-input
```

### 4. Use Appropriate Suffixes

Use the correct suffix for the element type:

- `-input` for text inputs
- `-textarea` for multi-line inputs
- `-select` for dropdowns
- `-button` for buttons
- `-checkbox` for checkboxes
- `-modal` for modal containers

### 5. Handle Dynamic IDs Properly

For dynamic IDs, construct them in tests:

```typescript
// Good - Construct ID in test
const userId = 'abc-123'
await page.getByTestId(`user-edit-button-${userId}`).click()

// Bad - Hardcoded
await page.getByTestId('user-edit-button-abc-123').click()
```

## Reference

For a complete list of all available test IDs, see:
- [TEST_IDS.md](../../tests/TEST_IDS.md) - Complete reference with examples
- [Office Routes Testing Guide](./office-routes-testing-guide.md) - Testing patterns

---

**Last Updated**: November 13, 2025  
**Requirement**: REQ-2 (Task 26)

