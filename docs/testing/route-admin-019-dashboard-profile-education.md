# Route Exploration: /dashboard/profile/education (Admin)

**Route**: `/dashboard/profile/education`  
**User Role**: Admin (`ewongagent@gmail.com`)  
**Exploration Method**: Code Review  
**Date**: 2025-11-02

---

## Overview

The Education profile route allows users to manage their educational background including highest education level and detailed education history entries. The system integrates with a comprehensive university catalog (10,191+ universities from 202 countries) for standardized institution selection.

**Route Structure**:
- **Route File**: `apps/expo/app/dashboard/profile/education/index.tsx`
- **Left Panel**: `packages/core/features/profile/profile-education-left.tsx` (Form)
- **Right Panel**: `packages/core/features/profile/profile-education-right.tsx` (Display saved entries)

---

## Feature Components

### 1. Highest Education Level (Select Dropdown)
- **Component**: Tamagui Select with Sheet adaptation for mobile
- **Field**: `education_level`
- **Database Source**: `private.profile.education_level`
- **UI**: Native select with chevron icon
- **Mobile**: Sheet overlay with scroll view
- **Desktop**: Standard dropdown

**Education Level Options** (9):
- High School
- Some College
- Associate Degree
- Bachelor Degree
- Master Degree
- Doctoral Degree
- Professional Degree
- Trade School
- Apprenticeship

**Behavior**:
- Optional field (can be undefined)
- Single select
- Placeholder: "Select education level"
- Persists independently of education entries

### 2. Education History (Dynamic Array)
- **Component**: `useFieldArray` from React Hook Form
- **Field**: `education_entries` (array)
- **Max Entries**: Unlimited
- **Features**:
  - Add multiple education entries
  - Remove individual entries
  - Each entry is a separate card with border
  - Numbered display (Education 1, Education 2, etc.)
  - Empty state message when no entries

**Add Education Button**:
- Icon: Plus icon
- Position: Top right of "Education History" section
- Text: "Add Education"
- Size: Small (`$3`)
- Creates new entry with default values

**Remove Education Button**:
- Icon: X icon
- Position: Top right of each education card
- Text: "Remove"
- Variant: Outlined
- Size: Smaller (`$2`)
- Removes specific entry by index

### 3. Institution Selection (University Autocomplete)
- **Component**: `UniversityAutocomplete` (custom)
- **Field**: `university_id` (UUID) + `institution_name` (string)
- **Database Source**: `data.universities` catalog
- **Search Provider**: `office.universities.searchUniversities` tRPC endpoint
- **Required**: Yes (validation error if missing)

**Search Features**:
- Minimum 3 characters to trigger search
- Real-time autocomplete with Popover/Sheet
- Default country filter: "United States"
- Max results: 5 universities
- Trigram similarity search via `search_universities` database function
- Keyboard navigation support (Arrow keys, Enter, Escape)

**University Database**:
- **Total**: 10,191 universities
- **Coverage**: 202 countries
- **Fields**: id, name, country, alpha_two_code, slug

**Display**:
- University name (bold)
- Country (secondary text)
- Loading spinner during search
- Clear button (✕) to reset
- Error state with red border

**Validation**:
- Error message: "Please select an institution from the catalog"
- Shows red border when invalid
- Blocks form submission if empty

### 4. Degree Type (Select Dropdown)
- **Component**: Tamagui Select
- **Field**: `degree_type`
- **Optional**: Yes
- **Mobile**: Sheet overlay

**Degree Type Options** (10):
- High School Diploma
- GED
- Certificate
- Associate Degree
- Bachelor Degree
- Master Degree
- Doctoral Degree
- Professional Degree
- Trade Certification
- Apprenticeship

### 5. Field of Study (Text Input)
- **Component**: Tamagui Input
- **Field**: `field_of_study`
- **Optional**: Yes
- **Placeholder**: "e.g. Computer Science"
- **Max Length**: Not specified in schema
- **UI**: Standard text input

