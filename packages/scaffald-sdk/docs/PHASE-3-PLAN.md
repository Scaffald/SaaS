# Phase 3: P1 Router Migration Plan

**Timeline**: Weeks 3-4 (2 weeks)
**Goal**: Migrate 6 priority routers (~50 endpoints) from tRPC to REST
**Status**: Ready to begin

---

## 📋 Routers to Migrate (P1 Priority)

### 1. auth.router.ts (~5 endpoints)
**Complexity**: Low
**Lines**: 137
**Priority**: Critical - User authentication

**Endpoints to Create**:
- `POST /v1/auth/signup` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/logout` - User logout
- `POST /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/session` - Get current session

**Key Features**:
- Email/password authentication
- JWT token management
- Session validation
- Password reset flow

---

### 2. user-profile.router.ts (~6 endpoints)
**Complexity**: Low
**Lines**: 449
**Priority**: High - Core user data

**Endpoints to Create**:
- `GET /v1/user/profile` - Get current user profile
- `PATCH /v1/user/profile` - Update profile
- `POST /v1/user/avatar` - Upload avatar
- `DELETE /v1/user/avatar` - Remove avatar
- `GET /v1/user/settings` - Get user settings
- `PATCH /v1/user/settings` - Update settings

**Key Features**:
- User profile management
- Avatar upload/storage
- Privacy settings
- Notification preferences

---

### 3. profile/employment.router.ts (~8 endpoints)
**Complexity**: Medium
**Lines**: 145
**Priority**: High - Job seeker profiles

**Endpoints to Create**:
- `GET /v1/user/employment` - List employment history
- `POST /v1/user/employment` - Add employment
- `GET /v1/user/employment/:id` - Get specific employment
- `PATCH /v1/user/employment/:id` - Update employment
- `DELETE /v1/user/employment/:id` - Remove employment
- `POST /v1/user/employment/:id/verify` - Request verification
- `GET /v1/user/employment/current` - Get current position
- `PATCH /v1/user/employment/:id/end-date` - Set end date

**Key Features**:
- Work history management
- Employment verification
- Current position tracking
- Date validation

---

### 4. profile/skills.router.ts (~12 endpoints) ⚠️
**Complexity**: High
**Lines**: 959
**Priority**: High - Core profile feature

**Endpoints to Create**:
- `GET /v1/user/skills` - List user skills
- `POST /v1/user/skills` - Add skill
- `DELETE /v1/user/skills/:id` - Remove skill
- `PATCH /v1/user/skills/:id` - Update skill
- `GET /v1/skills/search` - Search available skills
- `GET /v1/skills/suggestions` - Get skill suggestions
- `POST /v1/user/skills/import` - Import from LinkedIn
- `GET /v1/skills/categories` - List skill categories
- `POST /v1/user/skills/bulk` - Bulk add skills
- `GET /v1/user/skills/analytics` - Skill gap analysis
- `POST /v1/user/skills/:id/endorse` - Endorse skill
- `GET /v1/user/skills/endorsements` - List endorsements

**Key Features**:
- Multi-taxonomy support (O*NET, LinkedIn, custom)
- Skill proficiency levels
- Endorsements system
- Skill gap analysis
- LinkedIn import integration

**⚠️ Note**: Most complex router in P1 - allocate extra time

---

### 5. profile/education.router.ts (~8 endpoints)
**Complexity**: Medium
**Lines**: 455
**Priority**: High - Job seeker profiles

**Endpoints to Create**:
- `GET /v1/user/education` - List education history
- `POST /v1/user/education` - Add education
- `GET /v1/user/education/:id` - Get specific education
- `PATCH /v1/user/education/:id` - Update education
- `DELETE /v1/user/education/:id` - Remove education
- `POST /v1/user/education/:id/verify` - Request verification
- `GET /v1/schools/search` - Search schools
- `GET /v1/degrees` - List degree types

**Key Features**:
- Education history management
- School search/autocomplete
- Degree verification
- GPA tracking
- Graduation date validation

---

### 6. notifications.router.ts (~8 endpoints)
**Complexity**: Medium
**Lines**: 470
**Priority**: High - User engagement

**Endpoints to Create**:
- `GET /v1/notifications` - List notifications (paginated)
- `GET /v1/notifications/:id` - Get specific notification
- `POST /v1/notifications/:id/read` - Mark as read
- `POST /v1/notifications/read-all` - Mark all as read
- `DELETE /v1/notifications/:id` - Delete notification
- `GET /v1/notifications/unread-count` - Get unread count
- `GET /v1/notifications/preferences` - Get notification preferences
- `PATCH /v1/notifications/preferences` - Update preferences

**Key Features**:
- Real-time notification system
- Read/unread tracking
- Notification preferences
- Push notification integration
- Email notification settings

---

## 🛠️ Implementation Process (Per Router)

For each router, follow this systematic process:

### Step 1: Research & Design (30 min)
```bash
# Read the tRPC router
cat packages/supabase/functions/trpc/routers/[router-name].ts

