#!/usr/bin/env node
/**
 * Script to update all route-explore tickets with comprehensive template
 * Based on docs/testing/route-task-review.md
 */

const { execSync } = require('child_process');

// Helper function to build the description
function buildDescription(routePath, userType, userEmail, ticketNumber) {
  const userLevel = userType === 'super-admin' ? 'super-admin' : userType;
  const testPrefix = userType === 'super-admin' ? 'sa' : userType === 'admin' ? 'a' : 'r';
  
  // Normalize route path
  const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;
  
  // Create test file name
  const routeForFileName = normalizedRoute
    .replace(/:/g, '')
    .replace(/\//g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
  const testFileName = `test-${testPrefix}${String(ticketNumber).padStart(3, '0')}-${routeForFileName}.spec.ts`;
  
  // Create test ticket format
  const testTicketFormat = `test-${userType}-${routeForFileName}`;
  
  // Test describe name
  const routeForDescribe = normalizedRoute.replace(/^\//, '').replace(/\//g, ' ');
  
  // Helper function name
  const signInHelper = userType === 'super-admin' ? 'signInAsSuperAdmin' : 
                      userType === 'admin' ? 'signInAsAdmin' : 'signInAsTestUser';
  
  // User level display
  const userLevelDisplay = userLevel === 'super-admin' ? 'Super Admin' : 
                           userLevel === 'admin' ? 'Admin' : 'Regular';

  return `## Context
- **Route**: \`${normalizedRoute}\` (normalized)
- **User Level**: \`${userLevel}\`
- **User Credential**: \`${userEmail}\`
- **Base URL**: \`http://localhost:8081\`
- **Linked TEST Ticket**: \`${testTicketFormat}\` (to be created/updated)

## Objective

Fully and comprehensively investigate ALL features of the page at \`${normalizedRoute}\` using Playwright MCP tools, acting as the ${userLevel} user specified above. This exploration will serve as the foundation for creating comprehensive automated tests.

## Prerequisites

- [ ] Vibe-Kanban MCP server running (\`npx vibe-kanban\`)
- [ ] Playwright MCP tools available
- [ ] Application server running on \`http://localhost:8081\`
- [ ] Authentication helper functions available in \`tests/playwright-helpers/auth.ts\`
- [ ] Profile completion helpers available in \`tests/playwright-helpers/profile.ts\`

## Investigation Checklist

### 1. Authentication & Setup
- [ ] Authenticate as \`${userEmail}\` using Playwright MCP
  - Navigate to \`/auth\`
  - Enter email and retrieve magic link code from Mailpit (http://127.0.0.1:54324/)
  - Complete authentication flow
- [ ] Complete any blocking profile/onboarding forms if required
- [ ] Navigate to \`${normalizedRoute}\`

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
\`\`\`markdown
### Navigation & Authentication
- \`mcp_playwright_browser_navigate({ url: "http://localhost:8081/auth" })\`
- \`mcp_playwright_browser_type({ element: "Email input", ref: "...", text: "${userEmail}" })\`
- \`mcp_playwright_browser_click({ element: "Send Magic Link button", ref: "..." })\`
- ... (continue documenting all commands)

### Page Exploration
- \`mcp_playwright_browser_snapshot()\` - Initial page state
- \`mcp_playwright_browser_click({ element: "...", ref: "..." })\` - Click on [element description]
- \`mcp_playwright_browser_fill_form({ fields: [...] })\` - Fill form with [data]
- ... (continue documenting all commands)

### Feature Testing
- [Document commands used to test each feature]
\`\`\`

## Deliverables

### 1. Playwright Script Creation
Create a new vibe-kanban ticket with format: \`${testTicketFormat}: ${normalizedRoute} — Comprehensive Playwright tests\`

**The TEST ticket should include:**

#### Title
\`\`\`
${testTicketFormat}: ${normalizedRoute} — Comprehensive Playwright tests
\`\`\`

**Note**: Test file naming follows the pattern \`test-${testPrefix}###-{descriptive-name}.spec.ts\` for ${userLevel} user.

#### Description Template for TEST Ticket
\`\`\`markdown
## Context
- **Discovered in**: \`${userType}-route-explore-${String(ticketNumber).padStart(3, '0')}\`
- **Route**: \`${normalizedRoute}\`
- **User Level**: \`${userLevel}\`
- **User Credential**: \`${userEmail}\`

## Test File Location
- **Path**: \`tests/${testFileName}\`

**Naming Convention**:
- ${userLevelDisplay} user: \`test-${testPrefix}###-{name}.spec.ts\` (e.g., \`${testFileName}\`)

## Test Implementation Instructions

### 1. File Structure
Create test file following the existing pattern from \`tests/test-r*.spec.ts\`:

\`\`\`typescript
// @ts-nocheck
import { test, expect, type Page } from '@playwright/test'
import { ${signInHelper} } from './playwright-helpers/auth'
${userType === 'regular' ? 'import { ensureProfileComplete } from \'./playwright-helpers/profile\'\n' : ''}
test.describe('${userLevelDisplay} • ${normalizedRoute}', () => {
  test('navigates and shows ${routeForDescribe} UI', async ({ page }: { page: Page }) => {
    await ${signInHelper}(page)
${userType === 'regular' ? '    await ensureProfileComplete(page)\n' : ''}    await page.goto('${normalizedRoute}', { waitUntil: 'domcontentloaded' })
    expect(page.url()).toContain('${normalizedRoute}')
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Loading...'),
      { timeout: 10000 }
    ).catch(() => {})
    await page.waitForTimeout(1000)
    const pageContent = await page.locator('body').textContent() || ''
    expect(pageContent.length).toBeGreaterThan(0)
  })
})
\`\`\`

### 2. Helper Functions Available

**Authentication** (\`tests/playwright-helpers/auth.ts\`):
- \`${signInHelper}(page)\` - Sign in as ${userLevel} user (\`${userEmail}\`)

${userType === 'regular' ? `**Profile** (\`tests/playwright-helpers/profile.ts\`):\n- \`ensureProfileComplete(page)\` - Complete profile gate for regular users (safe to call multiple times)\n\n` : ''}**Fixtures** (\`tests/playwright-helpers/fixtures.ts\`):
- \`getCurrentUserId(page)\` - Get current user ID from storage
- \`resolveTestUserId(page)\` - Get test user ID (falls back to '1')

### 3. Test Coverage Requirements
Based on the exploration in \`${userType}-route-explore-${String(ticketNumber).padStart(3, '0')}\`, implement tests for:

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
\`\`\`bash
# Run this specific test
npx playwright test tests/${testFileName}

# Run all tests
npx playwright test

# Run with UI mode for debugging
npx playwright test tests/${testFileName} --ui

# Run with headed browser
npx playwright test tests/${testFileName} --headed
\`\`\`

### 5. Verification Checklist
- [ ] Test file created at correct location following naming convention
- [ ] Test imports correct helpers from \`tests/playwright-helpers/\`
- [ ] Test uses appropriate sign-in helper (\`${signInHelper}\`)
${userType === 'regular' ? '- [ ] Test calls \`ensureProfileComplete(page)\` if regular user\n' : ''}- [ ] Test runs successfully: \`npx playwright test tests/${testFileName}\`
- [ ] All test cases pass
- [ ] Test is deterministic (runs reliably multiple times)
- [ ] Test uses proper selectors (prefer roles, labels, testIds)
- [ ] Test uses robust waits (not arbitrary sleeps, use \`waitForFunction\` for loading states)
- [ ] Test handles edge cases

### 6. Branch Information
- **Branch**: \`bernier-playwright\` (or current branch if different)
- **Commit**: After test passes, commit with message: \`test: add ${userLevel} tests for ${normalizedRoute}\`
- **Merge**: Once test passes and is verified, merge branch into \`bernier-playwright\`

### 7. Playwright Commands Reference
The following Playwright MCP commands were used during exploration:

[Paste the command log from route-explore ticket here]

Use these as reference when writing the test, but convert to standard Playwright test syntax using the Playwright test framework. Reference existing tests in \`tests/test-r*.spec.ts\` for patterns.

## Blocking Dependencies
- [ ] Authentication helpers available (\`tests/playwright-helpers/auth.ts\`)
${userType === 'regular' ? '- [ ] Profile completion helper available (\`tests/playwright-helpers/profile.ts\`) - for regular users\n' : ''}- [ ] Any BUG tickets (list below)

## Related Tickets
- Exploration: \`${userType}-route-explore-${String(ticketNumber).padStart(3, '0')}\`
- Bug Tickets: [List any BUG tickets created]

## Notes
- Add any additional context, gotchas, or important implementation details here
- Reference existing working tests: \`tests/test-r001-auth.spec.ts\`, \`tests/test-r004-profile-general.spec.ts\`, \`tests/test-r006-profile-skills.spec.ts\`, etc.
\`\`\`

### 2. Bug Ticket Creation (If Bugs Found)

If ANY bugs are discovered during exploration:

1. **Create BUG ticket** with format: \`BUG-####: [Short Description]\`

2. **BUG Ticket Description Template**:
\`\`\`markdown
## Bug Details
- **Route**: \`${normalizedRoute}\`
- **User Level**: \`${userLevel}\`
- **User Credential**: \`${userEmail}\`
- **Severity**: {Critical|High|Medium|Low}
- **Discovered During**: \`${userType}-route-explore-${String(ticketNumber).padStart(3, '0')}\`

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
- **Related Route/Feature**: \`${normalizedRoute}\`
- **Workaround Available**: [Yes/No - describe if yes]

## Playwright Commands That Triggered Bug
[Paste the Playwright MCP commands that revealed the bug]
\`\`\`

3. **Update TEST Ticket**:
   - Add BUG ticket ID to "Blocking Dependencies" section
   - Mark TEST ticket as \`blocked\` by BUG ticket
   - Add note: "This test ticket is blocked until BUG-#### is resolved. Once resolved, update test coverage to ensure it covers the functionality where the bug existed."

4. **Update Route-Explore Ticket**:
   - Document BUG ticket in "Bugs Found" section
   - Link to BUG ticket

## References
- Main plan: \`docs/testing/generalized-ui-testing-plan.md\`
- Route task review: \`docs/testing/route-task-review.md\`
- Audit guidance: \`tests/AUDIT-TASKS-GUIDANCE.md\`
- Vibe-Kanban rules: \`.cursor/rules/vibe-kanban.mdc\``;
}

// Parse title to extract route, user type, and ticket number
function parseTitle(title) {
  let routePath, userType, ticketNumber;
  
  // Match admin format: admin-route-explore-###: /route/path
  const adminMatch = title.match(/^admin-route-explore-(\d+):\s*(.+)$/);
  if (adminMatch) {
    userType = 'admin';
    ticketNumber = parseInt(adminMatch[1], 10);
    routePath = adminMatch[2].trim();
    return { routePath, userType, ticketNumber };
  }
  
  // Match super-admin format: super-admin-route-explore-### • /route/path — Manual exploration
  const superAdminMatch = title.match(/^super-admin-route-explore-(\d+)\s+•\s+(.+?)\s+—/);
  if (superAdminMatch) {
    userType = 'super-admin';
    ticketNumber = parseInt(superAdminMatch[1], 10);
    routePath = superAdminMatch[2].trim();
    return { routePath, userType, ticketNumber };
  }
  
  // Fallback: try to extract any route-explore pattern
  const fallbackMatch = title.match(/(?:admin|super-admin)-route-explore-(\d+)[:•]\s*(.+?)(?:\s+—|$)/);
  if (fallbackMatch) {
    userType = title.includes('super-admin') ? 'super-admin' : 'admin';
    ticketNumber = parseInt(fallbackMatch[1], 10);
    routePath = fallbackMatch[2].trim();
    return { routePath, userType, ticketNumber };
  }
  
  throw new Error(`Could not parse title: ${title}`);
}

// Get user email based on user type
function getUserEmail(userType) {
  if (userType === 'super-admin') {
    return 'zach@unicorn.love';
  } else if (userType === 'admin') {
    return 'ewongagent@gmail.com';
  } else {
    return 'lexis.salah@eths.education.com';
  }
}

// Main execution
console.log('This script generates descriptions for route-explore tickets.');
console.log('To use it, you need to call the vibe-kanban MCP update_task function');
console.log('with the generated description for each ticket.\n');

// Example usage
const testTitles = [
  'admin-route-explore-039: /office/users/:id/edit',
  'super-admin-route-explore-040 • /office/users/create — Manual exploration'
];

console.log('Example parsing:');
testTitles.forEach(title => {
  try {
    const { routePath, userType, ticketNumber } = parseTitle(title);
    const userEmail = getUserEmail(userType);
    console.log(`\nTitle: ${title}`);
    console.log(`  Route: ${routePath}`);
    console.log(`  User Type: ${userType}`);
    console.log(`  Ticket Number: ${ticketNumber}`);
    console.log(`  User Email: ${userEmail}`);
    console.log(`  Description length: ${buildDescription(routePath, userType, userEmail, ticketNumber).length} chars`);
  } catch (error) {
    console.error(`Error parsing "${title}":`, error.message);
  }
});

console.log('\n✅ Script ready! The buildDescription function can be used to generate descriptions.');
console.log('Export this module or use it with vibe-kanban MCP tools.');

module.exports = { buildDescription, parseTitle, getUserEmail };

