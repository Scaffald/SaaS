/**
 * Integration Tests for Complete Compliance Workflow
 * REQ-2, TASK-20: Test end-to-end compliance requirement management
 *
 * Tests the complete workflow including:
 * - Requirements CRUD with version history
 * - Dependency management with cycle detection
 * - Bulk import/export operations
 * - Authorization integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';

// =============================================================================
// Mock Setup
// =============================================================================

// Mock the supabase module
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

// Import after mocks
import { complianceRequirementsRouter } from '../complianceRequirements';
import { complianceDependenciesRouter } from '../complianceDependencies';
import { bulkOperationsRouter } from '../bulkOperations';
import { validateNoCycles, getDependencyTree, getDependents } from '../../../../lib/compliance/dependency-resolver';

// =============================================================================
// Test Constants
// =============================================================================

const TEST_ORG_ID = '11111111-2222-4333-8444-555555555555';
const TEST_USER_ID = '66666666-7777-4888-9999-aaaaaaaaaaaa';
const TEST_REQUIREMENT_IDS = {
  umbrella: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
  generalLiability: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
  workersComp: 'cccccccc-dddd-4eee-8fff-111111111111',
  autoLiability: 'dddddddd-eeee-4fff-8111-222222222222',
};
const TEST_DEPENDENCY_ID = 'eeeeeeee-ffff-4111-8222-333333333333';

// =============================================================================
// Test Helpers
// =============================================================================

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
    email: 'admin@test.forsured.com',
  } as User;

  return {
    db: {} as unknown,
    session: mockUser,
    userId,
    organizationId: overrides.organizationId ?? TEST_ORG_ID,
  };
}

function mockPermissionGranted() {
  mockRequirePermission.mockResolvedValue({
    hasPermission: vi.fn().mockResolvedValue(true),
    getRole: vi.fn().mockReturnValue('admin'),
  });
}

function mockPermissionDenied(permission = 'REQUIREMENT_CREATE') {
  mockRequirePermission.mockRejectedValue(
    new TRPCError({
      code: 'FORBIDDEN',
      message: `Compliance permission denied: ${permission}`,
    })
  );
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('Compliance Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequirePermission.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // WORKFLOW 1: Complete Requirement Lifecycle
  // ===========================================================================

  describe('Complete Requirement Lifecycle', () => {
    it('should create, update, and archive a requirement with version history', async () => {
      mockPermissionGranted();

      // Step 1: Create a requirement
      const createdRequirement = {
        id: TEST_REQUIREMENT_IDS.generalLiability,
        code: 'GL-001',
        name: 'General Liability $1M/$2M',
        type: 'general_liability',
        description: 'Standard GL requirement',
        status: 'draft',
        is_template: false,
        effective_date: '2024-01-01',
        expiration_date: null,
        organization_id: TEST_ORG_ID,
        created_by: TEST_USER_ID,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock for create - need to handle duplicate check (maybeSingle returns null) and insert
      let createCallCount = 0;
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          createCallCount++;
          if (createCallCount === 1) {
            // First call is duplicate code check - return null (no duplicate)
            return createChainableMock({ data: null, error: null });
          }
          // Second call is the actual insert
          return createChainableMock({ data: createdRequirement, error: null });
        }
        return createChainableMock({ data: null, error: null });
      });

      const requirementsRouter = complianceRequirementsRouter.createCaller(createMockContext());

      // Create
      const createResult = await requirementsRouter.create({
        organizationId: TEST_ORG_ID,
        code: 'GL-001',
        name: 'General Liability $1M/$2M',
        type: 'general_liability',
        description: 'Standard GL requirement',
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

      expect(createResult.code).toBe('GL-001');
      expect(createResult.status).toBe('draft');
      expect(createResult.current_version).toBe(1);

      // Step 2: Update the requirement (should trigger version)
      const updatedRequirement = {
        ...createdRequirement,
        status: 'active',
        current_version: 2,
        updated_at: new Date().toISOString(),
      };

      let updateCallCount = 0;
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          updateCallCount++;
          // First call is the fetch to verify requirement exists
          // Second call is the update itself
          return createChainableMock({ data: updatedRequirement, error: null });
        }
        return createChainableMock({ data: null, error: null });
      });

      const updateResult = await requirementsRouter.update({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.generalLiability,
        updates: {
          status: 'active',
        },
        change_summary: 'Activated for production use',
      });

      expect(updateResult.status).toBe('active');
      expect(updateResult.current_version).toBe(2);

      // Step 3: Archive the requirement (using delete which does soft delete)
      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          // First call: check exists, second: update to archived
          return createChainableMock({ data: { id: TEST_REQUIREMENT_IDS.generalLiability }, error: null });
        }
        return createChainableMock({ data: null, error: null });
      });

      const archiveResult = await requirementsRouter.delete({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.generalLiability,
      });

      expect(archiveResult.success).toBe(true);
    });
  });

  // ===========================================================================
  // WORKFLOW 2: Dependency Management with Cycle Detection
  // ===========================================================================

  describe('Dependency Management with Cycle Detection', () => {
    it('should create umbrella policy with underlying requirements', async () => {
      mockPermissionGranted();

      // Setup: Have an umbrella requirement and underlying requirements
      vi.mocked(validateNoCycles).mockReturnValue({
        would_create_cycle: false,
        cycle_path: null,
        message: 'No circular dependency would be created',
      });

      const umbrellaRequirement = {
        id: TEST_REQUIREMENT_IDS.umbrella,
        code: 'UMB-001',
        name: 'Umbrella $5M',
        type: 'umbrella',
        organization_id: TEST_ORG_ID,
      };

      const glRequirement = {
        id: TEST_REQUIREMENT_IDS.generalLiability,
        code: 'GL-001',
        name: 'General Liability $1M/$2M',
        type: 'general_liability',
        organization_id: TEST_ORG_ID,
      };

      const createdDependency = {
        id: TEST_DEPENDENCY_ID,
        requirement_id: TEST_REQUIREMENT_IDS.umbrella,
        depends_on_id: TEST_REQUIREMENT_IDS.generalLiability,
        dependency_type: 'requires',
        condition: null,
        notes: 'Umbrella requires underlying GL coverage',
        created_at: new Date().toISOString(),
      };

      let dependencyCallCount = 0;
      let requirementCallCount = 0;

      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          requirementCallCount++;
          if (requirementCallCount <= 2) {
            return createChainableMock({ data: umbrellaRequirement, error: null });
          }
          return createChainableMock({
            data: [umbrellaRequirement, glRequirement],
            error: null,
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          dependencyCallCount++;
          if (dependencyCallCount === 1) {
            return createChainableMock({ data: null, error: null }); // No duplicate
          }
          if (dependencyCallCount === 2) {
            return createChainableMock({ data: [], error: null }); // No existing deps
          }
          return createChainableMock({ data: createdDependency, error: null });
        }
        return createChainableMock({ data: [], error: null });
      });

      const dependenciesRouter = complianceDependenciesRouter.createCaller(createMockContext());

      // Create dependency between umbrella and GL
      const result = await dependenciesRouter.create({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.umbrella,
        dependsOnId: TEST_REQUIREMENT_IDS.generalLiability,
        dependencyType: 'requires',
        notes: 'Umbrella requires underlying GL coverage',
      });

      expect(result.dependency_type).toBe('requires');
      expect(validateNoCycles).toHaveBeenCalled();
    });

    it('should prevent circular dependencies', async () => {
      mockPermissionGranted();

      // Setup: Trying to create a cycle
      vi.mocked(validateNoCycles).mockReturnValue({
        would_create_cycle: true,
        cycle_path: [
          TEST_REQUIREMENT_IDS.umbrella,
          TEST_REQUIREMENT_IDS.generalLiability,
          TEST_REQUIREMENT_IDS.umbrella,
        ],
        message: 'Adding this dependency would create a circular reference',
      });

      let dependencyCallCount = 0;
      let requirementCallCount = 0;

      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          requirementCallCount++;
          if (requirementCallCount <= 2) {
            return createChainableMock({ data: { id: TEST_REQUIREMENT_IDS.umbrella }, error: null });
          }
          return createChainableMock({
            data: [
              { id: TEST_REQUIREMENT_IDS.umbrella, name: 'Umbrella', type: 'umbrella' },
              { id: TEST_REQUIREMENT_IDS.generalLiability, name: 'GL', type: 'general_liability' },
            ],
            error: null,
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          dependencyCallCount++;
          if (dependencyCallCount === 1) {
            return createChainableMock({ data: null, error: null }); // No duplicate
          }
          return createChainableMock({ data: [], error: null }); // Existing deps
        }
        return createChainableMock({ data: [], error: null });
      });

      const dependenciesRouter = complianceDependenciesRouter.createCaller(createMockContext());

      // Attempt to create a circular dependency
      await expect(
        dependenciesRouter.create({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_IDS.generalLiability,
          dependsOnId: TEST_REQUIREMENT_IDS.umbrella,
          dependencyType: 'requires',
        })
      ).rejects.toThrow('circular');
    });

    it('should resolve dependency tree for umbrella policy', async () => {
      mockPermissionGranted();

      const mockTree = {
        id: TEST_REQUIREMENT_IDS.umbrella,
        name: 'Umbrella $5M',
        type: 'umbrella',
        children: [
          {
            id: TEST_REQUIREMENT_IDS.generalLiability,
            name: 'GL $1M/$2M',
            type: 'general_liability',
            children: [],
            depth: 1,
            dependency_type: 'requires',
          },
          {
            id: TEST_REQUIREMENT_IDS.autoLiability,
            name: 'Auto $1M',
            type: 'auto',
            children: [],
            depth: 1,
            dependency_type: 'requires',
          },
        ],
        depth: 0,
        dependency_type: null,
      };

      vi.mocked(getDependencyTree).mockReturnValue(mockTree);

      mockForsured.mockImplementation((table) => {
        if (table === 'compliance_requirements') {
          return createChainableMock({
            data: [
              { id: TEST_REQUIREMENT_IDS.umbrella, name: 'Umbrella $5M', type: 'umbrella' },
              { id: TEST_REQUIREMENT_IDS.generalLiability, name: 'GL $1M/$2M', type: 'general_liability' },
              { id: TEST_REQUIREMENT_IDS.autoLiability, name: 'Auto $1M', type: 'auto' },
            ],
            error: null,
          });
        }
        if (table === 'compliance_requirement_dependencies') {
          return createChainableMock({ data: [], error: null });
        }
        return createChainableMock({ data: [], error: null });
      });

      const dependenciesRouter = complianceDependenciesRouter.createCaller(createMockContext());

      const tree = await dependenciesRouter.getTree({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.umbrella,
      });

      expect(tree.id).toBe(TEST_REQUIREMENT_IDS.umbrella);
      expect(tree.children).toHaveLength(2);
      expect(tree.children[0].depth).toBe(1);
    });
  });

  // ===========================================================================
  // WORKFLOW 3: Bulk Import and Export
  // ===========================================================================

  describe('Bulk Import and Export Workflow', () => {
    it('should preview, import, and export requirements', async () => {
      mockPermissionGranted();

      // Step 1: Preview import
      const importData = JSON.stringify([
        {
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        {
          code: 'WC-001',
          name: 'Workers Comp',
          type: 'workers_comp',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      ]);

      // Mock for preview (empty existing codes)
      mockForsured.mockImplementation(() => {
        return createChainableMock({ data: [], error: null });
      });

      const bulkRouter = bulkOperationsRouter.createCaller(createMockContext());

      // Preview
      const preview = await bulkRouter.importPreview({
        organizationId: TEST_ORG_ID,
        data: importData,
        format: 'json',
      });

      expect(preview.totalRows).toBe(2);
      expect(preview.validRows).toBe(2);
      expect(preview.canProceed).toBe(true);

      // Step 2: Execute import
      let callCount = 0;
      mockForsured.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return createChainableMock({ data: [], error: null }); // Existing codes
        }
        // Insert results
        return createChainableMock({
          data: { id: `req-${callCount}` },
          error: null,
        });
      });

      const importResult = await bulkRouter.importExecute({
        organizationId: TEST_ORG_ID,
        data: importData,
        format: 'json',
      });

      expect(importResult.success).toBe(true);
      expect(importResult.successfulImports).toBe(2);
      expect(importResult.createdIds).toHaveLength(2);

      // Step 3: Export the requirements
      const exportedRequirements = [
        {
          id: TEST_REQUIREMENT_IDS.generalLiability,
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          description: null,
          status: 'active',
          is_template: false,
          effective_date: '2024-01-01',
          expiration_date: null,
          requirement_definition: {
            coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
          current_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: TEST_REQUIREMENT_IDS.workersComp,
          code: 'WC-001',
          name: 'Workers Comp',
          type: 'workers_comp',
          description: null,
          status: 'active',
          is_template: false,
          effective_date: '2024-01-01',
          expiration_date: null,
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
          current_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockForsured.mockImplementation(() => {
        return createChainableMock({ data: exportedRequirements, error: null });
      });

      const exportResult = await bulkRouter.export({
        organizationId: TEST_ORG_ID,
        format: 'json',
      });

      expect(exportResult.mimeType).toBe('application/json');
      expect(exportResult.totalRecords).toBe(2);

      const parsed = JSON.parse(exportResult.data);
      expect(parsed.requirements).toHaveLength(2);
    });

    it('should handle bulk status updates', async () => {
      mockPermissionGranted();

      mockForsured.mockImplementation(() => {
        return createChainableMock({ data: null, error: null });
      });

      const bulkRouter = bulkOperationsRouter.createCaller(createMockContext());

      const result = await bulkRouter.bulkStatusUpdate({
        organizationId: TEST_ORG_ID,
        requirementIds: [
          TEST_REQUIREMENT_IDS.generalLiability,
          TEST_REQUIREMENT_IDS.workersComp,
        ],
        status: 'active',
        change_summary: 'Bulk activation for Q1 2024',
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });
  });

  // ===========================================================================
  // WORKFLOW 4: Authorization Enforcement
  // ===========================================================================

  describe('Authorization Enforcement', () => {
    it('should enforce permissions across all operations', async () => {
      // Test that non-admin users are blocked from sensitive operations

      // Requirements - Create
      mockPermissionDenied('REQUIREMENT_CREATE');
      const requirementsRouter = complianceRequirementsRouter.createCaller(createMockContext());

      await expect(
        requirementsRouter.create({
          organizationId: TEST_ORG_ID,
          code: 'GL-001',
          name: 'Test',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow('Compliance permission denied');

      // Dependencies - Create
      mockPermissionDenied('DEPENDENCY_CREATE');
      const dependenciesRouter = complianceDependenciesRouter.createCaller(createMockContext());

      await expect(
        dependenciesRouter.create({
          organizationId: TEST_ORG_ID,
          requirementId: TEST_REQUIREMENT_IDS.umbrella,
          dependsOnId: TEST_REQUIREMENT_IDS.generalLiability,
          dependencyType: 'requires',
        })
      ).rejects.toThrow('Compliance permission denied');

      // Bulk Operations - Import
      mockPermissionDenied('BULK_IMPORT');
      const bulkRouter = bulkOperationsRouter.createCaller(createMockContext());

      await expect(
        bulkRouter.importExecute({
          organizationId: TEST_ORG_ID,
          data: '[]',
        })
      ).rejects.toThrow('Compliance permission denied');
    });

    it('should allow read operations for authorized users', async () => {
      mockPermissionGranted();

      const mockRequirements = [
        {
          id: TEST_REQUIREMENT_IDS.generalLiability,
          code: 'GL-001',
          name: 'General Liability',
          type: 'general_liability',
          status: 'active',
        },
      ];

      mockForsured.mockImplementation(() => {
        return createChainableMock({
          data: mockRequirements,
          error: null,
          count: 1,
        });
      });

      const requirementsRouter = complianceRequirementsRouter.createCaller(createMockContext());

      // List should work
      const result = await requirementsRouter.list({
        organizationId: TEST_ORG_ID,
        page: 1,
        pageSize: 10,
      });

      expect(result.requirements).toHaveLength(1);
    });
  });

  // ===========================================================================
  // WORKFLOW 5: Version History Tracking
  // ===========================================================================

  describe('Version History Tracking', () => {
    it('should retrieve version history for a requirement', async () => {
      mockPermissionGranted();

      const mockVersions = [
        {
          id: 'ffffffff-1111-4222-8333-444444444444',
          requirement_id: TEST_REQUIREMENT_IDS.generalLiability,
          version: 2,
          changed_at: '2024-01-15T00:00:00Z',
          change_summary: 'Increased coverage limits',
          changed_by: TEST_USER_ID,
          changed_fields: { coverage_limits: { per_occurrence: 2000000 } },
          snapshot: {},
          parent_version_id: null,
        },
        {
          id: 'ffffffff-2222-4333-8444-555555555555',
          requirement_id: TEST_REQUIREMENT_IDS.generalLiability,
          version: 1,
          changed_at: '2024-01-01T00:00:00Z',
          change_summary: 'Initial version',
          changed_by: TEST_USER_ID,
          changed_fields: null,
          snapshot: {},
          parent_version_id: null,
        },
      ];

      // First call - verify requirement exists
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({
          data: {
            id: TEST_REQUIREMENT_IDS.generalLiability,
            organization_id: TEST_ORG_ID,
          },
          error: null,
        })
      );

      // Second call - get versions (with count for pagination)
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: mockVersions, error: null, count: 2 })
      );

      const requirementsRouter = complianceRequirementsRouter.createCaller(createMockContext());

      const result = await requirementsRouter.getVersions({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.generalLiability,
        page: 1,
        pageSize: 10,
      });

      expect(result.versions).toHaveLength(2);
      expect(result.versions[0].version).toBe(2);
      expect(result.versions[0].change_summary).toBe('Increased coverage limits');
      expect(result.versions[1].version).toBe(1);
    });

    it('should compare two versions of a requirement', async () => {
      mockPermissionGranted();

      const version1Data = {
        id: 'ffffffff-3333-4444-8555-666666666666',
        requirement_id: TEST_REQUIREMENT_IDS.generalLiability,
        version: 1,
        snapshot: {
          code: 'GL-001',
          name: 'General Liability $1M',
          requirement_definition: {
            coverage_limits: { per_occurrence: 1000000, aggregate: 2000000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        changed_at: '2024-01-01T00:00:00Z',
        change_summary: 'Initial version',
        changed_by: TEST_USER_ID,
        changed_fields: null,
      };

      const version2Data = {
        id: 'ffffffff-4444-4555-8666-777777777777',
        requirement_id: TEST_REQUIREMENT_IDS.generalLiability,
        version: 2,
        snapshot: {
          code: 'GL-001',
          name: 'General Liability $2M',
          requirement_definition: {
            coverage_limits: { per_occurrence: 2000000, aggregate: 4000000 },
            required_endorsements: ['AI-001'],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
        changed_at: '2024-01-15T00:00:00Z',
        change_summary: 'Increased limits and added endorsement',
        changed_by: TEST_USER_ID,
        changed_fields: {
          name: { old: 'General Liability $1M', new: 'General Liability $2M' },
        },
      };

      // First call - verify requirement exists
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({
          data: {
            id: TEST_REQUIREMENT_IDS.generalLiability,
            organization_id: TEST_ORG_ID,
          },
          error: null,
        })
      );

      // Second call - get both versions (compareVersions fetches both at once)
      mockForsured.mockImplementationOnce(() =>
        createChainableMock({ data: [version1Data, version2Data], error: null })
      );

      const requirementsRouter = complianceRequirementsRouter.createCaller(createMockContext());

      const comparison = await requirementsRouter.compareVersions({
        organizationId: TEST_ORG_ID,
        requirementId: TEST_REQUIREMENT_IDS.generalLiability,
        fromVersionNumber: 1,
        toVersionNumber: 2,
      });

      expect(comparison.fromVersion).toBeDefined();
      expect(comparison.toVersion).toBeDefined();
      expect(comparison.fromVersion.version).toBe(1);
      expect(comparison.toVersion.version).toBe(2);
      expect(comparison.differences).toBeInstanceOf(Array);
    });
  });

  // ===========================================================================
  // WORKFLOW 6: Organization Isolation
  // ===========================================================================

  describe('Organization Isolation', () => {
    it('should prevent access to other organizations data', async () => {
      const differentOrgId = '99999999-aaaa-4bbb-8ccc-dddddddddddd';

      // Context has differentOrgId, but trying to access TEST_ORG_ID
      const ctx = createMockContext({ organizationId: differentOrgId });
      const requirementsRouter = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        requirementsRouter.list({
          organizationId: TEST_ORG_ID, // Different from context
          page: 1,
          pageSize: 10,
        })
      ).rejects.toThrow(/permission|access/i);
    });
  });
});
