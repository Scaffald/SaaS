# Profile Components Architecture

## Overview

This directory contains a **schema-driven, DRY (Don't Repeat Yourself) architecture** for profile management that works seamlessly in both user dashboard and admin office contexts.

## Current Implementation Status

### ✅ Fully Implemented (Multi-User Support)
- **General Profile** - Avatar, name, contact, address (fully functional for any user)
- **Employment** - Employment preferences, travel, licensing (fully functional for any user)

### ⚠️ Partial Implementation (Admin User Only)
The following sections are available in the admin edit page but currently operate on the logged-in admin user:
- **Skills** - Skills management with hierarchy
- **Experience** - Work history and experience
- **Education** - Educational background
- **Certifications** - Professional certifications

**Why?** These components are more complex and require additional refactoring to support multi-user editing. They work perfectly in the user dashboard context.

## Key Principles

1. **Single Source of Truth**: All validation schemas are defined once in `config/` directory
2. **Reusable Components**: Form sections in `components/` work in both user and admin contexts
3. **Mode-Based Routing**: Components automatically use the correct tRPC endpoints based on `mode` prop
4. **Future-Proof**: Adding new profile sections automatically makes them available to admins

## Directory Structure

```
packages/core/features/profile/
├── components/                     # Shared, reusable section components
│   ├── index.ts                   # Barrel export file
│   ├── GeneralProfileSection.tsx  # Avatar, name, contact, address
│   ├── EmploymentSection.tsx      # Employment preferences
│   └── [future sections]          # Education, Skills, Experience, etc.
│
├── config/                        # Schemas (single source of truth)
│   ├── index.ts
│   ├── general-schema.ts          # Zod schema for general profile
│   ├── employment-schema.ts       # Zod schema for employment
│   └── [future schemas]
│
├── profile-general-left.tsx       # User dashboard view (uses GeneralProfileSection)
├── profile-employment-left.tsx    # User dashboard view (uses EmploymentSection)
└── [other dashboard files]
```

## How It Works

### 1. Schema-Driven Validation

All form validation is defined once in Zod schemas:

```typescript
// packages/core/features/profile/config/general-schema.ts
export const generalProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  // ... more fields
})
```

### 2. Shared Section Components

Each section component accepts props to determine its context:

```typescript
interface GeneralProfileSectionProps {
  userId?: string           // Which user to edit (optional for current user)
  mode?: 'user' | 'admin'  // Which tRPC endpoints to use
  readOnly?: boolean        // View-only mode
}
```

### 3. Mode-Based tRPC Routing

Components automatically route to the correct tRPC endpoints:

```typescript
// In GeneralProfileSection.tsx
const useQuery = mode === 'admin' && userId
  ? () => api.office.getUserGeneral.useQuery({ userId })  // Admin endpoint
  : () => api.profile.getGeneral.useQuery()                // User endpoint
```

### 4. Usage Examples

#### User Dashboard (Current User)
```tsx
// apps/expo/app/dashboard/profile/general.tsx
import { GeneralProfileSection } from '@app/core/features/profile/components'

export function ProfileGeneralLeft() {
  return <GeneralProfileSection mode="user" />
}
```

#### Admin Office (Any User)
```tsx
// apps/expo/app/office/users/[id]/edit.tsx
import { GeneralProfileSection } from '@app/core/features/profile/components'

export default function EditUserPage() {
  const { id } = useLocalSearchParams()
  
  return (
    <>
      <GeneralProfileSection userId={id} mode="admin" />
      <EmploymentSection userId={id} mode="admin" />
    </>
  )
}
```

## Adding New Profile Sections

To add a new profile section (e.g., Education):

### Step 1: Create the Schema

```typescript
// packages/core/features/profile/config/education-schema.ts
import { z } from 'zod'

export const educationProfileSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  graduation_year: z.number().min(1900).max(2100),
  // ... more fields
})

export type EducationProfileFormData = z.infer<typeof educationProfileSchema>

export const educationProfileDefaults: EducationProfileFormData = {
  degree: "",
  institution: "",
  graduation_year: new Date().getFullYear(),
}
```

### Step 2: Create the Shared Component

```typescript
// packages/core/features/profile/components/EducationSection.tsx
import { useState, useEffect } from 'react'
import { educationProfileSchema, type EducationProfileFormData } from '../config/education-schema'

export function EducationSection({ userId, mode = 'user', readOnly = false }) {
  // Same pattern as GeneralProfileSection and EmploymentSection
  // - Use schema for validation
  // - Route to correct tRPC endpoint based on mode
  // - Include readOnly support
}
```

### Step 3: Add tRPC Endpoints

```typescript
// packages/supabase/functions/trpc/routers/office.router.ts
import { educationProfileSchema } from "@app/core/features/profile/config/education-schema"

export const officeRouter = t.router({
  // ... existing endpoints
  
  getUserEducation: superAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Fetch education data for specified user
    }),
    
  updateUserEducation: superAdminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      data: educationProfileSchema  // Uses the same schema!
    }))
    .mutation(async ({ ctx, input }) => {
      // Update education data
    }),
})
```

### Step 4: Use in Both Contexts

The new section automatically works in both user and admin contexts:

```tsx
// User dashboard - works immediately
<EducationSection mode="user" />

// Admin office - works immediately
<EducationSection userId={userId} mode="admin" />
```

## Benefits

### 1. DRY (Don't Repeat Yourself)
- ✅ Validation logic defined once in schemas
- ✅ Form components defined once, used everywhere
- ✅ No duplicate code between user and admin interfaces

### 2. Maintainability
- ✅ Schema changes automatically apply to both user and admin forms
- ✅ UI improvements benefit both contexts
- ✅ Bug fixes only need to be made once

### 3. Future-Proof
- ✅ New profile sections automatically available to admins
- ✅ Consistent UX between user and admin experiences
- ✅ Easy to add new sections following the established pattern

### 4. Type Safety
- ✅ Full TypeScript support throughout
- ✅ Schema validation at runtime
- ✅ Compile-time type checking

### 5. Feature Parity
- ✅ Admins get the same rich UI components as users
- ✅ Avatar upload, address autocomplete, phone formatting, etc.
- ✅ Real-time validation and error handling

## Migration Guide

### From Old UserForm.tsx

The old `packages/core/features/office/components/UserForm.tsx` used:
- ❌ Manual `useState` for each field
- ❌ No schema validation
- ❌ Basic Input components only
- ❌ Manual change tracking

The new shared components provide:
- ✅ React Hook Form + Zod validation
- ✅ Schema-driven with config files
- ✅ Rich UI components (avatar, address autocomplete, phone input)
- ✅ Real-time validation and error handling

### Refactoring User Dashboard Components (Optional)

Existing user dashboard components (`profile-general-left.tsx`, etc.) can be refactored to use the shared components:

```tsx
// Before
export function ProfileGeneralLeft() {
  // ~200 lines of form logic
}

// After
import { GeneralProfileSection } from './components'

export function ProfileGeneralLeft() {
  return <GeneralProfileSection mode="user" />
}
```

This is optional since the existing components work fine, but provides consistency.

## Testing

When testing changes:

1. **Test as User**: Navigate to `/dashboard/profile/*` screens
2. **Test as Admin**: Navigate to `/office/users/[id]/edit` screen
3. **Verify Schema Changes**: Update schema → both contexts should reflect changes
4. **Test Validation**: Try invalid data → should show proper error messages
5. **Test Submissions**: Submit forms → should save correctly in both contexts

## Common Patterns

### Read-Only Mode
```tsx
<GeneralProfileSection userId={id} mode="admin" readOnly />
```

### Conditional Rendering
```tsx
{isAdmin && <EmploymentSection userId={selectedUserId} mode="admin" />}
{!isAdmin && <EmploymentSection mode="user" />}
```

### Custom Layouts
```tsx
<YStack gap="$4">
  <Text fontSize="$6">General Information</Text>
  <GeneralProfileSection userId={id} mode="admin" />
  
  <Text fontSize="$6">Employment</Text>
  <EmploymentSection userId={id} mode="admin" />
</YStack>
```

## Troubleshooting

### Component not updating after schema change
- Restart dev server
- Check that schema is properly exported from config/index.ts
- Verify tRPC router imports the updated schema

### TypeScript errors in admin routes
- Ensure office router imports schemas from correct path
- Check that tRPC types are regenerated

### Form not saving
- Check tRPC endpoint is properly configured
- Verify database column names match schema fields
- Check browser console for detailed error messages

## Future Enhancements

Potential additions following this pattern:

1. **SkillsSection** - Skills management with autocomplete
2. **ExperienceSection** - Work history with timeline
3. **EducationSection** - Educational background
4. **CertificationsSection** - Professional certifications
5. **ProjectsSection** - Portfolio and projects

Each would follow the same pattern:
1. Create schema in `config/`
2. Create shared component in `components/`
3. Add tRPC endpoints in office router
4. Use in both user dashboard and admin office

## Related Documentation

- [tRPC Router Documentation](../../../supabase/functions/trpc/README.md)
- [Form Validation Best Practices](./config/README.md)
- [UI Component Library](../../../ui/README.md)
