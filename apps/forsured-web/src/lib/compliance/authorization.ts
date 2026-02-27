/**
 * Compliance Authorization System
 * Extensible Authorization System with Permission Matrix
 *
 * Implements role-based access control (RBAC) for compliance requirements
 * with support for custom permissions and hierarchical roles.
 */

import { Role, Permission, AuthorizationContext, AuthErrorCode, AuthError } from '../auth/types';
import { authorizationService } from '../auth/authorizationService';

// =============================================================================
// Compliance-Specific Permissions
// =============================================================================

/**
 * Compliance Permission enum
 * Defines all possible compliance-related actions
 */
export enum CompliancePermission {
  // Requirements
  REQUIREMENT_VIEW = 'compliance:requirement:view',
  REQUIREMENT_VIEW_ALL = 'compliance:requirement:view:all',
  REQUIREMENT_CREATE = 'compliance:requirement:create',
  REQUIREMENT_EDIT = 'compliance:requirement:edit',
  REQUIREMENT_DELETE = 'compliance:requirement:delete',
  REQUIREMENT_ARCHIVE = 'compliance:requirement:archive',
  REQUIREMENT_RESTORE = 'compliance:requirement:restore',
  REQUIREMENT_APPROVE = 'compliance:requirement:approve',

  // Dependencies
  DEPENDENCY_VIEW = 'compliance:dependency:view',
  DEPENDENCY_CREATE = 'compliance:dependency:create',
  DEPENDENCY_EDIT = 'compliance:dependency:edit',
  DEPENDENCY_DELETE = 'compliance:dependency:delete',

  // Version History
  VERSION_VIEW = 'compliance:version:view',
  VERSION_RESTORE = 'compliance:version:restore',
  VERSION_COMPARE = 'compliance:version:compare',

  // Bulk Operations
  BULK_IMPORT = 'compliance:bulk:import',
  BULK_EXPORT = 'compliance:bulk:export',
  BULK_ARCHIVE = 'compliance:bulk:archive',
  BULK_STATUS_UPDATE = 'compliance:bulk:status_update',

  // Templates
  TEMPLATE_VIEW = 'compliance:template:view',
  TEMPLATE_CREATE = 'compliance:template:create',
  TEMPLATE_EDIT = 'compliance:template:edit',
  TEMPLATE_DELETE = 'compliance:template:delete',
  TEMPLATE_APPLY = 'compliance:template:apply',

  // Evaluation
  EVALUATION_VIEW = 'compliance:evaluation:view',
  EVALUATION_RUN = 'compliance:evaluation:run',
  EVALUATION_OVERRIDE = 'compliance:evaluation:override',

  // Administration
  COMPLIANCE_ADMIN = 'compliance:admin',
  COMPLIANCE_SETTINGS = 'compliance:settings',
}

// =============================================================================
// Role Permission Matrix
// =============================================================================

/**
 * Compliance role permission matrix
 * Defines which permissions each role has for compliance operations
 */
