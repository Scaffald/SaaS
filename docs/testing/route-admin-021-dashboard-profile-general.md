# Admin Route Exploration: /dashboard/profile/general

**Route Path**: `/dashboard/profile/general`
**Component Location**: `packages/core/features/profile/`
**Exploration Date**: 2025-11-02
**Status**: Complete Code Review

## Route Information

### Path Structure
- **Route**: `/dashboard/profile/general`
- **Location**: `apps/expo/app/dashboard/profile/general/index.tsx`
- **Layout Pattern**: Two-column dashboard layout (left form + right info panel)
- **Authentication**: Required (protected route)

### Page Structure
The route renders a two-column dashboard layout:
- **Left Panel**: `ProfileGeneralLeft` - Form for editing general profile information
- **Right Panel**: `ProfileGeneralRight` - Navigation overview and educational tips

---

## UI Components Analysis

### Left Panel: ProfileGeneralLeft Component

**File**: `packages/core/features/profile/profile-general-left.tsx`

#### Form Fields and Controls

1. **Avatar Section**
   - Component: `AvatarImagePicker`
   - Type: Image upload
   - Size: 120px circular avatar
   - Features:
     - Click to upload new avatar
     - Click again to clear avatar
     - Shows loading state while uploading
     - Converts image to base64 for transmission
     - Supports .jpg and other image formats
   - Validation: Image processing (client-side only)

2. **Name Fields (Required)**
   - **First Name**
     - Input type: Text
     - Validation: Required, max 50 characters
     - Error display: Red border + error text
     - Real-time validation enabled (onChange mode)
   
   - **Last Name**
     - Input type: Text
     - Validation: Required, max 50 characters
     - Error display: Red border + error text
     - Real-time validation enabled

3. **About Section (Optional)**
   - Component: TextArea
   - Type: Free-form text
   - Validation: Max 500 characters
   - Placeholder: "Tell us about yourself..."
   - Height: Minimum 100px
   - Character limit: 500

4. **Contact Information**
   - **Phone**
     - Component: `PhoneNumberInput`
     - Type: Formatted phone input
     - Validation: 
       - Optional field
       - 10-15 digits after formatting
       - Regex: `/[^\d]/g` removes non-digits
     - Features:
       - Default country: "US"
       - Stores formatted value
       - Shows error message if invalid
   
   - **Email (Read-Only)**
     - Input type: Text
     - State: Disabled/read-only
     - Source: Auth system (not editable)
     - Display note: "Email changes must be made through account settings"
     - Visual treatment: Reduced opacity (0.7)

5. **Address Section (Optional)**
   - Component: `ControlledAddressForm`
   - Type: Smart address autocomplete
   - Fields:
     - Street address
     - City
     - State
     - Zip code
     - Country
     - Latitude/Longitude (captured for PostGIS geo field)
   - Features:
     - Map-based autocomplete integration
     - Converts lat/lng to PostGIS POINT format for storage
     - Triggers validation on address selection
     - Error display for invalid addresses

#### Form Behaviors

- **Validation Mode**: Real-time (onChange)
- **Resolver**: Zod schema validation (`generalProfileSchema`)
- **Save Button**:
  - Text: "Save Changes"
  - State: Disabled until form is dirty (changes made)
  - Loading state: Shows spinner + "Saving..." text
  - Opacity: 0.5 when disabled, 1.0 when enabled

- **Error Display**:
  - Inline error messages below each field
  - Red text color (`$red10`)
  - Red border on input fields (`$red8`)

#### Form State Management

- **React Hook Form**: useForm hook with Zod resolver
- **Controller Components**: Wrapped inputs for form control
- **Watch**: Tracks avatar_path changes in real-time
- **Dirty Tracking**: Detects unsaved changes
- **Error Tracking**: Form validation state with detailed errors

#### Data Flow - Get Operation

```
ProfileGeneralLeft Component
  ↓
api.profile.getGeneral.useQuery()
  ↓
[tRPC] profileGeneralRouter.getGeneral (protected)
  ↓
1. Fetch auth user (for email + phone from auth.users)
2. Fetch profile data (from public.users table)
   - avatar_path
   - about
3. Fetch PII data (from private.profile table)
   - first_name
   - last_name
   - address (JSON object)
  ↓
Return: GeneralProfileFormData object
  ↓
Form reset() with fetched data
```

