# Replace Internal API Mocks with Real Database Calls

> **Created:** 2025-01-23
> **Status:** In Progress
> **Priority:** High
> **Testing Policy:** REQ-9 - We do NOT mock internal services we own

---

## Implementation Progress

### E2E Tests (21 files identified)

| File | Mocks | Status | Notes |
|------|-------|--------|-------|
| `contractor-comprehensive.spec.ts` | 0 | ✅ Done | Deprecated - tests merged to subcontractor-comprehensive-audit |
| `subcontractor-comprehensive-audit.spec.ts` | 0 | ✅ Done | Uses real DB with seed-contractor-data.ts |
| `scaffald-integration.spec.ts` | 1 | ⏭️ Skip | All tests are .skip'd |
| `privacy-dashboard.spec.ts` | 1 | ⏸️ Pending | Mock is for 500 error testing |
| `document-management.spec.ts` | 6+ | ⏸️ Pending | High priority |
| `task-management.spec.ts` | ? | ⏸️ Pending | High priority |
| `admin-flow.spec.ts` | 6+ | ⏸️ Pending | High priority |
| `admin-comprehensive.spec.ts` | 4+ | ⏸️ Pending | High priority |
| `manager-comprehensive.spec.ts` | 12+ | ⏸️ Pending | Complex |
| `compliance-management.spec.ts` | 7+ | ⏸️ Pending | High priority |
| `notifications-relationships.spec.ts` | 11 | ⏸️ Pending | Medium priority |
| `public-comprehensive.spec.ts` | 2+ | ⏸️ Pending | Medium |
| `contractor-manual-validation.spec.ts` | 2+ | ⏸️ Pending | Medium |
| `user-set-types.spec.ts` | 5+ | ⏸️ Pending | Medium |
| `ccpa-*.spec.ts` (4 files) | varies | ⏸️ Pending | Group together |
| `risk-display.spec.ts` | ? | ⏸️ Pending | |
| `login-flow.spec.ts` | ? | ⏸️ Pending | |
| `example-with-error-capture.spec.ts` | ? | ⏸️ Pending | Example file |
| `subcontractor-onboarding.spec.ts` | ? | ⏸️ Pending | |

### Unit Tests (needs audit)

| File | Status | Notes |
|------|--------|-------|
| `src/lib/__tests__/relationshipInvitations.test.ts` | ⏸️ Pending | Mocks DatabaseContext |
| `src/lib/__tests__/referrals.test.ts` | ⏸️ Pending | Mocks DatabaseContext |
| `src/lib/__tests__/referralCredits.test.ts` | ⏸️ Pending | Mocks DatabaseContext |
| `src/hooks/__tests__/useBrokerAcknowledgements.test.ts` | ⏸️ Pending | Mocks DatabaseContext |

---

## Overview

This plan documents all test files that currently mock internal APIs, databases, or services that we own. Per our testing policy (REQ-9), we must replace these mocks with real database calls and real API calls.

**Core Principle:** "If we own it or write it, we test it directly - we do NOT mock it."

## Testing Policy Reference

### What NOT to Mock (We Own It)
- **Database**: Never mock Supabase, database queries, or repositories - use real database instances
- **Internal APIs**: Never mock our own API endpoints (tRPC, REST) - make real HTTP calls
- **Internal Services**: Never mock service classes we own and maintain
- **Tables/Models**: Never mock database tables, models, or their relationships
- **Configuration**: Never mock config that we own and control

### What CAN Be Mocked (External Third-Party Only)
- **External APIs**: Stripe, SendGrid, Twilio, Google APIs, etc.
- **External services**: OAuth providers (when not testing auth flow)
- **Network conditions**: Simulating timeouts, errors from external services
- **Rate-limited services**: When testing without burning API quota

## Audit Results

### E2E Tests (Playwright) - Internal API Mocks

#### 1. `tests/e2e/document-management.spec.ts`
**Status:** ❌ Mocks internal Supabase REST API
**Mocks:**
- `**/rest/v1/documents*` - Supabase REST API for documents (we own this)
- `**/storage/v1/object/**` - Supabase Storage API (we own this)

**Action Required:**
- Replace `page.route()` mocks with real Supabase database calls
- Use test fixtures to seed document data
- Use real Supabase Storage for file upload tests
- Verify documents are actually created/retrieved from database

**Priority:** High (critical user flow)

---

#### 2. `tests/e2e/task-management.spec.ts`
**Status:** ⚠️ Partially mocks internal APIs
**Mocks:**
- `**/rest/v1/tasks*` - Supabase REST API for tasks (we own this)
- Multiple test suites - some use mocks, some use real database

