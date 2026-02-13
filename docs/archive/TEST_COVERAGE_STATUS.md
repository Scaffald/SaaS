# Test Coverage Status Report

**Generated**: 2026-02-12

## Summary

### SDK Tests (Client-Side)
- **Location**: `packages/scaffald-sdk/src/__tests__/`
- **Total**: 30 test files
- **Coverage**: ~95% of resources
- **Status**: ✅ **Excellent**

### API Route Tests (Server-Side)
- **Location**: `packages/supabase/functions/api/__tests__/routes/`
- **Total**: 7 test files
- **Coverage**: ~23% of routes (7/30)
- **Status**: ⚠️ **Needs Improvement**

---

## Detailed Test Coverage Matrix

| Resource | SDK Test | API Route Test | MSW Handlers | Status |
|----------|----------|----------------|--------------|--------|
| api-keys | ✅ | ✅ | ✅ | Complete |
| applications | ✅ | ✅ | ✅ | Complete |
| auth | ❌ | ✅ | ❌ | Partial |
| certifications | ✅ | ❌ | ✅ | SDK Only |
| connections | ✅ | ❌ | ✅ | SDK Only |
| education | ✅ | ❌ | ✅ | SDK Only |
| employers | ✅ | ❌ | ✅ | SDK Only |
| employment | ❌ | ❌ | ❌ | Missing |
| engagement | ✅ | ❌ | ✅ | SDK Only |
| experience | ✅ | ❌ | ✅ | SDK Only |
| follows | ✅ | ❌ | ✅ | SDK Only |
| industries | ✅ | ✅ | ✅ | Complete |
| inquiries | ✅ | ❌ | ✅ | SDK Only |
| jobs | ✅ | ✅ | ✅ | Complete |
| notifications | ✅ | ❌ | ✅ | SDK Only |
| oauth | ✅ | ✅ | ❌ | Partial |
| onet | ✅ | ❌ | ✅ | SDK Only |
| organizations | ✅ | ❌ | ✅ | SDK Only |
| portfolio | ✅ | ❌ | ✅ | SDK Only |
| prerequisites | ✅ | ❌ | ✅ | SDK Only |
| profile-completion | ✅ | ❌ | ✅ | SDK Only |
| profile-import | ✅ | ❌ | ✅ | SDK Only |
| profile-views | ✅ | ❌ | ✅ | SDK Only |
| profiles | ✅ | ✅ | ✅ | Complete |
| profile-widgets | ❌ | ❌ | ❌ | Missing |
| projects | ✅ | ❌ | ✅ | SDK Only |
| reviews | ✅ | ❌ | ✅ | SDK Only |
| skills | ✅ | ❌ | ✅ | SDK Only |
| teams | ✅ | ❌ | ✅ | SDK Only |
| user-profiles | ❌ | ❌ | ❌ | Missing |
| webhooks-management | ✅ | ❌ | ❌ | SDK Only |
| work-logs | ✅ | ❌ | ✅ | SDK Only |

---

## Test Coverage Statistics

### By Category

**Complete Coverage (SDK + API + MSW)**:
- api-keys
- applications
- industries
- jobs
- profiles
- **Total**: 5 / 30 (17%)

**SDK Tests Only**:
- certifications, connections, education, employers, engagement
- experience, follows, inquiries, notifications, onet
- organizations, portfolio, prerequisites, profile-completion
- profile-import, profile-views, projects, reviews, skills
- teams, work-logs
- **Total**: 21 / 30 (70%)

**Partial Coverage**:
- auth (API test only)
- oauth (SDK + API, missing MSW)
- **Total**: 2 / 30 (7%)

**No Coverage**:
- employment
- profile-widgets
- user-profiles
- **Total**: 3 / 30 (10%)

---

## MSW Handler Coverage

**Location**: `packages/scaffald-sdk/src/__tests__/mocks/`

### Files:
- `server.ts` - Main MSW server setup
- Individual handler files for each resource

### Coverage:
- ✅ Most resources have MSW handlers
- ❌ Missing for: auth, oauth, employment, profile-widgets, user-profiles

---

## Action Plan

### Phase 1: Critical Missing Tests (Priority: HIGH)

#### 1. Create API Route Tests
For routes that exist but lack tests:

```bash
# Create these test files:
packages/supabase/functions/api/__tests__/routes/prerequisites.test.ts
```

#### 2. Create MSW Handlers
For resources missing handlers:

```bash
packages/scaffald-sdk/src/__tests__/mocks/auth-handlers.ts
packages/scaffald-sdk/src/__tests__/mocks/oauth-handlers.ts
packages/scaffald-sdk/src/__tests__/mocks/employment-handlers.ts
packages/scaffald-sdk/src/__tests__/mocks/profile-widgets-handlers.ts
packages/scaffald-sdk/src/__tests__/mocks/user-profiles-handlers.ts
```

#### 3. Create Missing SDK Tests

```bash
packages/scaffald-sdk/src/__tests__/auth.test.ts
packages/scaffald-sdk/src/__tests__/employment.test.ts
packages/scaffald-sdk/src/__tests__/profile-widgets.test.ts
packages/scaffald-sdk/src/__tests__/user-profiles.test.ts
```

### Phase 2: Add API Route Tests (Priority: MEDIUM)

Once routes are migrated from tRPC, add tests for:
- teams
- connections
- follows
- engagement
- notifications
- skills
- experience
- education
- certifications
- organizations
- employers
- background-checks
- inquiries
- work-logs
- onet
- portfolio
- projects
- reviews
- profile-completion
- profile-import
- profile-views
- profile-widgets
- user-profiles
- webhooks-management

### Phase 3: Integration & E2E Tests (Priority: LOW)

- Create full-stack integration tests
- Add E2E tests for critical user flows
- Set up CI/CD test pipeline

---

## Test Template Examples

### SDK Test Template

```typescript
// packages/scaffald-sdk/src/__tests__/example.test.ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'
import { Scaffald } from '../index'

describe('Example Resource', () => {
  let client: Scaffald

  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  beforeEach(() => {
    client = new Scaffald({
      baseUrl: 'http://localhost:54321/functions/v1/api',
      apiKey: 'test-key',
    })
  })

  describe('list', () => {
    it('should list examples', async () => {
      const result = await client.examples.list()
      expect(result.data).toHaveLength(2)
    })
  })
})
```

### API Route Test Template

```typescript
// packages/supabase/functions/api/__tests__/routes/example.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import router from '../../routes/example'

describe('Example Routes', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    app.route('/v1/examples', router)
  })

  describe('GET /', () => {
    it('should list examples', async () => {
      const req = new Request('http://localhost/v1/examples')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data).toBeDefined()
    })
  })
})
```

### MSW Handler Template

```typescript
// packages/scaffald-sdk/src/__tests__/mocks/example-handlers.ts
import { http, HttpResponse } from 'msw'

const BASE_URL = 'http://localhost:54321/functions/v1/api'

export const exampleHandlers = [
  http.get(`${BASE_URL}/v1/examples`, () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Example 1' },
        { id: '2', name: 'Example 2' },
      ],
    })
  }),

  http.post(`${BASE_URL}/v1/examples`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      data: { id: '3', ...body },
    })
  }),
]
```

---

## Test Running Commands

### Run SDK Tests
```bash
cd packages/scaffald-sdk
pnpm test
```

### Run API Route Tests
```bash
cd packages/supabase/functions/api
bun test
```

### Run All Tests
```bash
# From project root
pnpm test:all
```

---

## Coverage Goals

### Short Term (1-2 weeks)
- [ ] 100% SDK test coverage (3 missing tests)
- [ ] 100% MSW handler coverage (5 missing handlers)
- [ ] All existing API routes have tests

### Medium Term (1 month)
- [ ] All migrated routes have API tests
- [ ] Integration tests for critical flows
- [ ] Automated test runs in CI/CD

### Long Term (2-3 months)
- [ ] 90%+ code coverage across all packages
- [ ] E2E test suite
- [ ] Performance benchmarks
- [ ] Load testing

---

## Next Immediate Actions

1. ✅ **DONE**: Created prerequisites API route
2. **TODO**: Create prerequisites API route test
3. **TODO**: Restart Supabase to apply config changes
4. **TODO**: Verify prerequisites endpoints work
5. **TODO**: Create missing SDK tests (auth, employment, profile-widgets, user-profiles)
6. **TODO**: Create missing MSW handlers
7. **TODO**: Pick next route to migrate (recommend: teams)

