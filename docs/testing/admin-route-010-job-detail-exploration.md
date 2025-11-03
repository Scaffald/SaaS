# Admin Route Exploration: /dashboard/discover/jobs/:id

**Task ID**: admin-route-explore-010
**Route**: `/dashboard/discover/jobs/:id`
**User Type**: Admin (`ewongagent@gmail.com`)
**Exploration Date**: 2025-11-02
**Status**: ✅ Complete

## Route Overview

Dynamic job detail page that displays comprehensive job information and provides application functionality for both internal and external jobs.

### Route Pattern
- **Path**: `/dashboard/discover/jobs/[id]`
- **Parameter**: `id` (UUID) - Job identifier
- **Example**: `/dashboard/discover/jobs/437fa49d-09cb-4c0c-934d-e37e55c0d421`

## Code Structure

### Files
1. **Screen Component**: `packages/core/features/discover/discover-job-detail-screen.tsx`
2. **Left Panel**: `packages/core/features/discover/discover-job-detail-left.tsx`
3. **Right Panel**: `packages/core/features/discover/discover-job-detail-right.tsx`

### Layout Architecture
- **Split-panel layout**: Left panel for actions, right panel for job details
- **Two job types supported**: Internal jobs (with ApplicationWizard) and External jobs (with external link)
- **Dual API queries**: Tries internal job API first, falls back to external jobs API

## UI Components & Features

### Left Panel (`discover-job-detail-left.tsx`)

#### States
1. **Loading State**
   - Spinner with "Loading..." text
   - Displayed while fetching job data

2. **Not Found State**
   - "Job not found" message
   - Centered layout

3. **Internal Job State**
   - **ApplicationWizard** component
   - Full application flow within the panel
   - Callbacks:
     - `onSuccess`: Logs application ID
     - `onCancel`: Navigates back to jobs list
     - `onReturnToJobs`: Navigates back to jobs list

4. **External Job with URL State**
   - Heading: "Apply to this Position"
   - Description text explaining external application process
   - Button: "Apply on External Site" (with ExternalLink icon)
   - Button: "Back to Jobs" (chromeless)
   - External URL opens in new tab

5. **External Job without URL State**
   - Message: "Application link not available"
   - Button: "Back to Jobs"

### Right Panel (`discover-job-detail-right.tsx`)

#### Internal Job Display

**Header Section**:
- Applied status banner (green, if user has already applied)
- Job title (large, bold)
- Organization name (with Building2 icon)

**Job Metadata**:
- Location (MapPin icon)
- Employment type (Briefcase icon) - Formats: Full-Time, Part-Time, Contract, Temporary, Internship
- Remote option chip (blue) - Options: On-site, Hybrid, Remote
- Pay range (DollarSign icon, green) - Formatted based on type (hourly/salary/contract/project)

**Benefits Section** (if available):
- Green background card
- Heart icon
- Benefits summary text

**Description Section**:
- "Job Description" heading
- Full job description text

**Requirements Section** (if any requirements exist):
- Minimum education level (Award icon, red)
- Minimum years of experience (Clock icon, blue)
- Background check requirement (Shield icon)
- Drug test requirement (Shield icon)
- Driver's license requirement (Briefcase icon)
- Security clearance (Shield icon, red)
- Travel percentage (Plane icon)

**Work Details Section** (if available):
- Work schedule details (Clock icon)
- Timezone (MapPin icon)
- Relocation assistance (Home icon, green)

**Deadlines Section** (if applicable):
- Yellow background card
- Calendar icon
- Application deadline formatted date

**Required Certifications** (if any):
- Red chips with certification names
- Wrapped flex layout

**Required Skills** (if any):
- Blue chips with skill names
- Wrapped flex layout

#### External Job Display

**Header Section**:
- "External Job" red chip badge
- Job title (large, bold)
- Company name (Building2 icon)

**Job Metadata**:
- Location (MapPin icon)
- Job type (Briefcase icon)
- Job category (blue chip)

**Description Section**:
- Job description text

**Industries Section** (if available):
- Blue chips showing industry names

**External Link Notice**:
- Blue background info card
- ExternalLink icon
- Explanation of external application process

## API Integration

### Internal Jobs
- **Query**: `api.jobs.getJobDetails.useQuery({ id: jobId })`
- **Returns**:
  - `job`: Full job object with organization, skills, certifications, etc.
  - `hasApplied`: Boolean indicating if user has already applied

### External Jobs
- **Query**: `api.jobs.getExternalJobs.useQuery()`
- **Fallback**: Only called if internal job not found
- **Returns**: Array of external jobs, filtered by ID

## User Flows

### Admin Viewing Internal Job
1. Navigate to `/dashboard/discover/jobs/:id`
2. Page loads with job details in right panel
3. ApplicationWizard displayed in left panel
4. If already applied, green status banner shows at top
5. User can fill out ApplicationWizard to apply
6. User can cancel and return to jobs list

