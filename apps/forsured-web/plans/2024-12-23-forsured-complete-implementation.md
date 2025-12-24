# Forsured Complete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Forsured application by expanding the schema to match original design, implementing all planned functionality, and establishing comprehensive audit logging with full test coverage.

**Architecture:** Expand database schema with missing tables/columns, implement hybrid audit logging (DB triggers + tRPC middleware), build subcontractor invitation workflows, and create end-to-end tests without mocking owned code.

**Tech Stack:** PostgreSQL/Supabase, TypeScript, tRPC, React, Vitest, Playwright, real database testing

---

## Quality Principles (MANDATORY)

### Principle 1: Test Coverage is a Priority

Every piece of functionality touched MUST have comprehensive test coverage:

| Test Type | Scope | Tool | When to Write |
|-----------|-------|------|---------------|
| **Unit Tests** | Pure functions, utilities, calculations | Vitest | Before implementation (TDD) |
| **Integration Tests** | Services, tRPC endpoints, DB queries | Vitest + Real DB | After unit tests pass |
| **Component Tests** | React components with real data | Testing Library | After integration tests |
| **E2E Tests** | Full user workflows | Playwright | After feature complete |

**Test Requirements Per Feature:**
- Unit tests for all new functions and utilities
- Integration tests for all database operations
- Component tests for all UI changes
- E2E tests for all user-facing workflows
- Tests must use real database (no mocking owned code)
- Tests must verify the plan requirements are met
- Tests must prevent future regressions

### Principle 2: Fix Linting Issues Immediately

Any linting issues in files touched during implementation MUST be fixed when discovered:

```bash
# Run before committing ANY changes
pnpm lint --fix
pnpm type-check

# If linting errors remain after --fix:
# 1. Fix them manually
# 2. Do NOT commit with linting errors
# 3. Do NOT add eslint-disable comments without team approval
```

**Enforcement:**
- Run lint check as part of each task's verification step
- Pre-commit hooks should block commits with linting errors
- CI should fail builds with linting errors

### Principle 3: Track Discovered Bugs

Bugs discovered in files touched but UNRELATED to current functionality:

1. **If blocking current work** → Fix immediately, document in commit
2. **If not blocking** → Append to `## Appendix: Discovered Issues` at end of this plan

**Bug Entry Format:**
```markdown
### BUG-XXX: Brief description
- **File:** `path/to/file.ts:123`
- **Discovered During:** Task X.X
- **Severity:** Critical/High/Medium/Low
- **Description:** What's wrong
- **Blocking:** Yes/No
- **Action:** Fix now / Fix later
```

### Principle 4: Track Failing Unrelated Tests

Tests that fail but are UNRELATED to current functionality:

1. **If blocking CI/CD** → Fix immediately
2. **If not blocking** → Append to `## Appendix: Failing Tests` at end of this plan

**Failing Test Entry Format:**
```markdown
### TEST-XXX: test.file.ts - "test name"
- **Test File:** `path/to/test.ts`
- **Discovered During:** Task X.X
- **Error:** Brief error message
- **Likely Cause:** Assessment of why it's failing
- **Blocking:** Yes/No
- **Action:** Fix now / Fix later
```

### The Core Principle

> **We will NOT ignore things that are broken or incorrect.**
>
> - Fix immediately if related to current work
> - Fix immediately if blocking current work
> - Append to plan for follow-up if unrelated and non-blocking
> - Never skip, never ignore, never leave undocumented

---

## Executive Summary

### The Problem

The original database schema plan (02-database-schema.md) defined a comprehensive set of tables including `broker_clients`, `compliance_records`, and cached Scaffald data tables. However, the actual implementation created a **simpler, different schema**:

| Planned Table | Actual Table | Status |
|--------------|--------------|--------|
| `broker_clients` | Does not exist | Code queries it, fails |
| `compliance_records` | Does not exist | Code queries it, fails |
| `cached_users/companies/projects` | Do not exist | Planned but never created |
| `subcontractors.company_name` | `subcontractors.company` | Column name mismatch |
| `compliance_scores.overall_score` | `compliance_scores.score` | Column name mismatch |
| `project_requirements` junction | Does not exist | Critical for compliance |

The `dashboardService.ts` was written against the **planned** schema, causing all dashboard queries to fail.

