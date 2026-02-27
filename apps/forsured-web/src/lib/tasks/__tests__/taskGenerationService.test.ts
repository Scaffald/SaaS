/**
 * Task Auto-Generation from Compliance Gaps
 * Integration tests for main task generation service (TDD - Red phase)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskGenerationService } from '../taskGenerationService';
import { GapType, GapSeverity, ComplianceGap } from '../../compliance/evaluator/types';
import { CoverageType } from '../../compliance/types';
import { TaskGenerationRequest, GeneratedTask } from '../types';

describe('TaskGenerationService', () => {
  let service: TaskGenerationService;
  let mockExistingTasks: GeneratedTask[];

  beforeEach(() => {
    service = new TaskGenerationService();
    mockExistingTasks = [];
  });

  describe('generateTasks', () => {
    it('generates task for single gap', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-1',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload certificate',
            points_deducted: 20
          }
        ]
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.tasks_created).toBe(1);
      expect(result.tasks_updated).toBe(0);
      expect(result.tasks_skipped).toBe(0);
      expect(result.task_ids).toHaveLength(1);
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0); // Can be 0 for fast operations
    });

    it('generates tasks for multiple gaps', async () => {
      const gaps: ComplianceGap[] = [
        {
          id: 'gap-1',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          coverage_type: CoverageType.GENERAL_LIABILITY,
          required_value: 'Certificate',
          remediation: 'Upload',
          points_deducted: 20
        },
        {
          id: 'gap-2',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.CRITICAL,
          endorsement: 'additional_insured',
          required_value: 'Endorsement',
          remediation: 'Add',
          points_deducted: 15
        },
        {
          id: 'gap-3',
          type: GapType.INSUFFICIENT_AMOUNT,
          severity: GapSeverity.WARNING,
          coverage_type: CoverageType.GENERAL_LIABILITY,
          current_value: 500000,
          required_value: 1000000,
          remediation: 'Increase',
          points_deducted: 10
        }
      ];

      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.tasks_created).toBe(3);
      expect(result.task_ids).toHaveLength(3);
    });

    it('creates task with correct title from template', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-1',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const tasks = await service.generateTaskObjects(request, mockExistingTasks);

      expect(tasks[0].title).toContain('Upload');
      expect(tasks[0].title).toContain('General Liability');
    });

    it('creates task with correct priority based on severity', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-1',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const tasks = await service.generateTaskObjects(request, mockExistingTasks);

      expect(tasks[0].priority).toBe('urgent'); // CRITICAL maps to urgent
    });

    it('creates task with correct due date based on severity', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-1',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const tasks = await service.generateTaskObjects(request, mockExistingTasks);

      const dueDate = new Date(tasks[0].due_date);
      const now = new Date();
      const daysDiff = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBeGreaterThanOrEqual(2); // CRITICAL severity = 3 days (allow 2-3 for timing)
      expect(daysDiff).toBeLessThanOrEqual(3);
    });

    it('includes compliance metadata in task', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-1',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const tasks = await service.generateTaskObjects(request, mockExistingTasks);

      expect(tasks[0].metadata.gap_type).toBe(GapType.MISSING_COVERAGE);
      expect(tasks[0].metadata.gap_severity).toBe(GapSeverity.CRITICAL);
      expect(tasks[0].metadata.gap_id).toBe('gap-1');
      expect(tasks[0].metadata.evaluation_run_id).toBe('eval-1');
      expect(tasks[0].metadata.subcontractor_org_id).toBe('sub-1');
      expect(tasks[0].metadata.auto_generated).toBe(true);
    });

    it('handles empty gaps array', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-1',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: []
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.tasks_created).toBe(0);
      expect(result.task_ids).toHaveLength(0);
    });
  });

  describe('deduplication integration', () => {
    beforeEach(() => {
      mockExistingTasks = [
        {
          id: 'task-1',
          title: 'Existing Task',
          description: 'Test',
          status: 'pending',
          priority: 'urgent',
          due_date: '2025-11-12',
          created_by_user_id: 'system',
          project_id: 'proj-1',
          task_type: 'coi_upload',
          metadata: {
            gap_type: GapType.MISSING_COVERAGE,
            gap_severity: GapSeverity.CRITICAL,
            gap_id: 'old-gap',
            evaluation_run_id: 'eval-old',
            subcontractor_org_id: 'sub-1',
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            auto_generated: true
          },
          created_at: '2025-11-01T00:00:00Z',
          updated_at: '2025-11-01T00:00:00Z'
        }
      ];
    });

    it('skips creating duplicate task when open task exists', async () => {
      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-2',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-new',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.tasks_created).toBe(0);
      expect(result.tasks_updated).toBe(1);
      expect(result.tasks_skipped).toBe(0);
    });

    it('creates new task when closed task exists', async () => {
      mockExistingTasks[0].status = 'completed';

      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-2',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps: [
          {
            id: 'gap-new',
            type: GapType.MISSING_COVERAGE,
            severity: GapSeverity.CRITICAL,
            coverage_type: CoverageType.GENERAL_LIABILITY,
            required_value: 'Certificate',
            remediation: 'Upload',
            points_deducted: 20
          }
        ]
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.tasks_created).toBe(1);
      expect(result.tasks_updated).toBe(0);
    });
  });

  describe('performance requirements', () => {
    it('processes 50 gaps in under 1 second', async () => {
      const gaps: ComplianceGap[] = [];

      // Generate 50 diverse gaps
      for (let i = 0; i < 50; i++) {
        const gapTypes = [
          GapType.MISSING_COVERAGE,
          GapType.MISSING_ENDORSEMENT,
          GapType.INSUFFICIENT_AMOUNT,
          GapType.EXPIRED_POLICY,
          GapType.EXPIRING_SOON
        ];

        gaps.push({
          id: `gap-${i}`,
          type: gapTypes[i % 5],
          severity: i % 3 === 0 ? GapSeverity.CRITICAL : GapSeverity.WARNING,
          coverage_type: i % 2 === 0 ? CoverageType.GENERAL_LIABILITY : CoverageType.WORKERS_COMP,
          endorsement: i % 5 === 1 ? 'additional_insured' : undefined,
          current_value: i % 5 === 2 ? 500000 : undefined,
          required_value: i % 5 === 2 ? 1000000 : 'Required',
          remediation: 'Fix this issue',
          points_deducted: 10
        });
      }

      const request: TaskGenerationRequest = {
        evaluation_run_id: 'eval-perf',
        project_id: 'proj-1',
        subcontractor_org_id: 'sub-1',
        gaps
      };

      const result = await service.generateTasks(request, mockExistingTasks);

      expect(result.processing_time_ms).toBeLessThan(1000); // <1 second requirement
      expect(result.tasks_created).toBe(50);
    });
  });
});
