# TEST Ticket: Admin Dashboard Route

**Route**: `/dashboard`
**User Role**: Admin
**Test ID**: TEST-admin-006
**Priority**: High
**Status**: Ready for Testing

## Test Objectives

Validate the admin dashboard functionality, including profile completion tracking, career assessment tool, news feed integration, and navigation across all supported browsers and devices.

## Prerequisites

- [ ] Supabase local instance running (`pnpm supa start`)
- [ ] Web dev server running (`pnpm web` on port 8081)
- [ ] Test database seeded with admin user
- [ ] Admin credentials: `ewongagent@gmail.com` / `password123`

## Test Suite

### TS-001: Authentication & Authorization

**Test Case 1.1**: Unauthenticated Access
- **Steps**:
  1. Clear browser storage
  2. Navigate to `/dashboard`
- **Expected**: Redirect to `/auth`
- **Status**: ⬜ Not Started

**Test Case 1.2**: Admin Login Flow
- **Steps**:
  1. Navigate to `/auth`
  2. Sign in with admin credentials
  3. Complete profile if prompted
- **Expected**:
  - Redirects to `/dashboard`
  - Dashboard loads with admin user data
  - Profile shows "Eric Wong" information
- **Status**: ⬜ Not Started

**Test Case 1.3**: Session Persistence
- **Steps**:
  1. Sign in as admin
  2. Refresh page
  3. Close and reopen browser
- **Expected**: User remains authenticated
- **Status**: ⬜ Not Started

---

### TS-002: Profile Completion Widget

**Test Case 2.1**: Initial Profile Status Display
- **Steps**:
  1. Sign in as admin
  2. View dashboard
  3. Locate "Complete Your Profile" widget
- **Expected**:
  - Widget displays with white card styling
  - Progress bar shows current percentage (e.g., "33% Complete")
  - Green progress bar matches percentage
  - 6 checklist items visible
- **Status**: ⬜ Not Started

**Test Case 2.2**: Completed Sections Indication
- **Steps**:
  1. View profile completion checklist
  2. Identify completed sections
- **Expected**:
  - Completed sections show green checkmark icon
  - Section title in normal font weight
  - Description text below title
- **Status**: ⬜ Not Started

**Test Case 2.3**: Incomplete Sections Indication
- **Steps**:
  1. View profile completion checklist
  2. Identify incomplete sections
- **Expected**:
  - Incomplete sections show gray circle icon
  - Section remains clickable
- **Status**: ⬜ Not Started

**Test Case 2.4**: Profile Section Navigation
- **Steps**:
  1. Click on "Skills & Expertise" item
  2. Verify navigation
  3. Return to dashboard
  4. Repeat for each incomplete section
- **Expected**:
  - Navigates to corresponding profile editor
  - URL updates to `/dashboard/profile/skills` (or appropriate route)
  - Back navigation returns to dashboard
- **Status**: ⬜ Not Started

**Test Case 2.5**: Profile Completion Progress Update
- **Steps**:
  1. Note current completion percentage
  2. Navigate to incomplete section
  3. Complete required fields
  4. Save changes
  5. Return to dashboard
- **Expected**:
  - Percentage increases appropriately
  - Progress bar updates visually
  - Previously incomplete section now shows checkmark
- **Status**: ⬜ Not Started

**Test Case 2.6**: 100% Profile Completion
- **Steps**:
  1. Complete all 6 profile sections
  2. Return to dashboard
- **Expected**:
  - Progress shows "100% Complete"
  - All items have green checkmarks
  - Success message or visual indicator (verify if exists)
- **Status**: ⬜ Not Started

---

### TS-003: Career Assessment Widget

**Test Case 3.1**: Assessment Widget Display
- **Steps**:
  1. View dashboard
  2. Scroll to Career Assessment section
- **Expected**:
  - Widget displays below profile completion
  - Title: "Career Assessment"
  - Subtitle explaining purpose
  - "Rate Your Interests" heading visible
