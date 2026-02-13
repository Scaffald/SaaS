# SDK vs tRPC Decision Framework

**Last Updated:** February 2026
**Purpose:** Guide developers in choosing between Scaffald SDK and tRPC for new features

## Quick Reference

| Factor | Use SDK | Use tRPC |
|--------|---------|----------|
| **Audience** | External developers, API consumers | Internal admin, team members |
| **Access** | Public API, API keys | Internal only |
| **Data** | User profiles, jobs, applications | Admin dashboards, analytics |
| **Complexity** | Simple CRUD, standard patterns | Complex workflows, state machines |
| **File Ops** | No file handling | File uploads, S3, streaming |
| **Compliance** | No regulatory requirements | CCPA, legal, audit trails |
| **Integration** | Standalone operations | Third-party APIs (Stripe, Persona) |
| **Versioning** | API versioning required | Rapid iteration, internal only |

---

## Decision Tree

### Start Here

```
Is this feature user-facing?
│
├─ NO → Is it admin/office tooling?
│  │
│  ├─ YES → Use tRPC ✋
│  │        (Admin operations stay in tRPC)
│  │
│  └─ NO → Does it involve compliance/legal?
│     │
│     ├─ YES → Use tRPC ✋
│     │        (CCPA, account deletion, legal)
│     │
│     └─ NO → Does it involve file operations?
│        │
│        ├─ YES → Use tRPC ✋
│        │        (S3, streaming, resume parsing)
│        │
│        └─ NO → Does it integrate with third-party APIs?
│           │
│           ├─ YES → Use tRPC ✋
│           │        (Stripe, Persona, OAuth provider)
│           │
│           └─ NO → Use tRPC ✋
│                    (Infrastructure, utilities)
│
└─ YES → Should external developers access this via API?
   │
   ├─ YES → Is it simple CRUD or standard REST patterns?
   │  │
   │  ├─ YES → Use SDK ✅
   │  │        (Jobs, profiles, applications)
   │  │
   │  └─ NO → Is it a complex workflow?
   │     │
   │     ├─ YES → Evaluate case-by-case
   │     │        (May need custom SDK resource)
   │     │
   │     └─ NO → Use SDK ✅
   │
   └─ NO → Is it read-only public data?
      │
      ├─ YES → Use SDK ✅
      │        (Public profiles, job listings)
      │
      └─ NO → Use tRPC ✋
               (User-specific, private data)
```

---

## Criteria Breakdown

### ✅ Use SDK When...

#### 1. Public-Facing User Operations
**Examples:**
- Job search and filtering
- Application submission
- Profile viewing (public)
- Connection requests
- Work log creation

**Why SDK:**
- External developers need access
- API key authentication
- Standard REST patterns
- Portable, versioned API

**Pattern:**
```typescript
// SDK Resource
export class Jobs extends Resource {
  async list(params: JobListParams): Promise<JobListResponse> {
    return this.http.get('/api/v1/jobs', { params })
  }

  async get(id: string): Promise<Job> {
    return this.http.get(`/api/v1/jobs/${id}`)
  }
}

// React Hook
export function useJobs(params: JobListParams) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'jobs', 'list', params],
    queryFn: () => client.jobs.list(params),
    staleTime: 5 * 60 * 1000,
  })
}
```

---

#### 2. User Data CRUD Operations
**Examples:**
- Profile updates
- Skill management
- Education/experience entries
- Certifications
- Portfolio items

**Why SDK:**
- Core user flows
- High traffic
- Should be accessible via API
- Simple request/response

**Pattern:**
```typescript
// SDK Resource
export class Profiles extends Resource {
  async update(id: string, data: ProfileUpdateParams): Promise<Profile> {
    return this.http.patch(`/api/v1/profiles/${id}`, data)
  }
}

// React Hook
export function useUpdateProfileMutation(
  options?: UseMutationOptions<Profile, Error, ProfileUpdateParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: (data) => client.profiles.update(userId, data),
    ...options,
  })
}
```

---

#### 3. Read-Only Public Data
**Examples:**
- Public user profiles
- Organization listings
- Job postings
- Public reviews

**Why SDK:**
- Should be accessible without authentication
- Cacheable
- High read volume
- Standard REST patterns

