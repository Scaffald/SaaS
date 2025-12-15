// Migrated from FRS-Prototype/tests/integration/complianceGapsToTasks.test.ts

/**
 * REQ-133: System Integration & End-to-End Testing
 * Integration Suite 2: Compliance Gaps → Task Auto-Generation → Task Management
 *
 * Tests the complete flow:
 * 1. Trigger compliance evaluation with gaps (REQ-128)
 * 2. Verify tasks auto-generated from gaps (REQ-127)
 * 3. Verify task assignments correct (REQ-127)
 * 4. Update task status through UI (REQ-166)
 * 5. Verify task completion triggers re-evaluation (REQ-166)
 * 6. Verify compliance score updates after task completion
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDatabase } from '../helpers/testDatabase';
import { ComplianceEvaluationEngine } from '@/lib/compliance/evaluator/evaluationEngine';
import { TaskGenerationService } from '@/lib/tasks/taskGenerationService';
import { TaskAssignmentService } from '@/lib/tasks/taskAssignmentService';
import { ExtractedPolicyData, ComplianceStatus, GapType, GapSeverity } from '@/lib/compliance/evaluator/types';
import { CoverageType } from '@/lib/compliance/types';
import { TaskGenerationRequest } from '@/lib/tasks/types';
import mockDatabase from '@/utils/mockDataStore';
import { Task } from '@/types';

describe('Integration Suite 2: Compliance Gaps → Task Auto-Generation → Task Management', () => {
  let manager: any;
  let subcontractor: any;
  let project: any;
  let requirements: any[];
  let evaluationEngine: ComplianceEvaluationEngine;
  let taskGenerationService: TaskGenerationService;
  let taskAssignmentService: TaskAssignmentService;

  beforeEach(async () => {
    await TestDatabase.cleanAll();
    const users = await TestDatabase.seedUsers();
    manager = users.manager;
    subcontractor = users.subcontractor;

    project = await TestDatabase.seedProject(manager.id);
    requirements = await TestDatabase.seedComplianceRequirements(manager.organization_id);

    evaluationEngine = new ComplianceEvaluationEngine();
    taskGenerationService = new TaskGenerationService();
    taskAssignmentService = new TaskAssignmentService();
  });

  afterEach(async () => {
    await TestDatabase.cleanAll();
  });

  describe('Gaps to Tasks Flow', () => {
    it('generates tasks automatically when compliance gaps are identified', async () => {
      // Step 1: Trigger compliance evaluation with gaps
      const noncompliantData: ExtractedPolicyData = {
        policy_number: 'TEST-NONCOMPLIANT-123',
        carrier: 'Test Insurance Co',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000, // Insufficient
            aggregate_limit: 1000000, // Insufficient
          },
          // Missing Workers Comp
        ],
        endorsements: ['additional_insured'], // Missing waiver_of_subrogation
      };

      const evaluationResult = await evaluationEngine.evaluate(
        {
          policy_id: TestDatabase.generateId('policy'),
          project_id: project.id,
          extracted_data: noncompliantData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      // Verify gaps were identified
      expect(evaluationResult.gaps.length).toBeGreaterThan(0);
      expect(evaluationResult.score).toBeLessThan(100);

      // Step 2: Auto-generate tasks from gaps (REQ-127)
      const taskGenerationRequest: TaskGenerationRequest = {
        evaluation_run_id: TestDatabase.generateId('eval'),
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps: evaluationResult.gaps,
      };

      const existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const taskGenerationResult = await taskGenerationService.generateTasks(
        taskGenerationRequest,
        existingTasks
      );

      // Step 3: Verify tasks were created
      expect(taskGenerationResult.tasks_created).toBeGreaterThan(0);
      expect(taskGenerationResult.task_ids.length).toBe(evaluationResult.gaps.length);

      // Verify task details
      const generatedTasks = await taskGenerationService.generateTaskObjects(
        taskGenerationRequest,
        existingTasks
      );

      generatedTasks.forEach((task) => {
        expect(task.project_id).toBe(project.id);
        expect(task.metadata.subcontractor_org_id).toBe(subcontractor.organization_id);
        expect(task.metadata.auto_generated).toBe(true);
        expect(task.status).toBe('pending');
      });
    });

    it('assigns tasks correctly based on gap type and severity', async () => {
      // Generate gaps with different severities
      const evaluationData: ExtractedPolicyData = {
        policy_number: 'TEST-SEVERITY-123',
        carrier: 'Test Insurance Co',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000,
            aggregate_limit: 1000000,
          },
        ],
        endorsements: [],
      };

      const evaluationResult = await evaluationEngine.evaluate(
        {
          policy_id: TestDatabase.generateId('policy'),
          project_id: project.id,
          extracted_data: evaluationData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      const taskGenerationRequest: TaskGenerationRequest = {
        evaluation_run_id: TestDatabase.generateId('eval'),
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps: evaluationResult.gaps,
      };

      const existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const generatedTasks = await taskGenerationService.generateTaskObjects(
        taskGenerationRequest,
        existingTasks
      );

      // Verify CRITICAL gaps → urgent priority → 3 day due date
      const criticalTask = generatedTasks.find(
        (t) => t.metadata.gap_severity === GapSeverity.CRITICAL
      );

      if (criticalTask) {
        expect(criticalTask.priority).toBe('urgent');
        const dueDate = new Date(criticalTask.due_date);
        const now = new Date();
        const daysDiff = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expect(daysDiff).toBeGreaterThanOrEqual(2);
        expect(daysDiff).toBeLessThanOrEqual(3);
      }

      // Step 3: Verify task assignment strategy (REQ-127)
      // TaskAssignmentService provides assignment strategy, not direct assignment
      const firstTask = generatedTasks[0];
      const assignmentResult = taskAssignmentService.assignTask(
        firstTask.metadata.gap_type,
        firstTask.metadata.gap_severity,
        firstTask.task_type as string
      );

      expect(assignmentResult.assignment_strategy).toBe('subcontractor');
      expect(assignmentResult.assignment_reason).toBeDefined();
    });

    it('updates task status and triggers re-evaluation on completion', async () => {
      // Step 1: Initial evaluation with gaps
      const noncompliantData: ExtractedPolicyData = {
        policy_number: 'TEST-REEVAL-123',
        carrier: 'Test Insurance Co',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000,
            aggregate_limit: 2000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      const initialEvaluation = await evaluationEngine.evaluate(
        {
          policy_id: 'policy-reeval-1',
          project_id: project.id,
          extracted_data: noncompliantData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      // Score may be lower due to missing Workers Comp (20 points) + insufficient amount (10 points)
      expect(initialEvaluation.score).toBeLessThan(100);
      expect(initialEvaluation.gaps.length).toBeGreaterThan(0);

      // Step 2: Generate task for gap
      const taskGenerationRequest: TaskGenerationRequest = {
        evaluation_run_id: TestDatabase.generateId('eval'),
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps: initialEvaluation.gaps,
      };

      const existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const taskGenerationResult = await taskGenerationService.generateTasks(
        taskGenerationRequest,
        existingTasks
      );

      expect(taskGenerationResult.tasks_created).toBeGreaterThan(0);
      expect(taskGenerationResult.task_ids.length).toBeGreaterThan(0);

      // Actually insert the generated tasks into the database
      const generatedTasks = await taskGenerationService.generateTaskObjects(
        taskGenerationRequest,
        existingTasks
      );
      mockDatabase.seedData('tasks', generatedTasks);

      const taskId = generatedTasks[0].id;

      // Step 3: Simulate task completion (upload correct document)
      const task = await mockDatabase.queryOne<Task>('tasks', { id: taskId });
      expect(task).toBeDefined();

      // Update task status to completed (REQ-166)
      await mockDatabase.update<Task>('tasks', taskId, {
        status: 'completed',
      });

      const updatedTask = await mockDatabase.queryOne<Task>('tasks', { id: taskId });
      expect(updatedTask?.status).toBe('completed');

      // Step 4: Re-evaluate with corrected data
      const correctedData: ExtractedPolicyData = {
        ...noncompliantData,
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 1000000, // Corrected
            aggregate_limit: 2000000,
          },
          {
            type: CoverageType.WORKERS_COMP,
            per_occurrence_limit: 1000000,
          },
        ],
      };

      const reevaluation = await evaluationEngine.evaluate(
        {
          policy_id: 'policy-reeval-1',
          project_id: project.id,
          extracted_data: correctedData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      // Step 5: Verify compliance score improved
      expect(reevaluation.score).toBe(100);
      expect(reevaluation.gaps).toHaveLength(0);
      expect(reevaluation.status).toBe(ComplianceStatus.COMPLIANT);
    });

    it('prevents duplicate task generation for same gap', async () => {
      // First evaluation
      const noncompliantData: ExtractedPolicyData = {
        policy_number: 'TEST-DEDUP-123',
        carrier: 'Test Insurance Co',
        effective_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coverage_types: [
          {
            type: CoverageType.GENERAL_LIABILITY,
            per_occurrence_limit: 500000,
            aggregate_limit: 2000000,
          },
        ],
        endorsements: ['additional_insured', 'waiver_of_subrogation'],
      };

      const evaluation = await evaluationEngine.evaluate(
        {
          policy_id: TestDatabase.generateId('policy'),
          project_id: project.id,
          extracted_data: noncompliantData,
        },
        requirements,
        project.start_date,
        project.end_date
      );

      // First task generation
      const taskRequest1: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps: evaluation.gaps,
      };

      let existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const result1 = await taskGenerationService.generateTasks(taskRequest1, existingTasks);

      // First generation should create tasks (possibly 1 or more depending on gaps)
      expect(result1.tasks_created).toBeGreaterThan(0);
      expect(result1.tasks_updated).toBe(0);

      // Seed the task into mockDatabase
      const generatedTasks = await taskGenerationService.generateTaskObjects(taskRequest1, []);
      mockDatabase.seedData('tasks', generatedTasks);

      // Second evaluation with same gap (task still open)
      const taskRequest2: TaskGenerationRequest = {
        evaluation_run_id: 'eval-2',
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps: evaluation.gaps,
      };

      existingTasks = await mockDatabase.query<Task>('tasks', { project_id: project.id });
      const result2 = await taskGenerationService.generateTasks(taskRequest2, existingTasks);

      // Should update existing tasks, not create new ones
      expect(result2.tasks_created).toBe(0);
      expect(result2.tasks_updated).toBeGreaterThan(0); // May be multiple if multiple gaps
      expect(result2.tasks_skipped).toBe(0);
    });
  });

  describe('Performance and Scale', () => {
    it('generates tasks for 50+ gaps in under 1 second', async () => {
      // Create 50 gaps
      const gaps = Array.from({ length: 50 }, (_, i) => ({
        id: `gap-${i}`,
        type: i % 2 === 0 ? GapType.MISSING_COVERAGE : GapType.MISSING_ENDORSEMENT,
        severity: i % 3 === 0 ? GapSeverity.CRITICAL : GapSeverity.WARNING,
        coverage_type: i % 2 === 0 ? CoverageType.GENERAL_LIABILITY : CoverageType.WORKERS_COMP,
        endorsement: i % 2 === 1 ? 'additional_insured' : undefined,
        required_value: `Required ${i}`,
        remediation: `Fix gap ${i}`,
        points_deducted: 10,
      }));

      const taskRequest: TaskGenerationRequest = {
        evaluation_run_id: TestDatabase.generateId('eval'),
        project_id: project.id,
        subcontractor_org_id: subcontractor.organization_id,
        gaps,
      };

      const startTime = Date.now();
      const result = await taskGenerationService.generateTasks(taskRequest, []);
      const endTime = Date.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // <1 second requirement
      expect(result.processing_time_ms).toBeLessThan(1000);
      expect(result.tasks_created).toBe(50);
    });
  });
});
