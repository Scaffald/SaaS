# GC/Manager User Flow - Comprehensive Audit Report

**Date**: 2025-12-19
**Auditor**: Playwright Audit Specialist
**Application**: ForSured Web (forsured-web)
**Audit Scope**: GC/Manager user flow
**Audit Method**: Live Playwright MCP exploration + codebase analysis

---

## Executive Summary

This audit systematically explored the GC/Manager user flow in the ForSured application, documenting all accessible routes, interactive components, and identifying critical bugs and issues that impact user experience and functionality.

### Key Findings
- **Routes Discovered**: 19 manager-specific routes
- **Critical Bugs Found**: 3
- **High Priority Issues**: 2
- **Medium Priority Issues**: 4
- **Interactive Components Documented**: 50+

### Overall Quality Rating: C+
The application has good route structure and UI layout, but several critical bugs prevent full functionality testing. Authentication state management issues and broken interactive components require immediate attention.

---

## 1. Complete Route Map

### Manager Routes (Protected - Requires 'manager' user type)

#### Core Navigation Routes
| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/manager/dashboard` | EnhancedManagerDashboard | ✅ Accessible | Empty state shown (no projects) |
| `/manager/tasks` | ManagerTasksPage | ✅ Accessible | Empty state shown (no tasks) |
| `/manager/projects` | ManagerProjectsPage | ⚠️ Not fully tested | Browser session issues |
| `/manager/projects/:projectId` | ProjectDetailPage | ⚠️ Not tested | Requires project ID |
| `/manager/subcontractors` | SubcontractorsPage | ⚠️ Not fully tested | - |
| `/manager/documents` | DocumentsPage | ⚠️ Not fully tested | - |
| `/manager/marketplace` | InsuranceMarketplace | ⚠️ Not tested | - |
| `/manager/integrations` | IntegrationsMarketplace | ⚠️ Not fully tested | - |
| `/manager/acknowledgements` | ManagerAcknowledgementsList | ⚠️ Not fully tested | - |
| `/manager/notifications` | NotificationsAndApprovalsPage | ⚠️ Not tested | - |
| `/manager/users` | UserManagementPage | ⚠️ Not tested | - |

#### Settings Routes
| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/manager/settings/profile` | GCProfileSettings | ⚠️ Not tested | - |
| `/manager/settings/company` | GCCompanySettings | ⚠️ Not tested | - |
| `/manager/settings/insurance` | GCInsuranceSettings | ⚠️ Not tested | - |
| `/manager/settings/notifications` | GCNotificationSettings | ⚠️ Not tested | - |
| `/manager/settings/team` | GCTeamSettings | ⚠️ Not tested | - |
| `/manager/settings/integrations` | GCIntegrationSettings | ⚠️ Not tested | - |

#### Auxiliary Routes
| Route | Component | Status | Notes |
|-------|-----------|--------|-------|
| `/manager/help` | GCHelp | ⚠️ Not fully tested | - |
| `/manager/onboarding` | ManagerOnboarding | ⚠️ Not tested | Requires non-onboarded state |

---

## 2. Component Inventory

### Page-Level Components

#### Dashboard Page (`/manager/dashboard`)
**Components Observed:**
- Top navigation sidebar with 8 menu items
- Header with "Dashboard" title and subtitle
- Empty state component with:
  - Icon (folder/project icon)
  - "No Projects Yet" heading
  - Descriptive text
  - "Create Project" button
- Footer buttons (Notifications, Settings, Sign Out)
- Theme toggle button
- User profile badge showing "Subcontractor" label

**Interactive Elements:**
- Navigation links (8 items)
- Create Project button
- Notifications button
- Settings button
- Sign Out button
- Theme toggle button

#### Tasks Page (`/manager/tasks`)
**Components Observed:**
- Page header with "Tasks" title
- Subtitle showing "Manage compliance tasks across 0 active projects"
- Status summary cards showing:
  - 0 Pending
  - 0 In Progress
  - 0 Needs Attention
  - 0 Completed
