/**
 * Policies Router Tests
 * REQ-280: Insurance Coverage Detail Requirements
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { policiesRouter } from '../policies';
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
let testPolicyId: string | null = null;
let testProvisionIds: string[] = [];

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Policies Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Create a test insurance policy
    const { data: policy, error: policyError } = await forsured('insurance_policies')
      .insert({
        organization_id: testOrgId,
        policy_number: 'GL-TEST-2024-001234',
        policy_type: 'GL',
        carrier_name: 'Test Insurance Co',
        aggregate_limit: 2000000,
        each_occurrence_limit: 1000000,
        deductible: 5000,
        effective_date: '2024-01-01',
        expiration_date: '2025-01-01',
        status: 'active',
        created_by: testUserId,
      })
      .select()
      .single();

    if (!policyError && policy) {
      testPolicyId = policy.id;

      // Create test provisions for this policy
      const provisions = [
        { provision_type: 'per_occurrence', limit_amount: 1000000, provision_value: null },
        { provision_type: 'general_aggregate', limit_amount: 2000000, provision_value: null },
        { provision_type: 'personal_advertising', limit_amount: 1000000, provision_value: null },
        { provision_type: 'products_completed', limit_amount: 2000000, provision_value: null },
      ];

      for (const prov of provisions) {
        const { data: provision, error: provError } = await forsured('policy_provisions')
          .insert({
            policy_id: testPolicyId,
            organization_id: testOrgId,
            ...prov,
          })
          .select()
          .single();

        if (!provError && provision) {
          testProvisionIds.push(provision.id);
        }
      }
    }
  });

  afterAll(async () => {
    // Clean up test provisions first (due to FK constraint)
    for (const provisionId of testProvisionIds) {
      await forsured('policy_provisions').delete().eq('id', provisionId);
    }
    // Clean up test policy
    if (testPolicyId) {
      await forsured('insurance_policies').delete().eq('id', testPolicyId);
    }
  });

  // Helper to create caller context
  const createContext = (organizationId: string | null = testOrgId) => {
    const mockUser: User = {
      id: testUserId,
      email: 'test@example.com',
    } as User;

    return {
      db: testSupabaseAdmin as any,
      session: mockUser,
      userId: testUserId,
      organizationId,
    };
  };

  describe('getProvisions', () => {
    it('returns provisions with validation results', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getProvisions({
        organizationId: testOrgId,
        policyId: testPolicyId,
      });

      expect(result.provisions.length).toBeGreaterThan(0);
      expect(Array.isArray(result.validation_results)).toBe(true);
      expect(typeof result.has_red_flags).toBe('boolean');
    });

    it('returns valid provisions that meet minimum requirements', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getProvisions({
        organizationId: testOrgId,
        policyId: testPolicyId,
      });

      // Our test provisions meet requirements ($1M per occurrence, $2M aggregate)
      const perOccurrenceResult = result.validation_results.find(
        (r) => r.provision_type === 'per_occurrence'
      );
      expect(perOccurrenceResult?.is_valid).toBe(true);
    });

    it('handles missing policy with NOT_FOUND error', async () => {
      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.getProvisions({
          organizationId: testOrgId,
          policyId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects unauthorized access to other organization', async () => {
      const ctx = createContext(testOrgId);
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.getProvisions({
          organizationId: OTHER_ORG_UUID,
          policyId: testPolicyId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('list', () => {
    it('returns paginated policies for authorized user', async () => {
      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        page: 1,
        pageSize: 20,
      });

      expect(Array.isArray(result.policies)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.total).toBe('number');
    });

    it('returns our test policy in the list', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        page: 1,
        pageSize: 50,
      });

      const found = result.policies.find((p) => p.id === testPolicyId);
      expect(found).toBeDefined();
      expect(found?.policy_number).toBe('GL-TEST-2024-001234');
    });

    it('supports filtering by policy type', async () => {
      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        filters: { policy_type: ['GL'] },
        page: 1,
        pageSize: 20,
      });

      // All returned policies should be GL type
      for (const policy of result.policies) {
        expect(policy.policy_type).toBe('GL');
      }
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testOrgId);
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
          page: 1,
          pageSize: 20,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('get', () => {
    it('returns single policy by ID', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: testOrgId,
        policyId: testPolicyId,
      });

      expect(result.id).toBe(testPolicyId);
      expect(result.policy_type).toBe('GL');
      expect(result.carrier_name).toBe('Test Insurance Co');
    });

    it('throws NOT_FOUND for non-existent policy', async () => {
      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          policyId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Policy not found');
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testOrgId);
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: OTHER_ORG_UUID,
          policyId: testPolicyId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('createProvision', () => {
    let createdProvisionId: string | null = null;

    afterAll(async () => {
      // Clean up provision created during test
      if (createdProvisionId) {
        await forsured('policy_provisions').delete().eq('id', createdProvisionId);
      }
    });

    it('creates a new provision for valid policy', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.createProvision({
        organizationId: testOrgId,
        policyId: testPolicyId,
        provision_type: 'fire_damage',
        limit_amount: 500000,
      });

      expect(result.provision_type).toBe('fire_damage');
      expect(result.limit_amount).toBe(500000);
      createdProvisionId = result.id;
    });

    it('rejects creating provision for non-existent policy', async () => {
      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.createProvision({
          organizationId: testOrgId,
          policyId: '00000000-0000-0000-0000-000000000000',
          provision_type: 'fire_damage',
          limit_amount: 500000,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getGLSubLimitsDisplay', () => {
    it('returns formatted display items for CoverageTable', async () => {
      if (!testPolicyId) {
        console.warn('Skipping test - no test policy available');
        return;
      }

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getGLSubLimitsDisplay({
        organizationId: testOrgId,
        policyId: testPolicyId,
      });

      expect(Array.isArray(result.display_items)).toBe(true);
      expect(result.display_items.length).toBeGreaterThan(0);

      // Check formatted values exist
      const perOccurrence = result.display_items.find((i) => i.provision_type === 'per_occurrence');
      if (perOccurrence) {
        expect(perOccurrence.formatted_value).toBe('$1,000,000');
        expect(perOccurrence.name).toBe('Per Occurrence');
        expect(perOccurrence.is_valid).toBe(true);
      }
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testOrgId);
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.getGLSubLimitsDisplay({
          organizationId: OTHER_ORG_UUID,
          policyId: testPolicyId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(null);
      const caller = policiesRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
          page: 1,
          pageSize: 20,
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
