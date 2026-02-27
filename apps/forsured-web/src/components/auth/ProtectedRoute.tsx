// src/components/auth/ProtectedRoute.tsx
// OAuth 2.0 + RBAC Authentication System
//
// Protected route wrapper that enforces authentication and role-based access
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../Common/LoadingSpinner'
import type { UserType } from '../../types'

interface ProtectedRouteProps {
  allowedTypes?: UserType[]
  requiredRole?: UserType // Single role shorthand for allowedTypes
  requiredPermission?: string // Permission-based access (for future use)
  requireOnboarding?: boolean
  children: React.ReactNode
}

/**
 * Map database user types to route user types
 * Database uses: gc, contractor, broker, admin
 * Routes use: manager, subcontractor, broker, admin
 */
function mapDbTypeToRouteType(dbType: string): UserType {
  const mapping: Record<string, UserType> = {
    gc: 'manager',
    contractor: 'subcontractor',
    broker: 'broker',
    admin: 'admin',
    // Also accept already-mapped types
    manager: 'manager',
    subcontractor: 'subcontractor',
  }
  return mapping[dbType] || (dbType as UserType)
}

/**
 * Map route user type to path segment for onboarding redirect
 */
function mapTypeToPath(routeType: UserType): string {
  const paths: Record<string, string> = {
    manager: 'manager',
    subcontractor: 'subcontractor',
    broker: 'broker',
    admin: 'admin',
  }
  return paths[routeType] || routeType
}

export function ProtectedRoute({
  allowedTypes,
  requiredRole,
  requiredPermission,
  requireOnboarding = true,
  children,
}: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (!profile) {
    // User authenticated but no ForSured profile - redirect to login for now
    // TODO: Create dedicated signup flow for new users
    return <Navigate to="/" />
  }

  // Map database type to route type for comparisons
  const mappedUserType = mapDbTypeToRouteType(profile.user_type)
  const pathSegment = mapTypeToPath(mappedUserType)

  if (requireOnboarding && !profile.onboarding_completed) {
    // Routes are /{type}/onboarding, not /onboarding/{type}
    return <Navigate to={`/${pathSegment}/onboarding`} />
  }

  // Build effective allowed types from either prop
  const effectiveAllowedTypes = allowedTypes || (requiredRole ? [requiredRole] : undefined)

  if (effectiveAllowedTypes && !effectiveAllowedTypes.includes(mappedUserType)) {
    return <Navigate to="/unauthorized" />
  }

  // Note: requiredPermission is not yet implemented - placeholder for future use
  // When implemented, it will check user permissions against the required permission

  return <>{children}</>
}

export default ProtectedRoute

/**
 * Higher-order component to require authentication
 * Usage: export default requireAuth(MyComponent)
 */
export function requireAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute requireOnboarding={false}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Higher-order component to require a specific role
 * Usage: export default requireRole('manager')(MyComponent)
 */
export function requireRole(role: UserType) {
  return function<P extends object>(Component: React.ComponentType<P>) {
    return function RoleProtectedComponent(props: P) {
      return (
        <ProtectedRoute requiredRole={role}>
          <Component {...props} />
        </ProtectedRoute>
      )
    }
  }
}

/**
 * Higher-order component to require a specific permission
 * Usage: export default requirePermission('edit:projects')(MyComponent)
 * Note: Permission checking is not yet implemented
 */
export function requirePermission(permission: string) {
  return function<P extends object>(Component: React.ComponentType<P>) {
    return function PermissionProtectedComponent(props: P) {
      return (
        <ProtectedRoute requiredPermission={permission}>
          <Component {...props} />
        </ProtectedRoute>
      )
    }
  }
}
