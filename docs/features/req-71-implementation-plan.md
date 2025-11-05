# REQ-71 Implementation Plan
## Profile Management and Discovery UX Improvements

**Requirement ID**: REQ-71  
**Status**: PLANNED  
**Complexity**: 3/5  
**Readiness**: 5/5  
**Created**: 11/5/2025

---

## Overview

This implementation plan breaks down REQ-71 into actionable tasks across 9 distinct UX and functionality improvements. The plan follows a phased approach to minimize risk and maximize delivery velocity.

---

## Task Breakdown & Implementation Order

### Phase 1: Quick Wins (Low Risk, High Visibility)
**Estimated Time**: 4-6 hours

#### Task 1: Update Branding from "Elevate Score" to "Scaffald Score"
**Task ID**: 999f179b-4600-4804-ba1a-7ddd671d7bad  
**Complexity**: 1/5  
**Status**: PLANNED

**Files to Modify**:
1. `packages/core/features/discover/components/WorkerPreviewModal.tsx` (Line 139)
2. `packages/core/features/user-profile/user-profile-header.tsx` (Search for "Elevate")
3. `packages/core/features/discover/discover-workers-right.tsx` (Search for "Elevate" or "Score")

**Implementation Steps**:
1. Search codebase for all instances of "Elevate Score" using grep:
   ```bash
   grep -r "Elevate Score" packages/
   ```
2. Replace "Elevate Score" with "Scaffald Score" in all locations
3. Update filter labels from generic "Score" to "Scaffald Score" where applicable
4. Verify no remaining "Elevate" references in user-facing text

**Acceptance Criteria**:
- [ ] All "Elevate Score" text replaced with "Scaffald Score"
- [ ] Worker preview modal displays "Scaffald Score" label (Line 139)
- [ ] User profile header displays "Scaffald Score" label
- [ ] Discovery filters show "Scaffald Score"
- [ ] No remaining "Elevate" references in user-facing text

---

#### Task 3: Fix Drawer Navigation Arrow Icons
**Task ID**: 4d4c3131-50f7-4e95-b87c-911dc52c44d9  
**Complexity**: 1/5  
**Status**: PLANNED

**Files to Modify**:
1. `packages/core/features/drawer/DrawerLink.tsx` (Lines 95-103)

**Current Issue**:
- Line 99: Uses `ChevronLeft` for collapsed state (should be `ChevronRight`)
- Line 97: Uses `ChevronDown` for expanded state (correct)

**Implementation Steps**:
1. Update import statement to include `ChevronRight`:
   ```typescript
   import { ChevronRight, ChevronDown } from '@tamagui/lucide-icons'
   ```
2. Replace `ChevronLeft` with `ChevronRight` on line 99
3. Verify icon changes immediately on expand/collapse

**Code Change**:
```typescript:packages/core/features/drawer/DrawerLink.tsx
// Before (line 99):
<ChevronLeft size={16} color={active ? '$color11' : '$color10'} />

// After:
<ChevronRight size={16} color={active ? '$color11' : '$color10'} />
```

**Acceptance Criteria**:
- [ ] Collapsed expandable items show ChevronRight icon (>)
- [ ] Expanded items show ChevronDown icon (v)
- [ ] Items without sub-items show no expand icon
- [ ] Icon changes immediately on expand/collapse
- [ ] Pattern is consistent across all drawer sections

---

### Phase 2: Visual Enhancements (Medium Risk)
**Estimated Time**: 6-8 hours

#### Task 2: Enhance FilterBar Styling
**Task ID**: ec11ff7e-4686-40da-9aa3-9148e697907e  
**Complexity**: 2/5  
**Status**: PLANNED

**Files to Modify**:
1. `packages/core/features/discover/components/FilterBar.tsx` (Lines 40-54)

**Current State**:
- Has basic background and border (lines 41-54)
- Missing backdrop blur effect
- Shadow opacity may be insufficient (currently 0.15)

**Implementation Steps**:
1. Add backdrop blur effect to the inner XStack:
   ```typescript
   backdropFilter="blur(10px)"
   ```
2. Enhance background opacity for better visibility:
   ```typescript
   bg="$background" // Keep but increase opacity
   opacity={0.95} // Add semi-transparent background
   ```
3. Increase shadow properties for better depth:
   ```typescript
   shadowOpacity={0.25}
   shadowRadius={16}
   ```
4. Ensure border is more defined:
   ```typescript
   borderWidth={2} // Increase from 1
   borderColor="$borderColor"
   ```

