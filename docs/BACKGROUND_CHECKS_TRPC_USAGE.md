# Background Checks tRPC Usage

**Last Updated:** February 12, 2026
**Purpose:** Document which background check files intentionally use tRPC

## Overview

The background checks feature has been split between SDK (user-facing operations) and tRPC (admin operations).

**User-Facing (SDK):** ✅ Migrated to SDK
- Privacy settings
- Request background check (payment flow)
- View check status
- Dispute process

**Admin Operations (tRPC):** ✅ Staying in tRPC
- Review background checks
- Manage check catalog
- Resolve disputes
- Audit logs
- Metrics dashboard

---

## Files Using SDK (User-Facing)

### 1. Privacy Controls ✅ Migrated to SDK

**File:** `packages/scf-core/features/background-check/components/PrivacyControls.tsx`

**SDK Usage:**
```typescript
import { useUpdateBackgroundCheckPrivacyMutation } from '@scf/core/utils/background-checks-sdk-hooks'

const updatePrivacyMutation = useUpdateBackgroundCheckPrivacyMutation()
updatePrivacyMutation.mutate({
  background_check_id: checkId,
  share_publicly: nextSharePublicly,
  shared_with_organization_ids: nextOrganizationIds,
})
```

**Migration:** Phase 24 - February 12, 2026

---

### 2. Organization Background Check Request ✅ Partial SDK Migration

**File:** `packages/scf-core/features/background-check/organization/OrganizationBackgroundCheckRequestForm.tsx`

**SDK Usage:**
```typescript
import { useBackgroundCheckPackages, useRequestBackgroundCheckMutation, useConfirmCheckPaymentMutation } from '@scf/core/utils/background-checks-sdk-hooks'
import { useWorkers } from '@scf/core/utils/workers-sdk-hooks'

// Background checks - SDK
const { data: packagesData } = useBackgroundCheckPackages()
const requestPaymentMutation = useRequestBackgroundCheckMutation()
const confirmPaymentMutation = useConfirmCheckPaymentMutation()

// Workers - SDK
const workersQuery = useWorkers({ search: workerSearch, limit: 50 })
```

**tRPC Usage (Documented Exception):**
```typescript
// NOTE: Keep in tRPC - office.listJobs supports organization_id filtering (admin operation)
// Public SDK Jobs resource doesn't support organization_id filter yet
const jobsQuery = api.office.listJobs.useQuery({
  organization_id: organizationId,
  status: 'open',
  limit: 100,
  offset: 0,
})
```

**Rationale:**
- Background check operations: ✅ SDK (user-facing)
- Workers search: ✅ SDK (public API)
- Jobs filtering by organization: ❌ tRPC (admin operation, organization_id filter not in SDK)

**Migration:** Phase 24 - February 12, 2026

---

## Files Using tRPC (Admin Operations)

### 3. Admin Background Checks Page ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminBackgroundChecksPage.tsx`

**Rationale:**
- Admin dashboard for reviewing all background checks
- Complex filtering and sorting
- Admin-only visibility
- Internal tooling

**Router:** `backgroundChecks.admin.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Admin dashboard

---

### 4. Admin Catalog Manager ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminCatalogManager.tsx`

**Rationale:**
- Manage background check packages (pricing, features)
- Admin-only CRUD operations
- Configuration management
- Internal tooling

**Router:** `backgroundChecks.admin.catalog.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Admin configuration

---

### 5. Admin Check Review Dialog ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminCheckReviewDialog.tsx`

**Rationale:**
- Manual review of background check results
- Admin approval/rejection workflow
- Compliance operations
- Sensitive data handling

**Router:** `backgroundChecks.admin.review.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Admin workflow

---

### 6. Admin Dispute Resolution Dialog ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminDisputeResolutionDialog.tsx`

**Rationale:**
- Admin handling of user disputes
- Compliance/legal operations
- Complex approval workflow
- Internal tooling

**Router:** `backgroundChecks.admin.disputes.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Admin compliance

---

### 7. Admin Metrics Panel ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminMetricsPanel.tsx`

