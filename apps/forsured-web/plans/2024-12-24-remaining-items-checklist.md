# Remaining Implementation Items Checklist

> **Generated:** 2024-12-24
> **Purpose:** Track remaining items from Phase 4-6 implementation plans

---

## Summary

| Plan | Completion | Priority |
|------|------------|----------|
| [Risk Calculation Algorithm](#risk-calculation-algorithm) | 100% ✅ | Complete |
| [Testing Strategy No Mocks](#testing-strategy-no-mocks) | 100% ✅ | Complete |
| [Hybrid Audit Logging](#hybrid-audit-logging) | 85% ⚠️ | Low - nice-to-haves |
| [Subcontractor Invitation Workflow](#subcontractor-invitation-workflow) | 30% ❌ | **HIGH** - Core functionality |

---

## Risk Calculation Algorithm

**Plan:** [2024-12-23-risk-calculation-algorithm.md](./2024-12-23-risk-calculation-algorithm.md)

**Status: COMPLETE** ✅

- [x] Migration `276_forsured_risk_calculation_function.sql` - PostgreSQL function
- [x] `riskCalculationService.ts` - TypeScript service
- [x] `RiskBadge.tsx` component
- [x] `RiskBreakdown.tsx` component
- [x] `RiskBadge.test.tsx` - Component test
- [x] `RiskBreakdown.test.tsx` - Component test
- [x] `riskCalculation.pg.test.ts` - PostgreSQL function test
- [x] `riskCalculationService.test.ts` - Service tests
- [x] `risk-display.spec.ts` - E2E Playwright test
- [x] Dashboard integration - RiskBadge in dashboard and modals

---

## Testing Strategy No Mocks

**Plan:** [2024-12-23-testing-strategy-no-mocks.md](./2024-12-23-testing-strategy-no-mocks.md)

**Status: COMPLETE** ✅

- [x] `src/test/testDb.ts` - Real database connection utilities
- [x] `src/test/factories/index.ts` - Base factory utilities
- [x] `src/test/factories/projectFactory.ts` - Project test data
- [x] `src/test/factories/subcontractorFactory.ts` - Subcontractor test data
- [x] `src/test/factories/taskFactory.ts` - Task test data
- [x] `src/test/factories/complianceFactory.ts` - Compliance scores/issues
- [x] `src/test/mocks/externalServices.ts` - SendGrid, Stripe, OCR mocks
- [x] `src/test/setup.ts` - localStorage/sessionStorage mocks for Supabase auth

---

## Hybrid Audit Logging

**Plan:** [2024-12-23-hybrid-audit-logging.md](./2024-12-23-hybrid-audit-logging.md)

**Status: MOSTLY COMPLETE (85%)** ⚠️

### Completed Items

- [x] Migration `275_forsured_audit_triggers.sql` - Database triggers
- [x] `src/lib/audit/AuditService.ts` - Full implementation with logging, querying, exporting
- [x] `src/lib/audit/useAuditLog.ts` - React hook for components
- [x] `src/hooks/usePageView.ts` - Page view tracking hook
- [x] `src/lib/audit/StorageTierManager.ts` - Tiered storage management
- [x] `src/lib/audit/types/` - Complete type definitions
- [x] `src/lib/audit/__tests__/auditTriggers.integration.test.ts` - Integration test
- [x] E2E audit tests - Multiple spec files exist

### Remaining Items

- [ ] **`src/lib/audit/auditMiddleware.ts`** - tRPC middleware for API call logging
  - Location in plan: Part 2, Task 2.1, Step 4
  - Purpose: Automatically log all tRPC procedure calls with timing and context

- [ ] **`src/lib/audit/auditQueries.ts`** - Separate query utilities file
  - Location in plan: Part 5, Task 5.1
  - Purpose: Fine-grained audit log queries for compliance reporting
  - Note: Functions exist in AuditService but plan specifies separate file

- [ ] **`src/app/api/webhooks/sendgrid/route.ts`** - SendGrid webhook handler
  - Location in plan: Part 4, Task 4.1
  - Purpose: Track email delivery events (sent, opened, clicked, bounced)
  - Note: Handler exists at `packages/supabase/functions/webhooks/email/` but not in Next.js app

---

## Subcontractor Invitation Workflow

**Plan:** [2024-12-23-subcontractor-invitation-workflow.md](./2024-12-23-subcontractor-invitation-workflow.md)

**Status: NOT COMPLETE (30%)** ❌ **HIGH PRIORITY**

### Completed Items

- [x] Migration `270_forsured_create_relationship_invitations.sql` - Database schema
- [x] `src/lib/invitations.ts` - Partial (broker invitations only)
- [x] `tests/e2e/manager-subcontractors-invitations.spec.ts` - Manager-side E2E test

### Remaining Items

#### Task 1: Create Invitation Response tRPC Endpoints

- [ ] **`src/server/routers/invitations.ts`** - tRPC router
  - Location in plan: Task 1, Step 3
  - Endpoints needed:
    - `getPendingInvitations` - Query pending invitations for subcontractor
    - `getInvitation` - Get single invitation details
    - `acceptInvitation` - Mutation to accept invitation
    - `declineInvitation` - Mutation to decline with optional reason
    - `getRelationships` - Query all relationships by status

- [ ] **`src/server/routers/__tests__/invitations.test.ts`** - Router tests
  - Location in plan: Task 1, Step 1

#### Task 2: Create Subcontractor Relationships Page

- [ ] **`src/components/Subcontractor/InvitationCard.tsx`** - Invitation card component
  - Location in plan: Task 2, Step 1
  - Features: Accept/decline buttons, project details, invitation date

- [ ] **`src/components/Subcontractor/PendingInvitations.tsx`** - Pending invitations list
  - Location in plan: Task 2, Step 2
  - Features: List of InvitationCards with loading/empty states

- [ ] **`src/app/subcontractor/relationships/page.tsx`** - Relationships page
  - Location in plan: Task 2, Step 3
  - Tabs: Pending Invitations, Active Projects, History

#### Task 3: Dashboard Integration

- [ ] **Update `src/components/Dashboard/SubcontractorDashboard.tsx`**
  - Location in plan: Task 3, Step 1
  - Add pending invitations section with count badge
  - Show first pending invitation preview
  - Link to relationships page

#### Task 4: Email Notifications

- [ ] **`src/lib/email/invitationEmail.ts`** - Invitation email template
  - Location in plan: Task 4, Step 1
  - Content: Project name, manager name, accept/decline buttons

- [ ] **Wire email trigger** - Send email when manager creates invitation
  - Location in plan: Task 4
  - Integrate with existing invitation creation flow

#### E2E Tests

- [ ] **`tests/e2e/accept-invitation.spec.ts`** - Subcontractor acceptance flow
  - Location in plan: Test Requirements table
  - Scenarios: See pending, navigate, view details, accept, verify active

- [ ] **`tests/e2e/decline-invitation.spec.ts`** - Subcontractor decline flow
  - Location in plan: Test Requirements table
  - Scenarios: Decline with reason, verify history, manager notification

---

## Implementation Priority

### Phase 1: Critical Path (Subcontractor Invitation Workflow)

1. Create tRPC invitations router with accept/decline mutations
2. Create InvitationCard and PendingInvitations components
3. Create `/subcontractor/relationships` page
4. Add pending invitations to SubcontractorDashboard
5. Create E2E tests for accept/decline flows

### Phase 2: Nice-to-Have (Audit Logging Enhancements)

1. Create auditMiddleware for tRPC
2. Extract auditQueries to separate file
3. Create SendGrid webhook handler in Next.js app

---

## File Locations Reference

```
apps/forsured-web/
├── src/
│   ├── app/
│   │   ├── api/webhooks/sendgrid/route.ts          # MISSING
│   │   └── subcontractor/relationships/page.tsx    # MISSING
│   ├── components/
│   │   └── Subcontractor/
│   │       ├── InvitationCard.tsx                  # MISSING
│   │       └── PendingInvitations.tsx              # MISSING
│   ├── lib/
│   │   ├── audit/
│   │   │   ├── auditMiddleware.ts                  # MISSING
│   │   │   └── auditQueries.ts                     # MISSING
│   │   └── email/
│   │       └── invitationEmail.ts                  # MISSING
│   └── server/
│       └── routers/
│           └── invitations.ts                      # MISSING
└── tests/
    └── e2e/
        ├── accept-invitation.spec.ts               # MISSING
        └── decline-invitation.spec.ts              # MISSING
```

---

**Last Updated:** 2024-12-24
