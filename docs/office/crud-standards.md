# Office CRUD Standards

This document defines the standard patterns and conventions for all Office (admin) resource management in the SCF-Neue application.

## Purpose

The Office section provides admin users with CRUD (Create, Read, Update, Delete) operations for managing system resources. To ensure consistency, maintainability, and ease of development, all resources must follow these standards.

## Resource Types

Current resources:
- **Jobs** - Job postings management
- **Users** - User account management
- **Universities** - University catalog management

Future resources should follow the same patterns.

## File Structure Standards

### Route Structure

All resources MUST follow this exact route structure:

```
apps/expo/app/office/{resource}/
├── index.tsx              # List page
├── create.tsx             # Create page
└── [id]/
    └── edit.tsx          # Edit page
```

**Example for "jobs":**
```
apps/expo/app/office/jobs/
├── index.tsx              # → OfficeJobsList
├── create.tsx             # → JobForm (mode="create")
└── [id]/
    └── edit.tsx          # → JobForm (mode="edit")
```

### Component Structure

All resources MUST have the following components:

```
packages/core/features/office/
├── office-{resource}-list.tsx    # List component
└── components/
    └── {Resource}Form.tsx        # Form component
```

**Example for "jobs":**
```
packages/core/features/office/
├── office-jobs-list.tsx          # List component
└── components/
    └── JobForm.tsx               # Form component
```

## Naming Conventions

### Component Files

- **List components**: `office-{resource}-list.tsx`
- **Form components**: `{Resource}Form.tsx` (PascalCase, in components/)
- **Shared components**: `OfficePageLayout.tsx`, `DeleteButton.tsx`, etc.

### Component Exports

All components MUST use named exports with consistent patterns:

```typescript
// List components
export function OfficeJobsList() { }
export function OfficeUsersList() { }
export function OfficeUniversitiesList() { }

// Form components
export function JobForm({ mode, jobId, initialData }: JobFormProps) { }
export function UserForm({ mode, userId, initialData }: UserFormProps) { }
export function UniversityForm({ mode, universityId, initialData }: UniversityFormProps) { }
```

### Route Files

Route files should be minimal and delegate to components:

```typescript
// apps/expo/app/office/{resource}/index.tsx
import { OfficeResourceList } from '@app/core/features/office/office-resource-list'

export default function OfficeResourcePage() {
  return <OfficeResourceList />
}
```

```typescript
// apps/expo/app/office/{resource}/create.tsx
import { ResourceForm } from '@app/core/features/office/components/ResourceForm'

export default function CreateResourcePage() {
  return <ResourceForm mode="create" />
}
```

```typescript
// apps/expo/app/office/{resource}/[id]/edit.tsx
import { YStack, Spinner } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@app/core/utils/api'
import { ResourceForm } from '@app/core/features/office/components/ResourceForm'

export default function EditResourcePage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading } = api.office.getResource.useQuery({ id: id! })

  if (isLoading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.resource) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <YStack>Resource not found</YStack>
      </YStack>
    )
  }

  return <ResourceForm mode="edit" resourceId={id} initialData={data.resource} />
}
```

## Component Patterns

### List Components

All list components MUST:
1. Use `OfficePageLayout` for consistent UI
2. Implement search functionality
3. Use `createColumnHelper` from TanStack Table
4. Include a "Create" button that routes to `/office/{resource}/create`
5. Include edit actions that route to `/office/{resource}/[id]/edit`
6. Include delete button with confirmation (using `DeleteButton` component)
7. Use tRPC for data fetching
8. Handle loading and error states

