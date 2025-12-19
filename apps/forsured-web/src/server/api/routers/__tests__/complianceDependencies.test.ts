/**
 * Compliance Dependencies Router Tests
 * REQ-2, TASK-8: tRPC CRUD Operations for Compliance Dependencies
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import { complianceDependenciesRouter } from '../complianceDependencies';
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
let testDependsOnId: string | null = null;
let testDependencyId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Compliance Dependencies Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find two existing requirements to use for dependency tests
    const { data: reqs } = await forsured('compliance_requirements')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(2);

    if (reqs && reqs.length >= 2) {
      testRequirementId = reqs[0].id;
      testDependsOnId = reqs[1].id;
    } else if (reqs && reqs.length === 1) {
      testRequirementId = reqs[0].id;
    }
  });

  afterAll(async () => {
    // Clean up test dependency if created
    if (testDependencyId) {
      await forsured('compliance_requirement_dependencies')
        .delete()
        .eq('id', testDependencyId);
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
    it('returns dependencies for a requirement', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('throws FORBIDDEN for wrong organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN when user has no organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('validateCycle', () => {
    it('validates that no cycle would be created', async () => {
      if (!testRequirementId || !testDependsOnId) {
        console.warn('Skipping test - need two requirements for cycle validation');
        return;
      }

      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      const result = await caller.validateCycle({
        organizationId: testOrgId,
        requirementId: testRequirementId,
        dependsOnId: testDependsOnId,
      });

      expect(typeof result.would_create_cycle).toBe('boolean');
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.validateCycle({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
          dependsOnId: testDependsOnId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getTree', () => {
    it('returns dependency tree for a requirement', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      const result = await caller.getTree({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(result.id).toBe(testRequirementId);
      expect(Array.isArray(result.children)).toBe(true);
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.getTree({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getDependents', () => {
    it('returns dependents for a requirement', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      const result = await caller.getDependents({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('listRules', () => {
    it('returns rules for a requirement', async () => {
      if (!testRequirementId) {
        console.warn('Skipping test - no test requirement available');
        return;
      }

      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      const result = await caller.listRules({
        organizationId: testOrgId,
        requirementId: testRequirementId,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.listRules({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('rejects invalid organizationId', async () => {
      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: 'invalid-uuid',
          requirementId: testRequirementId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid requirementId', async () => {
      const ctx = createContext();
      const caller = complianceDependenciesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
          requirementId: 'invalid-uuid',
        })
      ).rejects.toThrow();
    });
  });
});
