# Hybrid Audit Logging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a comprehensive hybrid audit logging system combining database triggers (for data modifications) with tRPC middleware (for application context), providing compliance-grade traceability with 7-year retention.

**Architecture:** Defense-in-depth approach using PostgreSQL triggers for WORM-compliant data change logging, tRPC middleware for capturing user sessions and page views, and client-side tracking for email interactions.

**Tech Stack:** PostgreSQL triggers, tRPC middleware, React hooks, @bernierllc/email-manager (SendGrid webhooks), Supabase

**Dependencies:**
- `@bernierllc/email-manager` - Provides SendGrid integration with built-in webhook handling for email delivery tracking

---

## Quality Principles (MANDATORY)

> **See master plan for full details:** `2024-12-23-forsured-complete-implementation.md`

1. **Test Coverage Priority:** Every feature needs unit, integration, and E2E tests
2. **Fix Linting Immediately:** Run `pnpm lint --fix` before every commit
3. **Track Discovered Bugs:** Append unrelated bugs to master plan appendix
4. **Track Failing Tests:** Append unrelated test failures to master plan appendix

### Test Requirements for Audit Logging

| Component | Test Type | Test File |
|-----------|-----------|-----------|
| Audit trigger function | Integration | `__tests__/audit-triggers.integration.test.ts` |
| AuditService | Unit + Integration | `__tests__/auditService.test.ts` |
| Audit middleware | Unit | `__tests__/auditMiddleware.test.ts` |
| usePageView hook | Component | `__tests__/usePageView.test.tsx` |
| SendGrid webhook | Integration | `__tests__/sendgrid-webhook.test.ts` |
| Audit queries | Integration | `__tests__/auditQueries.test.ts` |
| Full audit trail | E2E (Playwright) | `e2e/audit-trail.spec.ts` |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER ACTION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Action                                                             │
│       │                                                                  │
│       ├──────────────────────────────────────────────────────────┐      │
│       │                                                           │      │
│       ▼                                                           ▼      │
│  ┌─────────────────┐                                    ┌──────────────┐│
│  │ tRPC Middleware │                                    │ DB Trigger   ││
│  │ (App Context)   │                                    │ (Data Layer) ││
│  └────────┬────────┘                                    └──────┬───────┘│
│           │                                                     │        │
│           │ Captures:                                           │ Captures:
│           │ • User ID, IP, Session                              │ • Table name
│           │ • Page views, API calls                             │ • Operation type
│           │ • Request metadata                                  │ • Old/New data
│           │                                                     │ • Changed fields
│           │                                                     │        │
│           └────────────────────┬────────────────────────────────┘        │
│                                │                                          │
│                                ▼                                          │
│                    ┌───────────────────────┐                             │
│                    │     audit_log         │                             │
│                    │  (WORM + Hash Chain)  │                             │
│                    └───────────────────────┘                             │
│                                │                                          │
│              ┌─────────────────┼─────────────────┐                       │
│              ▼                 ▼                 ▼                       │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
│    │ Hot Storage     │ │ Warm Storage    │ │ Cold Storage    │          │
│    │ (PostgreSQL)    │ │ (S3 Standard)   │ │ (S3 Glacier)    │          │
│    │ 0-90 days       │ │ 90 days-2 yrs   │ │ 2-7 years       │          │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Event Categories

| Category | Source | Description | Examples |
|----------|--------|-------------|----------|
| `authentication` | Middleware | Login, logout, session events | Login success, MFA challenge, session timeout |
| `authorization` | Middleware | Permission checks, access denials | Access denied, role elevation |
| `data_access` | Both | Read operations on sensitive data | View document, export report |
| `data_modification` | Trigger | CRUD operations | Create task, update policy, delete document |
| `page_view` | Middleware | Page/screen views | Dashboard view, project detail view |
| `email` | Webhook | Email lifecycle events | Sent, opened, clicked, bounced |
| `compliance` | Both | Compliance-specific events | Requirement met, gap identified |
| `system` | Both | System operations | Migration, archival, health check |