**Pattern:**
```typescript
// SDK Resource
export class UserProfiles extends Resource {
  async getByVanityUrl(vanityUrl: string): Promise<UserProfile> {
    return this.http.get(`/api/v1/user-profiles/${vanityUrl}`)
  }
}

// React Hook
export function useUserProfile(vanityUrl: string) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'user-profiles', vanityUrl],
    queryFn: () => client.userProfiles.getByVanityUrl(vanityUrl),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })
}
```

---

#### 4. Social/Engagement Features
**Examples:**
- Connections (send, accept, decline)
- Follows (follow user, unfollow)
- Profile views tracking
- Engagement analytics

**Why SDK:**
- User-facing social features
- Should be accessible via API
- High traffic
- Simple state changes

**Pattern:**
```typescript
// SDK Resource
export class Connections extends Resource {
  async send(params: SendConnectionParams): Promise<Connection> {
    return this.http.post('/api/v1/connections', params)
  }

  async accept(id: string): Promise<Connection> {
    return this.http.patch(`/api/v1/connections/${id}/accept`)
  }
}

// React Hook
export function useSendConnectionMutation(
  options?: UseMutationOptions<Connection, Error, SendConnectionParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: (params) => client.connections.send(params),
    ...options,
  })
}
```

---

### ❌ Use tRPC When...

#### 1. Admin/Office Operations
**Examples:**
- CMS content management
- User administration
- Office analytics dashboards
- Team management (admin view)
- Organization analytics

**Why tRPC:**
- Internal tooling only
- Complex permissions (role-based)
- Rapid development without API versioning
- Not exposed via API keys
- Multiple aggregations

**Pattern:**
```typescript
// tRPC Router
export const officeRouter = router({
  cms: {
    listSlides: protectedProcedure
      .input(z.object({ status: z.enum(['draft', 'published']) }))
      .query(async ({ ctx, input }) => {
        // Complex permission checks
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' })
        }

        // Multiple joins, aggregations
        return ctx.db.query.slides.findMany({
          where: eq(slides.status, input.status),
          with: {
            author: true,
            comments: true,
            analytics: true,
          },
        })
      }),
  },
})

// Component
const { data } = api.office.cms.listSlides.useQuery({ status: 'draft' })
```

---

#### 2. Compliance & Legal Operations
**Examples:**
- CCPA data requests (access, deletion, opt-out)
- Account deletion workflows
- Legal agreement acceptance
- Audit trail generation
- Compliance reporting

**Why tRPC:**
- Legal compliance workflows
- Complex multi-step processes
- Audit trail requirements
- State machine patterns
- Irreversible operations

**Pattern:**
```typescript
// tRPC Router
export const ccpaRouter = router({
  createRequest: protectedProcedure
    .input(z.object({
      type: z.enum(['access', 'deletion', 'optOut']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create audit trail
      const auditLog = await ctx.db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: `ccpa_request_${input.type}`,
        timestamp: new Date(),
        ipAddress: ctx.ip,
      })

      // Initiate complex workflow
      const request = await ctx.db.insert(ccpaRequests).values({
        userId: ctx.user.id,
        type: input.type,
        status: 'pending',
        auditLogId: auditLog.id,
      })

      // Trigger background jobs
      await ctx.queue.add('process-ccpa-request', { requestId: request.id })

      return request
    }),
})

// Component
const mutation = api.ccpa.createRequest.useMutation()
```

---

#### 3. File Operations
**Examples:**
- Resume PDF parsing
- Document uploads to S3
- File metadata management
- Storage quota tracking
- Image processing

**Why tRPC:**
- Streaming file uploads
- S3 presigned URL generation
- Complex file operations
- OCR, AI parsing
- Long-running operations

**Pattern:**
```typescript
// tRPC Router
export const documentsRouter = router({
  getUploadUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      size: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check storage quota
      const usage = await getStorageUsage(ctx.user.id)
      if (usage + input.size > MAX_STORAGE) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Storage quota exceeded' })
      }

      // Generate S3 presigned URL
      const uploadUrl = await s3.getSignedUrl('putObject', {
        Bucket: BUCKET,
        Key: `users/${ctx.user.id}/${input.filename}`,
        ContentType: input.contentType,
        Expires: 300, // 5 minutes
      })

      return { uploadUrl, expiresAt: new Date(Date.now() + 300000) }
    }),
})

// Component
const mutation = api.documents.getUploadUrl.useMutation()
```

