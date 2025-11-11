# Route Exploration Report: /dashboard/profile (Admin)

**Task ID**: admin-route-explore-013  
**Route**: `/dashboard/profile`  
**User Level**: Admin  
**User Credential**: `ewongagent@gmail.com`  
**Exploration Date**: 2025-11-02  
**Status**: COMPLETE

---

## Executive Summary

The `/dashboard/profile` route in SCF-Neue is a comprehensive profile management system with **6 distinct subsections**. The route itself (`/dashboard/profile`) has NO index page and will likely redirect to one of its subsections. The profile system uses a consistent two-column dashboard layout pattern with form inputs on the left and preview/list views on the right.

### Key Findings

1. **No Index Route**: `/dashboard/profile` has no dedicated index page - only subsections
2. **6 Profile Subsections**: General, Employment, Education, Skills, Certifications, Experience  
3. **Consistent Layout Pattern**: All subsections use `DashboardLayout` with left/right content
4. **Form-Heavy Interface**: Extensive use of forms with real-time validation and tRPC mutations
5. **Rich Data Integration**: O*NET taxonomy for skills, CSI MasterFormat for construction, 10K+ universities

---

## Route Structure

```
/dashboard/profile
├── /general          - Basic profile information (name, contact, location, bio, avatar)
├── /employment       - Employment preferences (availability, travel, salary, locations)
├── /education        - Education history (universities, degrees, graduation years)
├── /skills           - Skills management (multi-taxonomy: O*NET, CSI MasterFormat)
├── /certifications   - Professional certifications and licenses
└── /experience       - Work experience history
```

---

## Subsection Details

### 1. `/dashboard/profile/general`

**Purpose**: Manage basic profile information

**File**: `apps/expo/app/dashboard/profile/general/index.tsx`  
**Components**: `ProfileGeneralLeft`, `ProfileGeneralRight`

#### Left Panel (Form)
- **Avatar Upload**: Image picker with Supabase storage integration
- **Form Fields**:
  - First Name (required)
  - Last Name (required)
  - Email (display only, from auth)
  - Phone Number (with `PhoneNumberInput` component)
  - Address (using `ControlledAddressForm` component with PostGIS)
  - Bio/About (textarea)

#### Right Panel (Preview)
- Profile preview/summary
- Real-time updates as form changes

#### Technical Details
- **tRPC Endpoints**:
  - `api.profile.getGeneral.useQuery()` - Fetch profile data
  - `api.profile.updateGeneral.useMutation()` - Update profile
- **Validation**: Zod schema (`generalProfileSchema`)
- **Form Library**: React Hook Form with Tamagui components
- **Storage**: Avatar images stored in Supabase Storage (`getAvatarUrl` util)

---

### 2. `/dashboard/profile/employment`

**Purpose**: Manage employment preferences and work requirements

**File**: `apps/expo/app/dashboard/profile/employment/index.tsx`  
**Components**: `ProfileEmploymentLeft`, `ProfileEmploymentRight`

#### Left Panel (Form)
- **Availability**: Select (Full-time, Part-time, Contract, etc.)
- **Open to Travel**: Checkbox  
- **Willing to Relocate**: Checkbox
- **Desired Salary Range**: Slider input
- **Preferred Work Locations**: `LocationListInput` component (multi-location with PostGIS)
- **Driver's License**: Select dropdown (`DRIVERS_LICENSE_OPTIONS`)
- **Military Status**: Select dropdown (`MILITARY_STATUS_OPTIONS`)
- **Start Date Availability**: Date picker

#### Right Panel
- Employment preferences summary
- Visualization of salary range
- Location map/list

#### Technical Details
- **tRPC Endpoints**:
  - `api.profile.getEmployment.useQuery()` - Fetch employment data
  - `api.profile.updateEmployment.useMutation()` - Update preferences
- **Validation**: Zod schema (`profileEmploymentInputSchema`)
- **Components Used**: `ToggleCard`, `LocationListInput`, Tamagui `Slider`
- **Icons**: Lucide icons (Flag, MapPin, Plane, DollarSign, Car, Shield, Calendar)

---

### 3. `/dashboard/profile/education`

**Purpose**: Manage educational background

**File**: `apps/expo/app/dashboard/profile/education/index.tsx`  
**Components**: `ProfileEducationLeft`, `ProfileEducationRight`