**Rationale:**
- Admin analytics dashboard
- Aggregated metrics
- Internal reporting
- Admin-only visibility

**Router:** `backgroundChecks.admin.metrics.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Admin analytics

---

### 8. Admin Audit Log Panel ✅ Stay in tRPC

**File:** `packages/scf-core/features/background-check/admin/AdminAuditLogPanel.tsx`

**Rationale:**
- Compliance audit trail
- Admin-only access
- Sensitive compliance data
- Regulatory requirements

**Router:** `backgroundChecks.admin.audit.*` (admin operations)

**Decision:** ✅ **Keep in tRPC** - Compliance/audit

---

## Summary

### Files by Category

| Category | Files | Migrated to SDK | Stay in tRPC | Migration % |
|----------|-------|-----------------|--------------|-------------|
| User-Facing | 2 | 2 | 0 | **100%** |
| Admin Operations | 6 | 0 | 6 | **0%** *(by design)* |
| **Total** | **8** | **2** | **6** | **25% SDK** |

### Migration Status

**✅ Completed:**
- Privacy controls → SDK
- Background check requests (payment) → SDK
- Workers search → SDK
- Admin operations documented as intentionally tRPC

**📝 Documented Exceptions:**
- `OrganizationBackgroundCheckRequestForm.tsx` - Uses `api.office.listJobs` for organization_id filtering (admin operation)

---

## Architecture Pattern

### User-Facing Operations → SDK
```typescript
// ✅ GOOD: User operations use SDK
import { useBackgroundCheckPackages, useRequestBackgroundCheckMutation } from '@scf/core/utils/background-checks-sdk-hooks'

const { data: packages } = useBackgroundCheckPackages()
const requestMutation = useRequestBackgroundCheckMutation()
```

### Admin Operations → tRPC
```typescript
// ✅ GOOD: Admin operations use tRPC
import { api } from '@scf/core/utils/api'

const { data: allChecks } = api.backgroundChecks.admin.listAll.useQuery()
const reviewMutation = api.backgroundChecks.admin.review.useMutation()
```

### Hybrid Pattern (Documented)
```typescript
// ✅ ACCEPTABLE: Documented exception
import { api } from '@scf/core/utils/api'
import { useWorkers } from '@scf/core/utils/workers-sdk-hooks'

// User operation → SDK
const workersQuery = useWorkers({ search })

// Admin operation → tRPC (documented)
// NOTE: Keep in tRPC - office.listJobs supports organization_id filtering
const jobsQuery = api.office.listJobs.useQuery({ organization_id })
```

---

## Verification

### Count Background Checks SDK Usage
```bash
# User-facing files using SDK (should be 2)
grep -r "from '@scf/core/utils/background-checks-sdk-hooks'" packages/scf-core/features/background-check --include="*.tsx" | grep -v admin | wc -l

# Admin files using tRPC (should be 6)
grep -r "from '@scf/core/utils/api'" packages/scf-core/features/background-check/admin --include="*.tsx" | wc -l
```

### Check Specific Operations
```bash
# Privacy updates (SDK)
grep -r "useUpdateBackgroundCheckPrivacyMutation" packages/scf-core/features/background-check --include="*.tsx"

# Background check requests (SDK)
grep -r "useRequestBackgroundCheckMutation" packages/scf-core/features/background-check --include="*.tsx"

# Admin operations (tRPC)
grep -r "api\.backgroundChecks\.admin\." packages/scf-core/features/background-check/admin --include="*.tsx"
```

---

## Related Documentation

- [tRPC Architecture](./TRPC_ARCHITECTURE.md) - Overall tRPC usage guide
- [Office Router Strategy](./OFFICE_ROUTER_STRATEGY.md) - Office/admin operations
- [SDK Decision Framework](./SDK_DECISION_FRAMEWORK.md) - When to use SDK vs tRPC

---

**Phase 24 Status:** ✅ Complete (2 user files migrated, 6 admin files documented)

**User-Facing SDK Coverage:** 100% ✅

**Document Status:** Production
**Last Review:** February 12, 2026
**Next Review:** May 2026 (quarterly)
