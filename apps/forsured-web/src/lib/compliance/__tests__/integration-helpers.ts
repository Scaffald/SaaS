/**
 * Integration Test Helpers
 * REQ-2, TASK-20: Integration Tests for Complete Compliance Workflow
 *
 * Provides test factories, mock context, and utilities for integration testing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// =============================================================================
// Types
// =============================================================================

export interface TestUser {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
  userType: 'admin' | 'broker' | 'gc' | 'contractor' | 'viewer';
}

export interface TestRequirement {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  status: string;
  is_template: boolean;
  effective_date: string;
  expiration_date: string | null;
  organization_id: string;
  created_by: string | null;
  requirement_definition: RequirementDefinition;
  current_version: number;
  is_current: boolean;
  parent_requirement_id: string | null;
  change_summary: string | null;
  superseded_date: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface RequirementDefinition {
  coverage_limits: {
    per_occurrence?: number;
    aggregate?: number;
    deductible_max?: number;
  };
  required_endorsements: Array<{
    endorsement_type: string;
    description: string;
  }>;
  policy_conditions: Array<{
    condition_type: string;
    description: string;
  }>;
  documentation_requirements: Array<{
    document_type: string;
    is_required: boolean;
  }>;
}

export interface TestDependency {
  id: string;
  requirement_id: string;
  depends_on_id: string;
  dependency_type: 'requires' | 'recommended' | 'alternative';
  condition: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// =============================================================================
// Test Data Factories
// =============================================================================

let idCounter = 0;

/**
 * Generate a unique test ID
 */
