/**
 * REQ-133: System Integration & End-to-End Testing
 * RBAC Helper for testing role-based access control
 *
 * Migrated from FRS-Prototype/tests/helpers/rbacHelper.ts
 */

import { User } from '@/types';

export class RBACHelper {
  /**
   * Check if user can access project
   */
  static canAccessProject(user: User, projectOrgId: string): boolean {
    // Manager can access their own organization's projects
    if (user.role === 'manager') {
      return user.organization_id === projectOrgId;
    }

    // Subcontractor can only access projects they're assigned to
    if (user.role === 'subcontractor') {
      // This would need to check project_participants table in real implementation
      return false; // Conservative default
    }

    // Broker can access their clients' projects
    if (user.role === 'broker') {
      // This would need to check broker_delegations table in real implementation
      return false; // Conservative default
    }

    return false;
  }

  /**
   * Check if user can view document
   */
  static canViewDocument(user: User, documentOrgId: string): boolean {
    // Manager can view their organization's documents
    if (user.role === 'manager') {
      return user.organization_id === documentOrgId;
    }

    // Subcontractor can only view their own documents
    if (user.role === 'subcontractor') {
      return user.organization_id === documentOrgId;
    }

    // Broker can view documents from their clients
    if (user.role === 'broker') {
      return false; // Would check delegations in real implementation
    }

    return false;
  }

  /**
   * Check if user can assign tasks
   */
  static canAssignTasks(user: User): boolean {
    return user.role === 'manager' || user.role === 'broker';
  }

  /**
   * Check if user can complete task
   */
  static canCompleteTask(user: User, taskAssignedToId: string): boolean {
    return user.id === taskAssignedToId;
  }

  /**
   * Get accessible organizations for user
   */
  static getAccessibleOrganizations(user: User): string[] {
    // Manager can access their own org
    if (user.role === 'manager' && user.organization_id) {
      return [user.organization_id];
    }

    // Subcontractor can access their own org
    if (user.role === 'subcontractor' && user.organization_id) {
      return [user.organization_id];
    }

    // Broker would have multiple accessible organizations (clients)
    if (user.role === 'broker') {
      return []; // Would fetch from broker_delegations in real implementation
    }

    return [];
  }
}
