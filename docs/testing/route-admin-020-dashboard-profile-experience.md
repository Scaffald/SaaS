# Admin Route Exploration: /dashboard/profile/experience

## Route Information
- **Path**: `/dashboard/profile/experience`
- **Component Location**: `packages/core/features/profile/`
- **Existing Test**: `tests/test-r009-profile-experience.spec.ts`
- **Feature Type**: Dashboard profile subsection (work experience management)
- **Layout Pattern**: Two-column split (left form + right description panel)

---

## Route Structure

### Screen Component
**File**: `packages/core/features/profile/profile-experience-screen.tsx`

Simple router component that splits UI into left (form) and right (description) panels:
```typescript
export function ProfileExperienceScreen() {
  return {
    left: <ProfileExperienceLeft />,
    right: <ProfileExperienceRight />,
  }
}
```

---

## UI Components Analysis

### Left Panel: Work Experience Form (`ProfileExperienceLeft`)

**File**: `packages/core/features/profile/profile-experience-left.tsx`

#### State Management
- **Form Library**: React Hook Form with Zod validation
- **Form Mode**: `onChange` validation
- **Field Array**: Dynamic work experience entries using `useFieldArray`

#### Query/Mutation Hooks
```typescript
// tRPC queries
const experienceQuery = api.profile.getExperience.useQuery()
const experienceSummaryQuery = api.profile.getExperienceSummary.useQuery()

// tRPC mutation
const saveExperienceMutation = api.profile.saveExperience.useMutation({
  onSuccess: () => {
    experienceQuery.refetch()
    experienceSummaryQuery.refetch()
  }
})
```

#### Form Sections

##### 1. Experience Summary (Top Section)
- **Total Years Experience**: Disabled numeric input (computed field, not editable)
- **Career Level**: Select dropdown with 5 options
  - Options: "Entry Level", "Mid Level", "Senior Level", "Executive", "Specialist"
  - Optional field
  - Uses mobile Sheet adapter for touch devices

##### 2. Work History (Dynamic Array)

###### Add Experience Button
- Appends new entry using `createNewExperienceEntry()` helper
- Button shows "Add Experience" with Plus icon

###### Experience Entry Card (Repeating for each entry)
Each entry is contained in a bordered card with:

**Position Header**
- Label: "Position {index + 1}"
- Remove button (X icon) to delete the entry

**Job Title & Company Row**
- **Job Title** (required)
  - Type: Text input
  - Placeholder: "e.g. Electrician"
  - Validation: Min 1 character
  - Error display with red border on validation failure

- **Company Name** (required)
  - Type: Text input
  - Placeholder: "e.g. ABC Construction"
  - Validation: Min 1 character
  - Error display with red border

**Employment Type & Location Row**
- **Employment Type** (optional)
  - Type: Select dropdown
  - Options: "Full-time", "Part-time", "Contract", "Temporary", "Internship", "Apprenticeship", "Freelance"
  - Uses mobile Sheet adapter
  - Default: empty

- **Location** (optional)
  - Type: Text input
  - Placeholder: "e.g. San Francisco, CA"
  - Default: empty string

**Remote Work Checkbox**
- Label: "Remote Work"
- Boolean toggle
- Default: false

**Start & End Date Row**
- **Start Date** (optional)
  - Type: Text input
  - Format: YYYY-MM-DD
  - Placeholder: "YYYY-MM-DD"

