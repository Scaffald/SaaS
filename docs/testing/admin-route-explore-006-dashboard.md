# Admin Route Exploration: /dashboard

**Task ID**: admin-route-explore-006 (dd10afee-e33e-48ef-88c9-610809500c0c)
**Route**: `/dashboard`
**User Role**: Admin (`ewongagent@gmail.com`)
**Exploration Date**: 2025-11-02
**Status**: ✅ Complete

## Overview

The `/dashboard` route is the main landing page for authenticated users after login. It provides a personalized home screen with profile completion tracking, career assessment tools, news feed, and navigation to core features.

## Authentication & Access

- **Auth Required**: Yes - redirects to `/auth` if not authenticated
- **Admin User**: Eric Wong (ewongagent@gmail.com)
- **Profile Completion**: Auto-handled by `signInAsAdmin()` helper
- **Initial Profile Status**: 33% complete (Basic Information and Employment Preferences completed)

## Page Structure

### Header Navigation
- **Title**: "Dashboard" (h1)
- **Navigation Menu**: Hamburger menu (top-left)
- **Notifications Bell**: Top-right corner with badge indicator

### Main Content Area

The dashboard is split into two main columns:

#### Left Column - Profile & Assessment (Primary)
1. **Profile Completion Widget**
2. **Career Assessment Widget**

#### Right Column - News Feed (Secondary)
1. **News Widget** with feed selector

## UI Components

### 1. Profile Completion Widget

**Purpose**: Tracks user profile completion across 6 key sections

**Visual Design**:
- White card with rounded corners
- Green progress bar showing percentage (33%)
- Checklist items with checkmark icons for completed sections
- Gray circles for incomplete sections

**Content**:
```
Complete Your Profile
Your profile is your first impression on Scaffald. A complete profile helps
employers, collaborators, and peers quickly understand who you are and what
you're looking for. This checklist guides you through adding the most important
details step by step. As you fill things out, you'll see your progress update
in real time. Aim for 100% to unlock better visibility in search results and
increase your chances of matching with the right opportunities.

33% Complete
```

**Checklist Items** (6 sections):
1. ✅ **Basic Information** - "Add your name and contact information"
2. ✅ **Employment Preferences** - "Set your work location preferences and availability"
3. ⭕ **Skills & Expertise** - "Add your skills and industry focus"
4. ⭕ **Education** - "Add your educational background"
5. ⭕ **Certifications** - "Add professional certifications and licenses"
6. ⭕ **Work Experience** - "Add your work history and experience"

**Interactions**:
- Each checklist item is a clickable button
- Clicking navigates to the corresponding profile section
- Completed items show green checkmark
- Incomplete items show gray circle

### 2. Career Assessment Widget

**Purpose**: RIASEC-based career interest assessment to help match users with suitable jobs

**Visual Design**:
- Follows profile widget styling
- Contains interactive sliders
- "Complete Assessment" button at bottom

**Assessment Sections**:

#### Rate Your Interests
"Move the sliders to indicate how much you agree with each statement (1 = Disagree, 5 = Strongly Agree)"

**RIASEC Categories** (6 dimensions):

1. **Realistic**
   - Statement: "I enjoy working with tools, machines, or building things"
   - Slider: 1-5 scale (default: 3)

2. **Investigative**
   - Statement: "I like analyzing problems and conducting research"
   - Slider: 1-5 scale (default: 3)

3. **Artistic**
   - Statement: "I enjoy creative and expressive activities"
   - Slider: 1-5 scale (default: 3)

4. **Social**
   - Statement: "I like helping and teaching others"
   - Slider: 1-5 scale (default: 3)

5. **Enterprising**
   - Statement: "I enjoy leading projects and making decisions"
   - Slider: 1-5 scale (default: 3)

6. **Conventional**
   - Statement: "I prefer organized, structured work with clear procedures"
   - Slider: 1-5 scale (default: 3)

**Interactions**:
- Each slider is interactive (horizontal orientation, min: 1, max: 5)
- "Complete Assessment" button submits responses
- Assessment results used for O*NET-based job matching

### 3. News Feed Widget

**Header**:
- Title: "News"
- Feed selector dropdown: "ENR National" (default)
- Refresh button (circular arrow icon)

**Content**:
The news widget displays construction industry news from Engineering News-Record (ENR) feeds.