**tRPC Endpoint Details**:
- Location: `packages/supabase/functions/trpc/routers/profile/general.router.ts`
- Authentication: protectedProcedure (requires user token)
- User Context: Extracted from JWT token via middleware
- Error Handling: Throws TRPCError on auth/fetch failures

#### Data Flow - Update Operation

```
User Submits Form
  ↓
handleSubmit(onSubmit) triggered
  ↓
Form Validation (Zod)
  ↓
If valid: api.profile.updateGeneral.useMutation()
  ↓
[tRPC] profileGeneralRouter.updateGeneral
  ↓
1. Update public.users table:
   - avatar_path (optional)
   - about (optional)
   - updated_at (timestamp)
  
2. Update private.profile table (upsert):
   - first_name (optional)
   - last_name (optional)
   - address (JSON object, optional)
   - geo (PostGIS POINT format, if lat/lng provided)
   - updated_at (timestamp)
  ↓
Return: { success: true }
  ↓
On Success:
  - Show toast: "Profile Updated"
  - Call refetch()
  - Re-validate form
  
On Error:
  - Show toast with error message
  - Log error to console
  - Form remains dirty
```

**tRPC Endpoint Details**:
- Location: `packages/supabase/functions/trpc/routers/profile/general.router.ts`
- Type: protectedProcedure mutation
- Input Validation: profileGeneralInputSchema
- Conditional Updates: Only updates fields that are provided (partial updates supported)
- Geo Conversion: Automatically converts address lat/lng to PostGIS POINT format

#### Avatar Upload Flow

```
User Selects Image
  ↓
AvatarImagePicker onImageSelect callback
  ↓
Convert Image to Base64:
  1. Fetch image from URI
  2. Convert to Blob
  3. Read as DataURL (base64)
  
Mutation: api.profile.uploadAvatar.useMutation()
  ↓
[tRPC] profileAvatarRouter.uploadAvatar
  ↓
1. Decode base64 to Uint8Array
2. Generate unique filename: `${user.id}/avatar-${Date.now()}.jpg`
3. Upload to Supabase Storage ("avatars" bucket)
   - Content-Type: image/jpeg
   - Upsert: true (replaces existing)
4. Update users table with avatar_path
  ↓
Return: { success: true, avatarPath: uniqueFileName }
  ↓
On Success:
  - Show toast: "Avatar Uploaded"
  - Update form field: setValue('avatar_path', avatarPath)
  - Call refetch()
  
On Error:
  - Show toast with error message
  - Log error to console
```

**Avatar Upload Endpoint Details**:
- Location: `packages/supabase/functions/trpc/routers/profile/avatar.router.ts`
- Input Validation: uploadAvatarInputSchema
- File Storage: Supabase Storage (avatars bucket)
- Path Format: `${user.id}/avatar-${timestamp}.jpg`
- Database Update: Users table avatar_path field

### Right Panel: ProfileGeneralRight Component

**File**: `packages/core/features/profile/profile-general-right.tsx`

#### Layout and Content

1. **Header Widget**
   - Title: "General Information"
   - Description: "Update your basic profile information including your name, photo, and contact details."
   - Component: DashboardWidget wrapper

2. **Animated Tips Cards** (StackedCards component)
   - Interval: 8000ms (8 seconds between cards)
   - Auto-play: True
   - Max stack size: 2 cards visible

   **Card 1: Profile Photo Impact**
   - Title: "📸 Add a Profile Photo"
   - Subheading: "Did you know that profiles with a photo are dramatically more visible?"
   - Content: Members with photos receive 21x more views and 36x more messages
   - CTA: Encourages avatar upload

   **Card 2: First Impressions**
   - Title: "⏱ First Impressions"
   - Subheading: "Make Every Second Count"
   - Content: Recruiters give 6 seconds to scan profiles; having basic details (name, email, phone) is crucial
   - CTA: Complete basic information quickly

   **Card 3: Verified Credentials**
   - Title: "🎖 Verified Credentials"
   - Subheading: "Verified Details Build Trust"
   - Content: Displaying credentials publicly increases likelihood of employment by ~6 percentage points
   - CTA: Share verified information