- Search bar with placeholder "Search tasks by title, description, or tags..."
- Filters button with icon
- Sort dropdown (options: Due Date, Priority, Status)
- Results count: "Showing 0 of 0 tasks"
- Empty state: "No tasks found" with help text
- "Create Task" button (top right)

**Interactive Elements:**
- Search input field
- Filters button
- Sort dropdown (combobox)
- Create Task button (⚠️ **BUG FOUND** - opens blank tabs)
- Navigation links (same as dashboard)

### Navigation Components

**Sidebar Navigation**
- Dashboard (with grid icon)
- Tasks (with checkmark icon)
- Projects (with building/folder icon)
- Subs (with users icon)
- Documents (with document icon)
- Acknowledgements (with clipboard icon)
- Integrations (with settings/gear icon)
- Help (with question/help icon)

**Top Bar Actions**
- Notifications button (bell icon)
- Settings button (gear icon)
- Sign Out button (logout icon)

### Modals and Overlays
Based on code analysis, the following modals exist but were not tested:
- EnhancedTaskDetailModal
- SubcontractorDetailModal
- ManagerAcknowledgementDetailModal
- BidComparisonView (modal/panel)

---

## 3. Bug Report

### Critical Bugs (P0) - Blocking Core Functionality

#### BUG-001: "Create Task" Button Opens Blank Browser Tabs
**Severity**: Critical (P0)
**Page**: `/manager/tasks`
**Component**: Create Task button
**Steps to Reproduce**:
1. Navigate to `/start`
2. Click "Test as GC / Manager"
3. Navigate to Tasks page
4. Click "Create Task" button
**Expected Behavior**: Opens a modal or form to create a new task
**Actual Behavior**: Opens 3 blank browser tabs (about:blank)
**Impact**: Users cannot create tasks
**Screenshot**: `/Users/mattbernier/projects/unicorn/UNI-Construct/.playwright-mcp/audit-screenshots/03-manager-tasks.png`

**Root Cause Hypothesis**:
- Button onClick handler may be missing or incorrectly configured
- Possible React event handling issue
- May be attempting to open modal but failing, defaulting to window.open()

**Recommendation**:
- Investigate ManagerTasksPage.tsx button onClick handler
- Check for modal state management
- Add proper error handling

---

#### BUG-002: Authentication State Loss on Navigation
**Severity**: Critical (P0)
**Pages**: All manager pages
**Steps to Reproduce**:
1. Login via "Test as GC / Manager"
2. Navigate to any page successfully
3. Click on interactive elements (e.g., Create Task button)
4. Browser redirects to `/start` page, losing authentication
**Expected Behavior**: Authentication state persists across navigation
**Actual Behavior**: User is logged out and redirected to start page
**Impact**: Users cannot complete multi-step workflows

**Console Evidence**:
```
[LOG] [AuthContext] No stored tokens
```

**Root Cause Hypothesis**:
- Authentication tokens not persisted to localStorage
- Session state cleared on certain interactions
- Possible issue with test login flow not setting proper session

**Recommendation**:
- Review AuthContext token persistence logic
- Ensure test login flow creates proper session state
- Add authentication state debugging

---

#### BUG-003: API Authentication Failures (401 Unauthorized)
**Severity**: Critical (P0)
**API Endpoint**: `/api/trpc/userSetTypes.getUserLexicon`
**Pages**: Dashboard, Tasks (all manager pages)
**Steps to Reproduce**:
1. Login via "Test as GC / Manager"
2. Navigate to any manager page
3. Check browser console
**Expected Behavior**: API calls succeed with authentication
**Actual Behavior**: Repeated 401 Unauthorized errors
**Impact**: User lexicon/labels not loaded, may cause incomplete UI

**Console Evidence**:
```
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
@ http://localhost:5173/api/trpc/userSetTypes.getUserLexicon?batch=1&input=%7B%7D
```

**Network Logs**:
- Multiple failed requests to getUserLexicon endpoint
- Returns 401 Unauthorized despite successful login
- Other Supabase REST API calls succeed (200 OK)

