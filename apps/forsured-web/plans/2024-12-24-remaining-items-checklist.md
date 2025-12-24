# Remaining Implementation Items Checklist

> **Generated:** 2024-12-24
> **Last Updated:** 2024-12-24
> **Purpose:** Track remaining items from Phase 4-6 implementation plans

---

## Summary

| Plan | Completion | Priority |
|------|------------|----------|
| [Risk Calculation Algorithm](#risk-calculation-algorithm) | 100% ✅ | Complete |
| [Testing Strategy No Mocks](#testing-strategy-no-mocks) | 100% ✅ | Complete |
| [Hybrid Audit Logging](#hybrid-audit-logging) | 95% ⚠️ | Low - SendGrid webhook remaining |
| [Subcontractor Invitation Workflow](#subcontractor-invitation-workflow) | 30% ❌ | **HIGH** - Core functionality |
| [Email Communication Auditability](#email-communication-auditability) | 0% ❌ | **HIGH** - New requirement |

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

**Status: MOSTLY COMPLETE (95%)** ⚠️

### Completed Items

- [x] Migration `275_forsured_audit_triggers.sql` - Database triggers
- [x] `src/lib/audit/AuditService.ts` - Full implementation with logging, querying, exporting
- [x] `src/lib/audit/useAuditLog.ts` - React hook for components
- [x] `src/hooks/usePageView.ts` - Page view tracking hook
- [x] `src/lib/audit/StorageTierManager.ts` - Tiered storage management
- [x] `src/lib/audit/types/` - Complete type definitions
- [x] `src/lib/audit/__tests__/auditTriggers.integration.test.ts` - Integration test
- [x] E2E audit tests - Multiple spec files exist
- [x] `src/lib/audit/auditMiddleware.ts` - tRPC middleware for API call logging ✅ **NEW**
- [x] `src/lib/audit/auditQueries.ts` - Fine-grained compliance queries ✅ **NEW**

### Remaining Items

- [ ] **SendGrid Webhook Handler** - See [Email Communication Auditability](#email-communication-auditability) section below
  - This is now part of the comprehensive email auditability strategy

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

- [ ] **Invitation email template** - See [Email Communication Auditability](#email-communication-auditability) section
  - Will use @bernierllc/email-manager package

#### E2E Tests

- [ ] **`tests/e2e/accept-invitation.spec.ts`** - Subcontractor acceptance flow
  - Location in plan: Test Requirements table
  - Scenarios: See pending, navigate, view details, accept, verify active

- [ ] **`tests/e2e/decline-invitation.spec.ts`** - Subcontractor decline flow
  - Location in plan: Test Requirements table
  - Scenarios: Decline with reason, verify history, manager notification

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
2. **Subcontractor Invitation Workflow** - Core functionality missing
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
├── src/
│   ├── app/
│   │   ├── api/webhooks/
│   │   │   ├── sendgrid/route.ts                   # MISSING - Production handler
│   │   │   └── sendgrid-capture/route.ts           # MISSING - Test capture
│   │   ├── auth/callback/route.ts                  # UPDATE - Add audit logging
│   │   └── subcontractor/relationships/page.tsx    # MISSING
│   ├── components/
│   │   ├── Admin/
│   │   │   └── CommunicationHistory.tsx            # MISSING
│   │   └── Subcontractor/
│   │       ├── InvitationCard.tsx                  # MISSING
│   │       └── PendingInvitations.tsx              # MISSING
│   ├── hooks/
│   │   └── useAuthAudit.ts                         # MISSING
│   ├── lib/
│   │   ├── audit/
│   │   │   ├── auditMiddleware.ts                  # ✅ CREATED
│   │   │   └── auditQueries.ts                     # ✅ CREATED
│   │   └── email/
│   │       ├── emailIntegration.ts                 # MISSING
│   │       └── webhookProcessor.ts                 # MISSING
│   └── server/
│       └── routers/
│           └── invitations.ts                      # MISSING
├── scripts/
│   └── test-email-sending.ts                       # MISSING
├── docs/
│   └── sendgrid-webhook-payloads.md                # MISSING - Document after testing
└── tests/
    └── e2e/
        ├── accept-invitation.spec.ts               # MISSING
        └── decline-invitation.spec.ts              # MISSING
```

---

**Last Updated:** 2024-12-24
