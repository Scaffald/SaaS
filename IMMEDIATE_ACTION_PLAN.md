# Immediate Action Plan - API Migration & Testing

**Generated**: 2026-02-12
**Current Status**: Prerequisites route fixed, 22 routes remaining

---

## 🚨 STEP 1: Restart Supabase (DO THIS NOW)

The `api` function is now configured but needs Supabase restart:

```bash
cd packages/supabase
supabase stop
supabase start
```

**Verify it worked:**
```bash
# Check if API function is running
curl http://127.0.0.1:54321/functions/v1/api/health

# Should return: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

---

## 🧪 STEP 2: Test Prerequisites Endpoint

Once Supabase is running, test the prerequisites endpoint:

### From your app (authenticated request):
Your app should now successfully call:
- `GET /v1/prerequisites/check`
- `POST /v1/prerequisites/complete`

### Manual test (with auth token):
```bash
# Get your auth token from the app or Supabase Dashboard
TOKEN="your-jwt-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:54321/functions/v1/api/v1/prerequisites/check
```

---

## 📋 STEP 3: Choose Migration Strategy

You have two options:

### Option A: Aggressive (Recommended for small team)
Migrate all 22 remaining routes in 4 phases over 2-4 weeks

### Option B: Conservative (Recommended for production)
Migrate routes incrementally as needed, maintaining tRPC for unused routes

---

## 🎯 STEP 4: Priority Routes to Migrate Next

Based on app usage, I recommend migrating in this order:

### Week 1: Critical User Features
1. **teams** - Organization/team management
   - tRPC: `packages/supabase/functions/trpc/routers/teams.router.ts`
   - SDK: `packages/scaffald-sdk/src/resources/teams.ts` ✅
   - Hooks: Need to create `packages/scf-core/utils/teams-sdk-hooks.ts`

2. **connections** - User networking
   - tRPC: `packages/supabase/functions/trpc/routers/connections.router.ts`
   - SDK: `packages/scaffald-sdk/src/resources/connections.ts` ✅
   - Hooks: Need to create `packages/scf-core/utils/connections-sdk-hooks.ts`

3. **follows** - User engagement
   - tRPC: `packages/supabase/functions/trpc/routers/follows.router.ts`
   - SDK: `packages/scaffald-sdk/src/resources/follows.ts` ✅
   - Hooks: Need to create `packages/scf-core/utils/follows-sdk-hooks.ts`

4. **notifications** - User notifications
   - tRPC: `packages/supabase/functions/trpc/routers/notifications.router.ts`
   - SDK: `packages/scaffald-sdk/src/resources/notifications.ts` ✅
   - Hooks: Need to create `packages/scf-core/utils/notifications-sdk-hooks.ts`

### Week 2: Profile Features
5. **skills** - Profile skills
6. **experience** - Work experience
7. **employment** - Employment history
8. **education** - Education history
9. **certifications** - Certifications

### Week 3: Business Features
10. **organizations** - Organization management
11. **employers** - Employer profiles
12. **background-checks** - Background verification

### Week 4: Additional Features
13. **engagement** - Engagement tracking
14. **inquiries** - User inquiries
15. **work-logs** - Time tracking
16. **onet** - O*NET occupation data
17. **portfolio** - Portfolio/work samples
18. **projects** - Project showcase
19. **reviews** - User reviews
20. **profile-completion** - Profile completion tracking
21. **profile-views** - Profile view analytics
22. **profile-widgets** - Profile customization

---

## 🔧 STEP 5: Migration Template (Use for Each Route)

For each route you migrate, follow this checklist:

### 1. Create API Route File (15-30 min)
```bash
# Example: teams
touch packages/supabase/functions/api/routes/teams.ts
```

**Copy structure from**: `packages/supabase/functions/api/routes/prerequisites.ts`

**Must include**:
- OpenAPI schemas
- All endpoints from SDK resource
- Proper auth middleware
- Error handling
- Request validation

### 2. Register Route (2 min)
Edit `packages/supabase/functions/api/index.ts`:
```typescript
import teamsRouter from "./routes/teams.ts"
// ...
app.route("/v1/teams", teamsRouter)
```

### 3. Create React Hooks (20-40 min)
```bash
touch packages/scf-core/utils/teams-sdk-hooks.ts
```

**Template**:
```typescript
import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// Query hook
export function useTeams(orgId: string) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['teams', 'list', orgId],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.teams.list({ organizationId: orgId })
    },
    enabled: !!client && !!orgId,
  })
}

// Mutation hook - MUST accept UseMutationOptions
export function useCreateTeamMutation(
  options?: UseMutationOptions<Team, Error, CreateTeamParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: CreateTeamParams) => {
      if (!client) throw new Error('Missing client')
      return client.teams.create(params)
    },
    ...options, // CRITICAL: Spread options
  })
}
```

### 4. Find & Replace Component Usage (30-60 min)
```bash
# Find all tRPC usage for this resource
grep -r "api.teams." apps/scaffald/

# For each file:
# - Replace tRPC query hooks with SDK hooks
# - Replace tRPC mutation hooks with SDK hooks
# - Update cache invalidation from utils.teams.* to queryClient
# - Fix data access (check for data.data nesting)
```

### 5. Create Tests (20-40 min)

**API Route Test**:
```bash
touch packages/supabase/functions/api/__tests__/routes/teams.test.ts
```

**SDK Test** (if doesn't exist):
Already exists for most resources!

**MSW Handlers** (if doesn't exist):
```bash
# Usually already exists in:
packages/scaffald-sdk/src/__tests__/mocks/teams-handlers.ts
```

### 6. Verify & Test (10-20 min)
```bash
# TypeScript compilation
pnpm typecheck