- **End Date** (optional)
  - Type: Text input
  - Format: YYYY-MM-DD or "Present"
  - Placeholder: "YYYY-MM-DD or 'Present'"
  - **Disabled when**: `is_current` is true (can't have both)

**Currently Working Checkbox**
- Label: "I currently work here"
- Boolean toggle
- Default: false
- When checked: disables end_date field

**Job Description**
- Type: TextArea (multiline)
- Max: 2000 characters
- Min height: 80px
- Placeholder: "Describe your responsibilities and duties..."
- Optional field

##### 3. Save Button
- Label: Changes to "Saving..." during submission
- Disabled when: `isDirty === false` OR `isLoading === true`
- Opacity: 0.5 when disabled, 1.0 when enabled

##### 4. Saved Experience Display
Shows all previously saved experience entries in Card format:

**Card Content Per Entry**
- **Header Section**
  - **Job Title** (H4 heading)
  - **Company Name** + Employment Type + Status badges
    - Shows "Current Position" badge in green when `is_current === true`
  
- **Details Section**
  - **Date Range**: Uses Calendar icon + formatted date range
    - Format: "MMM yyyy - MMM yyyy" or "MMM yyyy - Present"
  - **Location**: Uses MapPin icon
    - Shows "(Remote)" suffix when `is_remote === true`
  - **Description**: Full job description text (if provided)

#### Loading/Error States
- **Loading**: Shows spinner with "Loading experience data..." text
- **Error**: Shows red error text with Retry button
- **Empty**: Shows ProfileEmptyState component with briefcase icon when no entries exist

### Right Panel: Description Panel (`ProfileExperienceRight`)

**File**: `packages/core/features/profile/profile-experience-right.tsx`

```typescript
<ProfileRightPanel
  title="Work Experience"
  description="Showcase your professional work history and career progression. Add job positions, responsibilities, achievements, and skills used to demonstrate your expertise to potential employers."
/>
```

**Component**: Uses `ProfileRightPanel` wrapper that displays in DashboardWidget
- **Title**: "Work Experience"
- **Description**: Marketing copy about the importance of work history
- **Stats**: Optional (not used in this route)

---

## Form Validation Schema

**File**: `packages/core/features/profile/config/experience-schema.ts`

### Zod Schema Definition
```typescript
const experienceProfileSchema = z.object({
  experience_entries: z.array(
    z.object({
      id: z.string().uuid().optional(),
      organization_id: z.string().uuid().optional(),
      job_title: z.string().min(1, "Job title is required"),
      company_name: z.string().min(1, "Company name is required"),
      employment_type: z.enum([
        "Full-time", "Part-time", "Contract", "Temporary",
        "Internship", "Apprenticeship", "Freelance"
      ]).optional(),
      location: z.string().optional(),
      is_remote: z.boolean().default(false),
      start_date: z.string().optional(),  // ISO date string
      end_date: z.string().optional(),    // ISO date string
      is_current: z.boolean().default(false),
      description: z.string().max(2000).optional(),
    })
  ).optional(),
  career_level: z.enum([
    "Entry Level", "Mid Level", "Senior Level", "Executive", "Specialist"
  ]).optional(),
});
```

### Helper Functions
- **`createNewExperienceEntry()`**: Returns empty/default entry object
- **`EMPLOYMENT_TYPE_OPTIONS`**: Array of 7 employment types
- **`CAREER_LEVEL_OPTIONS`**: Array of 5 career levels
- **`COMMON_JOB_TITLES`**: Array of 15 construction trade titles
- **`SALARY_RANGES`**: Array of 9 salary range buckets (currently unused in UI)

---

## Data Flow & API Integration

### tRPC Endpoints

**File**: `packages/supabase/functions/trpc/routers/profile/experience.router.ts`

Router is integrated into profile router at: `packages/supabase/functions/trpc/routers/profile/index.ts`

#### 1. `getExperience` (Query)
- **Route**: `api.profile.getExperience`
- **Type**: Protected procedure (requires authentication)
- **Input**: None
- **Output**: Array of experience entries
- **Behavior**:
  - Fetches from `private.user_experience` table
  - Filters by `user_id` (current user)
  - Orders by `start_date` descending (newest first)
  - Returns empty array if no entries
- **Error Handling**: Throws TRPCError with INTERNAL_SERVER_ERROR

#### 2. `getExperienceSummary` (Query)
- **Route**: `api.profile.getExperienceSummary`
- **Type**: Protected procedure
- **Input**: None
- **Output**: Object with `career_level: string | null`
- **Behavior**:
  - Fetches from `private.profile` table
  - Filters by `user_id`
  - Returns only `career_level` field
- **Error Handling**: Throws TRPCError on fetch failure

#### 3. `saveExperience` (Mutation)
- **Route**: `api.profile.saveExperience`
- **Type**: Protected procedure
- **Input**:
  ```typescript
  {
    career_level: string | null,
    experience_entries: Array<ExperienceEntry>
  }
  ```
- **Output**:
  ```typescript
  {
    success: boolean,
    experience_entries: Array<ExperienceEntry>
  }
  ```
- **Behavior**:
  - Atomically handles create/update of all experience entries
  - Updates `private.profile.career_level` if provided
  - For each entry:
    - If `id` exists: UPDATE operation with user_id equality check
    - If no `id`: INSERT operation (sets user_id automatically)
  - Sets `updated_at` timestamp
  - Converts null fields properly (empty strings → null)
- **Error Handling**: Comprehensive error wrapping with context

#### 4. `deleteExperience` (Mutation)
- **Route**: `api.profile.deleteExperience`
- **Type**: Protected procedure
- **Input**: `{ experienceId: string (uuid) }`
- **Output**: `{ success: boolean }`
- **Behavior**:
  - Soft delete not implemented (hard delete)
  - Validates both `id` and `user_id` equality
  - Prevents cross-user deletion attempts
- **Error Handling**: TRPCError with context

---

## Database Schema

### Table: `private.user_experience`

**Location**: `packages/supabase/migrations/001_schema.sql` (line 432)

```sql
CREATE TABLE private.user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to auth.users (in 002_relations.sql)
  organization_id UUID,   -- Optional FK to public.organizations (SET NULL on delete)
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,   -- No enum constraint (allows flexibility)
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  start_date DATE,        -- Not TIMESTAMP, just DATE
  end_date DATE,          -- Not TIMESTAMP, just DATE
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Related Table: `private.profile` (for career_level)

**Column**: `career_level TEXT` (line 274)
- Stores one of: "Entry Level", "Mid Level", "Senior Level", "Executive", "Specialist"
- Optional field
- Updated via the `saveExperience` mutation

### Row-Level Security (RLS) Policies

**Location**: `packages/supabase/migrations/005_policies.sql` (lines 605-620)

All policies enforce `auth.uid() = user_id`:

1. **SELECT**: Users can only read their own experience
2. **INSERT**: Users can only create experience for themselves
3. **UPDATE**: Users can only modify their own experience
4. **DELETE**: Users can only delete their own experience

Grants:
- `SELECT, INSERT, UPDATE, DELETE ON private.user_experience TO authenticated`
- `ALL ON private.user_experience TO service_role`

---

## Supporting Utilities

### Date Formatting

**File**: `packages/core/features/profile/utils/date-formatting.ts`

```typescript
export function formatDate(dateStr: string | null | undefined): string
// Returns "MMM yyyy" format or "N/A" if invalid
// Uses date-fns library

export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean
): string
// Returns "MMM yyyy - MMM yyyy" or "MMM yyyy - Present"
```

### Shared Components

**ProfileEmptyState**: `packages/core/features/profile/components/ProfileEmptyState.tsx`
- Displays icon + message in centered card
- Used when no experience entries exist

**ProfileRightPanel**: `packages/core/features/profile/components/ProfileRightPanel.tsx`
- Displays title + optional stats + description
- Used for right sidebar content

---

## Form Data Flow

### Initial Load
1. Component mounts
2. useEffect triggers on `experienceQuery.data` or `experienceSummaryQuery.data` change
3. `reset()` called with:
   - Mapped experience entries from API response
   - Career level from summary query
4. Form displays with loaded data

### User Edit
1. Form state changes trigger `mode: 'onChange'` validation
2. `isDirty` flag tracks if form differs from initial values
3. Save button enabled when `isDirty === true` AND `isLoading === false`

### Form Submission
1. `handleSubmit(onSubmit)` triggered
2. Zod schema validates entire form
3. If validation passes:
   - Sets `isLoading = true`
   - Calls `saveExperienceMutation.mutateAsync()`
   - On success:
     - Calls `experienceQuery.refetch()`
     - Calls `experienceSummaryQuery.refetch()`
     - Form resets to new saved values (isDirty = false)
4. Catch block logs errors

---

## Testing Scenarios

### Current Test Coverage
**File**: `tests/test-r009-profile-experience.spec.ts`

Basic smoke test:
- Navigates to route
- Waits for "Loading..." to disappear
- Checks page content exists

### Recommended Test Cases

#### UI Tests (Playwright)

**Form Interaction Tests**
1. Add new experience entry
   - Click "Add Experience" button
   - Verify new card appears
   - Verify all fields are empty/default values

2. Fill required fields
   - Job Title: type "Senior Electrician"
   - Company Name: type "ABC Corp"
   - Verify Save button becomes enabled

3. Fill optional fields
   - Employment Type: select "Full-time"
   - Location: type "San Francisco, CA"
   - Verify values persisted

4. Toggle remote work
   - Check "Remote Work" checkbox
   - Verify checkbox state persists
   - Verify "(Remote)" tag shows in saved display

5. Set current position
   - Check "I currently work here"
   - Verify End Date input becomes disabled
   - Verify "Current Position" badge appears in saved display

6. Edit existing entry
   - Change job title of saved entry
   - Click Save Changes
   - Verify changes persisted in display

7. Remove entry
   - Click Remove button on entry
   - Verify entry card disappears
   - Click Save Changes
   - Verify entry no longer in saved display

8. Career Level dropdown
   - Select "Mid Level"
   - Save form
   - Reload page
   - Verify "Mid Level" is selected

9. Date formatting
   - Enter start_date: "2020-01-15"
   - Enter end_date: "2022-03-20"
   - Verify displays as "Jan 2020 - Mar 2022"

10. Validation errors
    - Leave Job Title empty, try to save
    - Verify red border on input
    - Verify error message: "Job title is required"
    - Repeat for Company Name

11. Empty state
    - Remove all entries and save
    - Verify "No work experience saved yet" message appears
    - Verify briefcase icon displays

#### API/tRPC Tests (Already in place)
- Full CRUD operations (create, read, update, delete)
- Field validation (required vs optional)
- RLS security (users can't see other users' data)
- Organization FK handling (SET NULL on org delete)
- Career level updates

#### Edge Cases to Test
1. Very long description (2000+ chars) - should be rejected
2. Dates out of order (end before start) - no client validation, backend should handle
3. Same start/end dates - should be valid
4. Special characters in job title/company
5. Null organization_id handling
6. Multiple current positions (should be allowed by schema)
7. Concurrent saves - form should queue properly

---

## Component Dependencies

### External Libraries
- **react-hook-form**: Form state management
- **@hookform/resolvers/zod**: Zod validation resolver
- **zod**: Schema validation
- **tamagui**: UI components and styling
- **expo-crypto**: UUID generation (randomUUID)
- **date-fns**: Date formatting
- **@tamagui/lucide-icons**: Icons (Plus, X, ChevronDown, Briefcase, Calendar, MapPin)

### Internal Dependencies
- `api.profile.getExperience`: tRPC query hook
- `api.profile.getExperienceSummary`: tRPC query hook
- `api.profile.saveExperience`: tRPC mutation hook
- `DashboardWidget`: UI wrapper component
- `ProfileEmptyState`: Empty state component
- `ProfileRightPanel`: Right panel component
- `useWindowDimensions`: Tamagui hook for responsive design

---

## Key Implementation Details

### Mobile Responsiveness
- Uses `useWindowDimensions()` to detect mobile (`width < 640`)
- Sheet component adapts select dropdowns for touch devices
- Two-column layout maintained on all sizes (no collapse to single column)

### Form Reset Behavior
- Resets entire form when query data changes
- This allows:
  - Clearing form after successful save
  - Refreshing when user navigates away and back
  - Manual refetch button in error state

### Loading State Management
- Two separate isLoading states:
  1. Query loading (initial data fetch)
  2. Mutation loading (save operation)
- Save button disabled during either load
- Explicit null checks before using query data

### Error Handling
- Query errors show error message with Retry button
- Mutation errors logged to console
- No error toast/alert (improvements needed)
- Silent failure if mutation errors occur

---

## Known Patterns & Conventions

### Field Array Pattern
Uses React Hook Form's `useFieldArray` for dynamic entry management:
```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: 'experience_entries',
})

