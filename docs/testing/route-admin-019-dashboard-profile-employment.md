# Route Exploration: /dashboard/profile/employment (Admin)

**Route**: `/dashboard/profile/employment`  
**User Role**: Admin (`ewongagent@gmail.com`)  
**Exploration Method**: Code Review  
**Date**: 2025-11-02

---

## Overview

The Employment preferences route allows users to manage comprehensive employment-related settings including work location preferences, travel willingness, residency status, licensing, military status, availability, and compensation expectations.

**Route Structure**:
- **Route File**: `apps/expo/app/dashboard/profile/employment/index.tsx`
- **Left Panel**: `packages/core/features/profile/profile-employment-left.tsx` (Form)
- **Right Panel**: `packages/core/features/profile/profile-employment-right.tsx` (Help text)

---

## Feature Components

### 1. Hourly Rate Input
- **Type**: Numeric input field
- **Validation**: Min: 0, Max: 200 (dollars)
- **Storage**: Stored as `hourly_rate_cents` in database (converted from dollars)
- **Field**: `hourly_rate`
- **UI**: Standard Tamagui Input with numeric keyboard
- **Error Handling**: Shows validation error border and message

### 2. Preferred Work Locations
- **Component**: `LocationListInput`
- **Max Locations**: 3
- **Provider**: Mapbox
- **Features**:
  - Address autocomplete
  - Add/remove locations dynamically
  - "Add Location" button when under limit
  - Delete button (X) for each location
  - Supports broad searches (city, county, state level)
- **Field**: `preferred_work_locations` (array of strings)
- **Help Text**: "You can add up to three locations. This can be as broad as in a state or county, or specific to a city."
- **Validation**: Max 3 locations

### 3. Travel Preferences (ToggleCard with Expandable Content)
- **Component**: `ToggleCard` with expandable slider
- **Icon**: Plane icon
- **Field**: `open_to_travel` (boolean)
- **Title**: "Willing to Travel"
- **Description**: "I am available for work assignments that require travel"

**Expanded Content** (when toggled ON):
- **Travel Distance Slider**:
  - **Field**: `travel_distance_miles`
  - **Component**: Tamagui Slider
  - **Range**: 5 - 100 miles
  - **Step**: 5 miles
  - **Default**: 50 miles
  - **Validation**: Min: 10, Max: 100
  - **Display**: Shows current value in miles with range labels

### 4. Residency Status (ToggleCards)

**US Resident**:
- **Component**: `ToggleCard`
- **Icon**: Flag icon
- **Field**: `us_resident` (boolean)
- **Title**: "US Resident"
- **Description**: "I am a resident of the United States"

**US Passport**:
- **Component**: `ToggleCard`
- **Icon**: MapPin icon
- **Field**: `us_passport` (boolean)
- **Title**: "US Passport"
- **Description**: "I have a valid United States passport"

### 5. Driver's License (ToggleCard with Multi-Select Checkboxes)
- **Component**: `ToggleCard` with expandable checkbox list
- **Icon**: Car icon
- **Field**: `drivers_license_classes` (array)
- **Title**: "I have a valid driver's license"
- **Description**: "Select all license classes that apply"

**License Class Options** (Multi-select):
- Class M
- Class A
- Class B
- Class C
- CDL A
- CDL B
- CDL C

**Behavior**:
- Expands when user toggles ON or when values exist
- Collapses and clears all values when toggled OFF
- Each option is a Checkbox with label
- Checkboxes have unique IDs: `license-class-{name}`

### 6. Military Status (ToggleCard with Multi-Select Checkboxes)
- **Component**: `ToggleCard` with expandable checkbox list
- **Icon**: Shield icon
- **Field**: `military_status` (array)
- **Title**: "Former/Current Military"
- **Description**: "Select all that apply"

**Military Status Options** (Multi-select):
- Active Duty
- Reserve
- National Guard
- Veteran
- Retired

**Behavior**:
- Expands when user toggles ON or when values exist
- Collapses and clears all values when toggled OFF
- Each option is a Checkbox with label
- Checkboxes have unique IDs: `military-{status}`

### 7. Availability (ToggleCard with Multi-Select Checkboxes)
- **Component**: `ToggleCard` with expandable checkbox list
- **Icon**: Calendar icon
- **Field**: `availability` (array)
- **Title**: "I'm available for work"
- **Description**: "Select all that apply"

**Availability Options** (Multi-select):
- Part-time
- Contract
- Full-time
- Weekend
- Night Shift
- Day Shift
- Temporary
- Short Notice

**Behavior**:
- Expands when user toggles ON or when values exist
- Collapses and clears all values when toggled OFF
- Each option is a Checkbox with label
- Checkboxes have unique IDs: `availability-{option}`

### 8. Save Button
- **Type**: Tamagui Button
- **Behavior**:
  - Disabled when form is not dirty or is loading
  - Shows spinner when saving
  - Text changes: "Save Changes" → "Saving..."
  - Opacity: 0.5 when disabled, 1.0 when enabled