---

## Part 1: Database Triggers (Data Layer)

### Task 1.1: Create Audit Trigger Function

**Files:**
- Create: `packages/supabase/migrations/270_forsured_audit_triggers.sql`

**Step 1: Write the migration**

```sql
-- Migration: 270_forsured_audit_triggers.sql
-- Description: Create audit triggers for data modification tracking
-- REQ: Hybrid audit logging - database layer

-- =============================================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- =============================================================================
-- This function automatically logs all INSERT, UPDATE, DELETE operations
-- on tables that have the trigger attached.

CREATE OR REPLACE FUNCTION forsured.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
  record_id UUID;
  old_data JSONB;
  new_data JSONB;
  audit_action TEXT;
BEGIN
  -- Determine the operation type
  audit_action := TG_OP;

  -- Get the record ID
  CASE TG_OP
    WHEN 'DELETE' THEN
      record_id := OLD.id;
      old_data := to_jsonb(OLD);
      new_data := NULL;
    WHEN 'UPDATE' THEN
      record_id := NEW.id;
      old_data := to_jsonb(OLD);
      new_data := to_jsonb(NEW);
      -- Calculate changed fields
      SELECT array_agg(key) INTO changed_fields
      FROM jsonb_each(new_data)
      WHERE new_data -> key IS DISTINCT FROM old_data -> key;
    WHEN 'INSERT' THEN
      record_id := NEW.id;
      old_data := NULL;
      new_data := to_jsonb(NEW);
      changed_fields := ARRAY[]::TEXT[];
  END CASE;

  -- Insert audit log entry
  -- Note: User context comes from auth.uid() (Supabase auth)
  -- Additional context (IP, session) is added by middleware
  INSERT INTO audit_log (
    category,
    action,
    severity,
    user_id,
    organization_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    resource_type,
    resource_name,
    metadata,
    status
  ) VALUES (
    'data_modification',
    TG_TABLE_NAME || '_' || lower(TG_OP),
    CASE
      WHEN TG_OP = 'DELETE' THEN 'high'
      WHEN TG_OP = 'UPDATE' THEN 'medium'
      ELSE 'low'
    END,
    auth.uid(),
    -- Get organization from the record if it has org_id column
    CASE
      WHEN TG_OP = 'DELETE' AND OLD ? 'organization_id' THEN (OLD->>'organization_id')::UUID
      WHEN NEW ? 'organization_id' THEN (NEW->>'organization_id')::UUID
      ELSE NULL
    END,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    record_id,
    TG_OP,
    old_data,
    new_data,
    changed_fields,
    TG_TABLE_NAME,
    -- Try to get a meaningful name from common fields
    COALESCE(
      NEW->>'name',
      NEW->>'title',
      NEW->>'policy_number',
      NEW->>'file_name',
      record_id::TEXT
    ),
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME,
      'trigger_when', TG_WHEN,
      'trigger_level', TG_LEVEL
    ),
    'success'
  );

  -- Return appropriate value based on operation
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION forsured.audit_trigger_function IS
'Generic audit trigger that logs all data modifications to audit_log table';

-- =============================================================================
-- ATTACH TRIGGERS TO CRITICAL TABLES
-- =============================================================================

-- Projects
DROP TRIGGER IF EXISTS audit_projects ON forsured.projects;
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON forsured.projects
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Subcontractors
DROP TRIGGER IF EXISTS audit_subcontractors ON forsured.subcontractors;
CREATE TRIGGER audit_subcontractors
  AFTER INSERT OR UPDATE OR DELETE ON forsured.subcontractors
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Documents
DROP TRIGGER IF EXISTS audit_documents ON forsured.documents;
CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON forsured.documents
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Policies
DROP TRIGGER IF EXISTS audit_policies ON forsured.policies;
CREATE TRIGGER audit_policies
  AFTER INSERT OR UPDATE OR DELETE ON forsured.policies
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Tasks
DROP TRIGGER IF EXISTS audit_tasks ON forsured.tasks;
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON forsured.tasks
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Compliance Scores
DROP TRIGGER IF EXISTS audit_compliance_scores ON forsured.compliance_scores;
CREATE TRIGGER audit_compliance_scores
  AFTER INSERT OR UPDATE OR DELETE ON forsured.compliance_scores
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Requirements
DROP TRIGGER IF EXISTS audit_requirements ON forsured.requirements;
CREATE TRIGGER audit_requirements
  AFTER INSERT OR UPDATE OR DELETE ON forsured.requirements
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Project Subcontractors (invitations)
DROP TRIGGER IF EXISTS audit_project_subcontractors ON forsured.project_subcontractors;
CREATE TRIGGER audit_project_subcontractors
  AFTER INSERT OR UPDATE OR DELETE ON forsured.project_subcontractors
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Broker Clients (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'broker_clients') THEN
    DROP TRIGGER IF EXISTS audit_broker_clients ON forsured.broker_clients;
    CREATE TRIGGER audit_broker_clients
      AFTER INSERT OR UPDATE OR DELETE ON forsured.broker_clients
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Compliance Records (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'compliance_records') THEN
    DROP TRIGGER IF EXISTS audit_compliance_records ON forsured.compliance_records;
    CREATE TRIGGER audit_compliance_records
      AFTER INSERT OR UPDATE OR DELETE ON forsured.compliance_records
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Project Requirements (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'project_requirements') THEN
    DROP TRIGGER IF EXISTS audit_project_requirements ON forsured.project_requirements;
    CREATE TRIGGER audit_project_requirements
      AFTER INSERT OR UPDATE OR DELETE ON forsured.project_requirements
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- List all attached audit triggers
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name LIKE 'audit_%'
    AND trigger_schema = 'forsured';

  RAISE NOTICE '✅ Attached % audit triggers to forsured schema tables', trigger_count;
END $$;
```

