/**
 * Integration Tests for Complete Compliance Workflow
 * REQ-2, TASK-20: Test end-to-end compliance requirement management
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 *
 * Tests the complete workflow including:
 * - Requirements CRUD with version history
 * - Dependency management with cycle detection
 * - Bulk import/export operations
 * - Authorization integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import { complianceRequirementsRouter } from '../complianceRequirements';
import { complianceDependenciesRouter } from '../complianceDependencies';
import { bulkOperationsRouter } from '../bulkOperations';
import {
  testSupabaseAdmin,
  forsured,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;
let testRequirementIds: string[] = [];
let testDependencyIds: string[] = [];
let testCreatedRequirementId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Compliance Workflow Integration Tests', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find existing requirements to use for tests
    const { data: reqs } = await forsured('compliance_requirements')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(3);

    if (reqs && reqs.length > 0) {
      testRequirementIds = reqs.map((r) => r.id);
    }
  });

  afterAll(async () => {
    // Clean up test dependencies first
    for (const depId of testDependencyIds) {
      await forsured('compliance_requirement_dependencies').delete().eq('id', depId);
    }

    // Clean up created requirement
    if (testCreatedRequirementId) {
      await forsured('compliance_requirements').delete().eq('id', testCreatedRequirementId);
    }
  });

  // Helper to create caller context
  const createContext = (
    userId: string | null = testUserId,
    organizationId: string | null = testOrgId
  ) => {
    const mockUser: User | null = userId
      ? ({
          id: userId,
          email: 'admin@test.forsured.com',
        } as User)
      : null;

    return {
      db: testSupabaseAdmin as any,
      session: mockUser,
      userId,
      organizationId,
    };
  };

  // ===========================================================================
  // WORKFLOW 1: Complete Requirement Lifecycle
  // ===========================================================================

  describe('Complete Requirement Lifecycle', () => {
    it('should list, create, and manage requirements', async () => {
      const ctx = createContext();
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);

      // Step 1: List existing requirements
      const listResult = await requirementsRouter.list({
        organizationId: testOrgId,
        page: 1,
        pageSize: 10,
      });

      expect(Array.isArray(listResult.requirements)).toBe(true);
      expect(listResult.pagination).toBeDefined();

      // Step 2: Create a new requirement
      const createResult = await requirementsRouter.create({
        organizationId: testOrgId,
        code: `GL-INT-${Date.now()}`,
        name: 'General Liability for Integration Test',
        type: 'general_liability',
        description: 'Created during integration testing',
        requirement_definition: {
          coverage_limits: {
            per_occurrence: 1000000,
            aggregate: 2000000,
          },
          required_endorsements: [],
          policy_conditions: [],
          documentation_requirements: [],
        },
      });

      expect(createResult.code).toContain('GL-INT');
      expect(createResult.status).toBe('draft');
      testCreatedRequirementId = createResult.id;

      // Step 3: Get the created requirement
      const getResult = await requirementsRouter.get({
        organizationId: testOrgId,
        requirementId: testCreatedRequirementId,
      });

      expect(getResult.id).toBe(testCreatedRequirementId);
      expect(getResult.name).toBe('General Liability for Integration Test');

      // Step 4: Update the requirement
      const updateResult = await requirementsRouter.update({
        organizationId: testOrgId,
        requirementId: testCreatedRequirementId,
        updates: {
          status: 'active',
        },
        change_summary: 'Activated for production use',
      });

      expect(updateResult.status).toBe('active');
    });

    it('should get version history for a requirement', async () => {
      if (testRequirementIds.length === 0) {
        console.warn('Skipping test - no test requirements available');
        return;
      }

      const ctx = createContext();
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);

      const result = await requirementsRouter.getVersions({
        organizationId: testOrgId,
        requirementId: testRequirementIds[0],
        page: 1,
        pageSize: 10,
      });

      expect(Array.isArray(result.versions)).toBe(true);
      expect(result.pagination).toBeDefined();
    });
  });

  // ===========================================================================
  // WORKFLOW 2: Dependency Management
  // ===========================================================================

  describe('Dependency Management', () => {
    it('should list dependencies for a requirement', async () => {
      if (testRequirementIds.length === 0) {
        console.warn('Skipping test - no test requirements available');
        return;
      }

      const ctx = createContext();
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      const result = await dependenciesRouter.list({
        organizationId: testOrgId,
        requirementId: testRequirementIds[0],
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should validate cycle detection before creating dependency', async () => {
      if (testRequirementIds.length < 2) {
        console.warn('Skipping test - need at least 2 requirements for cycle validation');
        return;
      }

      const ctx = createContext();
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      const result = await dependenciesRouter.validateCycle({
        organizationId: testOrgId,
        requirementId: testRequirementIds[0],
        dependsOnId: testRequirementIds[1],
      });

      expect(typeof result.would_create_cycle).toBe('boolean');
    });

    it('should get dependency tree for a requirement', async () => {
      if (testRequirementIds.length === 0) {
        console.warn('Skipping test - no test requirements available');
        return;
      }

      const ctx = createContext();
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      const result = await dependenciesRouter.getTree({
        organizationId: testOrgId,
        requirementId: testRequirementIds[0],
      });

      expect(result.id).toBe(testRequirementIds[0]);
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('should get dependents for a requirement', async () => {
      if (testRequirementIds.length === 0) {
        console.warn('Skipping test - no test requirements available');
        return;
      }

      const ctx = createContext();
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      const result = await dependenciesRouter.getDependents({
        organizationId: testOrgId,
        requirementId: testRequirementIds[0],
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ===========================================================================
  // WORKFLOW 3: Bulk Import and Export
  // ===========================================================================

  describe('Bulk Import and Export Workflow', () => {
    it('should preview import data', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      const importData = JSON.stringify([
        {
          code: 'GL-BULK-001',
          name: 'General Liability Bulk',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const preview = await bulkRouter.importPreview({
        organizationId: testOrgId,
        data: importData,
        format: 'json',
      });

      expect(typeof preview.totalRows).toBe('number');
      expect(typeof preview.validRows).toBe('number');
      expect(typeof preview.canProceed).toBe('boolean');
    });

    it('should export requirements in JSON format', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      const result = await bulkRouter.export({
        organizationId: testOrgId,
        format: 'json',
      });

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('.json');
      expect(typeof result.totalRecords).toBe('number');
    });

    it('should export requirements in CSV format', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      const result = await bulkRouter.export({
        organizationId: testOrgId,
        format: 'csv',
      });

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
    });

    it('should get export summary', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      const result = await bulkRouter.exportSummary({
        organizationId: testOrgId,
      });

      expect(typeof result.totalRequirements).toBe('number');
      expect(result.byType).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('should get import templates', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      const result = await bulkRouter.importTemplates({});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // WORKFLOW 4: Authorization Enforcement
  // ===========================================================================

  describe('Authorization Enforcement', () => {
    it('should enforce organization boundaries for requirements list', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        requirementsRouter.list({
          organizationId: OTHER_ORG_UUID,
          page: 1,
          pageSize: 10,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject unauthenticated access to requirements', async () => {
      const ctx = createContext(null);
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        requirementsRouter.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject user without organization for dependencies', async () => {
      const ctx = createContext(testUserId, null);
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        dependenciesRouter.list({
          organizationId: testOrgId,
          requirementId: testRequirementIds[0] ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should reject cross-organization access for bulk operations', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      await expect(
        bulkRouter.export({
          organizationId: OTHER_ORG_UUID,
          format: 'json',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  // ===========================================================================
  // WORKFLOW 5: Cross-Router Integration
  // ===========================================================================

  describe('Cross-Router Integration', () => {
    it('should allow listing requirements then getting their dependencies', async () => {
      const ctx = createContext();
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);
      const dependenciesRouter = complianceDependenciesRouter.createCaller(ctx);

      // Step 1: List requirements
      const listResult = await requirementsRouter.list({
        organizationId: testOrgId,
        page: 1,
        pageSize: 5,
      });

      expect(listResult.requirements.length).toBeGreaterThanOrEqual(0);

      // Step 2: For each requirement, get its dependencies
      for (const req of listResult.requirements.slice(0, 3)) {
        const deps = await dependenciesRouter.list({
          organizationId: testOrgId,
          requirementId: req.id,
        });
        expect(Array.isArray(deps)).toBe(true);
      }
    });

    it('should allow exporting then importing requirements', async () => {
      const ctx = createContext();
      const bulkRouter = bulkOperationsRouter.createCaller(ctx);

      // Step 1: Export current requirements
      const exportResult = await bulkRouter.export({
        organizationId: testOrgId,
        format: 'json',
      });

      expect(typeof exportResult.data).toBe('string');

      // Step 2: Preview import of exported data (round-trip validation)
      // Note: We just verify the preview works, not actually importing
      const preview = await bulkRouter.importPreview({
        organizationId: testOrgId,
        data: exportResult.data,
        format: 'json',
      });

      expect(typeof preview.totalRows).toBe('number');
    });
  });
});
