/**
 * Tests for Compliance Dependencies Router
 * REQ-2, TASK-8: tRPC CRUD Operations for Compliance Dependencies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';

// Mock Supabase before importing the router
const mockForsured = vi.fn();
const mockCore = vi.fn();

vi.mock('../../../../lib/supabase', () => ({
  forsured: (table: string) => mockForsured(table),
  core: (table: string) => mockCore(table),
}));

// Mock the dependency resolver
vi.mock('../../../../lib/compliance/dependency-resolver', () => ({
  validateNoCycles: vi.fn(),
  getDependencyTree: vi.fn(),
  getDependents: vi.fn(),
}));

// Mock the authorization helper
const mockRequirePermission = vi.fn();
vi.mock('../../helpers/complianceAuthorization', () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
  createComplianceAuthService: vi.fn(),
}));

import { complianceDependenciesRouter } from '../complianceDependencies';
import { validateNoCycles, getDependencyTree, getDependents } from '../../../../lib/compliance/dependency-resolver';

// =============================================================================
// Test Helpers
// =============================================================================

const TEST_ORG_ID = '11111111-2222-4333-8444-555555555555';
const TEST_USER_ID = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const TEST_REQUIREMENT_ID = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const TEST_DEPENDS_ON_ID = 'dddddddd-eeee-4fff-8000-111111111111';
const TEST_DEPENDENCY_ID = '22222222-3333-4444-8555-666666666666';
const TEST_SCHEDULE_ID = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
const TEST_RULE_ID = 'cccccccc-dddd-4eee-8fff-000000000000';

interface MockOptions {
  data?: unknown;
  error?: { code: string; message: string } | null;
  count?: number | null;
}

function createChainableMock(finalValue: MockOptions) {
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
    then: (resolve: (value: MockOptions) => void) => Promise.resolve(finalValue).then(resolve),
  };
  return mock;
}

function createMockContext(overrides: Partial<{
  userId: string | undefined;
  organizationId: string | undefined;
}> = {}) {
  const userId = overrides.userId ?? TEST_USER_ID;
  const mockUser: User = {
    id: userId,
    email: 'test@example.com',
  } as User;

  return {
    db: {} as unknown,
    session: mockUser,
    userId,
    organizationId: overrides.organizationId ?? TEST_ORG_ID,
  };
}

function mockAdminAccess(isAdmin: boolean) {
  const roleData = isAdmin
    ? [{ id: '1', roles: { name: 'admin' } }]
    : [{ id: '1', roles: { name: 'member' } }];

  mockCore.mockImplementation(() =>
    createChainableMock({ data: roleData, error: null })
  );
}

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
function mockPermissionDenied(permission = 'DEPENDENCY_CREATE') {
  mockRequirePermission.mockRejectedValue(
    new TRPCError({
      code: 'FORBIDDEN',
      message: `Compliance permission denied: ${permission}`,
    })
  );
}

// =============================================================================
// Tests
// =============================================================================

describe('complianceDependenciesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // DEPENDENCIES CRUD
  // ===========================================================================

  describe('list', () => {
    it('should list dependencies for a requirement', async () => {
      const mockDependencies = [
        {
          id: TEST_DEPENDENCY_ID,
          requirement_id: TEST_REQUIREMENT_ID,
          depends_on_id: TEST_DEPENDS_ON_ID,
          dependency_type: 'requires',
          condition: null,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          depends_on: { id: TEST_DEPENDS_ON_ID, name: 'GL Requirement', code: 'GL-001', type: 'general_liability' },
        },
      ];

      // Mock permission check
      mockPermissionGranted();

      // First call - verify requirement ownership
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );
      // Second call - list dependencies
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: mockDependencies, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.list({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].dependency_type).toBe('requires');
    });

    it('should throw FORBIDDEN for wrong organization', async () => {
      const caller = complianceDependenciesRouter.createCaller(
        createMockContext({ organizationId: 'different-org' })
      );

      await expect(
        caller.list({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('create', () => {
    it('should create a dependency with admin access', async () => {
      mockPermissionGranted();
      vi.mocked(validateNoCycles).mockReturnValue({
        would_create_cycle: false,
        cycle_path: null,
        message: 'No circular dependency would be created',
      });

      const mockCreatedDependency = {
        id: TEST_DEPENDENCY_ID,
        requirement_id: TEST_REQUIREMENT_ID,
        depends_on_id: TEST_DEPENDS_ON_ID,
        dependency_type: 'requires',
        condition: null,
        notes: 'Test dependency',
        created_at: '2024-01-01T00:00:00Z',
      };

      let dependencyCallCount = 0;
      let requirementCallCount = 0;
      // Mock verify requirement ownership for both requirements
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          requirementCallCount++;
          // First 2 calls - verify ownership for both requirements (return single object)
          // Third call - getRequirementInfoMap (return array)
          if (requirementCallCount <= 2) {
            return createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null });
          }
          return createChainableMock({
            data: [
              { id: TEST_REQUIREMENT_ID, name: 'Umbrella', type: 'umbrella' },
              { id: TEST_DEPENDS_ON_ID, name: 'GL', type: 'general_liability' },
            ],
            error: null
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          dependencyCallCount++;
          // First call - check for duplicate (return null = no duplicate)
          // Second call - getOrganizationDependencies (return array)
          // Third call - insert (return created)
          if (dependencyCallCount === 1) {
            return createChainableMock({ data: null, error: null }); // No duplicate
          }
          if (dependencyCallCount === 2) {
            return createChainableMock({ data: [], error: null }); // No existing dependencies
          }
          return createChainableMock({ data: mockCreatedDependency, error: null }); // Insert result
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.create({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
        dependsOnId: TEST_DEPENDS_ON_ID,
        dependencyType: 'requires',
        notes: 'Test dependency',
      });

      expect(result.dependency_type).toBe('requires');
      expect(validateNoCycles).toHaveBeenCalled();
    });

    it('should reject if cycle would be created', async () => {
      mockPermissionGranted();
      vi.mocked(validateNoCycles).mockReturnValue({
        would_create_cycle: true,
        cycle_path: [TEST_REQUIREMENT_ID, TEST_DEPENDS_ON_ID, TEST_REQUIREMENT_ID],
        message: 'Adding this dependency would create a circular reference',
      });

      let dependencyCallCount = 0;
      let requirementCallCount = 0;
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          requirementCallCount++;
          // First 2 calls - verify ownership for both requirements (return single object)
          // Third call - getRequirementInfoMap (return array)
          if (requirementCallCount <= 2) {
            return createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null });
          }
          return createChainableMock({
            data: [
              { id: TEST_REQUIREMENT_ID, name: 'Umbrella', type: 'umbrella' },
              { id: TEST_DEPENDS_ON_ID, name: 'GL', type: 'general_liability' },
            ],
            error: null
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          dependencyCallCount++;
          // First call - check for duplicate (return null = no duplicate)
          // Second call - getOrganizationDependencies (return array)
          if (dependencyCallCount === 1) {
            return createChainableMock({ data: null, error: null }); // No duplicate
          }
          return createChainableMock({ data: [], error: null }); // No existing dependencies
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.create({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
          dependsOnId: TEST_DEPENDS_ON_ID,
          dependencyType: 'requires',
        })
      ).rejects.toThrow('circular');
    });

    it('should reject without admin access', async () => {
      mockPermissionDenied('DEPENDENCY_CREATE');

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.create({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
          dependsOnId: TEST_DEPENDS_ON_ID,
          dependencyType: 'requires',
        })
      ).rejects.toThrow('Compliance permission denied');
    });
  });

  describe('delete', () => {
    it('should delete a dependency with admin access', async () => {
      mockPermissionGranted();

      mockForsured.mockImplementation(() =>
        createChainableMock({
          data: {
            id: TEST_DEPENDENCY_ID,
            requirement_id: TEST_REQUIREMENT_ID,
            depends_on_id: TEST_DEPENDS_ON_ID,
            requirement: { organization_id: TEST_ORG_ID },
          },
          error: null,
        })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.delete({
        organizationId: TEST_ORG_ID,
        dependencyId: TEST_DEPENDENCY_ID,
      });

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // CYCLE VALIDATION & TREE
  // ===========================================================================

  describe('validateCycle', () => {
    it('should return no cycle result', async () => {
      vi.mocked(validateNoCycles).mockReturnValue({
        would_create_cycle: false,
        cycle_path: null,
        message: 'No circular dependency would be created',
      });

      mockForsured.mockImplementation(() =>
        createChainableMock({ data: [], error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.validateCycle({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
        dependsOnId: TEST_DEPENDS_ON_ID,
      });

      expect(result.would_create_cycle).toBe(false);
    });
  });

  describe('getTree', () => {
    it('should return dependency tree', async () => {
      const mockTree = {
        id: TEST_REQUIREMENT_ID,
        name: 'Umbrella',
        type: 'umbrella',
        children: [
          { id: TEST_DEPENDS_ON_ID, name: 'GL', type: 'general_liability', children: [], depth: 1, dependency_type: 'requires' },
        ],
        depth: 0,
        dependency_type: null,
      };

      vi.mocked(getDependencyTree).mockReturnValue(mockTree);

      // Mock calls in order: verify ownership, getOrganizationDependencies, getRequirementInfoMap
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          return createChainableMock({
            data: [{ id: TEST_REQUIREMENT_ID, name: 'Umbrella', type: 'umbrella' }],
            error: null
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          return createChainableMock({ data: [], error: null }); // Empty dependencies array
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.getTree({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
      });

      expect(result.id).toBe(TEST_REQUIREMENT_ID);
      expect(result.children).toHaveLength(1);
    });
  });

  describe('getDependents', () => {
    it('should return dependents', async () => {
      vi.mocked(getDependents).mockReturnValue([TEST_DEPENDS_ON_ID]);

      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          return createChainableMock({
            data: [
              { id: TEST_REQUIREMENT_ID, name: 'Umbrella', type: 'umbrella' },
              { id: TEST_DEPENDS_ON_ID, name: 'GL', type: 'general_liability' },
            ],
            error: null
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          return createChainableMock({ data: [], error: null }); // Empty dependencies array
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.getDependents({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
      });

      expect(getDependents).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // UMBRELLA UNDERLYING SCHEDULE
  // ===========================================================================

  describe('listUmbrellaSchedule', () => {
    it('should list umbrella schedule entries', async () => {
      const mockSchedule = [
        {
          id: TEST_SCHEDULE_ID,
          umbrella_requirement_id: TEST_REQUIREMENT_ID,
          underlying_coverage_type: 'general_liability',
          required_minimum_limit: 1000000,
          attachment_point: 1000000,
          is_scheduled: true,
          follows_form: true,
          drop_down_allowed: false,
          drop_down_sir: null,
          exclusions: null,
          notes: null,
        },
      ];

      // Mock permission check
      mockPermissionGranted();

      // First call - verify requirement ownership
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );
      // Second call - list schedule
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: mockSchedule, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.listUmbrellaSchedule({
        organizationId: TEST_ORG_ID,
        umbrellaRequirementId: TEST_REQUIREMENT_ID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].underlying_coverage_type).toBe('general_liability');
    });
  });

  describe('createUmbrellaSchedule', () => {
    it('should create umbrella schedule entry with admin access', async () => {
      mockPermissionGranted();

      const mockCreatedEntry = {
        id: TEST_SCHEDULE_ID,
        umbrella_requirement_id: TEST_REQUIREMENT_ID,
        underlying_coverage_type: 'general_liability',
        required_minimum_limit: 1000000,
        attachment_point: 1000000,
        is_scheduled: true,
        follows_form: true,
        drop_down_allowed: false,
        drop_down_sir: null,
        exclusions: null,
        notes: null,
      };

      let scheduleCallCount = 0;
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          return createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null });
        }
        if (table === 'umbrella_underlying_schedule') {
          scheduleCallCount++;
          // First call - check for duplicate (return null = no duplicate)
          // Second call - insert
          if (scheduleCallCount === 1) {
            return createChainableMock({ data: null, error: null }); // No duplicate
          }
          return createChainableMock({ data: mockCreatedEntry, error: null }); // Insert result
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.createUmbrellaSchedule({
        organizationId: TEST_ORG_ID,
        umbrellaRequirementId: TEST_REQUIREMENT_ID,
        underlyingCoverageType: 'general_liability',
        requiredMinimumLimit: 1000000,
        attachmentPoint: 1000000,
        isScheduled: true,
        followsForm: true,
        dropDownAllowed: false,
      });

      expect(result.underlying_coverage_type).toBe('general_liability');
      expect(result.required_minimum_limit).toBe(1000000);
    });

    it('should reject without admin access', async () => {
      mockPermissionDenied('REQUIREMENT_EDIT');

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.createUmbrellaSchedule({
          organizationId: TEST_ORG_ID,
          umbrellaRequirementId: TEST_REQUIREMENT_ID,
          underlyingCoverageType: 'general_liability',
          requiredMinimumLimit: 1000000,
          attachmentPoint: 1000000,
        })
      ).rejects.toThrow('Compliance permission denied');
    });
  });

  describe('deleteUmbrellaSchedule', () => {
    it('should delete umbrella schedule entry with admin access', async () => {
      mockPermissionGranted();

      mockForsured.mockImplementation(() =>
        createChainableMock({
          data: {
            id: TEST_SCHEDULE_ID,
            umbrella_requirement_id: TEST_REQUIREMENT_ID,
            requirement: { organization_id: TEST_ORG_ID },
          },
          error: null,
        })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.deleteUmbrellaSchedule({
        organizationId: TEST_ORG_ID,
        scheduleId: TEST_SCHEDULE_ID,
      });

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // COMPLIANCE RULES
  // ===========================================================================

  describe('listRules', () => {
    it('should list rules for a requirement', async () => {
      const mockRules = [
        {
          id: TEST_RULE_ID,
          requirement_id: TEST_REQUIREMENT_ID,
          rule_type: 'include',
          condition_field: 'project.contract_value',
          condition_operator: 'greater_than',
          condition_value: 5000000,
          priority: 10,
          description: 'High value projects only',
        },
      ];

      // First call - verify requirement ownership
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );
      // Second call - list rules
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: mockRules, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.listRules({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
      });

      expect(result).toHaveLength(1);
      expect(result[0].rule_type).toBe('include');
    });
  });

  describe('createRule', () => {
    it('should create rule with admin access', async () => {
      mockPermissionGranted();

      const mockCreatedRule = {
        id: TEST_RULE_ID,
        requirement_id: TEST_REQUIREMENT_ID,
        rule_type: 'include',
        condition_field: 'project.contract_value',
        condition_operator: 'greater_than',
        condition_value: 5000000,
        priority: 10,
        description: 'High value projects only',
      };

      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          return createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null });
        }
        if (table === 'compliance_requirement_rules') {
          return createChainableMock({ data: mockCreatedRule, error: null });
        }
        return createChainableMock({ data: [], error: null });
      });

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.createRule({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_ID,
        ruleType: 'include',
        conditionField: 'project.contract_value',
        conditionOperator: 'greater_than',
        conditionValue: 5000000,
        priority: 10,
        description: 'High value projects only',
      });

      expect(result.rule_type).toBe('include');
      expect(result.condition_field).toBe('project.contract_value');
    });

    it('should reject without admin access', async () => {
      mockPermissionDenied('RULE_CREATE');

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.createRule({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
          ruleType: 'include',
          conditionField: 'project.type',
          conditionOperator: 'equals',
          conditionValue: 'commercial',
        })
      ).rejects.toThrow('Compliance permission denied');
    });
  });

  describe('deleteRule', () => {
    it('should delete rule with admin access', async () => {
      mockPermissionGranted();

      mockForsured.mockImplementation(() =>
        createChainableMock({
          data: {
            id: TEST_RULE_ID,
            requirement_id: TEST_REQUIREMENT_ID,
            requirement: { organization_id: TEST_ORG_ID },
          },
          error: null,
        })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());
      const result = await caller.deleteRule({
        organizationId: TEST_ORG_ID,
        ruleId: TEST_RULE_ID,
      });

      expect(result.success).toBe(true);
    });
  });

  // ===========================================================================
  // ZOD SCHEMA VALIDATION
  // ===========================================================================

  describe('schema validation', () => {
    it('should reject invalid organizationId', async () => {
      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.list({
          organizationId: 'invalid-uuid',
          requirementId: TEST_REQUIREMENT_ID,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid dependency type', async () => {
      mockAdminAccess(true);

      mockForsured.mockImplementation(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.create({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
          dependsOnId: TEST_DEPENDS_ON_ID,
          // @ts-expect-error - Testing invalid input
          dependencyType: 'invalid_type',
        })
      ).rejects.toThrow();
    });

    it('should reject invalid underlying coverage type', async () => {
      mockAdminAccess(true);

      mockForsured.mockImplementation(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.createUmbrellaSchedule({
          organizationId: TEST_ORG_ID,
          umbrellaRequirementId: TEST_REQUIREMENT_ID,
          // @ts-expect-error - Testing invalid input
          underlyingCoverageType: 'invalid_coverage',
          requiredMinimumLimit: 1000000,
          attachmentPoint: 1000000,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid rule operator', async () => {
      mockAdminAccess(true);

      mockForsured.mockImplementation(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.createRule({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_ID,
          ruleType: 'include',
          conditionField: 'project.type',
          // @ts-expect-error - Testing invalid input
          conditionOperator: 'invalid_operator',
          conditionValue: 'commercial',
        })
      ).rejects.toThrow();
    });

    it('should reject negative limits in umbrella schedule', async () => {
      mockAdminAccess(true);

      mockForsured.mockImplementation(() =>
        createChainableMock({ data: { id: TEST_REQUIREMENT_ID }, error: null })
      );

      const caller = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        caller.createUmbrellaSchedule({
          organizationId: TEST_ORG_ID,
          umbrellaRequirementId: TEST_REQUIREMENT_ID,
          underlyingCoverageType: 'general_liability',
          requiredMinimumLimit: -1000000, // Invalid: negative
          attachmentPoint: 1000000,
        })
      ).rejects.toThrow();
    });
  });
});