**Example Structure:**
```typescript
import { api } from '@app/core/utils/api'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'

type Resource = {
  id: string
  name: string
  // ... other fields
}

const columnHelper = createColumnHelper<Resource>()

export function OfficeResourceList() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  
  const { data, isLoading, refetch } = api.office.listResources.useQuery()
  const deleteMutation = api.office.deleteResource.useMutation({
    onSuccess: () => refetch()
  })

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue(),
    }),
    // ... other columns
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <XStack gap="$2">
          <Button 
            size="$2" 
            variant="outlined" 
            onPress={() => router.push(`/office/resources/${info.row.original.id}/edit`)}
          >
            Edit
          </Button>
          <DeleteButton
            itemName={info.row.original.name}
            itemType="resource"
            onDelete={() => deleteMutation.mutateAsync({ id: info.row.original.id })}
          />
        </XStack>
      ),
    }),
  ]

  const resources = data?.resources ?? []
  const filteredResources = resources.filter((resource) =>
    resource.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <OfficePageLayout
      title="Resources"
      searchPlaceholder="Search resources..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create Resource"
      onCreateClick={() => router.push('/office/resources/create')}
      columns={columns as ColumnDef<Resource, unknown>[]}
      data={filteredResources}
      isLoading={isLoading}
      onRowClick={(resource) => router.push(`/office/resources/${resource.id}/edit`)}
      pageSize={50}
      emptyMessage="No resources found"
    />
  )
}
```

### Form Components

All form components MUST:
1. Accept a `mode` prop: `"create" | "edit"`
2. Accept an optional `{resource}Id` prop for edit mode
3. Accept an optional `initialData` prop for edit mode
4. Use `react-hook-form` with `zod` validation
5. Use tRPC mutations for create/update
6. Show loading states during submission
7. Navigate back to list on success
8. Display validation errors
9. Use toast notifications for success/error feedback

**Example Structure:**
```typescript
import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@app/core/utils/api'

const resourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... other fields
})

type ResourceFormData = z.infer<typeof resourceSchema>

interface ResourceFormProps {
  mode: 'create' | 'edit'
  resourceId?: string
  initialData?: Partial<ResourceFormData>
}

export function ResourceForm({ mode, resourceId, initialData }: ResourceFormProps) {
  const router = useRouter()
  const toast = useToastController()
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: initialData || {
      name: '',
      // ... other defaults
    },
  })

  const createMutation = api.office.createResource.useMutation({
    onSuccess: () => {
      toast.show('Success', { message: 'Resource created successfully' })
      router.push('/office/resources')
    },
    onError: (error: any) => {
      toast.show('Error', { message: error.message || 'Failed to create resource' })
    },
  })

  const updateMutation = api.office.updateResource.useMutation({
    onSuccess: () => {
      toast.show('Success', { message: 'Resource updated successfully' })
      router.push('/office/resources')
    },
    onError: (error: any) => {
      toast.show('Error', { message: error.message || 'Failed to update resource' })
    },
  })

  const onSubmit = async (data: ResourceFormData) => {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data)
      } else {
        await updateMutation.mutateAsync({ id: resourceId!, ...data })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <YStack flex={1} bg="$background" p="$4" gap="$4">
      <H4>{mode === 'create' ? 'Create Resource' : 'Edit Resource'}</H4>
      
      {/* Form fields */}
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <YStack gap="$2">
            <Text fontWeight="600">Name *</Text>
            <Input
              value={field.value}
              onChangeText={field.onChange}
              borderColor={errors.name ? '$red8' : '$borderColor'}
            />
            {errors.name && (
              <Text color="$red10" fontSize="$2">{errors.name.message}</Text>
            )}
          </YStack>
        )}
      />

      {/* Submit buttons */}
      <XStack justify="flex-end" gap="$2">
        <Button variant="outlined" onPress={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isDirty || isLoading}
          icon={isLoading ? <Spinner /> : undefined}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </XStack>
    </YStack>
  )
}
```

## API/tRPC Standards

### Router Organization

All office operations MUST be in the `officeRouter`:

```typescript
// packages/supabase/functions/trpc/routers/office.router.ts
export const officeRouter = t.router({
  // Nested routers for complex resources
  universities: officeUniversitiesRouter,
  
  // Standard CRUD operations
  listResources: superAdminProcedure.query(async ({ ctx }) => { }),
  getResource: superAdminProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => { }),
  createResource: superAdminProcedure.input(resourceCreateSchema).mutation(async ({ ctx, input }) => { }),
  updateResource: superAdminProcedure.input(resourceUpdateSchema).mutation(async ({ ctx, input }) => { }),
  deleteResource: superAdminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => { }),
})
```

### Required Operations

Every resource MUST implement these five operations:

1. **List** - `listResources` - Returns paginated list
2. **Get** - `getResource` - Returns single item by ID
3. **Create** - `createResource` - Creates new item
4. **Update** - `updateResource` - Updates existing item
5. **Delete** - `deleteResource` - Deletes item (hard delete)

### Permission Checks

All operations MUST use `superAdminProcedure` to ensure only admins can access:

```typescript
const superAdminProcedure = t.procedure.use(enforceAdmin)
```

## Delete Operations

### Hard Deletes

All deletes are **hard deletes** (permanent removal from database).

### Confirmation Pattern

All delete operations MUST:
1. Use the `DeleteButton` component
2. Show confirmation dialog before deletion
3. Display item name in confirmation message
4. Show loading state during deletion
5. Show success/error toast
6. Refresh list on success

### Cascade Behavior

When implementing delete operations, consider:
- Related records in junction tables
- Foreign key constraints
- Orphaned data cleanup

## User Creation Special Case

User creation has special requirements:

1. **Create auth user** - Via Supabase Auth
2. **Create profile record** - In profiles table
3. **Send invite email** - Automatically trigger invite
4. **Return user data** - With all relevant fields

```typescript
createUser: superAdminProcedure
  .input(createUserSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await ctx.supabaseAdmin.auth.admin.createUser({
      email: input.email,
      email_confirm: false, // Requires confirmation
      user_metadata: {
        first_name: input.first_name,
        last_name: input.last_name,
      },
    })

    if (authError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: authError.message })

    // 2. Send invite email (automatically triggered by Supabase)
    await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(input.email)

    // 3. Profile is created automatically via trigger
    // 4. Return user data
    return { user: authUser.user }
  })
```

## Form Validation

All forms MUST:
1. Use Zod schemas for validation
2. Show validation errors inline
3. Disable submit when invalid
4. Show required field indicators (*)
5. Provide helpful error messages

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be 18 or older'),
})
```

## Loading States

All data fetching MUST show loading states:

```typescript
if (isLoading) {
  return (
    <YStack flex={1} bg="$background" items="center" justify="center">
      <Spinner size="large" />
    </YStack>
  )
}
```

## Error Handling

All operations MUST handle errors:

```typescript
if (error) {
  toast.show('Error', {
    message: error.message || 'An error occurred',
  })
}
```

## TypeScript Standards

All components MUST:
1. Define explicit prop interfaces
2. Use proper types for all variables
3. Avoid `any` type
4. Export types when shared
5. Use type inference where appropriate

```typescript
interface ResourceFormProps {
  mode: 'create' | 'edit'
  resourceId?: string
  initialData?: Partial<ResourceFormData>
}

export function ResourceForm({ mode, resourceId, initialData }: ResourceFormProps) {
  // Implementation
}
```

## Navigation Patterns

### From List to Create
```typescript
router.push('/office/resources/create')
```

### From List to Edit
```typescript
router.push(`/office/resources/${id}/edit`)
```

### After Create/Update
```typescript
router.push('/office/resources')  // Back to list
```

### Cancel Actions
```typescript
router.back()  // Go back to previous page
```

## Testing Checklist

When adding a new resource, verify:

- [ ] All 5 CRUD operations implemented
- [ ] All routes created (index, create, [id]/edit)
- [ ] List component created with search
- [ ] Form component created with validation
- [ ] Delete button with confirmation
- [ ] Loading states for all async operations
- [ ] Error handling for all operations
- [ ] Success/error toasts
- [ ] TypeScript types defined
- [ ] Navigation works correctly
- [ ] Search/filter works
- [ ] Permissions enforced (superAdminProcedure)

## Future Considerations

When adding new resources:
1. Follow all patterns exactly
2. Reuse existing components (OfficePageLayout, DeleteButton, etc.)
3. Add resource to this documentation
4. Consider relationships with other resources
5. Plan for pagination if list can grow large
6. Consider export/import functionality
7. Plan for bulk operations if needed

## Examples

See existing implementations:
- **Jobs** - Reference implementation (most complete)
- **Users** - Complex form with multiple sections
- **Universities** - Simple CRUD with minimal fields

## Maintenance

This document should be updated when:
- New patterns emerge
- Shared components are added
- Standards change
- New resources are added

Last Updated: 2025-10-10