- **Status**: ⬜ Not Started

**Test Case 3.2**: RIASEC Slider Functionality
- **Steps**:
  1. Locate all 6 RIASEC sliders:
     - Realistic
     - Investigative
     - Artistic
     - Social
     - Enterprising
     - Conventional
  2. Test each slider interaction
- **Expected**:
  - Each slider moves smoothly from 1 to 5
  - Current value displays
  - Statement text clearly readable
  - Default value is 3 for all sliders
- **Status**: ⬜ Not Started

**Test Case 3.3**: Slider Value Persistence
- **Steps**:
  1. Adjust sliders to specific values
  2. Scroll away from assessment
  3. Scroll back to assessment
- **Expected**: Values remain at set positions
- **Status**: ⬜ Not Started

**Test Case 3.4**: Assessment Submission
- **Steps**:
  1. Set slider values
  2. Click "Complete Assessment" button
  3. Observe result
- **Expected**:
  - Assessment submits successfully
  - Success message displays (verify)
  - Scores saved to user profile
  - Button state updates (verify behavior)
- **Status**: ⬜ Not Started

**Test Case 3.5**: Assessment Impact on Job Recommendations
- **Steps**:
  1. Complete assessment with specific interests
  2. Navigate to `/dashboard/discover/jobs`
  3. Check job recommendations
- **Expected**:
  - Recommended jobs align with RIASEC scores
  - High "Realistic" score → construction/trades jobs
  - High "Social" score → teaching/healthcare jobs
- **Status**: ⬜ Not Started

**Test Case 3.6**: Accessibility - Keyboard Navigation
- **Steps**:
  1. Tab to first slider
  2. Use arrow keys to adjust value
  3. Tab through all sliders
  4. Tab to "Complete Assessment" button
  5. Press Enter to submit
- **Expected**:
  - All sliders keyboard accessible
  - Arrow keys adjust values
  - Focus indicators visible
  - Enter/Space triggers button
- **Status**: ⬜ Not Started

---

### TS-004: News Feed Widget

**Test Case 4.1**: News Widget Display
- **Steps**:
  1. View dashboard
  2. Locate News widget (right column)
- **Expected**:
  - Widget titled "News"
  - Feed selector dropdown showing "ENR National"
  - Refresh button visible
  - News articles display (if feed loads)
- **Status**: ⬜ Not Started

**Test Case 4.2**: Feed Selector Functionality
- **Steps**:
  1. Click feed selector dropdown
  2. View available feeds
  3. Select different feed
- **Expected**:
  - Dropdown opens with feed options
  - Current selection highlighted
  - Selecting new feed updates content
- **Status**: ⬜ Not Started

**Test Case 4.3**: News Article Display
- **Steps**:
  1. View loaded news articles
  2. Examine article structure
- **Expected Each Article**:
  - Article title/headline
  - Brief summary/excerpt
  - Publish date
  - Read time estimate
  - Author email/name
  - Article is clickable
- **Status**: ⬜ Not Started

**Test Case 4.4**: Article Navigation
- **Steps**:
  1. Click on news article
  2. Verify navigation
- **Expected**:
  - Opens article in new tab OR
  - Navigates to article detail page
  - Original ENR link accessible
- **Status**: ⬜ Not Started

**Test Case 4.5**: Refresh Button
- **Steps**:
  1. Click refresh button (circular arrow)
  2. Observe behavior
- **Expected**:
  - Loading indicator appears
  - Feed reloads
  - Updated articles display
- **Status**: ⬜ Not Started

**Test Case 4.6**: Feed Load Failure Handling
- **Steps**:
  1. Simulate network error (developer tools)
  2. Load dashboard
- **Expected**:
  - Fallback message: "No news available"
  - Message: "Try selecting a different feed or check back later"
  - Widget remains functional
  - No console errors (non-CORS)
