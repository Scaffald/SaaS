# Route Task Review & Improved Templates

## Overview

This document reviews and improves the "route-explore" tasks in vibe-kanban to ensure they properly guide agents to:
1. Use Playwright MCP to explore routes as specific users
2. Fully investigate all features comprehensively
3. Create a script/log of Playwright commands used
4. Create TEST tickets with proper instructions
5. Handle bugs with proper blocking relationships

## User Credentials

- **Super Admin**: `zach@unicorn.love` (password: `password123`)
- **Admin**: `ewongagent@gmail.com` (password: `password123`)
- **Regular User**: `lexis.salah@eths.education.com` (password: `password123`) - Already has working tests

**Note**: Regular user tests already exist and are working. Use them as examples. Focus route-explore tasks on admin and super-admin routes that don't have tests yet.

## Current Template Analysis

The existing `playwright-audit-route` template in `docs/testing/generalized-ui-testing-plan.md` provides a good foundation but needs enhancements to match the requirements above.

## Test Patterns Reference

Existing working tests are located in `tests/` directory:
- Regular user tests: `test-r###-*.spec.ts` (e.g., `test-r001-auth.spec.ts`, `test-r004-profile-general.spec.ts`)
- These tests demonstrate the correct patterns:
  - Import helpers from `tests/playwright-helpers/auth.ts` and `tests/playwright-helpers/profile.ts`
  - Use `signInAsTestUser(page)` for regular users
  - Use `ensureProfileComplete(page)` for regular users after sign-in
  - Navigate with `waitUntil: 'domcontentloaded'` (not `networkidle`)
  - Use `waitForFunction` to wait for loading states
  - Verify page content exists rather than checking specific elements (for basic smoke tests)

## Improved Route-Explore Template

### Title Format
```
{user-type}-route-explore-###: {routePath} — Comprehensive UI exploration using Playwright MCP
```

### Description Template

```markdown
## Context
- **Route**: `{routePath}` (normalized)
- **User Level**: `{userLevel}` ({super-admin|admin|regular})
- **User Credential**: `{userEmail}`
- **Base URL**: `http://localhost:8081` (or appropriate URL)
- **Linked TEST Ticket**: `test-{user-type}-{route-path}` (to be created/updated)

## Objective

Fully and comprehensively investigate ALL features of the page at `{routePath}` using Playwright MCP tools, acting as the user specified above. This exploration will serve as the foundation for creating comprehensive automated tests.

## Prerequisites

- [ ] Vibe-Kanban MCP server running (`npx vibe-kanban`)
- [ ] Playwright MCP tools available
- [ ] Application server running on `{baseUrl}`
- [ ] Authentication helper functions available in `tests/playwright-helpers/auth.ts`
- [ ] Profile completion helpers available in `tests/playwright-helpers/profile.ts`

## Investigation Checklist

