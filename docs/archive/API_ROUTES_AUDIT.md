# API Routes Audit - SDK vs Backend Coverage

**Generated**: 2026-02-12

## Summary

- **Total SDK Resources**: 30
- **Total API Routes**: 8
- **Coverage**: 27% (8/30)
- **Missing Routes**: 22

## Status Legend

- ✅ **Implemented** - Route exists and registered
- ⚠️ **Partial** - Route exists but not all endpoints
- ❌ **Missing** - No route file exists
- 🔄 **tRPC Only** - Still using old tRPC router

---

## Route Coverage Matrix

| Resource | Status | API Route | Notes |
|----------|--------|-----------|-------|
| api-keys | ✅ | `/v1/api-keys` | Implemented |
| applications | ✅ | `/v1/applications` | Implemented |
| auth | ✅ | `/v1/auth` | Implemented |
| industries | ✅ | `/v1/industries` | Implemented |
| jobs | ✅ | `/v1/jobs` | Implemented |
| oauth | ✅ | `/oauth` | Implemented |
| prerequisites | ✅ | `/v1/prerequisites` | Just created |
| profiles | ✅ | `/v1/profiles` | Implemented |
| **background-checks** | ❌ | `/v1/background-checks` | Missing - has tRPC router |
| **certifications** | ❌ | `/v1/certifications` | Missing |
| **connections** | ❌ | `/v1/connections` | Missing - has tRPC router |
| **education** | ❌ | `/v1/education` | Missing |
| **employers** | ❌ | `/v1/employers` | Missing - has tRPC router |
| **employment** | ❌ | `/v1/employment` | Missing |
| **engagement** | ❌ | `/v1/engagement` | Missing - has tRPC router |
| **experience** | ❌ | `/v1/experience` | Missing |
| **follows** | ❌ | `/v1/follows` | Missing - has tRPC router |
| **inquiries** | ❌ | `/v1/inquiries` | Missing - has tRPC router |
| **notifications** | ❌ | `/v1/notifications` | Missing - has tRPC router |
| **onet** | ❌ | `/v1/onet` | Missing - has tRPC router |
| **organizations** | ❌ | `/v1/organizations` | Missing - has tRPC router |
| **portfolio** | ❌ | `/v1/portfolio` | Missing - has tRPC router |
| **profile-completion** | ❌ | `/v1/profile-completion` | Missing |
| **profile-import** | ❌ | `/v1/profile-import` | Missing |
| **profile-views** | ❌ | `/v1/profile-views` | Missing - has tRPC router |
| **profile-widgets** | ❌ | `/v1/profile-widgets` | Missing |
| **projects** | ❌ | `/v1/projects` | Missing - has tRPC router |
| **reviews** | ❌ | `/v1/reviews` | Missing - has tRPC router |
| **skills** | ❌ | `/v1/skills` | Missing |
| **teams** | ❌ | `/v1/teams` | Missing - has tRPC router |
| **user-profiles** | ❌ | `/v1/user-profiles` | Missing - has tRPC router |
| **webhooks-management** | ❌ | `/v1/webhooks` | Missing - has tRPC router |
| **work-logs** | ❌ | `/v1/work-logs` | Missing - has tRPC router |

---

## Priority 1: Critical User Flows

These routes are needed for core app functionality:

1. **teams** - Organization/team management
2. **connections** - User networking
3. **follows** - User engagement
4. **engagement** - Engagement tracking
5. **notifications** - User notifications
6. **skills** - Profile skills
7. **experience** - Work experience
8. **employment** - Employment history
9. **education** - Education history
10. **certifications** - Certifications

---

## Priority 2: Profile Features

These routes enhance profile functionality:

1. **profile-completion** - Profile completion tracking
2. **profile-views** - Profile view analytics
3. **profile-widgets** - Profile customization
4. **profile-import** - LinkedIn/resume import
5. **user-profiles** - User profile management

---

## Priority 3: Business Features

These routes support business operations:

1. **organizations** - Organization management
2. **employers** - Employer profiles
3. **background-checks** - Background verification
4. **inquiries** - User inquiries
5. **work-logs** - Time tracking

---

## Priority 4: Additional Features

These routes provide supplementary functionality:

1. **onet** - O*NET occupation data
2. **portfolio** - Portfolio/work samples
3. **projects** - Project showcase
4. **reviews** - User reviews
5. **webhooks-management** - Webhook configuration

---

## Test Coverage Status

### SDK Tests
- Location: `packages/scaffald-sdk/src/__tests__/`
- Current: ~15 resource test files
- Need: Tests for all 30 resources

### API Route Tests
- Location: `packages/supabase/functions/api/__tests__/routes/`
- Current: ~8 route test files
- Need: Tests for all routes

### Test Coverage Goals
- [ ] Unit tests for all SDK resources
- [ ] Integration tests for all API routes
- [ ] E2E tests for critical flows
- [ ] MSW handlers for all endpoints

---

## Migration Checklist Template

For each missing route:

### 1. Create API Route
- [ ] Create `packages/supabase/functions/api/routes/{resource}.ts`
- [ ] Define OpenAPI schemas
- [ ] Implement all endpoints from SDK resource
- [ ] Add error handling
- [ ] Add request validation

### 2. Register Route
- [ ] Import in `packages/supabase/functions/api/index.ts`
- [ ] Add to routes section
- [ ] Verify CORS configuration

### 3. Create React Hooks
- [ ] Create `packages/scf-core/utils/{resource}-sdk-hooks.ts`
- [ ] Implement query hooks with useQuery
- [ ] Implement mutation hooks with useMutation + UseMutationOptions
- [ ] Add proper TypeScript types

### 4. Update Components
- [ ] Find all tRPC usage: `grep -r "api.{resource}." apps/`
- [ ] Replace with SDK hooks
- [ ] Update cache invalidation
- [ ] Fix data access patterns

### 5. Testing
- [ ] Create SDK unit tests
- [ ] Create MSW handlers
- [ ] Create API route tests
- [ ] Run E2E tests
- [ ] Verify no tRPC imports remain

### 6. Cleanup
- [ ] Remove tRPC router file
- [ ] Update documentation
- [ ] Commit changes

---

## Recommended Approach

1. **Phase 1: Critical Routes** (1-2 weeks)
   - Migrate teams, connections, follows, engagement, notifications
   - These are essential for app functionality

2. **Phase 2: Profile Routes** (1 week)
   - Migrate skills, experience, employment, education, certifications
   - Profile-related routes

3. **Phase 3: Business Routes** (1 week)
   - Migrate organizations, employers, background-checks
   - Business operation routes

4. **Phase 4: Additional Routes** (1 week)
   - Migrate remaining routes
   - Lower priority features

---

## Known Issues

1. **CORS Configuration**
   - Current: `origin: "*"` in api/index.ts
   - TODO: Configure proper allowed origins

2. **Auth Middleware**
   - Current: Global auth middleware on all routes
   - Some routes may need public access

3. **Rate Limiting**
   - Current: Applied globally
   - May need route-specific limits

4. **Error Handling**
   - Need consistent error format across all routes
   - Consider custom error middleware

---

## Next Steps

1. ✅ Fix prerequisites route (DONE)
2. Restart Supabase to apply config changes
3. Choose next priority route to migrate
4. Follow migration checklist
5. Repeat until 100% coverage