**Action Required:**
- Remove all `page.route('**/rest/v1/tasks*')` mocks
- Use real Supabase database calls via test fixtures
- Seed task data in database before tests
- Verify tasks are actually created/updated in database

**Priority:** High (critical user flow)

---

#### 3. `tests/e2e/user-set-types.spec.ts`
**Status:** ⚠️ Partially mocks internal tRPC endpoints
**Mocks:**
- `**/api/trpc/userSetTypes.getUserLexicon*` - tRPC endpoint (we own this)
- `**/api/trpc/userSetTypes.listActive*` - tRPC endpoint (we own this)
- `**/api/trpc/userSetTypes.create*` - tRPC endpoint (we own this)
- `**/api/trpc/userSetTypes.updateLexicon*` - tRPC endpoint (we own this)
- `**/api/trpc/userSetTypes.exportLexicon*` - tRPC endpoint (we own this)

**Note:** File has deprecated mock functions with clear comments, but still contains active route mocks.

**Action Required:**
- Remove all `page.route('**/api/trpc/**')` mocks
- Use real tRPC endpoints that query real Supabase database
- Seed user set types and lexicon data in database for tests
- Verify tRPC calls actually hit the database

**Priority:** Medium

---

#### 4. `tests/e2e/admin-flow.spec.ts`
**Status:** ❌ Mocks multiple internal Supabase REST APIs
**Mocks:**
- `**/rest/v1/user_profiles*` - Supabase REST API (we own this)
- `**/rest/v1/users*` - Supabase REST API (we own this)
- `**/rest/v1/broker_invitations*` - Supabase REST API (we own this)
- `**/rest/v1/enum_values*` - Supabase REST API (we own this)
- `**/rest/v1/admin_audit_log*` - Supabase REST API (we own this)
- `**/rest/v1/rpc/get_user_profile_by_scaffald_id*` - Supabase RPC (we own this)

**Action Required:**
- Replace all `page.route()` mocks with real Supabase database calls
- Use test fixtures to seed admin data
- Verify admin operations actually modify database

**Priority:** High (admin functionality)

---

#### 5. `tests/e2e/manager-comprehensive.spec.ts`
**Status:** ❌ Mocks multiple internal Supabase REST APIs
**Mocks:**
- `**/rest/v1/enum_values*` - Supabase REST API (we own this)
- `**/rest/v1/tasks*` - Supabase REST API (we own this)
- `**/rest/v1/projects*` - Supabase REST API (we own this)
- `**/rest/v1/project_subcontractors*` - Supabase REST API (we own this)
- `**/rest/v1/documents*` - Supabase REST API (we own this)
- `**/rest/v1/insurance_products*` - Supabase REST API (we own this)
- `**/rest/v1/integrations*` - Supabase REST API (we own this)
- `**/rest/v1/acknowledgements*` - Supabase REST API (we own this)
- `**/rest/v1/notifications*` - Supabase REST API (we own this)
- `**/rest/v1/team_members*` - Supabase REST API (we own this)
- `**/rest/v1/user_profiles*` - Supabase REST API (we own this)
- `**/rest/v1/help_articles*` - Supabase REST API (we own this)

**Action Required:**
- Replace all `page.route()` mocks with real Supabase database calls
- Use test fixtures to seed comprehensive manager data
- Verify all manager operations actually modify database

**Priority:** High (comprehensive manager tests)

---

#### 6. `tests/e2e/admin-comprehensive.spec.ts`
**Status:** ❌ Mocks multiple internal Supabase REST APIs
**Mocks:**
- `**/rest/v1/companies*` - Supabase REST API (we own this)
- `**/rest/v1/company_users*` - Supabase REST API (we own this)
- `**/rest/v1/company_projects*` - Supabase REST API (we own this)
- `**/rest/v1/admin_settings*` - Supabase REST API (we own this)

**Action Required:**
- Replace all `page.route()` mocks with real Supabase database calls
- Use test fixtures to seed admin data
- Verify admin operations actually modify database

**Priority:** High (admin functionality)

---

#### 7. `tests/e2e/compliance-management.spec.ts`
**Status:** ❌ Mocks internal tRPC endpoints
**Mocks:**
- `**/api/trpc/compliance.requirements.list*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.requirements.get*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.requirements.create*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.dependencies.list*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.requirements.getVersionHistory*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.bulk.importPreview*` - tRPC endpoint (we own this)
- `**/api/trpc/compliance.bulk.export*` - tRPC endpoint (we own this)