### The Decision: EXPAND Schema + Build Functionality

Rather than reducing functionality to match the limited schema, we will:

1. **Expand the schema** with missing tables and columns
2. **Build all planned functionality** including subcontractor invitation acceptance
3. **Implement hybrid audit logging** for compliance-grade traceability
4. **Create comprehensive tests** without mocking owned code

### Effort Estimate (Including Test Coverage)

| Phase | Scope | Implementation | Tests | Total |
|-------|-------|----------------|-------|-------|
| Phase 1: Schema Expansion | Add missing tables/columns | 8-12h | 4-6h | 12-18h |
| Phase 2: Core Fixes | Fix broken dashboards, mock data | 12-16h | 8-12h | 20-28h |
| Phase 3: Invitation Workflow | Subcontractor acceptance UI | 16-20h | 12-16h | 28-36h |
| Phase 4: Audit Logging | Hybrid implementation | 20-24h | 10-14h | 30-38h |
| Phase 5: Risk Calculation | Algorithm implementation | 12-16h | 8-12h | 20-28h |
| Phase 6: E2E & Playwright | Full workflow tests | - | 16-24h | 16-24h |
| **Total** | | **68-88h** | **58-84h** | **126-172h** |

**Note:** Test effort is ~50% of implementation effort. This ensures comprehensive coverage.

---

## Phase 1: Schema Expansion

### Task 1.1: Create `broker_clients` Table

**Files:**
- Create: `packages/supabase/migrations/260_forsured_create_broker_clients.sql`
- Test: `packages/supabase/migrations/__tests__/260_broker_clients.test.sql`

**Step 1: Write the migration**

```sql
-- Migration: 260_forsured_create_broker_clients.sql
-- Description: Create broker_clients table for broker-client relationships
-- REQ: Schema alignment with original design

CREATE TABLE forsured.broker_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Broker organization (from Scaffald)
  broker_org_id UUID NOT NULL,
  CONSTRAINT fk_broker_clients_broker_org
    FOREIGN KEY (broker_org_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client organization (from Scaffald)
  client_org_id UUID NOT NULL,
  CONSTRAINT fk_broker_clients_client_org
    FOREIGN KEY (client_org_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client details (denormalized for query performance)
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Classification
  client_type TEXT NOT NULL CHECK (client_type IN (
    'general_contractor', 'subcontractor', 'owner', 'developer'
  )),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN (
    'low', 'medium', 'high', 'critical'
  )),

  -- Compliance
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Activity tracking
  last_activity_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  notes TEXT,

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Unique constraint
  CONSTRAINT unique_broker_client UNIQUE (broker_org_id, client_org_id)
);

-- Indexes
CREATE INDEX idx_broker_clients_broker ON forsured.broker_clients(broker_org_id);
CREATE INDEX idx_broker_clients_client ON forsured.broker_clients(client_org_id);
CREATE INDEX idx_broker_clients_status ON forsured.broker_clients(status);
CREATE INDEX idx_broker_clients_risk ON forsured.broker_clients(risk_level);
CREATE INDEX idx_broker_clients_deleted ON forsured.broker_clients(deleted_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE forsured.broker_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view their clients"
  ON forsured.broker_clients FOR SELECT
  USING (broker_org_id IN (
    SELECT organization_id FROM forsured.user_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Brokers can manage their clients"
  ON forsured.broker_clients FOR ALL
  USING (broker_org_id IN (
    SELECT organization_id FROM forsured.user_profiles
    WHERE user_id = auth.uid() AND role = 'broker'
  ));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.broker_clients TO authenticated;
GRANT ALL ON forsured.broker_clients TO service_role;

-- Comments
COMMENT ON TABLE forsured.broker_clients IS 'Broker-client relationships with compliance tracking';
```

**Step 2: Run migration**

```bash
cd packages/supabase && pnpm supabase db push
```

Expected: Migration applies successfully

**Step 3: Verify table exists**

```bash
pnpm supabase db query "SELECT * FROM forsured.broker_clients LIMIT 1;"
```

Expected: Empty result set (no error)

**Step 4: Commit**

```bash
git add packages/supabase/migrations/260_forsured_create_broker_clients.sql
git commit -m "feat(db): add broker_clients table for broker-client relationships"
```

