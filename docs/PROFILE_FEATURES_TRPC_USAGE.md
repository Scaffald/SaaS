# Profile Features tRPC Usage

**Last Updated:** February 12, 2026
**Purpose:** Document which profile feature files intentionally use tRPC

## Overview

The profile feature contains **6 files** that use tRPC API calls. All are **intentionally** using tRPC for valid architectural reasons (compliance, admin operations, file operations).

**Decision:** All 6 files remain in tRPC. No migration needed.

---

## Files Using tRPC (6 total)

### 1. Account Deletion (Compliance) ✅ Stay in tRPC

**File:** `packages/scf-core/features/profile/components/AccountDeletionPanel.tsx`

**tRPC Usage:**
```typescript
const deletionMutation = api.accountDeletion.requestWorkerDeletion.useMutation({
  onSuccess: () => {
    // Account deletion flow
  }
})
```

**Rationale:**
- **Compliance/Legal operation** - Account deletion has regulatory requirements
- **Audit trail required** - Must track all deletion requests
- **Irreversible operation** - Requires special handling
- **CCPA/GDPR compliance** - Part of data deletion rights

**Router:** `accountDeletion` (stays in tRPC - compliance category)

**Decision:** ✅ **Keep in tRPC** - Compliance operations by design

---

### 2. University Search (Data Lookup) ✅ Stay in tRPC

**Files:**
- `packages/scf-core/features/profile/components/EducationEntryEditModal.tsx`
- `packages/scf-core/features/profile/profile-education-left.tsx`

**tRPC Usage:**
```typescript
const searchUniversitiesQuery = api.office.universities.searchUniversities.useQuery(
  { query: searchTerm },
  { enabled: searchTerm.length > 0 }
)
```

**Rationale:**
- **Admin-managed university database** - Universities are managed in office/admin
- **Autocomplete functionality** - Simple search operation
- **Low traffic** - Only used when adding education entries
- **Not worth SDK migration** - Would add complexity for minimal benefit

**Router:** `office.universities` (stays in tRPC - admin category)

**Decision:** ✅ **Keep in tRPC** - Admin database lookup, low priority for SDK

**Alternative Considered:**
- Could create public `Universities` SDK resource with `search()` method
- **Not worth it:** Low traffic, simple autocomplete, admin-managed data
- **Recommendation:** Accept tRPC dependency for university autocomplete

---

### 3. Employment Section (Admin Mode) ✅ Stay in tRPC

**File:** `packages/scf-core/features/profile/components/EmploymentSection.tsx`

**tRPC Usage:**
```typescript
// Admin mode: edit other users' profiles
const query = isAdminMode
  ? () => api.office.getUserEmployment.useQuery({ userId })
  : () => useEmployment({ userId })

const mutation = isAdminMode
  ? api.office.updateUserEmployment.useMutation()
  : useUpdateEmploymentMutation()
```

**Rationale:**
- **Admin operations** - Admins can edit other users' profiles
- **Hybrid approach** - Uses SDK for self-editing, tRPC for admin editing
- **Correct pattern** - Different permissions require different routers

**Router:** `office.getUserEmployment` / `office.updateUserEmployment` (admin-only)

**Decision:** ✅ **Keep in tRPC** - Admin operations by design

---

### 4. General Profile Section (Admin Mode) ✅ Stay in tRPC

**File:** `packages/scf-core/features/profile/components/GeneralProfileSection.tsx`

**tRPC Usage:**
```typescript
// Admin mode: edit other users' profiles
const query = isAdminMode
  ? () => api.office.getUserGeneral.useQuery({ userId })
  : () => useGeneralInfo()

const mutation = isAdminMode
  ? api.office.updateUserGeneral.useMutation()
  : useUpdateGeneralInfoMutation()
```

**Rationale:**
- **Admin operations** - Admins can edit other users' profiles
- **Hybrid approach** - Uses SDK for self-editing, tRPC for admin editing
- **Correct pattern** - Same as EmploymentSection

**Router:** `office.getUserGeneral` / `office.updateUserGeneral` (admin-only)

**Decision:** ✅ **Keep in tRPC** - Admin operations by design

---

### 5. Storage Preferences (File Operations) ✅ Stay in tRPC

