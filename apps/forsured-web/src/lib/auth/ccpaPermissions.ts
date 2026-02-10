/**
 * CCPA-Specific Permissions System
 * Role-based access control for CCPA admin
 *
 * Implements a 4-role permission model for CCPA compliance management:
 * - global_admin: Full access to all CCPA features
 * - compliance_admin: Manage requests and configurations
 * - app_owner: View/manage only their app's data
 * - auditor: Read-only access to all CCPA data
 */

/**
 * CCPA-specific roles
 */
export type CCPARole = 'global_admin' | 'compliance_admin' | 'app_owner' | 'auditor'

/**
 * CCPA-specific permissions
 */
export enum CCPAPermission {
  // Dashboard
  DASHBOARD_VIEW = 'ccpa:dashboard:view',
  DASHBOARD_METRICS = 'ccpa:dashboard:metrics',

  // Request Management
  REQUEST_VIEW_ALL = 'ccpa:request:view:all',
  REQUEST_VIEW_OWN_APP = 'ccpa:request:view:own_app',
  REQUEST_CREATE = 'ccpa:request:create',
  REQUEST_UPDATE_STATUS = 'ccpa:request:update:status',
  REQUEST_ASSIGN = 'ccpa:request:assign',
  REQUEST_PROCESS = 'ccpa:request:process',
  REQUEST_DELETE = 'ccpa:request:delete',
  REQUEST_BULK_UPDATE = 'ccpa:request:bulk:update',
  REQUEST_BULK_ASSIGN = 'ccpa:request:bulk:assign',

  // App Configuration
  APP_CONFIG_VIEW_ALL = 'ccpa:app:config:view:all',
  APP_CONFIG_VIEW_OWN = 'ccpa:app:config:view:own',
  APP_CONFIG_EDIT = 'ccpa:app:config:edit',
  APP_CONFIG_TEST = 'ccpa:app:config:test',

  // Breach Management
  BREACH_VIEW = 'ccpa:breach:view',
  BREACH_CREATE = 'ccpa:breach:create',
  BREACH_UPDATE = 'ccpa:breach:update',
  BREACH_NOTIFY = 'ccpa:breach:notify',

  // Audit Log
  AUDIT_VIEW = 'ccpa:audit:view',
  AUDIT_EXPORT = 'ccpa:audit:export',

  // Global Settings
  SETTINGS_VIEW = 'ccpa:settings:view',
  SETTINGS_EDIT = 'ccpa:settings:edit',
}

/**
 * Role-based permission matrix for CCPA
 */
export const CCPA_ROLE_PERMISSIONS: Record<CCPARole, CCPAPermission[]> = {
  global_admin: Object.values(CCPAPermission), // Full access

  compliance_admin: [
    CCPAPermission.DASHBOARD_VIEW,
    CCPAPermission.DASHBOARD_METRICS,
    CCPAPermission.REQUEST_VIEW_ALL,
    CCPAPermission.REQUEST_UPDATE_STATUS,
    CCPAPermission.REQUEST_ASSIGN,
    CCPAPermission.REQUEST_PROCESS,
    CCPAPermission.REQUEST_BULK_UPDATE,
    CCPAPermission.REQUEST_BULK_ASSIGN,
    CCPAPermission.APP_CONFIG_VIEW_ALL,
    CCPAPermission.APP_CONFIG_TEST,
    CCPAPermission.BREACH_VIEW,
    CCPAPermission.BREACH_CREATE,
    CCPAPermission.BREACH_UPDATE,
    CCPAPermission.BREACH_NOTIFY,
    CCPAPermission.AUDIT_VIEW,
    CCPAPermission.AUDIT_EXPORT,
    CCPAPermission.SETTINGS_VIEW,
  ],

  app_owner: [
    CCPAPermission.DASHBOARD_VIEW,
    CCPAPermission.DASHBOARD_METRICS,
    CCPAPermission.REQUEST_VIEW_OWN_APP,
    CCPAPermission.REQUEST_UPDATE_STATUS,
    CCPAPermission.REQUEST_ASSIGN,
    CCPAPermission.REQUEST_PROCESS,
    CCPAPermission.APP_CONFIG_VIEW_OWN,
    CCPAPermission.APP_CONFIG_EDIT,
    CCPAPermission.APP_CONFIG_TEST,
    CCPAPermission.AUDIT_VIEW,
  ],

  auditor: [
    CCPAPermission.DASHBOARD_VIEW,
    CCPAPermission.DASHBOARD_METRICS,
    CCPAPermission.REQUEST_VIEW_ALL,
    CCPAPermission.APP_CONFIG_VIEW_ALL,
    CCPAPermission.BREACH_VIEW,
    CCPAPermission.AUDIT_VIEW,
    CCPAPermission.AUDIT_EXPORT,
    CCPAPermission.SETTINGS_VIEW,
  ],
}

