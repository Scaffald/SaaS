---
pillar: "@scaffald/sdk"
status: active
last_verified: 2026-03-10
packages:
  - packages/scaffald-sdk/
  - packages/scf-core/utils/*-sdk-hooks.ts
key_files:
  - packages/scaffald-sdk/src/resources/
  - packages/scf-core/utils/
critical_constraints:
  - "Always accept UseMutationOptions as final param and spread with ...options"
  - "Guard client null state: if (!client) throw new Error('Missing client')"
  - "SDK response nesting: data.data (not data.items or data directly)"
  - "Cache keys follow ['resource-name', 'action', ...params] pattern"
---

# @scaffald/sdk — SDK Hooks & Integration

## Canonical useQuery Pattern

```typescript
import { useScaffaldJobsClient } from '@scaffald/sdk/react'
import { useQuery } from '@tanstack/react-query'

export function useTeams(params: { organizationId: string }) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: ['teams', 'list', params.organizationId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.teams.list(params)
    },
    enabled: !!client && !!params.organizationId,
  })
}
```

## Canonical useMutation Pattern

```typescript
import { useScaffaldJobsClient } from '@scaffald/sdk/react'
import { useMutation, type UseMutationOptions } from '@tanstack/react-query'

type SendConnectionParams = { targetUserId: string }

export function useSendConnectionMutation(
  options?: UseMutationOptions<Connection, Error, SendConnectionParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: SendConnectionParams) => {
      if (!client) throw new Error('Missing client')
      return client.connections.send(params)
    },
    ...options, // CRITICAL: Always spread to allow onSuccess/onError callbacks
  })
}
```

**Key rules:**
- Always accept `UseMutationOptions` as the last parameter
- Always spread `...options` at the end of the useMutation config
- Always guard `if (!client)` before calling any SDK method

## Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

// Invalidate by resource + action
queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })

// Invalidate all queries for a resource
queryClient.invalidateQueries({ queryKey: ['teams'] })
```

**Key convention:** `queryKey` follows `['resource-name', 'action', ...params]`

## Response Data Access

SDK responses nest data under `data.data`:

```typescript
// tRPC (old): data is direct
const connections = data.connections

// SDK (current): data is nested
const connections = data.data
```

## tRPC → SDK Migration Checklist

When converting a tRPC call to SDK:

1. Replace `api.resource.action.useQuery(params)` with the SDK hook equivalent
2. Replace `utils.resource.action.invalidate()` with `queryClient.invalidateQueries({ queryKey: [...] })`
3. Check parameter format — tRPC often wraps params, SDK may use direct values
4. Check response structure — SDK uses `data.data` nesting
5. Add null client guard in the hook
6. Accept `UseMutationOptions` for mutations and spread with `...options`

## SDK Testing Patterns

### MSW Mock Setup

```typescript
// Dedicated handler files for complex resources
import { profileViewsHandlers } from './profile-views-handlers'

export const handlers = [
  ...profileViewsHandlers,  // Spread imported handlers
]
```

- **First matching handler wins** — order matters
- Check for duplicate handlers: `grep -n "http.post.*endpoint" server.ts`
- Error test clients must set `maxRetries: 0` to avoid timeout

### Endpoint Path Convention

Profile-related resources use `/v1/profiles/*` prefix:
```
/v1/profiles/current
/v1/profiles/general
/v1/profiles/portfolio
/v1/profiles/portfolio/:id
/v1/profiles/completion/status
```

### Parameter Convention

SDK sends camelCase, handlers return snake_case:
```typescript
// SDK call
client.portfolio.create({ filePath: '/uploads/file.pdf', displayOrder: 5 })

// Handler returns
{ file_path: body.filePath, display_order: body.displayOrder }
```
