# Profile Page URL Display - Implementation Plan (REQ-67)

## Overview

**Requirement ID**: REQ-67  
**Status**: PLANNED  
**Complexity**: 3/5  
**Readiness**: 5/5  

This plan outlines the implementation of contextual page titles and breadcrumb navigation for user profile pages, replacing the technical route path "users/[id]/index" with meaningful user information.

## Problem Statement

Currently, the user profile page displays "users/[id]/index" at the top of the page - a technical route path that provides no contextual information to users. This occurs because the dynamic route `/dashboard/users/[id]` lacks a configured title in the Drawer.Screen setup, causing Expo Router to fall back to displaying the raw route path.

## Solution Overview

1. **Dynamic Page Title**: Display user's name (or "My Profile" for own profile) in the header
2. **Breadcrumb Navigation**: Show navigation path "Dashboard > Discover Workers > [User Name]" with clickable segments
3. **Consistent Application**: Apply pattern to all profile-related pages

## Implementation Tasks

### Task 1: Add Drawer.Screen configuration for user profile route

**Status**: PLANNED  
**Complexity**: 1/5  
**File**: `apps/expo/app/dashboard/_layout.tsx`

**Changes**:
- Add a `Drawer.Screen` configuration for the dynamic route pattern `users/[id]/index`
- Use a placeholder title initially (will be updated dynamically in Task 2)
- Configure the route to allow dynamic title updates

**Implementation Steps**:
1. Add `Drawer.Screen` entry for `users/[id]/index` with placeholder title
2. Ensure the route supports dynamic title updates via `navigation.setOptions()`

**Code Reference**:
```46:57:apps/expo/app/dashboard/_layout.tsx
      <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="discover/map/index" options={{ title: 'Map Search' }} />
      <Drawer.Screen name="discover/workers/index" options={{ title: 'Search Workers' }} />
      <Drawer.Screen name="discover/employers/index" options={{ title: 'Search Employers' }} />
      <Drawer.Screen name="discover/jobs/index" options={{ title: 'Search Jobs' }} />
      <Drawer.Screen name="profile/general/index" options={{ title: 'General Information' }} />
      <Drawer.Screen name="profile/education/index" options={{ title: 'Education' }} />
      <Drawer.Screen name="profile/employment/index" options={{ title: 'Employment' }} />
      <Drawer.Screen name="profile/experience/index" options={{ title: 'Experience' }} />
      <Drawer.Screen name="profile/skills/index" options={{ title: 'Skills' }} />
      <Drawer.Screen name="profile/certifications/index" options={{ title: 'Certifications' }} />
```

**Expected Result**:
- Route `users/[id]/index` has a Drawer.Screen configuration
- Placeholder title prevents raw route path display

---

### Task 2: Implement dynamic page title based on user data

**Status**: PLANNED  
**Complexity**: 3/5  
**Blocked by**: Task 1  
**File**: `apps/expo/app/dashboard/users/[id]/index.tsx`

**Changes**:
- Fetch user profile data using existing `api.profile.widgets.getGeneralInfo.useQuery`
- Calculate display name using hierarchy: `display_name` → `first_name + last_name` → `username`
- Detect if viewing own profile by comparing current user ID with profile user ID
- Use `useNavigation()` and `useEffect` to update header title dynamically
- Handle loading and error states with appropriate fallback titles

**Implementation Steps**:
1. Import `useNavigation` from `@react-navigation/native`
2. Import `useAuth` or `useUser` to get current user ID
3. Use existing `api.profile.widgets.getGeneralInfo.useQuery({ userId: id })` hook
4. Create helper function to calculate display name (reuse logic from GeneralInfoWidget)
5. Add `useEffect` to update navigation options when data loads
6. Handle loading state: show "Loading..." or "User Profile"
7. Handle error state: show "User Profile" as fallback
8. Detect own profile: if `currentUserId === id`, show "My Profile"

