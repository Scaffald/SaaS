# Office Organizations CRUD Implementation

## Overview

Complete CRUD (Create, Read, Update, Delete) operations for managing organizations in the `/office` context. This feature allows super admins to manage employer/organization profiles.

## Implementation Status: ✅ Complete

All components and functionality have been implemented following the established patterns from Jobs, Universities, and Applications.

## Files Created/Modified

### Routes
- `apps/expo/app/office/organizations/index.tsx` - List view
- `apps/expo/app/office/organizations/create.tsx` - Create form
- `apps/expo/app/office/organizations/[id]/edit.tsx` - Edit form

### Core Components
- `packages/core/features/office/office-organizations-list.tsx` - List component with table, search, and actions
- `packages/core/features/office/components/OrganizationForm.tsx` - Shared form for create/edit

### Schemas
- `packages/schemas/src/organizations/index.ts` - Zod validation schemas
- Updated `packages/schemas/src/index.ts` to export organization schemas

### API (tRPC)
- Updated `packages/supabase/functions/trpc/routers/office.router.ts` with 5 new procedures:
  - `listOrganizations` - Paginated list with search
  - `getOrganization` - Single organization details
  - `createOrganization` - Create new organization
  - `updateOrganization` - Update existing organization
  - `deleteOrganization` - Hard delete with cascade warnings

### Configuration
- Updated `packages/core/constants/routes.ts` - Added organization routes
- Updated `packages/core/features/drawer/config.ts` - Added to Office navigation

## Features

### List View
- Paginated table display with 50 items per page
- Search by organization name or slug
- Columns: Name, Slug, Industry, Visibility, Created Date
- Actions: Edit and Delete buttons per row
- Create button in page header

### Create Form
- Name field (required) - Auto-generates slug
- Slug field (required) - URL-friendly identifier
- Industry dropdown (optional) - Populated from industries table
- Logo URL field (optional)
- Visibility dropdown (public/private)
- Form validation with Zod schemas
- Auto-slug generation from organization name
- Success toast and redirect after creation

### Edit Form
- Pre-populated form with existing organization data
- Same validation as create form
- Slug uniqueness check (excluding current organization)
- Success toast and redirect after update
- Loading states while fetching data

### Delete Operation
- Confirmation dialog with organization name
- Hard delete with CASCADE warnings in comments
- Automatically deletes related records:
  - Teams and team_members
  - Jobs and all job-related records (applications, skills, certifications)
  - Organization_skills
  - Follows
  - Invites

## API Endpoints

### listOrganizations
```typescript
input: {
  limit: number (1-100, default 50)
  offset: number (default 0)
  search?: string
}
output: {
  organizations: Organization[]
  total: number
}
```

### getOrganization
```typescript
input: {
  id: string (UUID)
}
output: {
  organization: Organization & { industry: { id, name } }
}
```

### createOrganization
```typescript
input: {
  name: string (required)
  slug: string (required, lowercase)
  industry_id?: string (UUID)
  logo_url?: string (URL)
  visibility: 'public' | 'private' (default: public)
  address?: Record<string, unknown>
}
output: {
  organization: Organization
}
```

### updateOrganization
```typescript
input: {
  id: string (UUID)
  name: string
  slug: string (lowercase)
  industry_id?: string (UUID)
  logo_url?: string (URL)
  visibility: 'public' | 'private'
  address?: Record<string, unknown>
}
output: {
  organization: Organization
}
```

### deleteOrganization
```typescript
input: {
  id: string (UUID)
}
output: {
  success: boolean
}
```

## Validation Rules

### Name
- Required
- Minimum 1 character
- Used to auto-generate slug in create mode

### Slug
- Required
- Minimum 1 character
- Automatically converted to lowercase
- Must be unique across all organizations
- Format: lowercase letters, numbers, and hyphens only
- Auto-generated from name during creation

### Industry ID
- Optional
- Must be valid UUID if provided
- References industries table

