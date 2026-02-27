/**
 * useCompliancePermissions Hook
 * Compliance-specific authorization hook
 *
 * Provides permission checking for compliance operations in React components
 */

import { useCallback, useMemo } from 'react';
import { Role } from '../lib/auth/types';
import { authorizationService } from '../lib/auth/authorizationService';
import {
  CompliancePermission,
  ComplianceResource,
  complianceAuthorizationService,
  createComplianceContext,
  getPermissionDisplayName,
} from '../lib/compliance/authorization';

// =============================================================================
// Types
// =============================================================================

/**
 * Compliance Permission Hook Result
 */
export interface UseCompliancePermissionsResult {
  // Permission checks
  hasPermission: (permission: CompliancePermission) => boolean;
  hasAnyPermission: (permissions: CompliancePermission[]) => boolean;
  hasAllPermissions: (permissions: CompliancePermission[]) => boolean;

  // Resource access checks
  can: (action: string, resource: ComplianceResource) => boolean;
  canViewRequirement: (resource: ComplianceResource) => boolean;
  canEditRequirement: (resource: ComplianceResource) => boolean;
  canDeleteRequirement: (resource: ComplianceResource) => boolean;
  canCreateRequirement: () => boolean;
  canApproveRequirement: () => boolean;
  canArchiveRequirement: () => boolean;

  // Dependency checks
  canViewDependencies: () => boolean;
  canEditDependencies: () => boolean;

  // Version checks
  canViewVersionHistory: () => boolean;
  canRestoreVersion: () => boolean;

  // Bulk operation checks
  canBulkImport: () => boolean;
  canBulkExport: () => boolean;
  canBulkArchive: () => boolean;
  canBulkStatusUpdate: () => boolean;

  // Template checks
  canViewTemplates: () => boolean;
  canCreateTemplates: () => boolean;
  canEditTemplates: () => boolean;
  canApplyTemplates: () => boolean;

  // Evaluation checks
  canViewEvaluations: () => boolean;
  canRunEvaluations: () => boolean;

  // Admin checks
  isComplianceAdmin: () => boolean;
  canAccessSettings: () => boolean;

  // Role checks
  currentRole: Role | null;
  currentUserId: string | null;
  currentOrgId: string | null;

