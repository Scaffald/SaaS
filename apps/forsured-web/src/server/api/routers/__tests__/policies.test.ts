/**
 * Policies Router Tests
 * REQ-280: Insurance Coverage Detail Requirements
 * TASK-2: Build API Endpoints for Policy Provisions with Validation - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { policiesRouter } from '../policies';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import * as supabaseModule from '../../../../lib/supabase';

// Mock the supabase module
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    schema: vi.fn(() => ({
      from: vi.fn(),
    })),
  },
  forsured: vi.fn(),
}));

// Test UUIDs (v4 format)
const ORG_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const POLICY_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const PROVISION_UUID = 'a987fbc9-4bed-3078-cf07-9141ba07c9f3';

// Mock policy data
const createMockPolicy = (overrides = {}) => ({
  id: POLICY_UUID,
  organization_id: ORG_UUID,
  project_id: null,
  policy_number: 'GL-2024-001234',
  policy_type: 'GL',
  carrier_name: 'Test Insurance Co',
  aggregate_limit: 2000000,
  each_occurrence_limit: 1000000,
  deductible: 5000,
  effective_date: '2024-01-01',
  expiration_date: '2025-01-01',
  status: 'active',
  created_by: USER_UUID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock provision data
const createMockProvision = (provisionType: string, limitAmount: number | null, provisionValue?: string | null) => ({
  id: `${PROVISION_UUID}-${provisionType}`,
  policy_id: POLICY_UUID,
  organization_id: ORG_UUID,
  provision_type: provisionType,
  limit_amount: limitAmount,
  deductible: null,
  provision_value: provisionValue ?? null,
  description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('Policies Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create caller context
  const createContext = (organizationId: string | null = ORG_UUID) => {
    const mockUser: User = {
      id: USER_UUID,
      email: 'test@example.com',
    } as User;

    return {
      db: {} as any,
      session: mockUser,
      organizationId,
    };
  };

  describe('getProvisions', () => {
    it('returns provisions with all valid values and no red flags', async () => {
      // Setup: Policy exists with all GL provisions meeting requirements
      const mockPolicy = createMockPolicy();
      const mockProvisions = [
        createMockProvision('per_occurrence', 1000000),
        createMockProvision('general_aggregate', 2000000),
        createMockProvision('personal_advertising', 1000000),
        createMockProvision('products_completed', 2000000),
      ];

      // Mock policy query
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      // Action: GET provisions
      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      // Expect: Returns provisions, all validations pass, no red flags
      expect(result.provisions).toHaveLength(4);
      expect(result.validation_results).toHaveLength(4);
      expect(result.validation_results.every((r) => r.is_valid)).toBe(true);
      expect(result.has_red_flags).toBe(false);
    });

    it('flags insufficient coverage with red flag', async () => {
      // Setup: Policy exists with Per Occurrence = $500,000 (below $1M requirement)
      const mockPolicy = createMockPolicy();
      const mockProvisions = [
        createMockProvision('per_occurrence', 500000), // Below $1M minimum
        createMockProvision('general_aggregate', 2000000),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      // Action: GET provisions
      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      // Expect: Per Occurrence validation fails, hasRedFlags is true
      expect(result.has_red_flags).toBe(true);
      const perOccurrenceResult = result.validation_results.find(
        (r) => r.provision_type === 'per_occurrence'
      );
      expect(perOccurrenceResult?.is_valid).toBe(false);
      expect(perOccurrenceResult?.severity).toBe('error');
      expect(perOccurrenceResult?.message).toContain('below required minimum');
    });

    it('validates Auto Symbol requirements correctly', async () => {
      // Setup: Policy exists with Auto Symbol = '5' (invalid value)
      const mockPolicy = createMockPolicy();
      const mockProvisions = [
        createMockProvision('auto_symbol', null, '5'), // Invalid - should be '1' or '7,8,9'
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      // Action: GET provisions
      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      // Expect: Auto Symbol validation fails
      const autoSymbolResult = result.validation_results.find(
        (r) => r.provision_type === 'auto_symbol'
      );
      expect(autoSymbolResult?.is_valid).toBe(false);
      expect(autoSymbolResult?.message).toContain('1 or 7,8,9');
    });

    it('validates Auto Symbol = "1" as valid', async () => {
      const mockPolicy = createMockPolicy();
      const mockProvisions = [createMockProvision('auto_symbol', null, '1')];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      const autoSymbolResult = result.validation_results.find(
        (r) => r.provision_type === 'auto_symbol'
      );
      expect(autoSymbolResult?.is_valid).toBe(true);
    });

    it('validates boolean provisions (per_project_aggregate)', async () => {
      const mockPolicy = createMockPolicy();
      const mockProvisions = [createMockProvision('per_project_aggregate', null, 'yes')];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      const perProjectResult = result.validation_results.find(
        (r) => r.provision_type === 'per_project_aggregate'
      );
      expect(perProjectResult?.is_valid).toBe(true);
      expect(perProjectResult?.actual_value).toBe(true); // 'yes' normalized to boolean true
    });

    it('handles missing policy with 404 error', async () => {
      // Setup: Policy ID does not exist in database
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      // Action & Expect: Returns 404 error
      await expect(
        caller.getProvisions({
          organizationId: ORG_UUID,
          policyId: 'invalid-uuid-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects unauthorized access to other organization', async () => {
      const ctx = createContext(ORG_UUID);
      const caller = policiesRouter.createCaller(ctx);

      // Action & Expect: Attempt to access different organization's policy
      await expect(
        caller.getProvisions({
          organizationId: OTHER_ORG_UUID,
          policyId: POLICY_UUID,
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProvisions({
          organizationId: OTHER_ORG_UUID,
          policyId: POLICY_UUID,
        })
      ).rejects.toThrow('permission');
    });

    it('validates deductible exceeding maximum', async () => {
      // Setup: GL policy with deductible > $10,000
      const mockPolicy = createMockPolicy({ deductible: 15000 }); // $15K exceeds $10K max
      const mockProvisions: any[] = [];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getProvisions({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      // Deductible validation should be added and fail
      expect(result.has_red_flags).toBe(true);
      const deductibleResult = result.validation_results.find((r) =>
        r.message?.includes('Deductible')
      );
      expect(deductibleResult?.is_valid).toBe(false);
    });
  });

  describe('list', () => {
    it('returns paginated policies for authorized user', async () => {
      const mockPolicies = [createMockPolicy(), createMockPolicy({ id: 'policy-2' })];

      vi.mocked(supabaseModule.forsured).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockPolicies, error: null, count: 2 }),
      } as any);

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        page: 1,
        pageSize: 20,
      });

      expect(result.policies).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(supabaseModule.forsured).toHaveBeenCalledWith('insurance_policies');
    });

    it('filters by policy type', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      } as any);

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      await caller.list({
        organizationId: ORG_UUID,
        filters: { policy_type: ['GL'] },
        page: 1,
        pageSize: 20,
      });

      // Verify filter was applied (forsured was called)
      expect(supabaseModule.forsured).toHaveBeenCalledWith('insurance_policies');
    });
  });

  describe('get', () => {
    it('returns single policy by ID', async () => {
      const mockPolicy = createMockPolicy();

      vi.mocked(supabaseModule.forsured).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
      } as any);

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      expect(result.id).toBe(POLICY_UUID);
      expect(result.policy_type).toBe('GL');
    });

    it('throws NOT_FOUND for non-existent policy', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as any);

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      // Use valid UUID format for non-existent policy
      await expect(
        caller.get({
          organizationId: ORG_UUID,
          policyId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Policy not found');
    });
  });

  describe('createProvision', () => {
    it('creates a new provision for valid policy', async () => {
      const mockPolicy = createMockPolicy();
      const mockProvision = createMockProvision('per_occurrence', 1000000);

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProvision, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.createProvision({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
        provision_type: 'per_occurrence',
        limit_amount: 1000000,
      });

      expect(result.provision_type).toBe('per_occurrence');
      expect(result.limit_amount).toBe(1000000);
    });
  });

  describe('getGLSubLimitsDisplay', () => {
    it('returns formatted display items for CoverageTable', async () => {
      const mockPolicy = createMockPolicy();
      const mockProvisions = [
        createMockProvision('per_occurrence', 1000000),
        createMockProvision('general_aggregate', 2000000),
        createMockProvision('per_project_aggregate', null, 'yes'),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'insurance_policies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPolicy, error: null }),
          } as any;
        } else if (tableName === 'policy_provisions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockProvisions, error: null }),
          } as any;
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = policiesRouter.createCaller(ctx);

      const result = await caller.getGLSubLimitsDisplay({
        organizationId: ORG_UUID,
        policyId: POLICY_UUID,
      });

      // Should have display items for provisions + deductible
      expect(result.display_items.length).toBeGreaterThanOrEqual(3);

      // Check formatted values
      const perOccurrence = result.display_items.find((i) => i.provision_type === 'per_occurrence');
      expect(perOccurrence?.formatted_value).toBe('$1,000,000');
      expect(perOccurrence?.name).toBe('Per Occurrence');
      expect(perOccurrence?.requirement).toBe('Min $1,000,000');
      expect(perOccurrence?.is_valid).toBe(true);

      // Check boolean provision formatting
      const perProject = result.display_items.find(
        (i) => i.provision_type === 'per_project_aggregate'
      );
      expect(perProject?.formatted_value).toBe('Yes');
    });
  });
});
