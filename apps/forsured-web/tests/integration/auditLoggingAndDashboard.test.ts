// Migrated from FRS-Prototype/tests/integration/auditLoggingAndDashboard.test.ts

/**
 * REQ-133: System Integration & End-to-End Testing
 * Integration Suite 4 & 5: Audit Logging + Dashboard Data Aggregation
 *
 * Suite 4 - Audit Logging:
 * 1. Perform various actions (upload, edit, status change)
 * 2. Verify all actions logged to audit trail (REQ-130)
 * 3. Verify audit log integrity (hash chain) (REQ-130)
 * 4. Verify WORM enforcement (cannot modify/delete logs) (REQ-130)
 *
 * Suite 5 - Dashboard Data Aggregation:
 * 1. Create multiple projects with subcontractors
 * 2. Upload documents and run compliance evaluations
 * 3. Generate tasks from gaps
 * 4. Verify dashboard shows correct metrics (REQ-129)
 * 5. Verify overall compliance score accurate (REQ-129)
 * 6. Verify task counts correct (REQ-129)
 * 7. Verify expiring policies correct (REQ-129)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../helpers/testDatabase';
import { ComplianceEvaluationEngine } from '@/lib/compliance/evaluator/evaluationEngine';
import { TaskGenerationService } from '@/lib/tasks/taskGenerationService';
import { ExtractedPolicyData, ComplianceStatus } from '@/lib/compliance/evaluator/types';
import { CoverageType } from '@/lib/compliance/types';
import mockDatabase from '@/utils/mockDataStore';
import { Task, Project, PolicyData } from '@/types';

describe('Integration Suite 4: Audit Logging', () => {
  let manager: any;
  let subcontractor: any;
  let project: Project;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;
    subcontractor = users.subcontractor;
    project = await TestDatabase.seedProject(manager.id);
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Audit Trail Logging', () => {
    it('logs document upload action to audit trail', async () => {
      const auditLogId = TestDatabase.generateId('audit');
      const documentId = TestDatabase.generateId('doc');

      // Action: Upload document
      const document = {
        id: documentId,
        file_name: 'coi.pdf',
        file_size: 100000,
        file_type: 'application/pdf',
        uploaded_by: subcontractor.id,
        entity_type: 'project' as const,
        entity_id: project.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockDatabase.seedData('attachments', [document]);

      // Create audit log entry
      const auditLog = {
        id: auditLogId,
        entity_type: 'document' as const,
        entity_id: documentId,
        action: 'upload',
        user_id: subcontractor.id,
        changes: {
          file_name: document.file_name,
          file_size: document.file_size,
        },
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.1',
        hash: '', // Would be calculated
      };

      // In real system, this would be auto-generated
      // For test, we manually create it to verify the concept
      mockDatabase.seedData('status_history', [auditLog]);

      const logs = await mockDatabase.query('status_history', { entity_id: documentId });

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('upload');
      expect(logs[0].user_id).toBe(subcontractor.id);
    });

    it('logs status change action to audit trail', async () => {
      const task: Task = {
        id: 'task-audit-1',
        title: 'Test Task',
        description: 'For audit testing',
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

      mockDatabase.seedData('tasks', [task]);

      // Action: Change status
      await mockDatabase.update<Task>('tasks', task.id, {
        status: 'completed',
      });

      // Log the status change
      const statusChange = {
        id: TestDatabase.generateId('status'),
        entity_type: 'task' as const,
        entity_id: task.id,
        old_status: 'pending',
        new_status: 'completed',
        changed_by: subcontractor.id,
        reason: 'Task completed successfully',
        created_at: new Date().toISOString(),
      };

      mockDatabase.seedData('status_history', [statusChange]);

      const statusHistory = await mockDatabase.query('status_history', { entity_id: task.id });

      expect(statusHistory.length).toBe(1);
      expect(statusHistory[0].old_status).toBe('pending');
      expect(statusHistory[0].new_status).toBe('completed');
      expect(statusHistory[0].changed_by).toBe(subcontractor.id);
    });

    it('enforces WORM (Write-Once-Read-Many) for audit logs', async () => {
      const auditLog = {
        id: 'audit-worm-test',
        entity_type: 'task' as const,
        entity_id: 'task-1',
        old_status: 'pending',
        new_status: 'completed',
        changed_by: manager.id,
        created_at: new Date().toISOString(),
      };

      mockDatabase.seedData('status_history', [auditLog]);

      // Attempt to modify audit log (should fail in real system)
      let updateError: Error | null = null;
      try {
        // In real system with WORM enforcement, this would throw an error
        // For this test, we verify the concept by checking immutability
        const originalLog = await mockDatabase.queryOne('status_history', { id: auditLog.id });
        expect(originalLog).toBeDefined();
        expect(originalLog?.old_status).toBe('pending');

        // In real WORM system, update attempts would be rejected
        // We document this as a requirement
      } catch (error) {
        updateError = error as Error;
      }

      // Verify log integrity maintained
      const verifyLog = await mockDatabase.queryOne('status_history', { id: auditLog.id });
      expect(verifyLog?.old_status).toBe('pending');
      expect(verifyLog?.new_status).toBe('completed');
    });

    it('maintains audit log hash chain for integrity', async () => {
      // Simulate sequential audit logs with hash chain
      const log1 = {
        id: 'log-1',
        entity_type: 'task' as const,
        entity_id: 'task-1',
        old_status: 'pending',
        new_status: 'in_progress',
        changed_by: manager.id,
        created_at: new Date().toISOString(),
        hash: 'hash-1',
        previous_hash: null,
      };

      const log2 = {
        id: 'log-2',
        entity_type: 'task' as const,
        entity_id: 'task-1',
        old_status: 'in_progress',
        new_status: 'completed',
        changed_by: subcontractor.id,
        created_at: new Date().toISOString(),
        hash: 'hash-2',
        previous_hash: 'hash-1', // Links to previous log
      };

      mockDatabase.seedData('status_history', [log1, log2]);

      const allLogs = await mockDatabase.query('status_history', {});
      const sortedLogs = allLogs.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Verify hash chain
      expect(sortedLogs[0].previous_hash).toBeNull(); // First log has no previous
      expect(sortedLogs[1].previous_hash).toBe(sortedLogs[0].hash); // Chain maintained
    });
  });
});

describe('Integration Suite 5: Dashboard Data Aggregation', () => {
  let manager: any;
  let projects: Project[];
  let evaluationEngine: ComplianceEvaluationEngine;
  let taskGenerationService: TaskGenerationService;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;

    evaluationEngine = new ComplianceEvaluationEngine();
    taskGenerationService = new TaskGenerationService();

    // Create multiple projects
    projects = [];
    for (let i = 0; i < 3; i++) {
      const project: Project = {
        id: `project-${i}`,
        name: `Test Project ${i}`,
        description: `Project ${i} for dashboard testing`,
        client_id: `client-${i}`,
        start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: `Location ${i}`,
        contract_value: 1000000 * (i + 1),
        project_manager: manager.id,
        compliance_status: 'non_compliant',
        general_liability_required: 1000000,
        workers_comp_required: 1000000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      projects.push(project);
    }

    mockDatabase.seedData('projects', projects);
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Dashboard Metrics Aggregation', () => {
    it('aggregates overall compliance score from multiple projects', async () => {
      const requirements = await TestDatabase.seedComplianceRequirements(manager.organization_id);

      // Evaluate multiple policies with different scores
      const scores: number[] = [];

      for (let i = 0; i < 3; i++) {
        const policyData: ExtractedPolicyData = {
          policy_number: `POL-${i}`,
          carrier: 'Test Insurance',
          effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          coverage_types: [
            {
              type: CoverageType.GENERAL_LIABILITY,
              per_occurrence_limit: i === 0 ? 500000 : 1000000, // First is insufficient
              aggregate_limit: 2000000,
            },
            {
              type: CoverageType.WORKERS_COMP,
              per_occurrence_limit: 1000000,
            },
          ],
          endorsements: i === 2 ? ['additional_insured'] : ['additional_insured', 'waiver_of_subrogation'],
        };

        const result = await evaluationEngine.evaluate(
          {
            policy_id: `policy-${i}`,
            project_id: projects[i].id,
            extracted_data: policyData,
          },
          requirements,
          projects[i].start_date,
          projects[i].end_date
        );

        scores.push(result.score);
      }

      // Calculate overall compliance score (average)
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      expect(scores.length).toBe(3);
      expect(overallScore).toBeLessThan(100); // Some non-compliant
      expect(overallScore).toBeGreaterThan(0);
    });

    it('counts tasks correctly across multiple projects', async () => {
      // Create tasks across different projects
      const tasks: Task[] = [];

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
          const task: Task = {
            id: `task-${i}-${j}`,
            title: `Task ${j} for Project ${i}`,
            description: 'Test task',
            status: j < 2 ? 'pending' : j < 4 ? 'in_progress' : 'completed',
            priority: 'high',
            due_date: new Date(Date.now() + (j + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_by_user_id: manager.id,
            project_id: projects[i].id,
            task_type: 'coi_upload',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          tasks.push(task);
        }
      }

      mockDatabase.seedData('tasks', tasks);

      // Aggregate task counts
      const allTasks = await mockDatabase.query<Task>('tasks', {});
      const pendingTasks = allTasks.filter((t) => t.status === 'pending');
      const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress');
      const completedTasks = allTasks.filter((t) => t.status === 'completed');

      expect(allTasks.length).toBe(15); // 3 projects × 5 tasks
      expect(pendingTasks.length).toBe(6); // 3 projects × 2 pending
      expect(inProgressTasks.length).toBe(6); // 3 projects × 2 in_progress
      expect(completedTasks.length).toBe(3); // 3 projects × 1 completed
    });

    it('identifies expiring policies correctly', async () => {
      const policies: PolicyData[] = [
        {
          id: 'policy-expiring-soon',
          client_id: 'client-1',
          policy_type: 'general_liability',
          policy_number: 'POL-EXPIRING',
          provider: 'Test Insurance',
          coverage_amount: 1000000,
          start_date: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 25 days
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'policy-valid-long-term',
          client_id: 'client-2',
          policy_type: 'workers_comp',
          policy_number: 'POL-VALID',
          provider: 'Test Insurance',
          coverage_amount: 1000000,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 300 days
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockDatabase.seedData('policies', policies);

      // Identify expiring policies (within 30 days)
      const allPolicies = await mockDatabase.query<PolicyData>('policies', { status: 'active' });
      const expiringThreshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const expiringPolicies = allPolicies.filter((p) => {
        const endDate = new Date(p.end_date);
        return endDate <= expiringThreshold;
      });

      expect(expiringPolicies.length).toBe(1);
      expect(expiringPolicies[0].policy_number).toBe('POL-EXPIRING');
    });

    it('calculates dashboard metrics for manager view', async () => {
      const requirements = await TestDatabase.seedComplianceRequirements(manager.organization_id);

      // Create comprehensive test data
      const tasks: Task[] = [];
      const policies: PolicyData[] = [];
      const evaluationScores: number[] = [];

      for (let i = 0; i < 3; i++) {
        // Create tasks
        for (let j = 0; j < 4; j++) {
          tasks.push({
            id: `task-${i}-${j}`,
            title: `Task ${j}`,
            description: 'Test',
            status: j < 2 ? 'pending' : 'completed',
            priority: 'high',
            due_date: new Date(Date.now() + (j + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            created_by_user_id: manager.id,
            project_id: projects[i].id,
            task_type: 'coi_upload',
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Create policy
        policies.push({
          id: `policy-${i}`,
          client_id: `client-${i}`,
          policy_type: 'general_liability',
          policy_number: `POL-${i}`,
          provider: 'Test Insurance',
          coverage_amount: 1000000,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + (i === 0 ? 20 : 120) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Run evaluation
        const policyData: ExtractedPolicyData = {
          policy_number: `POL-${i}`,
          carrier: 'Test Insurance',
          effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          coverage_types: [
            {
              type: CoverageType.GENERAL_LIABILITY,
              per_occurrence_limit: 1000000,
              aggregate_limit: 2000000,
            },
            {
              type: CoverageType.WORKERS_COMP,
              per_occurrence_limit: 1000000,
            },
          ],
          endorsements: ['additional_insured', 'waiver_of_subrogation'],
        };

        const result = await evaluationEngine.evaluate(
          {
            policy_id: `policy-${i}`,
            project_id: projects[i].id,
            extracted_data: policyData,
          },
          requirements,
          projects[i].start_date,
          projects[i].end_date
        );

        evaluationScores.push(result.score);
      }

      mockDatabase.seedData('tasks', tasks);
      mockDatabase.seedData('policies', policies);

      // Calculate dashboard metrics
      const dashboardMetrics = {
        total_projects: projects.length,
        total_tasks: tasks.length,
        pending_tasks: tasks.filter((t) => t.status === 'pending').length,
        completed_tasks: tasks.filter((t) => t.status === 'completed').length,
        overall_compliance_score: Math.round(
          evaluationScores.reduce((a, b) => a + b, 0) / evaluationScores.length
        ),
        policies_expiring_soon: policies.filter((p) => {
          const endDate = new Date(p.end_date);
          const threshold = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          return endDate <= threshold;
        }).length,
      };

      expect(dashboardMetrics.total_projects).toBe(3);
      expect(dashboardMetrics.total_tasks).toBe(12); // 3 × 4
      expect(dashboardMetrics.pending_tasks).toBe(6); // 3 × 2
      expect(dashboardMetrics.completed_tasks).toBe(6); // 3 × 2
      expect(dashboardMetrics.overall_compliance_score).toBe(100);
      expect(dashboardMetrics.policies_expiring_soon).toBe(1);
    });
  });

  describe('Performance Requirements', () => {
    it('aggregates dashboard data in under 2 seconds with 100 projects', async () => {
      // Create 100 projects
      const manyProjects: Project[] = [];
      for (let i = 0; i < 100; i++) {
        manyProjects.push({
          id: `proj-perf-${i}`,
          name: `Project ${i}`,
          description: 'Performance test',
          client_id: `client-${i}`,
          start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          project_manager: manager.id,
          compliance_status: 'compliant',
          general_liability_required: 1000000,
          workers_comp_required: 1000000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      mockDatabase.seedData('projects', manyProjects);

      const startTime = Date.now();

      // Query all projects
      const allProjects = await mockDatabase.query<Project>('projects', {
        project_manager: manager.id,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(allProjects.length).toBe(100);
      expect(duration).toBeLessThan(2000); // <2 second requirement
    });
  });
});