export const COMPLIANCE_ROLE_PERMISSIONS: Record<Role, CompliancePermission[]> = {
  manager: [
    // Full requirement management
    CompliancePermission.REQUIREMENT_VIEW,
    CompliancePermission.REQUIREMENT_VIEW_ALL,
    CompliancePermission.REQUIREMENT_CREATE,
    CompliancePermission.REQUIREMENT_EDIT,
    CompliancePermission.REQUIREMENT_DELETE,
    CompliancePermission.REQUIREMENT_ARCHIVE,
    CompliancePermission.REQUIREMENT_RESTORE,

    // Dependencies
    CompliancePermission.DEPENDENCY_VIEW,
    CompliancePermission.DEPENDENCY_CREATE,
    CompliancePermission.DEPENDENCY_EDIT,
    CompliancePermission.DEPENDENCY_DELETE,

    // Versions
    CompliancePermission.VERSION_VIEW,
    CompliancePermission.VERSION_RESTORE,
    CompliancePermission.VERSION_COMPARE,

    // Bulk operations (limited)
    CompliancePermission.BULK_EXPORT,

    // Templates
    CompliancePermission.TEMPLATE_VIEW,
    CompliancePermission.TEMPLATE_APPLY,

    // Evaluation
    CompliancePermission.EVALUATION_VIEW,
  ],

  subcontractor: [
    // View only
    CompliancePermission.REQUIREMENT_VIEW,
    CompliancePermission.DEPENDENCY_VIEW,
    CompliancePermission.VERSION_VIEW,
    CompliancePermission.TEMPLATE_VIEW,
    CompliancePermission.EVALUATION_VIEW,
  ],

  broker: [
    // Full requirement management
    CompliancePermission.REQUIREMENT_VIEW,
    CompliancePermission.REQUIREMENT_VIEW_ALL,
    CompliancePermission.REQUIREMENT_CREATE,
    CompliancePermission.REQUIREMENT_EDIT,
    CompliancePermission.REQUIREMENT_ARCHIVE,
    CompliancePermission.REQUIREMENT_APPROVE,

    // Dependencies
    CompliancePermission.DEPENDENCY_VIEW,
    CompliancePermission.DEPENDENCY_CREATE,
    CompliancePermission.DEPENDENCY_EDIT,

    // Versions
    CompliancePermission.VERSION_VIEW,
    CompliancePermission.VERSION_COMPARE,

    // Bulk operations
    CompliancePermission.BULK_IMPORT,
    CompliancePermission.BULK_EXPORT,
    CompliancePermission.BULK_STATUS_UPDATE,

    // Templates
    CompliancePermission.TEMPLATE_VIEW,
    CompliancePermission.TEMPLATE_CREATE,
    CompliancePermission.TEMPLATE_EDIT,
    CompliancePermission.TEMPLATE_DELETE, // Can delete own templates
    CompliancePermission.TEMPLATE_APPLY,

    // Evaluation
    CompliancePermission.EVALUATION_VIEW,
    CompliancePermission.EVALUATION_RUN,
  ],

  admin: Object.values(CompliancePermission), // Admin has all compliance permissions
};

// =============================================================================
// Resource Types
// =============================================================================

/**
 * Compliance resource types for authorization checks
 */
export type ComplianceResourceType =
  | 'requirement'
  | 'dependency'
  | 'version'
  | 'template'
  | 'evaluation';

/**
 * Compliance resource with ownership information
 */
export interface ComplianceResource {
  id: string;
  type: ComplianceResourceType;
  organization_id: string;
  created_by?: string;
  status?: string;
  is_template?: boolean;
}

// =============================================================================
// Authorization Actions
// =============================================================================

/**
 * Compliance action to permission mapping
 */
const ACTION_PERMISSION_MAP: Record<string, Record<string, CompliancePermission>> = {
  requirement: {
    view: CompliancePermission.REQUIREMENT_VIEW,
    view_all: CompliancePermission.REQUIREMENT_VIEW_ALL,
    create: CompliancePermission.REQUIREMENT_CREATE,
    edit: CompliancePermission.REQUIREMENT_EDIT,
    delete: CompliancePermission.REQUIREMENT_DELETE,
    archive: CompliancePermission.REQUIREMENT_ARCHIVE,
    restore: CompliancePermission.REQUIREMENT_RESTORE,
    approve: CompliancePermission.REQUIREMENT_APPROVE,
  },
  dependency: {
    view: CompliancePermission.DEPENDENCY_VIEW,
    create: CompliancePermission.DEPENDENCY_CREATE,
    edit: CompliancePermission.DEPENDENCY_EDIT,
    delete: CompliancePermission.DEPENDENCY_DELETE,
  },
  version: {
    view: CompliancePermission.VERSION_VIEW,
    restore: CompliancePermission.VERSION_RESTORE,
    compare: CompliancePermission.VERSION_COMPARE,
  },
  template: {
    view: CompliancePermission.TEMPLATE_VIEW,
    create: CompliancePermission.TEMPLATE_CREATE,
    edit: CompliancePermission.TEMPLATE_EDIT,
    delete: CompliancePermission.TEMPLATE_DELETE,
    apply: CompliancePermission.TEMPLATE_APPLY,
  },
  evaluation: {
    view: CompliancePermission.EVALUATION_VIEW,
    run: CompliancePermission.EVALUATION_RUN,
    override: CompliancePermission.EVALUATION_OVERRIDE,
  },
};

// =============================================================================
// Compliance Authorization Service
// =============================================================================

/**
 * Compliance Authorization Service
 * Handles all compliance-specific authorization logic
 */
