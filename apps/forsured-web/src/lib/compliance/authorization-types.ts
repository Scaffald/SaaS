/**
 * Compliance Authorization Types
 * REQ-2, TASK-18: Extensible Authorization System with Permission Matrix
 *
 * Type definitions for the database-driven authorization system.
 * These types mirror the database enums in migration 236.
 */

// =============================================================================
// Permission Enum (mirrors forsured.compliance_permission)
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
 * All available compliance permissions
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
// Role Enum (mirrors forsured.compliance_system_role)
// =============================================================================

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
 * All available system roles
 */
export const ALL_SYSTEM_ROLES: ComplianceSystemRole[] = [
  'platform_admin',
  'broker_admin',
  'gc_admin',
  'project_manager',
  'subcontractor',
  'viewer',
]

// =============================================================================
// Database Types
// =============================================================================

/**
 * Role permission record from database
 */
export interface RolePermissionRecord {
  id: string
  role: ComplianceSystemRole
  permission: ComplianceDbPermission
  organization_id: string | null
  granted_by: string | null
  granted_at: string
}

/**
 * User role override record from database
 */
export interface UserRoleOverrideRecord {
  id: string
  user_id: string
  role: ComplianceSystemRole
  organization_id: string | null
  assigned_by: string | null
  assigned_at: string
}

// =============================================================================
// Permission Matrix Types
// =============================================================================

/**
 * Permission matrix: role -> permissions
 */
export type PermissionMatrix = Map<ComplianceSystemRole, Set<ComplianceDbPermission>>

/**
 * Organization-scoped permission matrix
 */
export interface ScopedPermissionMatrix {
  global: PermissionMatrix
  organizations: Map<string, PermissionMatrix>
}

// =============================================================================
// Authorization Context Types
// =============================================================================

/**
 * User compliance role info
 */
export interface UserComplianceRoles {
  userId: string
  roles: ComplianceSystemRole[]
  isPlatformAdmin: boolean
  organizationRoles: Map<string, ComplianceSystemRole[]>
}

/**
 * Authorization check result
 */
export interface AuthorizationResult {
  allowed: boolean
  reason?: string
  matchedRole?: ComplianceSystemRole
}

/**
 * Permission check context
 */
export interface PermissionCheckContext {
  userId: string
  permission: ComplianceDbPermission
  organizationId?: string
}

// =============================================================================
// Admin Operations Types
// =============================================================================

/**
 * Grant permission request
 */
export interface GrantPermissionRequest {
  adminUserId: string
  role: ComplianceSystemRole
  permission: ComplianceDbPermission
  organizationId?: string
}

/**
 * Revoke permission request
 */
export interface RevokePermissionRequest {
  adminUserId: string
  role: ComplianceSystemRole
  permission: ComplianceDbPermission
  organizationId?: string
}

/**
 * Assign role to user request
 */
export interface AssignRoleRequest {
  adminUserId: string
  targetUserId: string
  role: ComplianceSystemRole
  organizationId?: string
}

/**
 * Remove role from user request
 */
export interface RemoveRoleRequest {
  adminUserId: string
  targetUserId: string
  role: ComplianceSystemRole
  organizationId?: string
}

// =============================================================================
// Cache Types
// =============================================================================

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  data: T
  expiresAt: number
}

/**
 * Permission cache configuration
 */
export interface PermissionCacheConfig {
  /** TTL in milliseconds (default: 5 minutes) */
  ttlMs: number
  /** Maximum cache entries (default: 1000) */
  maxEntries: number
}

// =============================================================================
// Display Name Mappings
// =============================================================================

/**
 * Permission display names
 */
export const PERMISSION_DISPLAY_NAMES: Record<ComplianceDbPermission, string> = {
  'requirement:create': 'Create Requirements',
  'requirement:read': 'View Requirements',
  'requirement:update': 'Edit Requirements',
  'requirement:delete': 'Delete Requirements',
  'requirement:clone': 'Clone Requirements',
  'requirement:manage_dependencies': 'Manage Dependencies',
  'requirement:bulk_import': 'Bulk Import',
  'requirement:bulk_export': 'Bulk Export',
  'requirement:manage_versions': 'Manage Versions',
  'requirement:restore_version': 'Restore Version',
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<ComplianceSystemRole, string> = {
  platform_admin: 'Platform Administrator',
  broker_admin: 'Broker Administrator',
  gc_admin: 'General Contractor Admin',
  project_manager: 'Project Manager',
  subcontractor: 'Subcontractor',
  viewer: 'Viewer',
}

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<ComplianceSystemRole, string> = {
  platform_admin: 'Full access to all compliance features across all organizations',
  broker_admin: 'Manage compliance requirements for broker clients',
  gc_admin: 'Manage compliance requirements for GC projects',
  project_manager: 'View and clone requirements for assigned projects',
  subcontractor: 'View compliance requirements relevant to their work',
  viewer: 'Read-only access to compliance requirements',
}