### Logo URL
- Optional
- Must be valid URL format if provided
- Can be empty string

### Visibility
- Required
- Must be either 'public' or 'private'
- Defaults to 'public'

## Security

### Authorization
- All operations require super admin role
- Uses `superAdminProcedure` middleware
- Service role client respects RLS policies

### Data Validation
- Input validation with Zod schemas
- Slug uniqueness checks before create/update
- Proper error handling and user feedback

## Database Cascade Behavior

When an organization is deleted, the following related records are automatically deleted via CASCADE constraints:

1. **Teams** (`teams.organization_id`)
   - And their `team_members`

2. **Jobs** (`jobs.organization_id`)
   - And their `applications`
   - And their `job_skills`
   - And their `job_certifications`

3. **Organization Skills** (`organization_skills.organization_id`)

4. **Follows** (`follows.organization_id`)

5. **Invites** (`invites.organization_id`)

⚠️ **Warning**: This is a HARD DELETE with cascading effects. Always warn users before deletion.

## UI Components

### OfficeOrganizationsList
- Uses `OfficePageLayout` for consistent styling
- TanStack Table for data display
- Client-side search filtering
- Responsive design
- Loading states
- Empty state messaging

### OrganizationForm
- React Hook Form with Zod resolver
- Controller-based form fields
- Tamagui UI components (Input, Select)
- Industry dropdown with industries from API
- Visibility toggle
- Auto-slug generation
- Form validation with error messages
- Loading/saving states
- Success/error toasts
- Navigation after successful operations

## Navigation

The Organizations link appears in the Office section of the drawer navigation, only visible to super admins.

**Path**: Office > Organizations

## Route Constants

```typescript
ROUTES.OFFICE_ORGANIZATIONS // /office/organizations
ROUTES.OFFICE_ORGANIZATIONS_CREATE // /office/organizations/create
ROUTES.OFFICE_ORGANIZATIONS_EDIT // /office/organizations/:id/edit
```

## Testing Checklist

- [ ] List organizations with pagination
- [ ] Search organizations by name and slug
- [ ] Create new organization
  - [ ] With all fields
  - [ ] With only required fields
  - [ ] Slug auto-generation
  - [ ] Slug uniqueness validation
- [ ] Edit existing organization
  - [ ] Update all fields
  - [ ] Update slug (uniqueness check)
  - [ ] Update industry
- [ ] Delete organization
  - [ ] Confirmation dialog shows
  - [ ] Cascade deletes work correctly
  - [ ] Related jobs are deleted
  - [ ] Related teams are deleted
- [ ] Form validation
  - [ ] Required fields
  - [ ] URL format for logo_url
  - [ ] Slug format
- [ ] Navigation
  - [ ] Appears in Office drawer
  - [ ] Only visible to super admins
  - [ ] Routing works correctly

## Future Enhancements

1. **Soft Delete**: Add `deleted_at` column for soft deletes
2. **Bulk Operations**: Select multiple organizations for batch actions
3. **Advanced Search**: Filter by industry, visibility, creation date
4. **Image Upload**: Direct logo upload instead of URL
5. **Organization Details Page**: View-only page with full organization info
6. **Audit Log**: Track changes to organizations
7. **Export**: Export organizations list to CSV/Excel

## Related Features

- Jobs Management (`/office/jobs`) - Jobs belong to organizations
- Universities Management (`/office/universities`) - Similar CRUD pattern
- Applications Management (`/office/applications`) - Applications are for jobs in organizations
- Users Management (`/office/users`) - Users can be organization owners

## Compliance with Standards

✅ Follows existing office CRUD patterns
✅ Uses shared `OfficePageLayout` component
✅ Uses shared `DeleteButton` component
✅ Proper TypeScript typing (no `any` types)
✅ Zod validation schemas
✅ tRPC procedures with proper error handling
✅ RLS-compliant database operations
✅ Consistent naming conventions
✅ Route constants integration
✅ Drawer navigation integration
