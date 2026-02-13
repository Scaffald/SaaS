# Office Router Strategy

**Last Updated:** February 2026
**Purpose:** Document which office/admin operations intentionally stay in tRPC

## Overview

The `office` router and related admin features contain **36 files** that intentionally use tRPC for internal tooling, complex permissions, and admin-only operations. These operations are **not intended for public API consumption** and should remain in tRPC.

## Philosophy

**Office operations are for:**
- Internal admin dashboards
- Complex multi-role permissions
- Rapid development without API versioning
- Operations not exposed via API keys
- Complex aggregations and analytics

**Office operations are NOT for:**
- External developers
- Public API consumption
- User-facing features
- Simple CRUD operations

---

## Office Features Using tRPC (36 files)

### 1. CMS Management (7 files)

**Location:** `packages/scf-core/features/office/cms/`

**Files:**
- office-cms-create.tsx
- office-cms-edit.tsx
- office-cms-list.tsx
- cms-slide-form.tsx

**tRPC Operations:**
- `api.office.cms.listSlides.useQuery()`
- `api.office.cms.getSlide.useQuery()`
- `api.office.cms.createSlide.useMutation()`
- `api.office.cms.updateSlide.useMutation()`
- `api.office.cms.deleteSlide.useMutation()`

**Rationale:**
- Admin-only content management
- Complex permission checks
- Not user-facing
- Rapid iteration without API versioning

---

### 2. Applications Management (8 files)

**Location:** `packages/scf-core/features/office/applications/`

**Files:**
- office-applications-screen.tsx
- components/ApplicationsKanbanBoard.tsx
- components/ApplicationDetailsTab.tsx
- components/ApplicationStatusChangeModal.tsx
- components/CandidateDetailModal.tsx
- hooks/useApplications.ts
- hooks/useApplicationStatusChange.ts

**tRPC Operations:**
- `api.applications.getById.useQuery()`
- `api.applications.update.useMutation()`
- `api.applications.updateStep.useMutation()` - Admin-only step management
- `api.applications.withdraw.useMutation()`
- `api.applications.submit.useMutation()`

**Rationale:**
- Office kanban board is admin UI
- Admin can update application steps (not in public SDK)
- Complex workflow management
- Multi-role permissions (admin, recruiter, team lead)

**Note:** While public SDK has application operations, office uses **admin-specific methods** like `updateStep` that are intentionally not in the SDK.

---

### 3. Teams Analytics & Management (9 files)

**Location:** `packages/scf-core/features/office/teams/`

**Files:**
- components/TeamActivityFeed.tsx
- components/TeamAnalyticsCharts.tsx
- components/TeamAnalyticsSummary.tsx
- components/TeamAutomationSettings.tsx
- components/TeamCommentThread.tsx
- components/TeamInvitationsList.tsx
- components/TeamJobsList.tsx
- components/TeamMembersList.tsx
- OfficeTeamsList.tsx

**tRPC Operations:**
- `api.teams.analytics.overview.useQuery()` - Admin analytics
- `api.teams.analytics.workload.useQuery()` - Admin analytics
- `api.teams.getActivityFeed.useQuery()` - Admin activity tracking
- `api.teams.getComments.useQuery()` - Internal comments
- `api.teams.addComment.useMutation()` - Internal comments

**Rationale:**
- **Analytics are admin-only** - not in public SDK
- Activity feeds are internal tooling
- Comment threads are internal collaboration
- Complex aggregations and metrics

**Note:** Public SDK has team CRUD operations, but office uses **admin-specific analytics and internal collaboration features**.

---

### 4. Jobs Management (2 files)

**Location:** `packages/scf-core/features/office/`

**Files:**
- office-jobs-list.tsx
- components/JobForm.tsx

**tRPC Operations:**
- `api.jobs.list.useQuery()` - Could use SDK
- `api.jobs.create.useMutation()` - Could use SDK
- `api.jobs.update.useMutation()` - Could use SDK