- **Position**: Right-aligned at bottom of form
- **Submission**: Triggers form validation before saving

---

## tRPC Endpoints

### 1. `profile.getEmployment` (Query)
**Purpose**: Fetch user's employment preferences

**Response Fields**:
```typescript
{
  preferred_work_locations: string[]      // Array of location strings
  open_to_travel: boolean                 // Default: true
  travel_distance_miles: number           // Default: 25
  us_resident: boolean                    // Default: false
  authorized_countries: string[]          // Array of country codes
  us_passport: boolean                    // Default: false
  drivers_license_classes: string[]       // Array of license classes
  military_status: string[]               // Array of military statuses
  availability: string[]                  // Array of availability options
  hourly_rate: number | null              // Converted from cents to dollars
}
```

**Database Source**: `private.profile` table

**Data Transformation**:
- Converts `hourly_rate_cents` to `hourly_rate` (dollars)
- Returns empty arrays for undefined fields
- Returns defaults for boolean fields

### 2. `profile.updateEmployment` (Mutation)
**Purpose**: Update user's employment preferences

**Input Schema**: `profileEmploymentInputSchema` (Zod)

**Validation Rules**:
- `preferred_work_locations`: Array, max 3 locations
- `open_to_travel`: Boolean, default true
- `travel_distance_miles`: Number, min 10, max 100, default 25
- `us_resident`: Boolean, default false
- `authorized_countries`: Array, max 3 countries
- `us_passport`: Boolean, default false
- `drivers_license_classes`: Enum array (7 options)
- `military_status`: Enum array (5 options)
- `availability`: Enum array (8 options)
- `hourly_rate`: Number, min 0, max 200

**Database Target**: `private.profile` table (upsert)

**Data Transformation**:
- Converts `hourly_rate` (dollars) to `hourly_rate_cents` for storage
- Only updates provided fields (partial updates)
- Sets `updated_at` timestamp
- Requires at least one field besides `user_id` and `updated_at`

**Success Response**:
```typescript
{ success: true }
```

**Error Handling**:
- Shows toast notification on success: "Employment Updated"
- Shows toast on error: "Failed to save employment preferences"
- Logs detailed error information to console
- Refetches data after successful save

---

## Form Validation

**Validation Library**: Zod (`profileEmploymentInputSchema`)  
**Form Library**: React Hook Form with `zodResolver`  
**Validation Mode**: `onChange` (real-time validation)

**Schema Location**: `packages/core/features/profile/config/employment-schema.ts`

**Validation Rules**:
- Hourly rate: 0-200 dollars
- Work locations: Max 3
- Travel distance: 10-100 miles
- Authorized countries: Max 3
- All enum arrays validated against predefined options

**Error Display**:
- Red border on invalid inputs
- Error messages below fields
- Debug error panel at top (shows all validation errors)
- Toast notification on form submission errors

---

## UI Components

### Custom Components
1. **ToggleCard** (`packages/ui/src/components/inputs/ToggleCard.tsx`)
   - Fat-finger friendly (entire card clickable)
   - Optional expandable content
   - Smooth animations
   - Icon + title + description layout
   - Cross-platform compatible

2. **LocationListInput** (`packages/ui/src/components/address/LocationListInput.tsx`)
   - Mapbox address autocomplete
   - Add/remove locations dynamically
   - Max location limit enforcement
   - Empty state with "Add Location" button

3. **DashboardWidget** (Container)
   - Provides consistent card styling
   - Padding and spacing

### Tamagui Components
- `YStack`, `XStack`: Layout containers
- `Text`: Text display
- `Input`: Numeric input for hourly rate
- `Slider`: Travel distance range slider
- `Checkbox`: Multi-select options
- `Label`: Checkbox labels
- `Button`: Save button with loading state
- `Spinner`: Loading indicators

---

## State Management

**Form State**:
- Managed by React Hook Form
- Real-time validation with `onChange` mode
- `isDirty` flag tracks unsaved changes
- `watch()` monitors specific fields (e.g., `open_to_travel`)

**Data Fetching**:
- tRPC query: `api.profile.getEmployment.useQuery()`
- Loading state: `isLoadingEmployment`
- Auto-refetch after successful mutation

**Form Reset**:
- `useEffect` resets form when employment data loads
- Preserves user's existing data

**Local UI State**:
- Each ToggleCard with expandable content manages `isExpanded` state
- Syncs with checkbox values (expands when values exist)

---

## User Flow

1. **Page Load**:
   - Shows spinner while loading employment data
   - Fetches data via `profile.getEmployment`
   - Populates form with existing values

2. **User Interaction**:
   - Edit hourly rate (numeric input)
   - Add/remove work locations (up to 3)
   - Toggle travel preference, adjust distance slider
   - Toggle residency checkboxes
   - Expand license card, select classes
   - Expand military card, select statuses
   - Expand availability card, select options