**Action Required:**
- Remove all `page.route('**/api/trpc/compliance.**')` mocks
- Use real tRPC endpoints that query real Supabase database
- Seed compliance data in database for tests
- Verify compliance operations actually modify database

**Priority:** High (compliance is critical)

---

#### 8. `tests/e2e/privacy-dashboard.spec.ts`
**Status:** ❌ Mocks internal Supabase REST API
**Mocks:**
- `**/rest/v1/ccpa_requests*` - Supabase REST API (we own this)

**Action Required:**
- Replace `page.route()` mock with real Supabase database calls
- Use test fixtures to seed CCPA request data
- Verify privacy operations actually modify database

**Priority:** Medium

---

#### 9. `tests/e2e/scaffald-integration.spec.ts`
**Status:** ❌ Mocks internal Supabase REST API
**Mocks:**
- `**/rest/v1/organization_documents*` - Supabase REST API (we own this)

**Action Required:**
- Replace `page.route()` mock with real Supabase database calls
- Use test fixtures to seed organization document data
- Verify Scaffald integration actually queries database

**Priority:** Medium

---

#### 10. `tests/e2e/contractor-manual-validation.spec.ts`
**Status:** ❌ Mocks internal APIs
**Mocks:**
- `**/rest/v1/user_profiles*` - Supabase REST API (we own this)
- `**/api/trpc/**` - All tRPC endpoints (we own this)

**Action Required:**
- Replace all `page.route()` mocks with real database/API calls
- Use test fixtures to seed contractor data
- Verify contractor operations actually modify database

**Priority:** Medium

---

#### 11. `tests/e2e/public-comprehensive.spec.ts`
**Status:** ❌ Mocks internal Supabase REST APIs
**Mocks:**
- `**/rest/v1/broker_invitations*` - Supabase REST API (we own this)
- `**/rest/v1/signup*` - Supabase REST API (we own this)

**Action Required:**
- Replace `page.route()` mocks with real Supabase database calls
- Use test fixtures to seed signup/invitation data
- Verify public operations actually modify database

**Priority:** Medium

---

#### 12. `tests/e2e/notifications-relationships.spec.ts`
**Status:** ❌ Mocks internal Supabase REST API
**Mocks:**
- `**/rest/v1/notifications*` - Supabase REST API (we own this)

**Action Required:**
- Replace `page.route()` mock with real Supabase database calls
- Use test fixtures to seed notification data
- Verify notification operations actually modify database

**Priority:** Medium

---

### Unit Tests - Internal Service Mocks

#### 13. `src/lib/__tests__/relationshipInvitations.test.ts`
**Status:** ❌ Mocks DatabaseContext
**Mocks:**
- `vi.mock('../../contexts/DatabaseContext')` - We own DatabaseContext

**Action Required:**
- Remove DatabaseContext mock
- Use real Supabase client via test fixtures
- Seed relationship invitation data in database
- Verify invitations are actually created/retrieved from database

**Priority:** High (core functionality)

---

#### 14. `src/lib/__tests__/referrals.test.ts`
**Status:** ❌ Mocks DatabaseContext
**Mocks:**
- `vi.mock('../../contexts/DatabaseContext')` - We own DatabaseContext

**Action Required:**
- Remove DatabaseContext mock
- Use real Supabase client via test fixtures
- Seed referral data in database
- Verify referrals are actually created/retrieved from database

**Priority:** High (core functionality)

---

#### 15. `src/lib/__tests__/referralCredits.test.ts`
**Status:** ❌ Mocks DatabaseContext
**Mocks:**
- `vi.mock('../../contexts/DatabaseContext')` - We own DatabaseContext

**Action Required:**
- Remove DatabaseContext mock
- Use real Supabase client via test fixtures
- Seed referral credit data in database
- Verify credits are actually granted/retrieved from database

**Priority:** High (core functionality)

---

#### 16. `src/hooks/__tests__/useBrokerAcknowledgements.test.ts`
**Status:** ❌ Mocks DatabaseContext and formatSupabaseError
**Mocks:**
- `vi.mock('../../../contexts/DatabaseContext')` - We own DatabaseContext
- `vi.mock('../../../lib/database/formatSupabaseError')` - We own this utility

**Action Required:**
- Remove DatabaseContext mock
- Remove formatSupabaseError mock (or test it separately)
- Use real Supabase client via test fixtures
- Seed broker acknowledgement data in database
- Verify acknowledgements are actually created/retrieved from database