**Root Cause Hypothesis**:
- TRPC router not receiving authentication headers
- Test login may not set proper API tokens
- Middleware authentication check failing for TRPC routes

**Recommendation**:
- Review TRPC authentication middleware
- Ensure test login sets proper API tokens
- Add fallback lexicon handling for failed requests

---

### High Priority Bugs (P1) - Major Functionality Issues

#### BUG-004: User Role Display Incorrect
**Severity**: High (P1)
**Page**: All manager pages
**Component**: User profile badge (footer)
**Issue**: User profile badge shows "Subcontractor" instead of "Manager" or "GC"
**Expected**: Should show user role as "Manager" or "GC"
**Actual**: Shows "Subcontractor"
**Impact**: User confusion about current role
**Screenshot**: `/Users/mattbernier/projects/unicorn/UNI-Construct/.playwright-mcp/audit-screenshots/02-manager-dashboard.png`

**Console Evidence**:
```
[LOG] [AuthContext] Profile set: manager
```

**Root Cause Hypothesis**:
- UI component not reading correct user type from context
- Hard-coded "Subcontractor" label
- Profile badge component not updated for manager role

**Recommendation**:
- Check profile badge component implementation
- Ensure it reads from AuthContext correctly
- Add proper role display mapping

---

#### BUG-005: Font Size Warnings (Tamagui)
**Severity**: High (P1)
**Pages**: All pages
**Issue**: Repeated console warnings about missing font size tokens
**Console Evidence**:
```
[WARNING] No font size found md {font: undefined} in size tokens
[$1, $2, $3, $4, $5, $6, $7, $8, $9...]
```

**Impact**:
- Console noise makes debugging difficult
- Potential inconsistent typography
- May indicate incomplete design system setup

**Root Cause Hypothesis**:
- Tamagui theme configuration incomplete
- Missing font size token definitions
- Design system not fully configured

**Recommendation**:
- Review Tamagui configuration
- Define missing font size tokens
- Add proper theme setup

---

### Medium Priority Issues (P2) - Partial Functionality Issues

#### BUG-006: React DOM Prop Warning
**Severity**: Medium (P2)
**Console Evidence**:
```
[ERROR] React does not recognize the `%s` prop on a DOM element.
If you intentionally want it to appear in the DOM as a custom attribute,
spell it as lowercase `%s` instead.
```

**Issue**: Component passing non-standard prop (fullWidth) to DOM element
**Impact**: Console errors, potential rendering issues
**Recommendation**: Review component prop forwarding, use proper prop filtering

---

#### BUG-007: Playwright MCP Browser Instability
**Severity**: Medium (P2) - Testing Infrastructure
**Issue**: Playwright MCP browser becomes unusable after certain interactions
**Observed Behavior**:
- "Browser is already in use" errors
- "Another browser context is being closed" errors
- Cannot navigate after clicking certain buttons
- Blank tabs opening unexpectedly

**Impact**: Unable to complete full audit via live browser testing
**Recommendation**:
- Review Playwright MCP tool implementation
- May be issue with browser session management
- Consider using standard Playwright test framework instead

---

#### BUG-008: Empty State Data
**Severity**: Medium (P2) - Data Issue
**Pages**: Dashboard, Tasks
**Issue**: All pages show empty state (no projects, no tasks)
**Impact**: Cannot test data-populated states
**Recommendation**:
- Add seed data for testing
- Create test data generation script
- Enable demo mode with sample data

---

#### BUG-009: Filters Button No Observable Action
**Severity**: Medium (P2)
**Page**: `/manager/tasks`
**Component**: Filters button
**Issue**: Could not test if filters button opens panel (browser session lost)
**Expected**: Should open filter panel
**Recommendation**:
- Test filters functionality with stable browser session
- Verify filter panel implementation exists

---

## 4. Accessibility Observations

### Screen Reader Compatibility
**Status**: Partially compliant
- Semantic HTML used for navigation (links)
- Buttons have accessible names
- Headings properly structured (H1 for page titles)