**Code Change**:
```typescript:packages/core/features/discover/components/FilterBar.tsx
<XStack
  bg="$background"
  opacity={0.95}
  backdropFilter="blur(10px)"
  px="$3"
  py="$2"
  rounded="$12"
  gap="$2"
  items="center"
  justify="center"
  borderWidth={2}
  borderColor="$borderColor"
  shadowColor="$shadowColor"
  shadowOffset={{ width: 0, height: 4 }}
  shadowOpacity={0.25}
  shadowRadius={16}
>
```

**Note**: `backdropFilter` may need platform-specific handling. Test on web, iOS, and Android.

**Acceptance Criteria**:
- [ ] Filter bar has semi-transparent background with backdrop blur
- [ ] Border and shadow clearly define component boundaries
- [ ] All button states have sufficient contrast
- [ ] Filter bar remains readable over various map backgrounds
- [ ] Design follows modern floating panel patterns
- [ ] Passes WCAG AA contrast requirements

---

#### Task 8: Enhance Worker Preview Modal
**Task ID**: d6e3f09f-2677-45d3-97a4-7a9890c87907  
**Complexity**: 3/5  
**Status**: PLANNED  
**Blocked by**: Task 1 (branding update)

**Files to Modify**:
1. `packages/core/features/discover/components/WorkerPreviewModal.tsx`

**Current Issues**:
- Shows only top 5 skills (line 63)
- Shows only top 3 certifications (line 64)
- Excessive whitespace between sections
- Missing work experience summary
- Missing education summary

**Implementation Steps**:
1. **Increase Skills Display** (Line 63):
   ```typescript
   const topSkills = skills.slice(0, 10) // Increase from 5 to 10
   ```
2. **Increase Certifications Display** (Line 64):
   ```typescript
   const topCertifications = certifications.slice(0, 5) // Increase from 3 to 5
   ```
3. **Add Work Experience Query**:
   ```typescript
   const { data: experience = [] } = api.userProfile.getUserExperience.useQuery(
     { userId: userId || '' },
     { enabled: !!userId && open }
   )
   ```
4. **Add Education Query**:
   ```typescript
   const { data: education = [] } = api.userProfile.getUserEducation.useQuery(
     { userId: userId || '' },
     { enabled: !!userId && open }
   )
   ```
5. **Reduce Whitespace**:
   - Change `gap="$4"` to `gap="$3"` in sections (line 148)
   - Change `gap="$3"` to `gap="$2"` in nested sections
6. **Add Work Experience Section** (after line 198):
   ```typescript
   {experience.length > 0 && (
     <>
       <Separator />
       <YStack gap="$3">
         <XStack items="center" gap="$2">
           <Briefcase size={18} color="$color12" />
           <Text fontSize="$5" fontWeight="600" color="$color12">
             Recent Experience
           </Text>
         </XStack>
         <YStack gap="$2">
           {experience.slice(0, 3).map((exp: any) => (
             <YStack key={exp.id} gap="$1">
               <Text fontSize="$4" fontWeight="600" color="$color12">
                 {exp.job_title} at {exp.company_name}
               </Text>
               <Text fontSize="$3" color="$color10">
                 {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
               </Text>
             </YStack>
           ))}
         </YStack>
         {experience.length > 3 && (
           <Button
             size="$3"
             variant="outlined"
             onPress={handleViewFullProfile}
           >
             View Full Experience
           </Button>
         )}
       </YStack>
     </>
   )}
   ```
7. **Add Education Section** (after work experience):
   ```typescript
   {education.length > 0 && (
     <>
       <Separator />
       <YStack gap="$3">
         <XStack items="center" gap="$2">
           <GraduationCap size={18} color="$color12" />
           <Text fontSize="$5" fontWeight="600" color="$color12">
             Education
           </Text>
         </XStack>
         <YStack gap="$2">
           {education.slice(0, 1).map((edu: any) => (
             <YStack key={edu.id} gap="$1">
               <Text fontSize="$4" fontWeight="600" color="$color12">
                 {edu.degree_type} {edu.degree_name}
               </Text>
               <Text fontSize="$3" color="$color10">
                 {edu.university_name}
                 {edu.graduation_year && ` • ${edu.graduation_year}`}
               </Text>
             </YStack>
           ))}
         </YStack>
       </YStack>
     </>
   )}
   ```
8. **Add "View All" Links** for skills and certifications if counts exceed display limits

