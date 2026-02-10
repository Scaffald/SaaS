/**
 * Compliance Authorization Service (Server-Side)
 * Extensible Authorization System with Permission Matrix
 *
 * Database-driven authorization service with caching for tRPC routers.
 * Uses the forsured.compliance_role_permissions table for runtime configuration.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ComplianceDbPermission,
  ComplianceSystemRole,
  RolePermissionRecord,
  UserRoleOverrideRecord,
  PermissionMatrix,
  UserComplianceRoles,
  AuthorizationResult,
  PermissionCheckContext,
  GrantPermissionRequest,
  RevokePermissionRequest,
  AssignRoleRequest,
  RemoveRoleRequest,
  CacheEntry,
  PermissionCacheConfig,
} from './authorization-types'
import { ALL_COMPLIANCE_PERMISSIONS } from './authorization-types'

// =============================================================================
// Cache Implementation
// =============================================================================

/**
 * Simple in-memory cache with TTL
 */
class PermissionCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private config: PermissionCacheConfig

  constructor(config: Partial<PermissionCacheConfig> = {}) {
    this.config = {
      ttlMs: config.ttlMs ?? 5 * 60 * 1000, // 5 minutes default
      maxEntries: config.maxEntries ?? 1000,
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.data
  }

  set(key: string, data: T): void {
    // Evict oldest entries if at max capacity
    if (this.cache.size >= this.config.maxEntries) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.ttlMs,
    })
  }

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key)
      }
    }
  }

  getStats(): { size: number; maxEntries: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      ttlMs: this.config.ttlMs,
    }
  }
}

// =============================================================================
// Global Caches
// =============================================================================

const permissionMatrixCache = new PermissionCache<PermissionMatrix>()
const userRolesCache = new PermissionCache<UserComplianceRoles>()
const platformAdminCache = new PermissionCache<boolean>()

// =============================================================================
// Authorization Service
// =============================================================================

/**
 * Server-side compliance authorization service
 * Uses database-driven permissions with caching
 */
export class ComplianceDbAuthorizationService {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // ===========================================================================
  // Permission Checks
  // ===========================================================================

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(ctx: PermissionCheckContext): Promise<boolean> {
    const result = await this.checkPermission(ctx)
    return result.allowed
  }

