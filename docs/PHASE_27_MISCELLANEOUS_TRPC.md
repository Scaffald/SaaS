# Phase 27: Miscellaneous tRPC Usage

**Last Updated:** February 12, 2026
**Purpose:** Document remaining tRPC usage outside major feature categories

## Overview

After completing Phases 21-26, the remaining tRPC usage falls into 5 categories:
1. **Privacy/CCPA** (3 files) - Compliance operations
2. **Map/Location** (2 files) - Mapbox integration
3. **Organizations** (3 files) - Blocked on Phase 22 (needs REST API)
4. **OAuth** (5 files) - OAuth provider operations
5. **Miscellaneous** (5 files) - Auth, resume, news, feedback, profile-wizard

**Decision:** All files stay in tRPC (infrastructure, compliance, 3rd party integrations)

---

## Privacy/CCPA Operations (3 files) ✅ Stay in tRPC

### Rationale

CCPA compliance operations are highly regulated and require:
- Audit trails for legal compliance
- Complex regulatory workflows
- Data deletion rights (GDPR/CCPA)
- Legal/regulatory category
- Not user-facing API operations

**Category:** Compliance & Legal

---

### 1. OptOutManager.tsx ✅ Stay in tRPC

**File:** `packages/scf-core/features/privacy/components/OptOutManager.tsx`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

const { data: optOutData } = api.ccpa.getMyOptOuts.useQuery()
const setOptOut = api.ccpa.setOptOut.useMutation()
```

**Router:** `ccpa` (compliance operations)

**Decision:** ✅ **Keep in tRPC** - CCPA compliance operations

---

### 2. DataRequestForm.tsx ✅ Stay in tRPC

**File:** `packages/scf-core/features/privacy/components/DataRequestForm.tsx`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

const requestMutation = api.ccpa.createDataRequest.useMutation()
```

**Router:** `ccpa` (compliance operations)

**Decision:** ✅ **Keep in tRPC** - CCPA data request operations

---

### 3. PrivacyDashboard.tsx ✅ Stay in tRPC

**File:** `packages/scf-core/features/privacy/PrivacyDashboard.tsx`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

const { data: requests } = api.ccpa.getMyDataRequests.useQuery()
const { data: optOuts } = api.ccpa.getMyOptOuts.useQuery()
```

**Router:** `ccpa` (compliance operations)

**Decision:** ✅ **Keep in tRPC** - CCPA dashboard (compliance)

---

## Map/Location Integration (2 files) ✅ Stay in tRPC

### Rationale

Map operations integrate with Mapbox API and require:
- Geospatial queries (PostGIS)
- Complex location calculations
- 3rd party API integration
- Real-time location data
- Not portable to other systems

**Category:** 3rd Party Integrations

---

### 4. useLocationResultCounts.ts ✅ Stay in tRPC

**File:** `packages/scf-core/features/discover/hooks/useLocationResultCounts.ts`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

const query = api.map.getLocationCounts.useQuery({
  bounds, // Mapbox bounds
  filters,
})
```

**Router:** `map` (Mapbox integration)

**Decision:** ✅ **Keep in tRPC** - Mapbox/geospatial operations

---

### 5. useFindNearestResults.ts ✅ Stay in tRPC

**File:** `packages/scf-core/features/discover/hooks/useFindNearestResults.ts`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