**Trade/Technical Suggestions** (defined in config):
- Electrical
- Plumbing
- HVAC
- Welding
- Carpentry
- Automotive
- Construction Management
- Heavy Equipment Operation
- Manufacturing Technology
- Safety Management

### 6. Date Range (Start Date + End Date)
- **Component**: Two Tamagui Inputs (horizontal layout)
- **Fields**: `start_date`, `end_date`
- **Format**: ISO date string (YYYY-MM-DD)
- **Optional**: Both dates optional
- **Layout**: XStack (side by side)

**Start Date**:
- Placeholder: "YYYY-MM-DD"
- Label: "Start Date"

**End Date**:
- Placeholder: "YYYY-MM-DD or 'Present'"
- Label: "End Date"
- Allows "Present" for current education

**Currently Enrolled**:
- **Field**: `is_current` (boolean, default false)
- Note: Field exists in schema but UI toggle not implemented
- Used for sorting (current education first)

### 7. Description (Text Area)
- **Component**: Tamagui TextArea
- **Field**: `description`
- **Optional**: Yes
- **Max Length**: 500 characters (schema validation)
- **Min Height**: 80px
- **Placeholder**: "Describe your education experience, achievements, relevant coursework..."
- **Multi-line**: Yes

### 8. Save Button
- **Type**: Tamagui Button
- **Behavior**:
  - Disabled when form is not dirty or is loading
  - Shows "Saving..." text when loading
  - Opacity 0.5 when disabled
  - Right-aligned at bottom
- **Submission**: Validates all entries before saving
- **Success**: Refetches both queries (education entries + education level)

---

## Right Panel (Saved Education Display)

**Component**: `ProfileEducationRight`

**Features**:
- Read-only display of saved education entries
- Styled cards with hover effects
- Empty state with GraduationCap icon
- Formatted date ranges
- Loading spinner during data fetch
- Error state handling

**Display Layout** (per entry):
1. **Institution Name** (large, bold, color $color12)
2. **Degree Type** (medium weight, color $color11)
3. **Field of Study** (smaller, color $color11)
4. **Details Section**:
   - **Dates** (Calendar icon): Formatted date range with "Currently enrolled" support
   - **Location** (MapPin icon): Optional location text
   - **Description**: Multi-line text with "Description:" label

**Date Formatting**:
- Uses `formatDateRange` utility
- Format: "Jan 2020 - Dec 2024"
- Handles "Currently enrolled" status
- Shows partial dates (start only, end only)

**Empty State**:
- Icon: GraduationCap
- Message: "No education history saved yet. Add your first education entry in the left panel."

**Card Styling**:
- Border: 1px solid borderColor
- Rounded corners: $4
- Padding: $4
- Background: $background
- Hover: borderColorHover, backgroundHover

---

## tRPC Endpoints

### 1. `profile.getEducation` (Query)
**Purpose**: Fetch user's education entries with university details

**Router**: `packages/supabase/functions/trpc/routers/profile/education.router.ts`

**Database Source**: `private.user_education` table

**Features**:
- Joins with `data.universities` to fetch institution names
- Ordered by start_date descending (most recent first)
- Only returns current user's education
- Resolves university_id to institution_name

**Response Schema**:
```typescript
Array<{
  id: string (UUID)
  user_id: string (UUID)
  university_id: string (UUID)
  institution_name: string
  degree_type: string | null
  field_of_study: string | null
  start_date: string | null  // ISO date
  end_date: string | null    // ISO date
  is_current: boolean
  description: string | null
  location: string | null
  created_at: string
  updated_at: string
}>
```

**Error Handling**:
- Returns empty array on no data
- Throws TRPCError on database failure
- Shows error message in UI

### 2. `profile.getEducationLevel` (Query)
**Purpose**: Fetch user's highest education level from profile

**Database Source**: `private.profile.education_level`

**Response Schema**:
```typescript
{
  education_level: string | null
}
```

### 3. `profile.saveEducation` (Mutation)
**Purpose**: Bulk create/update education entries and education level