**Priority:** Medium

---

#### 17. `src/components/Manager/__tests__/SubcontractorsPage.test.tsx`
**Status:** ❌ Mocks DatabaseContext, react-router-dom, sonner
**Mocks:**
- `vi.mock('../../../contexts/DatabaseContext')` - We own DatabaseContext
- `vi.mock('react-router-dom')` - External library (OK to mock)
- `vi.mock('sonner')` - External library (OK to mock)

**Action Required:**
- Remove DatabaseContext mock
- Keep react-router-dom and sonner mocks (external libraries)
- Use real Supabase client via test fixtures
- Seed subcontractor data in database
- Verify subcontractors are actually retrieved from database

**Priority:** Medium

---

#### 18. `src/lib/documents/documentService.test.ts`
**Status:** ⚠️ Mocks scaffaldClient (needs verification)
**Mocks:**
- `vi.mock('../scaffald/client')` - Scaffald client wrapper (we own the wrapper, but Scaffald API is external)

**Action Required:**
- **Verify:** Is Scaffald API external or do we own it?
  - If external: Mock is acceptable
  - If we own it: Replace mock with real Scaffald API calls
- If keeping mock, add mock validation test to verify mock matches real API

**Priority:** Medium (needs investigation)

---

#### 19. `src/components/documents/__tests__/DocumentList.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed document data in database
- Verify documents are actually retrieved from database

**Priority:** Medium

---

#### 20. `src/components/compliance/__tests__/VersionHistoryViewer.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed compliance version history data in database
- Verify version history is actually retrieved from database

**Priority:** Medium

---

#### 21. `src/components/compliance/__tests__/DependencyVisualizer.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed compliance dependency data in database
- Verify dependencies are actually retrieved from database

**Priority:** Medium

---

#### 22. `src/components/compliance/__tests__/BulkImportUI.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed compliance bulk import data in database
- Verify bulk import operations actually modify database

**Priority:** Medium

---

#### 23. `src/components/participants/__tests__/ParticipantsComplianceView.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed participant compliance data in database
- Verify participant compliance is actually retrieved from database

**Priority:** Medium

---

#### 24. `src/hooks/__tests__/useComplianceFlags.test.tsx`
**Status:** ❌ Mocks DatabaseContext and supabase
**Mocks:**
- `vi.mock('../../contexts/DatabaseContext')` - We own DatabaseContext
- `vi.mock('../../lib/supabase')` - We own Supabase client

**Action Required:**
- Remove DatabaseContext mock
- Remove supabase mock
- Use real Supabase client via test fixtures
- Seed compliance flag data in database
- Verify compliance flags are actually retrieved from database

**Priority:** Medium

---

#### 25. `src/app/(dashboard)/dashboard/__tests__/page.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed dashboard data in database
- Verify dashboard data is actually retrieved from database

**Priority:** High (dashboard is critical)

---

#### 26. `src/app/(dashboard)/clients/[clientId]/__tests__/page.test.tsx`
**Status:** ❌ Mocks tRPC
**Mocks:**
- `vi.mock('../../../../../lib/trpc')` - We own tRPC

**Action Required:**
- Remove tRPC mock
- Use real tRPC endpoints that query real Supabase database
- Seed client data in database
- Verify client data is actually retrieved from database

**Priority:** Medium

---

#### 27. `src/contexts/__tests__/LexiconContext.test.tsx`
**Status:** ❌ Mocks tRPC extensively
**Mocks:**
- `vi.mock('../../lib/trpc')` - We own tRPC
- Multiple tRPC query mocks throughout test file

**Action Required:**
- Remove all tRPC mocks
- Use real tRPC endpoints that query real Supabase database
- Seed lexicon data in database
- Verify lexicon is actually retrieved from database

**Priority:** Medium

---

#### 28. `src/server/api/__tests__/root.test.ts`
**Status:** ❌ Mocks Supabase
**Mocks:**
- `vi.mock('../../../lib/supabase')` - We own Supabase client

**Action Required:**
- Remove Supabase mock
- Use real Supabase client via test fixtures
- Seed API data in database
- Verify API operations actually modify database

**Priority:** High (API root is critical)

---

#### 29. `src/server/api/__tests__/trpc.test.ts`
**Status:** ❌ Mocks Supabase
**Mocks:**
- `vi.mock('../../../lib/supabase')` - We own Supabase client

**Action Required:**
- Remove Supabase mock
- Use real Supabase client via test fixtures
- Seed tRPC data in database
- Verify tRPC operations actually modify database

