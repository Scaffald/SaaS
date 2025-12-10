/**
 * Contract Tests: RBAC (Role-Based Access Control)
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * These tests verify that MockDatabase and real Supabase behave identically
 * for role-based data filtering and access control.
 *
 * Note: RBAC tests focus on MockDatabase behavior since real Supabase RBAC
 * is enforced via RLS policies which require different test setup.
 *
 * Run with real database:
 *   VITE_RUN_CONTRACT_TESTS=true npm test -- contract.rbac
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockDatabase } from '../mockDatabase';
import { generateTestId, generateTestEmail } from './contractTestFactory';

// ============================================================================
// RBAC Tests using MockDatabase directly (for user context control)
// ============================================================================

describe('MockDatabase RBAC Tests', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = new MockDatabase();

    // Setup test data with clear ownership
    await db.from('users').insert([
      { id: 'manager-1', email: 'manager1@test.local', role: 'manager' },
      { id: 'manager-2', email: 'manager2@test.local', role: 'manager' },
      { id: 'admin-1', email: 'admin@test.local', role: 'admin' },
      { id: 'sub-user-1', email: 'sub1@test.local', role: 'subcontractor' },
      { id: 'broker-1', email: 'broker@test.local', role: 'broker' },
    ]);

    await db.from('projects').insert([
      { id: 'project-m1-a', name: 'Manager 1 Project A', manager_id: 'manager-1' },
      { id: 'project-m1-b', name: 'Manager 1 Project B', manager_id: 'manager-1' },
      { id: 'project-m2-a', name: 'Manager 2 Project A', manager_id: 'manager-2' },
    ]);

    await db.from('subcontractors').insert([
      {
        id: 'sub-1',
        name: 'Subcontractor 1',
        company: 'Company A',
        contact_info: { email: 'sub1@company.local', phone: '555-0001' },
      },
      {
        id: 'sub-2',
        name: 'Subcontractor 2',
        company: 'Company B',
        contact_info: { email: 'sub2@company.local', phone: '555-0002' },
      },
    ]);

    await db.from('documents').insert([
      {
        id: 'doc-1',
        subcontractor_id: 'sub-1',
        project_id: 'project-m1-a',
        file_url: 'https://example.com/doc1.pdf',
        status: 'approved',
      },
      {
        id: 'doc-2',
        subcontractor_id: 'sub-2',
        project_id: 'project-m2-a',
        file_url: 'https://example.com/doc2.pdf',
        status: 'pending',
      },
    ]);

    await db.from('tasks').insert([
      {
        id: 'task-1',
        project_id: 'project-m1-a',
        subcontractor_id: 'sub-1',
        title: 'Task for Manager 1',
        description: 'Task description',
        status: 'pending',
      },
      {
        id: 'task-2',
        project_id: 'project-m2-a',
        subcontractor_id: 'sub-2',
        title: 'Task for Manager 2',
        description: 'Task description',
        status: 'pending',
      },
    ]);

    await db.from('compliance_scores').insert([
      {
        id: 'score-1',
        project_id: 'project-m1-a',
        subcontractor_id: 'sub-1',
        score: 85,
        gaps: [],
      },
      {
        id: 'score-2',
        project_id: 'project-m2-a',
        subcontractor_id: 'sub-2',
        score: 70,
        gaps: [{ type: 'coverage_gap', description: 'Missing GL coverage', severity: 'medium' }],
      },
    ]);
  });

  // --------------------------------------------------------------------------
  // Admin Role Tests
  // --------------------------------------------------------------------------

  describe('Admin Role', () => {
    beforeEach(() => {
      db.setCurrentUser({ id: 'admin-1', role: 'admin' });
    });

    it('should see all projects', async () => {
      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });

    it('should see all users', async () => {
      const result = await db.from('users').select('*');

      expect(result.error).toBeNull();
      expect(result.data!.length).toBeGreaterThanOrEqual(5);
    });

    it('should see all documents', async () => {
      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should see all tasks', async () => {
      const result = await db.from('tasks').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should see all compliance scores', async () => {
      const result = await db.from('compliance_scores').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should see all subcontractors', async () => {
      const result = await db.from('subcontractors').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Manager Role Tests
  // --------------------------------------------------------------------------

  describe('Manager Role', () => {
    beforeEach(() => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });
    });

    it('should see only their own projects', async () => {
      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2); // manager-1 has 2 projects
      result.data!.forEach((project) => {
        expect(project.manager_id).toBe('manager-1');
      });
    });

    it('should not see other managers projects', async () => {
      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      const otherProjects = result.data!.filter((p) => p.manager_id !== 'manager-1');
      expect(otherProjects).toHaveLength(0);
    });

    it('should see documents only for their projects', async () => {
      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].project_id).toBe('project-m1-a');
    });

    it('should see tasks only for their projects', async () => {
      const result = await db.from('tasks').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].project_id).toBe('project-m1-a');
    });

    it('should see compliance scores only for their projects', async () => {
      const result = await db.from('compliance_scores').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].project_id).toBe('project-m1-a');
    });

    it('should see all subcontractors (not filtered by project)', async () => {
      const result = await db.from('subcontractors').select('*');

      expect(result.error).toBeNull();
      // Subcontractors are not filtered by manager
      expect(result.data!.length).toBeGreaterThanOrEqual(2);
    });

    it('manager-2 should see different projects than manager-1', async () => {
      db.setCurrentUser({ id: 'manager-2', role: 'manager' });
      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].manager_id).toBe('manager-2');
    });
  });

  // --------------------------------------------------------------------------
  // Subcontractor Role Tests
  // --------------------------------------------------------------------------

  describe('Subcontractor Role', () => {
    beforeEach(() => {
      db.setCurrentUser({
        id: 'sub-user-1',
        role: 'subcontractor',
        subcontractor_id: 'sub-1',
      });
    });

    it('should see only their own documents', async () => {
      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].subcontractor_id).toBe('sub-1');
    });

    it('should see only their own tasks', async () => {
      const result = await db.from('tasks').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].subcontractor_id).toBe('sub-1');
    });

    it('should see only their own compliance scores', async () => {
      const result = await db.from('compliance_scores').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].subcontractor_id).toBe('sub-1');
    });

    it('should not see other subcontractor documents', async () => {
      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      const otherDocs = result.data!.filter((d) => d.subcontractor_id !== 'sub-1');
      expect(otherDocs).toHaveLength(0);
    });

    it('different subcontractor should see different data', async () => {
      db.setCurrentUser({
        id: 'sub-user-2',
        role: 'subcontractor',
        subcontractor_id: 'sub-2',
      });

      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].subcontractor_id).toBe('sub-2');
    });
  });

  // --------------------------------------------------------------------------
  // No User Context Tests
  // --------------------------------------------------------------------------

  describe('No User Context', () => {
    beforeEach(() => {
      db.setCurrentUser(null);
    });

    it('should see all data when no user is set', async () => {
      // When no RBAC user is set, all data is visible (for unauthenticated scenarios)
      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
    });
  });

  // --------------------------------------------------------------------------
  // RBAC Transparency Tests
  // --------------------------------------------------------------------------

  describe('RBAC Transparency', () => {
    it('should apply RBAC without explicit filters in query', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Query without any filter
      const result = await db.from('projects').select('*');

      // Should still only return manager's projects
      expect(result.error).toBeNull();
      expect(result.data!.every((p) => p.manager_id === 'manager-1')).toBe(true);
    });

    it('should combine RBAC with explicit filters', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Query with filter that would otherwise return all projects
      const result = await db.from('projects').select('*').eq('name', 'Manager 1 Project A');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].name).toBe('Manager 1 Project A');
    });

    it('should return empty when filter matches but RBAC denies', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Query for manager-2's project (exists but not accessible)
      const result = await db.from('projects').select('*').eq('name', 'Manager 2 Project A');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Role Switching Tests
  // --------------------------------------------------------------------------

  describe('Role Switching', () => {
    it('should correctly switch between roles', async () => {
      // Start as manager-1
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });
      const managerResult = await db.from('projects').select('*');
      expect(managerResult.data).toHaveLength(2);

      // Switch to admin
      db.setCurrentUser({ id: 'admin-1', role: 'admin' });
      const adminResult = await db.from('projects').select('*');
      expect(adminResult.data).toHaveLength(3);

      // Switch to manager-2
      db.setCurrentUser({ id: 'manager-2', role: 'manager' });
      const manager2Result = await db.from('projects').select('*');
      expect(manager2Result.data).toHaveLength(1);
    });

    it('should correctly handle subcontractor context', async () => {
      // Set as subcontractor-1
      db.setCurrentUser({
        id: 'sub-user-1',
        role: 'subcontractor',
        subcontractor_id: 'sub-1',
      });
      const sub1Tasks = await db.from('tasks').select('*');
      expect(sub1Tasks.data).toHaveLength(1);
      expect(sub1Tasks.data![0].subcontractor_id).toBe('sub-1');

      // Switch to subcontractor-2
      db.setCurrentUser({
        id: 'sub-user-2',
        role: 'subcontractor',
        subcontractor_id: 'sub-2',
      });
      const sub2Tasks = await db.from('tasks').select('*');
      expect(sub2Tasks.data).toHaveLength(1);
      expect(sub2Tasks.data![0].subcontractor_id).toBe('sub-2');
    });
  });

  // --------------------------------------------------------------------------
  // Write Operations with RBAC
  // --------------------------------------------------------------------------

  describe('Write Operations with RBAC', () => {
    it('should allow manager to create project for themselves', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      const result = await db.from('projects').insert({
        name: `New Project ${generateTestId()}`,
        manager_id: 'manager-1',
      });

      expect(result.error).toBeNull();
    });

    it('should allow admin to create project for any manager', async () => {
      db.setCurrentUser({ id: 'admin-1', role: 'admin' });

      const result = await db.from('projects').insert({
        name: `Admin Created Project ${generateTestId()}`,
        manager_id: 'manager-2',
      });

      expect(result.error).toBeNull();
    });

    it('manager should only update their own projects', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Update own project
      const updateResult = await db
        .from('projects')
        .update({ name: 'Updated Project Name' })
        .eq('id', 'project-m1-a');

      expect(updateResult.error).toBeNull();
      expect(updateResult.data).toHaveLength(1);

      // Try to update other manager's project (RBAC should filter it out)
      const otherUpdateResult = await db
        .from('projects')
        .update({ name: 'Should Not Update' })
        .eq('id', 'project-m2-a');

      // No rows should be updated due to RBAC filtering
      expect(otherUpdateResult.error).toBeNull();
      expect(otherUpdateResult.data).toHaveLength(0);
    });

    it('manager should only delete their own tasks', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Delete own task
      const deleteResult = await db.from('tasks').delete().eq('id', 'task-1');
      expect(deleteResult.error).toBeNull();
      expect(deleteResult.data).toHaveLength(1);

      // Try to delete other manager's task
      const otherDeleteResult = await db.from('tasks').delete().eq('id', 'task-2');
      expect(otherDeleteResult.error).toBeNull();
      expect(otherDeleteResult.data).toHaveLength(0); // No rows deleted
    });
  });
});

// ============================================================================
// RBAC with Requirements and Endorsements
// ============================================================================

describe('MockDatabase RBAC: Requirements and Endorsements', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = new MockDatabase();

    await db.from('users').insert([
      { id: 'manager-1', email: 'manager1@test.local', role: 'manager' },
      { id: 'manager-2', email: 'manager2@test.local', role: 'manager' },
      { id: 'admin-1', email: 'admin@test.local', role: 'admin' },
    ]);

    await db.from('projects').insert([
      { id: 'project-1', name: 'Project 1', manager_id: 'manager-1' },
      { id: 'project-2', name: 'Project 2', manager_id: 'manager-2' },
    ]);

    await db.from('requirements').insert([
      {
        id: 'req-1',
        project_id: 'project-1',
        coverage_type: 'general_liability',
        minimum_amount: 2000000,
        endorsements_required: ['additional_insured'],
      },
      {
        id: 'req-2',
        project_id: 'project-2',
        coverage_type: 'workers_comp',
        minimum_amount: 1000000,
        endorsements_required: [],
      },
    ]);
  });

  it('manager should see only requirements for their projects', async () => {
    db.setCurrentUser({ id: 'manager-1', role: 'manager' });

    const result = await db.from('requirements').select('*');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].project_id).toBe('project-1');
  });

  it('admin should see all requirements', async () => {
    db.setCurrentUser({ id: 'admin-1', role: 'admin' });

    const result = await db.from('requirements').select('*');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
  });
});