**Input Schema**:
```typescript
{
  education_level?: string | null
  education_entries: Array<{
    id?: string (UUID)          // If exists: UPDATE, else: INSERT
    university_id: string (UUID) // Required
    institution_name?: string | null
    degree_type?: string | null
    field_of_study?: string | null
    start_date?: string | null
    end_date?: string | null
    is_current: boolean (default false)
    description?: string | null  // Max 500 chars
    location?: string | null
  }>
}
```

**Behavior**:
1. Updates `education_level` in `private.profile` if provided
2. Loops through `education_entries`:
   - If `entry.id` exists: UPDATE existing record
   - If no `entry.id`: INSERT new record
3. Returns all saved education entries
4. Sets `updated_at` timestamp automatically

**Database Operations**:
- Table: `private.user_education`
- Schema: `private` (RLS enforced)
- Update query includes `user_id` check for security
- Uses `.single()` to return updated record

**Success Response**:
```typescript
{
  success: boolean
  education_entries: Array<EducationEntry>
}
```

**Error Handling**:
- Throws TRPCError on database failure
- Catches and logs errors
- Shows error in UI via query error state

### 4. `profile.deleteEducation` (Mutation)
**Purpose**: Delete a single education entry

**Input Schema**:
```typescript
{
  educationId: string (UUID)
}
```

**Note**: Delete mutation exists in router but NOT implemented in UI (no delete button in current implementation)

**Future Enhancement**: Add delete functionality to UI

### 5. `office.universities.searchUniversities` (Query)
**Purpose**: Search universities for autocomplete (available to all authenticated users)

**Router**: `packages/supabase/functions/trpc/routers/office/universities.router.ts`

**Input Schema**:
```typescript
{
  query: string         // Min 1 char (UI enforces 3)
  country?: string      // Optional country filter (default: "United States")
  limit: number         // Min 1, max 50, default 20 (UI uses 5)
}
```

**Database Function**: `data.search_universities(p_query, p_country, p_limit)`
- Uses PostgreSQL trigram similarity
- Searches university names
- Returns top matches by similarity score

**Response Schema**:
```typescript
{
  universities: Array<{
    id: string (UUID)
    name: string
    country: string
    alpha_two_code: string  // 2-letter country code
    slug: string
  }>
}
```

---

## Form Validation

**Validation Library**: Zod  
**Form Library**: React Hook Form with `zodResolver`  
**Validation Mode**: `onChange` (real-time validation)

**Schema Location**: `packages/core/features/profile/config/education-schema.ts`

**Schema Definition**:
```typescript
educationProfileSchema = z.object({
  education_level: z.enum([...9 options]).optional()
  education_entries: z.array(z.object({
    id: z.string().uuid().optional()
    university_id: z.string().uuid("Please select an institution from the catalog")
    institution_name: z.string().optional()
    degree_type: z.enum([...10 options]).optional()
    field_of_study: z.string().optional()
    start_date: z.string().optional()
    end_date: z.string().optional()
    is_current: z.boolean().default(false)
    description: z.string().max(500).optional()
    location: z.string().optional()
  })).optional()
})
```

**Validation Rules**:
- `university_id`: Required UUID with custom error message
- `description`: Max 500 characters
- All enum fields validated against predefined options
- Dates: String format (no date validation in schema)

**Error Display**:
- University field shows error message below input
- Red border on invalid fields
- Validation triggers on every change
- Save button disabled if invalid

---

## Database Schema

**Table**: `private.user_education`

```sql
CREATE TABLE private.user_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to users(id)
  university_id UUID,      -- FK to data.universities(id)
  institution_name TEXT,   -- Free-form entry (used when university_id is null)
  degree_type TEXT,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_education_id_or_name_check 
  CHECK (
    (university_id IS NOT NULL) OR 
    (institution_name IS NOT NULL)
  )
);
```

**Indexes**:
- `idx_user_education_user_id` - User lookup (most common)
- `idx_user_education_user_current` - Current education filter
- `idx_user_education_university_id` - University joins
- `idx_user_education_dates` - Date range queries

**Triggers**:
- `trg_user_education_updated_at` - Auto-update timestamp