**Acceptance Criteria**:
- [ ] Modal displays 8-10 top skills (increased from 5)
- [ ] Modal displays top 5 certifications (increased from 3)
- [ ] Work experience summary shows 2-3 recent positions
- [ ] Education summary shows highest/most recent degree
- [ ] "View All" links navigate to full profile
- [ ] Whitespace reduced through tighter spacing
- [ ] Modal remains scrollable if content exceeds viewport
- [ ] All sections handle empty states gracefully

---

### Phase 3: Navigation & Filtering Fixes (Core Functionality)
**Estimated Time**: 8-10 hours

#### Task 4: Create Employer Detail Page with Navigation
**Task ID**: fa3bd4e7-ef7c-463e-970f-44908cb4fff3  
**Complexity**: 3/5  
**Status**: PLANNED

**Files to Create**:
1. `apps/expo/app/dashboard/discover/employers/[id]/index.tsx`

**Files to Modify**:
1. `packages/core/constants/routes.ts` - Add employer detail route
2. `packages/core/features/discover/components/EmployerCard.tsx` - Update navigation

**Implementation Steps**:

**Step 1: Add Route Constant**
Update `packages/core/constants/routes.ts`:
```typescript
// Add to ROUTES_CONFIG (around line 131-135)
DASHBOARD_DISCOVER_EMPLOYER_DETAIL: {
  path: "/dashboard/discover/employers/:id",
  title: "Employer Details",
  isProtected: true,
},

// Add to RouteBuilder (around line 289-291)
dashboardEmployer: (id: string | number) =>
  buildRoute(ROUTES.DASHBOARD_DISCOVER_EMPLOYER_DETAIL, { id }),
```

**Step 2: Create Employer Detail Page**
Create `apps/expo/app/dashboard/discover/employers/[id]/index.tsx`:
```typescript
import { YStack, XStack, Text, Button, Spinner, Separator } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Building2, MapPin, Users, ExternalLink, DollarSign } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { RouteBuilder } from '@app/core/constants/routes'
import { DashboardWidget } from '@app/ui'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  
  const { data: employer, isLoading } = api.discover.getEmployerById.useQuery(
    { employerId: id },
    { enabled: !!id }
  )
  
  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8">
          <Spinner size="large" />
        </YStack>
      </DashboardWidget>
    )
  }
  
  if (!employer) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Employer not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </DashboardWidget>
    )
  }
  
  return (
    <DashboardWidget>
      <YStack gap="$4">
        {/* Header with Back Button */}
        <XStack items="center" gap="$3">
          <Button
            size="$3"
            variant="outlined"
            icon={<ArrowLeft size={18} />}
            onPress={() => router.back()}
          >
            Back
          </Button>
          <XStack items="center" gap="$2" flex={1}>
            <Building2 size={24} color="$blue10" />
            <Text fontSize="$8" fontWeight="700">
              {employer.name}
            </Text>
          </XStack>
        </XStack>
        
        <Separator />
        
        {/* Industry */}
        {employer.industries && (
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600">
              Industry
            </Text>
            <Text fontSize="$4" color="$color11">
              {employer.industries.name}
            </Text>
          </YStack>
        )}
        
        {/* Description */}
        {employer.description && (
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="600">
              About
            </Text>
            <Text fontSize="$4" color="$color11">
              {typeof employer.description === 'string'
                ? employer.description
                : extractPlainText(employer.description)}
            </Text>
          </YStack>
        )}
        
        {/* Location */}
        {employer.address && (
          <YStack gap="$2">
            <XStack items="center" gap="$2">
              <MapPin size={18} color="$color10" />
              <Text fontSize="$5" fontWeight="600">
                Location
              </Text>
            </XStack>
            <Text fontSize="$4" color="$color11">
              {employer.address.street || employer.address.zipCode || 'Not specified'}
            </Text>
          </YStack>
        )}
        
        {/* Company Details */}
        <XStack gap="$4" flexWrap="wrap">
          {employer.employee_count_range && (
            <YStack gap="$2">
              <XStack items="center" gap="$2">
                <Users size={18} color="$color10" />
                <Text fontSize="$4" fontWeight="600">
                  Employees
                </Text>
              </XStack>
              <Text fontSize="$4" color="$color11">
                {employer.employee_count_range}
              </Text>
            </YStack>
          )}
          
          {employer.annual_revenue_range && (
            <YStack gap="$2">
              <XStack items="center" gap="$2">
                <DollarSign size={18} color="$color10" />
                <Text fontSize="$4" fontWeight="600">
                  Revenue
                </Text>
              </XStack>
              <Text fontSize="$4" color="$color11">
                {employer.annual_revenue_range}
              </Text>
            </YStack>
          )}
        </XStack>
        
        {/* Website */}
        {employer.website_url && (
          <YStack gap="$2">
            <Button
              size="$4"
              variant="outlined"
              icon={<ExternalLink size={18} />}
              onPress={() => {
                const url = employer.website_url.startsWith('http')
                  ? employer.website_url
                  : `https://${employer.website_url}`
                window.open(url, '_blank')
              }}
            >
              Visit Website
            </Button>
          </YStack>
        )}
        
        {/* Active Job Postings */}
        {/* TODO: Add job postings query when endpoint is available */}
      </YStack>
    </DashboardWidget>
  )
}
```

**Step 3: Update EmployerCard Navigation**
Update `packages/core/features/discover/components/EmployerCard.tsx`:
```typescript
import { useRouter } from 'expo-router'
import { RouteBuilder } from '@app/core/constants/routes'

