# Audit Tasks Guidance for Complete UI Exploration

## Task Dependencies

**Prerequisites (HELPER-001 through HELPER-004):**
- HELPER-001: Set up test fixtures and utilities
- HELPER-002: Create login helper function for magic link authentication
- HELPER-003: Create profile completion helper function (CRITICAL - form uses custom checkbox implementation)
- HELPER-004: Create ensureProfileComplete helper function

## Known Blocker: Profile Form Custom Checkboxes - RESOLVED

**Issue:** The profile completion form uses a custom checkbox implementation (Tamagui `View` component) that doesn't use standard HTML checkboxes.

**Solution:** Click the **text label** next to the checkbox, not the checkbox itself! The form component uses this pattern:

```tsx
<Text flex={1} onPress={() => field.onChange(!field.value)}>
  I accept the Privacy Policy
</Text>
```

**Implementation for HELPER-003:**
```typescript
// Simply click the text label - it has an onPress handler that toggles the checkbox
await page.getByText('Worker seeking employment or keeping options open').click()
await page.getByText('I accept the Privacy Policy').click()
await page.getByText('I accept the Terms of Service').click()
```

**Why this works:**
- The Text component has an `onPress` handler that directly calls `field.onChange(!field.value)`
- This updates React state properly
- Much simpler than trying to click the checkbox div

**Impact:** This form is a HARD BLOCKING gate that redirects users from any route back to `/dashboard` until completed.

## AUDIT-001: Regular User Testing Plan

**User:** `testuser1@example.com`

### Critical Steps