  /**
   * Check permission with detailed result
   */
  async checkPermission(ctx: PermissionCheckContext): Promise<AuthorizationResult> {
    const { userId, permission, organizationId } = ctx

    // Check if user is platform super_admin (has all permissions)
    const isPlatformAdmin = await this.isPlatformAdmin(userId)
    if (isPlatformAdmin) {
      return { allowed: true, reason: 'Platform administrator', matchedRole: 'platform_admin' }
    }

    // Get user's compliance roles
    const userRoles = await this.getUserComplianceRoles(userId)

    // Get permission matrix
    const matrix = await this.getPermissionMatrix(organizationId)

    // Check each role for the permission
    for (const role of userRoles.roles) {
      const rolePermissions = matrix.get(role)
      if (rolePermissions?.has(permission)) {
        return { allowed: true, reason: `Role ${role} grants permission`, matchedRole: role }
      }
    }

    // Check organization-specific roles
    if (organizationId) {
      const orgRoles = userRoles.organizationRoles.get(organizationId) ?? []
      for (const role of orgRoles) {
        const rolePermissions = matrix.get(role)
        if (rolePermissions?.has(permission)) {
          return {
            allowed: true,
            reason: `Organization role ${role} grants permission`,
            matchedRole: role,
          }
        }
      }
    }

    return { allowed: false, reason: 'No role grants this permission' }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string,
    permissions: ComplianceDbPermission[],
    organizationId?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission({ userId, permission, organizationId })) {
        return true
      }
    }
    return false
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    userId: string,
    permissions: ComplianceDbPermission[],
    organizationId?: string
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission({ userId, permission, organizationId }))) {
        return false
      }
    }
    return true
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(
    userId: string,
    organizationId?: string
  ): Promise<ComplianceDbPermission[]> {
    const isPlatformAdmin = await this.isPlatformAdmin(userId)
    if (isPlatformAdmin) {
      return ALL_COMPLIANCE_PERMISSIONS
    }

    const userRoles = await this.getUserComplianceRoles(userId)
    const matrix = await this.getPermissionMatrix(organizationId)

    const permissions = new Set<ComplianceDbPermission>()

    // Collect permissions from all roles
    for (const role of userRoles.roles) {
      const rolePermissions = matrix.get(role)
      if (rolePermissions) {
        for (const perm of rolePermissions) {
          permissions.add(perm)
        }
      }
    }

    // Collect permissions from organization-specific roles
    if (organizationId) {
      const orgRoles = userRoles.organizationRoles.get(organizationId) ?? []
      for (const role of orgRoles) {
        const rolePermissions = matrix.get(role)
        if (rolePermissions) {
          for (const perm of rolePermissions) {
            permissions.add(perm)
          }
        }
      }
    }

    return Array.from(permissions)
  }

  // ===========================================================================
  // Platform Admin Check
  // ===========================================================================

  /**
   * Check if user is a platform super_admin
   */
  async isPlatformAdmin(userId: string): Promise<boolean> {
    const cacheKey = `platform_admin:${userId}`
    const cached = platformAdminCache.get(cacheKey)
    if (cached !== undefined) return cached

    const { data } = await this.supabase
      .schema('core')
      .from('role_assignments')
      .select('role:roles(name, scope)')
      .eq('user_id', userId)

    const isPlatformAdmin =
      data?.some(
        (a: { role: { name: string; scope: string } | null }) =>
          a.role?.name === 'super_admin' && a.role?.scope === 'platform'
      ) ?? false

    platformAdminCache.set(cacheKey, isPlatformAdmin)
    return isPlatformAdmin
  }

  // ===========================================================================
  // User Roles
  // ===========================================================================

  /**
   * Get user's compliance roles
   */
  async getUserComplianceRoles(userId: string): Promise<UserComplianceRoles> {
    const cacheKey = `user_roles:${userId}`
    const cached = userRolesCache.get(cacheKey)
    if (cached) return cached

    // Get role overrides from forsured.compliance_user_role_overrides
    const { data: overrides } = await this.supabase
      .schema('forsured')
      .from('compliance_user_role_overrides')
      .select('*')
      .eq('user_id', userId)

    // Get user profile for default role mapping
    const { data: profile } = await this.supabase
      .schema('forsured')
      .from('user_profiles')
      .select('user_type')
      .eq('scaffald_user_id', userId)
      .single()

    const roles: ComplianceSystemRole[] = []
    const organizationRoles = new Map<string, ComplianceSystemRole[]>()

    // Add roles from overrides
    if (overrides) {
      for (const override of overrides as UserRoleOverrideRecord[]) {
        if (override.organization_id) {
          const orgRoles = organizationRoles.get(override.organization_id) ?? []
          orgRoles.push(override.role)
          organizationRoles.set(override.organization_id, orgRoles)
        } else {
          roles.push(override.role)
        }
      }
    }

    // Map user_type to default compliance role if no overrides
    if (roles.length === 0 && profile?.user_type) {
      const defaultRole = this.mapUserTypeToRole(profile.user_type)
      if (defaultRole) {
        roles.push(defaultRole)
      }
    }

    // Default to viewer if no roles
    if (roles.length === 0) {
      roles.push('viewer')
    }

    const result: UserComplianceRoles = {
      userId,
      roles,
      isPlatformAdmin: await this.isPlatformAdmin(userId),
      organizationRoles,
    }

    userRolesCache.set(cacheKey, result)
    return result
  }

  /**
   * Map Forsured user_type to compliance role
   */
  private mapUserTypeToRole(userType: string): ComplianceSystemRole | null {
    switch (userType) {
      case 'admin':
        return 'platform_admin'
      case 'broker':
        return 'broker_admin'
      case 'gc':
        return 'gc_admin'
      case 'contractor':
        return 'subcontractor'
      default:
        return 'viewer'
    }
  }

  // ===========================================================================
  // Permission Matrix
  // ===========================================================================

  /**
   * Get the permission matrix (cached)
   */
  async getPermissionMatrix(organizationId?: string): Promise<PermissionMatrix> {
    const cacheKey = organizationId ? `matrix:org:${organizationId}` : 'matrix:global'
    const cached = permissionMatrixCache.get(cacheKey)
    if (cached) return cached

    // Build query
    let query = this.supabase
      .schema('forsured')
      .from('compliance_role_permissions')
      .select('*')

    if (organizationId) {
      // Get global permissions + org-specific permissions
      query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    } else {
      // Get only global permissions
      query = query.is('organization_id', null)
    }

    const { data } = await query

    // Build matrix
    const matrix: PermissionMatrix = new Map()
    if (data) {
      for (const record of data as RolePermissionRecord[]) {
        const rolePermissions = matrix.get(record.role) ?? new Set()
        rolePermissions.add(record.permission)
        matrix.set(record.role, rolePermissions)
      }
    }

    permissionMatrixCache.set(cacheKey, matrix)
    return matrix
  }

  // ===========================================================================
  // Admin Operations
  // ===========================================================================

  /**
   * Grant a permission to a role (admin only)
   */
  async grantPermissionToRole(request: GrantPermissionRequest): Promise<void> {
    const { adminUserId, role, permission, organizationId } = request

    // Verify admin is platform admin
    const isAdmin = await this.isPlatformAdmin(adminUserId)
    if (!isAdmin) {
      throw new Error('Only platform administrators can grant permissions')
    }

    // Insert permission record
    const { error } = await this.supabase
      .schema('forsured')
      .from('compliance_role_permissions')
      .insert({
        role,
        permission,
        organization_id: organizationId ?? null,
        granted_by: adminUserId,
      })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - permission already exists
        return
      }
      throw new Error(`Failed to grant permission: ${error.message}`)
    }

    // Invalidate cache
    this.invalidatePermissionCache(organizationId)
  }

  /**
   * Revoke a permission from a role (admin only)
   */
  async revokePermissionFromRole(request: RevokePermissionRequest): Promise<void> {
    const { adminUserId, role, permission, organizationId } = request

    // Verify admin is platform admin
    const isAdmin = await this.isPlatformAdmin(adminUserId)
    if (!isAdmin) {
      throw new Error('Only platform administrators can revoke permissions')
    }

    // Delete permission record
    let query = this.supabase
      .schema('forsured')
      .from('compliance_role_permissions')
      .delete()
      .eq('role', role)
      .eq('permission', permission)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else {
      query = query.is('organization_id', null)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to revoke permission: ${error.message}`)
    }

    // Invalidate cache
    this.invalidatePermissionCache(organizationId)
  }

  /**
   * Assign a compliance role to a user (admin only)
   */
  async assignRoleToUser(request: AssignRoleRequest): Promise<void> {
    const { adminUserId, targetUserId, role, organizationId } = request

    // Verify admin is platform admin
    const isAdmin = await this.isPlatformAdmin(adminUserId)
    if (!isAdmin) {
      throw new Error('Only platform administrators can assign roles')
    }

    // Insert role override
    const { error } = await this.supabase
      .schema('forsured')
      .from('compliance_user_role_overrides')
      .insert({
        user_id: targetUserId,
        role,
        organization_id: organizationId ?? null,
        assigned_by: adminUserId,
      })

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - role already assigned
        return
      }
      throw new Error(`Failed to assign role: ${error.message}`)
    }

    // Invalidate user roles cache
    userRolesCache.invalidate(`user_roles:${targetUserId}`)
  }

  /**
   * Remove a compliance role from a user (admin only)
   */
  async removeRoleFromUser(request: RemoveRoleRequest): Promise<void> {
    const { adminUserId, targetUserId, role, organizationId } = request

    // Verify admin is platform admin
    const isAdmin = await this.isPlatformAdmin(adminUserId)
    if (!isAdmin) {
      throw new Error('Only platform administrators can remove roles')
    }

    // Delete role override
    let query = this.supabase
      .schema('forsured')
      .from('compliance_user_role_overrides')
      .delete()
      .eq('user_id', targetUserId)
      .eq('role', role)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else {
      query = query.is('organization_id', null)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`)
    }

    // Invalidate user roles cache
    userRolesCache.invalidate(`user_roles:${targetUserId}`)
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(
    role: ComplianceSystemRole,
    organizationId?: string
  ): Promise<ComplianceDbPermission[]> {
    const matrix = await this.getPermissionMatrix(organizationId)
    const permissions = matrix.get(role)
    return permissions ? Array.from(permissions) : []
  }

  /**
   * Get the full permission matrix as a serializable object
   */
  async getSerializablePermissionMatrix(
    organizationId?: string
  ): Promise<Record<ComplianceSystemRole, ComplianceDbPermission[]>> {
    const matrix = await this.getPermissionMatrix(organizationId)
    const result: Record<string, ComplianceDbPermission[]> = {}

    for (const [role, permissions] of matrix) {
      result[role] = Array.from(permissions)
    }

    return result as Record<ComplianceSystemRole, ComplianceDbPermission[]>
  }

  // ===========================================================================
  // Cache Management
  // ===========================================================================

  /**
   * Invalidate permission cache
   */
  invalidatePermissionCache(organizationId?: string): void {
    if (organizationId) {
      permissionMatrixCache.invalidate(`matrix:org:${organizationId}`)
    } else {
      permissionMatrixCache.invalidate('matrix:')
    }
  }

  /**
   * Invalidate all caches
   */
  invalidateAllCaches(): void {
    permissionMatrixCache.invalidate()
    userRolesCache.invalidate()
    platformAdminCache.invalidate()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    permissionMatrix: { size: number; maxEntries: number; ttlMs: number }
    userRoles: { size: number; maxEntries: number; ttlMs: number }
    platformAdmin: { size: number; maxEntries: number; ttlMs: number }
  } {
    return {
      permissionMatrix: permissionMatrixCache.getStats(),
      userRoles: userRolesCache.getStats(),
      platformAdmin: platformAdminCache.getStats(),
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a compliance authorization service instance
 */
export function createComplianceAuthorizationService(
  supabase: SupabaseClient
): ComplianceDbAuthorizationService {
  return new ComplianceDbAuthorizationService(supabase)
}

// =============================================================================
// tRPC Middleware Helper
// =============================================================================

/**
 * Create a permission check middleware for tRPC
 */
export function requireCompliancePermission(
  permission: ComplianceDbPermission,
  getOrganizationId?: (input: unknown) => string | undefined
) {
  return async (opts: {
    ctx: { user?: { id: string }; supabaseAdmin?: SupabaseClient }
    input: unknown
    next: () => Promise<unknown>
  }) => {
    const { ctx, input, next } = opts

    if (!ctx.user?.id || !ctx.supabaseAdmin) {
      throw new Error('Unauthorized')
    }

    const authService = createComplianceAuthorizationService(ctx.supabaseAdmin)
    const organizationId = getOrganizationId?.(input)

    const result = await authService.checkPermission({
      userId: ctx.user.id,
      permission,
      organizationId,
    })

    if (!result.allowed) {
      throw new Error(`Permission denied: ${result.reason}`)
    }

    return next()
  }
}