// Inside component:
const router = useRouter()

// Update onPress handler (line 46):
onPress={() => {
  router.push(RouteBuilder.dashboardEmployer(employer.id))
}}
```

**Step 4: Create/Update tRPC Endpoint**
If `api.discover.getEmployerById` doesn't exist, create it:
```typescript
// In packages/supabase/routers/discover.ts or similar
getEmployerById: publicProcedure
  .input(z.object({ employerId: z.string() }))
  .query(async ({ input, ctx }) => {
    // Fetch employer by ID with related data
  })
```

**Acceptance Criteria**:
- [ ] Route constant added to `routes.ts`
- [ ] RouteBuilder method created
- [ ] Employer detail page created at correct path
- [ ] Clicking employer card navigates to detail page
- [ ] Detail page displays complete employer information
- [ ] Back navigation returns to employer discovery list
- [ ] Route parameter correctly passes employer ID
- [ ] Page handles loading and error states gracefully
- [ ] Browser back button works correctly

---

#### Task 5: Verify and Fix Employer Industry Filtering
**Task ID**: 7fe52370-a20c-434a-9c3b-5579aa06a416  
**Complexity**: 2/5  
**Status**: PLANNED

**Files to Investigate**:
1. `packages/core/features/discover/discover-employers-screen.tsx`
2. `packages/core/features/discover/discover-employers-left.tsx`
3. `packages/core/features/discover/discover-employers-right.tsx`
4. tRPC router files (likely `packages/supabase/routers/discover.ts`)

**Implementation Steps**:

**Step 1: Investigate Current Implementation**
1. Find where `selectedIndustries` state is defined
2. Trace how it's passed to child components
3. Check if tRPC query includes industry filter
4. Verify backend endpoint filters by industry

**Step 2: Fix Filter Application**
1. Ensure `DiscoverEmployersLeft` receives `selectedIndustries` prop
2. Ensure tRPC query includes industry filter:
   ```typescript
   api.discover.getEmployers.useQuery({
     industryIds: selectedIndustries.length > 0 ? selectedIndustries : undefined,
     // ... other filters
   })
   ```
3. Verify backend query filters correctly:
   ```sql
   -- Example SQL pattern
   WHERE (industry_ids IS NULL OR industry_id = ANY(industry_ids))
   ```

**Step 3: Test Filter Logic**
- Single industry selection
- Multiple industry selections (OR logic)
- Clearing filters
- Empty state when no matches

**Acceptance Criteria**:
- [ ] Selecting industries filters employer list correctly
- [ ] Multiple industry selections work with OR logic
- [ ] Clearing filters restores full employer list
- [ ] Filter changes trigger immediate UI update
- [ ] Loading state displays during filter application
- [ ] No employers shown when no matches exist (with appropriate empty state message)

---

#### Task 6: Fix Education Entry Removal
**Task ID**: 7dadaa1f-2e72-4a9c-a43b-98d085a00402  
**Complexity**: 2/5  
**Status**: PLANNED

**Files to Modify**:
1. `packages/core/features/profile/profile-education-left.tsx`

**Current State**:
- Uses `remove(index)` from `useFieldArray` (line 97)
- May not persist to backend correctly

**Implementation Steps**:

**Step 1: Verify Remove Functionality**
1. Check if `remove(index)` correctly updates form state
2. Verify removed entries are excluded from form submission
3. Test removal of first, middle, and last entries

**Step 2: Fix Backend Persistence**
1. Ensure `saveEducation` mutation handles array updates correctly
2. Backend should handle deletions (not just additions)
3. Consider using upsert pattern or explicit delete operations

**Step 3: Update Form Submission**
Ensure the mutation payload excludes removed entries:
```typescript
const onSubmit = async (data: EducationProfileFormData) => {
  // Only send entries that still exist (have IDs or are new)
  const entriesToSave = data.education_entries.filter(entry => 
    entry.id || entry.university_id // Only include valid entries
  )
  
  await saveEducationMutation.mutateAsync({
    education_entries: entriesToSave,
  })
}
```

**Step 4: Add Visual Feedback**
- Show loading state during save
- Show success toast after save
- Show error message if save fails

**Acceptance Criteria**:
- [ ] Remove button successfully removes education entry from form
- [ ] Removed entry is excluded from save mutation payload
- [ ] Backend persists removal correctly
- [ ] Form dirty state updates appropriately
- [ ] Removal works for any position in the array (first, middle, last)
- [ ] No errors in console during removal
- [ ] Success toast confirms save after removal

---

### Phase 4: Advanced UX Features (Higher Complexity)
**Estimated Time**: 12-16 hours

#### Task 7: Add Cancel Button with Confirmation to All Profile Forms
**Task ID**: 9bd9eb27-a98f-473a-ae3e-3f7384e59d7f  
**Complexity**: 3/5  
**Status**: PLANNED

**Files to Modify**:
1. `packages/core/features/profile/profile-general-left.tsx`
2. `packages/core/features/profile/profile-education-left.tsx`
3. `packages/core/features/profile/profile-experience-left.tsx`
4. `packages/core/features/profile/profile-employment-left.tsx`
5. `packages/core/features/profile/profile-skills-left.tsx`
6. `packages/core/features/profile/profile-certifications-left.tsx`

**Implementation Steps**:

**Step 1: Create Reusable Confirmation Dialog Component**
Create a reusable component in `@app/ui` following the pattern from `DeleteButton.tsx`:
```typescript
// packages/ui/src/components/dialog/ConfirmationDialog.tsx
import { Dialog, Button, XStack, YStack, Text } from 'tamagui'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmTheme?: 'red' | 'blue' | 'green'
  isLoading?: boolean
}

