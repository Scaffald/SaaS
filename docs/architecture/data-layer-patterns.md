# Data Layer Architecture - tRPC + Supabase Edge Functions

## Overview

This document establishes the consistent data layer patterns for the SCF-Neue project using tRPC with Supabase Edge Functions, following Supabase best practices.

## Architecture Pattern

```
React Components → tRPC Client → Supabase Edge Functions (Deno) → Supabase Database
```

**Key Changes:**
- ✅ **Single tRPC implementation** in Supabase Edge Functions
- ✅ **Removed redundant packages/api** setup
- ✅ **Following Supabase best practices** with proper Deno configuration
- ✅ **Proper development environment** with VS Code Deno support

## Benefits

- **Better security**: Server-side validation and sanitization
- **Easier debugging**: Centralized logging and error handling  
- **Type safety**: End-to-end TypeScript types
- **Consistent patterns**: All data operations follow the same flow
- **Better testing**: Mock tRPC procedures instead of Supabase calls
- **Server-side RLS handling**: Edge functions run with elevated permissions

## Implementation Guidelines

### 1. React Components

**DO:**
- Use tRPC queries and mutations exclusively
- Handle loading and error states with React Query patterns
- Use proper TypeScript types from tRPC routers

**DON'T:**
- Import or use direct Supabase client calls
- Handle database operations in components
- Bypass tRPC for data operations

### 2. tRPC Routers

**Location**: `packages/api/src/routers/`

**Pattern**:
```typescript
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const featureRouter = createTRPCRouter({
  // Get data
  getData: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch data: ${error.message}`)
    }

    return data
  }),

  // Update data
  updateData: protectedProcedure
    .input(dataSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { error } = await supabase
        .from('table_name')
        .upsert({
          user_id: user.id,
          ...input,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        throw new Error(`Failed to update data: ${error.message}`)
      }

      return { success: true }
    }),
})
```

### 3. React Component Pattern

```typescript
import React from 'react'
import { api } from '@app/core/utils/api'

export function FeatureComponent() {
  // Fetch data
  const { data, isLoading, refetch } = api.feature.getData.useQuery()
  
  // Update data
  const updateMutation = api.feature.updateData.useMutation({
    onSuccess: () => {
      toast.show('Success', { message: 'Data updated successfully!' })
      refetch()
    },
    onError: (error) => {
      toast.show('Error', { message: error.message })
    },
  })

  const handleSubmit = async (formData) => {
    await updateMutation.mutateAsync(formData)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    // Component JSX
  )
}
```

## Migration Checklist

When migrating components from direct Supabase to tRPC:

### Phase 1: Create tRPC Router
- [ ] Create router in `packages/api/src/routers/`
- [ ] Define input/output schemas with Zod
- [ ] Implement query and mutation procedures
- [ ] Add router to main app router
- [ ] Test router with curl or API client

### Phase 2: Update React Components
- [ ] Remove direct Supabase imports
- [ ] Replace Supabase calls with tRPC hooks
- [ ] Update loading and error handling
- [ ] Test component functionality
- [ ] Run code quality checks

### Phase 3: Cleanup
- [ ] Remove unused Supabase client imports
- [ ] Update related components
- [ ] Document any breaking changes
- [ ] Update tests if applicable

## Error Handling

### Server-side (tRPC Router)
```typescript
if (error && error.code !== 'PGRST116') {
  throw new Error(`Failed to fetch data: ${error.message}`)
}
```

### Client-side (React Component)
```typescript
const mutation = api.feature.updateData.useMutation({
  onError: (error) => {
    console.error('Error:', error)
    toast.show('Error', {
      message: error.message || 'Something went wrong',
    })
  },
})
```

## Testing

### API Testing
Use browser extensions or curl commands to test tRPC endpoints:

```bash
# Test tRPC endpoint
curl -X POST "http://localhost:54321/functions/v1/trpc/feature.getData" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

### Component Testing
Test components in the actual client application rather than assuming they work.

## Examples

### Completed Migrations
- ✅ `profile-general-right.tsx` - Migrated to use `api.profile.getGeneral` and `api.profile.updateGeneral`

### Pending Migrations
- [ ] Other profile components (employment, skills, etc.)
- [ ] Dashboard components
- [ ] Any other components using direct Supabase calls

## Best Practices

1. **Always use tRPC** for data operations
2. **Handle errors gracefully** with user-friendly messages
3. **Use proper loading states** with React Query patterns
4. **Validate data** on both client and server
5. **Test thoroughly** in actual client applications
6. **Document changes** and update team on new patterns

## Troubleshooting

### Common Issues
1. **403 Forbidden**: Usually RLS policy issues - handle in tRPC router with elevated permissions
2. **Type errors**: Ensure proper imports and type definitions
3. **Loading states**: Use React Query's built-in loading states
4. **Error handling**: Implement both server and client-side error handling

### Debug Steps
1. Check tRPC router implementation
2. Test API endpoint directly with curl
3. Verify React Query setup
4. Check browser network tab for requests
5. Review server logs for errors
