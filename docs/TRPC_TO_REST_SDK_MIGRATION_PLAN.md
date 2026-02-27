# tRPC → REST/SDK Migration Plan

Exploration of the UNI-Construct monorepo for migrating remaining tRPC usage to REST/SDK. Generated from codebase analysis.

---

## 1. idVerification Router

**Source:** `packages/supabase/functions/trpc/routers/id-verification.router.ts`  
**Registered as:** `api.idVerification.*`  
**REST routes exist:** **None** – no id-verification routes in `packages/supabase/functions/api/routes/`

### Procedures

| Procedure | Type | Input | Output | Auth |
|-----------|------|-------|--------|------|
| `getPricing` | query | (none) | `{ id, name, description, priceCents, metadata }[]` | protected |
| `requestVerification` | mutation | `{ workerUserId: uuid, organizationId?: uuid, pricingId?: uuid }` | `{ paymentIntentId, clientSecret, amountCents, currency }` | protected |
| `confirmVerificationPayment` | mutation | `{ paymentIntentId: string }` | `{ id, badgeStatus, badgeExpiresAt? }` | protected |
| `getVerificationStatus` | query | `{ idVerificationId: uuid }` | `{ id, badgeStatus, badgeExpiresAt, personaStatus, verificationLevel, verifiedAt, metadata }` | protected |
| `getCurrentVerification` | query | `{ workerUserId?: uuid }` | `{ id, verificationLevel, badgeStatus, badgeExpiresAt, verifiedAt } \| null` | protected |
| `listVerifications` | query | `{ limit?, offset?, search?, status?, organizationId? }` | `{ items, total, hasMore, summary }` | office |
| `revokeVerification` | mutation | `{ idVerificationId: uuid, reason: string }` | `{ revoked: true }` | office |

### Consumers (scf-core)

| File | Procedures Used |
|------|-----------------|
| `features/id-verification/components/IdVerificationFlow.tsx` | `getPricing`, `getCurrentVerification`, `requestVerification`, `confirmVerificationPayment` |
| `features/id-verification/components/IdVerificationRequestPanel.tsx` | `getPricing`, `requestVerification`, `confirmVerificationPayment` |
| `features/id-verification/components/IdVerificationAdminPage.tsx` | `listVerifications` |
| `features/id-verification/components/IdVerificationWidget.tsx` | `getCurrentVerification` |

### Migration Notes

- SDK matrix indicates "Staying in tRPC" for provider integration (Persona API, Stripe).
- No REST route exists; migration would require new REST endpoints or SDK resource.
- Integrations: Persona (inquiries), Stripe (payments), Supabase (core tables).

---

## 2. Office – listJobs

**Source:** `packages/supabase/functions/trpc/routers/office.router.ts`  
**Procedure:** `api.office.listJobs`

### listJobs Procedure

| Property | Value |
|----------|-------|
| **Type** | query |
| **Auth** | office (super admin or org member with access) |
| **Input** | `{ organization_id?: uuid, status?: 'draft' \| 'open' \| 'paused' \| 'closed', team_id?: uuid, myTeamsOnly?: boolean, limit?: 1–100, offset?: 0+ }` |
| **Output** | `{ jobs, total }` – jobs include organization, team assignments, created_by |

### REST Jobs Coverage

**File:** `packages/supabase/functions/api/routes/jobs.ts`

| REST Endpoint | Purpose | Overlap with listJobs |
|---------------|---------|------------------------|
| `GET /v1/jobs` | List published jobs | Different: public `status=published`, no org/team filtering |
| `GET /v1/jobs/slug/:slug` | Job by slug | Different |
| Other job routes | CRUD, similar jobs, etc. | Different use case |

**Conclusion:** REST `/v1/jobs` is public discovery (published jobs). `office.listJobs` is admin/office: drafts, org/team filters, `myTeamsOnly`. No REST equivalent; separate admin endpoint needed.

### Consumers

| File | Usage |
|------|-------|
| `features/background-check/organization/OrganizationBackgroundCheckRequestForm.tsx` | `api.office.listJobs.useQuery({ organization_id, ... })` |
| `features/office/office-jobs-list.tsx` | `api.office.listJobs.useQuery({ limit, myTeamsOnly, status })` |
| `apps/scaffald/app/office/cms/teams/[id]/index.tsx` | `api.office.listJobs.useQuery(...)` |

---

## 3. Profile (api.profile.*)

