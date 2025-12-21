/**
 * Compliance Routers Index
 * REQ-2, TASK-19: Integrate Authorization Checks into tRPC Routers
 *
 * Exports all compliance-related tRPC routers.
 */

export { complianceRequirementsRouter } from './compliance-requirements.router.ts';
export { complianceDependenciesRouter } from './compliance-dependencies.router.ts';
export {
  enforceCompliancePermission,
  hasCompliancePermission,
  getUserPermissions,
  isPlatformAdmin,
  getUserComplianceRoles,
  getOrgIdFromInput,
  invalidateComplianceAuthCache,
  invalidateUserCache,
  type ComplianceDbPermission,
  type ComplianceSystemRole,
  ALL_COMPLIANCE_PERMISSIONS,
} from './compliance-auth.ts';