---

### Task 1.2: Create `compliance_records` Table

**Files:**
- Create: `packages/supabase/migrations/261_forsured_create_compliance_records.sql`

**Step 1: Write the migration**

```sql
-- Migration: 261_forsured_create_compliance_records.sql
-- Description: Create compliance_records table for assessment history
-- REQ: Schema alignment with original design

CREATE TABLE forsured.compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization reference
  organization_id UUID NOT NULL,
  CONSTRAINT fk_compliance_records_org
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client reference (for broker workflows)
  client_id UUID NOT NULL,
  CONSTRAINT fk_compliance_records_client
    FOREIGN KEY (client_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Compliance metrics
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Issue counts
  issues_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  policies_expiring_soon INTEGER DEFAULT 0,

  -- Review dates
  last_review_date DATE NOT NULL,
  next_review_date DATE,

  -- Notes
  notes TEXT,

  -- Reviewed by
  reviewed_by_user_id UUID,
  CONSTRAINT fk_compliance_records_reviewer
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_compliance_records_org ON forsured.compliance_records(organization_id);
CREATE INDEX idx_compliance_records_client ON forsured.compliance_records(client_id);
CREATE INDEX idx_compliance_records_score ON forsured.compliance_records(overall_score);
CREATE INDEX idx_compliance_records_risk ON forsured.compliance_records(risk_level);
CREATE INDEX idx_compliance_records_review ON forsured.compliance_records(last_review_date);

-- RLS
ALTER TABLE forsured.compliance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance records in their org"
  ON forsured.compliance_records FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM forsured.user_profiles WHERE user_id = auth.uid()
  ));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.compliance_records TO authenticated;
GRANT ALL ON forsured.compliance_records TO service_role;

-- Comments
COMMENT ON TABLE forsured.compliance_records IS 'Compliance assessment records with review history';
```

**Step 2: Run and verify**

```bash
cd packages/supabase && pnpm supabase db push
```

**Step 3: Commit**

```bash
git add packages/supabase/migrations/261_forsured_create_compliance_records.sql
git commit -m "feat(db): add compliance_records table for assessment history"
```

---

### Task 1.3: Create `project_requirements` Junction Table

**Files:**
- Create: `packages/supabase/migrations/262_forsured_create_project_requirements.sql`

**Step 1: Write the migration**

```sql
-- Migration: 262_forsured_create_project_requirements.sql
-- Description: Junction table linking projects to compliance requirements
-- REQ: Enable proving which requirements are met per project

CREATE TABLE forsured.project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project reference
  project_id UUID NOT NULL,
  CONSTRAINT fk_project_requirements_project
    FOREIGN KEY (project_id)
    REFERENCES forsured.projects(id)
    ON DELETE CASCADE,

  -- Requirement reference
  requirement_id UUID NOT NULL,
  CONSTRAINT fk_project_requirements_requirement
    FOREIGN KEY (requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Status
  is_required BOOLEAN DEFAULT true,
  is_met BOOLEAN DEFAULT false,

  -- Override values (project can have different thresholds than template)
  minimum_amount_override NUMERIC(15, 2),

  -- Evidence
  met_by_document_id UUID,
  CONSTRAINT fk_project_requirements_document
    FOREIGN KEY (met_by_document_id)
    REFERENCES forsured.documents(id)
    ON DELETE SET NULL,

  met_by_policy_id UUID,
  CONSTRAINT fk_project_requirements_policy
    FOREIGN KEY (met_by_policy_id)
    REFERENCES forsured.policies(id)
    ON DELETE SET NULL,

  -- Evaluation
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  evaluation_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Unique constraint
  CONSTRAINT unique_project_requirement UNIQUE (project_id, requirement_id)
);

-- Indexes
CREATE INDEX idx_project_requirements_project ON forsured.project_requirements(project_id);
CREATE INDEX idx_project_requirements_requirement ON forsured.project_requirements(requirement_id);
CREATE INDEX idx_project_requirements_is_met ON forsured.project_requirements(is_met);
CREATE INDEX idx_project_requirements_document ON forsured.project_requirements(met_by_document_id);

-- RLS
ALTER TABLE forsured.project_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project requirements for accessible projects"
  ON forsured.project_requirements FOR SELECT
  USING (project_id IN (
    SELECT id FROM forsured.projects
    WHERE organization_id IN (
      SELECT organization_id FROM forsured.user_profiles WHERE user_id = auth.uid()
    )
  ));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.project_requirements TO authenticated;
GRANT ALL ON forsured.project_requirements TO service_role;

-- Comments
COMMENT ON TABLE forsured.project_requirements IS 'Links projects to their compliance requirements with fulfillment tracking';
COMMENT ON COLUMN forsured.project_requirements.is_met IS 'Whether this requirement has been satisfied';
COMMENT ON COLUMN forsured.project_requirements.met_by_document_id IS 'Document that proves this requirement is met';
```

