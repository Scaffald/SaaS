/**
 * usePermissions Hook
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Provides permission checking functionality in components
 */

import { useCallback } from 'react';
import { Permission, OwnedResource, Role } from '../lib/auth/types';
import { authorizationService } from '../lib/auth/authorizationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Permission Hook Result
 */
interface UsePermissionsResult {
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Resource access checks
  can: (action: string, resource: OwnedResource) => boolean;
  canView: (resource: OwnedResource) => boolean;
  canEdit: (resource: OwnedResource) => boolean;
  canDelete: (resource: OwnedResource) => boolean;
  canCreate: (resourceType: string) => boolean;

  // Role checks
  isRole: (role: Role) => boolean;
  isManager: () => boolean;
  isSubcontractor: () => boolean;
  isBroker: () => boolean;
  isAdmin: () => boolean;

  // Current context
  currentRole: Role | null;
  currentUserId: string | null;
  permissions: Permission[];
}

/**
 * usePermissions Hook
 * Provides comprehensive permission checking capabilities
 */
export function usePermissions(): UsePermissionsResult {
  const { state } = useAuth();

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: Permission): boolean => {
    return authorizationService.hasPermission(permission);
  }, []);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return authorizationService.hasAnyPermission(permissions);
  }, []);

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return authorizationService.hasAllPermissions(permissions);
  }, []);

  /**
   * Check if user can perform action on resource
   */
  const can = useCallback((action: string, resource: OwnedResource): boolean => {
    return authorizationService.can(action, resource);
  }, []);

  /**
   * Convenience: Check if user can view resource
   */
  const canView = useCallback((resource: OwnedResource): boolean => {
    return authorizationService.can('view', resource);
  }, []);

  /**
   * Convenience: Check if user can edit resource
   */
  const canEdit = useCallback((resource: OwnedResource): boolean => {
    return authorizationService.can('edit', resource);
  }, []);

  /**
   * Convenience: Check if user can delete resource
   */
  const canDelete = useCallback((resource: OwnedResource): boolean => {
    return authorizationService.can('delete', resource);
  }, []);

  /**
   * Check if user can create resource of type
   */
  const canCreate = useCallback((resourceType: string): boolean => {
    const createPermission = `${resourceType.toUpperCase()}_CREATE` as Permission;
    return hasPermission(createPermission);
  }, [hasPermission]);

  /**
   * Check if user has specific role
   */
  const isRole = useCallback((role: Role): boolean => {
    return authorizationService.getRole() === role;
  }, []);

  /**
   * Convenience: Check if user is manager
   */
  const isManager = useCallback((): boolean => {
    return isRole('manager');
  }, [isRole]);

  /**
   * Convenience: Check if user is subcontractor
   */
  const isSubcontractor = useCallback((): boolean => {
    return isRole('subcontractor');
  }, [isRole]);

  /**
   * Convenience: Check if user is broker
   */
  const isBroker = useCallback((): boolean => {
    return isRole('broker');
  }, [isRole]);

  /**
   * Convenience: Check if user is admin
   */
  const isAdmin = useCallback((): boolean => {
    return isRole('admin');
  }, [isRole]);

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Resource access checks
    can,
    canView,
    canEdit,
    canDelete,
    canCreate,

    // Role checks
    isRole,
    isManager,
    isSubcontractor,
    isBroker,
    isAdmin,

    // Current context
    currentRole: authorizationService.getRole(),
    currentUserId: authorizationService.getUserId(),
    permissions: authorizationService.getPermissions(),
  };
}

/**
 * useAuthorization Hook (alias for usePermissions)
 * For backward compatibility with existing code
 */
export function useAuthorization(): UsePermissionsResult {
  return usePermissions();
}
