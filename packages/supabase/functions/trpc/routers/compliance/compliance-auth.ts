/**
 * Compliance Authorization Middleware for tRPC
 * REQ-2, TASK-19: Integrate Authorization Checks into tRPC Routers
 *
 * Provides database-driven authorization middleware for compliance endpoints.
 * Uses the forsured.compliance_role_permissions table for runtime configuration.
 */

import { TRPCError } from '@trpc/server'
import type { Context } from '../../context.ts'
import { t } from '../../middleware.ts'

// =============================================================================
// Types
// =============================================================================

/**
 * Compliance permissions as stored in the database
 */
export type ComplianceDbPermission =
  | 'requirement:create'
  | 'requirement:read'
  | 'requirement:update'
  | 'requirement:delete'
  | 'requirement:clone'
  | 'requirement:manage_dependencies'
  | 'requirement:bulk_import'
  | 'requirement:bulk_export'
  | 'requirement:manage_versions'
  | 'requirement:restore_version'

/**
 * System roles for compliance authorization
 */
export type ComplianceSystemRole =
  | 'platform_admin'
  | 'broker_admin'
  | 'gc_admin'
  | 'project_manager'
  | 'subcontractor'
  | 'viewer'

/**
 * All compliance permissions
 */
export const ALL_COMPLIANCE_PERMISSIONS: ComplianceDbPermission[] = [
  'requirement:create',
  'requirement:read',
  'requirement:update',
  'requirement:delete',
  'requirement:clone',
  'requirement:manage_dependencies',
  'requirement:bulk_import',
  'requirement:bulk_export',
  'requirement:manage_versions',
  'requirement:restore_version',
]

// =============================================================================
// Cache Implementation
// =============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private ttlMs: number

  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs
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
    if (this.cache.size >= 1000) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
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
}

// Global caches
const platformAdminCache = new SimpleCache<boolean>()
const userRolesCache = new SimpleCache<ComplianceSystemRole[]>()
const permissionMatrixCache = new SimpleCache<
  Map<ComplianceSystemRole, Set<ComplianceDbPermission>>
>()

// =============================================================================
// Authorization Helpers
// =============================================================================

/**
 * Check if user is a platform super_admin
 */
export async function isPlatformAdmin(
  supabase: Context['supabase'],
  userId: string
): Promise<boolean> {
  const cacheKey = `platform_admin:${userId}`
  const cached = platformAdminCache.get(cacheKey)
  if (cached !== undefined) return cached

  const { data } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', userId)

  const isAdmin =
    data?.some(
      // biome-ignore lint/suspicious/noExplicitAny: Role can be array or object from join
      (a: any) => {
        const role = Array.isArray(a.role) ? a.role[0] : a.role
        return role?.name === 'super_admin' && role?.scope === 'platform'
      }
    ) ?? false

  platformAdminCache.set(cacheKey, isAdmin)
  return isAdmin
}

/**
 * Map Forsured user_type to compliance role
 */