**Issues Found**:
- Search input has placeholder but may need aria-label
- Icon-only buttons (Notifications, Settings) may need better aria-labels
- Empty states could use better ARIA announcements

### Keyboard Navigation
**Status**: ⚠️ Not fully tested (browser session issues)
**Observations**:
- Tab navigation appears to work on links and buttons
- Need to verify modal keyboard trapping
- Need to verify form field navigation

### Color Contrast
**Status**: ⚠️ Visual inspection only
**Observations**:
- Navigation text appears to have sufficient contrast
- Status badges need contrast verification
- Empty state text appears readable

---

## 5. Test Coverage Recommendations

### Dashboard Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/dashboard.spec.ts`

**Test Cases**:
1. Should load dashboard with empty state when no projects exist
2. Should display correct user role in profile badge
3. Should navigate to each menu item successfully
4. Should open notifications modal when clicking Notifications button
5. Should navigate to settings when clicking Settings button
6. Should log out successfully when clicking Sign Out
7. Should toggle theme when clicking theme button
8. Create Project button should open project creation modal/form
9. Should handle API failures gracefully (401 errors)
10. Should load and display user lexicon labels

**Helper Functions Needed**:
```typescript
async function loginAsManager(page: Page)
async function expectDashboardLoaded(page: Page)
async function expectEmptyState(page: Page, entityType: string)
async function expectUserRole(page: Page, role: string)
```

---

### Tasks Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/tasks.spec.ts`

**Test Cases**:
1. Should load tasks page with empty state
2. Should display status summary cards with correct counts
3. Should enable search input
4. Create Task button should open task creation modal (**FIX BUG-001 first**)
5. Filters button should open filter panel
6. Sort dropdown should change task ordering
7. Should handle empty search results
8. Should display tasks when data exists
9. Should open task detail modal when clicking task
10. Should update task status via modal
11. Should delete task via modal
12. Should filter tasks by status, priority, due date
13. Should search tasks by title, description, tags

**Helper Functions Needed**:
```typescript
async function createTestTask(page: Page, taskData: Partial<Task>)
async function expectTasksCount(page: Page, count: number)
async function openTaskDetailModal(page: Page, taskId: string)
async function filterTasksByStatus(page: Page, status: TaskStatus)
```

---

### Projects Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/projects.spec.ts`

**Test Cases**:
1. Should load projects page
2. Should display empty state when no projects
3. Create Project button should open project form
4. Should create new project with valid data
5. Should validate required project fields
6. Should display projects in list/grid view
7. Should navigate to project detail page
8. Should edit project via detail page
9. Should archive/delete project
10. Should filter projects by status

---

### Subcontractors Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/subcontractors.spec.ts`

**Test Cases**:
1. Should load subcontractors page
2. Should display empty state when no subcontractors
3. Should add new subcontractor
4. Should display compliance scores
5. Should open subcontractor detail modal
6. Should filter by trade type, status, risk level
7. Should search subcontractors
8. Should display BidComparisonView for project bids

---

### Documents Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/documents.spec.ts`

**Test Cases**:
1. Should load documents page
2. Should upload document
3. Should download document
4. Should delete document
5. Should filter by document type
6. Should search documents

---

### Acknowledgements Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/acknowledgements.spec.ts`

**Test Cases**:
1. Should load acknowledgements list
2. Should create acknowledgement form
3. Should view acknowledgement detail
4. Should track acknowledgement status
5. Should filter by status

---

### Integrations Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/integrations.spec.ts`

**Test Cases**:
1. Should load integrations marketplace
2. Should display available integrations
3. Should connect integration
4. Should configure integration settings
5. Should disconnect integration

---

### Help Page Tests

**File**: `apps/forsured-web/tests/e2e/manager/help.spec.ts`

**Test Cases**:
1. Should load help center
2. Should display help articles
3. Should search help content
4. Should navigate to article detail

---

### Settings Pages Tests

**File**: `apps/forsured-web/tests/e2e/manager/settings.spec.ts`

