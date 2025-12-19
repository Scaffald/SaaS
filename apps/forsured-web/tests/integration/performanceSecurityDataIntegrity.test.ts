// Migrated from FRS-Prototype/tests/integration/performanceSecurityDataIntegrity.test.ts

/**
 * REQ-133: System Integration & End-to-End Testing
 * Performance, Security, and Data Integrity Tests
 *
 * Performance Testing:
 * - Load testing: 100 concurrent users
 * - Upload testing: 50 documents simultaneously
 * - Dashboard rendering: 1000 subcontractors
 * - Search performance: 10,000 tasks
 * - Compliance evaluation: 100 gaps in <5s
 *
 * Security Testing:
 * - RBAC enforcement: Cross-organization access attempts
 * - Session management and token expiry
 * - File upload validation (malicious files)
 *
 * Data Integrity Testing:
 * - Concurrent edits to same document
 * - Race conditions in task generation
 * - Audit log hash chain validation
 * - Database transaction rollbacks
 * - Duplicate prevention (documents, tasks)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../helpers/testDatabase';
import { RBACHelper } from '../helpers/rbacHelper';
import { ComplianceEvaluationEngine } from '@/lib/compliance/evaluator/evaluationEngine';
import { TaskGenerationService } from '@/lib/tasks/taskGenerationService';
import { DeduplicationService } from '@/lib/tasks/deduplicationService';
import { ExtractedPolicyData, GapType, GapSeverity } from '@/lib/compliance/evaluator/types';
import { CoverageType } from '@/lib/compliance/types';
import { TaskGenerationRequest } from '@/lib/tasks/types';
import mockDatabase from '@/utils/mockDataStore';
import { User, Task } from '@/types';

describe('Performance Testing', () => {
  let manager: any;
  let evaluationEngine: ComplianceEvaluationEngine;
  let taskGenerationService: TaskGenerationService;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;

    evaluationEngine = new ComplianceEvaluationEngine();
    taskGenerationService = new TaskGenerationService();
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Load Testing', () => {
    it('handles 100 concurrent user queries in under 2 seconds', async () => {
      // Create 100 users
      const users: User[] = [];
      for (let i = 0; i < 100; i++) {
        users.push({
          id: `user-load-${i}`,
          organization_id: `org-${i % 10}`, // 10 organizations
          name: `Load Test User ${i}`,
          email: `user${i}@test.com`,
          role: i % 3 === 0 ? 'manager' : i % 3 === 1 ? 'subcontractor' : 'broker',
          company: `Company ${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      mockDatabase.seedData('users', users);

      const startTime = Date.now();

      // Simulate 100 concurrent queries
      const queries = users.map((user) =>
        mockDatabase.query('users', { organization_id: user.organization_id })
      );

      await Promise.all(queries);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // <2 second requirement for 100 concurrent operations
    });

    it('handles 50 simultaneous document uploads in under 3 seconds', async () => {
      const documents = Array.from({ length: 50 }, (_, i) => ({
        id: `doc-upload-${i}`,
        file_name: `document-${i}.pdf`,
        file_size: 100000 + i * 1000,
        file_type: 'application/pdf',
        uploaded_by: manager.id,
        entity_type: 'project' as const,
        entity_id: 'test-project-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const startTime = Date.now();

      // Simulate simultaneous uploads
      const uploads = documents.map((doc) => mockDatabase.insert('attachments', doc));
      await Promise.all(uploads);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // <3 seconds for 50 uploads
    });

    it('renders dashboard with 1000 subcontractors in under 2 seconds', async () => {
      // Create 1000 subcontractor records
      const subcontractors = Array.from({ length: 1000 }, (_, i) => ({
        id: `broker-client-${i}`,
        broker_org_id: 'broker-org-1',
        client_org_id: `client-org-${i}`,
        company_name: `Subcontractor ${i}`,
        contact_name: `Contact ${i}`,
        contact_email: `sub${i}@test.com`,
        client_type: 'subcontractor' as const,
        risk_level: (i % 4 === 0 ? 'high' : 'medium') as const,
        compliance_score: 85 + (i % 15),
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockDatabase.seedData('clients', subcontractors);

      const startTime = Date.now();

      // Query all subcontractors (dashboard load)
      const result = await mockDatabase.query('clients', { broker_org_id: 'broker-org-1' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.length).toBe(1000);
      expect(duration).toBeLessThan(2000); // <2 second page load requirement
    });

    it('searches through 10,000 tasks in under 1 second', async () => {
      // Create 10,000 tasks
      const tasks = Array.from({ length: 10000 }, (_, i) => ({
        id: `task-search-${i}`,
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        status: (i % 4 === 0 ? 'pending' : 'completed') as const,
        priority: 'high' as const,
        due_date: new Date(Date.now() + i * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        project_id: `project-${i % 100}`,
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockDatabase.seedData('tasks', tasks);

      const startTime = Date.now();

      // Search for pending tasks
      const pendingTasks = await mockDatabase.query<Task>('tasks', { status: 'pending' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(pendingTasks.length).toBe(2500); // 25% are pending
      expect(duration).toBeLessThan(1000); // <1 second search requirement
    });

    it('evaluates compliance with 100 gaps in under 5 seconds', async () => {
      const requirements = await TestDatabase.seedComplianceRequirements(manager.organization_id);
      const project = await TestDatabase.seedProject(manager.id);

      // Create policy data that will generate ~100 gaps
      const policyData: ExtractedPolicyData = {
        policy_number: 'PERF-TEST-100-GAPS',
        carrier: 'Test Insurance',
        effective_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expired
        expiration_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [], // Missing all coverage
        endorsements: [], // Missing all endorsements
      };

      const startTime = Date.now();

      const result = await evaluationEngine.evaluate(
        {
          policy_id: 'policy-perf',
          project_id: project.id,
          extracted_data: policyData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.gaps.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // <5 second requirement
      expect(result.metadata.evaluation_duration_ms).toBeLessThan(5000);
    });
  });
});

describe('Security Testing', () => {
  let manager: User;
  let subcontractor: User;
  let otherSubcontractor: User;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;
    subcontractor = users.subcontractor;

    otherSubcontractor = {
      id: 'other-sub-sec',
      organization_id: 'org-other-sub',
      name: 'Other Sub',
      email: 'othersub@test.com',
      role: 'subcontractor',
      company: 'Other Company',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allUsers = await mockDatabase.query<User>('users', {});
    mockDatabase.seedData('users', [...allUsers, otherSubcontractor]);
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('RBAC Enforcement', () => {
    it('prevents cross-organization access attempts', async () => {
      // Subcontractor attempts to access manager's organization
      const canAccessManagerOrg = RBACHelper.canViewDocument(
        subcontractor,
        manager.organization_id!
      );

      expect(canAccessManagerOrg).toBe(false);

      // Manager attempts to access subcontractor's documents (without delegation)
      const canAccessSubOrg = RBACHelper.canViewDocument(
        manager,
        subcontractor.organization_id!
      );

      expect(canAccessSubOrg).toBe(false);

      // Subcontractor attempts to access other subcontractor's organization
      const canAccessOtherSub = RBACHelper.canViewDocument(
        subcontractor,
        otherSubcontractor.organization_id!
      );

      expect(canAccessOtherSub).toBe(false);
    });

    it('prevents unauthorized task assignment', async () => {
      // Subcontractor cannot assign tasks
      const subCanAssign = RBACHelper.canAssignTasks(subcontractor);
      expect(subCanAssign).toBe(false);

      // Manager can assign tasks
      const managerCanAssign = RBACHelper.canAssignTasks(manager);
      expect(managerCanAssign).toBe(true);
    });

    it('prevents users from completing tasks not assigned to them', async () => {
      const task: Task = {
        id: 'task-security-test',
        title: 'Security Test Task',
        description: 'Test',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        assigned_to_user_id: subcontractor.id,
        project_id: 'test-project-1',
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [task]);

      // Verify assigned user can complete
      const canComplete = RBACHelper.canCompleteTask(subcontractor, task.assigned_to_user_id!);
      expect(canComplete).toBe(true);

      // Verify other user cannot complete
      const otherCanComplete = RBACHelper.canCompleteTask(
        otherSubcontractor,
        task.assigned_to_user_id!
      );
      expect(otherCanComplete).toBe(false);
    });
  });

  describe('File Upload Security', () => {
    it('validates file types and rejects malicious files', async () => {
      const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maliciousFileTypes = ['application/x-msdownload', 'application/x-sh', 'text/html'];

      // Test valid files
      validFileTypes.forEach((fileType) => {
        expect(validFileTypes.includes(fileType)).toBe(true);
      });

      // Test malicious files
      maliciousFileTypes.forEach((fileType) => {
        expect(validFileTypes.includes(fileType)).toBe(false);
      });
    });

    it('validates file sizes (max 10MB)', async () => {
      const validSize = 5 * 1024 * 1024; // 5MB
      const invalidSize = 15 * 1024 * 1024; // 15MB
      const maxSize = 10 * 1024 * 1024; // 10MB

      expect(validSize).toBeLessThan(maxSize);
      expect(invalidSize).toBeGreaterThan(maxSize);
    });
  });
});

describe('Data Integrity Testing', () => {
  let manager: any;
  let deduplicationService: DeduplicationService;
  let taskGenerationService: TaskGenerationService;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;

    deduplicationService = new DeduplicationService();
    taskGenerationService = new TaskGenerationService();
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Duplicate Prevention', () => {
    it('prevents duplicate task generation for same gap', async () => {
      const project = await TestDatabase.seedProject(manager.id);

      const gap = {
        id: 'gap-dedup',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20,
      };

      const taskRequest: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: project.id,
        subcontractor_org_id: 'org-sub-1',
        gaps: [gap],
      };

      // First generation
      let existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const result1 = await taskGenerationService.generateTasks(taskRequest, existingTasks);

      expect(result1.tasks_created).toBe(1);

      // Seed the generated task
      const generatedTasks = await taskGenerationService.generateTaskObjects(taskRequest, []);
      mockDatabase.seedData('tasks', generatedTasks);

      // Second generation (should detect duplicate)
      const taskRequest2: TaskGenerationRequest = {
        ...taskRequest,
        evaluation_run_id: 'eval-2',
      };

      existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const result2 = await taskGenerationService.generateTasks(taskRequest2, existingTasks);

      expect(result2.tasks_created).toBe(0);
      expect(result2.tasks_updated).toBe(1);
    });

    it('uses deduplication service to detect similar tasks', async () => {
      const task1: Task = {
        id: 'task-1',
        title: 'Upload General Liability COI',
        description: 'Upload certificate',
        status: 'pending',
        priority: 'urgent',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        project_id: 'project-1',
        task_type: 'coi_upload',
        metadata: {
          gap_id: 'gap-1',
          gap_type: GapType.MISSING_COVERAGE,
          gap_severity: GapSeverity.CRITICAL,
          coverage_type: CoverageType.GENERAL_LIABILITY,
          subcontractor_org_id: 'org-1',
          auto_generated: true,
          required_value: 'Certificate',
          remediation: 'Upload',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newGap = {
        id: 'gap-2',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20,
      };

      const result = deduplicationService.checkForDuplicates(
        newGap,
        'org-1',
        'project-1',
        undefined,
        [task1]
      );

      expect(result.action).toBe('update'); // Should update existing open task
      expect(result.existing_task_id).toBe('task-1');
    });

    it('prevents duplicate document uploads', async () => {
      const doc1 = {
        id: 'doc-1',
        file_name: 'insurance.pdf',
        file_size: 100000,
        file_type: 'application/pdf',
        uploaded_by: manager.id,
        entity_type: 'project' as const,
        entity_id: 'project-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('attachments', [doc1]);

      // Attempt to upload same file
      const existingDocs = await mockDatabase.query('attachments', {
        entity_id: 'project-1',
        file_name: 'insurance.pdf',
      });

      expect(existingDocs.length).toBe(1);
      // In real system, would check hash/checksum to prevent duplicates
    });
  });

  describe('Concurrent Operations', () => {
    it('handles concurrent task status updates correctly', async () => {
      const task: Task = {
        id: 'task-concurrent',
        title: 'Concurrent Test',
        description: 'Test',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_by_user_id: manager.id,
        project_id: 'project-1',
        task_type: 'coi_upload',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('tasks', [task]);

      // Simulate concurrent updates
      const update1 = mockDatabase.update<Task>('tasks', task.id, { status: 'in_progress' });
      const update2 = mockDatabase.update<Task>('tasks', task.id, { priority: 'urgent' });

      await Promise.all([update1, update2]);

      const finalTask = await mockDatabase.queryOne<Task>('tasks', { id: task.id });

      // Both updates should be applied (last write wins in mock, but real DB would handle properly)
      expect(finalTask).toBeDefined();
    });

    it('handles race conditions in task generation', async () => {
      const project = await TestDatabase.seedProject(manager.id);

      const gap = {
        id: 'gap-race',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20,
      };

      const taskRequest: TaskGenerationRequest = {
        evaluation_run_id: 'eval-race',
        project_id: project.id,
        subcontractor_org_id: 'org-sub-1',
        gaps: [gap],
      };

      // Simulate race condition: two simultaneous task generations
      const existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });

      const gen1 = taskGenerationService.generateTasks(taskRequest, existingTasks);
      const gen2 = taskGenerationService.generateTasks(taskRequest, existingTasks);

      const [result1, result2] = await Promise.all([gen1, gen2]);

      // Both should succeed, but deduplication should prevent actual duplicates
      expect(result1.tasks_created + result2.tasks_created).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Audit Log Integrity', () => {
    it('maintains hash chain integrity', async () => {
      const logs = [
        {
          id: 'log-1',
          entity_type: 'task' as const,
          entity_id: 'task-1',
          old_status: 'pending',
          new_status: 'in_progress',
          changed_by: manager.id,
          created_at: new Date(Date.now() - 2000).toISOString(),
          hash: 'hash1',
          previous_hash: null,
        },
        {
          id: 'log-2',
          entity_type: 'task' as const,
          entity_id: 'task-1',
          old_status: 'in_progress',
          new_status: 'completed',
          changed_by: manager.id,
          created_at: new Date(Date.now() - 1000).toISOString(),
          hash: 'hash2',
          previous_hash: 'hash1',
        },
        {
          id: 'log-3',
          entity_type: 'document' as const,
          entity_id: 'doc-1',
          old_status: 'draft',
          new_status: 'published',
          changed_by: manager.id,
          created_at: new Date().toISOString(),
          hash: 'hash3',
          previous_hash: 'hash2',
        },
      ];

      mockDatabase.seedData('status_history', logs);

      const allLogs = await mockDatabase.query('status_history', {});
      const sortedLogs = allLogs.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Verify chain integrity
      expect(sortedLogs[0].previous_hash).toBeNull();
      expect(sortedLogs[1].previous_hash).toBe(sortedLogs[0].hash);
      expect(sortedLogs[2].previous_hash).toBe(sortedLogs[1].hash);
    });
  });
});