---

#### 4. Third-Party Integrations
**Examples:**
- OAuth 2.0 provider implementation
- Stripe payment processing
- Persona identity verification
- Mapbox geocoding
- Email service integrations

**Why tRPC:**
- External API integration complexity
- OAuth state management
- Webhook handling
- Vendor-specific logic
- Security-sensitive operations

**Pattern:**
```typescript
// tRPC Router
export const oauthRouter = router({
  authorize: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      redirectUri: z.string(),
      scope: z.array(z.string()),
      state: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate OAuth client
      const client = await ctx.db.query.oauthClients.findFirst({
        where: eq(oauthClients.clientId, input.clientId),
      })

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid client' })
      }

      // Validate redirect URI
      if (!client.redirectUris.includes(input.redirectUri)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid redirect URI' })
      }

      // Generate authorization code
      const code = await generateAuthCode({
        userId: ctx.user.id,
        clientId: input.clientId,
        scope: input.scope,
        expiresAt: new Date(Date.now() + 600000), // 10 minutes
      })

      return {
        redirectUrl: `${input.redirectUri}?code=${code}&state=${input.state}`,
      }
    }),
})

// Component
const mutation = api.oauth.authorize.useMutation()
```

---

#### 5. Complex Workflows & State Machines
**Examples:**
- Background check review (admin)
- Dispute resolution workflows
- Multi-step wizards with server validation
- Approval workflows
- Payment reconciliation

**Why tRPC:**
- Complex state transitions
- Server-side validation at each step
- Transaction management
- Rollback capabilities

**Pattern:**
```typescript
// tRPC Router
export const backgroundChecksRouter = router({
  reviewCheck: protectedProcedure
    .input(z.object({
      checkId: z.string(),
      decision: z.enum(['approve', 'reject', 'request_more_info']),
      notes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Complex permission check
      const check = await ctx.db.query.backgroundChecks.findFirst({
        where: eq(backgroundChecks.id, input.checkId),
      })

      if (!canReviewCheck(ctx.user, check)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      // State machine transition
      return await ctx.db.transaction(async (tx) => {
        // Update check status
        const updated = await tx.update(backgroundChecks)
          .set({
            status: input.decision === 'approve' ? 'approved' : 'under_review',
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(eq(backgroundChecks.id, input.checkId))

        // Create audit log
        await tx.insert(checkAuditLogs).values({
          checkId: input.checkId,
          action: input.decision,
          performedBy: ctx.user.id,
          notes: input.notes,
        })

        // Notify user
        await sendNotification({
          userId: check.userId,
          type: 'background_check_reviewed',
          data: { checkId: input.checkId, decision: input.decision },
        })

        return updated
      })
    }),
})

// Component (Admin)
const mutation = api.backgroundChecks.reviewCheck.useMutation()
```

---

## Migration Patterns

### From tRPC to SDK

When migrating an existing tRPC operation to SDK:

#### Step 1: Create SDK Resource

```typescript
// packages/scaffald-sdk/src/resources/my-feature.ts
import { Resource } from './base.js'

export interface MyFeature {
  id: string
  name: string
  // ... other fields
}

export class MyFeatures extends Resource {
  async list(params?: MyFeatureListParams): Promise<MyFeatureListResponse> {
    return this.http.get('/api/v1/my-features', { params })
  }

  async get(id: string): Promise<MyFeature> {
    return this.http.get(`/api/v1/my-features/${id}`)
  }

  async create(data: CreateMyFeatureParams): Promise<MyFeature> {
    return this.http.post('/api/v1/my-features', data)
  }
}
```

#### Step 2: Create React Hooks