// fields.map((field, index) => (
//   <Controller name={`experience_entries.${index}.fieldName`} />
// ))
```

### Conditional Field Disabling
End Date field disabled when is_current is true:
```typescript
disabled={watch(`experience_entries.${index}.is_current`)}
```
Uses `watch()` to subscribe to field changes

### Select Mobile Adaptation Pattern
Tamagui's `Adapt` component wraps sheets for touch platforms:
```typescript
<Adapt when={isMobile} platform="touch">
  <Sheet modal>
    <Adapt.Contents />
  </Sheet>
</Adapt>
```

### Data Mapping on Load
Maps database entities to form shape with explicit null handling:
```typescript
experience_entries: experienceQuery.data.map((exp: any) => ({
  id: exp.id,
  organization_id: exp.organization_id || undefined,
  // ... explicit coercion of nulls to undefined
}))
```

---

## Potential Issues & Improvements

### Current Limitations
1. **No soft delete**: Deleted entries are hard-deleted from DB (unrecoverable)
2. **No error toast**: Mutation errors only logged to console
3. **No date picker**: Users must type dates manually
4. **No confirmation dialogs**: Removing entries happens immediately
5. **Total years calculation**: Read-only, never actually calculated
6. **No organization selection**: Can't link existing organizations in UI
7. **Description character count**: No live counter for 2000 char limit
8. **Concurrent saves**: Multiple rapid saves could cause race conditions
9. **No form state persistence**: Form lost if user navigates away without saving
10. **No visual distinction**: Currently working position not visually highlighted in form

### Suggested Enhancements
1. Add date picker component (react-datepicker or similar)
2. Implement error toast notifications
3. Add confirmation dialog before delete
4. Calculate total_years from entries and display
5. Add organization autocomplete/search in form
6. Add character counter for description
7. Add debouncing to save mutation
8. Implement localStorage form persistence
9. Add drag-to-reorder for experience entries
10. Highlight current position in form with different styling

---

## Files Summary

| File | Purpose |
|------|---------|
| `profile-experience-screen.tsx` | Route screen component (layout) |
| `profile-experience-left.tsx` | Form component (main UI) |
| `profile-experience-right.tsx` | Description panel |
| `experience-schema.ts` | Zod validation schema |
| `experience.router.ts` | tRPC endpoints |
| `date-formatting.ts` | Date utility functions |
| `test-r009-profile-experience.spec.ts` | Playwright E2E tests |
| `001_schema.sql` | DB table definition |
| `005_policies.sql` | RLS policies |

---

## Next Steps for Testing Implementation

1. **Expand E2E tests** in `tests/test-r009-profile-experience.spec.ts`:
   - Form interaction (add, edit, remove entries)
   - Validation error display
   - Save/load round-trip
   - Career level persistence

2. **Add component tests** for:
   - Form submission with various data combinations
   - Field array dynamics (add/remove)
   - Conditional field disabling
   - Error state rendering

3. **Performance tests**:
   - Rendering with 10+ experience entries
   - Save mutation latency
   - Form re-render optimization

4. **Accessibility tests**:
   - Keyboard navigation in field array
   - Screen reader labels
   - Form error announcements

5. **Edge case tests**:
   - Very long descriptions
   - Special characters in names
   - Overlapping date ranges
   - Multiple current positions
