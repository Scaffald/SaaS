/**
 * Server-Side Compliance Authorization Helper
 * REQ-2, TASK-19: Integrate Authorization Checks into tRPC Routers
 *
 * Provides server-side authorization for compliance operations in tRPC routers.
 * Uses the compliance permission matrix from the client-side authorization system.
 */

import { TRPCError } from '@trpc/server';
import { forsured } from '../../../lib/supabase';
import type { Role, AuthorizationContext } from '../../../lib/auth/types';
import {
  CompliancePermission,
  COMPLIANCE_ROLE_PERMISSIONS,
  type ComplianceResource,
  type ComplianceResourceType,
} from '../../../lib/compliance/authorization';

// =============================================================================
// Types
// =============================================================================

/**
 * Server-side authorization context from tRPC
 */
export interface ServerAuthContext {
  userId: string;
  organizationId: string;
  role?: Role;
}

/**
 * Cached role information
 */
interface CachedRole {
  role: Role;
  timestamp: number;
}

// =============================================================================
// Role Cache (simple in-memory cache for role lookups)
// =============================================================================

// Cache duration: 5 minutes
const ROLE_CACHE_DURATION = 5 * 60 * 1000;
const roleCache = new Map<string, CachedRole>();

/**
 * Get cache key for user + organization
 */
function getCacheKey(userId: string, organizationId: string): string {
  return `${userId}:${organizationId}`;
}

/**
 * Clear cached role for a user
 */
export function clearRoleCache(userId: string, organizationId: string): void {
  roleCache.delete(getCacheKey(userId, organizationId));
}

// =============================================================================
// Role Fetching
// =============================================================================

/**
 * Fetch user's role for an organization from the database
 * Uses caching to reduce database queries
 */
