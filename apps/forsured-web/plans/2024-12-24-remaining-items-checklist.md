# Remaining Implementation Items Checklist

> **Generated:** 2024-12-24
> **Last Updated:** 2024-12-24
> **Purpose:** Track remaining items from Phase 4-6 implementation plans

---

## Working Policy

**When executing plan items:**
1. **Fix issues in code we're touching** - Linting issues, bugs, or problems in files we're actively modifying should be fixed immediately
2. **Log issues in code we're NOT touching** - Problems discovered in unrelated code that don't block us should be added to the "Discovered Issues" section below for later handling
3. **Update plans accordingly** - Keep this checklist current as work progresses

---

## Discovered Issues (To Be Addressed Later)

| Issue | Location | Severity | Discovered During | Notes |
|-------|----------|----------|-------------------|-------|
| *(none yet)* | | | | |

---

## Summary

| Plan | Completion | Priority |
|------|------------|----------|
| [Hybrid Audit Logging](#hybrid-audit-logging) | **100%** ✅ | Complete - All components implemented |
| [Generic Invitation System](#generic-invitation-system) | **50%** ⚠️ | In Progress - Tasks 1-4 Complete, Tasks 5-8 Pending |
| [Email Communication Auditability](#email-communication-auditability) | 0% ❌ | Medium - Extended audit features |

---

## All Plans Overview (Prioritized by Least Dependency)

> **Last Evaluated:** 2024-12-24
> **Purpose:** Reality check of all plan files against actual codebase implementation

### Priority 1: LOW DEPENDENCY (Can work independently)

| Plan | Claimed | Actual | Notes |
|------|---------|--------|-------|
| [Hybrid Audit Logging](./2024-12-23-hybrid-audit-logging.md) | 100% | **100%** ✅ | Complete! Part 4 (email-manager integration) done. All components implemented. |
| [Fix React Prop Warnings](./fix-react-prop-warnings.md) | ~100% | **100%** ✅ | Fixed: JSX file extension, crypto import, audit_log schema. 0 warnings in broker audit. |
| [Contractor UI Test Improvements](./contractor-ui-test-improvements.md) | All Phases | **100%** ✅ | All 5 phases complete. 14 tests in contractor-flow, 9 merged tests in comprehensive-audit. |
| [Replace Internal API Mocks](./2025-01-23-replace-internal-api-mocks.md) | Audited | **15%** ⚠️ | Audit complete: 21 E2E files with mocks. Plan updated with progress tracker. ~5 files for error testing (allowed), ~16 with data mocks (need conversion). Large effort. |

### Priority 2: REFERENCE DOCUMENTS (No implementation needed)

| Plan | Status | Notes |
|------|--------|-------|
| [Contractor UI Coverage Analysis](./contractor-ui-coverage-analysis.md) | **100%** ✅ | Analysis document only. Documents 14 pages/routes with risk ratings. Use as reference. |

### Priority 3: TO DELETE/ARCHIVE

| Plan | Status | Notes |
|------|--------|-------|
| [Subcontractor Invitation Workflow](./2024-12-23-subcontractor-invitation-workflow.md) | **SUPERSEDED** 🗑️ | Superseded by Generic Invitation System. Manager-side UI exists, but subcontractor acceptance flow should follow new plan. Delete or archive this file. |

### Priority 4: LARGE EFFORTS (Significant remaining work)

| Plan | Claimed | Actual | Notes |
|------|---------|--------|-------|
| [Generic Invitation System](./2024-12-24-generic-invitation-system.md) | Design + Tasks 1-4 | **50%** ⚠️ | Tasks 1-4 COMPLETE: DB schema, invitationService, referral tracking, tRPC router. Tasks 5-8 PENDING: Admin UI, Universal Invite Modal, Landing Page, Dashboard Integration. |
| [GAP-ANALYSIS FRS-Prototype](./GAP-ANALYSIS-FRS-Prototype-vs-Implementation.md) | Analysis | **10%** ⚠️ | Gap analysis document. Most P0/P1 issues still exist. Some gaps depend on Generic Invitation System. |

---

### Recommended Action Order

1. ~~**Fix React Prop Warnings**~~ ✅ COMPLETED - Fixed JSX extension, crypto import, audit_log schema
2. ~~**Contractor UI Test Improvements (Phase 5)**~~ ✅ COMPLETED - All 5 phases complete, 14 + 9 tests passing
3. **Replace Internal API Mocks** - Audited 21 files, ~16 need conversion (large effort)
4. ~~**Hybrid Audit Logging (Part 4)**~~ ✅ COMPLETED - Installed email-manager, created webhook, integrated with AuditService
5. **Generic Invitation System** - Major effort, blocks some GAP-ANALYSIS items
6. **Email Communication Auditability** - Extended features (auth audit, communication dashboard)
7. **GAP-ANALYSIS items** - Address P0/P1 issues after invitation system complete

### Files to Delete/Archive

- `apps/forsured-web/plans/2024-12-23-subcontractor-invitation-workflow.md` - Superseded

---

## Hybrid Audit Logging

**Plan:** [2024-12-23-hybrid-audit-logging.md](./2024-12-23-hybrid-audit-logging.md)

**Status: COMPLETE (100%)** ✅

### Completed Items

- [x] Migration `275_forsured_audit_triggers.sql` - Database triggers
- [x] `src/lib/audit/AuditService.ts` - Full implementation with logging, querying, exporting
- [x] `src/lib/audit/useAuditLog.ts` - React hook for components
- [x] `src/hooks/usePageView.tsx` - Page view tracking hook (renamed from .ts)
- [x] `src/lib/audit/StorageTierManager.ts` - Tiered storage management
- [x] `src/lib/audit/types/` - Complete type definitions
- [x] `src/lib/audit/__tests__/auditTriggers.integration.test.ts` - Integration test
- [x] E2E audit tests - Multiple spec files exist
- [x] `src/lib/audit/auditMiddleware.ts` - tRPC middleware for API call logging
- [x] `src/lib/audit/auditQueries.ts` - Fine-grained compliance queries

### Part 4: Email Tracking ✅ COMPLETE (2024-12-24)

- [x] **Installed `@bernierllc/email-manager`** v0.2.0
- [x] **Created email configuration** - `src/lib/email/emailConfig.ts`
- [x] **Created SendGrid webhook handler** - `src/api/webhooks/sendgrid.ts`
- [x] **Integrated with AuditService** - Email events logged for compliance
- [ ] **Configure environment variables** - `SENDGRID_API_KEY`, `SENDGRID_WEBHOOK_SIGNING_SECRET` (runtime config)

---

## Generic Invitation System

**Full Plan:** [2024-12-24-generic-invitation-system.md](./2024-12-24-generic-invitation-system.md)

**Status: IN PROGRESS (50%)** ⚠️ **HIGH PRIORITY**

> **Supersedes:** [2024-12-23-subcontractor-invitation-workflow.md](./2024-12-23-subcontractor-invitation-workflow.md)

### Quick Summary

A rule-based invitation system that handles ALL ForSured relationship types:
- **Broker → Client** (one-to-one constraint)
- **Manager → Broker** (one-to-many)
- **Manager → Contractor** (one-to-many-via-project)
- **Contractor → Broker** (one-to-many)

**Key Features:**
- Admin-managed invitation rules (no code changes for new types)
- Referral tracking with cookie + localStorage (credit on signup only)
- Personal messages on invitations
- Graceful constraint handling with user-friendly messaging

### Implementation Tasks (8 total)

See [full plan](./2024-12-24-generic-invitation-system.md) for detailed implementation steps.

| Task | Description | Status |
|------|-------------|--------|
| 1. Database Schema | 3 new tables: `invitation_rules`, `generic_invitations`, `user_relationships` | ✅ |
| 2. Invitation Service | `invitationService.ts` with CRUD operations | ✅ |
| 3. Referral Tracking | Cookie/localStorage utilities + React hook | ✅ |
| 4. tRPC Router | Generic invitations router with all endpoints | ✅ |
| 5. Admin UI | Rule management page and editor | ❌ |
| 6. Invite Components | Universal `InviteModal` and `InviteButton` | ❌ |
| 7. Landing Page | `/invite/[code]` for referral links | ❌ |
| 8. Dashboard Integration | Pending invitations + referral stats | ❌ |

### Completed Work (Tasks 1-4)

**Database Schema (Task 1):**
- [x] Migration `280_generic_invitation_system.sql` - New tables created
- [x] `core.invitation_rules` - Admin-managed invitation types
- [x] `core.generic_invitations` - Unified invitation tracking
- [x] `core.user_relationships` - Non-project relationships
- [x] Seed data for 4 default invitation rules
- [x] RLS policies and indexes

**Invitation Service (Task 2):**
- [x] `src/lib/invitations/types.ts` - Complete type definitions
- [x] `src/lib/invitations/invitationService.ts` - Full CRUD implementation
- [x] Constraint checking for one-to-one relationships
- [x] Audit logging integration

**Referral Tracking (Task 3):**
- [x] `src/lib/referrals/referralTracking.ts` - Cookie/localStorage persistence
- [x] `src/lib/referrals/useReferral.ts` - React hooks
- [x] Referral attribution on signup

**tRPC Router (Task 4):**
- [x] `src/server/api/routers/genericInvitations.ts` - All endpoints
- [x] Public `getByCode` endpoint for landing pages
- [x] Email sending integration
- [x] Registered in appRouter

### Existing Work (Carried Forward)

- [x] Migration `270_forsured_create_relationship_invitations.sql` - Legacy schema (still works)
- [x] `src/lib/invitations.ts` - Legacy broker invitations (still works)
- [x] `tests/e2e/manager-subcontractors-invitations.spec.ts` - Manager-side E2E

---

## Email Communication Auditability

**Status: NOT STARTED** ❌ **HIGH PRIORITY**

> **Goal:** Complete auditability of ALL email communications tied to projects, tasks, people, and companies in ForSured. This enables showing exactly what was communicated, when, and to whom - critical for claims and compliance.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Email Communication Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌─────────────────────┐    ┌──────────────────┐   │
│  │   ForSured   │───▶│ @bernierllc/email-  │───▶│    SendGrid      │   │
│  │   App        │    │ manager package     │    │    API           │   │
│  └──────────────┘    └─────────────────────┘    └────────┬─────────┘   │
│         │                                                 │             │
│         │ Audit Log                                       │ Webhook     │
│         ▼                                                 ▼             │
│  ┌──────────────┐                               ┌──────────────────┐   │
│  │  audit_log   │◀──────────────────────────────│ SendGrid Webhook │   │
│  │  table       │                               │ Handler          │   │
│  └──────────────┘                               └──────────────────┘   │
│                                                                          │
│  Audit captures: sender, recipient, template, project, task,            │
│  subcontractor, organization, timestamps, delivery status               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Install and Configure @bernierllc/email-manager Package

#### Task 1.1: Install the Package

- [ ] **Install @bernierllc/email-manager from NPM**
  ```bash
  # Check for NPM_TOKEN in .env if package is private
  pnpm add @bernierllc/email-manager
  ```
  - Location: `apps/forsured-web/package.json`
  - Also install in `packages/supabase/functions/` for edge functions

- [ ] **Configure environment variables**
  ```bash
  # .env
  SENDGRID_API_KEY=SG.xxx
  EMAIL_FROM_ADDRESS=noreply@forsured.com
  EMAIL_FROM_NAME=ForSured
  SENDGRID_WEBHOOK_SIGNING_SECRET=xxx
  ```

#### Task 1.2: Create Email Integration Service

- [ ] **`src/lib/email/emailIntegration.ts`** - Wrapper around @bernierllc/email-manager
  ```typescript
  /**
   * Email Integration for ForSured
   *
   * Uses @bernierllc/email-manager for all email sending with:
   * - Automatic audit logging
   * - Context tracking (project, task, subcontractor)
   * - Delivery status tracking via webhooks
   */

  import { EmailManager } from '@bernierllc/email-manager';
  import { auditService } from '../audit';

  interface ForSuredEmailContext {
    projectId?: string;
    taskId?: string;
    subcontractorId?: string;
    organizationId?: string;
    brokerId?: string;
    managerId?: string;
    invitationId?: string;
  }

  export async function sendForSuredEmail(options: {
    template: string;
    to: string | string[];
    context: ForSuredEmailContext;
    templateData: Record<string, unknown>;
  }): Promise<{ messageId: string; success: boolean }> {
    // 1. Send email via @bernierllc/email-manager
    // 2. Log to audit_log with full context
    // 3. Return tracking info
  }
  ```

- [ ] **Update `src/services/emailService.ts`** - Use new integration
  - Replace direct Supabase function calls with emailIntegration
  - Keep backward compatibility with existing templates

### Phase 2: Real-World Testing with SendGrid (BEFORE Mocking)

> **CRITICAL:** Test with real SendGrid API to understand actual webhook payloads before creating mocks.

#### Task 2.1: Set Up Test Environment

- [ ] **Configure SendGrid API key for testing**
  - Add `SENDGRID_API_KEY` to `.env.test`
  - Use test recipient: `mkbernier@gmail.com`

- [ ] **Create test email sending script**
  - Location: `apps/forsured-web/scripts/test-email-sending.ts`
  - Purpose: Send test emails and log responses
  ```typescript
  /**
   * Test Script: Send real emails via SendGrid
   *
   * Usage: pnpm tsx scripts/test-email-sending.ts
   *
   * This sends real emails to mkbernier@gmail.com to:
   * 1. Verify email delivery works
   * 2. Capture webhook payloads for mock creation
   */
  ```

#### Task 2.2: Capture Real Webhook Payloads

- [ ] **Create temporary webhook capture endpoint**
  - Location: `src/app/api/webhooks/sendgrid-capture/route.ts`
  - Purpose: Log raw webhook payloads for analysis
  ```typescript
  /**
   * Temporary webhook capture endpoint
   *
   * Logs all incoming SendGrid webhooks to console and file
   * for analysis before building production handler
   */
  export async function POST(request: Request) {
    const payload = await request.json();
    console.log('[SendGrid Webhook Capture]', JSON.stringify(payload, null, 2));
    // Save to file for analysis
    return Response.json({ captured: true });
  }
  ```

- [ ] **Configure SendGrid Event Webhook**
  - Set up webhook URL in SendGrid dashboard pointing to capture endpoint
  - Enable all event types: processed, dropped, delivered, deferred, bounce, open, click, spam report, unsubscribe

- [ ] **Send test emails and collect webhook payloads**
  - Send at least 5 test emails
  - Wait for webhook events (delivered, opened, clicked, etc.)
  - Document payload structure for each event type

#### Task 2.3: Document Webhook Payload Structure

- [ ] **Create `docs/sendgrid-webhook-payloads.md`**
  - Document real payload structure from testing
  - Include examples of each event type
  - Note any fields needed for forsured filtering

### Phase 3: Build Production SendGrid Webhook Handler

> **IMPORTANT:** Only build this AFTER completing Phase 2 testing

#### Task 3.1: Create Webhook Handler with ForSured Filtering

- [ ] **`src/app/api/webhooks/sendgrid/route.ts`** - Production webhook handler
  ```typescript
  /**
   * SendGrid Webhook Handler for ForSured
   *
   * Receives delivery events from SendGrid and:
   * 1. Validates webhook signature
   * 2. FILTERS to only process ForSured emails (shared SendGrid account)
   * 3. Updates audit_log with delivery status
   * 4. Links events to original email context (project, task, etc.)
   */

  // Filtering strategy:
  // - Check custom_args or unique_args for forsured identifier
  // - Check from address matches ForSured domain
  // - Check categories include 'forsured'

  interface SendGridEvent {
    email: string;
    timestamp: number;
    event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe';
    sg_message_id: string;
    // ... other fields documented from testing
  }

  function isForSuredEmail(event: SendGridEvent): boolean {
    // Filter logic based on real webhook analysis
  }
  ```

- [ ] **`src/lib/email/webhookProcessor.ts`** - Webhook event processor
  ```typescript
  /**
   * Process SendGrid webhook events
   *
   * - Matches events to original email audit records
   * - Updates delivery status
   * - Logs to audit_log for complete communication trail
   */

  export async function processSendGridEvent(event: SendGridEvent): Promise<void> {
    // 1. Find original email audit record by message_id
    // 2. Update with delivery status
    // 3. Log new audit event for status change
  }
  ```

#### Task 3.2: Email Audit Logging

- [ ] **Add email-specific audit actions**
  ```typescript
  // New audit actions for emails
  type EmailAuditAction =
    | 'email_sent'           // Email dispatched to SendGrid
    | 'email_delivered'      // Confirmed delivered
    | 'email_opened'         // Recipient opened
    | 'email_clicked'        // Recipient clicked link
    | 'email_bounced'        // Delivery failed
    | 'email_complained'     // Marked as spam
    | 'email_unsubscribed';  // Recipient unsubscribed

  // Metadata structure for email audit events
  interface EmailAuditMetadata {
    message_id: string;
    template: string;
    recipient_email: string;
    recipient_name?: string;
    sender_email: string;
    subject?: string;
    // Context links
    project_id?: string;
    task_id?: string;
    subcontractor_id?: string;
    organization_id?: string;
    invitation_id?: string;
    // Delivery tracking
    provider: 'sendgrid';
    event_timestamp?: string;
    delivery_attempts?: number;
  }
  ```

### Phase 4: Supabase Magic Link Authentication Audit

> **Goal:** Complete audit trail for authentication flow, even for Supabase-managed emails

#### Task 4.1: Audit Magic Link Request

- [ ] **Create auth audit hook** - `src/hooks/useAuthAudit.ts`
  ```typescript
  /**
   * Hook to audit authentication events
   *
   * Captures:
   * - Magic link request (when user enters email)
   * - Magic link used (when user clicks link and logs in)
   * - Session refresh
   * - Logout
   */

  export function useAuthAudit() {
    const { logEvent } = useAuditLog();

    async function auditMagicLinkRequest(email: string) {
      await logEvent({
        category: 'authentication',
        action: 'magic_link_requested',
        metadata: {
          email,
          requested_at: new Date().toISOString(),
        },
      });
    }

    async function auditMagicLinkUsed(userId: string, email: string) {
      await logEvent({
        category: 'authentication',
        action: 'magic_link_used',
        user_id: userId,
        metadata: {
          email,
          authenticated_at: new Date().toISOString(),
        },
      });
    }

    return { auditMagicLinkRequest, auditMagicLinkUsed };
  }
  ```

- [ ] **Integrate with login flow**
  - Location: `src/app/(auth)/login/page.tsx` or equivalent
  - Call `auditMagicLinkRequest` when user submits email
  - Call `auditMagicLinkUsed` in Supabase auth callback

#### Task 4.2: Audit Supabase Auth Callback

- [ ] **Update auth callback handler** - `src/app/auth/callback/route.ts`
  ```typescript
  /**
   * Supabase Auth Callback
   *
   * When user clicks magic link:
   * 1. Exchange code for session
   * 2. Log successful authentication to audit_log
   * 3. Redirect to dashboard
   */

  export async function GET(request: Request) {
    // ... existing auth callback logic

    // Add audit logging
    await auditService.log({
      category: 'authentication',
      action: 'login_success',
      user_id: session.user.id,
      metadata: {
        email: session.user.email,
        auth_method: 'magic_link',
        login_at: new Date().toISOString(),
      },
    });
  }
  ```

### Phase 5: Create Email Mocks (AFTER Real Testing)

> **IMPORTANT:** Only create mocks after completing Phase 2 testing with real payloads

#### Task 5.1: Create SendGrid Webhook Mocks

- [ ] **Update `src/test/mocks/externalServices.ts`** - Add webhook mocks
  ```typescript
  /**
   * SendGrid Webhook Mocks
   *
   * Based on real payloads captured during Phase 2 testing
   */

  export const mockSendGridWebhookPayloads = {
    delivered: { /* real payload structure */ },
    opened: { /* real payload structure */ },
    clicked: { /* real payload structure */ },
    bounced: { /* real payload structure */ },
    // ...
  };

  export function createMockWebhookEvent(
    type: keyof typeof mockSendGridWebhookPayloads,
    overrides?: Partial<SendGridEvent>
  ): SendGridEvent {
    return {
      ...mockSendGridWebhookPayloads[type],
      ...overrides,
    };
  }
  ```

- [ ] **Create webhook handler tests**
  - Location: `src/app/api/webhooks/sendgrid/__tests__/route.test.ts`
  - Use real payload structures from testing

### Phase 6: Multi-App Email Strategy (Scaffald + ForSured)

> **Goal:** Unified email management across both apps using @bernierllc/email-manager

#### Task 6.1: Shared Email Configuration

- [ ] **Create shared email configuration** - `packages/shared/email-config.ts`
  ```typescript
  /**
   * Shared Email Configuration
   *
   * Defines app-specific email settings for:
   * - ForSured (insurance compliance)
   * - Scaffald (job management)
   *
   * Both apps use @bernierllc/email-manager with different:
   * - From addresses
   * - Templates
   * - Tracking categories (for webhook filtering)
   */

  export const emailConfigs = {
    forsured: {
      fromEmail: 'noreply@forsured.com',
      fromName: 'ForSured',
      trackingCategory: 'forsured',
      templates: [
        'broker-invitation',
        'relationship-invitation',
        'welcome',
        'compliance-alert',
        // ...
      ],
    },
    scaffald: {
      fromEmail: 'noreply@scaffald.com',
      fromName: 'Scaffald',
      trackingCategory: 'scaffald',
      templates: [
        'team-invitation',
        'job-application',
        // ...
      ],
    },
  };
  ```

#### Task 6.2: App-Specific Email Services

- [ ] **ForSured email service** - Uses shared config
- [ ] **Scaffald email service** - Uses shared config
- [ ] **Webhook routing** - Routes to correct app based on tracking category

### Phase 7: Communication Queries for Claims/Compliance

#### Task 7.1: Add Communication-Specific Queries

- [ ] **Update `src/lib/audit/auditQueries.ts`** - Already created, verify these work:
  - `getEmailHistory()` - Query email audit records
  - `getProjectCommunications()` - All communications for a project
  - `getSubcontractorCommunications()` - All communications for a subcontractor
  - `findRelatedAuditRecords()` - Find all records related to an entity

#### Task 7.2: Create Communication Dashboard

- [ ] **`src/components/Admin/CommunicationHistory.tsx`** - Admin view of all communications
  - Filter by project, subcontractor, date range
  - Show email delivery status
  - Link to related entities

---

## Implementation Priority

### Phase 1: Critical Path (Immediate)

1. ✅ Create auditMiddleware.ts and auditQueries.ts
2. **[Generic Invitation System](#generic-invitation-system)** - See full plan for implementation
3. **Email Integration with @bernierllc/email-manager** - Foundation for all email

### Phase 2: Email Auditability (Next Sprint)

1. Real-world testing with SendGrid (send to mkbernier@gmail.com)
2. Capture and document webhook payloads
3. Build production webhook handler with forsured filtering
4. Create email mocks based on real payloads

### Phase 3: Auth Auditability (Following)

1. Magic link request audit
2. Magic link callback audit
3. Complete authentication trail

---

## File Locations Reference

```
apps/forsured-web/
├── plans/
│   └── 2024-12-24-generic-invitation-system.md      # ✅ Comprehensive invitation plan
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── invitation-rules/page.tsx            # MISSING - Admin rule management
│   │   ├── api/webhooks/
│   │   │   ├── sendgrid/route.ts                    # MISSING - Production handler
│   │   │   └── sendgrid-capture/route.ts            # MISSING - Test capture
│   │   ├── auth/callback/route.ts                   # UPDATE - Add audit logging
│   │   └── invite/
│   │       └── [code]/page.tsx                      # MISSING - Referral landing page
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── CommunicationHistory.tsx             # MISSING
│   │   │   └── InvitationRuleEditor.tsx             # MISSING
│   │   └── Invitations/
│   │       ├── InviteModal.tsx                      # MISSING - Universal invite modal
│   │       └── InviteButton.tsx                     # MISSING
│   ├── hooks/
│   │   └── useAuthAudit.ts                          # MISSING
│   ├── lib/
│   │   ├── audit/
│   │   │   ├── auditMiddleware.ts                   # ✅ CREATED
│   │   │   └── auditQueries.ts                      # ✅ CREATED
│   │   ├── email/
│   │   │   ├── emailIntegration.ts                  # MISSING
│   │   │   └── webhookProcessor.ts                  # MISSING
│   │   ├── invitations/
│   │   │   ├── types.ts                             # MISSING - Invitation types
│   │   │   └── invitationService.ts                 # MISSING - Core service
│   │   └── referrals/
│   │       ├── referralTracking.ts                  # MISSING - Cookie/localStorage
│   │       └── useReferral.ts                       # MISSING - React hook
│   └── server/
│       └── routers/
│           └── invitations.ts                       # MISSING - Generic router
├── supabase/
│   └── migrations/
│       └── XXXXXX_generic_invitation_system.sql     # MISSING - New schema
├── scripts/
│   └── test-email-sending.ts                        # MISSING
├── docs/
│   └── sendgrid-webhook-payloads.md                 # MISSING - Document after testing
└── tests/
    └── e2e/
        ├── generic-invitation-flow.spec.ts          # MISSING
        ├── referral-attribution.spec.ts             # MISSING
        └── constraint-handling.spec.ts              # MISSING
```

---

**Last Updated:** 2024-12-24