1. **Login Flow**
   - Navigate to `/auth`
   - Enter email: `testuser1@example.com`
   - Click "Send Magic Link"
   - Extract code from Mailpit (http://127.0.0.1:54324/)
   - Enter 6-digit code
   - Wait for dashboard redirect

2. **Profile Completion (BLOCKING)**
   - Dashboard shows profile completion form
   - **YOU MUST COMPLETE THIS FORM** using these techniques:
     - First Name: "Test"
     - Last Name: "User"
     - Address: Type "123 Main St" and wait for autocomplete, or use the individual fields editor
     - Roles: Click the CHECKBOX IMAGE elements (not the text) - try clicking `<img>` elements within checkbox containers
     - Industry: Click combobox, select first available option
     - Privacy Policy: Click the checkbox image element
     - Terms of Service: Click the checkbox image element
   - **If clicks fail, try:**
     - Using `page.locator('img').nth(1)`, `nth(2)`, etc.
     - Using `page.getByRole('img')` and filtering
     - Evaluating JavaScript to trigger change events
     - Using keyboard navigation (Tab + Space/Enter)
   - Click "Complete Profile"
   - Wait for form to disappear

3. **Route Exploration**
   - Navigate through ALL routes in `packages/core/constants/routes.ts`:
     - `/dashboard/profile/general`
     - `/dashboard/profile/employment`
     - `/dashboard/profile/skills`
     - `/dashboard/profile/certifications`
     - `/dashboard/profile/education`
     - `/dashboard/profile/experience`
     - `/dashboard/discover` (and all sub-routes)
     - `/dashboard/discover/map`
     - `/dashboard/discover/workers`
     - `/dashboard/discover/employers`
     - `/dashboard/discover/jobs`
     - `/dashboard/discover/jobs/[id]` (with a real job ID)
     - `/dashboard/users/[userId]` (with a real user ID)
     - `/dashboard/settings` (and all sub-routes)

4. **Form Exploration on Each Page**
   - For every page with forms:
     - Fill out and submit forms
     - Test validation (required fields, formats)
     - Test error states
     - Document all form fields and their behaviors

5. **Data Requirements**
   - May need to seed test data for some pages
   - Create test jobs, users, etc. as needed
   - Document what data is required for each page

## AUDIT-002: Admin User Testing Plan

**User:** `ewongagent@gmail.com`

### Critical Steps

1. **Login Flow** - Same as regular user
2. **Check for Profile Gate** - May or may not need profile completion
3. **Admin-Specific Routes:**
   - Check for `/office` routes
   - `/office/users` and CRUD operations
   - `/office/jobs` and CRUD operations
   - `/office/universities` and CRUD operations
   - `/office/applications` and details
   - `/office/organizations` and CRUD operations
4. **Complete Form Analysis** - Fill out and test ALL admin forms
5. **Permission Testing** - Verify admin-only access

## AUDIT-003: Super Admin Testing Plan

**User:** `zach@unicorn.love`

### Critical Steps

1. **Login Flow** - Same as regular user
2. **Check for Profile Gate** - May already be completed
3. **Super Admin Routes:**
   - All routes from AUDIT-001
   - All routes from AUDIT-002
   - Any additional super admin only routes
4. **System Administration:**
   - User management
   - System configuration
   - Advanced settings
5. **Complete Form Analysis** - Fill out and test ALL endless admin forms

## Common Exploration Techniques

### When Forms Block Progress

1. **Try Multiple Click Targets:**
   ```typescript
   // Try these in order:
   page.getByRole('checkbox', { name: 'Role name' })
   page.locator('input[type="checkbox"]').nth(N)
   page.locator('img').filter({ hasText: /Role name/ })
   page.locator('[aria-label*="Role"]').click()
   ```

2. **Use JavaScript Evaluation:**
   ```typescript
   await page.evaluate(() => {
     const checkbox = document.querySelector('[name="role"]');
     checkbox.dispatchEvent(new Event('change'));
   });
   ```

3. **Keyboard Navigation:**
   ```typescript
   // Tab to focus element, then press Space/Enter
   await page.keyboard.press('Tab');
   await page.keyboard.press('Space');
   ```

4. **Direct DOM Manipulation:**
   ```typescript
   await page.evaluate(() => {
     const input = document.querySelector('input');
     input.value = 'New Value';
     input.dispatchEvent(new Event('input', { bubbles: true }));
   });
   ```

### When Navigation is Blocked

1. **Direct URL Navigation** to known routes
2. **Use Browser DevTools** to inspect structure
3. **Read route files** in codebase for hints
4. **Check conditional rendering** in React components

### Documentation Requirements

For each page you successfully access, document:

1. **Form Fields:**
   - Field name
   - Field type (text, select, checkbox, etc.)
   - Required/optional
   - Validation rules
   - Default values
   - Options for selects

2. **Interactions:**
   - All clickable elements
   - All form inputs
   - All navigation links
   - All modals/popups

3. **States:**
   - Empty state
   - Loading state
   - Populated state
   - Error states
   - Success states

4. **Edge Cases:**
   - What happens with invalid data?
   - What happens with network failure?
   - What happens with empty data?
   - What happens with permissions denied?

## Bug Documentation Process

When you find actual application bugs during the audit:

### Bug vs. Testing Issue

**Bug (create BUG- task):**
- UI doesn't work for real users
- Incorrect validation behavior
- Broken functionality
- Data not saving/loading
- Navigation issues
- Console errors that affect functionality

**Testing Issue (update HELPER/TEST task):**
- Can't automate a test action (testing infrastructure problem)
- Need additional test data/seed data
- Tooling limitations

### Bug-YYYY Task Format

Create tasks with format: `BUG-YYYY: [Short Description]`

Examples:
- `BUG-0001: Profile form address validation rejects valid addresses`
- `BUG-0002: Navigation to /settings crashes browser`
- `BUG-0003: Unable to save profile changes (console error: "Network request failed")`

### Bug Task Content

Include in bug task description:
1. **Steps to Reproduce**
2. **Expected Behavior**
3. **Actual Behavior**
4. **Browser/Environment** (if relevant)
5. **Console Errors** (screenshots or logs)
6. **Severity** (Critical, High, Medium, Low)
7. **Affected User Types** (Regular, Admin, Super Admin)
8. **Related Route/Feature**

### Bug Prioritization

- **Critical**: Blocks core functionality, data loss, security issues
- **High**: Major feature broken, significant UX degradation
- **Medium**: Minor feature issues, workarounds available
- **Low**: Cosmetic issues, edge cases, nice-to-have fixes

## Success Criteria

Each audit is complete when:

1. ✅ Successfully logged in
2. ✅ Completed any blocking profile/onboarding forms
3. ✅ Navigated to and explored ALL routes in the route constants file
4. ✅ Filled out and tested ALL forms on each page
5. ✅ Documented ALL interactive elements
6. ✅ Captured console/network issues
7. ✅ Created vibe-kanban tasks for each major route (TEST-)
8. ✅ Created vibe-kanban tasks for all bugs found (BUG-)
9. ✅ Generated complete markdown and JSON test plans
10. ✅ No routes remain unexplored or undocumented