```typescript
// packages/scf-core/utils/my-feature-sdk-hooks.ts
import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { MyFeature, CreateMyFeatureParams } from '@scaffald/sdk/resources/my-features'

export function useMyFeatures(params?: MyFeatureListParams) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['scaffald', 'my-features', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.myFeatures.list(params)
    },
    enabled: !!client,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMyFeatureMutation(
  options?: UseMutationOptions<MyFeature, Error, CreateMyFeatureParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (data: CreateMyFeatureParams) => {
      if (!client) throw new Error('Missing client')
      return client.myFeatures.create(data)
    },
    ...options,
  })
}
```

#### Step 3: Update Components

```typescript
// BEFORE (tRPC)
import { api } from '@scf/core/utils/api'

function MyComponent() {
  const { data, isLoading } = api.myFeature.list.useQuery()
  const mutation = api.myFeature.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['myFeature', 'list']] })
    }
  })

  return (
    <div>
      {data?.map(item => <div key={item.id}>{item.name}</div>)}
      <button onClick={() => mutation.mutate({ name: 'New Item' })}>
        Create
      </button>
    </div>
  )
}

// AFTER (SDK)
import { useMyFeatures, useCreateMyFeatureMutation } from '@scf/core/utils/my-feature-sdk-hooks'

function MyComponent() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useMyFeatures()
  const mutation = useCreateMyFeatureMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'my-features', 'list'] })
    }
  })

  return (
    <div>
      {data?.data?.map(item => <div key={item.id}>{item.name}</div>)}
      <button onClick={() => mutation.mutate({ name: 'New Item' })}>
        Create
      </button>
    </div>
  )
}
```

---

## Common Pitfalls

### ❌ Don't Use SDK For...

**1. Admin-Only Operations**
```typescript
// ❌ WRONG: Admin operations in SDK
export class Users extends Resource {
  async deleteUser(id: string) { /* Admin only */ }
  async banUser(id: string) { /* Admin only */ }
}

// ✅ CORRECT: Keep admin operations in tRPC
export const adminRouter = router({
  users: {
    delete: adminProcedure.mutation(/* ... */),
    ban: adminProcedure.mutation(/* ... */),
  }
})
```

**2. Complex State Machines**
```typescript
// ❌ WRONG: Multi-step workflow in SDK
export class Workflows extends Resource {
  async step1(data) { /* ... */ }
  async step2(data) { /* ... */ }
  async step3(data) { /* ... */ }
}

// ✅ CORRECT: Complex workflows in tRPC
export const workflowRouter = router({
  executeWorkflow: protectedProcedure.mutation(async ({ ctx, input }) => {
    return await ctx.db.transaction(async (tx) => {
      const step1Result = await executeStep1(tx, input)
      const step2Result = await executeStep2(tx, step1Result)
      const step3Result = await executeStep3(tx, step2Result)
      return step3Result
    })
  }),
})
```

**3. File Operations**
```typescript
// ❌ WRONG: File uploads in SDK
export class Documents extends Resource {
  async upload(file: File) { /* Streaming not supported */ }
}

// ✅ CORRECT: File operations in tRPC
export const documentsRouter = router({
  getUploadUrl: protectedProcedure.mutation(async ({ ctx }) => {
    return await s3.getSignedUrl(/* ... */)
  }),
})
```

---

### ❌ Don't Use tRPC For...

**1. Simple Public APIs**
```typescript
// ❌ WRONG: Public job listings in tRPC
export const jobsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.query.jobs.findMany()
  }),
})

// ✅ CORRECT: Public operations in SDK
export class Jobs extends Resource {
  async list(params?: JobListParams): Promise<JobListResponse> {
    return this.http.get('/api/v1/jobs', { params })
  }
}
```

**2. User-Facing CRUD**
```typescript
// ❌ WRONG: Profile updates in tRPC
export const profileRouter = router({
  update: protectedProcedure.mutation(async ({ ctx, input }) => {
    return await ctx.db.update(profiles).set(input)
  }),
})

// ✅ CORRECT: User CRUD in SDK
export class Profiles extends Resource {
  async update(id: string, data: ProfileUpdateParams): Promise<Profile> {
    return this.http.patch(`/api/v1/profiles/${id}`, data)
  }
}
```

---

## Checklist for New Features

### Before Creating New Feature

- [ ] Is this user-facing or admin-only?
- [ ] Should external developers access this via API?
- [ ] Does this involve file operations?
- [ ] Does this involve third-party integrations?
- [ ] Is this a compliance/legal operation?
- [ ] Is this a simple CRUD or complex workflow?

