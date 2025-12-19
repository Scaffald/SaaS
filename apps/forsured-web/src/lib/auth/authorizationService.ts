/**
 * Authorization Service
 * REQ-126: OAuth 2.0 + RBAC Authentication System
 *
 * Implements Role-Based Access Control (RBAC)
 * Enforces permissions at both role and resource levels
 */

import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  OwnedResource,
  AuthorizationContext,
  AuthError,
  AuthErrorCode,
} from './types';

/**
 * Authorization Service Class
 * Handles all permission and access control checks
 */
export class AuthorizationService {
  private context: AuthorizationContext | null = null;

  /**
   * Initialize authorization service with user context
   */
  initialize(userId: string, role: Role, organizationId: string): void {
    this.context = {
      user_id: userId,
      role,
      organization_id: organizationId,
      permissions: ROLE_PERMISSIONS[role] || [],
    };
  }

  /**
   * Clear authorization context (on logout)
   */
  clear(): void {
    this.context = null;
  }

  /**
   * Check if user has a specific permission
   *
   * @param permission - Permission to check
   * @returns True if user has permission, false otherwise
   */
  hasPermission(permission: Permission): boolean {
    if (!this.context) {
      return false;
    }

    return this.context.permissions.includes(permission);
  }

  /**
   * Check if user has ANY of the specified permissions
   *
   * @param permissions - Array of permissions to check
   * @returns True if user has at least one permission, false otherwise
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    if (!this.context) {
      return false;
    }

    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param permissions - Array of permissions to check
   * @returns True if user has all permissions, false otherwise
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    if (!this.context) {
      return false;
    }

    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user can perform action on resource
   * Combines permission check with resource-level authorization
   *
   * @param action - Action to perform (e.g., 'edit', 'delete', 'view')
   * @param resource - Resource to check access for
   * @returns True if user can perform action, false otherwise
   */
  can(action: string, resource: OwnedResource): boolean {
    if (!this.context) {
      return false;
    }

    // Admin has access to everything
    if (this.context.role === 'admin') {
      return true;
    }

    // Get required permission for this action
    const permission = this.getPermissionForAction(action, resource.type);
    if (!this.hasPermission(permission)) {
      return false;
    }

    // Check resource-level access
    return this.checkResourceAccess(action, resource);
  }

  /**
   * Resource-level authorization checks
   * Ensures user can only access resources they own or are assigned to
   */
  private checkResourceAccess(action: string, resource: OwnedResource): boolean {
    if (!this.context) {
      return false;
    }

    const { user_id, role, organization_id } = this.context;

    switch (resource.type) {
      case 'project':
        return this.canAccessProject(action, resource, user_id, role, organization_id);

      case 'task':
        return this.canAccessTask(action, resource, user_id, role);

      case 'document':
        return this.canAccessDocument(action, resource, user_id, role);

      case 'policy':
        return this.canAccessPolicy(action, resource, user_id, role);

      case 'user':
        return this.canAccessUser(action, resource, user_id, role, organization_id);

      default:
        return false;
    }
  }

  /**
   * Project access control
   */
  private canAccessProject(
    action: string,
    resource: OwnedResource,
    userId: string,
    role: Role,
    organizationId: string
  ): boolean {
    switch (action) {
      case 'view':
        // Managers can view their own projects
        if (role === 'manager' && resource.manager_id === userId) {
          return true;
        }
        // Brokers can view client projects
        if (role === 'broker' && resource.broker_id === userId) {
          return true;
        }
        // Subcontractors can view assigned projects (checked elsewhere)
        if (role === 'subcontractor') {
          return true; // RLS will enforce
        }
        return false;

      case 'edit':
      case 'delete':
        // Only managers can edit/delete their own projects
        return role === 'manager' && resource.manager_id === userId;

      default:
        return false;
    }
  }

  /**
   * Task access control
   */
  private canAccessTask(
    action: string,
    resource: OwnedResource,
    userId: string,
    role: Role
  ): boolean {
    switch (action) {
      case 'view':
        // Users can view tasks assigned to them
        if (resource.assigned_to === userId) {
          return true;
        }
        // Managers can view tasks they created
        if (role === 'manager' && resource.created_by === userId) {
          return true;
        }
        return false;

      case 'complete':
        // Only assigned user or manager can complete tasks
        return resource.assigned_to === userId || role === 'manager';

      case 'edit':
      case 'delete':
        // Only managers and brokers can edit/delete tasks
        return role === 'manager' || role === 'broker';

      default:
        return false;
    }
  }

  /**
   * Document access control
   */
  private canAccessDocument(
    action: string,
    resource: OwnedResource,
    userId: string,
    role: Role
  ): boolean {
    switch (action) {
      case 'view':
      case 'download':
        // Users can view documents they uploaded
        if (resource.uploaded_by === userId) {
          return true;
        }
        // Managers and brokers can view all project documents (RLS enforced)
        if (role === 'manager' || role === 'broker') {
          return true;
        }
        return false;

      case 'delete':
        // Users can only delete their own uploads
        return resource.uploaded_by === userId;

      default:
        return false;
    }
  }

  /**
   * Policy access control
   */
  private canAccessPolicy(
    action: string,
    resource: OwnedResource,
    userId: string,
    role: Role
  ): boolean {
    switch (action) {
      case 'view':
        // Everyone can view policies they're related to (RLS enforced)
        return true;

      case 'edit':
      case 'approve':
        // Only brokers can edit/approve policies
        return role === 'broker';

      default:
        return false;
    }
  }

  /**
   * User access control
   */
  private canAccessUser(
    action: string,
    resource: OwnedResource,
    userId: string,
    role: Role,
    organizationId: string
  ): boolean {
    switch (action) {
      case 'view':
        // Users can view themselves
        if (resource.id === userId) {
          return true;
        }
        // Managers can view users in their organization
        if (role === 'manager' && resource.organization_id === organizationId) {
          return true;
        }
        // Brokers can view their clients
        if (role === 'broker') {
          return true; // RLS enforced
        }
        return false;

      case 'edit':
      case 'delete':
        // Only admins can edit/delete users
        return false; // Admin check already done

      default:
        return false;
    }
  }

  /**
   * Map action and resource type to Permission enum
   */
  private getPermissionForAction(action: string, resourceType: string): Permission {
    const permissionKey = `${resourceType.toUpperCase()}_${action.toUpperCase()}`;
    return Permission[permissionKey as keyof typeof Permission] || Permission.PROJECT_VIEW_ASSIGNED;
  }

  /**
   * Get current user role
   */
  getRole(): Role | null {
    return this.context?.role || null;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.context?.user_id || null;
  }

  /**
   * Get current organization ID
   */
  getOrganizationId(): string | null {
    return this.context?.organization_id || null;
  }

  /**
   * Get all permissions for current user
   */
  getPermissions(): Permission[] {
    return this.context?.permissions || [];
  }

  /**
   * Assert user has permission (throws error if not)
   */
  assertPermission(permission: Permission): void {
    if (!this.hasPermission(permission)) {
      throw this.createAuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        `Permission denied: ${permission}`
      );
    }
  }

  /**
   * Assert user can perform action (throws error if not)
   */
  assertCan(action: string, resource: OwnedResource): void {
    if (!this.can(action, resource)) {
      throw this.createAuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        `Access denied: cannot ${action} ${resource.type}`
      );
    }
  }

  /**
   * Create standardized AuthError
   */
  private createAuthError(code: AuthErrorCode, message: string): AuthError {
    return {
      code,
      message,
    };
  }
}

/**
 * Singleton instance
 */
export const authorizationService = new AuthorizationService();