  // All permissions
  permissions: CompliancePermission[];
  getPermissionDisplayName: (permission: CompliancePermission) => string;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useCompliancePermissions Hook
 * Provides comprehensive compliance permission checking capabilities
 */
export function useCompliancePermissions(): UseCompliancePermissionsResult {
  const context = useMemo(() => createComplianceContext(), []);

  // =============================================================================
  // Permission Checks
  // =============================================================================

  const hasPermission = useCallback(
    (permission: CompliancePermission): boolean => {
      return complianceAuthorizationService.hasPermission(permission, context ?? undefined);
    },
    [context]
  );

  const hasAnyPermission = useCallback(
    (permissions: CompliancePermission[]): boolean => {
      return complianceAuthorizationService.hasAnyPermission(
        permissions,
        context ?? undefined
      );
    },
    [context]
  );

  const hasAllPermissions = useCallback(
    (permissions: CompliancePermission[]): boolean => {
      return complianceAuthorizationService.hasAllPermissions(
        permissions,
        context ?? undefined
      );
    },
    [context]
  );

  // =============================================================================
  // Resource Access Checks
  // =============================================================================

  const can = useCallback(
    (action: string, resource: ComplianceResource): boolean => {
      return complianceAuthorizationService.can(action, resource, context ?? undefined);
    },
    [context]
  );

  const canViewRequirement = useCallback(
    (resource: ComplianceResource): boolean => {
      return can('view', { ...resource, type: 'requirement' });
    },
    [can]
  );

  const canEditRequirement = useCallback(
    (resource: ComplianceResource): boolean => {
      return can('edit', { ...resource, type: 'requirement' });
    },
    [can]
  );

  const canDeleteRequirement = useCallback(
    (resource: ComplianceResource): boolean => {
      return can('delete', { ...resource, type: 'requirement' });
    },
    [can]
  );

  const canCreateRequirement = useCallback((): boolean => {
    return hasPermission(CompliancePermission.REQUIREMENT_CREATE);
  }, [hasPermission]);

  const canApproveRequirement = useCallback((): boolean => {
    return hasPermission(CompliancePermission.REQUIREMENT_APPROVE);
  }, [hasPermission]);

  const canArchiveRequirement = useCallback((): boolean => {
    return hasPermission(CompliancePermission.REQUIREMENT_ARCHIVE);
  }, [hasPermission]);

  // =============================================================================
  // Dependency Checks
  // =============================================================================

  const canViewDependencies = useCallback((): boolean => {
    return hasPermission(CompliancePermission.DEPENDENCY_VIEW);
  }, [hasPermission]);

  const canEditDependencies = useCallback((): boolean => {
    return hasAnyPermission([
      CompliancePermission.DEPENDENCY_CREATE,
      CompliancePermission.DEPENDENCY_EDIT,
      CompliancePermission.DEPENDENCY_DELETE,
    ]);
  }, [hasAnyPermission]);

  // =============================================================================
  // Version Checks
  // =============================================================================

  const canViewVersionHistory = useCallback((): boolean => {
    return hasPermission(CompliancePermission.VERSION_VIEW);
  }, [hasPermission]);

  const canRestoreVersion = useCallback((): boolean => {
    return hasPermission(CompliancePermission.VERSION_RESTORE);
  }, [hasPermission]);

  // =============================================================================
  // Bulk Operation Checks
  // =============================================================================

  const canBulkImport = useCallback((): boolean => {
    return complianceAuthorizationService.canBulkImport(context ?? undefined);
  }, [context]);

  const canBulkExport = useCallback((): boolean => {
    return complianceAuthorizationService.canBulkExport(context ?? undefined);
  }, [context]);

  const canBulkArchive = useCallback((): boolean => {
    return complianceAuthorizationService.canBulkArchive(context ?? undefined);
  }, [context]);

  const canBulkStatusUpdate = useCallback((): boolean => {
    return complianceAuthorizationService.canBulkStatusUpdate(context ?? undefined);
  }, [context]);

  // =============================================================================
  // Template Checks
  // =============================================================================

  const canViewTemplates = useCallback((): boolean => {
    return hasPermission(CompliancePermission.TEMPLATE_VIEW);
  }, [hasPermission]);

  const canCreateTemplates = useCallback((): boolean => {
    return hasPermission(CompliancePermission.TEMPLATE_CREATE);
  }, [hasPermission]);

  const canEditTemplates = useCallback((): boolean => {
    return hasPermission(CompliancePermission.TEMPLATE_EDIT);
  }, [hasPermission]);

  const canApplyTemplates = useCallback((): boolean => {
    return hasPermission(CompliancePermission.TEMPLATE_APPLY);
  }, [hasPermission]);

  // =============================================================================
  // Evaluation Checks
  // =============================================================================

  const canViewEvaluations = useCallback((): boolean => {
    return hasPermission(CompliancePermission.EVALUATION_VIEW);
  }, [hasPermission]);

  const canRunEvaluations = useCallback((): boolean => {
    return hasPermission(CompliancePermission.EVALUATION_RUN);
  }, [hasPermission]);

  // =============================================================================
  // Admin Checks
  // =============================================================================

  const isComplianceAdmin = useCallback((): boolean => {
    return hasPermission(CompliancePermission.COMPLIANCE_ADMIN);
  }, [hasPermission]);

  const canAccessSettings = useCallback((): boolean => {
    return hasPermission(CompliancePermission.COMPLIANCE_SETTINGS);
  }, [hasPermission]);

  // =============================================================================
  // Current Context
  // =============================================================================

  const permissions = useMemo(
    () => complianceAuthorizationService.getCurrentPermissions(),
    []
  );

  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Resource access checks
    can,
    canViewRequirement,
    canEditRequirement,
    canDeleteRequirement,
    canCreateRequirement,
    canApproveRequirement,
    canArchiveRequirement,

    // Dependency checks
    canViewDependencies,
    canEditDependencies,

    // Version checks
    canViewVersionHistory,
    canRestoreVersion,

    // Bulk operation checks
    canBulkImport,
    canBulkExport,
    canBulkArchive,
    canBulkStatusUpdate,

    // Template checks
    canViewTemplates,
    canCreateTemplates,
    canEditTemplates,
    canApplyTemplates,

    // Evaluation checks
    canViewEvaluations,
    canRunEvaluations,

    // Admin checks
    isComplianceAdmin,
    canAccessSettings,

    // Role checks
    currentRole: authorizationService.getRole(),
    currentUserId: authorizationService.getUserId(),
    currentOrgId: authorizationService.getOrganizationId(),

    // All permissions
    permissions,
    getPermissionDisplayName,
  };
}

export default useCompliancePermissions;