**Step 2: Run and commit**

```bash
cd packages/supabase && pnpm supabase db push
git add packages/supabase/migrations/262_forsured_create_project_requirements.sql
git commit -m "feat(db): add project_requirements junction table"
```

---

### Task 1.4: Extend `subcontractors` Table

**Files:**
- Create: `packages/supabase/migrations/263_forsured_extend_subcontractors.sql`

**Step 1: Write the migration**

```sql
-- Migration: 263_forsured_extend_subcontractors.sql
-- Description: Add missing columns to subcontractors table
-- REQ: Schema alignment - dashboardService expects these columns

-- Add missing columns
ALTER TABLE forsured.subcontractors
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
ADD COLUMN IF NOT EXISTS trade_type TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER
  CHECK (compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100)),
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low'
  CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add company_name as alias view or computed column
-- Note: The existing column is 'company', but code expects 'company_name'
-- We'll create a view that provides the expected interface

CREATE OR REPLACE VIEW forsured.subcontractors_extended AS
SELECT
  id,
  name,
  company AS company_name,  -- Alias for compatibility
  company,  -- Keep original
  scaffald_company_id,
  organization_id,
  contact_info,
  status,
  trade_type,
  license_number,
  compliance_score,
  risk_level,
  last_activity_at,
  created_at,
  updated_at
FROM forsured.subcontractors;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_subcontractors_status ON forsured.subcontractors(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_risk ON forsured.subcontractors(risk_level);
CREATE INDEX IF NOT EXISTS idx_subcontractors_compliance ON forsured.subcontractors(compliance_score);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION forsured.update_subcontractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subcontractors_updated_at ON forsured.subcontractors;
CREATE TRIGGER subcontractors_updated_at
  BEFORE UPDATE ON forsured.subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_subcontractors_updated_at();

COMMENT ON COLUMN forsured.subcontractors.status IS 'Account status: active, inactive, pending, suspended';
COMMENT ON COLUMN forsured.subcontractors.risk_level IS 'Calculated risk level based on compliance';
```

**Step 2: Run and commit**

```bash
cd packages/supabase && pnpm supabase db push
git add packages/supabase/migrations/263_forsured_extend_subcontractors.sql
git commit -m "feat(db): extend subcontractors table with missing columns"
```

---

### Task 1.5: Extend `compliance_scores` Table

**Files:**
- Create: `packages/supabase/migrations/264_forsured_extend_compliance_scores.sql`

**Step 1: Write the migration**

```sql
-- Migration: 264_forsured_extend_compliance_scores.sql
-- Description: Add missing columns and create view with expected column names
-- REQ: Schema alignment - dashboardService expects overall_score, not score

-- Add missing columns
ALTER TABLE forsured.compliance_scores
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create view with expected column names (overall_score instead of score)
CREATE OR REPLACE VIEW forsured.compliance_scores_extended AS
SELECT
  id,
  project_id,
  subcontractor_id,
  organization_id,
  score AS overall_score,  -- Alias for compatibility
  score,  -- Keep original
  status,
  gaps,
  expires_at,
  notes,
  last_evaluated AS last_evaluated_at,  -- Alias
  last_evaluated,
  created_at,
  updated_at
FROM forsured.compliance_scores;

-- Grant access to view
GRANT SELECT ON forsured.compliance_scores_extended TO authenticated;
GRANT ALL ON forsured.compliance_scores_extended TO service_role;

COMMENT ON COLUMN forsured.compliance_scores.expires_at IS 'When this compliance evaluation expires';
COMMENT ON COLUMN forsured.compliance_scores.notes IS 'Evaluation notes from reviewer';
```

