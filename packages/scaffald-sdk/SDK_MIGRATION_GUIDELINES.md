# SDK Migration Guidelines

This document provides guidelines and checklists for migrating tRPC routers to the Scaffald SDK (REST API).

## Should This Router Migrate to SDK?

Use this decision tree to determine if a router should be migrated:

### ✅ YES - Migrate if ALL True

- [ ] **User-facing** (not admin-only)
- [ ] **Simple CRUD or read operations** (not complex multi-step workflows)
- [ ] **No file uploads/downloads** (no streaming, no binary data)
- [ ] **No external API calls requiring secrets** (no Stripe, no third-party providers)
- [ ] **Not compliance-critical** (not CCPA, account deletion, legal)
- [ ] **Used in 5+ places** OR **Public API candidate**
- [ ] **Stateless operations** (no server-side session requirements)

**Examples of Good Migration Candidates:**
- User profiles (skills, experience, education)
- Job listings and applications
- Social features (connections, follows)
- Reviews and ratings
- Portfolio items

### ❌ NO - Keep tRPC if ANY True

- [ ] **File operations** (uploads, streaming, downloads, PDF generation)
- [ ] **External provider integration** (OAuth, Stripe, background checks, ID verification)
- [ ] **Complex multi-step workflows** (payment flows, onboarding wizards)
- [ ] **Real-time subscriptions** (WebSocket, SSE)
- [ ] **Admin-only operations** (office management, super-admin tools)
- [ ] **Compliance-critical** (CCPA, legal requirements, audit trails)
- [ ] **Requires server secrets** (API keys, tokens)
- [ ] **Low usage** (<5 uses) AND not public API candidate

**Examples of Routers Staying in tRPC:**
- Payments and billing (Stripe integration)
- Resume uploads and parsing (file operations)
- Background checks (provider integration)
- Office admin tools (admin-only)
- CCPA requests (compliance-critical)

## Migration Checklist

Use this checklist when migrating a router from tRPC to SDK:

### Phase 1: Analysis & Planning

- [ ] **Verify router is migration candidate** (use decision tree above)
- [ ] **Document router methods** (list all procedures)
- [ ] **Count usages** (`grep -r "api.routerName." packages/`)
- [ ] **Identify consuming components** (list all files using router)
- [ ] **Check for complex dependencies** (file operations, external APIs)
- [ ] **Review authorization requirements** (API key vs session auth)

### Phase 2: SDK Resource Creation

- [ ] **Create resource file**: `packages/scaffald-sdk/src/resources/[name].ts`
  - [ ] Import `Resource` base class
  - [ ] Define TypeScript interfaces for requests/responses
  - [ ] Implement resource class with methods
  - [ ] Add JSDoc comments for documentation
  - [ ] Use proper HTTP methods (GET, POST, PATCH, DELETE)

- [ ] **Add to SDK client**: `packages/scaffald-sdk/src/client.ts`
  - [ ] Import resource class
  - [ ] Add public readonly property
  - [ ] Initialize in constructor

- [ ] **Export types**: `packages/scaffald-sdk/src/index.ts`
  - [ ] Export all request/response types
  - [ ] Export parameter types

### Phase 3: React Query Hooks

- [ ] **Create hooks file**: `packages/scf-core/utils/[name]-sdk-hooks.ts`
  - [ ] Import `useQuery`, `useMutation`, types
  - [ ] Import `useScaffaldJobsClient`
  - [ ] Create query hooks with `useQuery`
  - [ ] Create mutation hooks with `useMutation`
  - [ ] Accept `UseMutationOptions` for callbacks
  - [ ] Use proper query keys: `['scaffald', 'resource', 'method', params]`
  - [ ] Set appropriate stale times
  - [ ] Add JSDoc comments

### Phase 4: Testing

- [ ] **Create test file**: `packages/scaffald-sdk/src/__tests__/[name].test.ts`
  - [ ] Import vitest, client, server
  - [ ] Set up beforeAll, afterEach, afterAll
  - [ ] Test all methods (list, get, create, update, delete)
  - [ ] Test happy paths
  - [ ] Test edge cases (empty, null, missing data)
  - [ ] Test validation errors (400)
  - [ ] Test error handling (401, 404, 429, 500)
  - [ ] Aim for 80%+ code coverage

- [ ] **Add mock handlers**: `packages/scaffald-sdk/src/__tests__/mocks/server.ts`
  - [ ] Add HTTP handlers for all endpoints
  - [ ] Return realistic mock data
  - [ ] Include error scenarios

- [ ] **Run tests**: `pnpm --filter @scaffald/sdk test [name]`
  - [ ] All tests pass
  - [ ] Coverage report looks good