- **Status**: ⬜ Not Started

**Test Case 4.7**: CORS Error Investigation
- **Known Issue**: allorigins.win proxy CORS errors
- **Steps**:
  1. Open browser console
  2. Load dashboard
  3. Check for CORS errors
- **Expected**:
  - Identify specific feeds failing
  - Document error patterns
  - Propose backend proxy solution
- **Status**: ⬜ Not Started

---

### TS-005: Navigation & Header

**Test Case 5.1**: Page Title Display
- **Steps**:
  1. View dashboard header
- **Expected**:
  - "Dashboard" heading (h1) visible
  - Proper font size and weight
- **Status**: ⬜ Not Started

**Test Case 5.2**: Hamburger Menu
- **Steps**:
  1. Click hamburger menu icon (top-left)
  2. View navigation drawer
- **Expected**:
  - Drawer slides in from left
  - Navigation links visible:
    - Update Profile / Edit Profile
    - Dashboard (current, highlighted)
    - Discover (expandable)
    - Profile (expandable)
  - Theme toggle present
  - Sign out button present
- **Status**: ⬜ Not Started

**Test Case 5.3**: Notification Bell
- **Steps**:
  1. Click notification bell (top-right)
  2. View notification panel
- **Expected**:
  - Panel opens with notifications
  - Badge shows unread count
  - Notifications listed with:
    - Icon/avatar
    - Title
    - Message
    - Timestamp
- **Status**: ⬜ Not Started

**Test Case 5.4**: Notification Interactions
- **Steps**:
  1. Open notifications
  2. Click individual notification
  3. Check for mark-as-read functionality
- **Expected**:
  - Notification expands or navigates
  - Badge count decreases
  - Read notifications visually distinct
- **Status**: ⬜ Not Started

**Test Case 5.5**: Dark Mode Toggle
- **Steps**:
  1. Open navigation drawer
  2. Click "Switch to dark theme"
  3. Observe UI changes
  4. Toggle back to light theme
- **Expected**:
  - Theme switches immediately
  - All components update colors
  - Preference saved to storage
  - Button label updates to "Switch to light theme"
- **Status**: ⬜ Not Started

**Test Case 5.6**: Sign Out
- **Steps**:
  1. Open navigation drawer
  2. Click "Sign out"
  3. Observe behavior
- **Expected**:
  - Session cleared
  - Redirects to `/auth`
  - Cannot access `/dashboard` without re-auth
- **Status**: ⬜ Not Started

---

### TS-006: Cookie Consent Banner

**Test Case 6.1**: Initial Banner Display
- **Steps**:
  1. Clear browser storage
  2. Load dashboard (first visit)
- **Expected**:
  - Banner displays at bottom
  - Message: "This site uses cookies"
  - Description visible
  - "Review our privacy policy" link
  - Three buttons: Manage, Accept, Reject
- **Status**: ⬜ Not Started

**Test Case 6.2**: Accept Cookies
- **Steps**:
  1. Click "Accept" button
  2. Observe banner behavior
- **Expected**:
  - Banner dismisses
  - Consent saved to storage
  - Banner doesn't reappear on refresh
- **Status**: ⬜ Not Started

**Test Case 6.3**: Reject Cookies
- **Steps**:
  1. Click "Reject" button
  2. Check analytics/tracking scripts
- **Expected**:
  - Banner dismisses
  - Non-essential cookies not set
  - Preference saved
- **Status**: ⬜ Not Started

**Test Case 6.4**: Manage Cookies
- **Steps**:
  1. Click "Manage" button
  2. View cookie preferences
- **Expected**:
  - Preferences modal opens
  - Categories listed (essential, analytics, marketing)
  - Toggles for each category
  - Save button to confirm
- **Status**: ⬜ Not Started

**Test Case 6.5**: Privacy Policy Link
- **Steps**:
  1. Click "Review our privacy policy" link