**RLS**: Enabled (users can only access own education)

**Related Tables**:
- `data.universities` - University catalog (10,191 records)
- `private.profile` - User profile with `education_level` field

---

## UI Components

### Custom Components

1. **UniversityAutocomplete** (`packages/ui/src/components/university/UniversityAutocomplete.tsx`)
   - Real-time search with debounce
   - Popover/Sheet results display
   - Keyboard navigation
   - Loading and error states
   - Clear functionality
   - Min 3 character search
   - Cross-platform (web/mobile)

2. **ProfileEmptyState** (`packages/core/features/profile/components`)
   - Icon display
   - Centered message
   - Consistent styling

3. **DashboardWidget** (Container)
   - Consistent card styling
   - Padding and spacing

### Tamagui Components
- `YStack`, `XStack`: Layout containers
- `Text`, `H4`: Typography
- `Input`: Text input fields
- `TextArea`: Multi-line description
- `Select`: Dropdown selects
- `Button`: Add, Remove, Save buttons
- `Spinner`: Loading indicators
- `Sheet`: Mobile select overlays
- `Adapt`: Cross-platform adaptations

---

## State Management

**Form State**:
- Managed by React Hook Form
- `useFieldArray` for dynamic education entries
- Real-time validation with `onChange` mode
- `isDirty` flag tracks unsaved changes
- `errors` object contains validation errors

**Data Fetching**:
- `educationQuery`: Fetches education entries
- `educationLevelQuery`: Fetches education level
- Both queries run in parallel
- `isLoading` state shows spinner
- `isError` state shows error message

**University Search**:
- `searchQuery` state (min 3 chars)
- `searchUniversitiesQuery` - conditional query
- `enabled` only when query length >= 3
- `keepPreviousData` for smooth UX

**Form Reset**:
- `useEffect` resets form when data loads
- Maps API response to form structure
- Preserves existing education entries

**Loading States**:
- Initial load: Full-screen spinner
- Search: Small spinner in autocomplete
- Save: Button shows "Saving..." with disabled state

---

## User Flow

### Initial Load
1. Page navigates to `/dashboard/profile/education`
2. Shows loading spinner: "Loading education data..."
3. Fetches `getEducation` and `getEducationLevel` in parallel
4. Populates form with existing data:
   - Sets education level select
   - Maps education entries to field array
5. Shows empty state if no entries exist

### Adding Education Entry
1. Click "Add Education" button
2. New education card appears (numbered)
3. Form shows:
   - University autocomplete (empty)
   - Degree type select (empty)
   - Field of study input (empty)
   - Start/end date inputs (empty)
   - Description textarea (empty)
4. User searches for university (min 3 chars)
5. Popover shows results
6. User selects university from list
7. University ID and name populate automatically
8. User fills other fields (all optional except university)
9. Form validates in real-time
10. Save button enables when form is dirty and valid

### Editing Existing Entry
1. Existing entries load in numbered cards
2. User modifies any field
3. Form marks as dirty
4. Validation runs on change
5. Save button enables
6. Changes reflected in right panel after save

### Removing Entry
1. Click "Remove" button on education card
2. Entry immediately removed from form
3. Form marks as dirty
4. Save button enables
5. Removal persisted on save

### Saving Changes
1. Click "Save Changes" button
2. Button shows "Saving..." and disables
3. Validates all entries
4. Calls `profile.saveEducation` mutation
5. Updates education level if changed
6. Creates new entries (no ID)
7. Updates existing entries (has ID)
8. Refetches both queries on success
9. Right panel updates with new data
10. Form resets dirty state
11. Error handling via TRPCError

### University Search Flow
1. Focus university autocomplete field
2. Type 1-2 characters: Shows "Type at least 3 characters"
3. Type 3+ characters: Triggers search
4. Shows loading spinner
5. Displays up to 5 results in popover
6. Arrow keys navigate results
7. Enter key selects highlighted result
8. Escape key closes popover
9. Click result to select
10. Field populates with university name
11. University ID stored in hidden field
12. Clear button (✕) resets both fields