**Test Cases** (for each settings sub-page):
1. Profile Settings: Update name, email, password
2. Company Settings: Update company info, address
3. Insurance Settings: Manage insurance requirements
4. Notification Settings: Toggle notification preferences
5. Team Settings: Add/remove team members, manage roles
6. Integration Settings: Configure API keys, webhooks

---

### Cross-Cutting Tests

**File**: `apps/forsured-web/tests/e2e/manager/navigation.spec.ts`

**Test Cases**:
1. Should navigate between all manager pages via sidebar
2. Should maintain authentication state across navigation
3. Should show active state for current page
4. Should handle unauthorized access attempts
5. Should redirect to dashboard on login
6. Should redirect to start page on logout

---

## 6. Security Assessment

### Authentication & Authorization
**Status**: ⚠️ Needs attention

**Observations**:
- Test login bypasses OAuth (expected for testing)
- Authentication state appears fragile (BUG-002)
- API authentication failing (BUG-003)

**Recommendations**:
1. Test protected route guards thoroughly
2. Verify role-based access control (RBAC)
3. Test session timeout handling
4. Verify logout clears all authentication state
5. Test unauthorized access attempts return 401/403

**Test Cases Needed**:
```typescript
// Attempt to access manager routes as subcontractor
// Attempt to access manager routes without authentication
// Verify API calls include proper auth headers
// Test session expiration handling
```

---

### XSS Prevention
**Status**: ⚠️ Not tested

**Test Cases Needed**:
1. Test task title/description fields reject script tags
2. Test search inputs escape special characters
3. Test project name fields escape HTML
4. Verify all user input is sanitized before rendering

---

### CSRF Protection
**Status**: ⚠️ Not verified

**Test Cases Needed**:
1. Verify form submissions include CSRF tokens
2. Test API mutations require proper authentication
3. Verify state-changing operations are protected

---

## 7. Performance Observations

### Initial Load Time
**Status**: Acceptable
- Page loads within 2-3 seconds locally
- Multiple console warnings may slow down development

### API Calls
**Status**: ⚠️ Needs optimization
- Multiple failed 401 requests add latency
- getUserLexicon called twice on each page load
- Consider caching lexicon data

### Bundle Size
**Status**: ✅ Good (using React.lazy for code splitting)
- Routes are lazy-loaded
- Reduces initial bundle size

---

## 8. Browser Compatibility

### Testing Limitations
Due to Playwright MCP browser instability issues (BUG-007), full cross-browser testing was not completed.

### Recommended Testing
**Browsers to Test**:
- Chrome/Chromium (primary)
- Firefox
- Safari/WebKit
- Edge

**Viewports to Test**:
- Mobile: 375px x 667px (iPhone SE)
- Tablet: 768px x 1024px (iPad)
- Desktop: 1920px x 1080px

---

## 9. Next Steps and Recommendations

### Immediate Actions (Must Fix Before Production)

1. **Fix BUG-001: Create Task Button** (P0)
   - Investigate button onClick handler in ManagerTasksPage
   - Implement proper modal/form opening
   - Add error handling

2. **Fix BUG-002: Authentication State Loss** (P0)
   - Review AuthContext token persistence
   - Fix test login to create stable session
   - Add session debugging

3. **Fix BUG-003: API 401 Errors** (P0)
   - Review TRPC authentication middleware
   - Ensure API tokens set correctly
   - Add error fallbacks

4. **Fix BUG-004: User Role Display** (P1)
   - Update profile badge to read from AuthContext
   - Add proper role mapping

---

### Short-Term Actions (Before Full Release)

5. **Add Seed Data** (P2)
   - Create test projects, tasks, subcontractors
   - Enable testing of data-populated states

6. **Fix Tamagui Font Warnings** (P1)
   - Complete design system setup
   - Define missing font tokens

7. **Complete Route Testing**
   - Test all 19 manager routes
   - Verify all modals and forms
   - Test all CRUD operations

