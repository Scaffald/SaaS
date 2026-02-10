/**
 * Authorization Service Tests
 * OAuth 2.0 + RBAC Authentication System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationService } from '../authorizationService';
import { Permission, Role, OwnedResource } from '../types';

describe('AuthorizationService', () => {
  let authService: AuthorizationService;

  beforeEach(() => {
    authService = new AuthorizationService();
  });

  describe('Initialization', () => {
    it('should initialize with user context', () => {
      authService.initialize('user-123', 'manager', 'org-456');

      expect(authService.getRole()).toBe('manager');
      expect(authService.getUserId()).toBe('user-123');
      expect(authService.getOrganizationId()).toBe('org-456');
    });

    it('should clear authorization context', () => {
      authService.initialize('user-123', 'manager', 'org-456');
      authService.clear();

      expect(authService.getRole()).toBeNull();
      expect(authService.getUserId()).toBeNull();
    });
  });

  describe('Permission Checks', () => {
    describe('Manager Role', () => {
      beforeEach(() => {
        authService.initialize('user-123', 'manager', 'org-456');
      });

      it('should have PROJECT_CREATE permission', () => {
        expect(authService.hasPermission(Permission.PROJECT_CREATE)).toBe(true);
      });

      it('should have TASK_ASSIGN permission', () => {
        expect(authService.hasPermission(Permission.TASK_ASSIGN)).toBe(true);
      });

      it('should NOT have ADMIN_ACCESS permission', () => {
        expect(authService.hasPermission(Permission.ADMIN_ACCESS)).toBe(false);
      });

      it('should NOT have POLICY_EDIT permission', () => {
        expect(authService.hasPermission(Permission.POLICY_EDIT)).toBe(false);
      });
    });

    describe('Subcontractor Role', () => {
      beforeEach(() => {
        authService.initialize('user-123', 'subcontractor', 'org-456');
      });

      it('should have TASK_COMPLETE permission', () => {
        expect(authService.hasPermission(Permission.TASK_COMPLETE)).toBe(true);
      });

      it('should have DOCUMENT_UPLOAD permission', () => {
        expect(authService.hasPermission(Permission.DOCUMENT_UPLOAD)).toBe(true);
      });

      it('should NOT have PROJECT_CREATE permission', () => {
        expect(authService.hasPermission(Permission.PROJECT_CREATE)).toBe(false);
      });

      it('should NOT have TASK_ASSIGN permission', () => {
        expect(authService.hasPermission(Permission.TASK_ASSIGN)).toBe(false);
      });
    });

    describe('Broker Role', () => {
      beforeEach(() => {
        authService.initialize('user-123', 'broker', 'org-456');
      });

      it('should have POLICY_CREATE permission', () => {
        expect(authService.hasPermission(Permission.POLICY_CREATE)).toBe(true);
      });

      it('should have BROKER_ACK_CREATE permission', () => {
        expect(authService.hasPermission(Permission.BROKER_ACK_CREATE)).toBe(true);
      });

      it('should NOT have PROJECT_CREATE permission', () => {
        expect(authService.hasPermission(Permission.PROJECT_CREATE)).toBe(false);
      });

      it('should NOT have ADMIN_ACCESS permission', () => {
        expect(authService.hasPermission(Permission.ADMIN_ACCESS)).toBe(false);
      });
    });

    describe('Admin Role', () => {
      beforeEach(() => {
        authService.initialize('user-123', 'admin', 'org-456');
      });

      it('should have all permissions', () => {
        const allPermissions = Object.values(Permission);
        allPermissions.forEach(permission => {
          expect(authService.hasPermission(permission)).toBe(true);
        });
      });
    });
  });

  describe('Multiple Permission Checks', () => {
    beforeEach(() => {
      authService.initialize('user-123', 'manager', 'org-456');
    });

    it('should check hasAnyPermission correctly', () => {
      const result = authService.hasAnyPermission([
        Permission.PROJECT_CREATE,
        Permission.ADMIN_ACCESS,
      ]);
      expect(result).toBe(true); // Has PROJECT_CREATE
    });

    it('should return false if has none of the permissions', () => {
      const result = authService.hasAnyPermission([
        Permission.ADMIN_ACCESS,
        Permission.ADMIN_SETTINGS,
      ]);
      expect(result).toBe(false);
    });

    it('should check hasAllPermissions correctly', () => {
      const result = authService.hasAllPermissions([
        Permission.PROJECT_CREATE,
        Permission.TASK_ASSIGN,
      ]);
      expect(result).toBe(true);
    });

    it('should return false if missing any required permission', () => {
      const result = authService.hasAllPermissions([
        Permission.PROJECT_CREATE,
        Permission.ADMIN_ACCESS,
      ]);
      expect(result).toBe(false); // Missing ADMIN_ACCESS
    });
  });

  describe('Resource Access Control', () => {
    describe('Project Access', () => {
      it('should allow manager to view their own project', () => {
        authService.initialize('manager-123', 'manager', 'org-456');

        const project: OwnedResource = {
          id: 'proj-1',
          type: 'project',
          manager_id: 'manager-123',
        };

        expect(authService.can('view', project)).toBe(true);
      });

      it('should NOT allow manager to view another managers project', () => {
        authService.initialize('manager-123', 'manager', 'org-456');

        const project: OwnedResource = {
          id: 'proj-1',
          type: 'project',
          manager_id: 'manager-999',
        };

        expect(authService.can('view', project)).toBe(false);
      });

      it('should allow broker to view client project', () => {
        authService.initialize('broker-123', 'broker', 'org-456');

        const project: OwnedResource = {
          id: 'proj-1',
          type: 'project',
          broker_id: 'broker-123',
        };

        expect(authService.can('view', project)).toBe(true);
      });

      it('should allow manager to edit their own project', () => {
        authService.initialize('manager-123', 'manager', 'org-456');

        const project: OwnedResource = {
          id: 'proj-1',
          type: 'project',
          manager_id: 'manager-123',
        };

        expect(authService.can('edit', project)).toBe(true);
      });

      it('should NOT allow subcontractor to edit project', () => {
        authService.initialize('sub-123', 'subcontractor', 'org-456');

        const project: OwnedResource = {
          id: 'proj-1',
          type: 'project',
          manager_id: 'manager-123',
        };

        expect(authService.can('edit', project)).toBe(false);
      });
    });

    describe('Task Access', () => {
      it('should allow assigned user to complete task', () => {
        authService.initialize('sub-123', 'subcontractor', 'org-456');

        const task: OwnedResource = {
          id: 'task-1',
          type: 'task',
          assigned_to: 'sub-123',
        };

        expect(authService.can('complete', task)).toBe(true);
      });

      it('should NOT allow non-assigned user to complete task', () => {
        authService.initialize('sub-123', 'subcontractor', 'org-456');

        const task: OwnedResource = {
          id: 'task-1',
          type: 'task',
          assigned_to: 'sub-999',
        };

        expect(authService.can('complete', task)).toBe(false);
      });

      it('should allow manager to complete any task', () => {
        authService.initialize('manager-123', 'manager', 'org-456');

        const task: OwnedResource = {
          id: 'task-1',
          type: 'task',
          assigned_to: 'sub-123',
        };

        expect(authService.can('complete', task)).toBe(true);
      });
    });

    describe('Document Access', () => {
      it('should allow user to delete their own document', () => {
        authService.initialize('user-123', 'manager', 'org-456');

        const document: OwnedResource = {
          id: 'doc-1',
          type: 'document',
          uploaded_by: 'user-123',
        };

        expect(authService.can('delete', document)).toBe(true);
      });

      it('should NOT allow user to delete another users document', () => {
        authService.initialize('user-123', 'manager', 'org-456');

        const document: OwnedResource = {
          id: 'doc-1',
          type: 'document',
          uploaded_by: 'user-999',
        };

        expect(authService.can('delete', document)).toBe(false);
      });
    });
  });

  describe('Admin Override', () => {
    beforeEach(() => {
      authService.initialize('admin-123', 'admin', 'org-456');
    });

    it('should allow admin to access any resource', () => {
      const project: OwnedResource = {
        id: 'proj-1',
        type: 'project',
        manager_id: 'manager-999',
      };

      expect(authService.can('view', project)).toBe(true);
      expect(authService.can('edit', project)).toBe(true);
      expect(authService.can('delete', project)).toBe(true);
    });
  });

  describe('Assertion Methods', () => {
    beforeEach(() => {
      authService.initialize('user-123', 'manager', 'org-456');
    });

    it('should not throw when permission exists', () => {
      expect(() => {
        authService.assertPermission(Permission.PROJECT_CREATE);
      }).not.toThrow();
    });

    it('should throw when permission is missing', () => {
      expect(() => {
        authService.assertPermission(Permission.ADMIN_ACCESS);
      }).toThrow();
    });

    it('should not throw when access is allowed', () => {
      const project: OwnedResource = {
        id: 'proj-1',
        type: 'project',
        manager_id: 'user-123',
      };

      expect(() => {
        authService.assertCan('view', project);
      }).not.toThrow();
    });

    it('should throw when access is denied', () => {
      const project: OwnedResource = {
        id: 'proj-1',
        type: 'project',
        manager_id: 'user-999',
      };

      expect(() => {
        authService.assertCan('view', project);
      }).toThrow();
    });
  });
});