**Step 2: Run and commit**

```bash
cd packages/supabase && pnpm supabase db push
git add packages/supabase/migrations/264_forsured_extend_compliance_scores.sql
git commit -m "feat(db): extend compliance_scores with missing columns"
```

---

## Phase 2: Fix Broken Dashboards

### Task 2.1: Update dashboardService.ts to Use Correct Tables

**Files:**
- Modify: `apps/forsured-web/src/lib/api/dashboard/dashboardService.ts`
- Test: `apps/forsured-web/src/lib/api/dashboard/__tests__/dashboardService.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/forsured-web/src/lib/api/dashboard/__tests__/dashboardService.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { dashboardService } from '../dashboardService'
import { supabase } from '../../../supabase'

describe('dashboardService', () => {
  describe('getOverview', () => {
    it('should return dashboard overview without throwing', async () => {
      const result = await dashboardService.getOverview()

      expect(result).toHaveProperty('overall_compliance_score')
      expect(result).toHaveProperty('total_subcontractors')
      expect(result).toHaveProperty('compliant_count')
      expect(result).toHaveProperty('warning_count')
      expect(result).toHaveProperty('critical_count')
      expect(typeof result.overall_compliance_score).toBe('number')
    })
  })

  describe('getSubcontractorScores', () => {
    it('should return array of subcontractor scores', async () => {
      const result = await dashboardService.getSubcontractorScores()

      expect(Array.isArray(result)).toBe(true)
      // Each score should have expected properties
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('company_name')
        expect(result[0]).toHaveProperty('compliance_score')
        expect(result[0]).toHaveProperty('status')
      }
    })
  })

  describe('getTaskSummary', () => {
    it('should return task counts by priority', async () => {
      const result = await dashboardService.getTaskSummary()

      expect(result).toHaveProperty('total_open_tasks')
      expect(result).toHaveProperty('high_priority_count')
      expect(result).toHaveProperty('overdue_count')
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/forsured-web && pnpm vitest run src/lib/api/dashboard/__tests__/dashboardService.test.ts
```

Expected: FAIL with "relation 'forsured.broker_clients' does not exist" or similar

**Step 3: Update dashboardService.ts**

The key changes needed:
1. Replace `broker_clients` queries with `subcontractors`
2. Replace `compliance_records` queries with `compliance_scores`
3. Use correct column names or use the extended views

```typescript
// Key changes in dashboardService.ts

// OLD (line 44-45):
// const { data: complianceRecords = [] } = await supabase.schema('forsured').from('compliance_records').select('*')
// const { data: clients = [] } = await supabase.schema('forsured').from('broker_clients').select('*')

// NEW:
const { data: complianceRecords = [] } = await supabase
  .schema('forsured')
  .from('compliance_scores')
  .select('*')

const { data: clients = [] } = await supabase
  .schema('forsured')
  .from('subcontractors')
  .select('*')

// When accessing properties, use the actual column names:
// OLD: record.overall_score
// NEW: record.score

// OLD: client.company_name
// NEW: client.company
```

**Step 4: Run test to verify it passes**

```bash
cd apps/forsured-web && pnpm vitest run src/lib/api/dashboard/__tests__/dashboardService.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/forsured-web/src/lib/api/dashboard/
git commit -m "fix(dashboard): use correct table/column names in dashboardService"
```

---

### Task 2.2: Remove Mock Data from SubcontractorProjectsPage

**Files:**
- Modify: `apps/forsured-web/src/components/Subcontractor/SubcontractorProjectsPage.tsx`
- Test: `apps/forsured-web/src/components/Subcontractor/__tests__/SubcontractorProjectsPage.test.tsx`

**Step 1: Write the failing test**

```typescript
// SubcontractorProjectsPage.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SubcontractorProjectsPage } from '../SubcontractorProjectsPage'
import { supabase } from '../../../lib/supabase'

// Mock supabase to return test data
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [
                {
                  id: 'test-project-1',
                  project: {
                    id: 'p1',
                    name: 'Real Project',
                    organization: { name: 'Real GC Company' }
                  },
                  status: 'active'
                }
              ],
              error: null
            })
          })
        })
      })
    })
  }
}))

describe('SubcontractorProjectsPage', () => {
  it('should fetch and display real projects, not mock data', async () => {
    render(<SubcontractorProjectsPage />)

    await waitFor(() => {
      // Should show real project name, not "Sample Project 1"
      expect(screen.queryByText('Sample Project 1')).not.toBeInTheDocument()
      expect(screen.getByText('Real Project')).toBeInTheDocument()
    })
  })
})
```