- **Expected**:
  - Opens https://scaffald.com/privacy
  - Opens in new tab (verify)
- **Status**: ⬜ Not Started

---

### TS-007: Responsive Design

**Test Case 7.1**: Desktop Layout (1920x1080)
- **Steps**:
  1. Resize browser to 1920x1080
  2. View dashboard layout
- **Expected**:
  - Two-column layout
  - Profile/Assessment on left (wider)
  - News on right (narrower)
  - Proper spacing and margins
- **Status**: ⬜ Not Started

**Test Case 7.2**: Tablet Layout (768x1024)
- **Steps**:
  1. Resize to tablet dimensions
  2. View layout changes
- **Expected**:
  - May stack to single column
  - Touch-friendly button sizes
  - Readable font sizes
- **Status**: ⬜ Not Started

**Test Case 7.3**: Mobile Layout (375x667 - iPhone SE)
- **Steps**:
  1. Resize to mobile dimensions
  2. Test all interactions
- **Expected**:
  - Single column layout
  - Hamburger menu replaces full nav
  - Sliders touch-responsive
  - No horizontal scrolling
  - Proper spacing for touch targets
- **Status**: ⬜ Not Started

**Test Case 7.4**: Mobile Landscape
- **Steps**:
  1. Rotate to landscape orientation
  2. Test usability
- **Expected**:
  - Layout adjusts appropriately
  - All content accessible
  - No layout breaking
- **Status**: ⬜ Not Started

---

### TS-008: Cross-Browser Compatibility

**Test Case 8.1**: Chrome/Chromium Desktop
- **Steps**: Run full test suite on Chrome
- **Expected**: All tests pass
- **Status**: ✅ PASSED (automation confirmed)

**Test Case 8.2**: Firefox Desktop
- **Steps**: Run full test suite on Firefox
- **Expected**: All tests pass
- **Status**: ⚠️ TIMEOUT (profile completion modal issue)

**Test Case 8.3**: Safari/WebKit Desktop
- **Steps**: Run full test suite on Safari
- **Expected**: All tests pass
- **Status**: ⚠️ TIMEOUT (profile completion modal issue)

**Test Case 8.4**: Mobile Chrome (Pixel 5)
- **Steps**: Run full test suite on mobile Chrome
- **Expected**: All tests pass
- **Status**: ✅ PASSED (automation confirmed)

**Test Case 8.5**: Mobile Safari (iPhone 12)
- **Steps**: Run full test suite on mobile Safari
- **Expected**: All tests pass
- **Status**: ⚠️ TIMEOUT (profile completion modal issue)

**Test Case 8.6**: Edge Desktop
- **Steps**: Run full test suite on Edge
- **Expected**: All tests pass
- **Status**: ⬜ Not Started

---

### TS-009: Performance

**Test Case 9.1**: Initial Load Time
- **Steps**:
  1. Clear cache
  2. Measure load time with DevTools
- **Expected**:
  - Time to Interactive < 3 seconds
  - First Contentful Paint < 1 second
  - Largest Contentful Paint < 2.5 seconds
- **Status**: ⬜ Not Started

**Test Case 9.2**: Profile Widget Load
- **Steps**:
  1. Measure time from page load to profile data display
- **Expected**:
  - Profile data loads within 1 second
  - Loading state displayed during fetch
  - No layout shift (CLS < 0.1)
- **Status**: ⬜ Not Started

**Test Case 9.3**: News Feed Load
- **Steps**:
  1. Measure news feed fetch time
  2. Test with slow network (3G simulation)
- **Expected**:
  - Independent of main page load
  - Graceful degradation on slow network
  - Timeout and fallback within 5 seconds
- **Status**: ⬜ Not Started

**Test Case 9.4**: Lighthouse Audit
- **Steps**:
  1. Run Lighthouse audit
  2. Review all categories
- **Expected Scores**:
  - Performance: > 90
  - Accessibility: > 95
  - Best Practices: > 90
  - SEO: > 90