**Code Reference**:
```63:67:packages/core/features/profile/widgets/GeneralInfoWidget.tsx
  const displayName =
    data.display_name ||
    (data.privateData?.first_name && data.privateData?.last_name
      ? `${data.privateData.first_name} ${data.privateData.last_name}`
      : data.username)
```

**Expected Result**:
- Header displays user's name when viewing another user's profile
- Header displays "My Profile" when viewing own profile
- Loading and error states handled gracefully

---

### Task 3: Create reusable Breadcrumb component

**Status**: PLANNED  
**Complexity**: 3/5  
**File**: `packages/ui/src/components/Breadcrumb.tsx` (new file)

**Changes**:
- Create a reusable `Breadcrumb` component that accepts breadcrumb items
- Each item should have: `label` (string), `href` (optional string), `isActive` (boolean)
- Support responsive design: truncate on mobile (< 640px), show full on desktop
- Use Tamagui components for styling consistency
- Support theme (light/dark mode)
- Use chevron icons as separators (similar to styleguide example)

**Implementation Steps**:
1. Create new component file in `packages/ui/src/components/`
2. Define TypeScript interface for breadcrumb items
3. Implement responsive logic: show last 2 segments on mobile, full path on desktop
4. Use `XStack` for horizontal layout, `Text` for labels, `ChevronRight` icon for separators
5. Make segments clickable using `Link` from `expo-router` or `router.push()`
6. Style active segment differently (typically darker/bolder)
7. Add proper TypeScript types and export
8. Export from `packages/ui/src/index.ts`

**Code Reference**:
```43:53:apps/expo/app/styleguide/components/breadcrumbs.tsx
const BreadcrumbTrail = ({ items }: BreadcrumbTrailProps) => (
  <XStack alignItems="center" gap="$2" flexWrap="wrap">
    {items.map((item, index) => (
      <React.Fragment key={item}>
        <Text fontSize={12} color={index === items.length - 1 ? '$color11' : '$color10'}>
          {item}
        </Text>
        {index < items.length - 1 ? <ChevronRight size={12} color="var(--color8)" /> : null}
      </React.Fragment>
    ))}
  </XStack>
)
```

**Component Interface**:
```typescript
interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  maxItemsMobile?: number // Default: 2
  onItemPress?: (item: BreadcrumbItem, index: number) => void
}
```

**Expected Result**:
- Reusable `Breadcrumb` component exported from `@app/ui`
- Responsive behavior for mobile/desktop
- Theme-aware styling
- Clickable navigation segments

---

### Task 4: Integrate breadcrumb navigation into user profile page

**Status**: PLANNED  
**Complexity**: 2/5  
**Blocked by**: Task 2, Task 3  
**File**: `apps/expo/app/dashboard/users/[id]/index.tsx`

**Changes**:
- Import and use the new `Breadcrumb` component
- Build breadcrumb items array based on context:
  - For other user's profile: `["Dashboard", "Discover Workers", userDisplayName]`
  - For own profile: `["Dashboard", "Discover Workers", "My Profile"]`
- Position breadcrumbs above or integrated with page content
- Handle loading state: show breadcrumbs with "Loading..." for user name
- Ensure breadcrumbs are clickable and navigate correctly

**Implementation Steps**:
1. Import `Breadcrumb` from `@app/ui`
2. Import `useRouter` from `expo-router` for navigation
3. Build breadcrumb items array:
   - `{ label: "Dashboard", href: "/dashboard" }`
   - `{ label: "Discover Workers", href: "/dashboard/discover/workers" }`
   - `{ label: displayName || "Loading...", isActive: true }` (no href for current page)
4. Add breadcrumb component to page layout (above `DashboardLayout`)
5. Use same display name logic as Task 2
6. Handle own profile detection: use "My Profile" instead of name

**Code Reference**:
```18:42:apps/expo/app/dashboard/users/[id]/index.tsx
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return (
    <DashboardLayout
      leftContent={
        <YStack gap="$4">
          <GeneralInfoWidget userId={id} showEdit={false} />
          <ExperienceWidget userId={id} showEdit={false} />
          <EducationWidget userId={id} showEdit={false} />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <SkillsWidget userId={id} showEdit={false} />
          <CertificationsWidget userId={id} showEdit={false} />
          <ReviewsWidget userId={id} showEdit={true} />
        </YStack>
      }
    />
  )
}
```