---

## Testing Considerations

### Critical Test Cases

1. **Education Level Select**:
   - Select each of 9 education level options
   - Verify dropdown opens
   - Test mobile sheet overlay
   - Verify selection persists
   - Test with no selection (optional)

2. **Add/Remove Education Entries**:
   - Add first education entry
   - Verify numbered card appears (Education 1)
   - Add second entry (Education 2)
   - Add third entry (Education 3)
   - Remove middle entry (renumbers correctly)
   - Remove all entries (shows empty state)
   - Verify "No education entries added yet" message

3. **University Autocomplete**:
   - Type 1 character: No search triggered
   - Type 2 characters: No search triggered
   - Type 3 characters: Search triggers
   - Verify loading spinner appears
   - Verify 5 results display
   - Test result selection
   - Verify university name fills field
   - Test clear button (✕)
   - Test keyboard navigation (arrows, enter, escape)
   - Search "Harvard" - verify Harvard University appears
   - Search "MIT" - verify Massachusetts Institute of Technology
   - Test country filter (US only)

4. **Degree Type Select**:
   - Open degree type dropdown
   - Select each of 10 degree types
   - Verify mobile sheet on small screens
   - Test no selection (optional field)

5. **Field of Study Input**:
   - Enter free-form text
   - Test various fields (Computer Science, Electrical, etc.)
   - Test empty (optional)
   - Verify no max length restriction

6. **Date Range Inputs**:
   - Enter start date (YYYY-MM-DD format)
   - Enter end date (YYYY-MM-DD format)
   - Test end date "Present"
   - Test invalid date formats (no validation)
   - Test empty dates (both optional)
   - Test start date only
   - Test end date only

7. **Description TextArea**:
   - Enter short description (< 100 chars)
   - Enter medium description (100-300 chars)
   - Enter long description (approaching 500 char limit)
   - Test 500 character validation
   - Test 501+ characters (should show error)
   - Test multi-line text
   - Test empty (optional)

8. **Form Validation**:
   - Add entry without university (shows error)
   - Verify required field error message
   - Verify red border on invalid university field
   - Test save button disabled when invalid
   - Test save button disabled when not dirty
   - Verify real-time validation on change

9. **Save Functionality**:
   - Make changes to education level
   - Add new education entry
   - Click "Save Changes"
   - Verify "Saving..." text appears
   - Verify button disables during save
   - Verify success (no error)
   - Verify data persists after refetch
   - Verify right panel updates

10. **Update Existing Entry**:
    - Load page with existing education
    - Modify university selection
    - Modify degree type
    - Modify dates
    - Save changes
    - Verify update (not duplicate)
    - Verify existing entry ID preserved

11. **Right Panel Display**:
    - Verify empty state (no entries)
    - Add entry and save
    - Verify entry appears in right panel
    - Verify formatting:
      - Institution name (large, bold)
      - Degree type (medium)
      - Field of study (small)
      - Calendar icon + dates
      - MapPin icon + location (if provided)
      - Description section
    - Test date formatting (formatDateRange utility)
    - Test hover effects on cards

12. **Loading States**:
    - Initial page load: Verify spinner
    - University search: Verify small spinner
    - Save operation: Verify button state change
    - Verify "Loading education data..." message

13. **Error States**:
    - Network error during fetch (mock)
    - Verify error message: "Failed to load education data"
    - Verify "Retry" button appears
    - Test retry functionality
    - Network error during save (mock)
    - Verify error handling in mutation

### Edge Cases

- Form with no data (empty state)
- Form with 1 entry
- Form with 10+ entries (scroll behavior)
- University search with no results
- University search with special characters
- Very long university names (truncation)
- Very long descriptions (500 char limit)
- Invalid date formats (no validation currently)
- Concurrent updates (race conditions)
- Network timeout during search
- Rapid typing in autocomplete (debounce)
- Mobile sheet behavior
- Keyboard navigation edge cases

### Data Persistence