### If User-Facing → SDK Checklist

- [ ] Create SDK resource in `packages/scaffald-sdk/src/resources/`
- [ ] Define TypeScript interfaces for requests/responses
- [ ] Create React hooks in `packages/scf-core/utils/*-sdk-hooks.ts`
- [ ] Add unit tests in `packages/scaffald-sdk/src/__tests__/resources/`
- [ ] Update SDK client to include new resource
- [ ] Document in SDK README

### If Admin/Internal → tRPC Checklist

- [ ] Create tRPC router in `packages/supabase/functions/trpc/routers/`
- [ ] Implement permission checks (admin, role-based)
- [ ] Add to tRPC app router
- [ ] Document in `docs/TRPC_ARCHITECTURE.md`
- [ ] Use `api.[router].[method].useQuery/useMutation()` in components

---

## Examples by Category

### User-Facing Features → SDK

```typescript
✅ Jobs, Applications, Profiles
✅ Connections, Follows, Engagement
✅ Skills, Experience, Education
✅ Certifications, Portfolio, Projects
✅ Reviews, Profile Views
✅ Background Checks (user operations)
✅ Organizations (public operations)
✅ Teams (user operations)
✅ Work Logs
✅ Inquiries
```

### Admin/Internal → tRPC

```typescript
✅ Office CMS, User Admin, Analytics
✅ Payments (Stripe), Success Fees
✅ CCPA, Account Deletion, Legal Agreements
✅ Documents, Resume Parsing
✅ OAuth Provider, ID Verification
✅ Auth (Magic Links), Map (Geocoding)
✅ News, Feedback, CMS
✅ Background Checks (admin review)
✅ Organizations (admin analytics)
✅ Teams (admin dashboards)
```

---

## Validation

### Automated Checks

**Count SDK vs tRPC usage:**
```bash
# Count tRPC imports (should be ~100 files)
grep -r "from '@scf/core/utils/api'" packages/scf-core apps/scaffald --include="*.tsx" --include="*.ts" | wc -l

# Count SDK hook imports (should be majority)
grep -r "from '@scf/core/utils/.*-sdk-hooks'" packages/scf-core apps/scaffald --include="*.tsx" --include="*.ts" | wc -l
```

**Verify specific router:**
```bash
# Should be 0 if fully migrated, or only admin files if hybrid
grep -r "api\.myFeature\." packages/scf-core/features --include="*.tsx" --include="*.ts"
```

### Manual Review

**Questions to Ask:**
1. Can external developers reasonably want access to this?
2. Is this a core user flow or admin tooling?
3. Does this involve sensitive operations (payments, compliance)?
4. Is this a simple API or complex workflow?
5. What percentage of users will use this feature?

**If unsure → Default to SDK, discuss with team**

---

## Success Metrics

### Target Coverage (Achieved February 2026)

- **User-Facing Features:** 95-98% SDK ✅
- **Admin/Internal Features:** 10-20% SDK (by design) ✅
- **Overall Codebase:** 90-95% SDK ✅

### By Feature Category

| Category | SDK Coverage | Target |
|----------|--------------|--------|
| Jobs & Applications | 100% | 100% ✅ |
| Profiles & Skills | 100% | 100% ✅ |
| Social (Connections, Follows) | 100% | 100% ✅ |
| Background Checks (user) | 90% | 90% ✅ |
| Organizations (public) | 95% | 95% ✅ |
| Teams (user) | 100% | 100% ✅ |
| Office/Admin | 15% | 10-20% ✅ |
| Compliance | 0% | 0% ✅ (by design) |
| File Operations | 0% | 0% ✅ (by design) |

---

## Related Documentation

- [tRPC Architecture](./TRPC_ARCHITECTURE.md) - What stays in tRPC and why
- [Scaffald SDK README](../packages/scaffald-sdk/README.md) - SDK overview
- [Migration History](../.claude/projects/-Users-clay-Development-UNI-Construct/memory/MEMORY.md) - Past migrations

---

**Document Status:** Production
**Last Review:** February 2026
**Next Review:** May 2026 (quarterly)