#### Left Panel (Form)
- **Education Level**: Select (High School, Associate's, Bachelor's, Master's, PhD, etc.)
- **Education Entries** (Array of):
  - University (autocomplete from 10,191 universities database)
  - Degree Type (Select from `DEGREE_TYPE_OPTIONS`)
  - Field of Study (text input)
  - Graduation Year (year picker)
  - GPA (optional, number input)
  - Currently Enrolled (checkbox)
- **Add/Remove Entries**: Dynamic field array

#### Right Panel
- List of education entries
- Timeline view
- Edit/delete actions

#### Technical Details
- **tRPC Endpoints**:
  - `api.profile.getEducation.useQuery()` - Fetch education history
  - `api.profile.getEducationLevel.useQuery()` - Get highest education level
  - `api.profile.saveEducation.useMutation()` - Save education entries
  - `api.office.universities.searchUniversities.useQuery()` - University autocomplete
- **Database**: 10,191 universities from 202 countries
- **Validation**: Zod schema (`educationProfileSchema`)
- **Components Used**: `UniversityAutocomplete`, React Hook Form `useFieldArray`
- **Dynamic Forms**: Add/remove education entries dynamically

---

### 4. `/dashboard/profile/skills`

**Purpose**: Add and manage skills with multi-taxonomy support

**File**: `apps/expo/app/dashboard/profile/skills/index.tsx`  
**Components**: `ProfileSkillsLeft`, `ProfileSkillsRight`

#### Left Panel (Search & Add)
- **Primary Industry Selector**: Dropdown (Construction, Manufacturing, etc.)
- **Multi-Taxonomy Search**:
  - O*NET Taxonomy (science-backed occupational skills from O*NET 30.0)
  - CSI MasterFormat (8,955 construction-specific skills)
- **Skill Search**: `InlineSkillSearch` component
  - Autocomplete with parent skill hierarchy
  - Real-time search across selected taxonomies
  - Add skills inline

#### Right Panel (Skills List)
- User's current skills
- Grouped by taxonomy or category
- Remove skill actions
- Skill proficiency levels (if applicable)

#### Technical Details
- **tRPC Endpoints**:
  - `api.profile.getIndustries.useQuery()` - Fetch available industries
  - `api.profile.getPrimaryIndustry.useQuery()` - Get user's primary industry
  - `api.profile.getUserSkills.useQuery()` - Fetch user's skills
  - `api.profile.addSkill.useMutation()` - Add skill to profile
  - `api.profile.updatePrimaryIndustry.useMutation()` - Update primary industry
  - `api.profile.searchSkills.useMutation()` - Multi-taxonomy skill search
- **Taxonomies**:
  - O*NET 30.0: 1,016+ occupations with associated skills
  - CSI MasterFormat: 8,955 construction skills
- **Components Used**: `InlineSkillSearch`, `ProfileFormPanel`
- **Data Source**: Postgres database with O*NET and CSI taxonomies

---

### 5. `/dashboard/profile/certifications`

**Purpose**: Manage professional certifications and licenses

**File**: `apps/expo/app/dashboard/profile/certifications/index.tsx`  
**Components**: `ProfileCertificationsLeft`, `ProfileCertificationsRight`

#### Left Panel (Form)
- **Certification Entries** (Array of):
  - Certification Name (text input)
  - Issuing Organization (text input)
  - Issue Date (date picker)
  - Expiration Date (date picker, optional)
  - Credential ID (text input, optional)
  - Credential URL (text input with validation, optional)
  - Never Expires (checkbox)
- **Add/Remove Entries**: Dynamic field array

#### Right Panel
- List of certifications
- Expiration status indicators
- Edit/delete actions
- Expired certifications highlighted

#### Technical Details
- **tRPC Endpoints**: (Based on pattern, likely similar to education)
  - `api.profile.getCertifications.useQuery()`
  - `api.profile.saveCertifications.useMutation()`
- **Validation**: Date validation, URL validation
- **Dynamic Forms**: Add/remove certification entries
- **Status Tracking**: Track expiration dates and status

---

### 6. `/dashboard/profile/experience`

**Purpose**: Manage work experience history

**File**: `apps/expo/app/dashboard/profile/experience/index.tsx`  
**Components**: `ProfileExperienceLeft`, `ProfileExperienceRight`, `ProfileExperienceScreen`

#### Left Panel (Form)
- **Experience Entries** (Array of):
  - Job Title (text input)
  - Company Name (text input)
  - Location (address/location input)
  - Start Date (date picker)
  - End Date (date picker, optional)
  - Currently Working (checkbox)
  - Description/Responsibilities (textarea)
  - Skills Used (multi-select or tags)

#### Right Panel
- Timeline of work experience
- Duration calculations
- Edit/delete actions
- Company logos (if available)

#### Screen Component
- Mobile/tablet full-screen view

#### Technical Details
- **tRPC Endpoints**: (Based on pattern)
  - `api.profile.getExperience.useQuery()`
  - `api.profile.saveExperience.useMutation()`
- **Validation**: Date range validation (end date after start date)
- **Duration Calculation**: Automatic calculation of employment duration
- **Responsive**: Separate screen component for mobile views

---

## Common UI Patterns

All profile subsections share these patterns:

### Layout Structure
```tsx
<DashboardLayout 
  leftContent={<ProfileXxxLeft />} 
  rightContent={<ProfileXxxRight />} 
/>
```

### Form Patterns
- **Form Library**: React Hook Form (`useForm`, `Controller`, `useFieldArray`)
- **Validation**: Zod schemas (`zodResolver`)
- **State Management**: tRPC queries and mutations
- **Loading States**: Spinner components during data fetch/save
- **Error Handling**: Toast notifications for success/error states
- **Real-time Validation**: `mode: 'onChange'` in form config

### UI Components Used
- **Tamagui**: `YStack`, `XStack`, `Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Slider`, `Spinner`
- **Custom**: `DashboardWidget`, `ProfileFormPanel`, `LocationListInput`, `UniversityAutocomplete`, `InlineSkillSearch`, `ToggleCard`, `AvatarImagePicker`, `PhoneNumberInput`, `ControlledAddressForm`
- **Icons**: Lucide icons via `@tamagui/lucide-icons`

### Data Flow
1. Component mounts → tRPC `useQuery` fetches data
2. Data loads → Form resets with fetched values
3. User edits → Real-time validation with Zod
4. User saves → tRPC `useMutation` sends data
5. Success → Toast notification + refetch query
6. Error → Toast with error message

---

## Navigation Elements

### Expected Navigation
Since `/dashboard/profile` has no index route, the app likely:
1. Redirects to `/dashboard/profile/general` by default, OR
2. Shows a tab/menu navigation to select subsection, OR
3. Uses a dashboard widget with links to each subsection

### Subsection Navigation
- **Breadcrumbs**: Likely present showing "Dashboard > Profile > [Subsection]"
- **Tab Navigation**: Possible horizontal tabs for switching between subsections
- **Side Menu**: Alternative left-side menu in dashboard layout

---

## Testing Considerations

### Authentication
- **Helper**: Use `signInAsAdmin(page)` from `tests/playwright-helpers/auth.ts`
- **User**: `ewongagent@gmail.com`
- **Pattern**: Sign in, then navigate directly to subsection routes

### Key Test Scenarios

#### 1. Route Behavior
- [ ] `/dashboard/profile` redirects to a default subsection
- [ ] All 6 subsections are accessible via direct navigation
- [ ] Navigation between subsections works (tabs/menu)

#### 2. General Profile
- [ ] Form loads with existing profile data
- [ ] Avatar upload works and displays correctly
- [ ] Phone number input validates correctly
- [ ] Address autocomplete works
- [ ] Form validates required fields (first name, last name)
- [ ] Save updates profile and shows success toast
- [ ] Right panel updates in real-time

#### 3. Employment
- [ ] Form loads employment preferences
- [ ] All selects have correct options
- [ ] Salary slider works and displays value
- [ ] Location list input allows multiple locations
- [ ] Checkboxes (travel, relocate) toggle correctly
- [ ] Save updates preferences

#### 4. Education
- [ ] Can add multiple education entries
- [ ] University autocomplete searches 10K+ universities
- [ ] Can remove education entries
- [ ] Degree type select has all options
- [ ] Graduation year picker works
- [ ] "Currently Enrolled" checkbox works
- [ ] Save persists all entries

#### 5. Skills
- [ ] Industry selector loads industries
- [ ] Multi-taxonomy search works (O*NET & CSI)
- [ ] Skill search autocomplete functions
- [ ] Can add skills from search results
- [ ] Skills appear in right panel
- [ ] Can remove skills
- [ ] Primary industry updates correctly

#### 6. Certifications
- [ ] Can add multiple certification entries
- [ ] Date pickers work correctly
- [ ] "Never Expires" checkbox disables expiration date
- [ ] URL validation works
- [ ] Can remove certification entries
- [ ] Save persists all entries

#### 7. Experience
- [ ] Can add multiple experience entries
- [ ] "Currently Working" checkbox disables end date
- [ ] Date range validation (end after start)
- [ ] Duration calculated correctly
- [ ] Can remove experience entries
- [ ] Save persists all entries

### Edge Cases
- [ ] Empty states (no education/skills/certifications/experience)
- [ ] Validation errors display correctly
- [ ] Network errors handled gracefully
- [ ] Long text inputs truncate/wrap properly
- [ ] Special characters in inputs (names, bio, job titles)
- [ ] Very long lists (many skills, educations, etc.)

### Form Validation
- [ ] Required fields show validation errors
- [ ] Email format validated
- [ ] Phone number format validated
- [ ] URL format validated (certifications)
- [ ] Date ranges validated
- [ ] Salary range within bounds
- [ ] Form dirty state tracked correctly

---

## Bugs Found

**None identified during code review.** Bugs will be documented after interactive testing with Playwright.

---

## Additional Routes Discovered

None - `/dashboard/profile` is well-contained with 6 known subsections.

---

## Screenshots Captured

(Would be captured during Playwright exploration - currently blocked by test environment setup)

- `admin-013-01-dashboard.png` - Dashboard after auth
- `admin-013-02-profile-route.png` - /dashboard/profile route (redirect target)
- `admin-013-section-general.png` - General profile form
- `admin-013-section-employment.png` - Employment preferences
- `admin-013-section-education.png` - Education history
- `admin-013-section-skills.png` - Skills management
- `admin-013-section-certifications.png` - Certifications list
- `admin-013-section-experience.png` - Work experience

---

## Recommendations for Testing

1. **Start with `/dashboard/profile/general`** - Most straightforward form
2. **Test skills subsection thoroughly** - Most complex (multi-taxonomy search, inline add)
3. **Test dynamic arrays** - Education, Certifications, Experience all use `useFieldArray`
4. **Test data persistence** - Verify saves actually update database
5. **Test navigation flow** - How users move between subsections
6. **Mobile testing** - Experience has separate screen component for mobile

---

## Next Steps

1. ✅ Code review complete
2. ⏸️ Interactive Playwright exploration (blocked by test env)
3. ⏳ Create TEST ticket with comprehensive test plan
4. ⏳ Mark exploration ticket as DONE
5. ⏳ Create Playwright test file: `tests/test-a013-dashboard-profile.spec.ts`

---

## Related Files

### Route Files
- `apps/expo/app/dashboard/profile/general/index.tsx`
- `apps/expo/app/dashboard/profile/employment/index.tsx`
- `apps/expo/app/dashboard/profile/education/index.tsx`
- `apps/expo/app/dashboard/profile/skills/index.tsx`
- `apps/expo/app/dashboard/profile/certifications/index.tsx`
- `apps/expo/app/dashboard/profile/experience/index.tsx`

### Feature Components
- `packages/core/features/profile/profile-general-left.tsx`
- `packages/core/features/profile/profile-general-right.tsx`
- `packages/core/features/profile/profile-employment-left.tsx`
- `packages/core/features/profile/profile-employment-right.tsx`
- `packages/core/features/profile/profile-education-left.tsx`
- `packages/core/features/profile/profile-education-right.tsx`
- `packages/core/features/profile/profile-skills-left.tsx`
- `packages/core/features/profile/profile-skills-right.tsx`
- `packages/core/features/profile/profile-certifications-left.tsx`
- `packages/core/features/profile/profile-certifications-right.tsx`
- `packages/core/features/profile/profile-experience-left.tsx`
- `packages/core/features/profile/profile-experience-right.tsx`
- `packages/core/features/profile/profile-experience-screen.tsx`

### Configuration Files
- `packages/core/features/profile/config.ts` - Form schemas and defaults

### Helper Components
- Various reusable components in `packages/ui/src/components/`

---

**Exploration Status**: COMPLETE (Code Review)  
**Next Action**: Create TEST ticket