**Step 2: Implement the fix**

Replace mock data with real database query:

```typescript
// SubcontractorProjectsPage.tsx - key changes

// REMOVE: const mockProjects = [...] (lines 11-74)

// ADD: Real data fetching
const [projects, setProjects] = useState<ProjectWithRelations[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .schema('forsured')
        .from('project_subcontractors')
        .select(`
          id,
          status,
          invited_at,
          project:projects (
            id,
            name,
            organization:core.organizations (name)
          )
        `)
        .eq('subcontractor_id', currentSubcontractorId)
        .in('status', ['active', 'onboarding'])
        .order('invited_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  fetchProjects()
}, [currentSubcontractorId])
```

**Step 3: Run tests and commit**

```bash
cd apps/forsured-web && pnpm vitest run src/components/Subcontractor/
git add apps/forsured-web/src/components/Subcontractor/
git commit -m "fix(subcontractor): replace mock data with real project query"
```

---

## Phase 3: Subcontractor Invitation Acceptance Workflow ✅ COMPLETE

**Status:** Completed on 2024-12-23 by parallel implementation effort.

**Implementation:** The bidirectional connection and referral system fully supersedes the original Phase 3 plan. See:
- `BIDIRECTIONAL_CONNECTIONS_IMPLEMENTATION.md` - Implementation details
- `BIDIRECTIONAL_SYSTEM_SUMMARY.md` - Complete feature summary

**Key Deliverables:**
- Database migrations 270-272 (relationship_invitations, referrals, admin management)
- Services: connectionCodes.ts, relationshipInvitations.ts, referrals.ts, referralCredits.ts
- UI Pages: MyBrokerPage (subcontractor/manager), ReferralSettings, AdminReferralManagement
- E2E Tests: Comprehensive Playwright tests with httpOnly cookie auth
- BKR/CTR/MGR relationship codes for broker/contractor/manager connections
- RFR referral codes for general business referrals

Original separate plan is now obsolete: `2024-12-23-subcontractor-invitation-workflow.md`

---

## Phase 4: Hybrid Audit Logging System

See separate plan: `2024-12-23-hybrid-audit-logging.md`

---

## Phase 5: Risk Calculation Algorithm

See separate plan: `2024-12-23-risk-calculation-algorithm.md`

---

## Phase 6: Comprehensive Testing Strategy

See separate plan: `2024-12-23-testing-strategy-no-mocks.md`

---

## Phase 7: Test Infrastructure - httpOnly Cookie Authentication

### Task 7.1: Create Shared httpOnly Cookie Test Handler

**Problem:** The application switched from localStorage-based Supabase auth to httpOnly cookie-based Scaffald OAuth authentication. All existing Playwright tests use `setupAuthAs()` which injects Supabase sessions into localStorage, but the app now expects httpOnly cookies.

**Solution:** Create a shared test handler that properly sets up httpOnly cookie authentication for all Playwright tests.

**Files:**
- Create: `apps/forsured-web/tests/utils/httpOnlyAuth.ts`
- Update: `apps/forsured-web/tests/fixtures/base.ts` (integrate new handler)
- Update: `apps/forsured-web/tests/e2e/my-broker-page.spec.ts` (use new handler)

**Implementation Steps:**

1. **Create httpOnly cookie authentication handler:**
   - Use Playwright's `page.context().addCookies()` to set httpOnly cookies
   - Create cookies that match the Scaffald OAuth session format
   - Support both test user authentication and session refresh
   - Handle cookie expiration and refresh logic

2. **Create test helper functions:**
   - `setupHttpOnlyAuth(page, email)` - Sets up httpOnly cookie auth for a test user
   - `waitForAuthReady(page)` - Waits for AuthContext to load user and profile
   - `verifyAuthState(page)` - Verifies authentication is working correctly