function mapUserTypeToRole(userType: string): ComplianceSystemRole {
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

/**
 * Get user's compliance roles
 */
export async function getUserComplianceRoles(
  supabase: Context['supabase'],
  userId: string
): Promise<ComplianceSystemRole[]> {
  const cacheKey = `user_roles:${userId}`
  const cached = userRolesCache.get(cacheKey)
  if (cached) return cached

  // Get role overrides
  const { data: overrides } = await supabase
    .schema('forsured')
    .from('compliance_user_role_overrides')
    .select('role')
    .eq('user_id', userId)

  // Get user profile for default role mapping
  const { data: profile } = await supabase
    .schema('forsured')
    .from('user_profiles')
    .select('user_type')
    .eq('scaffald_user_id', userId)
    .single()

  const roles: ComplianceSystemRole[] = []

  // Add roles from overrides
  if (overrides && overrides.length > 0) {
    for (const override of overrides) {
      roles.push(override.role as ComplianceSystemRole)
    }
  }

  // Map user_type to default compliance role if no overrides
  if (roles.length === 0 && profile?.user_type) {
    roles.push(mapUserTypeToRole(profile.user_type))
  }

  // Default to viewer if no roles
  if (roles.length === 0) {
    roles.push('viewer')
  }

  userRolesCache.set(cacheKey, roles)
  return roles
}

/**
 * Get the permission matrix
 */
export async function getPermissionMatrix(
  supabase: Context['supabase'],
  organizationId?: string
): Promise<Map<ComplianceSystemRole, Set<ComplianceDbPermission>>> {
  const cacheKey = organizationId ? `matrix:org:${organizationId}` : 'matrix:global'
  const cached = permissionMatrixCache.get(cacheKey)
  if (cached) return cached

  let query = supabase
    .schema('forsured')
    .from('compliance_role_permissions')
    .select('role, permission')

  if (organizationId) {
    query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`)
  } else {
    query = query.is('organization_id', null)
  }

  const { data } = await query

  const matrix = new Map<ComplianceSystemRole, Set<ComplianceDbPermission>>()
  if (data) {
    for (const record of data) {
      const role = record.role as ComplianceSystemRole
      const permission = record.permission as ComplianceDbPermission
      const rolePermissions = matrix.get(role) ?? new Set()
      rolePermissions.add(permission)
      matrix.set(role, rolePermissions)
    }
  }

  permissionMatrixCache.set(cacheKey, matrix)
  return matrix
}

/**
 * Check if user has a specific compliance permission
 */
export async function hasCompliancePermission(
  supabase: Context['supabase'],
  userId: string,
  permission: ComplianceDbPermission,
  organizationId?: string
): Promise<boolean> {
  // Platform admins have all permissions
  if (await isPlatformAdmin(supabase, userId)) {
    return true
  }

  // Get user roles and permission matrix
  const roles = await getUserComplianceRoles(supabase, userId)
  const matrix = await getPermissionMatrix(supabase, organizationId)

  // Check each role
  for (const role of roles) {
    const rolePermissions = matrix.get(role)
    if (rolePermissions?.has(permission)) {
      return true
    }
  }

  return false
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  supabase: Context['supabase'],
  userId: string,
  organizationId?: string
): Promise<ComplianceDbPermission[]> {
  if (await isPlatformAdmin(supabase, userId)) {
    return ALL_COMPLIANCE_PERMISSIONS
  }

  const roles = await getUserComplianceRoles(supabase, userId)
  const matrix = await getPermissionMatrix(supabase, organizationId)

  const permissions = new Set<ComplianceDbPermission>()
  for (const role of roles) {
    const rolePermissions = matrix.get(role)
    if (rolePermissions) {
      for (const perm of rolePermissions) {
        permissions.add(perm)
      }
    }
  }

  return Array.from(permissions)
}

// =============================================================================
// tRPC Middleware
// =============================================================================

/**
 * Middleware to enforce compliance permission
 * Use: .use(enforceCompliancePermission('requirement:read'))
 */
export function enforceCompliancePermission(
  permission: ComplianceDbPermission,
  getOrganizationId?: (input: unknown) => string | undefined
) {
  return t.middleware(async ({ ctx, input, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const organizationId = getOrganizationId?.(input as Record<string, unknown>)

    const hasPermission = await hasCompliancePermission(
      ctx.supabase,
      ctx.user.id,
      permission,
      organizationId
    )

    if (!hasPermission) {
      console.warn('[compliance-auth] Permission denied', {
        userId: ctx.user.id,
        permission,
        organizationId,
      })
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You do not have permission to ${permission.replace(':', ' ')}`,
      })
    }

    return next({
      ctx: {
        ...ctx,
        complianceAuth: {
          userId: ctx.user.id,
          permission,
          organizationId,
        },
      },
    })
  })
}

/**
 * Helper to extract organizationId from common input shapes
 */
export const getOrgIdFromInput = (input: unknown): string | undefined => {
  const record = input as Record<string, unknown>
  return (record?.organizationId as string) ?? (record?.organization_id as string)
}

// =============================================================================
// Cache Invalidation
// =============================================================================

/**
 * Invalidate all compliance authorization caches
 * Call this after role or permission changes
 */
export function invalidateComplianceAuthCache(): void {
  platformAdminCache.invalidate()
  userRolesCache.invalidate()
  permissionMatrixCache.invalidate()
}

/**
 * Invalidate cache for a specific user
 */
export function invalidateUserCache(userId: string): void {
  platformAdminCache.invalidate(`platform_admin:${userId}`)
  userRolesCache.invalidate(`user_roles:${userId}`)
}