### 1. Authentication & Setup
- [ ] Authenticate as `{userEmail}` using Playwright MCP
  - Navigate to `/auth`
  - Enter email and retrieve magic link code from Mailpit (http://127.0.0.1:54324/)
  - Complete authentication flow
- [ ] Complete any blocking profile/onboarding forms if required
- [ ] Navigate to `{routePath}`

### 2. Page Structure & Elements
- [ ] Document ALL visible UI elements:
  - Navigation menus/breadcrumbs
  - Headers/titles
  - Form fields (inputs, selects, checkboxes, radio buttons, textareas)
  - Buttons (primary, secondary, tertiary, icon buttons)
  - Links (internal navigation, external links)
  - Tables/lists/data grids
  - Modals/dialogs
  - Cards/panels
  - Images/icons
  - Empty states
  - Loading states
  - Error states
  - Success messages/notifications

### 3. Interactive Features
- [ ] Test ALL clickable elements:
  - Navigation links
  - Buttons (verify what happens on click)
  - Form submissions
  - Modal triggers
  - Dropdown menus
  - Tabs/accordions
  - Expandable sections
  - Filter controls
  - Search functionality
  - Sort controls
  - Pagination
  - Action menus (edit, delete, etc.)

### 4. Form Interactions
- [ ] For each form on the page:
  - Fill out ALL fields
  - Test validation (required fields, format validation, error messages)
  - Test successful submission
  - Test error states
  - Test reset/clear functionality
  - Document field types, default values, options (for selects)

### 5. Data Display
- [ ] Document:
  - What data is displayed
  - How data is formatted
  - Empty states
  - Loading states
  - Error states (network failures, permission errors)
  - Data dependencies (what needs to exist for page to work)

### 6. Sub-Routes & Navigation
- [ ] Click through ALL navigation elements:
  - Main navigation links
  - Breadcrumbs
  - Modal actions that navigate
  - Inline links
  - Card/item clicks
  - List row clicks
  - Document any new routes discovered (normalize dynamic segments)

### 7. Edge Cases & Error Handling
- [ ] Test with:
  - Invalid data inputs
  - Missing required data
  - Network failures (simulate offline)
  - Permission errors
  - Empty lists/collections
  - Large datasets
  - Special characters in inputs

### 8. Accessibility & UX
- [ ] Document:
  - Keyboard navigation support
  - Screen reader compatibility notes
  - Focus management
  - Color contrast (if obvious issues)
  - Mobile responsiveness (if applicable)

## Playwright MCP Command Log

**CRITICAL**: As you explore, document EVERY Playwright MCP command you use. This log will be used to create the test script.

### Command Log Template
```markdown
### Navigation & Authentication
- `mcp_playwright_browser_navigate({ url: "http://localhost:8081/auth" })`
- `mcp_playwright_browser_type({ element: "Email input", ref: "...", text: "{userEmail}" })`
- `mcp_playwright_browser_click({ element: "Send Magic Link button", ref: "..." })`
- ... (continue documenting all commands)

### Page Exploration
- `mcp_playwright_browser_snapshot()` - Initial page state
- `mcp_playwright_browser_click({ element: "...", ref: "..." })` - Click on [element description]
- `mcp_playwright_browser_fill_form({ fields: [...] })` - Fill form with [data]
- ... (continue documenting all commands)

### Feature Testing
- [Document commands used to test each feature]
```

## Deliverables

### 1. Playwright Script Creation
Create a new vibe-kanban ticket with format: `test-{user-type}-{route-path}: {routePath} — Comprehensive Playwright tests`

**The TEST ticket should include:**

#### Title
```
test-{user-type}-{route-path}: {routePath} — Comprehensive Playwright tests
```

**Note**: Test file naming follows the pattern `test-r###-{descriptive-name}.spec.ts` or `test-a###-{descriptive-name}.spec.ts` or `test-sa###-{descriptive-name}.spec.ts` for regular, admin, and super-admin respectively.

#### Description Template for TEST Ticket
```markdown
## Context
- **Discovered in**: `{user-type}-route-explore-###`
- **Route**: `{routePath}`
- **User Level**: `{userLevel}` ({regular|admin|super-admin})
- **User Credential**: `{userEmail}`

## Test File Location
- **Path**: `tests/test-{prefix}###-{descriptive-name}.spec.ts`
  - Example: `tests/test-r004-profile-general.spec.ts` (regular user)
  - Example: `tests/test-a001-office-users.spec.ts` (admin user)
  - Example: `tests/test-sa001-office-organizations.spec.ts` (super-admin user)
  
**Naming Convention**:
- Regular user: `test-r###-{name}.spec.ts` (e.g., `test-r004-profile-general.spec.ts`)
- Admin user: `test-a###-{name}.spec.ts` (e.g., `test-a001-office-users.spec.ts`)
- Super-admin user: `test-sa###-{name}.spec.ts` (e.g., `test-sa001-office-organizations.spec.ts`)

## Test Implementation Instructions

### 1. File Structure
Create test file following the existing pattern from `tests/test-r*.spec.ts`:

```typescript
// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { signInAsTestUser, signInAsAdmin, signInAsSuperAdmin } from './playwright-helpers/auth'
import { ensureProfileComplete } from './playwright-helpers/profile'

test.describe('{UserLevel} • {routePath}', () => {
  test('navigates and shows {page description} UI', async ({ page }: { page: Page }) => {
    // Use appropriate sign-in helper based on user level:
    // - Regular: await signInAsTestUser(page)
    // - Admin: await signInAsAdmin(page)
    // - Super Admin: await signInAsSuperAdmin(page)
    
    // For regular users, ensure profile is complete:
    // await ensureProfileComplete(page)
    
    // Navigate to route
    await page.goto('{routePath}', { waitUntil: 'domcontentloaded' })
    
    // Verify URL contains route
    expect(page.url()).toContain('{routePath}')
    
    // Wait for loading to complete
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    
    // Brief wait for page to settle
    await page.waitForTimeout(1000)
    
    // Verify page content exists
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })
})
```

### 2. Helper Functions Available

**Authentication** (`tests/playwright-helpers/auth.ts`):
- `signInAsTestUser(page)` - Sign in as regular test user
- `signInAsAdmin(page)` - Sign in as admin user (`ewongagent@gmail.com`)
- `signInAsSuperAdmin(page)` - Sign in as super-admin user (`zach@unicorn.love`)
- `signInAsUser(page, email, password)` - Sign in with custom credentials

**Profile** (`tests/playwright-helpers/profile.ts`):
- `ensureProfileComplete(page)` - Complete profile gate for regular users (safe to call multiple times)

**Fixtures** (`tests/playwright-helpers/fixtures.ts`):
- `getCurrentUserId(page)` - Get current user ID from storage
- `resolveTestUserId(page)` - Get test user ID (falls back to '1')

### 3. Test Coverage Requirements
Based on the exploration in `{user-type}-route-explore-###`, implement tests for:

- [ ] Authentication and navigation to route
- [ ] Page loads and renders correctly
- [ ] All UI elements render correctly
- [ ] All interactive elements work as expected
- [ ] All form fields can be filled and submitted (if applicable)
- [ ] Validation works correctly (if applicable)
- [ ] Error states are handled (if applicable)
- [ ] Success states are displayed (if applicable)
- [ ] Navigation and sub-routes work
- [ ] Edge cases are handled

### 4. Running the Test
```bash
# Run this specific test
npx playwright test tests/test-{prefix}###-{name}.spec.ts

# Run all tests
npx playwright test

# Run with UI mode for debugging
npx playwright test tests/test-{prefix}###-{name}.spec.ts --ui

# Run with headed browser
npx playwright test tests/test-{prefix}###-{name}.spec.ts --headed
```

### 5. Verification Checklist
- [ ] Test file created at correct location following naming convention
- [ ] Test imports correct helpers from `tests/playwright-helpers/`
- [ ] Test uses appropriate sign-in helper (`signInAsTestUser`, `signInAsAdmin`, or `signInAsSuperAdmin`)
- [ ] Test calls `ensureProfileComplete(page)` if regular user
- [ ] Test runs successfully: `npx playwright test tests/test-{prefix}###-{name}.spec.ts`
- [ ] All test cases pass
- [ ] Test is deterministic (runs reliably multiple times)
- [ ] Test uses proper selectors (prefer roles, labels, testIds)
- [ ] Test uses robust waits (not arbitrary sleeps, use `waitForFunction` for loading states)
- [ ] Test handles edge cases

### 6. Branch Information
- **Branch**: `bernier-playwright` (or current branch if different)
- **Commit**: After test passes, commit with message: `test: add {userLevel} tests for {routePath}`
- **Merge**: Once test passes and is verified, merge branch into `bernier-playwright`

### 7. Playwright Commands Reference
The following Playwright MCP commands were used during exploration:

[Paste the command log from route-explore ticket here]

Use these as reference when writing the test, but convert to standard Playwright test syntax using the Playwright test framework. Reference existing tests in `tests/test-r*.spec.ts` for patterns.

## Blocking Dependencies
- [ ] Authentication helpers available (`tests/playwright-helpers/auth.ts`)
- [ ] Profile completion helper available (`tests/playwright-helpers/profile.ts`) - for regular users
- [ ] Any BUG tickets (list below)

## Related Tickets
- Exploration: `{user-type}-route-explore-###`
- Bug Tickets: [List any BUG tickets created]

## Notes
- Add any additional context, gotchas, or important implementation details here
- Reference existing working tests: `tests/test-r001-auth.spec.ts`, `tests/test-r004-profile-general.spec.ts`, `tests/test-r006-profile-skills.spec.ts`, etc.
```

### 2. Bug Ticket Creation (If Bugs Found)

If ANY bugs are discovered during exploration:

1. **Create BUG ticket** with format: `BUG-####: [Short Description]`

2. **BUG Ticket Description Template**:
```markdown
## Bug Details
- **Route**: `{routePath}`
- **User Level**: `{userLevel}`
- **User Credential**: `{userEmail}`
- **Severity**: {Critical|High|Medium|Low}
- **Discovered During**: `{user-type}-route-explore-###`

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]
... (detailed steps)

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Browser/Environment
- Browser: [Chrome|Firefox|Safari]
- Version: [version]
- OS: [macOS|Windows|Linux]
- Screen Size: [if relevant]

