/**
 * Compliance Requirements Router Tests
 * REQ-2, TASK-7: tRPC CRUD Operations for Compliance Requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { complianceRequirementsRouter } from '../complianceRequirements';
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

// Test UUIDs (v4 format)
const ORG_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const REQUIREMENT_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const NON_EXISTENT_UUID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'; // Valid v4 UUID format
const VERSION_UUID = 'a987fbc9-4bed-3078-8f07-9141ba07c9f3'; // Fixed: variant byte must be 8, 9, a, or b

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

// Mock version data
const createMockVersion = (version: number, overrides = {}) => ({
  id: `${VERSION_UUID}-${version}`,
  requirement_id: REQUIREMENT_UUID,
  version,
  snapshot: createMockRequirement(),
  changed_fields: version > 1 ? { name: { old: 'Old Name', new: 'New Name' } } : null,
  change_summary: version === 1 ? 'Initial version' : 'Updated requirement',
  changed_by: USER_UUID,
  changed_at: new Date().toISOString(),
  parent_version_id: version > 1 ? `${VERSION_UUID}-${version - 1}` : null,
  ...overrides,
});

// Mock admin role assignment
const createMockAdminRole = () => ({
  id: 'role-assignment-1',
  roles: { name: 'admin' },
});

/**
 * Creates a chainable mock builder that supports Supabase's thenable pattern
 * The mock is Promise-like so await resolves to the final value
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
    // Make the mock thenable (Promise-like) for queries without terminal methods
    then: (resolve: (value: typeof finalValue) => void) => Promise.resolve(finalValue).then(resolve),
  };
  return mock;
}

describe('Compliance Requirements Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('list', () => {
    it('returns paginated list of requirements', async () => {
      const mockRequirements = [createMockRequirement(), createMockRequirement({ id: 'req-2', code: 'GL-002' })];

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirements, error: null, count: 2 }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        page: 1,
        pageSize: 20,
      });

      expect(result.requirements).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('throws FORBIDDEN when accessing other organization', async () => {
      const ctx = createContext(ORG_UUID);
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('get', () => {
    it('returns a single requirement by ID', async () => {
      const mockRequirement = createMockRequirement();

      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: mockRequirement, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
      });

      expect(result.id).toBe(REQUIREMENT_UUID);
      expect(result.code).toBe('GL-001');
    });

    it('throws NOT_FOUND for non-existent requirement', async () => {
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: ORG_UUID,
          requirementId: NON_EXISTENT_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('create', () => {
    it('creates a new requirement when admin', async () => {
      const mockRequirement = createMockRequirement();

      // Mock admin check - returns admin role assignment
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) check duplicate, 2) insert
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        forsuredCallCount++;
        if (forsuredCallCount === 1) {
          // First call: check for duplicate code
          return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
        }
        // Second call: insert
        return createChainableMock({ data: mockRequirement, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.create({
        organizationId: ORG_UUID,
        code: 'GL-001',
        name: 'General Liability $1M/$2M',
        type: 'general_liability',
        description: 'Standard GL requirement',
        status: 'draft',
        is_template: false,
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

      expect(result.code).toBe('GL-001');
    });

    it('throws CONFLICT for duplicate code', async () => {
      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock duplicate exists
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: { id: 'existing-id' }, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: ORG_UUID,
          code: 'GL-001',
          name: 'General Liability $1M/$2M',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow('already exists');
    });

    it('throws FORBIDDEN when not admin', async () => {
      // Mock non-admin check - returns empty array
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.core>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.create({
          organizationId: ORG_UUID,
          code: 'GL-001',
          name: 'General Liability $1M/$2M',
          type: 'general_liability',
          requirement_definition: {
            coverage_limits: {},
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        })
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('update', () => {
    it('updates an existing requirement when admin', async () => {
      const existingRequirement = createMockRequirement();
      const updatedRequirement = createMockRequirement({ name: 'Updated Name', current_version: 2 });

      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) get existing, 2) update
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        forsuredCallCount++;
        if (forsuredCallCount === 1) {
          // First call: get existing requirement
          return createChainableMock({ data: existingRequirement, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Second call: update
        return createChainableMock({ data: updatedRequirement, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.update({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        updates: {
          name: 'Updated Name',
        },
        change_summary: 'Updated the name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('throws NOT_FOUND for non-existent requirement', async () => {
      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock not found
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.update({
          organizationId: ORG_UUID,
          requirementId: NON_EXISTENT_UUID,
          updates: { name: 'New Name' },
          change_summary: 'Test update',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('delete', () => {
    it('soft deletes (archives) a requirement when admin', async () => {
      const existingRequirement = createMockRequirement();

      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) get existing, 2) update to archived
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        forsuredCallCount++;
        if (forsuredCallCount === 1) {
          // First call: get existing requirement
          return createChainableMock({ data: existingRequirement, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Second call: update to archived - use standard chainable mock which supports multiple eq() calls
        return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.delete({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
      });

      expect(result.success).toBe(true);
    });

    it('throws FORBIDDEN when not admin', async () => {
      // Mock non-admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.core>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.delete({
          organizationId: ORG_UUID,
          requirementId: REQUIREMENT_UUID,
        })
      ).rejects.toThrow('Admin access required');
    });
  });

  describe('clone', () => {
    it('clones an existing requirement when admin', async () => {
      const sourceRequirement = createMockRequirement();
      const clonedRequirement = createMockRequirement({
        id: 'new-req-id',
        code: 'GL-001-COPY',
        name: 'General Liability $1M/$2M (Copy)',
        status: 'draft',
      });

      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) get source, 2) check duplicate, 3) insert
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        forsuredCallCount++;
        if (forsuredCallCount === 1) {
          // First call: get source requirement
          return createChainableMock({ data: sourceRequirement, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        } else if (forsuredCallCount === 2) {
          // Second call: check for duplicate code
          return createChainableMock({ data: null, error: null }) as ReturnType<typeof supabaseModule.forsured>;
        }
        // Third call: insert cloned requirement
        return createChainableMock({ data: clonedRequirement, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.clone({
        organizationId: ORG_UUID,
        sourceRequirementId: REQUIREMENT_UUID,
      });

      expect(result.code).toBe('GL-001-COPY');
      expect(result.status).toBe('draft');
    });

    it('throws NOT_FOUND for non-existent source requirement', async () => {
      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock not found
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.clone({
          organizationId: ORG_UUID,
          sourceRequirementId: NON_EXISTENT_UUID,
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('getVersions', () => {
    it('returns paginated version history', async () => {
      const mockVersions = [createMockVersion(2), createMockVersion(1)];

      // Mock forsured queries: 1) verify requirement exists, 2) get versions
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Version query
        return createChainableMock({ data: mockVersions, error: null, count: 2 }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.getVersions({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
      });

      expect(result.versions).toHaveLength(2);
      expect(result.versions[0].version).toBe(2); // Newest first
      expect(result.pagination.total).toBe(2);
    });

    it('throws NOT_FOUND for non-existent requirement', async () => {
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.getVersions({
          organizationId: ORG_UUID,
          requirementId: NON_EXISTENT_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getVersion', () => {
    it('returns a specific version by version number', async () => {
      const mockVersion = createMockVersion(2);

      // Mock forsured queries: 1) verify requirement exists, 2) get version
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Version query
        return createChainableMock({ data: mockVersion, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.getVersion({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        versionNumber: 2,
      });

      expect(result.version).toBe(2);
      expect(result.requirement_id).toBe(REQUIREMENT_UUID);
    });

    it('returns a specific version by version ID', async () => {
      const mockVersion = createMockVersion(1, { id: VERSION_UUID });

      // Mock forsured queries: 1) verify requirement exists, 2) get version
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Version query
        return createChainableMock({ data: mockVersion, error: null }) as ReturnType<typeof supabaseModule.forsured>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.getVersion({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        versionId: VERSION_UUID,
      });

      expect(result.id).toBe(VERSION_UUID);
      expect(result.version).toBe(1);
    });

    it('throws NOT_FOUND for non-existent version', async () => {
      // Mock forsured queries: 1) verify requirement exists, 2) version not found
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Version not found
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.getVersion({
          organizationId: ORG_UUID,
          requirementId: REQUIREMENT_UUID,
          versionNumber: 999,
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('compareVersions', () => {
    it('returns differences between two versions', async () => {
      const version1 = createMockVersion(1, {
        snapshot: {
          name: 'Original Name',
          description: 'Original description',
          status: 'draft',
        },
      });
      const version2 = createMockVersion(2, {
        snapshot: {
          name: 'Updated Name',
          description: 'Original description',
          status: 'active',
        },
      });

      // Mock forsured queries: 1) verify requirement exists, 2) get both versions
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Return both versions
        return createChainableMock({ data: [version1, version2], error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.compareVersions({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        fromVersionNumber: 1,
        toVersionNumber: 2,
      });

      expect(result.fromVersion.version).toBe(1);
      expect(result.toVersion.version).toBe(2);
      expect(result.differences).toContainEqual({
        field: 'name',
        fromValue: 'Original Name',
        toValue: 'Updated Name',
      });
      expect(result.differences).toContainEqual({
        field: 'status',
        fromValue: 'draft',
        toValue: 'active',
      });
    });

    it('throws NOT_FOUND when one version does not exist', async () => {
      // Mock forsured queries: 1) verify requirement exists, 2) only one version found
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: { id: REQUIREMENT_UUID }, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Only one version found
        return createChainableMock({ data: [createMockVersion(1)], error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.compareVersions({
          organizationId: ORG_UUID,
          requirementId: REQUIREMENT_UUID,
          fromVersionNumber: 1,
          toVersionNumber: 999,
        })
      ).rejects.toThrow('One or both versions not found');
    });
  });

  describe('restoreVersion', () => {
    it('restores a requirement to a previous version when admin', async () => {
      const existingRequirement = createMockRequirement({ current_version: 3 });
      const versionToRestore = createMockVersion(1, {
        snapshot: {
          code: 'GL-001',
          name: 'Version 1 Name',
          type: 'general_liability',
          description: 'Original description',
          status: 'active',
          effective_date: '2024-01-01',
          expiration_date: null,
          requirement_definition: {
            coverage_limits: { per_occurrence: 500000 },
            required_endorsements: [],
            policy_conditions: [],
            documentation_requirements: [],
          },
        },
      });
      const restoredRequirement = createMockRequirement({
        name: 'Version 1 Name',
        current_version: 4,
      });

      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) get existing, 2) get version to restore, 3) update
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' && forsuredCallCount === 1) {
          return createChainableMock({ data: existingRequirement, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        } else if (tableName === 'compliance_requirement_versions' || forsuredCallCount === 2) {
          return createChainableMock({ data: versionToRestore, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Update call
        return createChainableMock({ data: restoredRequirement, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      const result = await caller.restoreVersion({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        versionNumber: 1,
        change_summary: 'Restoring to version 1',
      });

      expect(result.name).toBe('Version 1 Name');
    });

    it('throws FORBIDDEN when not admin', async () => {
      // Mock non-admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.core>;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.restoreVersion({
          organizationId: ORG_UUID,
          requirementId: REQUIREMENT_UUID,
          versionNumber: 1,
          change_summary: 'Restoring to version 1',
        })
      ).rejects.toThrow('Admin access required');
    });

    it('throws NOT_FOUND for non-existent version', async () => {
      const existingRequirement = createMockRequirement();

      // Mock admin check
      vi.mocked(supabaseModule.core).mockImplementation(() => {
        return createChainableMock({ data: [createMockAdminRole()], error: null }) as ReturnType<
          typeof supabaseModule.core
        >;
      });

      // Mock forsured queries: 1) get existing, 2) version not found
      let forsuredCallCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        forsuredCallCount++;
        if (tableName === 'compliance_requirements' || forsuredCallCount === 1) {
          return createChainableMock({ data: existingRequirement, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Version not found
        return createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext();
      const caller = complianceRequirementsRouter.createCaller(ctx);

      await expect(
        caller.restoreVersion({
          organizationId: ORG_UUID,
          requirementId: REQUIREMENT_UUID,
          versionNumber: 999,
          change_summary: 'Restoring to version 999',
        })
      ).rejects.toThrow('not found');
    });
  });
});

describe('Zod Schema Validation', () => {
  const ctx = {
    db: {} as unknown,
    session: { id: USER_UUID, email: 'test@example.com' } as User,
    organizationId: ORG_UUID,
    userId: USER_UUID,
  };

  const caller = complianceRequirementsRouter.createCaller(ctx);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates code format (alphanumeric with dashes only)', async () => {
    await expect(
      caller.create({
        organizationId: ORG_UUID,
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
    await expect(
      caller.create({
        organizationId: ORG_UUID,
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
    await expect(
      caller.create({
        organizationId: ORG_UUID,
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

  it('validates change_summary is required for updates', async () => {
    await expect(
      caller.update({
        organizationId: ORG_UUID,
        requirementId: REQUIREMENT_UUID,
        updates: { name: 'New Name' },
        change_summary: '', // Empty string should fail
      })
    ).rejects.toThrow();
  });

  it('validates coverage_limits allow only non-negative numbers', async () => {
    await expect(
      caller.create({
        organizationId: ORG_UUID,
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
});