const query = api.map.findNearestResults.useQuery({
  latitude,
  longitude,
  radius,
})
```

**Router:** `map` (Mapbox integration)

**Decision:** ✅ **Keep in tRPC** - Geospatial queries

---

## OAuth Provider Operations (5 files) ✅ Stay in tRPC

### Rationale

OAuth provider operations require:
- Complex OAuth flows (authorization code, implicit, etc.)
- Token management (access, refresh)
- Security operations
- Provider configuration
- Not user-facing operations (developer/admin)

**Category:** Infrastructure & Security

**Files:**
- `packages/scf-core/features/oauth/components/AppRegistrationForm.tsx`
- `packages/scf-core/features/oauth/components/AuthorizedAppsList.tsx`
- `packages/scf-core/features/oauth/components/ConsentScreen.tsx`
- `packages/scf-core/features/oauth/components/OAuthAppDetail.tsx`
- `packages/scf-core/features/oauth/components/OAuthAppList.tsx`

**Router:** `oauth` (OAuth provider operations)

**Decision:** ✅ **Keep in tRPC** - OAuth provider infrastructure

---

## ID Verification Operations (4 files) ✅ Stay in tRPC

### Rationale

ID verification integrates with Persona (3rd party KYC provider):
- 3rd party integration
- Compliance/regulatory
- Webhook handling
- Admin review workflows

**Category:** 3rd Party Integrations & Compliance

**Files:**
- `packages/scf-core/features/id-verification/components/IdVerificationAdminPage.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationFlow.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationRequestPanel.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationWidget.tsx`

**Router:** `idVerification` (Persona integration)

**Decision:** ✅ **Keep in tRPC** - 3rd party integration

---

## Resume/Document Processing (3 files) ✅ Stay in tRPC

### Rationale

Resume operations involve:
- File upload/processing
- PDF text extraction
- AI parsing (OpenAI)
- Large file handling
- Complex file operations

**Category:** File Operations

**Files:**
- `packages/scf-core/features/resume/components/ResumeUploadModal.tsx`
- `packages/scf-core/features/resume/components/ResumeStepsSidebar.tsx`
- `packages/scf-core/features/resume/hooks/useResumeUpload.ts`

**Router:** `resume` (file operations)

**Decision:** ✅ **Keep in tRPC** - File operations

---

## Auth Operations (3 files) ✅ Stay in tRPC

### Rationale

Auth operations integrate with Supabase:
- Magic link authentication
- OTP (one-time password)
- Session management
- Supabase-specific flows

**Category:** Infrastructure

**Files:**
- `packages/scf-core/features/auth/components/SuccessView.tsx`
- `packages/scf-core/features/auth/layout.web.tsx`
- `packages/scf-core/features/auth/welcome-screen.tsx`

**Router:** `auth` (Supabase integration)

**Decision:** ✅ **Keep in tRPC** - Auth infrastructure

---

## Organizations (3 files) ⏸️ Blocked on Phase 22

### Rationale

Organization operations need REST API endpoints before migration:
- `createOrganizationRequest` - User requests to create organization
- `getReminderSettings` - Organization inquiry reminder settings
- `updateReminderSettings` - Update reminder settings

**Status:** Blocked on Phase 22 (backend REST API needed)

**Files:**
- `packages/scf-core/features/discover/components/AddOrganizationWidget.tsx`
- `packages/scf-core/features/inquiries/components/InquiryReminderSettings.tsx`
- `packages/scf-core/features/organizations/components/OrganizationRequestForm.tsx`

**Router:** `organizations` (user-facing operations)

**Decision:** ⏸️ **Blocked** - Needs REST API endpoints

---

## Miscellaneous (5 files)

### 6. useIPIPResults.ts (Personality Assessment) ✅ Documented TODO

**File:** `packages/scf-core/features/ipip-assessment/hooks/useIPIPResults.ts`

**tRPC Usage:**
```typescript
import { api } from '@scf/core/utils/api'

