/**
 * Bulk Operations Router Tests
 * REQ-2, TASK-12: tRPC Endpoints for Bulk Import/Export
 * TASK-19: Integrated with Compliance Authorization System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { bulkOperationsRouter } from '../bulkOperations';
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
  core: vi.fn(),
}));

// Mock the authorization helper
const mockRequirePermission = vi.fn();
vi.mock('../../helpers/complianceAuthorization', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
  createComplianceAuthService: vi.fn(),
}));

// Test UUIDs (v4 format)
const ORG_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const REQUIREMENT_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const REQUIREMENT_UUID_2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Mock requirement data
const createMockRequirement = (overrides = {}) => ({
  id: REQUIREMENT_UUID,
  code: 'GL-001',
  name: 'General Liability $1M/$2M',
  type: 'general_liability',
  description: 'Standard GL requirement',
  status: 'active',
  is_template: false,
  effective_date: '2024-01-01',
  expiration_date: null,
  organization_id: ORG_UUID,
  created_by: USER_UUID,
  requirement_definition: {
    coverage_limits: {
      per_occurrence: 1000000,
      aggregate: 2000000,
    },
    required_endorsements: [],
    policy_conditions: [],
    documentation_requirements: [],
  },
  current_version: 1,
  is_current: true,
  parent_requirement_id: null,
  change_summary: 'Initial version',
  superseded_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  archived_at: null,
  ...overrides,
});

// Mock admin role assignment
const createMockAdminRole = () => ({
  id: 'role-assignment-1',
  roles: { name: 'admin' },
});

// Mock non-admin role
const createMockUserRole = () => ({
  id: 'role-assignment-2',
  roles: { name: 'user' },
});

/**
 * Helper to mock permission granted
 */
function mockPermissionGranted() {
  mockRequirePermission.mockResolvedValue({
    hasPermission: vi.fn().mockResolvedValue(true),
    getRole: vi.fn().mockReturnValue('admin'),
  });
}

/**
 * Helper to mock permission denied
 */
function mockPermissionDenied(permission = 'BULK_IMPORT') {
  mockRequirePermission.mockRejectedValue(
    new TRPCError({
      code: 'FORBIDDEN',
      message: `Compliance permission denied: ${permission}`,
    })
  );
}

/**
 * Creates a chainable mock builder that supports Supabase's thenable pattern
 */
function createChainableMock<T>(
  finalValue: { data: T | null; error: { code: string; message: string } | null; count?: number | null }
) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(finalValue),
    maybeSingle: vi.fn().mockResolvedValue(finalValue),
    then: (resolve: (value: typeof finalValue) => void) => Promise.resolve(finalValue).then(resolve),
  };
  return mock;
}