**Step 2: Run migration**

```bash
cd packages/supabase && pnpm supabase db push
```

**Step 3: Verify triggers are attached**

```bash
pnpm supabase db query "
  SELECT trigger_name, event_object_table
  FROM information_schema.triggers
  WHERE trigger_name LIKE 'audit_%'
    AND trigger_schema = 'forsured';
"
```

**Step 4: Test by creating a task**

```bash
pnpm supabase db query "
  INSERT INTO forsured.tasks (project_id, organization_id, title, status)
  VALUES (
    (SELECT id FROM forsured.projects LIMIT 1),
    (SELECT organization_id FROM forsured.projects LIMIT 1),
    'Test audit logging',
    'pending'
  );
"

pnpm supabase db query "
  SELECT id, category, action, table_name, operation
  FROM audit_log
  WHERE action = 'tasks_insert'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

Expected: Row showing the task creation audit entry

**Step 5: Commit**

```bash
git add packages/supabase/migrations/270_forsured_audit_triggers.sql
git commit -m "feat(audit): add database triggers for data modification logging"
```

---

## Part 2: tRPC Middleware (Application Layer)

### Task 2.1: Create Audit Middleware

**Files:**
- Create: `apps/forsured-web/src/lib/audit/auditMiddleware.ts`
- Create: `apps/forsured-web/src/lib/audit/auditService.ts`
- Modify: `apps/forsured-web/src/server/trpc.ts`
- Test: `apps/forsured-web/src/lib/audit/__tests__/auditMiddleware.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/forsured-web/src/lib/audit/__tests__/auditMiddleware.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase } from '../../supabase'
import { AuditService } from '../auditService'