**Source:** `packages/supabase/functions/trpc/routers/profile/`  
**Structure:** Nested routers – `api.profile.general`, `api.profile.skills`, `api.profile.skillsMultiTaxonomy`, etc.

### Profile Sub-Routers

| Sub-Router | SDK/REST Status | Notes |
|------------|-----------------|-------|
| `general` | Migrated | `profiles`, `user-profiles` REST |
| `employment` | Migrated | `employment` REST |
| `experience` | Migrated | `experience` REST |
| `education` | Migrated | `education` REST |
| `skills` | Migrated | `skills` REST |
| `skillsMultiTaxonomy` | Migrated | `skills` REST |
| `certifications` | Migrated | `certifications` REST |
| `widgets` | Migrated | `profile-widgets` REST |
| `vanity` | Migrated | profiles REST |
| `import` | Migrated | `profile-import` REST |
| `completion` | Migrated | `profile-completion` REST |
| `avatar` | tRPC only | File uploads (avatar) |

### Remaining tRPC Consumers (profile)

| Pattern | Location | Notes |
|---------|----------|-------|
| `api.profile.general.get` | `utils/api.ts` (example) | Likely replaced by SDK in real usage |
| `api.profile.skills.addSkill` | `utils/api.ts` (example) | Likely replaced by SDK |
| `api.profile.skillsMultiTaxonomy.getUserSkills` | `README-TWO-COLUMN-PATTERN.md` | Docs only |
| `api.profile.getGeneral` | `README.md` | Docs only |

### Admin Profile (api.office.* profile-related)

| Procedure | Consumer |
|-----------|----------|
| `api.office.getUserGeneral` | `GeneralProfileSection.tsx` (admin mode) |
| `api.office.updateUserGeneral` | `GeneralProfileSection.tsx` |
| `api.office.getUserEmployment` | `EmploymentSection.tsx` (admin mode) |
| `api.office.updateUserEmployment` | `EmploymentSection.tsx` |

### Conclusion

- Most `api.profile.*` usage is migrated to REST/SDK.
- Remaining references are mostly docs/examples.
- Admin profile flows (`api.office.getUserGeneral`, `getUserEmployment`, etc.) are still tRPC.

---

## 4. Discover

**No dedicated `api.discover` router.** Discovery is provided by:

| Router / Source | Procedures | REST Equivalent |
|-----------------|------------|-----------------|
| `api.workers` (tRPC) | `getWorkers`, `getWorkerById` | `GET /v1/workers` (REST) |
| `useTalentProfiles` (scf-core) | Direct Supabase | N/A – uses `v_profile_search` + `v_id_verification_latest` |

### workers tRPC Router

**Source:** `packages/supabase/functions/trpc/routers/workers.router.ts`

| Procedure | Input | Output | REST |
|-----------|-------|--------|------|
| `getWorkers` | `{ search?, industryIds?, skillIds?, limit? }` | `{ workers, total }` | `GET /v1/workers` |
| `getWorkerById` | `{ id: uuid }` | Worker object | `GET /v1/workers/:id` (implied by workers REST) |

### Discover Consumers

| File | API Used |
|------|----------|
| `features/discover/hooks/useTalentProfiles.ts` | **Direct Supabase** – `v_profile_search`, `v_id_verification_latest` (no tRPC) |
| `features/id-verification/components/IdVerificationRequestPanel.tsx` | `api.workers.getWorkers.useQuery()` |

### Conclusion

- Discover map uses Supabase views only; no tRPC.
- `api.workers` has REST parity and is marked migrated; `IdVerificationRequestPanel` can switch to REST/SDK.

---

## 5. Payments Router

**Source:** `packages/supabase/functions/trpc/routers/payments.router.ts`  
**Registered as:** `api.payments.*`  
**REST routes exist:** **None** – no payments routes under `api/routes/`

