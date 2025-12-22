# Signup Page Exploration Findings

## Summary

The signup page exploration could not be completed due to a **dev server issue**, not a problem with the signup page itself. The esbuild service crashed, preventing the React application from loading.

## Root Cause

```
Error: The service is no longer running
Location: esbuild service in Vite dev server
File: /src/main.tsx returns HTTP 500
```

The Vite dev server's esbuild service has stopped working, which prevents any JavaScript from being transpiled and served to the browser. This is why all pages appear blank in the Playwright tests.

## Actual Signup Page Structure (from source code analysis)

Based on code review of `/Users/mattbernier/projects/unicorn/UNI-Construct/apps/forsured-web/src/pages/Signup.tsx`:

### Authentication Requirement
- **CRITICAL**: The signup page requires a logged-in user from AuthContext
- Shows loading spinner if no user is present
- Redirects to appropriate dashboard if user already has a completed profile

### Two-Step Signup Flow

#### Step 1: Industry Selection (`currentStep === 'industry'`)

**Data-testid attributes:**
- `industry-{slug}` - Industry selection cards (e.g., `industry-construction`, `industry-property-management`)
- `signup-error` - Error message container
- `user-set-types-error` - Error loading industries
- `no-user-set-types` - No industries available message
- `broker-invitation-link` - Link to show broker invitation UI

**User flow:**
1. User sees: "Welcome to ForSured, {user.name}!"
2. Header text: "Let's get you set up. First, select your industry."
3. If Scaffald company exists: Shows company connection card with checkbox
4. Industry cards fetched via tRPC: `trpc.userSetTypes.listActive.useQuery()`
5. Each industry card shows:
   - Icon (Factory, Home, or Briefcase)
   - Industry name
   - Description (if available)
6. Clicking an industry card → `handleIndustrySelect()` → moves to Step 2

#### Step 2: Role Selection (`currentStep === 'role'`)

**Data-testid attributes:**
- `back-to-industry` - Button to return to industry selection
- `user-type-manager` - Manager/GC role card
- `user-type-contractor` - Contractor/Subcontractor role card
- `broker-invitation-link` - Link to show broker invitation UI (also visible here)

**User flow:**
1. Header text changes to: "Great! Now choose your role in {selectedUserSetType.name}."
2. Back button appears: "Back to industry selection"
3. Two role cards displayed:
   - **Manager Card**:
     - Icon: Building2
     - Title: Uses lexicon `managerLabelSingular` (e.g., "General Contractor")
     - Description: "I hire {contractorLabelPlural} and manage projects"
   - **Contractor Card**:
     - Icon: HardHat
     - Title: Uses lexicon `contractorLabelSingular` (e.g., "Subcontractor")
     - Description: "I work on projects for {managerLabelPlural}"
4. Clicking role → `handleTypeSelect()` → creates profile → navigates to onboarding

### Broker Invitation Section

**Always visible** at bottom of both steps.

**Data-testid attributes:**
- `broker-invitation-link` - "Enter Invitation Code" button
- `invitation-code-input` - Text input for invitation code
- `verify-invitation-button` - Submit invitation code (disabled if code < 4 chars)
- `cancel-invitation-button` - Cancel and hide invitation UI

**User flow:**
1. Initially shows: "Are you an insurance broker?" + "Enter Invitation Code" button
2. Clicking button shows invitation form with:
   - Shield icon + "Broker Invitation" header
   - Instructions text
   - Input field (placeholder: "Enter code (e.g., ABCD1234)", maxLength: 20)
   - Input automatically converts to uppercase
   - "Verify & Continue" button (enabled when code >= 4 chars)
   - "Cancel" button
3. Submitting invitation → `handleBrokerInvitation()` → validates code → creates broker profile → navigates to broker onboarding

## What E2E Tests Should Look For

### Test 1: Industry Selection (requires authenticated user)
```typescript
// After authentication
await expect(page.getByText(/Welcome to ForSured/i)).toBeVisible();
await expect(page.getByText(/select your industry/i)).toBeVisible();

// Check for industry cards (dynamic, fetched from API)
const industryCards = page.locator('[data-testid^="industry-"]');
await expect(industryCards.first()).toBeVisible();

// Optional: Check for Scaffald company connection UI
const companyCard = page.getByText(/Connect this company to ForSured/i);
// May or may not be visible depending on user's Scaffald account

// Click first industry
await industryCards.first().click();
```

### Test 2: Role Selection
```typescript
// After clicking industry
await expect(page.getByText(/How will you use ForSured/i)).toBeVisible();
await expect(page.locator('[data-testid="back-to-industry"]')).toBeVisible();

// Manager card
const managerCard = page.locator('[data-testid="user-type-manager"]');
await expect(managerCard).toBeVisible();
await expect(managerCard).toContainText(/hire/i); // Description includes "hire"

// Contractor card
const contractorCard = page.locator('[data-testid="user-type-contractor"]');
await expect(contractorCard).toBeVisible();
await expect(contractorCard).toContainText(/work on projects/i);

// Click manager role
await managerCard.click();
// Should navigate to /manager/onboarding or /contractor/onboarding
```

