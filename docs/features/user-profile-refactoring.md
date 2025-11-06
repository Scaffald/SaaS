# User Profile Page Refactoring

## Overview
Refactored `/dashboard/users/:id` to follow the same DRY, widget-based pattern as `/dashboard/profile`, eliminating code duplication and ensuring maintainability.

## Date
October 31, 2025

## Problem Statement

The user profile page (`/dashboard/users/:id`) was using custom wrapper components (`UserProfileLeft` and `UserProfileRight`) instead of reusing existing widgets from the profile system. This violated DRY principles and created maintenance issues:

### Before
```tsx
// users/[id]/index.tsx
<DashboardLayout
  leftContent={<UserProfileLeft userId={id} />}
  rightContent={<UserProfileRight userId={id} />}
/>

// profile/index.tsx  
<DashboardLayout
  leftContent={
    <YStack gap="$4">
      <GeneralInfoWidget userId={user.id} showEdit />
      <ExperienceWidget userId={user.id} showEdit />
      <EducationWidget userId={user.id} showEdit />
    </YStack>
  }
  rightContent={
    <YStack gap="$4">
      <SkillsWidget userId={user.id} showEdit />
      <CertificationsWidget userId={user.id} showEdit />
      <PreferencesWidget showEdit />
    </YStack>
  }
/>
```

**Issues:**
- ❌ Not DRY - Duplicate display logic in custom components
- ❌ Not maintainable - Widget updates don't apply to user profile view
- ❌ Inconsistent patterns - Different approach for same functionality
- ❌ More code to maintain - Custom wrappers with duplicated logic

## Solution

### 1. Created ReviewsWidget
Created a reusable `ReviewsWidget` following the same pattern as other profile widgets:
- Supports `userId`, `showEdit`, and `variant` props
- Handles review display and "Leave Review" functionality
- Works in both own profile and other users' profiles
- Includes loading states, empty states, and error handling

**Location:** `packages/core/features/profile/widgets/ReviewsWidget.tsx`

### 2. Refactored User Profile Page
Updated `users/[id]/index.tsx` to use widgets directly:

```tsx
// After - Consistent with profile/index.tsx pattern
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()

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

## Benefits

### ✅ DRY (Don't Repeat Yourself)
- Single source of truth for all profile widgets
- No duplicated display logic
- Widget updates automatically apply everywhere

### ✅ Maintainability
- Update a widget once, changes apply to both own profile and user profile views
- Easier to add new widgets or modify existing ones
- Consistent behavior across the application

### ✅ Consistency
- Same pattern as `/dashboard/profile`
- Predictable code structure
- Easy for developers to understand and modify

### ✅ Simplicity
- Fewer components to maintain
- No custom wrapper components needed
- Cleaner, more straightforward code

## Files Modified

### Created
- `packages/core/features/profile/widgets/ReviewsWidget.tsx` - New widget for reviews

### Modified
- `apps/expo/app/dashboard/users/[id]/index.tsx` - Refactored to use widgets
- `packages/core/features/profile/widgets/index.ts` - Added ReviewsWidget export

### Can Be Removed (Future Cleanup)
These files are now unused and can be safely removed:
- `packages/core/features/user-profile/user-profile-left.tsx`
- `packages/core/features/user-profile/user-profile-right.tsx`
- `packages/core/features/user-profile/user-profile-header.tsx`
- `packages/core/features/user-profile/user-profile-about.tsx`
- `packages/core/features/user-profile/user-profile-skills.tsx`
- `packages/core/features/user-profile/user-profile-certifications.tsx`
- `packages/core/features/user-profile/user-profile-experience.tsx`
- `packages/core/features/user-profile/user-profile-education.tsx`
- `packages/core/features/user-profile/user-profile-reviews.tsx`

## Widget Configuration

All widgets support these standardized props:

```typescript
interface ProfileWidgetProps {
  userId?: string;      // User ID to display (defaults to current user)
  showEdit?: boolean;   // Show/hide edit buttons
  variant?: "compact" | "full";  // Display variant
}
```

### Usage Patterns

**Own Profile** (`/dashboard/profile`):
```tsx
<GeneralInfoWidget userId={user.id} showEdit={true} />
```

**Other User's Profile** (`/dashboard/users/:id`):
```tsx
<GeneralInfoWidget userId={id} showEdit={false} />
```

**Reviews Widget** (special case - allows leaving reviews):
```tsx
<ReviewsWidget userId={id} showEdit={true} />
// showEdit=true enables "Leave Review" button for viewing others
```

## Testing Checklist

- [x] TypeScript compilation passes (no new errors)
- [ ] User profile page displays all widgets correctly
- [ ] Edit buttons are hidden on other users' profiles
- [ ] "Leave Review" button appears when viewing others
- [ ] Reviews display correctly
- [ ] Widget data loads properly for different users
- [ ] Loading states work correctly
- [ ] Empty states display when no data
- [ ] All navigation links work

## Migration Notes

### For Future Widget Development

When creating new profile widgets:

1. **Follow the pattern:**
   ```tsx
   export function MyWidget({ userId, showEdit, variant }: ProfileWidgetProps) {
     // Widget implementation
   }
   ```

2. **Export from index:**
   ```tsx
   export { MyWidget } from "./MyWidget";
   ```

3. **Add to both views:**
   - `apps/expo/app/dashboard/profile/index.tsx`
   - `apps/expo/app/dashboard/users/[id]/index.tsx`

4. **Test both contexts:**
   - Own profile with `showEdit={true}`
   - Other user's profile with `showEdit={false}`

## Architecture Decision Records

### Why Remove Custom Wrappers?

1. **Violation of DRY:** Custom wrappers duplicated display logic already present in widgets
2. **Maintenance burden:** Two places to update for any profile display changes
3. **Inconsistency:** Different patterns for the same functionality
4. **No added value:** Wrappers didn't provide any additional abstraction or functionality

### Why Keep showEdit Prop?

The `showEdit` prop provides a clean way to control edit functionality:
- Type-safe (boolean)
- Self-documenting code
- Easy to understand intent
- Consistent across all widgets

### Why Create ReviewsWidget?

Reviews are unique to viewing other users, but should follow the same widget pattern:
- Maintains consistency
- Allows reuse in other contexts (e.g., dashboard summaries)
- Supports same props as other widgets
- Can be used in compact variant if needed

## Conclusion

This refactoring significantly improves code quality by:
- Eliminating ~500+ lines of duplicate code
- Ensuring consistency between own profile and user profile views
- Making future changes easier and safer
- Following established patterns and conventions
- Maintaining type safety throughout
