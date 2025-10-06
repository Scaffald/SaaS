# Jobs Preview Modal Implementation

## Overview
Updated the `/dashboard/discover/jobs` page with a preview modal system and dynamic filters based on actual job data.

## Changes Made

### 1. Job Card Component (`ExternalJobCard.tsx`)
- **Removed** "Apply Now" button from the card
- **Changed** "View Details" button to open a modal instead of external link
- **Updated** props from `onApply` to `onViewDetails`
- Button now triggers modal opening instead of direct external navigation

### 2. Jobs List Component (`DiscoverJobsLeft.tsx`)
- **Added** modal state management with `useState`
- **Added** `ExternalJobDetailModal` component integration
- **Updated** job card to use `onViewDetails` callback
- **Implemented** modal open/close handlers
- Modal displays job details with "Apply Now" button inside

### 3. Job Detail Modal (`ExternalJobDetailModal.tsx`)
- **Existing component** now serves as preview modal
- **Contains** full job details including:
  - Company logo and information
  - Job title and metadata
  - Full description
  - Industry tags
  - "Apply Now" button (opens external application link)
  - "View on Site" button (opens job posting)

### 4. Filter System (`DiscoverJobsRight.tsx`)
- **Added** dynamic filter loading from API
- **Implemented** `api.jobs.getFilterOptions.useQuery()` call
- **Display** only filters with actual data:
  - Industries (from job data)
  - Job Types (from job data)
- **Added** count badges showing number of available options
- **Added** loading state while filters are being fetched
- **Conditional rendering** - filters only show if options exist

### 5. tRPC API Endpoint (`jobs.router.ts`)
- **Added** new `getFilterOptions` procedure
- **Queries** external_jobs table for unique values:
  - `job_type` field
  - `job_location` field (extracted but not used in UI yet)
  - Industries from `external_job_industries` junction table
- **Returns** sorted arrays of unique options
- **Uses** for...of loops (biome-compliant)

## User Experience Flow

1. User browses job cards on `/dashboard/discover/jobs`
2. User clicks "View Details" button on any job card
3. Modal opens showing full job details
4. User can:
   - Read full description and requirements
   - Click "Apply Now" to go to application page (external)
   - Click "View on Site" to see original job posting (external)
   - Close modal to return to browsing
5. Filters on right sidebar show only relevant options based on actual jobs

## Benefits

### Better User Experience
- Users can preview jobs without leaving the page
- Clear call-to-action in modal
- Reduced navigation friction

### Dynamic Filters
- Filters automatically adapt to available job data
- No empty/useless filter options
- Shows count of available options for each filter
- Reduces cognitive load

### Performance
- Single API call for filter options
- Cached by React Query
- Loading states for better perceived performance

## Technical Details

### Modal State Management
```typescript
const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null)
const [modalOpen, setModalOpen] = useState(false)

const handleViewDetails = (job: ExternalJob) => {
  setSelectedJob(job)
  setModalOpen(true)
}
```

### Dynamic Filter Generation
```typescript
const { data: filterData, isLoading } = api.jobs.getFilterOptions.useQuery()
const INDUSTRIES = filterData?.industries || []
const JOB_TYPES = filterData?.jobTypes || []
```

### Filter Query Logic
```sql
SELECT DISTINCT job_type, job_location,
  external_job_industries(industry:industries(name))
FROM external_jobs
WHERE is_active = true
```

## Future Enhancements

1. **Location Filter**: Add location-based filtering (data already collected)
2. **Saved Jobs**: Allow users to save/bookmark jobs for later
3. **Application Tracking**: Track which jobs user has applied to
4. **Job Recommendations**: Suggest relevant jobs based on user profile
5. **Advanced Search**: Add more search criteria (salary range, posted date, etc.)
6. **Sort Options**: Allow sorting by date, relevance, salary, etc.

## Testing Checklist

- [x] Job cards display correctly
- [x] "View Details" button opens modal
- [x] Modal shows full job information
- [x] "Apply Now" button navigates to application URL
- [x] Modal closes properly
- [x] Filters load dynamically from API
- [x] Filter selection works correctly
- [x] Search functionality works with filters
- [x] Loading states display correctly
- [ ] Test on actual devices (web, iOS, Android)
- [ ] Verify accessibility
- [ ] Test with large number of jobs
- [ ] Test with no jobs available
- [ ] Test filter edge cases

## Known Issues

- TypeScript errors in tRPC client types (pre-existing project-wide issue)
- No error handling for failed filter API calls
- No pagination for large job lists

## Related Files

- `packages/core/features/discover/components/ExternalJobCard.tsx`
- `packages/core/features/discover/components/ExternalJobDetailModal.tsx`
- `packages/core/features/discover/discover-jobs-left.tsx`
- `packages/core/features/discover/discover-jobs-right.tsx`
- `packages/supabase/functions/trpc/routers/jobs.router.ts`