### Phase 5: Component Migration

- [ ] **Update consuming components** (for each file using tRPC router):
  - [ ] Import SDK hooks instead of tRPC
  - [ ] Replace `api.routerName.method.useQuery()` with SDK query hook
  - [ ] Replace `api.routerName.method.useMutation()` with SDK mutation hook
  - [ ] Update mutation parameters (check if wrapped vs direct)
  - [ ] Update cache invalidation to use `queryClient`
  - [ ] Update data access (check for `data.data` nesting)
  - [ ] Remove unused tRPC imports

### Phase 6: Verification

- [ ] **Zero tRPC references**: `grep -r "api.routerName." packages/ | wc -l` → 0
- [ ] **TypeScript compilation**: `pnpm typecheck` → no errors
- [ ] **Linting**: `pnpm lint` → no warnings
- [ ] **Manual testing**: Test critical user flows in browser
- [ ] **All tests pass**: `pnpm test` → all green

### Phase 7: Cleanup & Documentation

- [ ] **Update documentation**:
  - [ ] Add to SDK README
  - [ ] Update ARCHITECTURE.md
  - [ ] Update API_COVERAGE_MATRIX.md
  - [ ] Add migration notes to CHANGELOG

- [ ] **Mark tRPC router as deprecated** (optional, for gradual migration):
  ```typescript
  /**
   * @deprecated Use SDK client.resourceName instead
   * Will be removed in v2.0.0
   */
  ```

- [ ] **Remove tRPC router** (after confirmation):
  - [ ] Delete router file
  - [ ] Remove from router exports
  - [ ] Remove from package dependencies (if no longer needed)

## Common Migration Patterns

### Query Hook Pattern

**Before (tRPC):**
```typescript
import { api } from '@scf/core/utils/api'

const { data, isLoading } = api.teams.list.useQuery({
  organizationId
})
```

**After (SDK):**
```typescript
import { useTeams } from '@scf/core/utils/teams-sdk-hooks'

const { data, isLoading } = useTeams({
  organizationId
})
```

### Mutation Hook Pattern

**Before (tRPC):**
```typescript
const utils = api.useUtils()

const mutation = api.connections.send.useMutation({
  onSuccess: () => utils.connections.list.invalidate()
})

mutation.mutate({ targetUserId })
```

**After (SDK):**
```typescript
import { useQueryClient } from '@tanstack/react-query'
import { useSendConnectionMutation } from '@scf/core/utils/engagement-sdk-hooks'

const queryClient = useQueryClient()

const mutation = useSendConnectionMutation({
  onSuccess: () => queryClient.invalidateQueries({
    queryKey: ['connections', 'list']
  })
})

mutation.mutate({ targetUserId })
```

### UseMutationOptions Pattern (CRITICAL)

**Always accept UseMutationOptions in custom mutation hooks:**

```typescript
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

export function useCreateItemMutation(
  options?: UseMutationOptions<Item, Error, CreateItemParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateItemParams) => {
      if (!client) throw new Error('Missing client')
      return client.items.create(params)
    },
    ...options, // CRITICAL: Spread options to allow callbacks
  })
}
```

## Common Issues & Solutions

### Issue 1: Mutation Parameter Format

**Problem**: tRPC often wraps parameters, SDK sometimes uses direct values

**Solution**:
```typescript
// tRPC: wrapped object
mutation.mutate({ itemId: 'xyz' })

// SDK: check resource method signature
// If method is: async delete(id: string)
mutation.mutate('xyz')  // Direct value

// If method is: async delete(params: { id: string })
mutation.mutate({ id: 'xyz' })  // Wrapped object
```

### Issue 2: Data Structure Differences

**Problem**: Response structure may differ

**Solution**:
```typescript
// tRPC: direct array
const items = data.items

// SDK: check response type
// If GetItemsResponse = { data: Item[], pagination: {...} }
const items = data.data

// If GetItemsResponse = Item[]
const items = data
```

### Issue 3: Cache Invalidation

**Problem**: tRPC utils vs React Query queryClient

**Solution**:
```typescript
// tRPC
utils.teams.list.invalidate()

// SDK - use explicit query keys from hooks file
queryClient.invalidateQueries({
  queryKey: ['scaffald', 'teams', 'list', params]
})
```

### Issue 4: Event Type Naming

**Problem**: Inconsistent naming conventions

**Solution**:
```typescript
// tRPC analytics: dots
eventType: 'job.viewed'

// SDK: underscores (standardized)
eventType: 'job_view'
```

### Issue 5: Optional Parameters

**Problem**: tRPC makes all params optional by default

