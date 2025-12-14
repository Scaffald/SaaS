/**
 * Compliance Authorization Tests
 * REQ-2, TASK-18: Tests for extensible authorization system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CompliancePermission,
  ComplianceResource,
  ComplianceAuthorizationService,
  complianceAuthorizationService,
  COMPLIANCE_ROLE_PERMISSIONS,
  createComplianceContext,
  hasComplianceAdmin,
  getAllCompliancePermissions,
  getPermissionDisplayName,
} from '../authorization';
import { authorizationService } from '../../auth/authorizationService';
import { AuthErrorCode } from '../../auth/types';

// Mock the authorizationService
vi.mock('../../auth/authorizationService', () => ({
  authorizationService: {
    getRole: vi.fn(),
    getUserId: vi.fn(),
    getOrganizationId: vi.fn(),
    getPermissions: vi.fn(),
  },
}));

describe('ComplianceAuthorizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('COMPLIANCE_ROLE_PERMISSIONS', () => {
    it('defines permissions for all roles', () => {
      expect(COMPLIANCE_ROLE_PERMISSIONS.admin).toBeDefined();
      expect(COMPLIANCE_ROLE_PERMISSIONS.manager).toBeDefined();
      expect(COMPLIANCE_ROLE_PERMISSIONS.broker).toBeDefined();
      expect(COMPLIANCE_ROLE_PERMISSIONS.subcontractor).toBeDefined();
    });

    it('gives admin all permissions', () => {
      const allPermissions = Object.values(CompliancePermission);
      expect(COMPLIANCE_ROLE_PERMISSIONS.admin).toEqual(allPermissions);
    });

    it('gives managers requirement management permissions', () => {
      const managerPerms = COMPLIANCE_ROLE_PERMISSIONS.manager;
      expect(managerPerms).toContain(CompliancePermission.REQUIREMENT_VIEW);
      expect(managerPerms).toContain(CompliancePermission.REQUIREMENT_CREATE);
      expect(managerPerms).toContain(CompliancePermission.REQUIREMENT_EDIT);
      expect(managerPerms).toContain(CompliancePermission.REQUIREMENT_DELETE);
    });

    it('gives brokers approval permissions', () => {
      const brokerPerms = COMPLIANCE_ROLE_PERMISSIONS.broker;
      expect(brokerPerms).toContain(CompliancePermission.REQUIREMENT_APPROVE);
      expect(brokerPerms).toContain(CompliancePermission.BULK_IMPORT);
    });

    it('gives subcontractors view-only permissions', () => {
      const subcontractorPerms = COMPLIANCE_ROLE_PERMISSIONS.subcontractor;
      expect(subcontractorPerms).toContain(CompliancePermission.REQUIREMENT_VIEW);
      expect(subcontractorPerms).not.toContain(CompliancePermission.REQUIREMENT_CREATE);
      expect(subcontractorPerms).not.toContain(CompliancePermission.REQUIREMENT_EDIT);
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns correct permissions for admin', () => {
      const service = new ComplianceAuthorizationService();
      const permissions = service.getPermissionsForRole('admin');
      expect(permissions).toEqual(Object.values(CompliancePermission));
    });

    it('returns correct permissions for manager', () => {
      const service = new ComplianceAuthorizationService();
      const permissions = service.getPermissionsForRole('manager');
      expect(permissions).toEqual(COMPLIANCE_ROLE_PERMISSIONS.manager);
    });

    it('returns empty array for unknown role', () => {
      const service = new ComplianceAuthorizationService();
      // @ts-expect-error - testing invalid role
      const permissions = service.getPermissionsForRole('unknown');
      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('returns true when user has permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      const result = complianceAuthorizationService.hasPermission(
        CompliancePermission.REQUIREMENT_CREATE
      );

      expect(result).toBe(true);
    });

    it('returns false when user does not have permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      const result = complianceAuthorizationService.hasPermission(
        CompliancePermission.REQUIREMENT_CREATE
      );

      expect(result).toBe(false);
    });

    it('returns false when no role is set', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue(null);

      const result = complianceAuthorizationService.hasPermission(
        CompliancePermission.REQUIREMENT_VIEW
      );

      expect(result).toBe(false);
    });

    it('uses provided context when available', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      const result = complianceAuthorizationService.hasPermission(
        CompliancePermission.REQUIREMENT_CREATE,
        {
          user_id: 'user-1',
          role: 'admin',
          organization_id: 'org-1',
          permissions: [],
        }
      );

      expect(result).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');

      const result = complianceAuthorizationService.hasAnyPermission([
        CompliancePermission.BULK_IMPORT, // managers don't have this
        CompliancePermission.REQUIREMENT_VIEW, // managers have this
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      const result = complianceAuthorizationService.hasAnyPermission([
        CompliancePermission.BULK_IMPORT,
        CompliancePermission.REQUIREMENT_CREATE,
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      const result = complianceAuthorizationService.hasAllPermissions([
        CompliancePermission.REQUIREMENT_VIEW,
        CompliancePermission.REQUIREMENT_CREATE,
        CompliancePermission.BULK_IMPORT,
      ]);

      expect(result).toBe(true);
    });

    it('returns false when user is missing any permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');

      const result = complianceAuthorizationService.hasAllPermissions([
        CompliancePermission.REQUIREMENT_VIEW, // managers have this
        CompliancePermission.BULK_IMPORT, // managers don't have this
      ]);

      expect(result).toBe(false);
    });
  });

  describe('can', () => {
    const mockResource: ComplianceResource = {
      id: 'req-1',
      type: 'requirement',
      organization_id: 'org-1',
      created_by: 'user-1',
    };

    beforeEach(() => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-1');
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');
    });

    it('allows admin to do anything', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      expect(complianceAuthorizationService.can('view', mockResource)).toBe(true);
      expect(complianceAuthorizationService.can('edit', mockResource)).toBe(true);
      expect(complianceAuthorizationService.can('delete', mockResource)).toBe(true);
      expect(complianceAuthorizationService.can('approve', mockResource)).toBe(true);
    });

    it('denies access to different organization', () => {
      const differentOrgResource = { ...mockResource, organization_id: 'org-2' };

      const result = complianceAuthorizationService.can('view', differentOrgResource);

      expect(result).toBe(false);
    });

    it('allows manager to view requirements', () => {
      const result = complianceAuthorizationService.can('view', mockResource);
      expect(result).toBe(true);
    });

    it('allows manager to edit requirements', () => {
      const result = complianceAuthorizationService.can('edit', mockResource);
      expect(result).toBe(true);
    });

    it('allows manager to delete own requirements', () => {
      const result = complianceAuthorizationService.can('delete', mockResource);
      expect(result).toBe(true);
    });

    it('denies manager from deleting others requirements', () => {
      const otherResource = { ...mockResource, created_by: 'user-2' };

      const result = complianceAuthorizationService.can('delete', otherResource);

      expect(result).toBe(false);
    });

    it('denies manager from approving requirements', () => {
      const result = complianceAuthorizationService.can('approve', mockResource);
      expect(result).toBe(false);
    });

    it('allows broker to approve requirements', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('broker');

      const result = complianceAuthorizationService.can('approve', mockResource);

      expect(result).toBe(true);
    });

    it('allows subcontractor to view requirements', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      const result = complianceAuthorizationService.can('view', mockResource);

      expect(result).toBe(true);
    });

    it('denies subcontractor from editing requirements', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      const result = complianceAuthorizationService.can('edit', mockResource);

      expect(result).toBe(false);
    });

    it('returns false when no context', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue(null);
      vi.mocked(authorizationService.getUserId).mockReturnValue(null);
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue(null);

      const result = complianceAuthorizationService.can('view', mockResource);

      expect(result).toBe(false);
    });
  });

  describe('Template Rules', () => {
    const templateResource: ComplianceResource = {
      id: 'tmpl-1',
      type: 'template',
      organization_id: 'org-1',
      created_by: 'user-1',
      is_template: true,
    };

    beforeEach(() => {
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-1');
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');
    });

    it('allows broker to create templates', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('broker');

      const result = complianceAuthorizationService.can('create', templateResource);

      expect(result).toBe(true);
    });

    it('denies manager from creating templates', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');

      const result = complianceAuthorizationService.can('create', templateResource);

      expect(result).toBe(false);
    });

    it('allows creator to delete template', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('broker');

      const result = complianceAuthorizationService.can('delete', templateResource);

      expect(result).toBe(true);
    });

    it('denies non-creator from deleting template', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('broker');
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-2');

      const result = complianceAuthorizationService.can('delete', templateResource);

      expect(result).toBe(false);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(() => {
      vi.mocked(authorizationService.getRole).mockReturnValue('broker');
    });

    it('canBulkImport returns true for broker', () => {
      expect(complianceAuthorizationService.canBulkImport()).toBe(true);
    });

    it('canBulkImport returns false for manager', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');
      expect(complianceAuthorizationService.canBulkImport()).toBe(false);
    });

    it('canBulkExport returns true for manager', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');
      expect(complianceAuthorizationService.canBulkExport()).toBe(true);
    });

    it('canBulkExport returns false for subcontractor', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');
      expect(complianceAuthorizationService.canBulkExport()).toBe(false);
    });

    it('canBulkArchive returns true for admin', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');
      expect(complianceAuthorizationService.canBulkArchive()).toBe(true);
    });

    it('canBulkStatusUpdate returns true for broker', () => {
      expect(complianceAuthorizationService.canBulkStatusUpdate()).toBe(true);
    });
  });

  describe('assertPermission', () => {
    it('does not throw when user has permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      expect(() => {
        complianceAuthorizationService.assertPermission(
          CompliancePermission.REQUIREMENT_CREATE
        );
      }).not.toThrow();
    });

    it('throws when user does not have permission', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      expect(() => {
        complianceAuthorizationService.assertPermission(
          CompliancePermission.REQUIREMENT_CREATE
        );
      }).toThrow();
    });

    it('throws with correct error code', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      try {
        complianceAuthorizationService.assertPermission(
          CompliancePermission.REQUIREMENT_CREATE
        );
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('code', AuthErrorCode.INSUFFICIENT_PERMISSIONS);
      }
    });
  });

  describe('assertCan', () => {
    const mockResource: ComplianceResource = {
      id: 'req-1',
      type: 'requirement',
      organization_id: 'org-1',
    };

    beforeEach(() => {
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-1');
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');
    });

    it('does not throw when user can perform action', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      expect(() => {
        complianceAuthorizationService.assertCan('delete', mockResource);
      }).not.toThrow();
    });

    it('throws when user cannot perform action', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('subcontractor');

      expect(() => {
        complianceAuthorizationService.assertCan('edit', mockResource);
      }).toThrow();
    });
  });

  describe('getCurrentPermissions', () => {
    it('returns permissions for current role', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');

      const permissions = complianceAuthorizationService.getCurrentPermissions();

      expect(permissions).toEqual(COMPLIANCE_ROLE_PERMISSIONS.manager);
    });

    it('returns empty array when no role', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue(null);

      const permissions = complianceAuthorizationService.getCurrentPermissions();

      expect(permissions).toEqual([]);
    });
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createComplianceContext', () => {
    it('creates context from authorization service', () => {
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-1');
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');
      vi.mocked(authorizationService.getPermissions).mockReturnValue([]);

      const context = createComplianceContext();

      expect(context).toEqual({
        user_id: 'user-1',
        role: 'manager',
        organization_id: 'org-1',
        permissions: [],
      });
    });

    it('returns null when user ID is missing', () => {
      vi.mocked(authorizationService.getUserId).mockReturnValue(null);
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');

      const context = createComplianceContext();

      expect(context).toBeNull();
    });

    it('returns null when role is missing', () => {
      vi.mocked(authorizationService.getUserId).mockReturnValue('user-1');
      vi.mocked(authorizationService.getRole).mockReturnValue(null);
      vi.mocked(authorizationService.getOrganizationId).mockReturnValue('org-1');

      const context = createComplianceContext();

      expect(context).toBeNull();
    });
  });

  describe('hasComplianceAdmin', () => {
    it('returns true for admin', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('admin');

      expect(hasComplianceAdmin()).toBe(true);
    });

    it('returns false for non-admin', () => {
      vi.mocked(authorizationService.getRole).mockReturnValue('manager');

      expect(hasComplianceAdmin()).toBe(false);
    });
  });

  describe('getAllCompliancePermissions', () => {
    it('returns all permissions', () => {
      const permissions = getAllCompliancePermissions();

      expect(permissions).toContain(CompliancePermission.REQUIREMENT_VIEW);
      expect(permissions).toContain(CompliancePermission.BULK_IMPORT);
      expect(permissions).toContain(CompliancePermission.COMPLIANCE_ADMIN);
      expect(permissions.length).toBe(Object.values(CompliancePermission).length);
    });
  });

  describe('getPermissionDisplayName', () => {
    it('returns human-readable name for permission', () => {
      expect(getPermissionDisplayName(CompliancePermission.REQUIREMENT_VIEW)).toBe(
        'View Requirements'
      );
      expect(getPermissionDisplayName(CompliancePermission.BULK_IMPORT)).toBe('Bulk Import');
      expect(getPermissionDisplayName(CompliancePermission.COMPLIANCE_ADMIN)).toBe(
        'Compliance Administration'
      );
    });
  });
});