**Expected Result**:
- Breadcrumbs display above profile content
- Navigation paths work correctly
- Own profile shows "My Profile" in breadcrumbs
- Loading states handled gracefully

---

### Task 5: Apply breadcrumb pattern to profile edit pages

**Status**: PLANNED  
**Complexity**: 3/5  
**Blocked by**: Task 3  
**Files**: 
- `apps/expo/app/dashboard/profile/general/index.tsx`
- `apps/expo/app/dashboard/profile/education/index.tsx`
- `apps/expo/app/dashboard/profile/employment/index.tsx`
- `apps/expo/app/dashboard/profile/experience/index.tsx`
- `apps/expo/app/dashboard/profile/skills/index.tsx`
- `apps/expo/app/dashboard/profile/certifications/index.tsx`

**Changes**:
- Add breadcrumbs to all profile edit pages
- Breadcrumb pattern: `["Dashboard", "My Profile", sectionName]`
- Update page titles to show section name (already configured in Drawer.Screen)
- Ensure consistent styling and behavior across all edit pages

**Implementation Steps**:
1. For each profile edit page:
   - Import `Breadcrumb` from `@app/ui`
   - Import `useRouter` from `expo-router`
   - Build breadcrumb items: `["Dashboard", "My Profile", sectionName]`
   - Add breadcrumb component to page layout
   - Ensure "My Profile" links to `/dashboard/users/[currentUserId]` or main profile view
2. Determine section name from route or props
3. Ensure consistent positioning and styling

**Section Names**:
- General Information → "General Information"
- Education → "Education"
- Employment → "Employment"
- Experience → "Experience"
- Skills → "Skills"
- Certifications → "Certifications"

**Expected Result**:
- All profile edit pages show breadcrumbs
- Consistent navigation pattern: Dashboard > My Profile > [Section]
- "My Profile" breadcrumb navigates to main profile view
- Section names match Drawer.Screen titles

---

## Technical Implementation Details

### Display Name Calculation

Reuse the logic from `GeneralInfoWidget`:
```typescript
const getDisplayName = (data: GeneralInfoData) => {
  return (
    data.display_name ||
    (data.privateData?.first_name && data.privateData?.last_name
      ? `${data.privateData.first_name} ${data.privateData.last_name}`
      : data.username)
  )
}
```

### Current User Detection

Use `useAuth()` or `useUser()` hooks:
```typescript
import { useAuth } from '@app/core/provider/auth/useAuth'

const { session } = useAuth()
const currentUserId = session?.user?.id
const isOwnProfile = currentUserId === profileUserId
```

### Navigation Options Update

Use Expo Router's navigation API:
```typescript
import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'

const navigation = useNavigation()

useEffect(() => {
  if (displayName) {
    navigation.setOptions({
      title: isOwnProfile ? 'My Profile' : displayName,
    })
  }
}, [displayName, isOwnProfile, navigation])
```

### Breadcrumb Component Structure

```typescript
<Breadcrumb
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Discover Workers', href: '/dashboard/discover/workers' },
    { label: displayName || 'Loading...', isActive: true },
  ]}
/>
```

---

## File Structure

### New Files
- `packages/ui/src/components/Breadcrumb.tsx` - Reusable breadcrumb component
- `docs/features/profile-page-url-display-implementation-plan.md` - This file

### Modified Files
- `apps/expo/app/dashboard/_layout.tsx` - Add Drawer.Screen for users/[id]/index
- `apps/expo/app/dashboard/users/[id]/index.tsx` - Add dynamic title and breadcrumbs
- `apps/expo/app/dashboard/profile/general/index.tsx` - Add breadcrumbs
- `apps/expo/app/dashboard/profile/education/index.tsx` - Add breadcrumbs
- `apps/expo/app/dashboard/profile/employment/index.tsx` - Add breadcrumbs
- `apps/expo/app/dashboard/profile/experience/index.tsx` - Add breadcrumbs
- `apps/expo/app/dashboard/profile/skills/index.tsx` - Add breadcrumbs
- `apps/expo/app/dashboard/profile/certifications/index.tsx` - Add breadcrumbs
- `packages/ui/src/index.ts` - Export Breadcrumb component

