# tRPC Architecture: Intentional Usage Boundaries

**Last Updated:** February 2026
**Status:** Production Architecture Documentation

## Overview

While Scaffald has achieved **90-95% SDK coverage** for user-facing features, certain operations intentionally remain in tRPC due to architectural, security, or operational constraints. This document defines which routers stay in tRPC and why.

## Philosophy

**SDK is for:** Public-facing APIs, user data operations, portable functionality
**tRPC is for:** Admin tooling, compliance operations, file handling, internal infrastructure

---

## Routers Staying in tRPC

### Category 1: Admin & Office Operations (~30 files)

**Rationale:** Internal tooling with complex permissions, not intended for public API consumption.

#### `office` Router
- **Files:** ~25 files in `packages/scf-core/features/office/*`
- **Operations:**
  - CMS content management (7 files)
  - Office job/application analytics
  - Team management dashboards
  - User administration
  - University management
- **Why tRPC:**
  - Complex multi-role permissions
  - Internal admin UI only
  - Rapid development without API versioning
  - Not exposed via API keys

**Example Files:**
```
packages/scf-core/features/office/cms/
  ├── office-cms-create.tsx
  ├── office-cms-edit.tsx
  └── office-cms-list.tsx

packages/scf-core/features/office/
  ├── office-jobs-list.tsx
  ├── office-users-list.tsx
  └── office-universities-form.tsx
```

**tRPC Methods Used:**
- `api.office.cms.listSlides.useQuery()`
- `api.office.users.listAll.useQuery()`
- `api.office.universities.searchUniversities.useQuery()`

---

### Category 2: Payments & Financial Operations (~12 files)

**Rationale:** Stripe integration, PCI compliance, complex transaction flows.

#### `payments` Router
- **Files:** 6 files in `packages/scf-core/features/office/payments/*`
- **Operations:**
  - Stripe payment intent creation
  - Subscription management
  - Transaction history (admin view)
  - Payment method management
- **Why tRPC:**
  - Stripe API integration complexity
  - PCI compliance requirements
  - Server-side only operations
  - Financial audit trails

#### `stripeSettings` Router
- **Files:** 2 files in `packages/scf-core/features/office/settings/*`
- **Operations:**
  - Stripe account configuration
  - Webhook endpoint management
  - API key rotation
- **Why tRPC:**
  - Admin-only sensitive operations
  - Stripe OAuth flows
  - Not user-facing

#### `successFees` Router
- **Files:** 4 files (billing calculations)
- **Operations:**
  - Success fee calculations
  - Organization billing
  - Invoice generation
- **Why tRPC:**
  - Complex business logic
  - Admin financial operations

**Example Files:**
```
packages/scf-core/features/office/payments/
  ├── OfficeTransactionHistory.tsx
  ├── OrganizationCreditsPanel.tsx
  └── SetupIntentForm.tsx
```

**tRPC Methods Used:**
- `api.payments.createPaymentIntent.useMutation()`
- `api.stripeSettings.getConfig.useQuery()`
- `api.successFees.calculateFees.useQuery()`

---

### Category 3: Compliance & Legal (~15 files)

**Rationale:** Regulatory requirements, audit trails, legal compliance.

#### `ccpa` Router
- **Files:** 10 files in `packages/scf-core/features/privacy/*`, `packages/scf-core/features/office/*`
- **Operations:**
  - CCPA data requests (access, deletion, opt-out)
  - Compliance reporting
  - Data export generation
  - Privacy audit logs
- **Why tRPC:**
  - Legal compliance workflows
  - Complex multi-step processes
  - Audit trail requirements
  - State machine patterns

#### `accountDeletion` Router
- **Files:** 2 files in `packages/scf-core/features/profile/*`
- **Operations:**
  - Account deletion requests
  - Data retention policies
  - Cascading deletion workflows
- **Why tRPC:**
  - Irreversible operations
  - Legal compliance
  - Complex cleanup tasks

#### `legalAgreements` Router
- **Files:** 3 files in `packages/scf-core/features/auth/*`
- **Operations:**
  - Terms of Service acceptance
  - Privacy Policy tracking
  - Legal agreement versioning
- **Why tRPC:**
  - Legal audit requirements
  - Version control complexity