**Solution**:
```typescript
// SDK: explicitly mark optional
interface GetItemsParams {
  status?: 'active' | 'inactive'  // Optional
  limit?: number  // Optional
  offset?: number  // Optional
}

// Hook: handle undefined gracefully
export function useItems(params?: GetItemsParams) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'items', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.items.list(params)
    },
    enabled: !!client,
  })
}
```

## Query Key Patterns

Follow these patterns for consistent query keys:

### Resource List
```typescript
['scaffald', 'resource', 'list', params]
// Example: ['scaffald', 'jobs', 'list', { status: 'published' }]
```

### Resource Get/Retrieve
```typescript
['scaffald', 'resource', 'get', id]
// Example: ['scaffald', 'jobs', 'get', 'job_123']
```

### Resource Sub-Resource
```typescript
['scaffald', 'resource', 'sub-resource', id, params]
// Example: ['scaffald', 'teams', 'members', 'team_123', { role: 'admin' }]
```

### User-Specific Resource
```typescript
['scaffald', 'resource', 'user', userId, params]
// Example: ['scaffald', 'applications', 'user', 'user_123']
```

## Testing Patterns

### Basic Resource Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { Scaffald } from '../client.js'
import { server } from './mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('ResourceName', () => {
  let client: Scaffald

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    client = new Scaffald({
      apiKey: 'test_key',
      baseUrl: 'https://api.scaffald.com',
    })
  })

  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('list()', () => {
    it('should list resources', async () => {
      const result = await client.resourceName.list()
      expect(result.data).toBeInstanceOf(Array)
    })
  })

  describe('get()', () => {
    it('should get resource by ID', async () => {
      const result = await client.resourceName.get('id_123')
      expect(result.id).toBe('id_123')
    })

    it('should throw on not found', async () => {
      server.use(
        http.get('*/v1/resource/*', () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 })
        })
      )
      await expect(client.resourceName.get('invalid')).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle auth errors', async () => {
      const unauthClient = new Scaffald({ baseUrl: 'https://api.scaffald.com' })
      await expect(unauthClient.resourceName.list()).rejects.toThrow()
    })

    it('should handle rate limiting', async () => {
      server.use(
        http.get('*/v1/resource', () => {
          return HttpResponse.json({ error: 'Rate limit' }, {
            status: 429,
            headers: { 'Retry-After': '60' }
          })
        })
      )
      await expect(client.resourceName.list()).rejects.toThrow()
    })
  })
})
```

## Performance Tips

### Stale Time Recommendations

Set appropriate stale times based on data volatility:

- **Static data** (industries, occupations): `staleTime: 60 * 60 * 1000` (1 hour)
- **Semi-static** (job listings, profiles): `staleTime: 5 * 60 * 1000` (5 minutes)
- **Dynamic** (notifications, messages): `staleTime: 30 * 1000` (30 seconds)
- **Real-time** (online status): `staleTime: 0` (always refetch)

### Pagination

For paginated endpoints, use cursor-based or offset-based patterns:

```typescript
// Cursor-based (preferred for large datasets)
export function useInfiniteItems(params?: GetItemsParams) {
  const client = useScaffaldJobsClient()
  return useInfiniteQuery({
    queryKey: ['scaffald', 'items', 'infinite', params],
    queryFn: async ({ pageParam }) => {
      if (!client) throw new Error('Missing client')
      return client.items.list({ ...params, cursor: pageParam })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!client,
  })
}

// Offset-based (simpler, good for smaller datasets)
export function useItems(params?: GetItemsParams & { page?: number }) {
  const limit = 20
  const offset = (params?.page || 0) * limit
  // ... standard useQuery with offset
}
```

## Rollback Plan

If migration causes issues:

1. **Immediate Rollback**:
   - Revert component changes to use tRPC
   - Keep SDK resource (no harm in having both)
   - Document issues encountered

2. **Investigation**:
   - Check error logs
   - Verify API endpoint responses
   - Compare tRPC vs SDK behavior

3. **Fix & Retry**:
   - Address root cause
   - Update SDK resource if needed
   - Migrate again with fixes

4. **Long-term**:
   - SDK and tRPC can coexist
   - Gradual migration is acceptable
   - No need to rush if issues arise

## Getting Help

If you encounter issues during migration:

1. **Check existing migrations**: Review completed migrations for patterns
2. **Review this guide**: Ensure you followed all steps
3. **Test in isolation**: Create minimal reproduction
4. **Ask for review**: Get code review before merging
5. **Document learnings**: Update this guide with new patterns

## Conclusion

Following these guidelines ensures consistent, high-quality SDK migrations that maintain compatibility, performance, and developer experience.

Remember: **It's better to keep something in tRPC than to force a problematic SDK migration.** Not everything needs to be in the SDK.