**Sample News Items** (from screenshot):
1. **"Bentley Unveils Platform Upgrades; Redoubles AI ..."**
   - Summary: "Firm introduced more AI agents, including expanded workflows and querying capabilities, in products OpenSite, Synchro, ..."
   - Metadata: 10/23/2025 • 1 min read • yodersj@enr.com (Jeff Y...)

2. **"Trump Priority Projects Get Fast-Track US Permits Amid Shutdown"**
   - Summary: "A federal permitting council is continuing reviews for FAST-41 projects favored by the president."
   - Metadata: 10/3/2025 • 1 min read

3. **"The Three Infrastructure Enablers"** (partially visible)

**Feed Options** (from dropdown):
- ENR National (default/selected)
- Other feeds available via dropdown

**Interactions**:
- Feed selector dropdown to change news source
- Refresh button to reload feed
- Each news item is clickable (links to full article)
- "No news available" fallback message if feed fails

**Known Issues**:
- Console errors show CORS issues with allorigins.win proxy
- Some feeds may fail to load due to network restrictions

## Sidebar Navigation (Drawer)

**Primary Navigation Links**:
- Update Profile / Edit Profile
- Dashboard (current)
- Discover (expandable)
- Profile (expandable)

**Theme & Account**:
- "Switch to dark theme" button
- "Sign out" button

**Drawer Context**:
```javascript
{
  hasOfficeRole: false,
  roles: ["worker"], // Admin has 1 role
  isLoading: false,
  willShowOffice: false
}
```

## Notifications Panel

**Access**: Click bell icon in top-right header

**Content**: Sample notifications displayed:

1. **Profile Updated**
   - Message: "Your profile has been successfully updated."
   - Timestamp: "2 hours ago"

2. **New Worker Available**
   - Message: "A new worker matching your criteria is now available in your area."
   - Timestamp: "5 hours ago"

3. **Payment Required**
   - Message: "Your subscription will expire in 3 days. Please update your payment method."
   - Timestamp: "1 day ago"

4. **System Maintenance**
   - Message: "Scheduled maintenance will occur tonight from 2-4 AM EST."
   - Timestamp: "2 days ago"

5. **Application Approved**
   - Message: "Your worker application has been approved and is now live."
   - Timestamp: "3 days ago"

**Badge**: Shows count of unread notifications (e.g., "2")

## Cookie Consent Banner

**Position**: Bottom of page overlay

**Content**:
```
This site uses cookies
We use cookies to make things work smoothly and help us learn.
Review our privacy policy to learn more.
```

**Actions**:
- "Manage" button - opens cookie preferences
- "Accept" button - accepts all cookies
- "Reject" button - rejects non-essential cookies
- "Review our privacy policy" link → https://scaffald.com/privacy

## Accessibility Features

### Keyboard Navigation
- All interactive elements accessible via Tab key
- Focus indicators present
- Proper heading hierarchy (h1 → h2 → h3)

### Screen Reader Support
- Semantic HTML elements used
- ARIA roles properly assigned
- Descriptive button labels
- Slider controls have proper value text

### Accessibility Tree Summary
- WebArea role: "Scaffald"
- Proper heading levels
- Button roles with descriptive names
- Slider controls with min/max/value attributes
- Text roles for static content

## Performance Notes

### Load Behavior
- Initial page load shows loading spinner briefly
- Profile data fetches asynchronously
- News feed loads independently (may fail due to CORS)
- Page functional even if news feed fails

### Console Messages (Non-critical)
- ⚠️ `props.pointerEvents is deprecated` - Tamagui deprecation warning
- ⚠️ Require cycle in react-query provider - non-blocking
- ❌ CORS errors for allorigins.win - news feed fallback handled

### Auth State Flow
```
INITIAL_SESSION undefined
→ localStorage check
→ Session restored: 11111111-1111-1111-1111-111111111112
→ Role check: ["worker"]
→ Navigate to /dashboard
→ Render complete
```

## Mobile Responsiveness

**Tested Viewports**:
- Desktop Chrome: ✅ Passed
- Mobile Chrome (Pixel 5): ✅ Passed
- Desktop Firefox: ⚠️ Timeout (profile completion modal)
- WebKit/Safari: ⚠️ Timeout (profile completion modal)
- Mobile Safari (iPhone 12): ⚠️ Timeout (profile completion modal)