**Example Files:**
```
packages/scf-core/features/privacy/
  ├── PrivacyDashboard.tsx
  ├── components/DataRequestForm.tsx
  └── components/OptOutManager.tsx

packages/scf-core/features/office/
  └── office-ccpa-dashboard.tsx
```

**tRPC Methods Used:**
- `api.ccpa.createRequest.useMutation()`
- `api.accountDeletion.requestDeletion.useMutation()`
- `api.legalAgreements.acceptTerms.useMutation()`

---

### Category 4: File Operations & Processing (~10 files)

**Rationale:** Streaming, S3 operations, file parsing complexity.

#### `documents` Router
- **Files:** 5 files in `packages/scf-core/features/profile/*`, `packages/scf-core/features/work-logs/*`
- **Operations:**
  - S3 upload/download
  - File metadata management
  - Storage quota tracking
  - Document versioning
- **Why tRPC:**
  - Streaming file uploads
  - S3 presigned URL generation
  - Complex file operations

#### `resume` Router
- **Files:** 7 files in `packages/scf-core/features/resume/*`, `packages/supabase/functions/trpc/routers/resume.router.ts`
- **Operations:**
  - Resume PDF parsing
  - Text extraction (OCR)
  - Profile data extraction
  - AI-powered parsing
- **Why tRPC:**
  - File processing pipelines
  - External service integration (pdf-lib, Anthropic)
  - Long-running operations
  - Complex error handling

**Example Files:**
```
packages/scf-core/features/resume/
  ├── components/ResumeUploadModal.tsx
  └── components/ResumeWizard.tsx

packages/scf-core/features/profile/widgets/
  └── StoragePreferencesWidget.tsx
```

**tRPC Methods Used:**
- `api.documents.getUploadUrl.useMutation()`
- `api.resume.parseResume.useMutation()`
- `api.resume.extractProfileData.useMutation()`

---

### Category 5: Third-Party Integrations (~15 files)

**Rationale:** External API complexity, OAuth flows, vendor-specific logic.

#### `oauth` Router (OAuth Provider)
- **Files:** 11 files in `packages/scf-core/features/oauth/*`
- **Operations:**
  - OAuth 2.0 provider implementation
  - Authorization code flow
  - Access token management
  - Client registration
- **Why tRPC:**
  - Complex OAuth state management
  - Security-sensitive operations
  - Not user-facing (developer portal)

#### `idVerification` Router
- **Files:** 4 files in `packages/scf-core/features/id-verification/*`
- **Operations:**
  - Persona identity verification
  - KYC (Know Your Customer) flows
  - Government ID validation
  - Liveness checks
- **Why tRPC:**
  - Persona API integration
  - Webhook handling
  - Complex verification flows
  - Admin review processes

**Example Files:**
```
packages/scf-core/features/oauth/
  ├── components/ConsentScreen.tsx
  ├── components/OAuthAppList.tsx
  └── components/AuthorizedAppsList.tsx

packages/scf-core/features/id-verification/
  ├── components/IdVerificationFlow.tsx
  └── components/IdVerificationAdminPage.tsx
```

**tRPC Methods Used:**
- `api.oauth.authorize.useMutation()`
- `api.idVerification.createVerification.useMutation()`
- `api.idVerification.checkStatus.useQuery()`

---

### Category 6: Infrastructure & Utilities (~10 files)

**Rationale:** Low-level infrastructure, internal tooling, legacy integrations.

#### `auth` Router
- **Files:** 3 files in `packages/scf-core/features/auth/*`
- **Operations:**
  - Magic link generation
  - Supabase OTP flows
  - Session management
- **Why tRPC:**
  - Supabase-specific integration
  - Auth state management
  - Not public API operations

#### `map` Router
- **Files:** 3 files in `packages/scf-core/features/discover/*`
- **Operations:**
  - Mapbox geocoding
  - Spatial queries
  - Site boundary validation
- **Why tRPC:**
  - Mapbox API integration
  - GeoJSON processing
  - Complex spatial operations

#### `cms` Router
- **Files:** 7 files (content management system)
- **Operations:**
  - CMS slide management
  - Content versioning
  - Media library