async function fetchUserRole(
  userId: string,
  organizationId: string
): Promise<Role | null> {
  const cacheKey = getCacheKey(userId, organizationId);
  const cached = roleCache.get(cacheKey);

  // Return cached role if valid
  if (cached && Date.now() - cached.timestamp < ROLE_CACHE_DURATION) {
    return cached.role;
  }

  // Query role_assignments from forsured schema with a join to roles
  const { data, error } = await forsured('role_assignments')
    .select(`
      id,
      roles:role_id (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Find the highest privilege role
  const roleNames = data
    .map((assignment) => {
      const role = assignment.roles as { name: string } | null;
      return role?.name;
    })
    .filter(Boolean) as string[];

  // Map database role names to Role type
  // Priority: admin > broker > manager > subcontractor
  let userRole: Role | null = null;

  if (roleNames.some((r) => ['admin', 'super_admin', 'platform_admin'].includes(r))) {
    userRole = 'admin';
  } else if (roleNames.some((r) => r === 'broker')) {
    userRole = 'broker';
  } else if (roleNames.some((r) => r === 'manager')) {
    userRole = 'manager';
  } else if (roleNames.some((r) => r === 'subcontractor')) {
    userRole = 'subcontractor';
  }

  // Cache the result
  if (userRole) {
    roleCache.set(cacheKey, {
      role: userRole,
      timestamp: Date.now(),
    });
  }

  return userRole;
}

// =============================================================================
// Permission Checking Functions
// =============================================================================

/**
 * Get compliance permissions for a role
 */
export function getPermissionsForRole(role: Role): CompliancePermission[] {
  return COMPLIANCE_ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific compliance permission
 */
export function roleHasPermission(
  role: Role,
  permission: CompliancePermission
): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function roleHasAnyPermission(
  role: Role,
  permissions: CompliancePermission[]
): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function roleHasAllPermissions(
  role: Role,
  permissions: CompliancePermission[]
): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}

// =============================================================================
// Resource-Based Authorization
// =============================================================================

/**
 * Action to permission mapping for compliance resources
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

/**
 * Get the permission required for an action on a resource type
 */
function getPermissionForAction(
  action: string,
  resourceType: ComplianceResourceType
): CompliancePermission | null {
  return ACTION_PERMISSION_MAP[resourceType]?.[action] ?? null;
}

/**
 * Check resource-specific authorization rules
 */
function checkResourceRules(
  action: string,
  resource: ComplianceResource,
  role: Role,
  userId: string
): boolean {
  switch (resource.type) {
    case 'requirement':
      return checkRequirementRules(action, resource, role, userId);
    case 'template':
      return checkTemplateRules(action, resource, role, userId);
    default:
      return true; // Base permission check is sufficient
  }
}

/**
 * Requirement-specific authorization rules
 */
function checkRequirementRules(
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
function checkTemplateRules(
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
 * Check if user can perform action on resource
 */
export function canPerformAction(
  action: string,
  resource: ComplianceResource,
  role: Role,
  userId: string,
  organizationId: string
): boolean {
  // Admin has full access
  if (role === 'admin') return true;

  // Check organization access
  if (resource.organization_id !== organizationId) {
    return false;
  }

  // Get required permission for action
  const permission = getPermissionForAction(action, resource.type);
  if (!permission) return false;

  // Check base permission
  if (!roleHasPermission(role, permission)) {
    return false;
  }

  // Apply resource-specific rules
  return checkResourceRules(action, resource, role, userId);
}

// =============================================================================
// Server-Side Authorization Service
// =============================================================================

/**
 * Server-side Compliance Authorization Service
 * Provides authorization checks for tRPC routers
 */
export class ServerComplianceAuthorizationService {
  private userId: string;
  private organizationId: string;
  private role: Role | null = null;
  private roleLoaded = false;

  constructor(userId: string, organizationId: string) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  /**
   * Load user's role from database
   */
  async loadRole(): Promise<Role | null> {
    if (this.roleLoaded) {
      return this.role;
    }

    this.role = await fetchUserRole(this.userId, this.organizationId);
    this.roleLoaded = true;
    return this.role;
  }

  /**
   * Get the user's role (must call loadRole first)
   */
  getRole(): Role | null {
    return this.role;
  }

  /**
   * Check if user has a specific compliance permission
   */
  async hasPermission(permission: CompliancePermission): Promise<boolean> {
    const role = await this.loadRole();
    if (!role) return false;
    return roleHasPermission(role, permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(permissions: CompliancePermission[]): Promise<boolean> {
    const role = await this.loadRole();
    if (!role) return false;
    return roleHasAnyPermission(role, permissions);
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(permissions: CompliancePermission[]): Promise<boolean> {
    const role = await this.loadRole();
    if (!role) return false;
    return roleHasAllPermissions(role, permissions);
  }

  /**
   * Check if user can perform action on resource
   */
  async can(action: string, resource: ComplianceResource): Promise<boolean> {
    const role = await this.loadRole();
    if (!role) return false;
    return canPerformAction(action, resource, role, this.userId, this.organizationId);
  }

  /**
   * Assert user has permission (throws TRPCError if not)
   */
  async assertPermission(permission: CompliancePermission): Promise<void> {
    const hasAccess = await this.hasPermission(permission);
    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Compliance permission denied: ${permission}`,
      });
    }
  }

  /**
   * Assert user can perform action (throws TRPCError if not)
   */
  async assertCan(action: string, resource: ComplianceResource): Promise<void> {
    const hasAccess = await this.can(action, resource);
    if (!hasAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Compliance access denied: cannot ${action} ${resource.type}`,
      });
    }
  }

  /**
   * Check bulk operation permissions
   */
  async canBulkImport(): Promise<boolean> {
    return this.hasPermission(CompliancePermission.BULK_IMPORT);
  }

  async canBulkExport(): Promise<boolean> {
    return this.hasPermission(CompliancePermission.BULK_EXPORT);
  }

  async canBulkArchive(): Promise<boolean> {
    return this.hasPermission(CompliancePermission.BULK_ARCHIVE);
  }

  async canBulkStatusUpdate(): Promise<boolean> {
    return this.hasPermission(CompliancePermission.BULK_STATUS_UPDATE);
  }
}

// =============================================================================
// Helper Functions for Routers
// =============================================================================

/**
 * Create a server-side authorization service from tRPC context
 */
export function createComplianceAuthService(
  userId: string | undefined,
  organizationId: string | undefined
): ServerComplianceAuthorizationService {
  if (!userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  if (!organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization context required',
    });
  }

  return new ServerComplianceAuthorizationService(userId, organizationId);
}

/**
 * Quick permission check for common operations
 * Returns the authorization service after verifying permission
 */
export async function requirePermission(
  userId: string | undefined,
  organizationId: string | undefined,
  permission: CompliancePermission
): Promise<ServerComplianceAuthorizationService> {
  const authService = createComplianceAuthService(userId, organizationId);
  await authService.assertPermission(permission);
  return authService;
}

/**
 * Quick resource action check
 * Returns the authorization service after verifying access
 */
export async function requireResourceAccess(
  userId: string | undefined,
  organizationId: string | undefined,
  action: string,
  resource: ComplianceResource
): Promise<ServerComplianceAuthorizationService> {
  const authService = createComplianceAuthService(userId, organizationId);
  await authService.assertCan(action, resource);
  return authService;
}
