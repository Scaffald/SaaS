/**
 * CCPA Permissions Hook
 * Role-based access control for CCPA admin
 *
 * React hook for checking CCPA-specific permissions in components.
 * Provides easy access to permission checks for UI gating.
 */

import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../lib/trpc'
import {
  type CCPARole,
  CCPAPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessApp,
  canWrite,
  canViewAll,
  mapToCCPARole,
  type CCPAPermissionContext,
} from '../lib/auth/ccpaPermissions'

/**
 * Result of the useCCPAPermissions hook
 */
export interface UseCCPAPermissionsResult {
  /** Whether CCPA permissions have been loaded */
  isLoading: boolean
  /** Whether user has any CCPA access */
  hasAccess: boolean
  /** User's CCPA role */
  role: CCPARole | null
  /** List of app IDs the user owns (for app_owner role) */
  ownedAppIds: string[]
  /** Permission context for detailed checks */
  context: CCPAPermissionContext | null

  // Permission check functions
  /** Check if user has a specific permission */
  can: (permission: CCPAPermission) => boolean
  /** Check if user has any of the specified permissions */
  canAny: (permissions: CCPAPermission[]) => boolean
  /** Check if user has all of the specified permissions */
  canAll: (permissions: CCPAPermission[]) => boolean
  /** Check if user can access a specific app's data */
  canAccessApp: (appId: string) => boolean
  /** Check if user can perform write operations */
  canWrite: boolean
  /** Check if user can view all data (vs app-specific) */
  canViewAll: boolean

  // Convenience permission checks
  canViewDashboard: boolean
  canViewMetrics: boolean
  canViewRequests: boolean
  canUpdateRequestStatus: boolean
  canAssignRequest: boolean
  canProcessRequest: boolean
  canBulkUpdate: boolean
  canViewAppConfig: boolean
  canEditAppConfig: boolean
  canViewBreaches: boolean
  canCreateBreach: boolean
  canViewAuditLog: boolean
  canExportAuditLog: boolean
  canEditSettings: boolean
}

/**
 * Hook for CCPA-specific permission checks
 *
 * @example
 * ```tsx
 * function RequestActions({ request }) {
 *   const { can, canWrite, canAccessApp } = useCCPAPermissions();
 *
 *   // Only show edit button if user can write and access this app
 *   const canEdit = canWrite && canAccessApp(request.appId);
 *
 *   return (
 *     <div>
 *       {can(CCPAPermission.REQUEST_UPDATE_STATUS) && <StatusButton />}
 *       {canEdit && <EditButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCCPAPermissions(): UseCCPAPermissionsResult {
  const { profile, isAuthenticated } = useAuth()

  // Fetch CCPA role and owned apps from the API
  // This will be populated once we have the endpoint
  const { data: ccpaUserData, isLoading: isLoadingCCPA } =
    trpc.ccpaAdmin.getCurrentUserAccess.useQuery(undefined, {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    })

  // Build permission context
  const context = useMemo((): CCPAPermissionContext | null => {
    if (!isAuthenticated || !profile) {
      return null
    }

    // Get CCPA role from API response or map from user type
    const role: CCPARole = ccpaUserData?.role
      ? (ccpaUserData.role as CCPARole)
      : mapToCCPARole(profile.user_type ?? 'auditor')

    return {
      role,
      userId: profile.id ?? '',
      appIds: ccpaUserData?.ownedAppIds ?? [],
    }
  }, [isAuthenticated, profile, ccpaUserData])

  // Permission check functions
  const can = useMemo(
    () =>
      (permission: CCPAPermission): boolean => {
        if (!context) return false
        return hasPermission(context.role, permission)
      },
    [context]
  )

  const canAnyFn = useMemo(
    () =>
      (permissions: CCPAPermission[]): boolean => {
        if (!context) return false
        return hasAnyPermission(context.role, permissions)
      },
    [context]
  )

  const canAllFn = useMemo(
    () =>
      (permissions: CCPAPermission[]): boolean => {
        if (!context) return false
        return hasAllPermissions(context.role, permissions)
      },
    [context]
  )

  const canAccessAppFn = useMemo(
    () =>
      (appId: string): boolean => {
        if (!context) return false
        return canAccessApp(context, appId)
      },
    [context]
  )

  // Convenience permission checks
  const permissions = useMemo(() => {
    if (!context) {
      return {
        canWrite: false,
        canViewAll: false,
        canViewDashboard: false,
        canViewMetrics: false,
        canViewRequests: false,
        canUpdateRequestStatus: false,
        canAssignRequest: false,
        canProcessRequest: false,
        canBulkUpdate: false,
        canViewAppConfig: false,
        canEditAppConfig: false,
        canViewBreaches: false,
        canCreateBreach: false,
        canViewAuditLog: false,
        canExportAuditLog: false,
        canEditSettings: false,
      }
    }

    return {
      canWrite: canWrite(context.role),
      canViewAll: canViewAll(context.role),
      canViewDashboard: hasPermission(context.role, CCPAPermission.DASHBOARD_VIEW),
      canViewMetrics: hasPermission(context.role, CCPAPermission.DASHBOARD_METRICS),
      canViewRequests: hasAnyPermission(context.role, [
        CCPAPermission.REQUEST_VIEW_ALL,
        CCPAPermission.REQUEST_VIEW_OWN_APP,
      ]),
      canUpdateRequestStatus: hasPermission(context.role, CCPAPermission.REQUEST_UPDATE_STATUS),
      canAssignRequest: hasPermission(context.role, CCPAPermission.REQUEST_ASSIGN),
      canProcessRequest: hasPermission(context.role, CCPAPermission.REQUEST_PROCESS),
      canBulkUpdate: hasAnyPermission(context.role, [
        CCPAPermission.REQUEST_BULK_UPDATE,
        CCPAPermission.REQUEST_BULK_ASSIGN,
      ]),
      canViewAppConfig: hasAnyPermission(context.role, [
        CCPAPermission.APP_CONFIG_VIEW_ALL,
        CCPAPermission.APP_CONFIG_VIEW_OWN,
      ]),
      canEditAppConfig: hasPermission(context.role, CCPAPermission.APP_CONFIG_EDIT),
      canViewBreaches: hasPermission(context.role, CCPAPermission.BREACH_VIEW),
      canCreateBreach: hasPermission(context.role, CCPAPermission.BREACH_CREATE),
      canViewAuditLog: hasPermission(context.role, CCPAPermission.AUDIT_VIEW),
      canExportAuditLog: hasPermission(context.role, CCPAPermission.AUDIT_EXPORT),
      canEditSettings: hasPermission(context.role, CCPAPermission.SETTINGS_EDIT),
    }
  }, [context])

  return {
    isLoading: isLoadingCCPA,
    hasAccess: context !== null && permissions.canViewDashboard,
    role: context?.role ?? null,
    ownedAppIds: context?.appIds ?? [],
    context,
    can,
    canAny: canAnyFn,
    canAll: canAllFn,
    canAccessApp: canAccessAppFn,
    ...permissions,
  }
}

export default useCCPAPermissions