---

## Testing Strategy

### Unit Tests
- Test display name calculation logic with various data combinations
- Test breadcrumb component rendering and navigation
- Test responsive behavior (mobile vs desktop)

### Integration Tests
- Test navigation from breadcrumb segments
- Test dynamic title updates when profile data loads
- Test own profile detection logic

### User Acceptance Tests
- Verify header displays correct name for other users
- Verify header displays "My Profile" for own profile
- Verify breadcrumbs navigate correctly
- Verify breadcrumbs show on all profile pages
- Verify responsive behavior on mobile devices

---

## Acceptance Criteria Checklist

### Page Title Display
- [ ] Header displays user's name when viewing another user's profile
- [ ] Header displays "My Profile" when viewing own profile
- [ ] Loading state shows placeholder title
- [ ] Error state shows fallback title

### Breadcrumb Navigation
- [ ] Breadcrumbs display "Dashboard > Discover Workers > [User Name]" for other users
- [ ] Breadcrumbs display "Dashboard > Discover Workers > My Profile" for own profile
- [ ] "Dashboard" breadcrumb navigates to `/dashboard`
- [ ] "Discover Workers" breadcrumb navigates to `/dashboard/discover/workers`
- [ ] Mobile view shows truncated breadcrumbs (< 640px)
- [ ] Desktop view shows full breadcrumb path (≥ 640px)

### Profile Edit Pages
- [ ] All edit pages show "Dashboard > My Profile > [Section Name]" breadcrumbs
- [ ] "My Profile" breadcrumb navigates to main profile view
- [ ] Section names match page titles

### Consistency
- [ ] Styling consistent across all pages
- [ ] Theme-aware (light/dark mode)
- [ ] Long names truncated with ellipsis

---

## Dependencies

### Required Hooks/Utilities
- `useAuth()` or `useUser()` - Current user ID
- `useNavigation()` - Update header title
- `useRouter()` - Navigation from breadcrumbs
- `api.profile.widgets.getGeneralInfo.useQuery()` - User profile data

### Required Components
- `Breadcrumb` - New reusable component
- `Link` from `expo-router` - Navigation
- Tamagui components (`XStack`, `Text`, `ChevronRight` icon)

---

## Rollout Strategy

1. **Phase 1**: Create Breadcrumb component (Task 3)
2. **Phase 2**: Add Drawer.Screen configuration (Task 1)
3. **Phase 3**: Implement dynamic title (Task 2)
4. **Phase 4**: Integrate breadcrumbs into user profile page (Task 4)
5. **Phase 5**: Apply to all profile edit pages (Task 5)

**Testing**: Test after each phase to ensure no regressions

---

## Open Questions / Considerations

1. **Profile Route Path**: Determine the correct route for "My Profile" breadcrumb
   - Should it link to `/dashboard/users/[currentUserId]` or a dedicated `/dashboard/profile` route?
   - Current structure suggests `/dashboard/users/[id]` is the main profile view

2. **Mobile Breadcrumb Strategy**: 
   - Show last 2 segments as specified, or use a back button?
   - Consider using a dropdown menu for collapsed breadcrumbs

3. **Long Name Truncation**: 
   - Should truncation happen at component level or CSS level?
   - Recommended: CSS `text-overflow: ellipsis` with max-width

4. **Loading State**: 
   - Should breadcrumbs show "Loading..." or hide until data loads?
   - Recommended: Show breadcrumbs with "Loading..." placeholder

---

## Notes

- The breadcrumb component should be reusable for other parts of the application
- Consider creating a utility function for display name calculation to avoid duplication
- Ensure breadcrumbs are accessible (proper ARIA labels, keyboard navigation)
- Test with various screen sizes and orientations