export class ComplianceAuthorizationService {
  /**
   * Get compliance permissions for a role
   */
  getPermissionsForRole(role: Role): CompliancePermission[] {
    return COMPLIANCE_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user has a specific compliance permission
   */
  hasPermission(
    permission: CompliancePermission,
    context?: AuthorizationContext
  ): boolean {
    const role = context?.role ?? authorizationService.getRole();
    if (!role) return false;

    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(
    permissions: CompliancePermission[],
    context?: AuthorizationContext
  ): boolean {
    return permissions.some((p) => this.hasPermission(p, context));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(
    permissions: CompliancePermission[],
    context?: AuthorizationContext
  ): boolean {
    return permissions.every((p) => this.hasPermission(p, context));
  }

  /**
   * Check if user can perform action on resource
   */
  can(
    action: string,
    resource: ComplianceResource,
    context?: AuthorizationContext
  ): boolean {
    const role = context?.role ?? authorizationService.getRole();
    const userId = context?.user_id ?? authorizationService.getUserId();
    const organizationId = context?.organization_id ?? authorizationService.getOrganizationId();

    if (!role || !userId || !organizationId) return false;

    // Admin has full access
    if (role === 'admin') return true;

    // Check organization access
    if (resource.organization_id !== organizationId) {
      return false;
    }

    // Get required permission for action
    const permission = this.getPermissionForAction(action, resource.type);
    if (!permission) return false;

    // Check base permission
    if (!this.hasPermission(permission, context)) {
      return false;
    }

    // Apply resource-specific rules
    return this.checkResourceRules(action, resource, role, userId);
  }

  /**
   * Get permission for action and resource type
   */
  private getPermissionForAction(
    action: string,
    resourceType: ComplianceResourceType
  ): CompliancePermission | null {
    return ACTION_PERMISSION_MAP[resourceType]?.[action] ?? null;
  }

  /**
   * Check resource-specific authorization rules
   */
  private checkResourceRules(
    action: string,
    resource: ComplianceResource,
    role: Role,
    userId: string
  ): boolean {
    switch (resource.type) {
      case 'requirement':
        return this.checkRequirementRules(action, resource, role, userId);
      case 'template':
        return this.checkTemplateRules(action, resource, role, userId);
      default:
        return true; // Base permission check is sufficient
    }
  }

  /**
   * Requirement-specific authorization rules
   */
  private checkRequirementRules(
    action: string,
    resource: ComplianceResource,
    role: Role,
    userId: string
  ): boolean {
    // Subcontractors can only view
    if (role === 'subcontractor') {
      return action === 'view';
    }

    // Delete requires being the creator or admin
    if (action === 'delete') {
      return resource.created_by === userId || role === 'admin';
    }

    // Approve requires broker or admin
    if (action === 'approve') {
      return role === 'broker' || role === 'admin';
    }

    // Archive requires manager, broker, or admin
    if (action === 'archive') {
      return role === 'manager' || role === 'broker' || role === 'admin';
    }

    return true;
  }

  /**
   * Template-specific authorization rules
   */
  private checkTemplateRules(
    action: string,
    resource: ComplianceResource,
    role: Role,
    userId: string
  ): boolean {
    // Only brokers and admins can create/edit templates
    if (action === 'create' || action === 'edit') {
      return role === 'broker' || role === 'admin';
    }

    // Only creator or admin can delete templates
    if (action === 'delete') {
      return resource.created_by === userId || role === 'admin';
    }

    return true;
  }

  /**
   * Assert user has permission (throws error if not)
   */
  assertPermission(
    permission: CompliancePermission,
    context?: AuthorizationContext
  ): void {
    if (!this.hasPermission(permission, context)) {
      throw this.createAuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        `Compliance permission denied: ${permission}`
      );
    }
  }

  /**
   * Assert user can perform action (throws error if not)
   */
  assertCan(
    action: string,
    resource: ComplianceResource,
    context?: AuthorizationContext
  ): void {
    if (!this.can(action, resource, context)) {
      throw this.createAuthError(
        AuthErrorCode.INSUFFICIENT_PERMISSIONS,
        `Compliance access denied: cannot ${action} ${resource.type}`
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

  /**
   * Check bulk operation permission
   */
  canBulkImport(context?: AuthorizationContext): boolean {
    return this.hasPermission(CompliancePermission.BULK_IMPORT, context);
  }

  canBulkExport(context?: AuthorizationContext): boolean {
    return this.hasPermission(CompliancePermission.BULK_EXPORT, context);
  }

  canBulkArchive(context?: AuthorizationContext): boolean {
    return this.hasPermission(CompliancePermission.BULK_ARCHIVE, context);
  }

  canBulkStatusUpdate(context?: AuthorizationContext): boolean {
    return this.hasPermission(CompliancePermission.BULK_STATUS_UPDATE, context);
  }

  /**
   * Get all permissions for the current user
   */
  getCurrentPermissions(): CompliancePermission[] {
    const role = authorizationService.getRole();
    if (!role) return [];
    return this.getPermissionsForRole(role);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const complianceAuthorizationService = new ComplianceAuthorizationService();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a context object from existing authorization state
 */
export function createComplianceContext(): AuthorizationContext | null {
  const userId = authorizationService.getUserId();
  const role = authorizationService.getRole();
  const organizationId = authorizationService.getOrganizationId();

  if (!userId || !role || !organizationId) return null;

  return {
    user_id: userId,
    role,
    organization_id: organizationId,
    permissions: authorizationService.getPermissions(),
  };
}

/**
 * Check if user has admin access for compliance
 */
export function hasComplianceAdmin(context?: AuthorizationContext): boolean {
  return complianceAuthorizationService.hasPermission(
    CompliancePermission.COMPLIANCE_ADMIN,
    context
  );
}

/**
 * Get all compliance permissions as an array
 */
export function getAllCompliancePermissions(): CompliancePermission[] {
  return Object.values(CompliancePermission);
}

/**
 * Get permission display name
 */
export function getPermissionDisplayName(permission: CompliancePermission): string {
  const displayNames: Record<CompliancePermission, string> = {
    [CompliancePermission.REQUIREMENT_VIEW]: 'View Requirements',
    [CompliancePermission.REQUIREMENT_VIEW_ALL]: 'View All Requirements',
    [CompliancePermission.REQUIREMENT_CREATE]: 'Create Requirements',
    [CompliancePermission.REQUIREMENT_EDIT]: 'Edit Requirements',
    [CompliancePermission.REQUIREMENT_DELETE]: 'Delete Requirements',
    [CompliancePermission.REQUIREMENT_ARCHIVE]: 'Archive Requirements',
    [CompliancePermission.REQUIREMENT_RESTORE]: 'Restore Requirements',
    [CompliancePermission.REQUIREMENT_APPROVE]: 'Approve Requirements',
    [CompliancePermission.DEPENDENCY_VIEW]: 'View Dependencies',
    [CompliancePermission.DEPENDENCY_CREATE]: 'Create Dependencies',
    [CompliancePermission.DEPENDENCY_EDIT]: 'Edit Dependencies',
    [CompliancePermission.DEPENDENCY_DELETE]: 'Delete Dependencies',
    [CompliancePermission.VERSION_VIEW]: 'View Version History',
    [CompliancePermission.VERSION_RESTORE]: 'Restore Versions',
    [CompliancePermission.VERSION_COMPARE]: 'Compare Versions',
    [CompliancePermission.BULK_IMPORT]: 'Bulk Import',
    [CompliancePermission.BULK_EXPORT]: 'Bulk Export',
    [CompliancePermission.BULK_ARCHIVE]: 'Bulk Archive',
    [CompliancePermission.BULK_STATUS_UPDATE]: 'Bulk Status Update',
    [CompliancePermission.TEMPLATE_VIEW]: 'View Templates',
    [CompliancePermission.TEMPLATE_CREATE]: 'Create Templates',
    [CompliancePermission.TEMPLATE_EDIT]: 'Edit Templates',
    [CompliancePermission.TEMPLATE_DELETE]: 'Delete Templates',
    [CompliancePermission.TEMPLATE_APPLY]: 'Apply Templates',
    [CompliancePermission.EVALUATION_VIEW]: 'View Evaluations',
    [CompliancePermission.EVALUATION_RUN]: 'Run Evaluations',
    [CompliancePermission.EVALUATION_OVERRIDE]: 'Override Evaluations',
    [CompliancePermission.COMPLIANCE_ADMIN]: 'Compliance Administration',
    [CompliancePermission.COMPLIANCE_SETTINGS]: 'Compliance Settings',
  };

  return displayNames[permission] ?? permission;
}