3. **Update base fixtures:**
   - Add `setupHttpOnlyAuth` to BaseFixtures interface
   - Integrate with existing `setupAuthAs` or replace it
   - Ensure backward compatibility during migration

4. **Test the handler:**
   - Update `my-broker-page.spec.ts` to use new handler
   - Verify tests pass with httpOnly cookies
   - Ensure profile loading works correctly

**Acceptance Criteria:**
- [ ] httpOnly cookie handler created and tested
- [ ] `my-broker-page.spec.ts` passes with new handler
- [ ] Handler properly waits for AuthContext to load profile
- [ ] Handler supports all test user types (contractor, manager, broker, admin)
- [ ] Documentation added for using the handler

**Dependencies:** None (foundational test infrastructure)

---

## Phase 8: Migrate All Tests to httpOnly Cookie Authentication

### Task 8.1: Replace localStorage Auth with httpOnly Cookie Handler

**Problem:** All existing Playwright tests use localStorage-based authentication (`setupAuthAs` with Supabase session injection), but the app now uses httpOnly cookies. All tests need to be migrated to use the new shared handler.

**Solution:** Systematically replace all `setupAuthAs()` calls with `setupHttpOnlyAuth()` across all test files.

**Files to Update:**
- `apps/forsured-web/tests/e2e/*.spec.ts` (all test files)
- `apps/forsured-web/tests/utils/auth.ts` (deprecate localStorage functions)
- Any test helpers that use authentication

**Implementation Steps:**

1. **Audit all test files:**
   - Find all files using `setupAuthAs` or localStorage auth
   - Document which tests need migration
   - Prioritize by test importance and frequency of use

2. **Migrate tests systematically:**
   - Start with critical path tests (login, dashboard, core workflows)
   - Update each test to use `setupHttpOnlyAuth`
   - Verify each test passes after migration
   - Update test documentation as needed

3. **Deprecate old auth utilities:**
   - Mark localStorage-based functions as deprecated
   - Add migration guide comments
   - Remove old code after all tests migrated

4. **Verify test suite:**
   - Run full test suite to ensure no regressions
   - Fix any issues discovered during migration
   - Update CI/CD if needed

**Acceptance Criteria:**
- [ ] All test files migrated to httpOnly cookie handler
- [ ] All tests pass with new authentication method
- [ ] Old localStorage auth utilities removed or deprecated
- [ ] Test documentation updated
- [ ] No test failures introduced

**Dependencies:** Phase 7 (Task 7.1) - requires shared handler to exist first

---

## Execution Order

1. **Week 1: Schema Foundation**
   - Task 1.1-1.5: Create all missing tables and columns
   - Task 2.1-2.2: Fix broken dashboards

2. **Week 2: Core Workflows**
   - Phase 3: Subcontractor invitation acceptance
   - Phase 5: Risk calculation algorithm

3. **Week 3: Audit & Compliance**
   - Phase 4: Hybrid audit logging

4. **Week 4: Testing & Polish**
   - Phase 6: Comprehensive testing
   - Phase 7: httpOnly cookie test handler (foundational)
   - Integration testing
   - Bug fixes

5. **Week 5: Test Infrastructure Migration**
   - Phase 8: Migrate all tests to httpOnly cookies
   - Verify all tests pass
   - Remove deprecated localStorage auth code

---

## Success Criteria

### Functional Requirements
- [ ] All dashboard queries execute without errors
- [ ] Subcontractors can accept/decline project invitations
- [ ] Risk levels are calculated and displayed correctly
- [ ] Every user action is logged to audit_log
- [ ] Project requirements junction table functional with evidence tracking

### Test Coverage Requirements
- [ ] Unit tests: All new functions and utilities (100% of new code)
- [ ] Integration tests: All tRPC endpoints and services (real database)
- [ ] Component tests: All modified React components (Testing Library)
- [ ] E2E tests: All critical user workflows (Playwright)
- [ ] No mocking of owned code (database, API, services)
- [ ] All tests pass in CI/CD pipeline

### Quality Requirements
- [ ] Zero linting errors in modified files
- [ ] Zero TypeScript errors
- [ ] All discovered bugs documented (fixed or appended)
- [ ] All failing unrelated tests documented (fixed or appended)

### Playwright E2E Test Coverage