export function generateTestId(): string {
  idCounter++;
  return `test-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a test user
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: generateTestId(),
    email: `test-${Date.now()}@example.com`,
    isPlatformAdmin: false,
    userType: 'broker',
    ...overrides,
  };
}

/**
 * Create a test requirement with sensible defaults
 */
export function createTestRequirement(
  organizationId: string,
  overrides: Partial<TestRequirement> = {}
): TestRequirement {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    code: `REQ-${Date.now().toString(36).toUpperCase()}`,
    name: 'Test Requirement',
    type: 'general_liability',
    description: 'Test requirement description',
    status: 'draft',
    is_template: false,
    effective_date: now.split('T')[0],
    expiration_date: null,
    organization_id: organizationId,
    created_by: null,
    requirement_definition: {
      coverage_limits: {
        per_occurrence: 1_000_000,
        aggregate: 2_000_000,
      },
      required_endorsements: [],
      policy_conditions: [],
      documentation_requirements: [],
    },
    current_version: 1,
    is_current: true,
    parent_requirement_id: null,
    change_summary: null,
    superseded_date: null,
    created_at: now,
    updated_at: now,
    archived_at: null,
    ...overrides,
  };
}

/**
 * Create a General Liability test requirement
 */
export function createGLRequirement(
  organizationId: string,
  overrides: Partial<TestRequirement> = {}
): TestRequirement {
  return createTestRequirement(organizationId, {
    code: `GL-${Date.now().toString(36).toUpperCase()}`,
    name: 'General Liability $2M',
    type: 'general_liability',
    requirement_definition: {
      coverage_limits: {
        per_occurrence: 1_000_000,
        aggregate: 2_000_000,
        deductible_max: 10_000,
      },
      required_endorsements: [
        { endorsement_type: 'additional_insured', description: 'Additional insured endorsement' },
      ],
      policy_conditions: [],
      documentation_requirements: [{ document_type: 'certificate', is_required: true }],
    },
    ...overrides,
  });
}

/**
 * Create an Umbrella test requirement
 */
export function createUmbrellaRequirement(
  organizationId: string,
  overrides: Partial<TestRequirement> = {}
): TestRequirement {
  return createTestRequirement(organizationId, {
    code: `UMB-${Date.now().toString(36).toUpperCase()}`,
    name: 'Umbrella $5M',
    type: 'umbrella',
    requirement_definition: {
      coverage_limits: {
        per_occurrence: 5_000_000,
        aggregate: 5_000_000,
      },
      required_endorsements: [],
      policy_conditions: [{ condition_type: 'follow_form', description: 'Must follow form of underlying' }],
      documentation_requirements: [{ document_type: 'certificate', is_required: true }],
    },
    ...overrides,
  });
}

/**
 * Create a Workers Comp test requirement
 */
export function createWorkersCompRequirement(
  organizationId: string,
  overrides: Partial<TestRequirement> = {}
): TestRequirement {
  return createTestRequirement(organizationId, {
    code: `WC-${Date.now().toString(36).toUpperCase()}`,
    name: 'Workers Compensation',
    type: 'workers_comp',
    requirement_definition: {
      coverage_limits: {
        per_occurrence: 1_000_000,
      },
      required_endorsements: [],
      policy_conditions: [],
      documentation_requirements: [{ document_type: 'certificate', is_required: true }],
    },
    ...overrides,
  });
}

/**
 * Create a test dependency
 */
export function createTestDependency(
  requirementId: string,
  dependsOnId: string,
  overrides: Partial<TestDependency> = {}
): TestDependency {
  return {
    id: generateTestId(),
    requirement_id: requirementId,
    depends_on_id: dependsOnId,
    dependency_type: 'requires',
    condition: null,
    notes: null,
    created_at: new Date().toISOString(),
    created_by: null,
    ...overrides,
  };
}

// =============================================================================
// Mock Supabase Client
// =============================================================================

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
}

interface MockStore {
  requirements: Map<string, TestRequirement>;
  dependencies: Map<string, TestDependency>;
  versions: Map<string, Array<{ version_number: number; [key: string]: unknown }>>;
  rolePermissions: Map<string, Set<string>>;
  userRoleOverrides: Map<string, string[]>;
  userProfiles: Map<string, { user_type: string }>;
  roleAssignments: Map<string, Array<{ role: { name: string; scope: string } }>>;
}

/**
 * Create a mock Supabase client with in-memory storage
 */
export function createMockSupabase(): {
  client: SupabaseClient;
  store: MockStore;
  reset: () => void;
} {
  const store: MockStore = {
    requirements: new Map(),
    dependencies: new Map(),
    versions: new Map(),
    rolePermissions: new Map([
      ['platform_admin', new Set([
        'requirement:create', 'requirement:read', 'requirement:update',
        'requirement:delete', 'requirement:clone', 'requirement:manage_dependencies',
        'requirement:bulk_import', 'requirement:bulk_export',
        'requirement:manage_versions', 'requirement:restore_version',
      ])],
      ['broker_admin', new Set([
        'requirement:create', 'requirement:read', 'requirement:update',
        'requirement:clone', 'requirement:manage_dependencies',
        'requirement:bulk_import', 'requirement:bulk_export', 'requirement:manage_versions',
      ])],
      ['gc_admin', new Set([
        'requirement:create', 'requirement:read', 'requirement:update',
        'requirement:clone', 'requirement:manage_dependencies', 'requirement:bulk_export',
      ])],
      ['project_manager', new Set(['requirement:read', 'requirement:clone', 'requirement:bulk_export'])],
      ['subcontractor', new Set(['requirement:read'])],
      ['viewer', new Set(['requirement:read'])],
    ]),
    userRoleOverrides: new Map(),
    userProfiles: new Map(),
    roleAssignments: new Map(),
  };

  const createChainableMock = (resolveValue: unknown): MockQueryBuilder => {
    const mock: MockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(resolveValue),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue(resolveValue),
    };
    return mock;
  };

  const mockSchema = vi.fn().mockImplementation((schemaName: string) => ({
    from: vi.fn().mockImplementation((tableName: string) => {
      // Return appropriate mock based on table
      if (tableName === 'compliance_requirements') {
        return createChainableMock({ data: null, error: null });
      }
      if (tableName === 'compliance_requirement_dependencies') {
        return createChainableMock({ data: null, error: null });
      }
      if (tableName === 'compliance_role_permissions') {
        return createChainableMock({ data: null, error: null });
      }
      if (tableName === 'compliance_user_role_overrides') {
        return createChainableMock({ data: null, error: null });
      }
      if (tableName === 'user_profiles') {
        return createChainableMock({ data: null, error: null });
      }
      if (tableName === 'role_assignments') {
        return createChainableMock({ data: null, error: null });
      }
      return createChainableMock({ data: null, error: null });
    }),
  }));

  const client = {
    schema: mockSchema,
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  } as unknown as SupabaseClient;

  const reset = () => {
    store.requirements.clear();
    store.dependencies.clear();
    store.versions.clear();
    store.userRoleOverrides.clear();
    store.userProfiles.clear();
    store.roleAssignments.clear();
  };

  return { client, store, reset };
}

// =============================================================================
// Test Context Helpers
// =============================================================================

/**
 * Create a mock tRPC context for testing
 */
export function createMockContext(user: TestUser | null, supabase: SupabaseClient) {
  return {
    user: user ? { id: user.id, email: user.email } : null,
    userToken: user ? 'mock-token' : null,
    supabase,
  };
}

/**
 * Configure mock supabase to return platform admin status
 */
export function configurePlatformAdmin(
  store: MockStore,
  userId: string,
  isAdmin: boolean
): void {
  if (isAdmin) {
    store.roleAssignments.set(userId, [{ role: { name: 'super_admin', scope: 'platform' } }]);
  } else {
    store.roleAssignments.set(userId, []);
  }
}

/**
 * Configure mock supabase user profile
 */
export function configureUserProfile(
  store: MockStore,
  userId: string,
  userType: string
): void {
  store.userProfiles.set(userId, { user_type: userType });
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert that a requirement has expected properties
 */
export function assertRequirementShape(requirement: unknown): asserts requirement is TestRequirement {
  const req = requirement as Record<string, unknown>;
  if (typeof req !== 'object' || req === null) {
    throw new Error('Expected requirement to be an object');
  }
  if (typeof req.id !== 'string') {
    throw new Error('Expected requirement.id to be a string');
  }
  if (typeof req.code !== 'string') {
    throw new Error('Expected requirement.code to be a string');
  }
  if (typeof req.name !== 'string') {
    throw new Error('Expected requirement.name to be a string');
  }
}

/**
 * Assert that a dependency has expected properties
 */
export function assertDependencyShape(dependency: unknown): asserts dependency is TestDependency {
  const dep = dependency as Record<string, unknown>;
  if (typeof dep !== 'object' || dep === null) {
    throw new Error('Expected dependency to be an object');
  }
  if (typeof dep.id !== 'string') {
    throw new Error('Expected dependency.id to be a string');
  }
  if (typeof dep.requirement_id !== 'string') {
    throw new Error('Expected dependency.requirement_id to be a string');
  }
  if (typeof dep.depends_on_id !== 'string') {
    throw new Error('Expected dependency.depends_on_id to be a string');
  }
}

// =============================================================================
// Test Data Sets
// =============================================================================

/**
 * Sample requirement definitions for different coverage types
 */
export const SAMPLE_REQUIREMENT_DEFINITIONS = {
  generalLiability: {
    coverage_limits: { per_occurrence: 1_000_000, aggregate: 2_000_000 },
    required_endorsements: [
      { endorsement_type: 'additional_insured', description: 'Must name owner as additional insured' },
    ],
    policy_conditions: [],
    documentation_requirements: [
      { document_type: 'certificate', is_required: true },
      { document_type: 'endorsement_copy', is_required: true },
    ],
  },
  umbrella: {
    coverage_limits: { per_occurrence: 5_000_000, aggregate: 5_000_000 },
    required_endorsements: [],
    policy_conditions: [
      { condition_type: 'follow_form', description: 'Must follow form of underlying' },
    ],
    documentation_requirements: [{ document_type: 'certificate', is_required: true }],
  },
  workersComp: {
    coverage_limits: { per_occurrence: 1_000_000 },
    required_endorsements: [
      { endorsement_type: 'waiver_of_subrogation', description: 'Waiver of subrogation required' },
    ],
    policy_conditions: [],
    documentation_requirements: [{ document_type: 'certificate', is_required: true }],
  },
  autoLiability: {
    coverage_limits: { per_occurrence: 1_000_000 },
    required_endorsements: [
      { endorsement_type: 'hired_non_owned', description: 'Hired and non-owned auto coverage' },
    ],
    policy_conditions: [],
    documentation_requirements: [{ document_type: 'certificate', is_required: true }],
  },
};

/**
 * Sample CSV data for bulk import testing
 */
export const SAMPLE_IMPORT_CSV = `code,name,type,description,status,effective_date,per_occurrence,aggregate
GL-001,General Liability Basic,general_liability,Basic GL coverage,draft,2024-01-01,1000000,2000000
GL-002,General Liability Premium,general_liability,Premium GL coverage,active,2024-01-01,2000000,4000000
WC-001,Workers Comp Standard,workers_comp,Standard WC coverage,draft,2024-01-01,1000000,
UMB-001,Umbrella $5M,umbrella,Umbrella coverage,draft,2024-01-01,5000000,5000000
AUTO-001,Auto Liability,auto_liability,Auto coverage,draft,2024-01-01,1000000,`;

/**
 * Sample invalid CSV data for error testing
 */
export const SAMPLE_INVALID_CSV = `code,name,type,description,status,effective_date,per_occurrence,aggregate
,Missing Code,general_liability,Invalid - no code,draft,2024-01-01,1000000,2000000
INVALID-001,Invalid Type,not_a_real_type,Invalid type value,draft,2024-01-01,1000000,2000000
NEG-001,Negative Limits,general_liability,Invalid - negative,draft,2024-01-01,-1000000,2000000`;