# Run tests
cd packages/scaffald-sdk && pnpm test
cd packages/supabase/functions/api && bun test

# Manual testing in app
# - Test all CRUD operations
# - Verify error handling
# - Check loading states
```

### 7. Cleanup (5 min)
```bash
# Verify no tRPC imports remain
grep -r "api.teams." apps/scaffald/
# Should return nothing!

# Delete tRPC router
rm packages/supabase/functions/trpc/routers/teams.router.ts

# Commit
git add .
git commit -m "feat: migrate teams from tRPC to REST API"
```

---

## 📊 Progress Tracking

Create a simple tracking file:

```bash
echo "# Migration Progress

- [x] prerequisites (2026-02-12)
- [ ] teams
- [ ] connections
- [ ] follows
- [ ] notifications
- [ ] skills
- [ ] experience
- [ ] employment
- [ ] education
- [ ] certifications
- [ ] organizations
- [ ] employers
- [ ] background-checks
- [ ] engagement
- [ ] inquiries
- [ ] work-logs
- [ ] onet
- [ ] portfolio
- [ ] projects
- [ ] reviews
- [ ] profile-completion
- [ ] profile-views
- [ ] profile-widgets
" > MIGRATION_PROGRESS.md
```

---

## 🚀 Automation Opportunities

### Script: Create Route Boilerplate
```bash
#!/bin/bash
# create-route.sh
RESOURCE=$1

echo "Creating API route for $RESOURCE..."

# Create route file
cat > "packages/supabase/functions/api/routes/${RESOURCE}.ts" <<'EOF'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

// TODO: Add routes here

export default app
EOF

# Create hooks file
cat > "packages/scf-core/utils/${RESOURCE}-sdk-hooks.ts" <<'EOF'
import { useQuery, useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'

// TODO: Add hooks here
EOF

# Create test file
cat > "packages/supabase/functions/api/__tests__/routes/${RESOURCE}.test.ts" <<'EOF'
import { describe, it, expect } from 'bun:test'

describe('${RESOURCE} routes', () => {
  // TODO: Add tests here
})
EOF

echo "✅ Created boilerplate for $RESOURCE"
echo "Next steps:"
echo "1. Edit packages/supabase/functions/api/routes/${RESOURCE}.ts"
echo "2. Register in packages/supabase/functions/api/index.ts"
echo "3. Implement hooks in packages/scf-core/utils/${RESOURCE}-sdk-hooks.ts"
echo "4. Write tests"
```

Usage:
```bash
chmod +x create-route.sh
./create-route.sh teams
```

---

## 🎯 Success Criteria

### Per Route
- [ ] API route file created
- [ ] Route registered in index.ts
- [ ] React hooks created
- [ ] All components migrated
- [ ] Tests passing
- [ ] No tRPC imports remain
- [ ] tRPC router deleted

### Overall Project
- [ ] All 30 routes implemented
- [ ] 100% test coverage (SDK + API)
- [ ] All tRPC routers removed
- [ ] Documentation updated
- [ ] Production deployment successful

---

## ⏱️ Time Estimates

### Per Route
- **Simple route** (e.g., industries): 1-2 hours
- **Medium route** (e.g., teams): 2-4 hours
- **Complex route** (e.g., applications): 4-8 hours

### Overall Project
- **Aggressive (full-time)**: 2-4 weeks
- **Conservative (part-time)**: 1-2 months

---

## 🆘 Common Issues & Solutions

### Issue: 404 on new route
**Solution**: Restart Supabase after adding route

### Issue: CORS errors
**Solution**: Check CORS config in `api/index.ts`, verify origin is set

### Issue: Auth errors
**Solution**: Verify auth middleware is applied, check JWT token

### Issue: Data structure mismatch
**Solution**: Check if SDK returns `data.data` vs `data.{resource}`

### Issue: Mutation callbacks not working
**Solution**: Ensure mutation hook accepts `UseMutationOptions` and spreads it

### Issue: Tests failing
**Solution**: Check MSW handlers are registered in `server.ts`

---

## 📞 Need Help?

If you get stuck:
1. Check the existing working examples (jobs, applications, profiles)
2. Review the tRPC router for business logic
3. Check the SDK resource for endpoint definitions
4. Review test files for expected behavior
5. Ask me for specific help with a particular route!

---

## ✅ Quick Win: Do This Right Now

1. **Restart Supabase** (2 min)
   ```bash
   cd packages/supabase
   supabase stop && supabase start
   ```

2. **Test Prerequisites** (1 min)
   - Open your app
   - Navigate to onboarding
   - Verify prerequisites check works
   - No more 404 errors!

3. **Pick Next Route** (1 min)
   - I recommend: **teams** (critical for app)
   - Or: **connections** (high user engagement)

4. **Start Migration** (2-4 hours)
   - Follow the template above
   - Reference prerequisites.ts as example
   - You'll get faster with each route!

---

**Ready to migrate?** Start with Step 1 (restart Supabase) and let me know when you're ready to tackle the next route! 🚀

