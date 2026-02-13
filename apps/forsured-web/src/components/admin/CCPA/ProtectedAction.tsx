/**
 * CCPA Protected Action Component
 * Role-based access control for CCPA admin
 *
 * Wrapper component that conditionally renders children based on CCPA permissions.
 * Provides UI gating for actions and elements based on user role.
 */

import type { ReactNode } from 'react'
import { Stack, Text, Tooltip } from '@scaffald/ui'
import { useCCPAPermissions } from '../../../hooks/useCCPAPermissions'
import type { CCPAPermission } from '../../../lib/auth/ccpaPermissions'

export interface ProtectedActionProps {
  /** Required permission(s) to render children */
  permission?: CCPAPermission | CCPAPermission[]
  /** Require ALL permissions (default: false = any permission) */
  requireAll?: boolean
  /** Optional app ID for app-specific permission checks */
  appId?: string
  /** Require write access (excludes auditors) */
  requireWrite?: boolean
  /** Fallback content when access is denied (default: null) */
  fallback?: ReactNode
  /** Show tooltip on hover when access is denied */
  deniedTooltip?: string
  /** Children to render when access is granted */
  children: ReactNode
}

/**
 * Conditionally renders children based on CCPA permissions
 *
 * @example
 * ```tsx
 * // Basic permission check
 * <ProtectedAction permission={CCPAPermission.REQUEST_UPDATE_STATUS}>
 *   <Button>Update Status</Button>
 * </ProtectedAction>
 *
 * // Multiple permissions (any)
 * <ProtectedAction
 *   permission={[CCPAPermission.REQUEST_ASSIGN, CCPAPermission.REQUEST_BULK_ASSIGN]}
 * >
 *   <Button>Assign</Button>
 * </ProtectedAction>
 *
 * // Multiple permissions (all required)
 * <ProtectedAction
 *   permission={[CCPAPermission.REQUEST_UPDATE_STATUS, CCPAPermission.REQUEST_ASSIGN]}
 *   requireAll
 * >
 *   <Button>Update and Assign</Button>
 * </ProtectedAction>
 *
 * // App-specific check
 * <ProtectedAction permission={CCPAPermission.APP_CONFIG_EDIT} appId={appId}>
 *   <Button>Edit Config</Button>
 * </ProtectedAction>
 *
 * // Write access required
 * <ProtectedAction requireWrite>
 *   <Button>Save Changes</Button>
 * </ProtectedAction>
 *
 * // With fallback content
 * <ProtectedAction
 *   permission={CCPAPermission.SETTINGS_EDIT}
 *   fallback={<Text style={{ color: 'var(--color-gray-11)' }}>Read-only</Text>}
 * >
 *   <Button>Edit Settings</Button>
 * </ProtectedAction>
 * ```
 */
export function ProtectedAction({
  permission,
  requireAll = false,
  appId,
  requireWrite = false,
  fallback = null,
  deniedTooltip,
  children,
}: ProtectedActionProps): ReactNode {
  const { canAny, canAll, canAccessApp, canWrite } = useCCPAPermissions()

  // Check permissions
  let hasAccess = true

  // Check write access if required
  if (requireWrite && !canWrite) {
    hasAccess = false
  }

  // Check app access if appId is provided
  if (hasAccess && appId && !canAccessApp(appId)) {
    hasAccess = false
  }

  // Check specific permission(s) if provided
  if (hasAccess && permission) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    if (requireAll) {
      hasAccess = canAll(permissions)
    } else {
      hasAccess = canAny(permissions)
    }
  }

  // Access granted - render children
  if (hasAccess) {
    return <>{children}</>
  }

  // Access denied - render fallback or tooltip wrapper
  if (fallback) {
    if (deniedTooltip) {
      return (
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Stack>{fallback}</Stack>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Text style={{ fontSize: 12 }}>{deniedTooltip}</Text>
          </Tooltip.Content>
        </Tooltip>
      )
    }
    return <>{fallback}</>
  }

  // No fallback - render nothing
  return null
}

/**
 * Disabled version of ProtectedAction that shows disabled content instead of hiding
 */
export interface ProtectedActionDisabledProps extends Omit<ProtectedActionProps, 'fallback'> {
  /** Render function that receives disabled state */
  children: (disabled: boolean) => ReactNode
}

/**
 * Variant that renders children with disabled state instead of hiding
 *
 * @example
 * ```tsx
 * <ProtectedActionDisabled permission={CCPAPermission.REQUEST_UPDATE_STATUS}>
 *   {(disabled) => (
 *     <Button disabled={disabled}>Update Status</Button>
 *   )}
 * </ProtectedActionDisabled>
 * ```
 */
export function ProtectedActionDisabled({
  permission,
  requireAll = false,
  appId,
  requireWrite = false,
  deniedTooltip,
  children,
}: ProtectedActionDisabledProps): ReactNode {
  const { canAny, canAll, canAccessApp, canWrite } = useCCPAPermissions()

  // Check permissions
  let hasAccess = true

  if (requireWrite && !canWrite) {
    hasAccess = false
  }

  if (hasAccess && appId && !canAccessApp(appId)) {
    hasAccess = false
  }

  if (hasAccess && permission) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    if (requireAll) {
      hasAccess = canAll(permissions)
    } else {
      hasAccess = canAny(permissions)
    }
  }

  const content = children(!hasAccess)

  if (!hasAccess && deniedTooltip) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Stack>{content}</Stack>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Text style={{ fontSize: 12 }}>{deniedTooltip}</Text>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return <>{content}</>
}

export default ProtectedAction