### Admin Viewing External Job
1. Navigate to `/dashboard/discover/jobs/:id`
2. Page loads with external job details in right panel
3. Left panel shows "Apply to this Position" with external link button
4. User clicks "Apply on External Site" to open job URL in new tab
5. User can click "Back to Jobs" to return to jobs list

## Accessibility Features

### Icons with Semantic Meaning
- All icons have associated text labels
- Color-coded sections (green for benefits/positive, yellow for deadlines, blue for information, red for requirements)

### Loading & Error States
- Clear loading indicators with text
- Helpful error messages for not found states
- Fallback behavior for external jobs without URLs

### Keyboard Navigation
- Buttons are keyboard accessible
- ScrollView for long content
- Focus management through routing

## Testing Requirements

### Test Cases for admin-route-explore-010

#### TC-010-01: Load Internal Job Detail Page
- **Given**: Valid internal job ID exists in database
- **When**: Admin navigates to `/dashboard/discover/jobs/:id`
- **Then**:
  - Job details display in right panel
  - ApplicationWizard displays in left panel
  - All job metadata renders correctly (title, company, location, pay, etc.)

#### TC-010-02: Display Application Status
- **Given**: Admin has already applied to the job
- **When**: Admin views job detail page
- **Then**: Green "You've Applied" status banner shows at top of right panel

#### TC-010-03: Apply to Internal Job
- **Given**: Admin has not applied to job
- **When**: Admin fills out ApplicationWizard and submits
- **Then**:
  - Application is created
  - Success callback fires
  - Option to edit application or return to jobs list

#### TC-010-04: Cancel Application Process
- **Given**: Admin is in ApplicationWizard flow
- **When**: Admin clicks cancel
- **Then**: User navigates back to `/dashboard/discover/jobs`

#### TC-010-05: Load External Job Detail Page
- **Given**: Valid external job ID exists
- **When**: Admin navigates to `/dashboard/discover/jobs/:id`
- **Then**:
  - External job details display in right panel
  - "External Job" badge shows
  - "Apply on External Site" button displays in left panel

#### TC-010-06: Apply to External Job
- **Given**: External job with valid URL
- **When**: Admin clicks "Apply on External Site"
- **Then**: External URL opens in new browser tab

#### TC-010-07: External Job without URL
- **Given**: External job with no URL
- **When**: Admin views job detail page
- **Then**: "Application link not available" message shows with "Back to Jobs" button

#### TC-010-08: Job Not Found
- **Given**: Invalid job ID
- **When**: Admin navigates to `/dashboard/discover/jobs/:id`
- **Then**: "Job not found" message displays with helpful text

#### TC-010-09: Display Job Requirements
- **Given**: Job has education, experience, certifications, etc.
- **When**: Admin views job details
- **Then**: All requirements display in "Requirements" section with appropriate icons

#### TC-010-10: Display Job Skills and Certifications
- **Given**: Job has required skills and certifications
- **When**: Admin views job details
- **Then**:
  - Skills display as blue chips
  - Certifications display as red chips
  - Both sections use flex-wrap layout

## Notes

### Data Requirements
- No jobs exist in fresh database after seed
- Jobs must be created manually via Supabase or through Office admin interface
- Test job created with ID: `437fa49d-09cb-4c0c-934d-e37e55c0d421`

### Admin-Specific Behavior
- Route functions identically for regular users and admins
- No admin-specific features observed on this route
- ApplicationWizard behavior is user-agnostic

### Edge Cases Handled
- Internal job not found → tries external jobs
- External job with no URL → shows appropriate message
- User has already applied → shows status banner
- Long content → ScrollView in right panel
- Multiple skills/certs → flex-wrap layout prevents overflow

### Dependencies
- ApplicationWizard component (applications feature)
- Jobs API (tRPC endpoints)
- Tamagui UI components
- Lucide icons
- React Query for data fetching

## Recommendations

### Test Implementation
1. Create Playwright test file: `tests/test-r015-job-detail.spec.ts`
2. Use similar pattern to discover routes tests
3. Create test jobs in beforeEach hook
4. Test both internal and external job flows
5. Verify all UI sections render correctly

### Improvements Identified
1. Consider adding share/bookmark functionality
2. Could benefit from related jobs section
3. Consider adding employer reviews/ratings section
4. Could display similar jobs from same employer

### Documentation
- Route is well-structured and follows project conventions
- Code is clean and maintainable
- Component separation (left/right panels) is logical
- Dual job type support (internal/external) is elegant

## Related Routes
- `/dashboard/discover/jobs` - Jobs list page
- `/dashboard/profile/*` - Profile sections (for ApplicationWizard)
- `/dashboard/applications` - View submitted applications

## Status
✅ Route exploration complete
✅ UI documentation complete
✅ Test cases defined
✅ Ready for test implementation
