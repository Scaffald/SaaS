// src/hooks/useAuthorization.ts
// REQ-126: OAuth 2.0 + RBAC Authentication System
//
// Hook for checking user permissions in components

import { useAuth } from '../contexts/AuthContext';
import { Permission, ROLE_PERMISSIONS, UserType } from '../types';

/**
 * Hook for authorization checks in React components
 *
 * @example
 * ```tsx
 * function ProjectActions({ project }) {
 *   const { can, hasRole } = useAuthorization();
 *
 *   return (
 *     <div>
 *       {can(Permission.PROJECT_EDIT) && <EditButton />}
 *       {hasRole('manager') && <ManagerTools />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthorization() {
  const { profile, isAuthenticated } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!isAuthenticated || !profile?.user_type) {
      return false;
    }

    const rolePermissions = ROLE_PERMISSIONS[profile.user_type];
    return rolePermissions?.includes(permission) ?? false;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(permission => can(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(permission => can(permission));
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserType): boolean => {
    return isAuthenticated && profile?.user_type === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserType[]): boolean => {
    return isAuthenticated && !!profile?.user_type && roles.includes(profile.user_type);
  };

  /**
   * Get current user's role
   */
  const role = profile?.user_type ?? null;

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    role,
    isAuthenticated,
  };
}

export default useAuthorization;