## Console Errors
[Paste console errors, screenshots, or logs]

## Screenshots/Evidence
[Attach screenshots or describe visual evidence]

## Impact
- **Affected User Types**: [Regular|Admin|Super Admin|All]
- **Related Route/Feature**: `{routePath}`
- **Workaround Available**: [Yes/No - describe if yes]

## Playwright Commands That Triggered Bug
[Paste the Playwright MCP commands that revealed the bug]
```

3. **Update TEST Ticket**:
   - Add BUG ticket ID to "Blocking Dependencies" section
   - Mark TEST ticket as `blocked` by BUG ticket
   - Add note: "This test ticket is blocked until BUG-#### is resolved. Once resolved, update test coverage to ensure it covers the functionality where the bug existed."

4. **Update Route-Explore Ticket**:
   - Document BUG ticket in "Bugs Found" section
   - Link to BUG ticket

## Execution Summary Template

After completing the exploration, append to the route-explore ticket description:

```markdown
---

## Execution Summary ({YYYY-MM-DD})

### Commands Used
- Playwright MCP commands: [count] total commands executed
- Navigation commands: [count]
- Interaction commands: [count]
- Observation commands: [count]

### Routes Explored
- Primary route: `{routePath}`
- Sub-routes discovered: [list any new routes found]