**Rationale:**
- Office job management has admin permissions
- Currently uses tRPC but **could potentially migrate to SDK**
- Low priority for migration

**Migration Potential:** 🟡 Medium - Could use SDK with admin checks

---

### 5. User Administration (2 files)

**Location:** `packages/scf-core/features/office/`

**Files:**
- office-users-list.tsx
- components/UserForm.tsx

**tRPC Operations:**
- `api.office.users.listAll.useQuery()` - Admin user listing
- `api.office.users.update.useMutation()` - Admin user updates
- `api.office.users.deactivate.useMutation()` - Admin-only

**Rationale:**
- Admin-only user management
- Not intended for public API
- Complex permission requirements

---

### 6. Organizations Administration (2 files)

**Location:** `packages/scf-core/features/office/`

**Files:**
- office-organizations-list.tsx
- components/OrganizationForm.tsx

**tRPC Operations:**
- `api.organizations.listAll.useQuery()` - Admin listing (all orgs)
- `api.organizations.getAnalytics.useQuery()` - Admin analytics

**Rationale:**
- Admin can see **all** organizations (SDK shows only user's orgs)
- Analytics are admin-only
- Complex aggregations

**Note:** Public SDK has organization operations, but office uses **admin-specific methods** like `listAll` and `getAnalytics`.

---

### 7. Universities Management (1 file)

**Location:** `packages/scf-core/features/office/`

**Files:**
- office-universities-form.tsx

**tRPC Operations:**
- `api.office.universities.searchUniversities.useQuery()`
- `api.office.universities.create.useMutation()`
- `api.office.universities.update.useMutation()`

**Rationale:**
- Admin-only university database management
- Not user-facing
- Rapid CRUD operations

---

### 8. Payments Administration (6 files)

**Location:** `packages/scf-core/features/office/payments/`

**Files:**
- OfficeTransactionHistory.tsx
- OrganizationCreditsPanel.tsx
- OrganizationPaymentMethodsPanel.tsx
- SetupIntentForm.tsx
- TransactionReceiptModal.tsx
- office-payment-analytics.tsx

**tRPC Operations:**
- `api.payments.listTransactions.useQuery()` - Admin view
- `api.payments.getAnalytics.useQuery()` - Admin analytics
- `api.stripeSettings.getConfig.useQuery()` - Admin config
- `api.successFees.calculateFees.useQuery()` - Admin calculations

**Rationale:**
- Payment admin requires Stripe integration complexity
- Admin-only financial operations
- PCI compliance considerations
- Complex transaction workflows

---

### 9. Settings & Configuration (5 files)

**Location:** `packages/scf-core/features/office/`

**Files:**
- office-storage-dashboard.tsx
- office-ccpa-dashboard.tsx
- office-notifications-console.tsx
- settings/StripeSettingsPage.tsx
- components/OrganizationProjectPrivacySettings.tsx

**tRPC Operations:**
- `api.ccpa.listRequests.useQuery()` - Admin compliance
- `api.documents.getStorageAnalytics.useQuery()` - Admin analytics
- `api.notifications.getAdminConsole.useQuery()` - Admin notifications
- `api.stripeSettings.update.useMutation()` - Admin-only

**Rationale:**
- Admin-only configuration
- Compliance dashboards
- Analytics and monitoring
- Not user-facing

---

### 10. Projects (2 files)

**Location:** `packages/scf-core/features/office/projects/`

**Files:**
- OfficeProjectsList.tsx
- components/ProjectForm.tsx

**tRPC Operations:**
- `api.projects.listAll.useQuery()` - Admin view (all projects)
- `api.projects.getAnalytics.useQuery()` - Admin analytics

**Rationale:**
- Admin can see **all** projects across organizations
- Analytics are admin-only
- Complex permissions

**Note:** Public SDK has project operations for user's own projects, but office uses **admin-specific methods**.

---

## Decision Matrix: SDK vs tRPC for Office Operations

| Operation Type | Use SDK? | Use tRPC? | Rationale |
|----------------|----------|-----------|-----------|
| **List all resources** (admin view) | ❌ | ✅ | Admin needs to see across all users/orgs |
| **Analytics & metrics** | ❌ | ✅ | Admin-only aggregations, not user-facing |
| **Complex workflows** | ❌ | ✅ | Multi-step processes, state machines |
| **Internal comments/activity** | ❌ | ✅ | Internal collaboration, not public |
| **Admin-only mutations** (ban, deactivate) | ❌ | ✅ | Destructive operations, high permissions |
| **Configuration & settings** | ❌ | ✅ | System-level configuration |
| **Compliance dashboards** | ❌ | ✅ | Legal requirements, audit trails |
| **User CRUD on own resources** | ✅ | ❌ | User-facing operations |
| **Public listings** (published jobs) | ✅ | ❌ | High traffic, cacheable |
| **Simple read operations** | 🟡 | 🟡 | Case-by-case, consider traffic |

---

## Migration Candidates (Low Priority)

Some office operations **could** potentially use SDK with admin permission checks:

### 1. Office Jobs List (Low Priority)
**Current:** `api.jobs.list.useQuery()`
**Could Use:** `useJobs()` from SDK with admin filters

**Pros:**
- SDK already has job listing
- Same data structure

**Cons:**
- Office needs admin filters (unpublished, all orgs)
- Low benefit, adds complexity
- Works fine in tRPC

**Decision:** ⏸️ Keep in tRPC (not worth migrating)

---

### 2. Office Applications (Very Low Priority)
**Current:** `api.applications.updateStep.useMutation()`
**Could Use:** SDK doesn't have admin step management

**Decision:** ❌ Stay in tRPC (admin-specific operations)

---

### 3. Office Teams Analytics (No Migration)
**Current:** `api.teams.analytics.*`
**Could Use:** SDK doesn't have analytics

**Decision:** ❌ Stay in tRPC (admin analytics not in SDK)

---

## Architecture Guidelines

### When Adding New Office Features

**Use tRPC if:**
- ✅ Admin-only operation
- ✅ Needs to see across all users/organizations
- ✅ Analytics, metrics, aggregations
- ✅ Internal collaboration (comments, activity feeds)
- ✅ Configuration, settings
- ✅ Compliance, audit trails
- ✅ Complex multi-step workflows

**Use SDK if:**
- ❌ User-facing operation
- ❌ Should be accessible via API keys
- ❌ Simple CRUD on user's own data
- ❌ High traffic, needs caching
- ❌ External developers would use it

**Rule of Thumb:** If you're building it in `/features/office/`, it stays in tRPC.

---

## Verification

### Count Office tRPC Usage
```bash
# Should be ~36 files
grep -r "from '@scf/core/utils/api'" packages/scf-core/features/office --include="*.tsx" --include="*.ts" | grep -v test | wc -l
```

### Office Operations Are Intentional
All 36 office files using tRPC are **intentionally** not migrated to SDK. This is part of the hybrid architecture where:
- **90-95% of user-facing features** use SDK
- **Admin/office operations** use tRPC

---

## Summary

**Office Files Using tRPC:** 36
**Should Migrate to SDK:** 0
**Rationale:** Admin operations, internal tooling

**Office represents ~38% of remaining tRPC usage** (36/94 files), which is expected and by design.

The remaining ~58 files are:
- Compliance/legal operations (~15 files)
- File operations (~10 files)
- Third-party integrations (~15 files)
- Infrastructure (~10 files)
- Background checks admin (~5 files)
- Organizations admin (~3 files)

All documented in [TRPC_ARCHITECTURE.md](./TRPC_ARCHITECTURE.md).

---

**Document Status:** Production
**Last Review:** February 2026
**Next Review:** May 2026 (quarterly)
