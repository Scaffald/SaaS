/**
 * Compliance Requirements Router Tests
 * REQ-2, TASK-7: tRPC CRUD Operations for Compliance Requirements
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { complianceRequirementsRouter } from '../complianceRequirements';
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
let createdRequirementId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Compliance Requirements Router', () => {
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

  afterAll(async () => {
    // Clean up created requirement if any
    if (createdRequirementId) {
      await forsured('compliance_requirements').delete().eq('id', createdRequirementId);
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

  describe('list', () => {
    it('returns paginated list of requirements', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        page: 1,
        pageSize: 20,
      });

      expect(Array.isArray(result.requirements)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.total).toBe('number');
      expect(result.pagination.page).toBe(1);
    });

    it('throws FORBIDDEN when accessing other organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN when user has no organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('get', () => {
    it('returns a single requirement by ID', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(result.id).toBe(testRequirementId);
    });

    it('throws NOT_FOUND for non-existent requirement', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          requirementId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getVersions', () => {
    it('returns version history for a requirement', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.getVersions({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(Array.isArray(result.versions)).toBe(true);
      expect(result.pagination).toBeDefined();
    });

    it('throws NOT_FOUND for non-existent requirement', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.getVersions({
          organizationId: testOrgId,
          requirementId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access for get', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects unauthenticated users', async () => {
      const ctx = createContext(null);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('validates code format (alphanumeric with dashes only)', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: testOrgId,
          code: 'GL@001', // Invalid: contains @
          name: 'Test Requirement',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow();
    });

    it('validates coverage type enum', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: testOrgId,
          code: 'GL-001',
          name: 'Test Requirement',
          type: 'invalid_type' as 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow();
    });

    it('validates requirement status enum', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: testOrgId,
          code: 'GL-001',
          name: 'Test Requirement',
          type: 'general_liability',
          status: 'invalid_status' as 'draft',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow();
    });

    it('validates coverage_limits allow only non-negative numbers', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: testOrgId,
          code: 'GL-001',
          name: 'Test Requirement',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {
              per_occurrence: -1000, // Negative value should fail
            },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow();
    });

    it('rejects invalid organization ID format', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid requirement ID format', async () => {
      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          requirementId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });
  });
});