### Tickets Created
- TEST ticket: `test-{user-type}-{route-path}`
- BUG tickets: [list any BUG tickets created]

### Files Created/Modified
- Command log: [location if saved to file]
- Screenshots: [location if saved]

### Bugs Found
- `BUG-####`: [Brief description]
- `BUG-####`: [Brief description]

### Next Steps
- [ ] TEST ticket created with all required information
- [ ] All bugs documented and blocking relationships set
- [ ] Command log attached to TEST ticket
- [ ] Ready for test implementation
```

## Key Improvements Over Current Template

1. **Explicit Playwright MCP Usage**: Clear instructions to use Playwright MCP tools
2. **Specific User Credentials**: Super Admin and Admin emails explicitly stated
3. **Command Logging**: Requirement to document all Playwright commands used
4. **TEST Ticket Instructions**: Detailed template for creating TEST tickets with:
   - File location guidance
   - Running instructions
   - Verification checklist
   - Branch information
5. **Bug Handling**: Clear process for creating BUG tickets and setting blocking relationships
6. **Comprehensive Checklist**: More detailed exploration checklist covering all aspects

## Status Transitions

- **Start**: Set status to `in-progress` when beginning exploration
- **Update**: Append Execution Summary with progress
- **Complete**: Set status to `done` when:
  - All checklist items completed
  - TEST ticket created with full instructions
  - All bugs documented (if any)
  - Command log attached

## References
- Main plan: `docs/testing/generalized-ui-testing-plan.md`
- Audit guidance: `tests/AUDIT-TASKS-GUIDANCE.md`
- Vibe-Kanban rules: `.cursor/rules/vibe-kanban.mdc`