describe('Bulk Operations Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockReset();
  });

  // Helper to create caller context
  const createContext = (organizationId: string | null = ORG_UUID, userId: string = USER_UUID) => {
    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
    } as User;

    return {
      db: {} as unknown,
      session: mockUser,
      organizationId,
      userId,
    };
  };

  describe('importPreview', () => {
    it('returns preview for valid JSON import data', async () => {
      mockPermissionGranted();

      const jsonData = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      // Mock existing codes check (empty - no duplicates)
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importPreview({
        organizationId: ORG_UUID,
        data: jsonData,
        format: 'json',
      });

      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
      expect(result.canProceed).toBe(true);
    });

    it('detects duplicate codes', async () => {
      mockPermissionGranted();

      const jsonData = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      // Mock existing codes check - GL-001 already exists
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: [{ code: 'GL-001' }], error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importPreview({
        organizationId: ORG_UUID,
        data: jsonData,
      });

      expect(result.duplicateCodes).toContain('GL-001');
      expect(result.canProceed).toBe(false);
    });

    it('rejects access for wrong organization', async () => {
      const ctx = createContext(OTHER_ORG_UUID);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importPreview({
          organizationId: ORG_UUID,
          data: '[]',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('importExecute', () => {
    it('imports valid requirements successfully', async () => {
      mockPermissionGranted();

      const jsonData = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: { per_occurrence: 1000000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get existing codes
          return createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.forsured>;
        }
        // Subsequent call: insert requirement
        return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importExecute({
        organizationId: ORG_UUID,
        data: jsonData,
      });

      expect(result.success).toBe(true);
      expect(result.successfulImports).toBe(1);
      expect(result.createdIds).toHaveLength(1);
    });

    it('rejects non-admin users', async () => {
      mockPermissionDenied('BULK_IMPORT');

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importExecute({
          organizationId: ORG_UUID,
          data: '[]',
        })
      ).rejects.toThrow('Compliance permission denied');
    });

    it('skips duplicates when skipDuplicates is true', async () => {
      mockPermissionGranted();

      const jsonData = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        {
          code: 'GL-002',
          name: 'General Liability 2',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get existing codes - GL-001 exists
          return createChainableMock({ data: [{ code: 'GL-001' }], error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Insert call for GL-002
        return createChainableMock({ data: { id: REQUIREMENT_UUID_2 }, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importExecute({
        organizationId: ORG_UUID,
        data: jsonData,
        skipDuplicates: true,
      });

      // GL-001 is skipped (duplicate), GL-002 is imported
      expect(result.successfulImports).toBe(1);
      expect(result.createdIds).toHaveLength(1);
    });
  });

  describe('importTemplates', () => {
    it('returns both CSV and JSON templates by default', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.importTemplates({});

      expect(result).toHaveLength(2);
      expect(result.some((t) => t.format === 'csv')).toBe(true);
      expect(result.some((t) => t.format === 'json')).toBe(true);
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
      mockPermissionGranted();
      const mockRequirements = [createMockRequirement()];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: ORG_UUID,
        format: 'json',
      });

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toContain('.json');
      expect(result.totalRecords).toBe(1);

      const parsed = JSON.parse(result.data);
      expect(parsed.requirements).toHaveLength(1);
    });

    it('exports requirements in CSV format', async () => {
      mockPermissionGranted();
      const mockRequirements = [createMockRequirement()];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: ORG_UUID,
        format: 'csv',
      });

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toContain('.csv');
      expect(result.data).toContain('code,name,type');
    });

    it('applies filters correctly', async () => {
      mockPermissionGranted();
      const mockRequirements = [
        createMockRequirement({ status: 'active' }),
        createMockRequirement({ id: REQUIREMENT_UUID_2, code: 'GL-002', status: 'draft' }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: ORG_UUID,
        format: 'json',
        filters: { statuses: ['active'] },
      });

      // Only active requirements should be included
      const parsed = JSON.parse(result.data);
      expect(parsed.requirements).toHaveLength(1);
      expect(parsed.requirements[0].status).toBe('active');
    });

    it('includes version history when requested', async () => {
      mockPermissionGranted();
      const mockRequirements = [createMockRequirement()];
      const mockVersions = [
        { requirement_id: REQUIREMENT_UUID, version: 1, changed_at: '2024-01-01', change_summary: 'Initial', changed_fields: null },
      ];

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        return createChainableMock({ data: mockVersions, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.export({
        organizationId: ORG_UUID,
        format: 'json',
        includeVersionHistory: true,
      });

      const parsed = JSON.parse(result.data);
      expect(parsed.requirements[0].version_history).toBeDefined();
    });

    it('rejects invalid export options', async () => {
      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: ORG_UUID,
          format: 'xml' as 'json',
        })
      ).rejects.toThrow();
    });
  });

  describe('exportSummary', () => {
    it('returns summary statistics', async () => {
      mockPermissionGranted();
      const mockRequirements = [
        { id: REQUIREMENT_UUID, code: 'GL-001', name: 'General Liability', type: 'general_liability', status: 'active', is_template: false, effective_date: '2024-01-01', description: 'Test' },
        { id: REQUIREMENT_UUID_2, code: 'WC-001', name: 'Workers Comp', type: 'workers_comp', status: 'draft', is_template: true, effective_date: '2024-01-01', description: 'Test' },
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.exportSummary({
        organizationId: ORG_UUID,
      });

      expect(result.totalRequirements).toBe(2);
      expect(result.templates).toBe(1);
      expect(result.byType.general_liability).toBe(1);
      expect(result.byType.workers_comp).toBe(1);
      expect(result.byStatus.active).toBe(1);
      expect(result.byStatus.draft).toBe(1);
    });

    it('applies filters to summary', async () => {
      mockPermissionGranted();
      const mockRequirements = [
        { id: REQUIREMENT_UUID, code: 'GL-001', name: 'General Liability', type: 'general_liability', status: 'active', is_template: false, effective_date: '2024-01-01', description: 'Test' },
        { id: REQUIREMENT_UUID_2, code: 'WC-001', name: 'Workers Comp', type: 'workers_comp', status: 'archived', is_template: false, effective_date: '2024-01-01', description: 'Test' },
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      // By default archived is excluded
      const result = await caller.exportSummary({
        organizationId: ORG_UUID,
        filters: {},
      });

      expect(result.totalRequirements).toBe(1);
    });
  });

  describe('bulkArchive', () => {
    it('archives multiple requirements successfully', async () => {
      mockPermissionGranted();

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.bulkArchive({
        organizationId: ORG_UUID,
        requirementIds: [REQUIREMENT_UUID, REQUIREMENT_UUID_2],
      });

      expect(result.success).toBe(true);
      expect(result.archivedCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-admin users', async () => {
      mockPermissionDenied('BULK_ARCHIVE');

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.bulkArchive({
          organizationId: ORG_UUID,
          requirementIds: [REQUIREMENT_UUID],
        })
      ).rejects.toThrow('Compliance permission denied');
    });

    it('handles partial failures', async () => {
      mockPermissionGranted();

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        // First update succeeds, second fails
        if (callCount === 1) {
          return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
        }
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.bulkArchive({
        organizationId: ORG_UUID,
        requirementIds: [REQUIREMENT_UUID, REQUIREMENT_UUID_2],
      });

      expect(result.success).toBe(false);
      expect(result.archivedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('bulkStatusUpdate', () => {
    it('updates status for multiple requirements', async () => {
      mockPermissionGranted();

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.bulkStatusUpdate({
        organizationId: ORG_UUID,
        requirementIds: [REQUIREMENT_UUID, REQUIREMENT_UUID_2],
        status: 'active',
        change_summary: 'Bulk activation',
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-admin users', async () => {
      mockPermissionDenied('BULK_STATUS_UPDATE');

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.bulkStatusUpdate({
          organizationId: ORG_UUID,
          requirementIds: [REQUIREMENT_UUID],
          status: 'active',
          change_summary: 'Bulk activation',
        })
      ).rejects.toThrow('Compliance permission denied');
    });

    it('handles partial failures gracefully', async () => {
      mockPermissionGranted();

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
        }
        return createChainableMock({ data: null, error: { code: 'ERROR', message: 'Database error' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.bulkStatusUpdate({
        organizationId: ORG_UUID,
        requirementIds: [REQUIREMENT_UUID, REQUIREMENT_UUID_2],
        status: 'draft',
        change_summary: 'Bulk status change',
      });

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('access control', () => {
    it('rejects unauthenticated requests for import execute', async () => {
      const ctx = createContext(ORG_UUID, '');
      ctx.userId = undefined as unknown as string;

      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.importExecute({
          organizationId: ORG_UUID,
          data: '[]',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access for export', async () => {
      const ctx = createContext(OTHER_ORG_UUID);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.export({
          organizationId: ORG_UUID,
          format: 'json',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access for bulk archive', async () => {
      const ctx = createContext(OTHER_ORG_UUID);
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.bulkArchive({
          organizationId: ORG_UUID,
          requirementIds: [REQUIREMENT_UUID],
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