/**
 * Reusable confirmation dialog component
 * 
 * Based on the pattern from DeleteButton.tsx but generalized for any confirmation use case
 * 
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Discard Changes?"
 *   message="You have unsaved changes. Are you sure you want to discard them?"
 *   confirmLabel="Discard Changes"
 *   cancelLabel="Keep Editing"
 *   confirmTheme="red"
 *   onConfirm={() => {
 *     reset(originalData)
 *   }}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTheme = 'blue',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    // Don't close here - let parent handle closing after async operations
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width={500}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            {message}
          </Dialog.Description>
          <XStack gap="$3" items="center" justify="flex-end">
            <Dialog.Close asChild>
              <Button variant="outlined" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              theme={confirmTheme}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {confirmLabel}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
```

**Step 1b: Export from UI Package**
Add to `packages/ui/src/index.ts`:
```typescript
export { ConfirmationDialog } from './components/dialog/ConfirmationDialog'
```

**Step 2: Update Each Profile Form**
For each form component:

1. Import confirmation dialog from `@app/ui`:
   ```typescript
   import { ConfirmationDialog } from '@app/ui'
   ```
2. Add state for dialog:
   ```typescript
   const [showCancelDialog, setShowCancelDialog] = useState(false)
   ```
3. Store original form data on load:
   ```typescript
   const [originalData, setOriginalData] = useState<FormData | null>(null)
   
   useEffect(() => {
     if (query.data) {
       const data = transformToFormData(query.data)
       reset(data)
       setOriginalData(data)
     }
   }, [query.data, reset])
   ```
4. Add Cancel button next to Save Changes:
   ```typescript
   <XStack gap="$3" justify="flex-end">
     <Button
       variant="outlined"
       disabled={!isDirty}
       onPress={() => setShowCancelDialog(true)}
     >
       Cancel
     </Button>
     <Button
       theme="blue"
       disabled={!isDirty || isLoading}
       onPress={handleSubmit(onSubmit)}
     >
       Save Changes
     </Button>
   </XStack>
   ```
5. Add confirmation dialog:
   ```typescript
   <ConfirmationDialog
     open={showCancelDialog}
     onOpenChange={setShowCancelDialog}
     title="Discard Changes?"
     message="You have unsaved changes. Are you sure you want to discard them?"
     confirmLabel="Discard Changes"
     cancelLabel="Keep Editing"
     confirmTheme="red"
     onConfirm={() => {
       if (originalData) {
         reset(originalData)
         setShowCancelDialog(false)
       }
     }}
   />
   ```

**Step 3: Test Cancel Functionality**
- Test with dirty form
- Test with clean form (Cancel should be disabled)
- Test "Keep Editing" option
- Test "Discard Changes" option
- Verify form resets correctly

**Acceptance Criteria**:
- [ ] Cancel button appears next to Save Changes button on all profile forms
- [ ] Cancel button only enabled when form has unsaved changes
- [ ] Clicking Cancel shows confirmation dialog
- [ ] "Discard Changes" resets form to last saved values
- [ ] "Keep Editing" closes dialog without changes
- [ ] Form dirty state resets after discarding changes
- [ ] Cancel button becomes disabled after discarding changes
- [ ] Dialog uses appropriate destructive styling for "Discard" action

---

#### Task 9: Create Month/Year Date Picker Component
**Task ID**: 6a8d11d5-ad68-4140-b0f1-d2e0c9624b75  
**Complexity**: 3/5  
**Status**: PLANNED

**Files to Create**:
1. `packages/ui/src/components/date-picker/MonthYearPicker.tsx`

**Implementation Steps**:

**Step 1: Research @rehookify/datepicker Usage**
- Project already has `@rehookify/datepicker` installed (see `packages/core/package.json`)
- `DatePickerProvider` is already in use (see `packages/core/provider/index.tsx`)
- Review examples at https://www.rehookify.com/datepicker/examples
- Check if month/year only mode is supported
- Ensure cross-platform compatibility (web, iOS, Android)

**Step 2: Create MonthYearPicker Component Using @rehookify/datepicker**
- Use `@rehookify/datepicker` library for the date picker UI
- Wrap it to extract only month/year from selected dates
- Store dates with day=1 (first day of selected month)
- If library doesn't support month/year only mode natively, extract month/year from full date selection

**Implementation Approach**:
```typescript
// packages/ui/src/components/date-picker/MonthYearPicker.tsx
import { YStack, Text, Button } from 'tamagui'
import { useDatePickerContext } from '@rehookify/datepicker'
// Implementation will use @rehookify/datepicker API
// May need to configure for month/year view or extract from full date
```

**Note**: Implementation details will depend on `@rehookify/datepicker`'s API. If it doesn't support month/year only mode natively:
- Use full date picker but extract only month/year from selected date
- Set day to 1 when storing the value
- Display selected month/year clearly to user

**Step 3: Export from UI Package**
Add to `packages/ui/src/index.ts`:
```typescript
export { MonthYearPicker } from './components/date-picker/MonthYearPicker'
```

**Acceptance Criteria**:
- [ ] MonthYearPicker component created using @rehookify/datepicker
- [ ] Component accepts value and onChange props
- [ ] Component displays month and year selection (via @rehookify/datepicker)
- [ ] Component is cross-platform compatible (web, iOS, Android)
- [ ] Component handles null/undefined values
- [ ] Component displays error messages
- [ ] Component is exported from UI package
- [ ] Only month/year is stored (day set to 1)

---

#### Task 10: Enhance Work Experience Form
**Task ID**: 68a9d4d9-dc10-4c9a-9a22-9450568890c9  
**Complexity**: 4/5  
**Status**: PLANNED  
**Blocked by**: Task 9 (date picker component)

**Files to Modify**:
1. `packages/core/features/profile/profile-experience-left.tsx`

**Implementation Steps**:

**Step 1: Add Date Pickers Using @rehookify/datepicker**
Replace text inputs with MonthYearPicker:
```typescript
import { MonthYearPicker } from '@app/ui'

// For start_date field:
<Controller
  name={`experience_entries.${index}.start_date`}
  control={control}
  render={({ field }) => (
    <MonthYearPicker
      value={field.value ? new Date(field.value) : null}
      onChange={(date) => {
        // Store as YYYY-MM-DD format (first day of month)
        const dateStr = date ? date.toISOString().split('T')[0] : null
        field.onChange(dateStr)
      }}
      placeholder="Select start date"
      error={errors.experience_entries?.[index]?.start_date?.message}
    />
  )}
/>

// For end_date field (disabled when is_current is true):
<Controller
  name={`experience_entries.${index}.end_date`}
  control={control}
  render={({ field }) => (
    <MonthYearPicker
      value={field.value ? new Date(field.value) : null}
      onChange={(date) => {
        // Store as YYYY-MM-DD format (first day of month)
        const dateStr = date ? date.toISOString().split('T')[0] : null
        field.onChange(dateStr)
      }}
      placeholder="Select end date"
      disabled={watch(`experience_entries.${index}.is_current`)}
      error={errors.experience_entries?.[index]?.end_date?.message}
    />
  )}
/>
```

**Note**: The MonthYearPicker component will use `@rehookify/datepicker` under the hood. Implementation will need to extract only month/year from the selected date and store it with day=1.

**Step 2: Add Address Autocomplete**
Replace free-form location field with ControlledAddressForm:
```typescript
import { ControlledAddressForm } from '@app/core/forms'

// Replace location Input with:
<ControlledAddressForm
  control={control}
  name={`experience_entries.${index}.location`}
  setValue={setValue}
  trigger={trigger}
  label="Location"
  placeholder="Search for work location..."
  mode="autocomplete-only"
  fieldMapping="flat"
/>
```

**Note**: May need to adjust field mapping based on how location is stored in the form.

**Step 3: Fix Dropdown Direction**
Ensure all Select components expand downward:
```typescript
<Select
  // ... other props
  placement="bottom"
>
```

**Step 4: Add Total Years of Experience Calculation**
Add calculation function:
```typescript
const calculateTotalExperience = useMemo(() => {
  const entries = watch('experience_entries') || []
  let totalMonths = 0
  
  entries.forEach((entry) => {
    if (!entry.start_date) return
    
    const start = new Date(entry.start_date)
    const end = entry.is_current || !entry.end_date
      ? new Date()
      : new Date(entry.end_date)
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth())
    totalMonths += Math.max(0, months)
  })
  
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  
  return { years, months }
}, [watch('experience_entries')])
```

Display calculated total (replace lines 148-150):
```typescript
<YStack gap="$2" flex={1}>
  <Text fontWeight="600">Total Years Experience</Text>
  <Text fontSize="$6" fontWeight="700" color="$blue10">
    {calculateTotalExperience.years} years {calculateTotalExperience.months} months
  </Text>
</YStack>
```

**Step 5: Add Date Validation**
Ensure end date is after start date:
```typescript
// In validation schema (profile/config.ts)
start_date: z.string().optional(),
end_date: z.string().optional().refine(
  (val, ctx) => {
    if (!val) return true // Optional field
    const startDate = new Date(ctx.parent.start_date)
    const endDate = new Date(val)
    return endDate >= startDate
  },
  { message: 'End date must be after start date' }
),
```

**Acceptance Criteria**:
- [ ] Start Date and End Date fields show month/year picker
- [ ] Date picker allows month/year selection
- [ ] End Date is disabled when "Currently Working" is checked
- [ ] Date validation prevents end date before start date
- [ ] Location field uses address autocomplete
- [ ] Address autocomplete suggests locations via Mapbox
- [ ] All dropdowns expand downward
- [ ] Total years of experience displays at top of section
- [ ] Total experience updates automatically when entries change
- [ ] Total experience calculation handles current positions correctly
- [ ] Total experience displays in "X years Y months" format
- [ ] Form validation works with new date picker component

---

## Implementation Timeline

### Week 1: Quick Wins (Phase 1)
- Day 1-2: Tasks 1 & 3 (Branding + Drawer arrows)
- Day 3-4: Task 2 (FilterBar styling)
- Day 5: Task 8 (Worker preview modal) - blocked by Task 1

### Week 2: Core Functionality (Phase 2 & 3)
- Day 1-2: Task 4 (Employer detail page)
- Day 3: Task 5 (Industry filtering)
- Day 4: Task 6 (Education removal)
- Day 5: Testing & bug fixes

### Week 3: Advanced Features (Phase 4)
- Day 1-2: Task 9 (Date picker component)
- Day 3-4: Task 10 (Experience form enhancements)
- Day 5: Task 7 (Cancel buttons) - can be done in parallel

---

## Testing Strategy

### Unit Tests
- Form validation logic
- Date calculation functions
- Filter state management
- Navigation handlers

### Integration Tests
- Complete user flows for each requirement
- Form submission with all field types
- Filter application and clearing
- Navigation between screens

### Manual Testing Checklist
- [ ] Verify branding updates on all screens
- [ ] Test filter bar visibility on various map backgrounds
- [ ] Navigate to employer details and back
- [ ] Apply multiple industry filters
- [ ] Remove education entries and save
- [ ] Cancel profile edits with confirmation
- [ ] Expand/collapse drawer sections
- [ ] View enhanced worker preview modal
- [ ] Use date picker for work experience
- [ ] Test address autocomplete
- [ ] Verify total experience calculation
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify keyboard navigation
- [ ] Check screen reader compatibility

---

## Dependencies & Prerequisites

### External Dependencies
- Date picker component library (if not already available)
- Mapbox API for address autocomplete (already configured)
- Confirmation dialog component (may need to create)

### Internal Dependencies
- Task 1 must complete before Task 8 (branding dependency)
- Task 9 must complete before Task 10 (date picker dependency)

### API Endpoints Required
- `api.discover.getEmployerById` - May need to be created
- `api.userProfile.getUserExperience` - For worker preview modal
- `api.userProfile.getUserEducation` - For worker preview modal

---

## Risk Mitigation

### High Risk Areas
1. **Date Picker Cross-Platform Compatibility**
   - Risk: Different behavior on web vs mobile
   - Mitigation: Test on all platforms early, use proven library
   
2. **Address Autocomplete Integration**
   - Risk: Complex form field mapping
   - Mitigation: Use existing `ControlledAddressForm` abstraction
   
3. **Backend Filtering Logic**
   - Risk: Industry filter may require backend changes
   - Mitigation: Investigate backend first, coordinate with backend team

### Medium Risk Areas
1. **Form State Management**
   - Risk: Cancel functionality may have edge cases
   - Mitigation: Test thoroughly with various form states
   
2. **Navigation Flow**
   - Risk: Employer detail page routing may conflict
   - Mitigation: Follow existing routing patterns

---

## Success Metrics

- Zero instances of "Elevate" branding in user-facing text
- Filter bar visibility rated 4+ out of 5 by users
- Employer navigation success rate > 95%
- Education removal success rate > 95%
- Profile edit cancellation usage > 10% of edit sessions
- Date picker adoption rate > 90% (vs manual text entry)
- Worker preview engagement time increased by 30%
- Form completion time reduced by 20%

---

## Notes & Considerations

### Cross-Platform Compatibility
- All UI changes must work on web, iOS, and Android
- Date picker component must be cross-platform compatible
- Address autocomplete must work on all platforms
- Test modal layouts on various screen sizes

### Performance
- Filter changes should debounce API calls (300ms)
- Worker preview modal should lazy-load additional data
- Form validation should not block UI interactions
- Date calculations should be memoized

### Accessibility
- All interactive elements must be keyboard accessible
- Confirmation dialogs must trap focus
- Date pickers must support keyboard navigation
- Filter controls must have proper ARIA labels
- Maintain WCAG AA contrast ratios

### Data Persistence
- All form changes must persist correctly to backend
- Optimistic UI updates should revert on error
- Loading states should prevent duplicate submissions
- Error handling should preserve user input

---

## Resolved Decisions

1. **Date Picker Library**: ✅ Using `@rehookify/datepicker` (already installed). Create MonthYearPicker component wrapping the library for month/year only selection. Reference: https://www.rehookify.com/datepicker/examples
2. **Backend Filtering**: ✅ Backend accepts `industryIds` in input schema but doesn't apply filter. Need to add filtering logic in `getEmployers` query (Task 5).
3. **Confirmation Dialog**: ✅ Creating reusable `ConfirmationDialog` component in `@app/ui` following the pattern from `DeleteButton.tsx`.
4. **Experience Endpoint**: ✅ `api.userProfile.getUserExperience` exists (line 106 in `user-profile.router.ts`).
5. **Education Endpoint**: ✅ `api.userProfile.getUserEducation` exists (line 129 in `user-profile.router.ts`).
6. **Employer Endpoint**: ✅ `api.discover.getEmployerById` exists (line 68 in `employers.router.ts`).

---

## Next Steps

1. Review this implementation plan with the team
2. Answer open questions
3. Set up task tracking (update BrainGrid tasks)
4. Begin Phase 1 implementation
5. Schedule regular check-ins for progress review

---

**Last Updated**: 2025-01-27  
**Plan Version**: 1.0

