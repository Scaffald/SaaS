# Client Migration Guide: tRPC to REST API

**Last Updated**: 2025-12-31
**Audience**: Frontend Developers

---

## Overview

This guide provides step-by-step instructions for migrating client applications from tRPC to the RESTful API using the `@scaffald/sdk`.

**Affected Apps**:
1. Scaffald App (`apps/scaffald/`) — supported (Expo/React Native)
2. Expo/React Native shared code (`packages/scf-core/`)
3. Forsured Web — deprecated/archived (was `apps/forsured-web/`)

---

## Migration Strategy

### Parallel Systems with Feature Flags

We'll run **both tRPC and REST simultaneously** during migration:

```typescript
// Feature flag determines which API to use
const useREST = featureFlags.auth // true = REST, false = tRPC

const data = useREST
  ? await restClient.auth.getSession()  // REST API
  : await trpcClient.auth.getSession() // tRPC API
```

**Benefits**:
- Instant rollback capability
- Gradual user migration
- A/B testing performance
- Zero downtime

---

## Step 1: Install Scaffald SDK

### Add Dependency

**For all apps**:
```bash
# From monorepo root
cd packages/scf-core  # or apps/scaffald
pnpm add @scaffald/sdk@workspace:*
```

**Verify installation**:
```json
// package.json
{
  "dependencies": {
    "@scaffald/sdk": "workspace:*"
  }
}
```

---

## Step 2: Set Up Feature Flags

### Create Feature Flag Configuration

**File**: `packages/scf-core/config/feature-flags.ts`

```typescript
export const FEATURE_FLAGS = {
  // Master kill switch
  ENABLE_REST_MIGRATION: false,

  // Per-module flags
  USE_REST_API: {
    auth: false,
    profile: false,
    jobs: false,
    applications: false,
    notifications: false,
    // ... more modules as we migrate
  },
} as const

export type ModuleName = keyof typeof FEATURE_FLAGS.USE_REST_API

export function useFeatureFlag(module: ModuleName): boolean {
  if (!FEATURE_FLAGS.ENABLE_REST_MIGRATION) return false
  return FEATURE_FLAGS.USE_REST_API[module]
}
```

### Remote Configuration (Production)

For gradual rollout in production:

**Option A: Firebase Remote Config**:
```typescript
import remoteConfig from '@react-native-firebase/remote-config'

export async function loadFeatureFlags() {
  await remoteConfig().fetchAndActivate()

  return {
    auth: remoteConfig().getBoolean('rest_api_auth'),
    profile: remoteConfig().getBoolean('rest_api_profile'),
    // ... more modules
  }
}
```

**Option B: LaunchDarkly**:
```typescript
import * as LaunchDarkly from 'launchdarkly-react-native-client-sdk'

export async function loadFeatureFlags() {
  const client = await LaunchDarkly.initialize(config)

  return {
    auth: await client.boolVariation('rest-api-auth', false),
    profile: await client.boolVariation('rest-api-profile', false),
  }
}
```

---

## Step 3: Create Hybrid API Client

### Expo/React Native App

**File**: `packages/scf-core/utils/api-hybrid.ts`

```typescript
import { Scaffald } from '@scaffald/sdk'
import { api as trpcApi } from './api' // existing tRPC client
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFeatureFlag, type ModuleName } from '../config/feature-flags'

class HybridAPIClient {
  private restClient: Scaffald | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return

    // Get access token from AsyncStorage
    const session = await AsyncStorage.getItem('supabase.session')
    const accessToken = session ? JSON.parse(session).access_token : undefined

    // Initialize REST client
    this.restClient = new Scaffald({
      accessToken,
      baseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/api',
    })

    this.initialized = true
  }

  // Auth module
  get auth() {
    const useREST = useFeatureFlag('auth')
    return useREST ? this.restClient!.auth : trpcApi.auth
  }

  // Profile module
  get profile() {
    const useREST = useFeatureFlag('profile')
    return useREST ? this.restClient!.profiles : trpcApi.profile
  }

  // Jobs module
  get jobs() {
    const useREST = useFeatureFlag('jobs')
    return useREST ? this.restClient!.jobs : trpcApi.jobs
  }

  // Applications module
  get applications() {
    const useREST = useFeatureFlag('applications')
    return useREST ? this.restClient!.applications : trpcApi.applications
  }

  // Add more modules as they're migrated...
}

export const hybridAPI = new HybridAPIClient()

// Initialize on app startup
export async function initializeAPI() {
  await hybridAPI.initialize()
}
```

### Scaffald App

**File**: `apps/scaffald/app/lib/api.ts`

```typescript
import { Scaffald } from '@scaffald/sdk'
import { useFeatureFlag } from '@scf/core/config/feature-flags'
// Import existing tRPC client
import { trpc } from './trpc'

export class APIClient {
  private rest: Scaffald

  constructor() {
    this.rest = new Scaffald({
      // Token will be injected via React context
      baseUrl: ENV.SUPABASE_URL + '/functions/v1/api',
    })
  }

  // Helper to route based on feature flag
  private route<T>(module: string, restFn: () => T, trpcFn: () => T): T {
    return useFeatureFlag(module) ? restFn() : trpcFn()
  }

  get auth() {
    return this.route('auth',
      () => this.rest.auth,
      () => trpc.auth
    )
  }

  // ... similar for other modules
}

export const api = new APIClient()
```