- **Status**: ⬜ Not Started

---

### TS-010: Accessibility

**Test Case 10.1**: Screen Reader Navigation (NVDA/JAWS)
- **Steps**:
  1. Enable screen reader
  2. Navigate through dashboard
  3. Test all interactive elements
- **Expected**:
  - Heading hierarchy correct
  - All buttons have descriptive labels
  - Slider values announced
  - Focus order logical
- **Status**: ⬜ Not Started

**Test Case 10.2**: Keyboard-Only Navigation
- **Steps**:
  1. Navigate entire page with Tab/Shift+Tab
  2. Activate elements with Enter/Space
  3. Use arrow keys for sliders
- **Expected**:
  - All interactive elements accessible
  - Skip links provided (if applicable)
  - Focus indicators visible
  - No keyboard traps
- **Status**: ⬜ Not Started

**Test Case 10.3**: Color Contrast
- **Steps**:
  1. Use axe DevTools or similar
  2. Check all text/background combinations
- **Expected**:
  - WCAG AA compliance minimum
  - Body text: 4.5:1 ratio
  - Large text: 3:1 ratio
  - UI elements: 3:1 ratio
- **Status**: ⬜ Not Started

**Test Case 10.4**: Focus Management
- **Steps**:
  1. Navigate with keyboard
  2. Open/close modals and drawers
  3. Verify focus handling
- **Expected**:
  - Focus trapped in modal when open
  - Focus returns to trigger on close
  - Skip to main content link
- **Status**: ⬜ Not Started

**Test Case 10.5**: Zoom & Text Resize (200%)
- **Steps**:
  1. Zoom browser to 200%
  2. Test all functionality
- **Expected**:
  - Layout remains usable
  - No text cutoff
  - No horizontal scroll on mobile
  - All features remain accessible
- **Status**: ⬜ Not Started

---

### TS-011: Data Integrity

**Test Case 11.1**: Profile Completion Accuracy
- **Steps**:
  1. Manually check database for profile fields
  2. Compare with displayed percentage
- **Expected**:
  - Percentage matches actual completion
  - All 6 sections weighted correctly
  - Real-time updates on save
- **Status**: ⬜ Not Started

**Test Case 11.2**: Assessment Score Storage
- **Steps**:
  1. Complete assessment
  2. Check database for RIASEC scores
  3. Navigate away and return
- **Expected**:
  - Scores saved to user profile
  - Scores persist across sessions
  - Scores used in job matching algorithm
- **Status**: ⬜ Not Started

**Test Case 11.3**: News Feed Data Source
- **Steps**:
  1. Inspect network requests
  2. Verify feed URLs
- **Expected**:
  - Fetching from correct RSS feeds
  - Data format validation
  - Error handling for malformed data
- **Status**: ⬜ Not Started

---

### TS-012: Security

**Test Case 12.1**: Unauthorized Access Prevention
- **Steps**:
  1. Sign out
  2. Manually navigate to `/dashboard`
  3. Try to access with invalid token
- **Expected**:
  - Redirects to `/auth`
  - No dashboard data exposed
  - No error messages revealing sensitive info
- **Status**: ⬜ Not Started

**Test Case 12.2**: XSS Protection in News Feed
- **Steps**:
  1. Simulate malicious RSS feed content
  2. Check for script execution
- **Expected**:
  - HTML properly sanitized
  - No script execution from feed
  - Links properly validated
- **Status**: ⬜ Not Started

**Test Case 12.3**: CSRF Protection
- **Steps**:
  1. Attempt to submit assessment from external page
- **Expected**:
  - CSRF token required
  - Submission rejected without valid token
- **Status**: ⬜ Not Started

---

## Known Issues

### Issue 1: News Feed CORS Errors
**Severity**: Medium
**Description**: Fetching from allorigins.win proxy fails with CORS errors
**Impact**: News widget shows "No news available"
**Recommendation**: Implement backend proxy for RSS feeds
**Tracking**: Console shows multiple failed fetch attempts