**File:** `packages/scf-core/features/profile/widgets/StoragePreferencesWidget.tsx`

**tRPC Usage:**
```typescript
const { data, isLoading, error } = api.documents.getStoragePreference.useQuery()

const mutation = api.documents.setStoragePreference.useMutation({
  onSuccess: () => {
    // Update storage preferences
  }
})
```

**Rationale:**
- **File operations category** - Related to document storage (S3)
- **Storage quota management** - Tied to file upload system
- **Not user-facing API** - Internal preference, not portable
- **Low priority** - Storage preferences are rarely changed

**Router:** `documents` (stays in tRPC - file operations category)

**Decision:** ✅ **Keep in tRPC** - File operations by design

---

## Summary

### All 6 Files Stay in tRPC (0 to migrate)

| File | Router | Category | Migration? |
|------|--------|----------|------------|
| AccountDeletionPanel.tsx | `accountDeletion` | Compliance | ❌ Stay in tRPC |
| EducationEntryEditModal.tsx | `office.universities` | Admin DB | ❌ Stay in tRPC |
| EmploymentSection.tsx | `office.getUserEmployment` | Admin ops | ❌ Stay in tRPC |
| GeneralProfileSection.tsx | `office.getUserGeneral` | Admin ops | ❌ Stay in tRPC |
| profile-education-left.tsx | `office.universities` | Admin DB | ❌ Stay in tRPC |
| StoragePreferencesWidget.tsx | `documents` | File ops | ❌ Stay in tRPC |

---

## Architecture Patterns

### Hybrid Approach (Admin vs User)

Several profile components use a **hybrid pattern**:

```typescript
// ✅ GOOD: Different routers for admin vs user operations
const query = isAdminMode
  ? () => api.office.getUser*.useQuery({ userId })  // tRPC for admin
  : () => useUser*()                                 // SDK for user

const mutation = isAdminMode
  ? api.office.updateUser*.useMutation()             // tRPC for admin
  : useUpdateUser*Mutation()                         // SDK for user
```

**Why this works:**
- **Admin operations** have different permissions and access patterns
- **User operations** are self-service and should be in SDK
- **Clear separation** between admin tooling and user API

### University Search Pattern

University search is used in **2 places**:
1. Education entry modal (when adding/editing education)
2. Profile education left panel (same functionality)

**Current:** Both use `api.office.universities.searchUniversities`

**Alternative:** Create `Universities` SDK resource
```typescript
// Hypothetical SDK approach
export class Universities extends Resource {
  async search(query: string): Promise<University[]> {
    return this.http.get('/api/v1/universities/search', { params: { query } })
  }
}
```

**Decision:** Not worth it
- Low traffic (only when adding education)
- Simple autocomplete
- Admin-managed university database
- Would require new REST API endpoint for minimal benefit

---

## Verification

### Count Profile tRPC Usage
```bash
# Should be 6 files (all documented above)
grep -r "api\." packages/scf-core/features/profile --include="*.tsx" --include="*.ts" | \
  grep -v test | grep -v "from '@scf/core/utils/api'" | grep "api\." | \
  cut -d: -f1 | sort -u | wc -l
```

### Check Specific Routers
```bash
# Account deletion (compliance)
grep -r "api\.accountDeletion\." packages/scf-core/features/profile --include="*.tsx"

# Office universities (admin)
grep -r "api\.office\.universities\." packages/scf-core/features/profile --include="*.tsx"

# Office user operations (admin)
grep -r "api\.office\.getUser\|api\.office\.updateUser" packages/scf-core/features/profile --include="*.tsx"

# Documents (file operations)
grep -r "api\.documents\." packages/scf-core/features/profile --include="*.tsx"
```

---

## Related Documentation

- [TRPC Architecture](./TRPC_ARCHITECTURE.md) - Overall tRPC usage guide
- [Office Router Strategy](./OFFICE_ROUTER_STRATEGY.md) - Office/admin operations
- [SDK Decision Framework](./SDK_DECISION_FRAMEWORK.md) - When to use SDK vs tRPC

---

**Phase 26 Status:** ✅ Complete (0 files to migrate, 6 files documented as intentionally tRPC)

**Document Status:** Production
**Last Review:** February 12, 2026
**Next Review:** May 2026 (quarterly)
