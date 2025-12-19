/**
 * Compliance Database Authorization Service Tests
 * REQ-2, TASK-18: Tests for database-driven authorization system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ComplianceDbAuthorizationService,
  createComplianceAuthorizationService,
  requireCompliancePermission,
} from '../authorization-service'
import type {
  ComplianceDbPermission,
  ComplianceSystemRole,
  PermissionCheckContext,
} from '../authorization-types'
import { ALL_COMPLIANCE_PERMISSIONS } from '../authorization-types'

// =============================================================================
// Mock Supabase Client
// =============================================================================

function createMockSupabase(options: {
  roleAssignments?: Array<{ role: { name: string; scope: string } }>
  rolePermissions?: Array<{
    role: ComplianceSystemRole
    permission: ComplianceDbPermission
    organization_id: string | null
  }>
  userProfile?: { user_type: string } | null
  userRoleOverrides?: Array<{
    role: ComplianceSystemRole
    organization_id: string | null
  }>
}) {
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()
  const mockSchema = vi.fn()
  const mockEq = vi.fn()
  const mockOr = vi.fn()
  const mockIs = vi.fn()
  const mockSingle = vi.fn()
  const mockInsert = vi.fn()
  const mockDelete = vi.fn()

  // Default responses
  const defaultResponses = {
    role_assignments: { data: options.roleAssignments ?? [], error: null },
    compliance_role_permissions: { data: options.rolePermissions ?? [], error: null },
    user_profiles: { data: options.userProfile ?? null, error: null },
    compliance_user_role_overrides: { data: options.userRoleOverrides ?? [], error: null },
  }

  // Chain mock implementations
  mockSingle.mockImplementation(() => ({
    data: options.userProfile,
    error: null,
  }))

  mockIs.mockImplementation(() => ({
    data: defaultResponses.compliance_role_permissions.data,
    error: null,
  }))

  mockOr.mockImplementation(() => ({
    data: defaultResponses.compliance_role_permissions.data,
    error: null,
  }))

  mockEq.mockImplementation((col: string, val: string) => {
    if (col === 'user_id') {
      return {
        data: defaultResponses.role_assignments.data,
        error: null,
        eq: mockEq,
        single: mockSingle,
        or: mockOr,
        is: mockIs,
      }
    }
    if (col === 'scaffald_user_id') {
      return {
        single: mockSingle,
      }
    }
    return {
      data: [],
      error: null,
      eq: mockEq,
      single: mockSingle,
    }
  })

  mockSelect.mockImplementation(() => ({
    eq: mockEq,
    or: mockOr,
    is: mockIs,
  }))

  mockFrom.mockImplementation((table: string) => {
    if (table === 'role_assignments') {
      return {
        select: () => ({
          eq: () => ({
            data: defaultResponses.role_assignments.data,
            error: null,
          }),
        }),
      }
    }
    if (table === 'compliance_role_permissions') {
      return {
        select: () => ({
          or: () => ({
            data: defaultResponses.compliance_role_permissions.data,
            error: null,
          }),
          is: () => ({
            data: defaultResponses.compliance_role_permissions.data,
            error: null,
          }),
        }),
        insert: () => ({ error: null }),
        delete: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({ error: null }),
              eq: () => ({ error: null }),
            }),
          }),
        }),
      }
    }
    if (table === 'user_profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () => ({
              data: options.userProfile,
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'compliance_user_role_overrides') {
      return {
        select: () => ({
          eq: () => ({
            data: options.userRoleOverrides ?? [],
            error: null,
          }),
        }),
        insert: () => ({ error: null }),
        delete: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({ error: null }),
              eq: () => ({ error: null }),
            }),
          }),
        }),
      }
    }
    return {
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    }
  })

  mockSchema.mockImplementation(() => ({
    from: mockFrom,
  }))

  return {
    schema: mockSchema,
    from: mockFrom,
  } as any
}

// =============================================================================
// Tests
// =============================================================================

describe('ComplianceDbAuthorizationService', () => {
  describe('isPlatformAdmin', () => {
    it('returns true for platform super_admin', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.isPlatformAdmin('user-123')

      expect(result).toBe(true)
    })

    it('returns false for non-admin users', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'manager', scope: 'organization' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.isPlatformAdmin('user-456')

      expect(result).toBe(false)
    })

    it('returns false when no roles assigned', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.isPlatformAdmin('user-789')

      expect(result).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('returns true for platform admin with any permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasPermission({
        userId: 'admin-user',
        permission: 'requirement:delete',
      })

      expect(result).toBe(true)
    })

    it('returns true when role has permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'broker' },
        rolePermissions: [
          { role: 'broker_admin', permission: 'requirement:create', organization_id: null },
          { role: 'broker_admin', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasPermission({
        userId: 'broker-user',
        permission: 'requirement:create',
      })

      expect(result).toBe(true)
    })

    it('returns false when role lacks permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'contractor' },
        rolePermissions: [
          { role: 'subcontractor', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasPermission({
        userId: 'contractor-user',
        permission: 'requirement:delete',
      })

      expect(result).toBe(false)
    })
  })

  describe('checkPermission', () => {
    it('returns detailed result for platform admin', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.checkPermission({
        userId: 'admin-user',
        permission: 'requirement:create',
      })

      expect(result.allowed).toBe(true)
      expect(result.matchedRole).toBe('platform_admin')
      expect(result.reason).toContain('Platform administrator')
    })

    it('returns detailed result for denied permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'contractor' },
        rolePermissions: [
          { role: 'subcontractor', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.checkPermission({
        userId: 'contractor-user',
        permission: 'requirement:delete',
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('No role grants')
    })
  })

  describe('getUserPermissions', () => {
    it('returns all permissions for platform admin', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const permissions = await service.getUserPermissions('admin-user')

      expect(permissions).toEqual(ALL_COMPLIANCE_PERMISSIONS)
    })

    it('returns role-specific permissions', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'broker' },
        rolePermissions: [
          { role: 'broker_admin', permission: 'requirement:create', organization_id: null },
          { role: 'broker_admin', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const permissions = await service.getUserPermissions('broker-user')

      expect(permissions).toContain('requirement:create')
      expect(permissions).toContain('requirement:read')
    })
  })

  describe('getUserComplianceRoles', () => {
    it('maps admin user_type to platform_admin role', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'admin' },
      })

      const service = createComplianceAuthorizationService(supabase)
      const roles = await service.getUserComplianceRoles('admin-user')

      expect(roles.roles).toContain('platform_admin')
    })

    it('maps broker user_type to broker_admin role', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'broker' },
      })

      const service = createComplianceAuthorizationService(supabase)
      const roles = await service.getUserComplianceRoles('broker-user')

      expect(roles.roles).toContain('broker_admin')
    })

    it('maps gc user_type to gc_admin role', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'gc' },
      })

      const service = createComplianceAuthorizationService(supabase)
      const roles = await service.getUserComplianceRoles('gc-user')

      expect(roles.roles).toContain('gc_admin')
    })

    it('maps contractor user_type to subcontractor role', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'contractor' },
      })

      const service = createComplianceAuthorizationService(supabase)
      const roles = await service.getUserComplianceRoles('contractor-user')

      expect(roles.roles).toContain('subcontractor')
    })

    it('defaults to viewer role when no profile', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: null,
      })

      const service = createComplianceAuthorizationService(supabase)
      const roles = await service.getUserComplianceRoles('unknown-user')

      expect(roles.roles).toContain('viewer')
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasAnyPermission('admin-user', [
        'requirement:create',
        'requirement:delete',
      ])

      expect(result).toBe(true)
    })

    it('returns false when user has none of the permissions', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'contractor' },
        rolePermissions: [
          { role: 'subcontractor', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasAnyPermission('contractor-user', [
        'requirement:create',
        'requirement:delete',
      ])

      expect(result).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasAllPermissions('admin-user', [
        'requirement:create',
        'requirement:read',
        'requirement:delete',
      ])

      expect(result).toBe(true)
    })

    it('returns false when user lacks any permission', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [],
        userProfile: { user_type: 'broker' },
        rolePermissions: [
          { role: 'broker_admin', permission: 'requirement:create', organization_id: null },
          { role: 'broker_admin', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const result = await service.hasAllPermissions('broker-user', [
        'requirement:create',
        'requirement:read',
        'requirement:delete', // broker doesn't have delete
      ])

      expect(result).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('returns permissions for a specific role', async () => {
      const supabase = createMockSupabase({
        rolePermissions: [
          { role: 'broker_admin', permission: 'requirement:create', organization_id: null },
          { role: 'broker_admin', permission: 'requirement:read', organization_id: null },
          { role: 'gc_admin', permission: 'requirement:read', organization_id: null },
        ],
      })

      const service = createComplianceAuthorizationService(supabase)
      const permissions = await service.getRolePermissions('broker_admin')

      expect(permissions).toContain('requirement:create')
      expect(permissions).toContain('requirement:read')
    })

    it('returns empty array for role with no permissions', async () => {
      const supabase = createMockSupabase({
        rolePermissions: [],
      })

      const service = createComplianceAuthorizationService(supabase)
      const permissions = await service.getRolePermissions('viewer')

      expect(permissions).toEqual([])
    })
  })

  describe('Cache', () => {
    it('caches platform admin check results', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)

      // First call - should query DB
      await service.isPlatformAdmin('user-123')

      // Second call - should use cache
      await service.isPlatformAdmin('user-123')

      // Check cache stats
      const stats = service.getCacheStats()
      expect(stats.platformAdmin.size).toBeGreaterThan(0)
    })

    it('invalidates all caches', async () => {
      const supabase = createMockSupabase({
        roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
      })

      const service = createComplianceAuthorizationService(supabase)

      // Populate caches
      await service.isPlatformAdmin('user-123')
      await service.getUserComplianceRoles('user-123')

      // Invalidate
      service.invalidateAllCaches()

      // Verify caches are empty
      const stats = service.getCacheStats()
      expect(stats.platformAdmin.size).toBe(0)
      expect(stats.userRoles.size).toBe(0)
      expect(stats.permissionMatrix.size).toBe(0)
    })
  })
})

describe('createComplianceAuthorizationService', () => {
  it('creates a new service instance', () => {
    const supabase = createMockSupabase({})
    const service = createComplianceAuthorizationService(supabase)

    expect(service).toBeInstanceOf(ComplianceDbAuthorizationService)
  })
})

describe('requireCompliancePermission middleware', () => {
  it('throws error when user not authenticated', async () => {
    const middleware = requireCompliancePermission('requirement:create')

    await expect(
      middleware({
        ctx: { user: undefined, supabaseAdmin: undefined },
        input: {},
        next: async () => ({}),
      })
    ).rejects.toThrow('Unauthorized')
  })

  it('throws error when permission denied', async () => {
    const supabase = createMockSupabase({
      roleAssignments: [],
      userProfile: { user_type: 'contractor' },
      rolePermissions: [
        { role: 'subcontractor', permission: 'requirement:read', organization_id: null },
      ],
    })

    const middleware = requireCompliancePermission('requirement:delete')

    await expect(
      middleware({
        ctx: { user: { id: 'user-123' }, supabaseAdmin: supabase },
        input: {},
        next: async () => ({}),
      })
    ).rejects.toThrow('Permission denied')
  })

  it('calls next when permission granted', async () => {
    const supabase = createMockSupabase({
      roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
    })

    const middleware = requireCompliancePermission('requirement:create')
    const next = vi.fn().mockResolvedValue({ success: true })

    const result = await middleware({
      ctx: { user: { id: 'admin-user' }, supabaseAdmin: supabase },
      input: {},
      next,
    })

    expect(next).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it('extracts organization ID from input', async () => {
    const supabase = createMockSupabase({
      roleAssignments: [{ role: { name: 'super_admin', scope: 'platform' } }],
    })

    const middleware = requireCompliancePermission(
      'requirement:create',
      (input) => (input as { organizationId?: string }).organizationId
    )
    const next = vi.fn().mockResolvedValue({ success: true })

    await middleware({
      ctx: { user: { id: 'admin-user' }, supabaseAdmin: supabase },
      input: { organizationId: 'org-123' },
      next,
    })

    expect(next).toHaveBeenCalled()
  })
})