// TODO: Migrate to SDK when archetype endpoint is added
const { data: archetype } = api.personalityAssessment.getArchetype.useQuery()
```

**Status:** Documented in Phase 21 as TODO
- Low priority (archetype display only)
- Non-critical feature

**Decision:** ✅ **Documented TODO** - Low priority for SDK

---

### 7. News Hook (1 file) ✅ Stay in tRPC

**File:** `packages/scf-core/features/news/hooks/useNews.ts`

**Rationale:**
- Low traffic feature
- CMS integration
- Not critical user operation
- Internal content management

**Router:** `news` (CMS operations)

**Decision:** ✅ **Keep in tRPC** - Low priority CMS

---

### 8. Feedback Hook (1 file) ✅ Stay in tRPC

**File:** `packages/scf-core/features/feedback/hooks/useFeedback.ts`

**Rationale:**
- Low traffic feature
- Internal feedback system
- Not core user operation

**Router:** `feedback` (internal operations)

**Decision:** ✅ **Keep in tRPC** - Low priority internal

---

### 9. Profile Wizard Hook (1 file) ✅ Stay in tRPC

**File:** `packages/scf-core/features/profile-wizard/hooks/useProfileWizard.ts`

**Rationale:**
- Onboarding workflow state
- Complex wizard logic
- Session-specific state
- Not data persistence operation

**Router:** `profileWizard` (workflow state)

**Decision:** ✅ **Keep in tRPC** - Workflow state management

---

### 10. Payments Hook (1 file) ✅ Stay in tRPC

**File:** `packages/scf-core/features/payments/hooks/usePaymentMethods.ts`

**Rationale:**
- Stripe integration
- Payment operations
- Handled by dedicated payments category

**Router:** `payments` (Stripe operations)

**Decision:** ✅ **Keep in tRPC** - Payment infrastructure

---

## Summary

### Files by Category

| Category | Files | Migrate to SDK | Stay in tRPC | Blocked | Ratio |
|----------|-------|----------------|--------------|---------|-------|
| Privacy/CCPA | 3 | 0 | 3 | 0 | 0% → SDK |
| Map/Location | 2 | 0 | 2 | 0 | 0% → SDK |
| OAuth | 5 | 0 | 5 | 0 | 0% → SDK |
| ID Verification | 4 | 0 | 4 | 0 | 0% → SDK |
| Resume/Files | 3 | 0 | 3 | 0 | 0% → SDK |
| Auth | 3 | 0 | 3 | 0 | 0% → SDK |
| Organizations | 3 | 3 | 0 | 3 | 100% → SDK (blocked) |
| Miscellaneous | 5 | 0 | 5 | 0 | 0% → SDK |
| **Total** | **28** | **3** | **22** | **3** | **11% to migrate** |

### Migration Status

**✅ Documented as Staying in tRPC (22 files):**
- Privacy/CCPA: 3 files (compliance)
- Map/Location: 2 files (3rd party integration)
- OAuth: 5 files (infrastructure)
- ID Verification: 4 files (3rd party integration)
- Resume: 3 files (file operations)
- Auth: 3 files (infrastructure)
- Miscellaneous: 5 files (low priority, internal)

**⏸️ Blocked on Phase 22 (3 files):**
- Organizations: 3 files (needs REST API endpoints)

**📝 Documented TODO (1 file):**
- IPIP archetype: 1 file (low priority, non-critical)

---

## Architecture Patterns

### Infrastructure Operations → tRPC
```typescript
// ✅ GOOD: Infrastructure operations stay in tRPC
import { api } from '@scf/core/utils/api'

// Auth
const { data: session } = api.auth.getSession.useQuery()

// Map/Location
const { data: counts } = api.map.getLocationCounts.useQuery({ bounds })

// OAuth
const { data: apps } = api.oauth.listApps.useQuery()
```

### Compliance Operations → tRPC
```typescript
// ✅ GOOD: Compliance operations stay in tRPC
import { api } from '@scf/core/utils/api'

// CCPA
const { data: optOuts } = api.ccpa.getMyOptOuts.useQuery()
const setOptOut = api.ccpa.setOptOut.useMutation()

// ID Verification (Persona)
const { data: verification } = api.idVerification.getStatus.useQuery()
```

### 3rd Party Integrations → tRPC
```typescript
// ✅ GOOD: 3rd party integrations stay in tRPC
import { api } from '@scf/core/utils/api'

// Stripe
const { data: methods } = api.payments.listPaymentMethods.useQuery()

// Mapbox
const { data: nearest } = api.map.findNearestResults.useQuery({ lat, lng })

// Persona (KYC)
const { data: status } = api.idVerification.getStatus.useQuery()
```

---

## Verification

### Count Miscellaneous tRPC Usage
```bash
# Privacy/CCPA (should be 3)
grep -r "api\.ccpa\." packages/scf-core/features/privacy --include="*.tsx" --include="*.ts" | wc -l

# Map (should be 2)
grep -r "api\.map\." packages/scf-core/features/discover --include="*.tsx" --include="*.ts" | wc -l

# OAuth (should be 5)
grep -r "api\.oauth\." packages/scf-core/features/oauth --include="*.tsx" --include="*.ts" | wc -l

# Organizations (blocked on Phase 22)
grep -r "api\.organizations\." packages/scf-core/features --include="*.tsx" --include="*.ts" | grep -v office | grep -v __tests__ | wc -l
```

---

## Related Documentation

- [tRPC Architecture](./TRPC_ARCHITECTURE.md) - Overall tRPC usage guide
- [Office Router Strategy](./OFFICE_ROUTER_STRATEGY.md) - Office/admin operations
- [SDK Decision Framework](./SDK_DECISION_FRAMEWORK.md) - When to use SDK vs tRPC
- [Background Checks tRPC Usage](./BACKGROUND_CHECKS_TRPC_USAGE.md) - Background checks split
- [Profile Features tRPC Usage](./PROFILE_FEATURES_TRPC_USAGE.md) - Profile features split

---

**Phase 27 Status:** ✅ Complete (22 files documented, 3 files blocked on Phase 22)

**User-Facing Operations:** 0% require migration (all are infrastructure/compliance)

**Document Status:** Production
**Last Review:** February 12, 2026
**Next Review:** May 2026 (quarterly)