### Test 3: Broker Invitation
```typescript
// Broker link should be visible on both steps
const brokerLink = page.locator('[data-testid="broker-invitation-link"]');
await expect(brokerLink).toBeVisible();
await brokerLink.click();

// Invitation UI appears
const codeInput = page.locator('[data-testid="invitation-code-input"]');
await expect(codeInput).toBeVisible();

const verifyButton = page.locator('[data-testid="verify-invitation-button"]');
await expect(verifyButton).toBeDisabled(); // Disabled initially

// Type invitation code
await codeInput.fill('TEST1234');
await expect(verifyButton).toBeEnabled(); // Enabled with >= 4 chars

// Cancel button
const cancelButton = page.locator('[data-testid="cancel-invitation-button"]');
await expect(cancelButton).toBeVisible();
await cancelButton.click();

// UI should hide
await expect(codeInput).not.toBeVisible();
```

## Lexicon System Integration

The signup page uses the **configurable lexicon system** (REQ-4):
- Industry labels are fetched from database: `user_set_types` table
- Role cards display dynamic labels based on selected industry:
  - `managerLabelSingular` / `managerLabelPlural`
  - `contractorLabelSingular` / `contractorLabelPlural`
- Examples:
  - Construction: "General Contractor" hires "Subcontractors"
  - Property Management: "Property Manager" hires "Service Providers"

## User Set Type Data Structure

```typescript
interface UserSetType {
  id: string;
  name: string;
  slug: string;
  managerLabelSingular: string;
  managerLabelPlural: string;
  contractorLabelSingular: string;
  contractorLabelPlural: string;
  description: string | null;
}
```

## Profile Creation Flow

1. User selects industry → `selectedUserSetType` set
2. User selects role (manager or subcontractor) → calls `handleTypeSelect()`
3. `createProfile()` service function called with:
   ```typescript
   {
     scaffald_user_id: user.id,
     user_type: 'manager' | 'subcontractor',
     user_set_type_id: selectedUserSetType.id,
     onboarding_completed: false,
     company_connected: connectCompany && scaffaldCompany !== null,
     onboarding_step: 0,
   }
   ```
4. Profile created in database
5. AuthContext updated with new profile
6. Navigate to onboarding: `/manager/onboarding` or `/contractor/onboarding`

## Broker Flow Differences

Brokers use invitation-based signup:
1. No industry selection (brokers are industry-agnostic)
2. `user_set_type_id` is NOT set for brokers
3. Must have valid invitation code from `broker_invitations` table
4. Invitation validated before profile creation
5. Navigate to: `/broker/onboarding`

## Action Required

### Immediate: Restart Dev Server

The dev server needs to be restarted to fix the esbuild crash:

```bash
# Kill current dev server (if running)
# Then restart:
cd /Users/mattbernier/projects/unicorn/UNI-Construct
pnpm dev
```

### After Restart: Complete Exploration

Once the dev server is restarted, run:

```bash
cd apps/forsured-web
npx playwright test tests/e2e/explore-signup-authenticated.spec.ts --headed
```

This will:
1. Authenticate using mock OAuth
2. Navigate to /signup
3. Explore industry selection step
4. Click first industry
5. Explore role selection step
6. Show broker invitation UI
7. Capture screenshots and HTML source

## Test Update Recommendations

The existing `auth.spec.ts` tests need to be updated based on findings:

1. **Remove assumptions about immediate email/password fields**
   - Signup page does NOT have email/password inputs
   - It has a two-step wizard for industry + role selection

2. **Add industry selection step**
   - Tests must wait for industry cards to load (API call)
   - Handle dynamic industry options
   - Handle loading states and errors

3. **Add role selection step**
   - Tests must select a role after industry
   - Verify lexicon labels are displayed correctly
   - Handle back navigation

4. **Update broker tests**
   - Broker signup requires invitation code
   - Test invitation validation
   - Test invalid invitation handling

5. **Add Scaffald company connection tests**
   - If user has Scaffald company, checkbox should appear
   - Test both checked and unchecked states

## Files Referenced

- Source: `/Users/mattbernier/projects/unicorn/UNI-Construct/apps/forsured-web/src/pages/Signup.tsx`
- Router: `/Users/mattbernier/projects/unicorn/UNI-Construct/apps/forsured-web/src/router.tsx`
- Exploration script: `/Users/mattbernier/projects/unicorn/UNI-Construct/apps/forsured-web/tests/e2e/explore-signup-authenticated.spec.ts`
- Debug script: `/Users/mattbernier/projects/unicorn/UNI-Construct/apps/forsured-web/tests/e2e/debug-page-load.spec.ts`

## Next Steps

1. ✅ Restart dev server to fix esbuild crash
2. ⏳ Run authenticated exploration script to get screenshots
3. ⏳ Update auth.spec.ts based on actual signup flow
4. ⏳ Create dedicated signup tests for industry/role selection
5. ⏳ Create dedicated broker invitation tests