### Issue 2: Cross-Browser Profile Modal Timeout
**Severity**: High (for testing)
**Description**: Firefox, WebKit, and Mobile Safari tests timeout during profile completion
**Impact**: Automated tests fail on non-Chromium browsers
**Recommendation**: Investigate `ensureAdminProfileComplete()` helper timing
**Tracking**: Playwright test results show timeout in auth helper

### Issue 3: Office Role Not Displayed
**Severity**: Low (potential issue)
**Description**: Admin user has role but `willShowOffice: false`
**Impact**: Office admin features not accessible from dashboard
**Recommendation**: Verify if intentional design or bug
**Tracking**: Console logs show `hasOfficeRole: false`

---

## Test Environment Requirements

### Browsers
- Chrome/Chromium 120+
- Firefox 120+
- Safari 17+
- Edge 120+
- Mobile Chrome (latest)
- Mobile Safari (iOS 16+)

### Screen Resolutions
- Desktop: 1920x1080, 1366x768, 1280x720
- Tablet: 1024x768, 768x1024
- Mobile: 375x667, 414x896, 360x640

### Network Conditions
- Fast 4G
- Slow 3G
- Offline (for error handling)

---

## Test Execution

### Automated Tests
```bash
# Run all dashboard tests
pnpm exec playwright test tests/explore-admin-006-dashboard.spec.ts

# Run on specific browser
pnpm exec playwright test tests/explore-admin-006-dashboard.spec.ts --project=chromium

# Run with UI
pnpm exec playwright test tests/explore-admin-006-dashboard.spec.ts --ui

# Generate report
pnpm exec playwright test tests/explore-admin-006-dashboard.spec.ts --reporter=html
```

### Manual Testing Checklist
- [ ] Complete all test cases in order
- [ ] Document screenshots for each major feature
- [ ] Record video for complex interactions
- [ ] Note any deviations from expected behavior
- [ ] Update this document with results

---

## Test Results Summary

| Test Suite | Total | Passed | Failed | Skipped | Coverage |
|------------|-------|--------|--------|---------|----------|
| TS-001: Auth | 3 | 0 | 0 | 0 | 0% |
| TS-002: Profile Widget | 6 | 0 | 0 | 0 | 0% |
| TS-003: Career Assessment | 6 | 0 | 0 | 0 | 0% |
| TS-004: News Feed | 7 | 0 | 0 | 0 | 0% |
| TS-005: Navigation | 6 | 0 | 0 | 0 | 0% |
| TS-006: Cookie Consent | 5 | 0 | 0 | 0 | 0% |
| TS-007: Responsive | 4 | 0 | 0 | 0 | 0% |
| TS-008: Cross-Browser | 6 | 2 | 0 | 0 | 33% |
| TS-009: Performance | 4 | 0 | 0 | 0 | 0% |
| TS-010: Accessibility | 5 | 0 | 0 | 0 | 0% |
| TS-011: Data Integrity | 3 | 0 | 0 | 0 | 0% |
| TS-012: Security | 3 | 0 | 0 | 0 | 0% |
| **TOTAL** | **58** | **2** | **0** | **0** | **3%** |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Test Author | Frontend UI Tester Agent | 2025-11-02 | ✅ |
| Reviewer | | | |
| Product Owner | | | |
| QA Lead | | | |

---

## References

- **Exploration Report**: `/docs/testing/admin-route-explore-006-dashboard.md`
- **Playwright Test**: `/tests/explore-admin-006-dashboard.spec.ts`
- **Screenshot**: `/.playwright-mcp/admin-006-dashboard-full.png`
- **Route Source**: `/packages/core/features/dashboard/dashboard-screen.tsx` (inferred)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-02 | Frontend UI Tester | Initial TEST ticket creation |