/**
 * CCPA Permission Context
 */
export interface CCPAPermissionContext {
  role: CCPARole
  userId: string
  appIds?: string[] // For app_owner role - list of owned app IDs
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: CCPARole, permission: CCPAPermission): boolean {
  const permissions = CCPA_ROLE_PERMISSIONS[role]
  return permissions?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: CCPARole, permissions: CCPAPermission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: CCPARole, permissions: CCPAPermission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: CCPARole): CCPAPermission[] {
  return CCPA_ROLE_PERMISSIONS[role] ?? []
}

/**
 * Check if user can access app-specific data
 * App owners can only see their own apps' data
 */
export function canAccessApp(context: CCPAPermissionContext, appId: string): boolean {
  if (
    context.role === 'global_admin' ||
    context.role === 'compliance_admin' ||
    context.role === 'auditor'
  ) {
    return true // These roles can access all apps
  }

  if (context.role === 'app_owner') {
    return context.appIds?.includes(appId) ?? false
  }

  return false
}

/**
 * Filter list of app IDs to only those the user can access
 */
export function filterAccessibleApps(context: CCPAPermissionContext, appIds: string[]): string[] {
  if (
    context.role === 'global_admin' ||
    context.role === 'compliance_admin' ||
    context.role === 'auditor'
  ) {
    return appIds // Full access
  }

  if (context.role === 'app_owner') {
    return appIds.filter((id) => context.appIds?.includes(id))
  }

  return []
}

/**
 * Check if user can perform write operations
 * Auditors are read-only
 */
export function canWrite(role: CCPARole): boolean {
  return role !== 'auditor'
}

/**
 * Check if user can view all data (vs app-specific)
 */
export function canViewAll(role: CCPARole): boolean {
  return role === 'global_admin' || role === 'compliance_admin' || role === 'auditor'
}

/**
 * Permission check result with reason
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * Detailed permission check with reason for denial
 */
export function checkPermission(
  context: CCPAPermissionContext,
  permission: CCPAPermission,
  appId?: string
): PermissionCheckResult {
  // Check basic role permission
  if (!hasPermission(context.role, permission)) {
    return {
      allowed: false,
      reason: `Role '${context.role}' does not have permission '${permission}'`,
    }
  }

  // Check app-specific access if relevant
  if (appId && !canAccessApp(context, appId)) {
    return {
      allowed: false,
      reason: `User does not have access to app '${appId}'`,
    }
  }

  return { allowed: true }
}

/**
 * Map generic app role to CCPA role
 * Used to convert existing role system to CCPA-specific roles
 */
export function mapToCCPARole(role: string): CCPARole {
  switch (role.toLowerCase()) {
    case 'admin':
    case 'super_admin':
    case 'global_admin':
      return 'global_admin'
    case 'compliance':
    case 'compliance_admin':
      return 'compliance_admin'
    case 'app_owner':
    case 'owner':
      return 'app_owner'
    case 'auditor':
    case 'viewer':
      return 'auditor'
    default:
      return 'auditor' // Default to read-only
  }
}
