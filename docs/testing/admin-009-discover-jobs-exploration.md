# Admin Route Exploration: /dashboard/discover/jobs

**Route ID**: admin-route-explore-009
**Task ID**: 6cac348c-f8f9-4aac-82b6-2790b4a0f756
**User Type**: Admin (ewongagent@gmail.com)
**Date**: 2025-11-03
**Status**: ✅ COMPLETE

## Overview

The `/dashboard/discover/jobs` route provides a comprehensive job search interface for admin users to discover and filter job opportunities from both internal (Scaffald) and external sources.

## Authentication & Access

- **User**: Admin user (Eric Wong - ewongagent@gmail.com)
- **Profile Completion**: 33% complete (Basic Information and Employment Preferences completed)
- **Access Control**: Route is accessible to authenticated users with proper session
- **Navigation**: Accessible via Dashboard → Discover → Jobs

## UI Component Hierarchy

### 1. Header (Top Navigation)
- **Hamburger Menu** (left): Opens navigation drawer
- **Page Title**: "Search Jobs" (h1)
- **Notifications Bell** (right): Shows notification count (2 notifications visible)

### 2. Navigation Drawer (Left Sidebar)

#### Header Section
- **Scaffald Logo**: Brand identity at top
- **Profile Update Banner**:
  - Text: "Update Profile"
  - Subtext: "Edit Profile"
  - Icon: User avatar icon
  - Action: Links to `/dashboard/profile/general`

#### Main Navigation
1. **Dashboard** - Links to `/dashboard`
2. **Discover** (expandable) - Current section
   - Map → `/dashboard/discover/map`
   - Workers → `/dashboard/discover/workers`
   - Employers → `/dashboard/discover/employers`
   - **Jobs** → `/dashboard/discover/jobs` (current, highlighted in blue)
3. **Profile** (expandable) - User profile sections

#### Footer Section
- **Theme Toggle**: Moon icon for dark mode switch
- **Sign Out**: Logout icon

### 3. Main Content Area (Split Layout)

#### Left Panel - Job Results
**Empty State** (No jobs found):
- Message: "No jobs found"
- Instruction: "Try adjusting your filters or search query"
- **Loading State**: Shows spinner with "Loading jobs..." text

**Note**: Console errors indicate 500 Internal Server Error responses from job search API

#### Right Panel - Search & Filters

##### Search Section
- **Header**: "Search Jobs" with search icon
- **Search Input**:
  - Placeholder: "Search by title, company..."
  - Type: Text input
  - Functionality: Real-time search with debouncing
  - Active state shows search term

##### Filters Section
- **Header**: "Filters" with filter icon
- **Clear Button**: Appears when filters are active (X icon + "Clear" text)

###### Job Source Filter
- **Label**: "Job Source"
- **Options** (Button group):
  1. **All Jobs** - Default state (no filter)
  2. **Internal Jobs (Scaffald)** - Scaffald-posted jobs only
  3. **External Jobs** - Third-party job sources
- **Interaction**: Single-select buttons with active state (blue border/highlight)

##### Active Filters Display
- **Section**: "Active Filters"
- **Format**: Label-value pairs
  - Example: Search: "construction"
- **Visibility**: Only shown when filters are active

## Functional Features

### 1. Search Functionality
- **Real-time Search**: Input triggers job search
- **Search Terms**: Title, company name
- **Active Filter Display**: Shows current search query
- **Clear Function**: Clear button removes all filters

### 2. Filter Functionality
- **Job Source Filtering**: Toggle between All/Internal/External jobs
- **Multiple Filter Support**: Search + Source filters can combine
- **Active State Visual**: Selected filters highlighted
- **Filter Persistence**: Filters maintained during session

### 3. Navigation Features
- **Drawer Toggle**: Hamburger menu opens/closes drawer
- **Submenu Expansion**: Discover and Profile sections expandable
- **Current Route Highlight**: Active route shown in blue
- **Breadcrumb Context**: Page title matches selected route

### 4. Responsive Behavior
- **Two-panel Layout**: Results on left, filters on right
- **Drawer Overlay**: Navigation drawer overlays content on mobile
- **Fixed Header**: Top navigation remains visible

## API Integration

### Observed API Calls
1. **Jobs Search Endpoint**:
   - Endpoint: Unknown (returning 500 errors)
   - Method: Likely GET/POST
   - Parameters: Search query, job source filter
   - **Issue**: Currently returning 500 Internal Server Error
   - Error frequency: Multiple failed requests observed