# Analyze endpoints, inputs, outputs
# Design REST endpoint structure
# Map validation schemas
```

**Deliverables**:
- Endpoint design document
- Request/response schemas
- Migration notes

---

### Step 2: Implement REST Routes (2-3 hours)
```bash
# Create route file
touch packages/supabase/functions/api/routes/[route-name].ts
```

**Implementation Checklist**:
- ✅ Create Hono app
- ✅ Define Zod validation schemas
- ✅ Implement endpoints with proper HTTP methods
- ✅ Add authentication middleware
- ✅ Add authorization checks
- ✅ Error handling
- ✅ OpenAPI annotations
- ✅ Export route

**Example Structure**:
```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.ts'

const app = new Hono()

// Schemas
const createSchema = z.object({
  field: z.string().min(1),
})

// Endpoints
app.post('/', requireAuth, zValidator('json', createSchema), async (c) => {
  const input = c.req.valid('json')
  const user = c.get('user')
  const supabase = c.get('supabase')

  // Implementation

  return c.json({ data: result }, 201)
})

export default app
```

---

### Step 3: Register Routes (5 min)
```typescript
// packages/supabase/functions/api/index.ts
import newRouter from './routes/new-route.ts'

app.route('/v1/new-route', newRouter)
```

---

### Step 4: Write Tests (2-4 hours)
```bash
# Create test file
touch packages/supabase/functions/api/__tests__/routes/[route-name].test.ts
```

**Test Coverage Requirements**:
- ✅ Happy path for each endpoint
- ✅ Authentication/authorization tests
- ✅ Input validation tests
- ✅ Error scenarios (404, 400, 403, 500)
- ✅ Edge cases
- ✅ Permissions enforcement
- ✅ Data integrity checks

**Target**: 100% code coverage (enforced by CI)

---

### Step 5: Update Scaffald SDK (1-2 hours)
```bash
# Create SDK resource
touch packages/scaffald-sdk/src/resources/[resource-name].ts
```

**SDK Implementation**:
```typescript
export class ResourceName {
  constructor(private client: ScaffaldClient) {}

  async list(params?: ListParams) {
    return this.client.get('/v1/resource', { params })
  }

  async create(data: CreateInput) {
    return this.client.post('/v1/resource', data)
  }

  // ... other methods
}
```

**Update Client**:
```typescript
// packages/scaffald-sdk/src/client.ts
export class ScaffaldClient {
  readonly resourceName: ResourceName

  constructor(config: Config) {
    this.resourceName = new ResourceName(this)
  }
}
```

---

### Step 6: Create React Hooks (1 hour)
```typescript
// packages/scaffald-sdk/src/react/hooks.ts
export function useResourceList(params?: ListParams) {
  return useQuery({
    queryKey: ['resource', 'list', params],
    queryFn: () => client.resourceName.list(params),
  })
}

export function useResourceCreate() {
  return useMutation({
    mutationFn: (data: CreateInput) => client.resourceName.create(data),
  })
}
```

---

### Step 7: Write SDK Tests (1 hour)
```bash
# Create SDK test
touch packages/scaffald-sdk/src/__tests__/[resource-name].test.ts
```

Use MSW (Mock Service Worker) for API mocking.

---

### Step 8: Generate Types (15 min)
```bash
# Update type generation script
pnpm run generate:types