describe('AuditService', () => {
  const auditService = new AuditService()

  describe('logEvent', () => {
    it('should log an event to audit_log table', async () => {
      const event = {
        category: 'page_view' as const,
        action: 'dashboard_view',
        severity: 'info' as const,
        metadata: { path: '/manager/dashboard' },
      }

      await auditService.logEvent(event)

      // Verify it was logged
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('action', 'dashboard_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(data).toBeDefined()
      expect(data.category).toBe('page_view')
      expect(data.metadata.path).toBe('/manager/dashboard')
    })
  })

  describe('logPageView', () => {
    it('should log page view with user context', async () => {
      await auditService.logPageView({
        path: '/projects/123',
        userId: 'user-456',
        sessionId: 'session-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      })

      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('action', 'page_view')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      expect(data).toBeDefined()
      expect(data.user_id).toBe('user-456')
      expect(data.ip_address).toBe('192.168.1.1')
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/forsured-web && pnpm vitest run src/lib/audit/__tests__/auditMiddleware.test.ts
```

Expected: FAIL - AuditService not found

**Step 3: Implement AuditService**

```typescript
// apps/forsured-web/src/lib/audit/auditService.ts

import { supabase } from '../supabase'

type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'page_view'
  | 'email'
  | 'compliance'
  | 'system'

type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface AuditEvent {
  category: AuditCategory
  action: string
  severity: AuditSeverity
  userId?: string
  organizationId?: string
  tableName?: string
  recordId?: string
  resourceType?: string
  resourceName?: string
  operation?: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT' | 'EXECUTE'
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  changedFields?: string[]
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  requestId?: string
  sessionId?: string
  status?: 'success' | 'failure' | 'partial' | 'denied'
  errorMessage?: string
}

interface PageViewContext {
  path: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  queryParams?: Record<string, string>
}

interface ApiCallContext {
  procedure: string
  input?: unknown
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  durationMs?: number
  status: 'success' | 'failure'
  errorMessage?: string
}

export class AuditService {
  private requestId?: string

  constructor(requestId?: string) {
    this.requestId = requestId
  }

  /**
   * Log a generic audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const { error } = await supabase.from('audit_log').insert({
        category: event.category,
        action: event.action,
        severity: event.severity,
        user_id: event.userId,
        organization_id: event.organizationId,
        table_name: event.tableName,
        record_id: event.recordId,
        resource_type: event.resourceType,
        resource_name: event.resourceName,
        operation: event.operation,
        old_data: event.oldData,
        new_data: event.newData,
        changed_fields: event.changedFields,
        metadata: event.metadata || {},
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        request_id: event.requestId || this.requestId,
        session_id: event.sessionId,
        status: event.status || 'success',
        error_message: event.errorMessage,
      })

      if (error) {
        console.error('Failed to log audit event:', error)
      }
    } catch (err) {
      // Never throw on audit failures - log and continue
      console.error('Audit logging error:', err)
    }
  }

  /**
   * Log a page view
   */
  async logPageView(context: PageViewContext): Promise<void> {
    await this.logEvent({
      category: 'page_view',
      action: 'page_view',
      severity: 'info',
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      resourceType: 'page',
      resourceName: context.path,
      metadata: {
        path: context.path,
        referrer: context.referrer,
        queryParams: context.queryParams,
      },
      status: 'success',
    })
  }

  /**
   * Log an API call
   */
  async logApiCall(context: ApiCallContext): Promise<void> {
    await this.logEvent({
      category: 'data_access',
      action: `api_${context.procedure}`,
      severity: context.status === 'failure' ? 'high' : 'low',
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      resourceType: 'api',
      resourceName: context.procedure,
      metadata: {
        procedure: context.procedure,
        durationMs: context.durationMs,
        hasInput: !!context.input,
      },
      status: context.status,
      errorMessage: context.errorMessage,
    })
  }

  /**
   * Log a login event
   */
  async logLogin(context: {
    userId: string
    email: string
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    success: boolean
    failureReason?: string
  }): Promise<void> {
    await this.logEvent({
      category: 'authentication',
      action: context.success ? 'login_success' : 'login_failure',
      severity: context.success ? 'info' : 'high',
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      resourceType: 'user',
      resourceName: context.email,
      metadata: {
        email: context.email,
      },
      status: context.success ? 'success' : 'failure',
      errorMessage: context.failureReason,
    })
  }

  /**
   * Log a logout event
   */
  async logLogout(context: {
    userId: string
    sessionId?: string
    ipAddress?: string
  }): Promise<void> {
    await this.logEvent({
      category: 'authentication',
      action: 'logout',
      severity: 'info',
      userId: context.userId,
      ipAddress: context.ipAddress,
      sessionId: context.sessionId,
      status: 'success',
    })
  }

  /**
   * Log document access
   */
  async logDocumentAccess(context: {
    documentId: string
    documentName: string
    userId?: string
    ipAddress?: string
    action: 'view' | 'download' | 'print'
  }): Promise<void> {
    await this.logEvent({
      category: 'data_access',
      action: `document_${context.action}`,
      severity: 'medium',
      userId: context.userId,
      ipAddress: context.ipAddress,
      recordId: context.documentId,
      resourceType: 'document',
      resourceName: context.documentName,
      operation: 'SELECT',
      status: 'success',
    })
  }

  /**
   * Log email event
   */
  async logEmailEvent(context: {
    emailId: string
    recipient: string
    subject: string
    event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const severityMap: Record<string, AuditSeverity> = {
      sent: 'info',
      delivered: 'info',
      opened: 'info',
      clicked: 'info',
      bounced: 'high',
      failed: 'high',
    }

    await this.logEvent({
      category: 'email',
      action: `email_${context.event}`,
      severity: severityMap[context.event] || 'info',
      resourceType: 'email',
      resourceName: context.subject,
      metadata: {
        emailId: context.emailId,
        recipient: context.recipient,
        ...context.metadata,
      },
      status: ['bounced', 'failed'].includes(context.event) ? 'failure' : 'success',
    })
  }

  /**
   * Log compliance event
   */
  async logComplianceEvent(context: {
    projectId?: string
    subcontractorId?: string
    requirementId?: string
    event: 'requirement_met' | 'requirement_gap' | 'score_updated' | 'alert_triggered'
    details: Record<string, unknown>
  }): Promise<void> {
    const severityMap: Record<string, AuditSeverity> = {
      requirement_met: 'info',
      requirement_gap: 'high',
      score_updated: 'medium',
      alert_triggered: 'high',
    }

    await this.logEvent({
      category: 'compliance',
      action: `compliance_${context.event}`,
      severity: severityMap[context.event] || 'medium',
      recordId: context.projectId || context.subcontractorId,
      resourceType: 'compliance',
      metadata: {
        projectId: context.projectId,
        subcontractorId: context.subcontractorId,
        requirementId: context.requirementId,
        ...context.details,
      },
      status: 'success',
    })
  }
}

// Singleton for general use
export const auditService = new AuditService()
```

**Step 4: Create tRPC Middleware**

```typescript
// apps/forsured-web/src/lib/audit/auditMiddleware.ts

import { TRPCError } from '@trpc/server'
import { AuditService } from './auditService'

interface MiddlewareContext {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Creates a tRPC middleware that logs all procedure calls
 */
export function createAuditMiddleware() {
  return async function auditMiddleware(opts: {
    ctx: MiddlewareContext
    next: () => Promise<unknown>
    path: string
    type: 'query' | 'mutation' | 'subscription'
    input: unknown
  }) {
    const { ctx, next, path, type, input } = opts
    const auditService = new AuditService()
    const startTime = Date.now()

    try {
      const result = await next()
      const durationMs = Date.now() - startTime

      // Log successful API call
      await auditService.logApiCall({
        procedure: path,
        input: type === 'mutation' ? input : undefined, // Only log mutation inputs
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        durationMs,
        status: 'success',
      })

      return result
    } catch (error) {
      const durationMs = Date.now() - startTime

      // Log failed API call
      await auditService.logApiCall({
        procedure: path,
        input: type === 'mutation' ? input : undefined,
        userId: ctx.userId,
        sessionId: ctx.sessionId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        durationMs,
        status: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })

      throw error
    }
  }
}
```

**Step 5: Integrate with tRPC**

```typescript
// apps/forsured-web/src/server/trpc.ts - add middleware

import { createAuditMiddleware } from '../lib/audit/auditMiddleware'

// Create audit middleware
const auditMiddleware = createAuditMiddleware()

// Add to your existing middleware chain
export const publicProcedure = t.procedure.use(auditMiddleware)
export const protectedProcedure = t.procedure
  .use(isAuthenticated)
  .use(auditMiddleware)
```

**Step 6: Run tests and commit**

```bash
cd apps/forsured-web && pnpm vitest run src/lib/audit/
git add apps/forsured-web/src/lib/audit/
git add apps/forsured-web/src/server/trpc.ts
git commit -m "feat(audit): add tRPC middleware for API call logging"
```

---

## Part 3: Page View Tracking

### Task 3.1: Create usePageView Hook

**Files:**
- Create: `apps/forsured-web/src/hooks/usePageView.ts`
- Modify: `apps/forsured-web/src/app/layout.tsx` (or equivalent)

**Step 1: Write the hook**

```typescript
// apps/forsured-web/src/hooks/usePageView.ts

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAuth } from './useAuth' // Your auth hook
import { auditService } from '../lib/audit/auditService'

export function usePageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, sessionId } = useAuth()

  useEffect(() => {
    // Don't log during SSR
    if (typeof window === 'undefined') return

    // Log page view
    auditService.logPageView({
      path: pathname,
      userId: user?.id,
      sessionId,
      referrer: document.referrer,
      queryParams: Object.fromEntries(searchParams.entries()),
      // Note: IP and user agent are typically added server-side
    })
  }, [pathname, searchParams, user?.id, sessionId])
}
```

**Step 2: Add to root layout**

```typescript
// apps/forsured-web/src/app/layout.tsx

'use client'
import { usePageView } from '../hooks/usePageView'

function PageViewTracker() {
  usePageView()
  return null
}

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PageViewTracker />
        {children}
      </body>
    </html>
  )
}
```

**Step 3: Commit**

```bash
git add apps/forsured-web/src/hooks/usePageView.ts
git add apps/forsured-web/src/app/layout.tsx
git commit -m "feat(audit): add page view tracking hook"
```

---

## Part 4: Email Tracking Integration ✅ COMPLETE

> **Dependency:** `@bernierllc/email-manager` package provides built-in SendGrid webhook handling

**Completed:** 2024-12-24
- Installed `@bernierllc/email-manager` v0.2.0
- Created `src/lib/email/emailConfig.ts` with EmailManager configuration
- Created `src/api/webhooks/sendgrid.ts` with webhook handler
- Integrated with AuditService for compliance logging

### Task 4.1: Install and Configure @bernierllc/email-manager ✅

**Files:**
- Modify: `apps/forsured-web/package.json`
- Create: `apps/forsured-web/src/lib/email/emailConfig.ts`

**Step 1: Install the package**

```bash
cd apps/forsured-web && pnpm add @bernierllc/email-manager
```

**Step 2: Configure environment variables**

```bash
# .env.local
SENDGRID_API_KEY=SG.xxx
SENDGRID_WEBHOOK_SIGNING_SECRET=xxx
EMAIL_FROM_ADDRESS=noreply@forsured.com
EMAIL_FROM_NAME=ForSured
```

**Step 3: Create email configuration**

```typescript
// apps/forsured-web/src/lib/email/emailConfig.ts

import { createEmailManager } from '@bernierllc/email-manager'
import { auditService } from '../audit/auditService'

/**
 * ForSured Email Manager Configuration
 *
 * Uses @bernierllc/email-manager for:
 * - SendGrid email sending
 * - Built-in webhook handling for delivery tracking
 * - Automatic audit logging integration
 */
export const emailManager = createEmailManager({
  provider: 'sendgrid',
  apiKey: process.env.SENDGRID_API_KEY!,
  webhookSigningSecret: process.env.SENDGRID_WEBHOOK_SIGNING_SECRET,
  defaults: {
    from: {
      email: process.env.EMAIL_FROM_ADDRESS || 'noreply@forsured.com',
      name: process.env.EMAIL_FROM_NAME || 'ForSured',
    },
    trackingCategory: 'forsured', // Used to filter webhooks for ForSured emails only
  },
  // Hook into delivery events for audit logging
  onDeliveryEvent: async (event) => {
    await auditService.logEmailEvent({
      emailId: event.messageId,
      recipient: event.recipient,
      subject: event.subject || '',
      event: event.status, // 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
      metadata: {
        timestamp: event.timestamp,
        url: event.clickUrl,
        ip: event.ip,
        userAgent: event.userAgent,
        // ForSured-specific context passed when sending
        projectId: event.customArgs?.projectId,
        taskId: event.customArgs?.taskId,
        subcontractorId: event.customArgs?.subcontractorId,
        invitationId: event.customArgs?.invitationId,
      },
    })
  },
})
```

**Step 4: Commit**

```bash
git add apps/forsured-web/package.json apps/forsured-web/src/lib/email/
git commit -m "feat(email): configure @bernierllc/email-manager for SendGrid integration"
```

### Task 4.2: Create Webhook Route Using email-manager ✅

**Files:**
- Create: `apps/forsured-web/src/api/webhooks/sendgrid.ts` (actual location)

**Step 1: Write the webhook handler**

```typescript
// apps/forsured-web/src/app/api/webhooks/sendgrid/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { emailManager } from '../../../../lib/email/emailConfig'

/**
 * SendGrid Webhook Handler
 *
 * Uses @bernierllc/email-manager's built-in webhook processing:
 * - Validates webhook signature
 * - Filters to only ForSured emails (via trackingCategory)
 * - Triggers onDeliveryEvent callback for audit logging
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-twilio-email-event-webhook-signature')
    const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp')
    const body = await request.text()

    // email-manager handles signature validation, event parsing, and filtering
    const result = await emailManager.processWebhook({
      signature: signature || '',
      timestamp: timestamp || '',
      body,
    })

    if (!result.success) {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      received: true,
      processed: result.eventsProcessed,
      filtered: result.eventsFiltered, // Events from other apps using same SendGrid account
    })
  } catch (error) {
    console.error('SendGrid webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add apps/forsured-web/src/app/api/webhooks/sendgrid/
git commit -m "feat(audit): add SendGrid webhook handler using email-manager"
```

---

## Part 5: Audit Query Utilities

### Task 5.1: Create Audit Query Functions

**Files:**
- Create: `apps/forsured-web/src/lib/audit/auditQueries.ts`

**Step 1: Write query utilities**

```typescript
// apps/forsured-web/src/lib/audit/auditQueries.ts

import { supabase } from '../supabase'

export interface AuditQueryFilters {
  userId?: string
  projectId?: string
  subcontractorId?: string
  documentId?: string
  category?: string
  action?: string
  severity?: string[]
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditLogEntry {
  id: string
  created_at: string
  category: string
  action: string
  severity: string
  user_id?: string
  table_name?: string
  record_id?: string
  resource_type?: string
  resource_name?: string
  operation?: string
  metadata: Record<string, unknown>
  status: string
}

/**
 * Query audit logs with fine-grained filters
 */
export async function queryAuditLogs(
  filters: AuditQueryFilters
): Promise<{ data: AuditLogEntry[]; count: number }> {
  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.projectId) {
    query = query.or(`record_id.eq.${filters.projectId},metadata->projectId.eq.${filters.projectId}`)
  }

  if (filters.subcontractorId) {
    query = query.or(`record_id.eq.${filters.subcontractorId},metadata->subcontractorId.eq.${filters.subcontractorId}`)
  }

  if (filters.documentId) {
    query = query.eq('record_id', filters.documentId)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`)
  }

  if (filters.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity)
  }

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }

  // Pagination
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return { data: data || [], count: count || 0 }
}

/**
 * Get all audit events for a specific user
 */
export async function getUserAuditTrail(
  userId: string,
  options?: { limit?: number; startDate?: Date }
): Promise<AuditLogEntry[]> {
  const { data } = await queryAuditLogs({
    userId,
    limit: options?.limit || 100,
    startDate: options?.startDate,
  })
  return data
}

/**
 * Get all audit events for a project
 */
export async function getProjectAuditTrail(
  projectId: string,
  options?: { limit?: number }
): Promise<AuditLogEntry[]> {
  const { data } = await queryAuditLogs({
    projectId,
    limit: options?.limit || 100,
  })
  return data
}

/**
 * Get all audit events for a document
 */
export async function getDocumentAuditTrail(
  documentId: string
): Promise<AuditLogEntry[]> {
  const { data } = await queryAuditLogs({
    documentId,
    limit: 100,
  })
  return data
}

/**
 * Check if a user has viewed a specific resource
 */
export async function hasUserViewedResource(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('audit_log')
    .select('id')
    .eq('user_id', userId)
    .eq('category', 'data_access')
    .eq('record_id', resourceId)
    .limit(1)

  return (data?.length || 0) > 0
}

/**
 * Get email delivery status for a recipient
 */
export async function getEmailDeliveryStatus(
  recipient: string,
  startDate?: Date
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('category', 'email')
    .contains('metadata', { recipient })
    .order('created_at', { ascending: false })
    .limit(50)

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Verify hash chain integrity for a date range
 */
export async function verifyHashChainIntegrity(
  startDate: Date,
  endDate: Date
): Promise<{ valid: boolean; errorCount: number; verifiedCount: number; errors: string[] }> {
  const { data, error } = await supabase.rpc('verify_audit_log_hash_chain', {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  })

  if (error) throw error

  return data?.[0] || { valid: true, errorCount: 0, verifiedCount: 0, errors: [] }
}
```

**Step 2: Commit**

```bash
git add apps/forsured-web/src/lib/audit/auditQueries.ts
git commit -m "feat(audit): add audit query utilities for compliance reporting"
```

---

## Verification Checklist

After implementing all tasks:

- [ ] Database triggers fire on INSERT/UPDATE/DELETE for all critical tables
- [ ] tRPC middleware logs all API calls
- [ ] Page views are tracked
- [ ] Email events are captured via webhook
- [ ] Audit logs include user context (ID, IP, session)
- [ ] Hash chain verification passes
- [ ] WORM enforcement prevents modification of logs
- [ ] Query utilities work with fine-grained filters

---

## Usage Examples

### Prove User Viewed a Document

```typescript
const hasViewed = await hasUserViewedResource(
  userId,
  'document',
  documentId
)
console.log(`User ${hasViewed ? 'has' : 'has not'} viewed document`)
```

### Get Complete Project Audit Trail

```typescript
const trail = await getProjectAuditTrail(projectId)
console.log(`Found ${trail.length} audit events for project`)
```

### Verify Email Was Delivered

```typescript
const emailEvents = await getEmailDeliveryStatus('contractor@example.com')
const wasDelivered = emailEvents.some(e => e.action === 'email_delivered')
```

---

**Plan Created:** 2024-12-23
**Author:** Claude (with writing-plans skill)
**Status:** Ready for Execution