### Console Messages
```
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## Visual Design

### Color Scheme
- **Primary Blue**: Active states, current route, search terms
- **Gray Backgrounds**: Panels, inactive buttons
- **White**: Main content areas, active input fields
- **Light Gray Text**: Placeholders, helper text

### Typography
- **H1**: "Search Jobs" (page title)
- **Body**: Input placeholders, filter labels
- **Small**: Helper text, active filter values

### Icons
- Filter funnel icon
- Search magnifying glass
- Navigation chevrons (expand/collapse)
- Theme toggle (moon/sun)
- User profile icon
- Notification bell

## User Flows

### Job Search Flow
1. User navigates to Discover → Jobs
2. User enters search term in search box
3. "Active Filters" section appears showing search query
4. Results update (or show "No jobs found")
5. User can clear filters with "Clear" button

### Filter Application Flow
1. User clicks job source filter button
2. Button enters active state (visual highlight)
3. Results filter immediately
4. Active filter shows in "Active Filters" section
5. User can clear or change filters

### Navigation Flow
1. User clicks hamburger menu
2. Drawer slides in from left
3. User clicks "Discover"
4. Submenu expands showing Map/Workers/Employers/Jobs
5. Current route (Jobs) highlighted
6. User can navigate to other routes or close drawer

## Known Issues

### Critical Issues
1. **500 Server Errors**: Job search API returning Internal Server Error
   - Impact: Jobs cannot be loaded
   - Frequency: Consistent on all search attempts
   - User Impact: Complete feature failure

### UI Issues
1. **Empty State Only**: Only "No jobs found" state observed (no jobs available to test)
2. **Error Handling**: No user-facing error message for API failures

## Screenshots

1. `admin-009-discover-jobs-main.png` - Main view with no jobs
2. `admin-009-drawer-open.png` - Navigation drawer expanded
3. `admin-009-discover-submenu.png` - Discover submenu expanded showing all routes
4. `admin-009-internal-jobs-filter.png` - Internal Jobs filter active
5. `admin-009-search-input.png` - Search in progress with loading state
6. `admin-009-search-complete.png` - Search completed with active filters displayed

## Accessibility Notes

### Keyboard Navigation
- Navigation drawer accessible via keyboard
- Filter buttons keyboard focusable
- Search input standard text input (fully accessible)

### ARIA Roles
- Page title uses proper H1 heading
- Search input has placeholder text
- Buttons have descriptive labels
- Links have clear destinations

### Screen Reader Considerations
- "Clear" button has both icon and text
- Active filters announced as text
- Filter state changes should be announced
- Loading states should be announced

## Performance Observations

### Page Load
- Initial load smooth with loading indicator
- Drawer animation smooth
- Filter changes immediate

### API Performance
- API errors indicate backend performance issues
- Multiple retry attempts observed
- No timeout handling visible

## Recommendations for Testing

### Functional Tests
1. Search functionality with various queries
2. Job source filter combinations
3. Clear filters functionality
4. Navigation between Discover routes
5. Drawer open/close behavior
6. Responsive layout behavior

### Integration Tests
1. API error handling and recovery
2. Search debouncing behavior
3. Filter state persistence
4. Results pagination (when jobs available)
5. Job detail view (when jobs clickable)

### Accessibility Tests
1. Keyboard-only navigation
2. Screen reader compatibility
3. Focus management in drawer
4. ARIA label verification
5. Color contrast validation

### Performance Tests
1. Search query performance
2. Filter application speed
3. Large result set handling
4. Concurrent filter changes
5. Network error handling

## Test Data Requirements

### Prerequisites
1. Jobs must exist in database (currently none)
2. Both internal and external jobs needed
3. Jobs with varied titles and companies
4. Jobs matching search terms needed

### User States
- Admin user with partial profile (33% complete)
- User with active session
- User with notification history

## Next Steps

1. **Fix API Errors**: Resolve 500 errors in job search endpoint
2. **Add Test Data**: Seed database with sample jobs
3. **Error Handling**: Add user-facing error messages for API failures
4. **Empty State Enhancement**: Add call-to-action or helpful guidance
5. **Results View**: Test with actual job results to document job cards
6. **Pagination**: Test pagination when multiple pages of results exist

## Related Routes

- `/dashboard/discover/map` - Map view of jobs/workers
- `/dashboard/discover/workers` - Worker search
- `/dashboard/discover/employers` - Employer search
- `/dashboard/profile/general` - Profile completion

## Technical Notes

### Console Warnings
```javascript
[WARNING] props.pointerEvents is deprecated. Use style.pointerEvents
[LOG] [DrawerContent] Role status: {hasOfficeRole: false, roles: Array(1), isLoading: false}
[ERROR] Unknown event handler property onPress
```

### Role Detection
- User has 1 role
- `hasOfficeRole: false` - Not an office admin
- Role loading completes successfully

---

**Exploration completed**: 2025-11-03
**Tester**: Frontend UI Tester Agent (Claude Code)
**Tool**: Playwright MCP Browser