3. **Real-time Validation**:
   - Form validates on every change
   - Shows errors immediately
   - Save button disabled until form is dirty and valid

4. **Save Changes**:
   - Click "Save Changes" button
   - Shows spinner and "Saving..." text
   - Submits to `profile.updateEmployment` mutation
   - Shows success/error toast
   - Refetches data to confirm update
   - Resets dirty state

---

## Testing Considerations

### Critical Test Cases

1. **Hourly Rate Input**:
   - Enter valid rate (0-200)
   - Test min/max validation
   - Verify numeric keyboard
   - Check cents conversion

2. **Work Locations**:
   - Add first location via autocomplete
   - Add second and third locations
   - Verify max 3 limit (button disappears)
   - Remove locations (X button)
   - Remove all locations

3. **Travel Preferences**:
   - Toggle travel ON
   - Verify slider appears
   - Adjust slider (5-100 miles)
   - Verify current value display
   - Toggle travel OFF
   - Verify slider disappears

4. **Residency Toggles**:
   - Toggle US Resident ON/OFF
   - Toggle US Passport ON/OFF
   - Verify independent operation

5. **Driver's License Multi-Select**:
   - Toggle card ON (expands)
   - Select multiple license classes
   - Verify checkboxes work
   - Toggle card OFF (clears selections)
   - Verify selections cleared

6. **Military Status Multi-Select**:
   - Toggle card ON
   - Select multiple statuses
   - Verify checkbox behavior
   - Toggle OFF and verify clear

7. **Availability Multi-Select**:
   - Toggle card ON
   - Select multiple availability options
   - Test all 8 options
   - Toggle OFF and verify clear

8. **Form Submission**:
   - Make changes
   - Verify Save button enabled
   - Click Save
   - Verify loading state
   - Verify success toast
   - Verify data persists after refresh

9. **Validation Errors**:
   - Enter invalid hourly rate (>200)
   - Add 4+ locations (should prevent)
   - Verify error messages
   - Verify save button disabled

10. **Data Persistence**:
    - Save all fields
    - Refresh page
    - Verify all values retained
    - Verify expanded cards auto-expand when values exist

### Edge Cases
- Form with no data (all defaults)
- Partial updates (only some fields)
- Toggle card collapse behavior
- Slider edge values (5, 100 miles)
- Location autocomplete empty results
- Network errors during save

### Accessibility
- Checkbox labels clickable
- Unique IDs for all form elements
- Keyboard navigation support
- Screen reader compatibility

---

## Schema Constants

**Driver's License Options** (7):
```typescript
["Class M", "Class A", "Class B", "Class C", "CDL A", "CDL B", "CDL C"]
```

**Military Status Options** (5):
```typescript
["Active Duty", "Reserve", "National Guard", "Veteran", "Retired"]
```

**Availability Options** (8):
```typescript
[
  "Part-time", "Contract", "Full-time", "Weekend",
  "Night Shift", "Day Shift", "Temporary", "Short Notice"
]
```

---

## Database Schema

**Table**: `private.profile`

**Relevant Columns**:
- `user_id`: UUID (primary key)
- `preferred_work_locations`: text[]
- `open_to_travel`: boolean
- `travel_distance_miles`: integer
- `us_resident`: boolean
- `authorized_countries`: text[]
- `us_passport`: boolean
- `drivers_license_classes`: text[]
- `military_status`: text[]
- `availability`: text[]
- `hourly_rate_cents`: integer
- `updated_at`: timestamp

---

## Notes

- **Right Panel**: Shows simple help text explaining the purpose of employment preferences
- **Loading State**: Full-screen spinner with "Loading employment preferences..." message
- **Cross-Platform**: All components work on web, iOS, and Android
- **Responsive**: Form adapts to different screen sizes
- **Toast Notifications**: User feedback for save success/failure
- **Debug Panel**: Shows validation errors at top of form (development only)
- **Real-time Sync**: Form state syncs with database after save
- **Partial Updates**: Only changed fields are sent to backend
- **Type Safety**: Full TypeScript typing via Zod schemas and tRPC

---

## Files Referenced

1. `apps/expo/app/dashboard/profile/employment/index.tsx` - Route entry point
2. `packages/core/features/profile/profile-employment-left.tsx` - Main form component
3. `packages/core/features/profile/profile-employment-right.tsx` - Help panel
4. `packages/core/features/profile/config/employment-schema.ts` - Validation schema
5. `packages/supabase/functions/trpc/routers/profile/employment.router.ts` - tRPC endpoints
6. `packages/ui/src/components/inputs/ToggleCard.tsx` - Toggle component
7. `packages/ui/src/components/address/LocationListInput.tsx` - Location picker

---

**Exploration Status**: ✅ Complete  
**Next Step**: Create comprehensive Playwright test suite