# Verify types
cat packages/scaffald-sdk/src/types/generated.d.ts
```

---

### Step 9: Document API (30 min)
```bash
# Create API documentation
touch packages/scaffald-sdk/docs/api/[resource-name].md
```

**Documentation Structure**:
- Overview
- Authentication requirements
- Endpoints list
- Request/response examples
- Error codes
- Migration notes from tRPC

---

## 📅 Suggested Timeline

### Week 1 (Routers 1-3)

**Day 1-2: auth.router.ts**
- Low complexity, critical foundation
- 5 endpoints × 1.5 hours = ~8 hours
- Plus SDK work = 1 day

**Day 3-4: user-profile.router.ts**
- Low-medium complexity
- 6 endpoints × 2 hours = ~12 hours
- Plus SDK work = 1.5 days

**Day 5: profile/employment.router.ts**
- Medium complexity
- Start implementation
- 4 endpoints completed

### Week 2 (Routers 4-6)

**Day 1-2: profile/employment.router.ts (finish)**
- Complete remaining 4 endpoints
- Finish SDK + tests

**Day 3-5: profile/skills.router.ts ⚠️**
- High complexity - allocate 2.5 days
- 12 endpoints with complex logic
- Multi-taxonomy support
- LinkedIn integration

**Weekend: Buffer**

**Day 6-7: profile/education.router.ts**
- Medium complexity
- 8 endpoints
- School search integration

**Day 8-9: notifications.router.ts**
- Medium complexity
- 8 endpoints
- Real-time integration

**Day 10: Buffer & Review**
- Final testing
- Documentation review
- Performance validation

---

## ✅ Definition of Done (Per Router)

Before marking a router as "migrated":

- ✅ All REST endpoints implemented
- ✅ 100% test coverage
- ✅ All tests passing
- ✅ SDK resource created
- ✅ React hooks implemented
- ✅ SDK tests passing
- ✅ Types generated
- ✅ API documentation complete
- ✅ OpenAPI spec updated
- ✅ No TypeScript errors
- ✅ Linting passes
- ✅ Performance benchmarks acceptable

---

## 🚨 Risk Mitigation

### High-Risk Items

1. **profile/skills.router.ts complexity**
   - **Risk**: Most complex router, could take longer
   - **Mitigation**: Allocate 2.5 days, break into sub-tasks, get help if needed

2. **Database schema changes**
   - **Risk**: tRPC implementation may rely on specific schema
   - **Mitigation**: Verify schema compatibility first, create migrations if needed

3. **LinkedIn integration**
   - **Risk**: OAuth flow complexity
   - **Mitigation**: Test thoroughly in integration tests

### Medium-Risk Items

1. **Notification real-time updates**
   - **Risk**: WebSocket/SSE integration
   - **Mitigation**: Start with polling, add real-time later

2. **File uploads (avatar)**
   - **Risk**: Storage integration complexity
   - **Mitigation**: Use existing Supabase storage patterns

---

## 📊 Success Metrics

**Code Quality**:
- ✅ 100% test coverage maintained
- ✅ Zero TypeScript errors
- ✅ All linting rules pass
- ✅ OpenAPI spec 100% accurate

**Performance**:
- ✅ P95 latency < 200ms
- ✅ P99 latency < 500ms
- ✅ Zero N+1 queries
- ✅ Proper database indexing

**Documentation**:
- ✅ All endpoints documented
- ✅ Migration notes complete
- ✅ SDK examples provided
- ✅ Troubleshooting guides

---

## 🎯 Next Steps

1. **Immediate**: Start with `auth.router.ts`
   - Simplest router
   - Critical foundation
   - Quick win to build momentum

2. **Blockers to resolve**:
   - ✅ Docker Desktop (for running tests)
   - ✅ Verify database schema compatibility

3. **Preparation**:
   - Review tRPC routers
   - Set up development environment
   - Create working branch: `feat/p1-router-migration`

---

**Ready to begin?** Start with `auth.router.ts` → simple, critical, fast to implement!