#### Mobile Variant (profile-general-right.native.tsx)

On native platforms, the tips cards are hidden. Only the header widget displays:
```
General Information
Update your basic profile information including your name, photo, and contact details.
```

---

## Form Validation Schema

**File**: `packages/core/features/profile/config/general-schema.ts`

```typescript
generalProfileSchema = z.object({
  avatar_path: z.union([
    z.string().url(),      // URL format
    z.string().min(1),     // Non-empty string (file path)
    z.literal("")          // Empty string (cleared)
  ]).optional(),
  
  first_name: z.string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  
  last_name: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  
  about: z.string()
    .max(500, "About section must be 500 characters or less")
    .optional(),
  
  phone: phoneNumberSchema
    // 10-15 digits, optional
  
  email: z.string()
    .email("Please enter a valid email address")
    .optional(),
  
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).nullable().optional()
})
```

---

## Database Schema

### Public Data (public.users table)

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  avatar_path TEXT,        -- File path to avatar in storage
  avatar_url TEXT,         -- Full URL (legacy, not used in new flow)
  about TEXT,              -- User bio/about section
  updated_at TIMESTAMPTZ,
  -- ... other fields
)
```

**Fields Used by /dashboard/profile/general:**
- `avatar_path`: Path to avatar file in Supabase Storage
- `about`: User's about/bio text
- `updated_at`: Timestamp of last update

### Private Data (private.profile table)

```sql
CREATE TABLE private.profile (
  user_id UUID PRIMARY KEY,
  first_name TEXT,         -- User's first name (PII)
  last_name TEXT,          -- User's last name (PII)
  address JSONB,           -- Complete address object:
                           -- { street, city, state, zip, country }
  geo GEOGRAPHY(POINT),    -- PostGIS geographic point
                           -- Format: POINT(longitude latitude)
  updated_at TIMESTAMPTZ,
  -- ... other fields
)
```

**Fields Used by /dashboard/profile/general:**
- `first_name`: User's first name (required)
- `last_name`: User's last name (required)
- `address`: JSON object with address components
- `geo`: PostGIS POINT format for geographic queries

### Avatar Storage (Supabase Storage)

**Bucket**: `avatars`
**Path Format**: `${user_id}/avatar-${timestamp}.jpg`
**Content Types**: image/jpeg, image/png, image/webp
**Access**: Private (requires authentication)

### Email and Phone Fields

**Source**: Supabase auth.users table
**Management**: Via Supabase Auth API (not in profile tables)
**In Profile**: Read-only, displayed from auth context
**Note**: Email and phone cannot be updated through this profile endpoint

---

## tRPC API Endpoints

### Profile Endpoints (User)

#### getGeneral
- **Path**: `api.profile.getGeneral`
- **Type**: Query (useQuery hook)
- **Authentication**: Required (protectedProcedure)
- **Input**: None
- **Output**: `GeneralProfileFormData`

**Response Object**:
```typescript
{
  first_name: string,
  last_name: string,
  avatar_path: string,
  email: string,
  phone: string,
  about: string,
  address: {
    street?: string,
    city?: string,
    state?: string,
    zip?: string,
    country?: string,
    latitude?: number,
    longitude?: number,
  } | null
}
```

**Server Logic**:
1. Get auth user (email, phone) from auth.users
2. Get avatar_path, about from public.users
3. Get first_name, last_name, address from private.profile
4. Combine and return

#### updateGeneral
- **Path**: `api.profile.updateGeneral`
- **Type**: Mutation (useMutation hook)
- **Authentication**: Required
- **Input**: `profileGeneralInputSchema`
- **Output**: `{ success: true }`

**Input Object**:
```typescript
{
  first_name: string,          // Required
  last_name: string,           // Required
  avatar_path?: string,        // Optional
  email?: string,              // Optional (ignored if provided)
  phone?: string,              // Optional (read-only)
  about?: string,              // Optional
  address?: {                  // Optional
    street?: string,
    city?: string,
    state?: string,
    zip?: string,
    country?: string,
    latitude?: number,
    longitude?: number,
  } | null
}
```

**Server Logic**:
1. Validate input against profileGeneralInputSchema
2. Update public.users (avatar_path, about)
3. Upsert private.profile (first_name, last_name, address)
4. Convert lat/lng to PostGIS POINT format for geo field
5. Return success

#### uploadAvatar
- **Path**: `api.profile.uploadAvatar`
- **Type**: Mutation (useMutation hook)
- **Authentication**: Required
- **Input**: `uploadAvatarInputSchema`
- **Output**: `{ success: true, avatarPath: string }`

**Input Object**:
```typescript
{
  file: string,              // Base64 encoded image data
  fileName: string,          // Original filename
  contentType: string,       // MIME type (e.g., "image/jpeg")
}
```

**Server Logic**:
1. Decode base64 to Uint8Array
2. Generate unique filename: `${user.id}/avatar-${timestamp}.ext`
3. Upload to Supabase Storage (avatars bucket)
4. Update public.users with avatar_path
5. Return avatarPath

### Office Endpoints (Admin - Similar Interface)

#### getUserGeneral
- **Path**: `api.office.getUserGeneral`
- **Type**: Query (useQuery hook)
- **Authentication**: Required (officeProcedure - admin only)
- **Input**: `{ userId: string }`
- **Output**: Same as profile.getGeneral

**Difference**: Uses supabaseAdmin client for accessing any user's profile

#### updateUserGeneral
- **Path**: `api.office.updateUserGeneral`
- **Type**: Mutation (useMutation hook)
- **Authentication**: Required (admin only)
- **Input**: `{ userId: string, data: generalProfileInputSchema }`
- **Output**: `{ success: true }`

**Difference**: Allows admins to update any user's profile

---

## Component Integration: GeneralProfileSection

**File**: `packages/core/features/profile/components/GeneralProfileSection.tsx`

This is a reusable component used in both user and admin contexts.

### Props Interface

```typescript
interface GeneralProfileSectionProps {
  userId?: string          // User ID to edit (admin mode)
  mode?: 'user' | 'admin'  // Which endpoints to use
  readOnly?: boolean       // View-only mode
}
```

### Mode Behavior

**Mode: 'user'** (default)
- Uses `api.profile.getGeneral` and `api.profile.updateGeneral`
- Email field shows: "(Read-only)" label
- Works for current authenticated user

**Mode: 'admin'** (requires userId)
- Uses `api.office.getUserGeneral` and `api.office.updateUserGeneral`
- Email field shows no read-only label
- Works for any user (admin context)

**Read-Only Mode**
- All inputs become disabled/read-only
- Opacity reduced to 0.7
- Save button hidden
- Avatar upload disabled

### Differences from ProfileGeneralLeft

- Uses `AddressForm` instead of `ControlledAddressForm`
- More flexible for different contexts
- Better error handling with proper type guards
- Supports mode switching (user vs admin)

---

## State Management

### Form State (React Hook Form)

```typescript
useForm<GeneralProfileFormData>({
  resolver: zodResolver(generalProfileSchema),
  defaultValues: generalProfileDefaults,
  mode: 'onChange'  // Real-time validation
})
```

**Tracked Values**:
- `isDirty`: Has user made changes?
- `errors`: Validation error messages
- `isSubmitting`: Is submission in progress?

### Query State (React Query)

```typescript
api.profile.getGeneral.useQuery()
  // Auto-fetches on mount
  // Auto-refetches after mutation
  // Caching handled by React Query