- Save all fields with complete data
- Refresh page
- Verify all values retained
- Verify correct order (start_date DESC)
- Verify is_current flag (currently enrolled first)
- Test partial updates (only some fields)
- Test multiple education entries persist correctly

### Cross-Platform Testing

- Desktop: Standard dropdowns and popovers
- Mobile: Sheet overlays for selects
- Tablet: Responsive layout
- Touch interactions: Fat-finger friendly
- Keyboard navigation: Tab order, enter, escape

### Accessibility

- University autocomplete keyboard navigation
- Select dropdowns accessible
- Form labels properly associated
- Error messages announced
- Loading states communicated
- Focus management (autocomplete blur/focus)

---

## Schema Constants

**Education Level Options** (9):
```typescript
[
  "High School",
  "Some College",
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral Degree",
  "Professional Degree",
  "Trade School",
  "Apprenticeship"
]
```

**Degree Type Options** (10):
```typescript
[
  "High School Diploma",
  "GED",
  "Certificate",
  "Associate Degree",
  "Bachelor Degree",
  "Master Degree",
  "Doctoral Degree",
  "Professional Degree",
  "Trade Certification",
  "Apprenticeship"
]
```

**Common Trade Fields** (10):
```typescript
[
  "Electrical",
  "Plumbing",
  "HVAC",
  "Welding",
  "Carpentry",
  "Automotive",
  "Construction Management",
  "Heavy Equipment Operation",
  "Manufacturing Technology",
  "Safety Management"
]
```

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **No Delete UI**: `deleteEducation` mutation exists but no delete button in UI
2. **No "Currently Enrolled" Toggle**: `is_current` field exists but no UI checkbox
3. **Date Format**: No date picker, manual YYYY-MM-DD entry
4. **No Date Validation**: Invalid dates accepted (2025-99-99 would pass)
5. **Location Field**: Not implemented in UI (exists in schema)
6. **University Country**: Hardcoded to "United States" in search

### Future Enhancements

1. Add delete button for individual education entries
2. Add "Currently Enrolled" checkbox toggle
3. Implement date picker component
4. Add date range validation (start < end)
5. Add location field input (optional)
6. Add country selector for international universities
7. Add GPA field (not in current schema)
8. Add honors/awards field
9. Add relevant coursework section
10. Add education timeline visualization

---

## Notes

- **University Catalog**: Powered by 10,191 universities from 202 countries
- **Search Performance**: Uses PostgreSQL trigram similarity for fast fuzzy matching
- **Cross-Platform**: All components work on web, iOS, and Android
- **Loading State**: Full-screen spinner during initial data fetch
- **Empty State**: Friendly message encouraging first entry
- **Right Panel Sync**: Real-time update after save
- **Type Safety**: Full TypeScript typing via Zod schemas and tRPC
- **Form State**: React Hook Form provides optimal re-render performance
- **University Selection**: Required field enforced via Zod validation
- **Dynamic Arrays**: useFieldArray enables unlimited education entries

---

## Files Referenced

1. `apps/expo/app/dashboard/profile/education/index.tsx` - Route entry point
2. `packages/core/features/profile/profile-education-left.tsx` - Main form component
3. `packages/core/features/profile/profile-education-right.tsx` - Display panel
4. `packages/core/features/profile/config/education-schema.ts` - Validation schema
5. `packages/supabase/functions/trpc/routers/profile/education.router.ts` - Education tRPC endpoints
6. `packages/supabase/functions/trpc/routers/profile/index.ts` - Profile router merge
7. `packages/supabase/functions/trpc/routers/office/universities.router.ts` - University search endpoint
8. `packages/ui/src/components/university/UniversityAutocomplete.tsx` - Autocomplete component
9. `packages/supabase/migrations/001_schema.sql` - Database schema
10. `packages/supabase/migrations/007_indexes.sql` - Database indexes

---

**Exploration Status**: ✅ Complete  
**Next Step**: Create comprehensive Playwright test suite based on existing test spec
**Existing Test**: `tests/test-r008-profile-education.spec.ts` (basic navigation test only)