---

## Step 4: Migrate React Hooks

### Option A: Use Scaffald SDK React Hooks (Recommended)

**Before (tRPC)**:
```typescript
import { trpc } from '~/lib/trpc'

function ProfileScreen() {
  const { data, isLoading } = trpc.profile.general.get.useQuery()
  const updateMutation = trpc.profile.general.update.useMutation()

  const handleUpdate = (newData) => {
    updateMutation.mutate(newData)
  }

  if (isLoading) return <Spinner />
  return <ProfileView profile={data} onUpdate={handleUpdate} />
}
```

**After (REST with SDK hooks)**:
```typescript
import { useProfile, useUpdateProfile } from '@scaffald/sdk/react'

function ProfileScreen() {
  const { data, isLoading } = useProfile()
  const updateMutation = useUpdateProfile()

  const handleUpdate = (newData) => {
    updateMutation.mutate(newData)
  }

  if (isLoading) return <Spinner />
  return <ProfileView profile={data} onUpdate={handleUpdate} />
}
```

**Migration Steps**:
1. Replace tRPC hook import with SDK hook
2. Update hook name (usually similar)
3. Test that data shape matches
4. Verify loading/error states work

### Option B: Hybrid Hooks (During Transition)

If you want to switch between tRPC and REST dynamically:

```typescript
import { useFeatureFlag } from '@scf/core/config/feature-flags'
import { useProfile as useRESTProfile } from '@scaffald/sdk/react'
import { trpc } from '~/lib/trpc'

function useProfile() {
  const useREST = useFeatureFlag('profile')

  const restQuery = useRESTProfile({ enabled: useREST })
  const trpcQuery = trpc.profile.general.get.useQuery(undefined, { enabled: !useREST })

  return useREST ? restQuery : trpcQuery
}

// Use in component
function ProfileScreen() {
  const { data, isLoading } = useProfile() // Automatically routes to REST or tRPC
  // ... rest of component
}
```

---

## Step 5: Migrate API Calls

### Simple Query Migration

**Before (tRPC)**:
```typescript
const { data: jobs } = trpc.jobs.list.useQuery({
  limit: 20,
  offset: 0,
  status: 'published',
})
```

**After (REST)**:
```typescript
const { data: jobs } = useJobs({
  limit: 20,
  offset: 0,
  status: 'published',
})
```

### Mutation Migration

**Before (tRPC)**:
```typescript
const applyMutation = trpc.applications.create.useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries(['applications'])
    toast.success('Application submitted!')
  },
  onError: (error) => {
    toast.error(error.message)
  },
})

const handleApply = (jobId: string) => {
  applyMutation.mutate({ jobId, type: 'quick' })
}
```

**After (REST)**:
```typescript
const applyMutation = useCreateApplication({
  onSuccess: () => {
    queryClient.invalidateQueries(['applications'])
    toast.success('Application submitted!')
  },
  onError: (error) => {
    toast.error(error.message)
  },
})

const handleApply = (jobId: string) => {
  applyMutation.mutate({ jobId, type: 'quick' })
}
```

### Complex Example: Auth Flow

**Before (tRPC)**:
```typescript
// Request magic link
const requestMagicLink = trpc.auth.requestMagicLink.useMutation()

const handleSignIn = async (email: string) => {
  await requestMagicLink.mutateAsync({ email, type: 'login' })
}

// Verify magic link
const verifyMagicLink = trpc.auth.verifyMagicLink.useMutation()

const handleVerify = async (token: string) => {
  const { session } = await verifyMagicLink.mutateAsync({ token })
  await AsyncStorage.setItem('supabase.session', JSON.stringify(session))
  // Redirect to app
}
```

**After (REST)**:
```typescript
// Request magic link
const requestMagicLink = useRequestMagicLink()

const handleSignIn = async (email: string) => {
  await requestMagicLink.mutateAsync({ email, type: 'login' })
}

// Verify magic link
const verifyMagicLink = useVerifyMagicLink()

const handleVerify = async (token: string) => {
  const { session } = await verifyMagicLink.mutateAsync({ token })
  await AsyncStorage.setItem('supabase.session', JSON.stringify(session))
  // Redirect to app
}
```

---

## Step 6: Update Type Imports

### Before (tRPC)

```typescript
import type { RouterOutputs } from '@scf/supabase/client-types'

type Job = RouterOutputs['jobs']['list'][number]
type Application = RouterOutputs['applications']['create']
```

### After (REST SDK)

```typescript
import type { Job, Application } from '@scaffald/sdk'

// Types are auto-generated from OpenAPI spec
```

---

## Step 7: Testing

### Unit Tests

**Update mocks**:

**Before (tRPC)**:
```typescript
import { mockTrpc } from '~/test/mocks'

mockTrpc.profile.general.get.mockReturnValue({
  data: mockProfile,
  isLoading: false,
})
```

**After (REST with MSW)**:
```typescript
import { rest } from 'msw'
import { server } from '~/test/server'

server.use(
  rest.get('/v1/profile', (req, res, ctx) => {
    return res(ctx.json({ data: mockProfile }))
  })
)
```

### E2E Tests

**Test both paths**:
```typescript
describe('Profile Screen', () => {
  it('works with REST API', async () => {
    // Enable REST flag
    await setFeatureFlag('profile', true)

    render(<ProfileScreen />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeVisible()
    })
  })

  it('works with tRPC API', async () => {
    // Disable REST flag (use tRPC)
    await setFeatureFlag('profile', false)

    render(<ProfileScreen />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeVisible()
    })
  })
})
```

---

## Step 8: Gradual Rollout

### Phase 1: Internal Testing (0%)
```typescript
FEATURE_FLAGS.USE_REST_API.auth = false // All users on tRPC
```

### Phase 2: Canary (5%)
```typescript
// Enable for 5% of users via remote config
if (userId % 20 === 0) {
  FEATURE_FLAGS.USE_REST_API.auth = true
}
```

### Phase 3: Gradual Increase
```typescript
// Week 1: 5%
// Week 2: 25%
// Week 3: 50%
// Week 4: 100%
```

### Monitoring During Rollout

**Track these metrics**:
- Error rates (REST vs tRPC)
- Latency (p50, p95, p99)
- Crash reports
- User engagement
- Conversion rates

**Rollback triggers**:
- Error rate >1% higher than tRPC
- p95 latency >50ms higher than tRPC
- Crash rate increase >10%
- User complaints

---

## Common Migration Patterns

### Pattern 1: Paginated Lists

**tRPC**:
```typescript
const { data, fetchNextPage, hasNextPage } = trpc.jobs.list.useInfiniteQuery({
  limit: 20,
}, {
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

**REST**:
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteJobs({
  limit: 20,
}, {
  getNextPageParam: (lastPage) => lastPage.pagination?.offset + 20,
})
```

### Pattern 2: Optimistic Updates

**tRPC**:
```typescript
const utils = trpc.useContext()

const mutation = trpc.applications.update.useMutation({
  onMutate: async (newData) => {
    await utils.applications.get.cancel()
    const previous = utils.applications.get.getData()
    utils.applications.get.setData(undefined, (old) => ({ ...old, ...newData }))
    return { previous }
  },
  onError: (err, newData, context) => {
    utils.applications.get.setData(undefined, context.previous)
  },
})
```

**REST**:
```typescript
const queryClient = useQueryClient()

const mutation = useUpdateApplication({
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['applications', newData.id])
    const previous = queryClient.getQueryData(['applications', newData.id])
    queryClient.setQueryData(['applications', newData.id], (old) => ({ ...old, ...newData }))
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['applications', newData.id], context.previous)
  },
})
```

### Pattern 3: Dependent Queries

**tRPC**:
```typescript
const { data: user } = trpc.auth.getSession.useQuery()
const { data: profile } = trpc.profile.get.useQuery(
  undefined,
  { enabled: !!user }
)
```

**REST**:
```typescript
const { data: user } = useSession()
const { data: profile } = useProfile({ enabled: !!user })
```

---

## Troubleshooting

### Issue 1: Type Mismatches

**Problem**: REST response shape different from tRPC

**Solution**: Use type adapters
```typescript
function adaptJobResponse(restJob: RESTJob): TRPCJob {
  return {
    ...restJob,
    // Transform fields if needed
    postedAt: new Date(restJob.posted_at),
  }
}
```

### Issue 2: Missing Features

**Problem**: REST endpoint doesn't support feature from tRPC

**Solution**: File issue, use tRPC temporarily
```typescript
const useREST = useFeatureFlag('jobs') && hasFeature('jobFilters')
```

### Issue 3: Performance Regression

**Problem**: REST is slower than tRPC

**Solution**: Check for N+1 queries, add indexes, optimize endpoint

---

## Checklist Per Module

- [ ] Install @scaffald/sdk
- [ ] Set up feature flags
- [ ] Create hybrid API client
- [ ] Migrate all React hooks
- [ ] Update type imports
- [ ] Update unit tests
- [ ] Run E2E tests
- [ ] Enable canary rollout (5%)
- [ ] Monitor metrics for 48 hours
- [ ] Gradual increase to 100%
- [ ] Remove tRPC code (after 2 weeks stable)

---

## Support & Resources

- **Migration Plan**: `/Users/clay/.claude/plans/transient-drifting-lollipop.md`
- **SDK Documentation**: `packages/scaffald-sdk/README.md`
- **API Reference**: `packages/scaffald-sdk/docs/api/`
- **Slack Channel**: #api-migration (if exists)
- **Office Hours**: Weekly on Wednesdays (if scheduled)

---

**Document Owner**: Frontend Lead
**Review Cadence**: Weekly
**Last Reviewed**: 2025-12-31