- **Why tRPC:**
  - Admin-only operations
  - Complex content workflows

#### `news` Router
- **Files:** 1 file (`packages/scf-core/features/news/NewsWidget.tsx`)
- **Operations:**
  - News feed aggregation
  - RSS parsing
- **Why tRPC:**
  - Low priority feature
  - External RSS integration

#### `feedback` Router
- **Files:** 1 file (`packages/scf-core/features/feedback/FeedbackWidget.tsx`)
- **Operations:**
  - User feedback submission
  - Feature requests
- **Why tRPC:**
  - Internal feedback collection
  - Low traffic

**Example Files:**
```
packages/scf-core/features/auth/
  └── components/SuccessView.tsx

packages/scf-core/features/discover/
  └── discover-map-screen.tsx

packages/scf-core/features/news/
  └── NewsWidget.tsx
```

**tRPC Methods Used:**
- `api.auth.sendMagicLink.useMutation()`
- `api.map.geocode.useQuery()`
- `api.cms.listSlides.useQuery()`
- `api.news.getLatest.useQuery()`
- `api.feedback.submit.useMutation()`

---

### Category 7: Background Checks (Admin) (~5 files)

**Rationale:** Admin review, manual approval workflows, compliance.

#### `backgroundChecks` Router (Admin Operations Only)
- **Files:** 5 files in `packages/scf-core/features/background-check/admin/*`
- **Operations:**
  - Admin check review
  - Dispute resolution
  - Catalog management
  - Compliance metrics
- **Why tRPC:**
  - Manual review workflows
  - Admin-only operations
  - Complex approval processes

**Note:** User-facing background check operations (request, view status, dispute) use **SDK** via `BackgroundChecks` resource.

**Example Files:**
```
packages/scf-core/features/background-check/admin/
  ├── AdminBackgroundChecksPage.tsx
  ├── AdminCatalogManager.tsx
  ├── AdminCheckReviewDialog.tsx
  └── AdminDisputeResolutionDialog.tsx
```

**tRPC Methods Used:**
- `api.backgroundChecks.adminList.useQuery()`
- `api.backgroundChecks.reviewCheck.useMutation()`
- `api.backgroundChecks.resolveDispute.useMutation()`

---

### Category 8: Organizations (Admin) (~5 files)

**Rationale:** Admin analytics, bulk operations, internal tooling.

#### `organizations` Router (Admin Operations Only)
- **Files:** 5 files in `packages/scf-core/features/office/*`
- **Operations:**
  - Admin organization list (all orgs)
  - Organization analytics
  - Bulk operations
  - Compliance reporting
- **Why tRPC:**
  - Admin-only operations
  - Complex aggregations
  - Internal dashboards

**Note:** User-facing organization operations (view, request, update) use **SDK** via `Organizations` resource.

**Example Files:**
```
packages/scf-core/features/office/
  └── office-organizations-list.tsx
```

**tRPC Methods Used:**
- `api.organizations.listAll.useQuery()` (admin only)
- `api.organizations.getAnalytics.useQuery()` (admin only)

---

### Category 9: Teams (Admin) (~3 files)

**Rationale:** Team analytics, admin dashboards.

#### `teams` Router (Admin Operations Only)
- **Files:** 3 files in `packages/scf-core/features/office/teams/*`
- **Operations:**
  - Team analytics charts
  - Admin team dashboards
  - Bulk team operations
- **Why tRPC:**
  - Admin-only analytics
  - Complex aggregations

**Note:** User-facing team operations (CRUD, invitations, members) use **SDK** via `Teams` resource.

**Example Files:**
```
packages/scf-core/features/office/teams/
  └── components/TeamAnalyticsCharts.tsx
```

**tRPC Methods Used:**
- `api.teams.getAnalytics.useQuery()` (admin only)

---

## Summary Statistics

### By Category

| Category | Routers | Files | Rationale |
|----------|---------|-------|-----------|
| Admin/Office | 1 | ~25 | Internal tooling |
| Payments | 3 | ~12 | Financial compliance |
| Compliance | 3 | ~15 | Legal requirements |
| File Operations | 2 | ~10 | Streaming, S3 |
| 3rd Party | 2 | ~15 | OAuth, ID verification |
| Infrastructure | 5 | ~10 | Low-level utilities |
| Background Checks (Admin) | 1 (partial) | ~5 | Manual review |
| Organizations (Admin) | 1 (partial) | ~5 | Admin analytics |
| Teams (Admin) | 1 (partial) | ~3 | Admin analytics |
| **Total** | **16-19** | **~100** | **Mixed** |