The following user workflows MUST have Playwright tests:

| Workflow | Test File | Priority |
|----------|-----------|----------|
| Manager login and dashboard view | `e2e/manager-dashboard.spec.ts` | P0 |
| Manager creates project | `e2e/project-creation.spec.ts` | P0 |
| Manager invites subcontractor | `e2e/invite-subcontractor.spec.ts` | P0 |
| Subcontractor accepts invitation | `e2e/accept-invitation.spec.ts` | P0 |
| Subcontractor views projects | `e2e/subcontractor-projects.spec.ts` | P0 |
| Task creation and assignment | `e2e/task-management.spec.ts` | P1 |
| Document upload | `e2e/document-upload.spec.ts` | P1 |
| Risk score display | `e2e/risk-display.spec.ts` | P1 |
| Audit log verification | `e2e/audit-trail.spec.ts` | P1 |

---

## Appendix: Discovered Issues

*Issues discovered during implementation that are unrelated to current work. These must be addressed after the current plan is complete.*

### Template:
```markdown
### BUG-XXX: [Title]
- **File:** `path/to/file.ts:line`
- **Discovered During:** Task X.X
- **Severity:** Critical/High/Medium/Low
- **Description:** [What's wrong]
- **Blocking:** Yes/No
- **Action:** Fix now / Fix later
- **Status:** Open/Fixed
```

### BUG-001: Supabase types.ts corrupted with shell output
- **File:** `packages/supabase/types.ts:1-8`
- **Discovered During:** Task 1.5 (lint check)
- **Severity:** Medium
- **Description:** The types.ts file contained shell output from supabase CLI prepended to the TypeScript content, causing parse errors
- **Blocking:** Yes (blocked lint)
- **Action:** Fixed now
- **Status:** Fixed - regenerated types with filtered output

### BUG-002: CCPA data-collector uses let for never-reassigned variables
- **File:** `packages/supabase/functions/trpc/routers/ccpa/data-collector.ts:407-408`
- **Discovered During:** Task 1.5 (lint check)
- **Severity:** Low
- **Description:** Variables `stripeCustomerId` and `stripeConnected` use `let` but are never reassigned
- **Blocking:** No (warnings only)
- **Action:** Fix later
- **Status:** Open

### BUG-003: Pre-existing TypeScript errors in monorepo packages
- **File:** Multiple files in `packages/ui`, `tests/infrastructure`
- **Discovered During:** Task 1.5 (type-check)
- **Severity:** Medium
- **Description:** Theme properties possibly undefined in UI components, supabase-js module import issues in test helpers
- **Blocking:** No (forsured-web passes)
- **Action:** Fix later
- **Status:** Open

---

## Appendix: Failing Tests

*Tests that fail during implementation but are unrelated to current functionality. These must be addressed after the current plan is complete.*

### Template:
```markdown
### TEST-XXX: [test file] - "[test name]"
- **Test File:** `path/to/test.ts`
- **Discovered During:** Task X.X
- **Error:** [Error message]
- **Likely Cause:** [Assessment]
- **Blocking:** Yes/No
- **Action:** Fix now / Fix later
- **Status:** Open/Fixed
```

*(No failing tests discovered yet - update as implementation proceeds)*

---

## Appendix: Linting Issues Fixed

*Track linting issues fixed during implementation for documentation purposes.*

| File | Issue | Task | Fixed |
|------|-------|------|-------|
| `packages/supabase/types.ts` | Corrupted with shell output from supabase CLI | 1.5 | ✅ Regenerated |

---

## Implementation Checklist Per Task

Before marking ANY task complete, verify:

```markdown
## Task Completion Checklist

- [ ] Implementation complete
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Component tests written and passing (if UI)
- [ ] `pnpm lint --fix` run on modified files
- [ ] `pnpm type-check` passes
- [ ] No new linting errors introduced
- [ ] Any discovered bugs documented in Appendix
- [ ] Any failing unrelated tests documented in Appendix
- [ ] Code committed with descriptive message
- [ ] Ready for next task
```

---

**Plan Created:** 2024-12-23
**Author:** Claude (with writing-plans skill)
**Status:** Ready for Execution
**Last Updated:** 2024-12-23 (Added quality principles and test coverage requirements)