### Procedures (selected)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `getStripeConfig` | query | protected | Stripe publishable key, mode |
| `adminListPricing` | query | office | Service pricing (background_check, id_verification) |
| `adminUpsertPricing` | mutation | office | Create/update pricing |
| `adminDeletePricing` | mutation | office | Delete pricing |
| `adminSetPricingActive` | mutation | office | Activate/deactivate pricing |
| `adminGetAnalytics` | query | office | KPIs, breakdowns, time series |
| `adminListTransactions` | query | office | List transactions with filters |
| `createSetupIntent` | mutation | office | SetupIntent for adding payment method |
| `savePaymentMethod` | mutation | office | Save payment method after confirmation |
| `getPaymentMethod` | query | office | Current org payment method |
| `deletePaymentMethod` | mutation | office | Soft delete payment method |
| `getTransaction` | query | office | Single transaction |
| `listTransactions` | query | protected | Org transactions |
| `exportTransactions` | query | office | CSV/JSON export |
| `generateReceipt` | query | office | Receipt data for PDF/email |
| `getAccountCredits` | query | protected | Org credits balance |
| `depositCredits` | mutation | office | Credit deposit via Stripe |
| `getCreditLedger` | query | protected | Credit ledger |
| `applyCreditsToPayment` | mutation | protected | Use credits for payment |
| `checkAndApplyCredits` | query | protected | Check/apply credits |

### Consumers (scf-core)

| File | Procedures |
|------|------------|
| `OfficeTransactionHistory.tsx` | `adminListTransactions`, `exportTransactions` |
| `office-payment-analytics.tsx` | `adminGetAnalytics` |
| `OrganizationPaymentMethodsPanel.tsx` | `getPaymentMethod`, `deletePaymentMethod` |
| `SetupIntentForm.tsx` | `createSetupIntent`, `savePaymentMethod` |
| `OrganizationCreditsPanel.tsx` | `getAccountCredits`, `getCreditLedger`, `depositCredits` |
| `TransactionReceiptModal.tsx` | `generateReceipt` |
| `useStripeConfig.ts` | `getStripeConfig` |

### Migration Notes

- SDK matrix: payments marked "Staying in tRPC" for provider integration.
- No REST routes; Stripe integration lives server-side.
- Migration would mean new REST endpoints for each procedure or SDK methods wrapping them.

---

## Migration Priority Matrix

| Area | tRPC Procedures | REST/SDK Exists | Consumers | Migration Effort |
|------|-----------------|-----------------|-----------|------------------|
| **idVerification** | 7 | No | 4 files | High – new REST/SDK |
| **Office listJobs** | 1 (within larger office router) | Partially – different scope | 3 files | Medium – admin jobs REST |
| **Profile** | Mostly migrated | Yes | Docs/examples only | Low |
| **Discover** | `api.workers` | Yes (`/v1/workers`) | 1 file | Low – swap to REST |
| **Payments** | 20+ | No | 7 files | High – new REST/SDK |

---

## Recommended Migration Order

1. **Discover / workers** – Migrate `IdVerificationRequestPanel` from `api.workers.getWorkers` to `GET /v1/workers` (SDK already exists).
2. **Office listJobs** – Add admin jobs REST endpoint (e.g. `GET /v1/admin/jobs`) or extend jobs REST with admin scope.
3. **idVerification** – Add REST endpoints + SDK resource; move from "staying in tRPC" to REST/SDK.
4. **Payments** – Add REST endpoints + SDK for payment management; keep Stripe secrets server-side.

---

## File Reference Summary

### idVerification Consumers
- `packages/scf-core/features/id-verification/components/IdVerificationFlow.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationRequestPanel.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationAdminPage.tsx`
- `packages/scf-core/features/id-verification/components/IdVerificationWidget.tsx`

### Office listJobs Consumers
- `packages/scf-core/features/background-check/organization/OrganizationBackgroundCheckRequestForm.tsx`
- `packages/scf-core/features/office/office-jobs-list.tsx`
- `apps/scaffald/app/office/cms/teams/[id]/index.tsx`

### Payments Consumers
- `packages/scf-core/features/office/payments/OfficeTransactionHistory.tsx`
- `packages/scf-core/features/office/payments/office-payment-analytics.tsx`
- `packages/scf-core/features/office/payments/OrganizationPaymentMethodsPanel.tsx`
- `packages/scf-core/features/office/payments/SetupIntentForm.tsx`
- `packages/scf-core/features/office/payments/OrganizationCreditsPanel.tsx`
- `packages/scf-core/features/office/payments/TransactionReceiptModal.tsx`
- `packages/scf-core/features/payments/hooks/useStripeConfig.ts`

### Workers (Discover) Consumers
- `packages/scf-core/features/id-verification/components/IdVerificationRequestPanel.tsx` (uses `api.workers.getWorkers`)
- `packages/scf-core/features/discover/hooks/useTalentProfiles.ts` (uses Supabase directly – no tRPC)