### Hybrid Routers (Partial SDK, Partial tRPC)

Some routers have **both** SDK resources (user-facing) and tRPC operations (admin):

- **`backgroundChecks`**: User ops → SDK, Admin ops → tRPC
- **`organizations`**: User ops → SDK, Admin ops → tRPC
- **`teams`**: User ops → SDK, Admin ops → tRPC

---

## Decision Tree

Use this decision tree when adding new features:

```
Does the operation involve...

├─ Public-facing user data (profiles, jobs, applications)?
│  └─ YES → Use SDK
│
├─ Admin/office internal tooling?
│  └─ YES → Use tRPC
│
├─ File operations (upload, streaming, S3)?
│  └─ YES → Use tRPC
│
├─ Compliance/legal workflows (CCPA, account deletion)?
│  └─ YES → Use tRPC
│
├─ Third-party integration (OAuth provider, Persona, Stripe)?
│  └─ YES → Use tRPC
│
├─ Payment processing?
│  └─ YES → Use tRPC
│
├─ Simple CRUD on user data?
│  └─ YES → Use SDK
│
└─ Uncertain?
   └─ Default to SDK, discuss with team
```

---

## Migration Guidance

### When to Migrate from tRPC to SDK

A router **should migrate to SDK** if:
- ✅ User-facing public API operation
- ✅ Simple request/response patterns
- ✅ Should be accessible via API keys
- ✅ High traffic, core user flows
- ✅ Read/write user data (profiles, jobs, applications)

### When to Keep in tRPC

A router **should stay in tRPC** if:
- ❌ Admin/office internal tooling
- ❌ Complex state management (OAuth flows)
- ❌ File operations (streaming, S3)
- ❌ Compliance/regulatory (CCPA, legal)
- ❌ Third-party integrations (Stripe, Mapbox, Persona)
- ❌ Real-time subscriptions
- ❌ Server-side cleanup tasks

---

## Architecture Validation

### Current State (February 2026)

**SDK Coverage:**
- **34 SDK resources** (100% of planned public-facing features)
- **728/728 unit tests passing**
- **~95% SDK usage for user-facing features**

**tRPC Usage:**
- **~100 files** using tRPC (intentionally)
- **16-19 routers** staying in tRPC
- **~5-10% of overall codebase** (by design)

**Hybrid Architecture:**
- **Overall:** 90-95% SDK usage (target achieved ✅)
- **User-facing:** 95-98% SDK usage
- **Admin/internal:** 10-20% SDK usage (by design)

---

## Maintenance

### Adding New Features

**Before creating a new tRPC router, ask:**
1. Is this user-facing or admin-only?
2. Should this be accessible via API keys?
3. Does this involve file operations or third-party integrations?
4. Is this a simple CRUD operation or complex workflow?

**If user-facing → Create SDK resource**
**If admin/complex → Use tRPC**

### Monitoring

Track SDK vs tRPC usage quarterly:
```bash
# Count tRPC imports
grep -r "from '@scf/core/utils/api'" packages/scf-core apps/scaffald --include="*.tsx" --include="*.ts" | wc -l

# Count SDK hook imports
grep -r "from '@scf/core/utils/.*-sdk-hooks'" packages/scf-core apps/scaffald --include="*.tsx" --include="*.ts" | wc -l
```

**Target:** Maintain ~90-95% SDK usage overall, ~95-98% for user-facing features.

---

## Related Documentation

- [SDK Decision Framework](./SDK_DECISION_FRAMEWORK.md) - Detailed decision criteria
- [Scaffald SDK README](../packages/scaffald-sdk/README.md) - SDK overview
- [Migration History](../.claude/projects/-Users-clay-Development-UNI-Construct/memory/MEMORY.md) - Past migrations

---

**Document Status:** Production
**Last Review:** February 2026
**Next Review:** May 2026 (quarterly)
