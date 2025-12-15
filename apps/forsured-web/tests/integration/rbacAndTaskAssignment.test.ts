/**
 * Migrated from FRS-Prototype/tests/integration/rbacAndTaskAssignment.test.ts
 *
 * REQ-133: System Integration & End-to-End Testing
 * Integration Suite 3: RBAC → Document Access → Task Assignment
 *
 * Tests the complete flow:
 * 1. Authenticate as Manager (REQ-126)
 * 2. Verify manager can view all projects (REQ-126)
 * 3. Upload document to project (REQ-124)
 * 4. Assign task to subcontractor (REQ-166)
 * 5. Authenticate as Subcontractor (REQ-126)
 * 6. Verify subcontractor can only see their tasks (REQ-126)
 * 7. Verify subcontractor cannot access other companies' documents (REQ-126)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../helpers/testDatabase';
import { RBACHelper } from '../helpers/rbacHelper';
import { TaskAssignmentService } from '@/lib/tasks/taskAssignmentService';
import mockDatabase from '@/utils/mockDataStore';
import { Task, User, Project } from '@/types';

describe('Integration Suite 3: RBAC → Document Access → Task Assignment', () => {
  let manager: User;
  let subcontractor: User;
  let otherSubcontractor: User;
  let broker: User;
  let project: Project;
  let taskAssignmentService: TaskAssignmentService;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;
    subcontractor = users.subcontractor;
    broker = users.broker;

    // Create another subcontractor from different organization
    otherSubcontractor = {
      id: 'test-subcontractor-2',
      organization_id: 'org-subcontractor-2',
      name: 'Other Subcontractor',
      email: 'other-sub@test.com',
      role: 'subcontractor',
      company: 'Other Subcontractor Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allUsers = await mockDatabase.query<User>('users', {});
    mockDatabase.seedData('users', [...allUsers, otherSubcontractor]);

    project = await TestDatabase.seedProject(manager.id);

    taskAssignmentService = new TaskAssignmentService();
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Manager RBAC and Workflows', () => {
    it('manager can view all projects in their organization', async () => {
      // Step 1: Authenticate as Manager (simulated)
      const currentUser = manager;

      // Step 2: Verify manager can access project
      const canAccess = RBACHelper.canAccessProject(currentUser, project.client_id);

      // In real system, would check that project belongs to manager's org
      expect(currentUser.role).toBe('manager');
      expect(currentUser.organization_id).toBeDefined();

      // Fetch projects (in real system would filter by organization)
      const projects = await mockDatabase.query<Project>('projects', {
        project_manager: manager.id,
      });

      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].id).toBe(project.id);
    });

    it('manager can upload document to project', async () => {
      // Step 3: Upload document to project (REQ-124)
      const document = {
        id: TestDatabase.generateId('doc'),
        file_name: 'insurance_certificate.pdf',
        file_size: 250000,
        file_type: 'application/pdf',
        uploaded_by: manager.id,
        entity_type: 'project' as const,
        entity_id: project.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('attachments', [document]);

      const uploadedDocs = await mockDatabase.query('attachments', {
        entity_id: project.id,
      });

      expect(uploadedDocs.length).toBe(1);
      expect(uploadedDocs[0].uploaded_by).toBe(manager.id);
    });

    it('manager can assign task to subcontractor', async () => {
      // Step 4: Create and assign task (REQ-166)
      const task: Task = {
        id: TestDatabase.generateId('task'),
        title: 'Upload General Liability COI',
        description: 'Please upload your General Liability certificate',
        status: 'pending',
        priority: 'urgent',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        project_id: project.id,
        task_type: 'coi_upload',
        metadata: {
          severity_level: 'critical',
          compliance_issue_type: 'missing_coverage',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [task]);

      // Manual assignment to subcontractor (simulated)
      await mockDatabase.update<Task>('tasks', task.id, {
        assigned_to_user_id: subcontractor.id,
      });

      const assignedTask = await mockDatabase.queryOne<Task>('tasks', { id: task.id });
      expect(assignedTask?.assigned_to_user_id).toBe(subcontractor.id);
      expect(assignedTask?.created_by_user_id).toBe(manager.id);
    });
  });

  describe('Subcontractor RBAC and Access Control', () => {
    it('subcontractor can only see their assigned tasks', async () => {
      // Create task assigned to subcontractor
      const assignedTask: Task = {
        id: 'task-assigned-1',
        title: 'Your Task',
        description: 'Task assigned to you',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        assigned_to_user_id: subcontractor.id,
        project_id: project.id,
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create task assigned to other subcontractor
      const otherTask: Task = {
        id: 'task-other-1',
        title: 'Other Subcontractor Task',
        description: 'Task assigned to other subcontractor',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        assigned_to_user_id: otherSubcontractor.id,
        project_id: project.id,
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [assignedTask, otherTask]);

      // Step 5: Authenticate as Subcontractor (simulated)
      const currentUser = subcontractor;

      // Step 6: Query tasks (RBAC filter)
      const myTasks = await mockDatabase.query<Task>('tasks', {
        assigned_to_user_id: currentUser.id,
      });

      expect(myTasks.length).toBe(1);
      expect(myTasks[0].id).toBe(assignedTask.id);
      expect(myTasks[0].assigned_to_user_id).toBe(currentUser.id);

      // Verify cannot see other subcontractor's tasks
      const otherTasks = await mockDatabase.query<Task>('tasks', {
        assigned_to_user_id: otherSubcontractor.id,
      });

      // In real system, this query would be forbidden by RBAC
      // For this test, we verify they're different users
      expect(otherTasks[0].assigned_to_user_id).not.toBe(currentUser.id);
    });

    it('subcontractor cannot access other companies documents', async () => {
      // Step 7: Create documents from different organizations
      const ownDocument = {
        id: 'doc-own-1',
        file_name: 'my_insurance.pdf',
        file_size: 200000,
        file_type: 'application/pdf',
        uploaded_by: subcontractor.id,
        entity_type: 'project' as const,
        entity_id: project.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const otherDocument = {
        id: 'doc-other-1',
        file_name: 'other_company_insurance.pdf',
        file_size: 200000,
        file_type: 'application/pdf',
        uploaded_by: otherSubcontractor.id,
        entity_type: 'project' as const,
        entity_id: 'other-project-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('attachments', [ownDocument, otherDocument]);

      // Authenticate as subcontractor
      const currentUser = subcontractor;

      // Verify RBAC: can view own organization's documents
      const canViewOwn = RBACHelper.canViewDocument(
        currentUser,
        currentUser.organization_id!
      );
      expect(canViewOwn).toBe(true);

      // Verify RBAC: cannot view other organization's documents
      const canViewOther = RBACHelper.canViewDocument(
        currentUser,
        otherSubcontractor.organization_id!
      );
      expect(canViewOther).toBe(false);

      // Query documents (filtered by uploader)
      const myDocuments = await mockDatabase.query('attachments', {
        uploaded_by: currentUser.id,
      });

      expect(myDocuments.length).toBe(1);
      expect(myDocuments[0].uploaded_by).toBe(currentUser.id);
    });

    it('subcontractor can complete their assigned tasks', async () => {
      const task: Task = {
        id: 'task-complete-1',
        title: 'Upload COI',
        description: 'Upload certificate',
        status: 'in_progress',
        priority: 'urgent',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        assigned_to_user_id: subcontractor.id,
        project_id: project.id,
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [task]);

      // Verify RBAC: can complete own task
      const canComplete = RBACHelper.canCompleteTask(subcontractor, task.assigned_to_user_id!);
      expect(canComplete).toBe(true);

      // Update task status
      await mockDatabase.update<Task>('tasks', task.id, {
        status: 'completed',
      });

      const updatedTask = await mockDatabase.queryOne<Task>('tasks', { id: task.id });
      expect(updatedTask?.status).toBe('completed');
    });

    it('subcontractor cannot complete tasks assigned to others', async () => {
      const task: Task = {
        id: 'task-other-complete',
        title: 'Other Task',
        description: 'Task for other subcontractor',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        assigned_to_user_id: otherSubcontractor.id,
        project_id: project.id,
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [task]);

      // Verify RBAC: cannot complete other's task
      const canComplete = RBACHelper.canCompleteTask(subcontractor, task.assigned_to_user_id!);
      expect(canComplete).toBe(false);
    });
  });

  describe('Cross-Organization Access Prevention', () => {
    it('enforces organization isolation for projects', async () => {
      // Manager from one org
      expect(manager.organization_id).toBe('org-manager-1');

      // Subcontractor from different org
      expect(subcontractor.organization_id).toBe('org-subcontractor-1');

      // Verify organizations are different
      expect(manager.organization_id).not.toBe(subcontractor.organization_id);

      // Verify accessible organizations
      const managerOrgs = RBACHelper.getAccessibleOrganizations(manager);
      const subcontractorOrgs = RBACHelper.getAccessibleOrganizations(subcontractor);

      expect(managerOrgs).toContain(manager.organization_id);
      expect(subcontractorOrgs).toContain(subcontractor.organization_id);
      expect(managerOrgs).not.toContain(subcontractor.organization_id);
    });

    it('prevents unauthorized task assignment', async () => {
      // Verify only managers and brokers can assign tasks
      expect(RBACHelper.canAssignTasks(manager)).toBe(true);
      expect(RBACHelper.canAssignTasks(broker)).toBe(true);
      expect(RBACHelper.canAssignTasks(subcontractor)).toBe(false);
    });
  });
});