**Priority:** High (tRPC is critical)

---

## Summary Statistics

### By Test Type
- **E2E Tests (Playwright):** 12 files with internal API mocks
- **Unit Tests:** 17 files with internal service mocks
- **Total Files:** 29 files requiring mock replacement

### By Mocked Service
- **Supabase REST API (`**/rest/v1/**`):** 12 E2E test files
- **tRPC Endpoints (`**/api/trpc/**`):** 5 E2E test files + 8 unit test files
- **DatabaseContext:** 5 unit test files
- **Supabase Client:** 2 unit test files

### By Priority
- **High Priority:** 8 files (critical user flows, core functionality)
- **Medium Priority:** 21 files (important but not critical)

---

## Implementation Strategy

### Phase 1: High Priority Files (8 files)
1. `tests/e2e/document-management.spec.ts`
2. `tests/e2e/task-management.spec.ts`
3. `tests/e2e/admin-flow.spec.ts`
4. `tests/e2e/manager-comprehensive.spec.ts`
5. `tests/e2e/admin-comprehensive.spec.ts`
6. `tests/e2e/compliance-management.spec.ts`
7. `src/lib/__tests__/relationshipInvitations.test.ts`
8. `src/lib/__tests__/referrals.test.ts`
9. `src/lib/__tests__/referralCredits.test.ts`
10. `src/app/(dashboard)/dashboard/__tests__/page.test.tsx`
11. `src/server/api/__tests__/root.test.ts`
12. `src/server/api/__tests__/trpc.test.ts`

### Phase 2: Medium Priority Files (21 files)
All remaining files from the audit list.

---

## Implementation Pattern

### For E2E Tests (Playwright)

**Before (Mocking):**
```typescript
// Mock documents API
await page.route('**/rest/v1/documents*', async (route) => {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(MOCK_DOCUMENTS),
  });
});
```

**After (Real Database):**
```typescript
// Seed real document data in database
import { testSupabaseAdmin } from '../fixtures';
import { createTestDocument } from '../fixtures/seed-document-data';

test.beforeEach(async ({ page }) => {
  // Create real documents in database
  await createTestDocument({
    name: 'Insurance_Certificate_GL.pdf',
    type: 'insurance',
    // ... other fields
  });
  
  // No route mocking - let real API calls go through
});
```

### For Unit Tests

**Before (Mocking):**
```typescript
vi.mock('../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    forsured: vi.fn(),
  }),
}));
```

**After (Real Database):**
```typescript
import { testSupabase, cleanupTestData } from '../../../../tests/fixtures';

describe('relationshipInvitations', () => {
  beforeEach(async () => {
    await cleanupTestData('relationship_invitations');
  });

  it('should create relationship invitation', async () => {
    // Use real Supabase client
    const { data, error } = await testSupabase
      .schema('forsured')
      .from('relationship_invitations')
      .insert({
        inviter_org_id: 'test-org-id',
        invitee_email: 'test@example.com',
        // ... other fields
      });
    
    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });
});
```

---

## Acceptance Criteria

For each test file:
- [ ] All internal API/service mocks removed
- [ ] Real database calls implemented using test fixtures
- [ ] Test data seeded in database before tests
- [ ] Test data cleaned up after tests
- [ ] Tests verify actual database state changes
- [ ] All tests pass with real database
- [ ] No test failures introduced
- [ ] Test execution time is acceptable (< 2x current time)

---

## Dependencies

### Required Test Infrastructure
- Test fixtures for Supabase client access (`tests/fixtures`)
- Seed data functions for all tables
- Cleanup helpers for test isolation
- Test database setup/teardown

### Database Requirements
- Local Supabase instance running
- All migrations applied
- Test data isolation (separate test orgs/users)

---

## Notes

1. **Mock Validation:** For any mocks that remain (external services only), create companion `.mockValidation.test.ts` files to verify mock behavior matches real API.

2. **Test Performance:** Real database calls will be slower than mocks. Monitor test execution time and optimize if needed.

3. **Test Isolation:** Ensure each test cleans up its data to prevent test pollution.

4. **Incremental Migration:** Can migrate files one at a time, verifying each passes before moving to next.

---

## References

- Testing Policy: `apps/forsured-web/tests/TESTING.md`
- Test Fixtures: `apps/forsured-web/tests/fixtures/`
- Supabase Testing Guide: `packages/supabase/docs/`
- No Mocking Policy: `.cursor/rules/frameworks/testing/standards.mdc`