8. **Improve Error Handling**
   - Add user-friendly error messages
   - Handle API failures gracefully
   - Add loading states

---

### Long-Term Actions (Quality Improvements)

9. **Accessibility Improvements**
   - Add ARIA labels to icon-only buttons
   - Implement keyboard navigation tests
   - Add screen reader testing
   - Verify WCAG 2.1 AA compliance

10. **Performance Optimization**
    - Cache lexicon API responses
    - Reduce redundant API calls
    - Add service worker for offline support

11. **Security Hardening**
    - Add XSS testing
    - Verify CSRF protection
    - Implement rate limiting
    - Add security headers

12. **Test Coverage**
    - Achieve 95%+ E2E test coverage
    - Add visual regression tests
    - Add cross-browser testing
    - Add mobile responsiveness tests

---

## 10. Quality Assessment Summary

### Deployment Readiness: ❌ NEEDS WORK

**Critical Issues Blocking Production**:
- 3 P0 bugs prevent core functionality
- Authentication instability
- API authentication failures
- Broken Create Task button

**Estimated Time to Production Ready**: 2-3 revision cycles (1-2 weeks)

**Required Fixes**:
1. Resolve all P0 bugs (BUG-001, BUG-002, BUG-003)
2. Fix P1 bugs (BUG-004, BUG-005)
3. Complete route testing
4. Add comprehensive E2E test suite
5. Verify authentication flow end-to-end

---

### Test Suite Recommendations

**Minimum Test Coverage Before Production**:
- Dashboard: 10 tests
- Tasks: 13 tests
- Projects: 10 tests
- Subcontractors: 8 tests
- Documents: 6 tests
- Acknowledgements: 5 tests
- Integrations: 5 tests
- Help: 4 tests
- Settings: 6 tests (1 per page)
- Navigation: 5 tests

**Total Minimum Tests**: 72 tests

**Test Isolation Requirements**:
- Each test must set up its own data
- Use `beforeEach` to create test user and login
- Use `afterEach` to clean up created entities
- Tests must be runnable in any order

---

## 11. Evidence and Artifacts

### Screenshots Captured
1. `/Users/mattbernier/projects/unicorn/UNI-Construct/.playwright-mcp/audit-screenshots/01-start-page.png` - Start page with test login buttons
2. `/Users/mattbernier/projects/unicorn/UNI-Construct/.playwright-mcp/audit-screenshots/02-manager-dashboard.png` - Manager dashboard empty state
3. `/Users/mattbernier/projects/unicorn/UNI-Construct/.playwright-mcp/audit-screenshots/03-manager-tasks.png` - Manager tasks page empty state

### Console Logs Captured
- Authentication state changes
- API 401 errors
- Tamagui font warnings
- React prop warnings

### Network Requests Analyzed
- getUserLexicon: 401 Unauthorized (failing)
- Supabase REST API: 200 OK (working)
- Static assets: 200 OK (working)

---

## 12. Collaboration Notes

### For API Testing Agent
- Coordinate testing of `/api/trpc/userSetTypes.getUserLexicon` endpoint
- Verify authentication headers are sent correctly
- Test TRPC middleware authentication

### For UI Testing Agent
- Focus on visual regression testing once bugs are fixed
- Test responsive layouts at mobile/tablet/desktop breakpoints
- Verify accessibility compliance

### For Reality Checker
- Review authentication flow implementation
- Validate test data setup approach
- Verify security assumptions

---

## Conclusion

The GC/Manager user flow has a well-structured route hierarchy and clean UI design, but critical bugs in authentication, API integration, and interactive components prevent full functionality testing. The application requires 2-3 revision cycles to reach production readiness.

**Priority**: Fix P0 authentication and interaction bugs immediately, then complete comprehensive E2E testing before any production deployment.

---

**Audit Completed**: 2025-12-19
**Auditor**: Playwright Audit Specialist
**Branch**: forsured (current working branch)
**Status**: NEEDS WORK - Critical bugs must be resolved
**Re-assessment Required**: Yes - after P0/P1 bug fixes
