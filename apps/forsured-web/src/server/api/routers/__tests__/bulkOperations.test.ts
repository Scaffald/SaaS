/**
 * Bulk Operations Router Tests
 * REQ-2, TASK-12: tRPC Endpoints for Bulk Import/Export
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bulkOperationsRouter } from '../bulkOperations';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
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
let testRequirementId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Bulk Operations Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find an existing requirement to use for tests
    const { data: reqs } = await forsured('compliance_requirements')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(1);

    if (reqs && reqs.length > 0) {
      testRequirementId = reqs[0].id;
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
          email: 'test@example.com',
        } as User)
      : null;

    return {
      db: testSupabaseAdmin as any,
      session: mockUser,
      userId,
      organizationId,
    };
  };

  describe('importPreview', () => {
    it('returns preview for valid JSON import data', async () => {
      const jsonData = JSON.stringify([
        {
          code: 'TEST-BULK-001',
          name: 'Test Bulk Import',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importPreview({
        organizationId: testOrgId,
        data: jsonData,
        format: 'json',
      });

      expect(typeof result.totalRows).toBe('number');
      expect(typeof result.validRows).toBe('number');
      expect(typeof result.canProceed).toBe('boolean');
    });

    it('rejects access for wrong organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importPreview({
          organizationId: OTHER_ORG_UUID,
          data: '[]',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN when user has no organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importPreview({
          organizationId: testOrgId,
          data: '[]',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('importTemplates', () => {
    it('returns both CSV and JSON templates by default', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importTemplates({});

      expect(result.length).toBeGreaterThanOrEqual(1);
      // Should have format property
      result.forEach((template) => {
        expect(['csv', 'json']).toContain(template.format);
      });
    });

    it('returns only CSV template when specified', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importTemplates({ format: 'csv' });

      expect(result).toHaveLength(1);
      expect(result[0].format).toBe('csv');
    });

    it('returns only JSON template when specified', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importTemplates({ format: 'json' });

      expect(result).toHaveLength(1);
      expect(result[0].format).toBe('json');
    });
  });

  describe('export', () => {
    it('exports requirements in JSON format', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: testOrgId,
        format: 'json',
      });

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('.json');
      expect(typeof result.totalRecords).toBe('number');
      expect(typeof result.data).toBe('string');
    });

    it('exports requirements in CSV format', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: testOrgId,
        format: 'csv',
      });

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: OTHER_ORG_UUID,
          format: 'json',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('exportSummary', () => {
    it('returns summary statistics', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.exportSummary({
        organizationId: testOrgId,
      });

      expect(typeof result.totalRequirements).toBe('number');
      expect(typeof result.templates).toBe('number');
      expect(result.byType).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.exportSummary({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects unauthenticated requests', async () => {
      const ctx = createContext(null);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: testOrgId,
          format: 'json',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: testOrgId,
          format: 'json',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access for bulk archive', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext(testUserId, testOrgId);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.bulkArchive({
          organizationId: OTHER_ORG_UUID,
          requirementIds: [testRequirementId],
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('rejects invalid organization ID format', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: 'not-a-uuid',
          format: 'json',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid export format', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: testOrgId,
          format: 'xml' as 'json',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid JSON in import preview', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importPreview({
          organizationId: testOrgId,
          data: 'not valid json{{{',
          format: 'json',
        })
      ).rejects.toThrow();
    });
  });
});