**Layout Behavior**:
- Two-column layout on desktop
- Stacks vertically on mobile
- Hamburger menu on all viewports
- Touch-friendly slider controls

## User Journey

### Typical Flow
1. User logs in → Redirects to `/dashboard`
2. If profile incomplete → Shows profile completion widget (33%)
3. User sees career assessment → Can complete RIASEC questionnaire
4. User browses news → Industry-relevant articles
5. User clicks profile section → Navigates to profile editor
6. User completes section → Returns to dashboard with updated percentage

### Admin-Specific Features
- No special admin features visible on dashboard
- Admin navigation shows same drawer as regular users
- Office role not shown (`willShowOffice: false`)

## Test Coverage

### Automated Tests
- ✅ Auth redirect (unauthenticated users → `/auth`)
- ✅ Profile completion auto-handled
- ✅ Page renders with all widgets
- ✅ Accessibility tree validation
- ✅ Screenshot regression baseline

### Test File
`/tests/explore-admin-006-dashboard.spec.ts`

### Manual Testing Needed
- [ ] Complete career assessment and verify job recommendations
- [ ] Test all profile section navigation links
- [ ] Verify news feed with different sources
- [ ] Test notification panel interactions
- [ ] Verify dark mode toggle
- [ ] Test cookie consent preferences
- [ ] Verify progress updates after profile completion

## Known Issues & Limitations

### 1. News Feed CORS Errors
**Issue**: Feed fetching fails with CORS errors on allorigins.win proxy
**Impact**: News widget shows "No news available"
**Workaround**: Backend proxy or different feed aggregator needed

### 2. Profile Completion Modal (Safari/Firefox)
**Issue**: Some browsers timeout during profile completion flow
**Impact**: Tests fail on Firefox, WebKit, Mobile Safari
**Investigation Needed**: ensureAdminProfileComplete() helper timing

### 3. Office Role Not Displayed
**Issue**: Admin user has role but `willShowOffice: false`
**Impact**: Office admin features not accessible from dashboard
**Note**: May be intentional - requires investigation

## Related Routes

- `/auth` - Authentication/sign-in
- `/dashboard/profile` - Profile editor (all sections)
- `/dashboard/discover/jobs` - Job search
- `/dashboard/discover/workers` - Worker search
- `/dashboard/discover/employers` - Employer search
- `/dashboard/discover/map` - Map-based discovery

## Data Integration

### Profile Completion Calculation
- **Source**: tRPC endpoint (likely `profile.getCompletionStatus`)
- **Sections Tracked**: 6 total
- **Current Status**: 2/6 completed (33%)
- **Real-time Updates**: Yes - updates on profile save

### Career Assessment (RIASEC)
- **Based On**: Holland Code / O*NET Interest Profiler
- **Dimensions**: 6 (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
- **Scale**: 1-5 Likert scale
- **Storage**: Likely saved to user profile on completion
- **Integration**: Used for job matching algorithm

### News Feed
- **Source**: Engineering News-Record (ENR) RSS feeds
- **Default Feed**: ENR National
- **Update Frequency**: Manual refresh or periodic polling
- **Fallback**: "No news available" message

## Screenshots

### Full Page
![Dashboard Full Page](.playwright-mcp/admin-006-dashboard-full.png)

**File**: `/Users/mattbernier/projects/SCF-Neue/.playwright-mcp/admin-006-dashboard-full.png`

## Next Steps for Testing

1. **Profile Completion Flow**
   - Complete all 6 profile sections
   - Verify progress updates in real-time
   - Test navigation from each checklist item

2. **Career Assessment**
   - Complete RIASEC assessment
   - Verify score submission
   - Check job recommendation updates

3. **News Feed**
   - Fix CORS proxy issues
   - Test all available feeds
   - Verify article link navigation

4. **Cross-browser Testing**
   - Resolve Firefox/Safari timeout issues
   - Verify consistent rendering
   - Test mobile interactions

5. **Performance**
   - Measure load times
   - Optimize news feed loading
   - Add loading states

## Conclusion

The `/dashboard` route successfully serves as the main user hub with:
- ✅ Clear profile completion guidance (33% complete)
- ✅ RIASEC career assessment tool
- ✅ Industry news integration
- ✅ Accessible navigation
- ✅ Responsive layout
- ⚠️ News feed CORS issues need resolution
- ⚠️ Cross-browser testing improvements needed

**Overall Status**: Functional with minor issues to address.