```

### Mutation State

```typescript
api.profile.updateGeneral.useMutation({
  onSuccess: () => {
    // Show success toast
    // Refetch data
  },
  onError: (error) => {
    // Show error toast
    // Log error
  }
})
```

### Local Component State

```typescript
const [isLoading, setIsLoading] = useState(false)  // Manual loading state
const toast = useToastController()                 // Toast notifications
```

---

## Error Handling

### Form Validation Errors
- Displayed inline below each field
- Red text color
- Red border on input fields
- Examples: "First name is required", "Phone number too long"

### Network Errors
- Caught by mutation onError handler
- Displayed in toast notification
- Error message extracted from TRPCError
- Logged to console for debugging

### File Upload Errors
- Image processing errors: "Failed to process image"
- Upload errors: "Failed to upload avatar"
- Storage errors: "Failed to upload avatar"
- Database errors: "Failed to update profile with avatar path"

### Data Fetch Errors
- INTERNAL_SERVER_ERROR: Database connection issues
- Authentication errors: User not found or invalid token
- Wrapped in TRPCError for consistency

---

## Testing Recommendations

### Unit Tests (Component Level)

1. **Form Rendering**
   - All form fields render correctly
   - Avatar picker renders with correct size
   - Save button is disabled when form is pristine
   - Required fields are marked with asterisks

2. **Form Validation**
   - First name required validation
   - Last name required validation
   - First/last name max length validation (50 chars)
   - About max length validation (500 chars)
   - Phone validation (10-15 digits)
   - Address optional validation

3. **Form State**
   - Form is dirty when user makes changes
   - Form is clean after successful submission
   - Errors clear when field is corrected
   - All fields reset when data is re-fetched

### Integration Tests (API Level)

1. **Get Profile Data**
   - Successfully fetch profile for authenticated user
   - Handle case when user has no profile (create default)
   - Handle case when address is null
   - Combine public and private data correctly

2. **Update Profile Data**
   - Update first name only
   - Update last name only
   - Update about text
   - Update avatar_path
   - Update complete address with all fields
   - Partial updates (some fields only)
   - Conditional updates (only fields provided)

3. **Avatar Upload**
   - Successfully upload image file
   - Generate unique filename with user ID and timestamp
   - Handle image conversion to base64
   - Handle content-type detection
   - Update database with avatar_path
   - Handle upload errors gracefully

### E2E Tests (User Flow)

1. **Happy Path - Complete Profile Edit**
   - Login as test user
   - Navigate to /dashboard/profile/general
   - Fill in all form fields
   - Upload avatar
   - Submit form
   - Verify success toast
   - Verify data persists on page refresh
   - Verify data visible in other profile sections

2. **Partial Update**
   - Login as test user
   - Navigate to /dashboard/profile/general
   - Change only first name
   - Submit
   - Verify only first name updated
   - Other fields remain unchanged

3. **Avatar Upload Only**
   - Login as test user
   - Navigate to /dashboard/profile/general
   - Upload new avatar without changing other fields
   - Verify avatar displays correctly
   - Verify form dirty state handled correctly

4. **Validation Error Handling**
   - Fill first name with > 50 characters
   - Verify error message displays
   - Verify save button remains disabled
   - Correct the error
   - Verify error clears and save button enables

5. **Read-Only Mode (Admin Context)**
   - Admin views worker profile in read-only mode
   - All fields disabled/read-only
   - Avatar upload disabled
   - Save button hidden
   - Only display existing data

### Test Cases by Field

#### First Name Field
- Required validation (empty value)
- Max length validation (50 chars)
- Display error on validation failure
- Clear error on valid input
- Persist value after save

#### Last Name Field
- Same as first name
- Unique validation separate from first name

#### Avatar
- Upload valid image (jpg, png)
- Handle upload in progress state
- Verify storage path generation
- Verify image displays in UI
- Clear avatar functionality
- Handle upload errors

#### Phone
- Valid 10-digit US number
- Valid 15-digit international number
- Invalid (too short < 10)
- Invalid (too long > 15)
- Format preservation
- Optional field handling

#### About
- Max 500 character validation
- Support multiline text
- Optional field handling
- Special characters support

#### Address
- Street address validation (optional)
- City validation (optional)
- State validation (optional)
- Zip code validation (optional)
- Country field (default: "United States")
- Latitude/longitude capture
- PostGIS POINT conversion on server
- Autocomplete integration

#### Email
- Display read-only in user mode
- No edit capability
- Sourced from auth.users
- Display not editable label

### Performance Tests

1. Form validation performance (should be instant)
2. Image upload size limits and processing time
3. Network request debouncing
4. Real-time validation responsiveness

### Security Tests

1. XSS prevention in form fields
2. CSRF protection in mutations
3. User can only edit own profile (user mode)
4. Admin can edit any user profile (office mode)
5. Email/phone cannot be edited through this endpoint
6. Avatar file size limits
7. Image type validation

---

## Shared Component: ControlledAddressForm vs AddressForm

### ControlledAddressForm (Profile General Left)
- Uses React Hook Form Controller wrapper
- Controlled by form's setValue, trigger
- Manual field management
- Used in dashboard context

### AddressForm (General Profile Section Component)
- Standalone address form component
- Mapbox integration
- More feature-rich UI
- Hybrid mode with smart autocomplete
- Used in reusable component context

---

## Known Limitations and Edge Cases

1. **Email Update Not Supported**
   - Email is read-only from auth system
   - Users must change through account settings
   - No server-side update endpoint

2. **Phone Update Not Supported in User Mode**
   - Phone displayed but read-only
   - Could be updateable via separate auth endpoint
   - Currently not exposed in profile endpoints

3. **Avatar Storage**
   - Files stored with user ID prefix: `${user.id}/avatar-*.jpg`
   - Existing avatars replaced on new upload (upsert)
   - Older versions not retained

4. **Address Storage**
   - Stored as JSONB (flexible schema)
   - Individual fields optional
   - PostGIS POINT calculated on server (lat/lng required for geo field)

5. **Concurrent Updates**
   - No optimistic locking
   - Last-write-wins strategy
   - Potential race conditions if user updates from multiple tabs

6. **Offline Support**
   - No offline-first functionality
   - Network required to fetch and update
   - No local caching strategy documented

---

## File Paths Summary

### Component Files
- `packages/core/features/profile/profile-general-left.tsx` - Main form component
- `packages/core/features/profile/profile-general-right.tsx` - Info panel
- `packages/core/features/profile/profile-general-right.native.tsx` - Mobile variant
- `packages/core/features/profile/components/GeneralProfileSection.tsx` - Reusable component
- `packages/core/features/profile/config/general-schema.ts` - Form schema

### Route Files
- `apps/expo/app/dashboard/profile/general/index.tsx` - Route entry point

### tRPC Routers
- `packages/supabase/functions/trpc/routers/profile/general.router.ts` - User endpoints
- `packages/supabase/functions/trpc/routers/profile/avatar.router.ts` - Avatar upload
- `packages/supabase/functions/trpc/routers/office.router.ts` - Admin endpoints (getUserGeneral, updateUserGeneral)

### Shared Schemas
- `packages/supabase/functions/_shared/schemas/consolidated.ts` - Zod schemas

### Database Migrations
- `packages/supabase/migrations/001_schema.sql` - Table definitions
- Avatar storage in: Supabase Storage bucket "avatars"

### Test Helpers
- `tests/playwright-helpers/profile.ts` - Profile completion helpers
- `tests/playwright-helpers/auth.ts` - Authentication helpers

---

## Implementation Readiness Assessment

### Completeness: 95%

**Implemented:**
- ✅ Form structure and validation
- ✅ Avatar upload with storage integration
- ✅ Address autocomplete with PostGIS
- ✅ Real-time form validation
- ✅ Success/error notifications
- ✅ User and admin modes
- ✅ Read-only mode support
- ✅ tRPC endpoints (get, update, upload)
- ✅ Database schema (public + private)
- ✅ Mobile/native variant

**Minor Gaps:**
- Phone update endpoint (currently read-only)
- Offline support not implemented
- No optimistic locking for concurrent updates

---

## Next Steps for Testing

1. **Create Integration Test Suite**
   - Test all tRPC endpoints
   - Test form validation scenarios
   - Test avatar upload flow

2. **Create E2E Test Suite**
   - Test complete user workflows
   - Test admin workflows
   - Test error scenarios

3. **Test Coverage Areas**
   - Form field validation
   - Data persistence
   - Error handling
   - Avatar upload
   - Admin context
   - Read-only mode
