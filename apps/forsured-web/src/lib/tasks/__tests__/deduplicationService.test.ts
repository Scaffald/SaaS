/**
 * REQ-127: Task Auto-Generation from Compliance Gaps
 * Unit tests for deduplication service (TDD - Red phase)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeduplicationService } from '../deduplicationService';
import { GapType, GapSeverity, ComplianceGap } from '../../compliance/evaluator/types';
import { CoverageType } from '../../compliance/types';
import { GeneratedTask } from '../types';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let mockExistingTasks: GeneratedTask[];

  beforeEach(() => {
    service = new DeduplicationService();

    // Set up mock existing tasks
    mockExistingTasks = [
      {
        id: 'task-1',
        title: 'Upload General Liability Certificate',
        description: 'Test description',
        status: 'pending',
        priority: 'urgent',
        due_date: '2025-11-12',
        created_by_user_id: 'system',
        project_id: 'proj-1',
        policy_id: 'pol-1',
        task_type: 'coi_upload',
        metadata: {
          gap_type: GapType.MISSING_COVERAGE,
          gap_severity: GapSeverity.CRITICAL,
          gap_id: 'gap-1',
          evaluation_run_id: 'eval-1',
          subcontractor_org_id: 'sub-1',
          coverage_type: CoverageType.GENERAL_LIABILITY,
          required_value: 'Certificate',
          remediation: 'Upload certificate',
          auto_generated: true
        },
        created_at: '2025-11-09T00:00:00Z',
        updated_at: '2025-11-09T00:00:00Z'
      }
    ];
  });

  describe('generateKey', () => {
    it('generates consistent key for same gap parameters', () => {
      const gap1: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const key1 = service.generateKey(gap1, 'sub-1', 'proj-1', 'pol-1');
      const key2 = service.generateKey(gap1, 'sub-1', 'proj-1', 'pol-1');

      expect(key1).toBe(key2);
    });

    it('generates different keys for different gap types', () => {
      const gap1: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const gap2: ComplianceGap = {
        id: 'gap-2',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        required_value: 'Endorsement',
        remediation: 'Add',
        points_deducted: 15
      };

      const key1 = service.generateKey(gap1, 'sub-1', 'proj-1', 'pol-1');
      const key2 = service.generateKey(gap2, 'sub-1', 'proj-1', 'pol-1');

      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different subcontractors', () => {
      const gap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const key1 = service.generateKey(gap, 'sub-1', 'proj-1', 'pol-1');
      const key2 = service.generateKey(gap, 'sub-2', 'proj-1', 'pol-1');

      expect(key1).not.toBe(key2);
    });

    it('includes coverage type in key for coverage gaps', () => {
      const gap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const key = service.generateKey(gap, 'sub-1', 'proj-1', 'pol-1');

      expect(key).toContain(CoverageType.GENERAL_LIABILITY);
    });

    it('includes endorsement in key for endorsement gaps', () => {
      const gap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        endorsement: 'additional_insured',
        required_value: 'Endorsement',
        remediation: 'Add',
        points_deducted: 15
      };

      const key = service.generateKey(gap, 'sub-1', 'proj-1', 'pol-1');

      expect(key).toContain('additional_insured');
    });
  });

  describe('checkForDuplicates', () => {
    it('returns create action when no matching task exists', () => {
      const newGap: ComplianceGap = {
        id: 'gap-2',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        endorsement: 'waiver_of_subrogation',
        required_value: 'Endorsement',
        remediation: 'Add',
        points_deducted: 15
      };

      const result = service.checkForDuplicates(
        newGap,
        'sub-1',
        'proj-1',
        'pol-1',
        mockExistingTasks
      );

      expect(result.action).toBe('create');
      expect(result.existing_task_id).toBeUndefined();
    });

    it('returns update action when matching open task exists', () => {
      const matchingGap: ComplianceGap = {
        id: 'gap-new',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const result = service.checkForDuplicates(
        matchingGap,
        'sub-1',
        'proj-1',
        'pol-1',
        mockExistingTasks
      );

      expect(result.action).toBe('update');
      expect(result.existing_task_id).toBe('task-1');
      expect(result.reason).toContain('open task exists');
    });

    it('returns create action when matching closed task exists', () => {
      const closedTask = {
        ...mockExistingTasks[0],
        status: 'completed' as const
      };

      const matchingGap: ComplianceGap = {
        id: 'gap-new',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const result = service.checkForDuplicates(
        matchingGap,
        'sub-1',
        'proj-1',
        'pol-1',
        [closedTask]
      );

      expect(result.action).toBe('create');
      expect(result.existing_task_id).toBe('task-1'); // Historical link
      expect(result.reason).toContain('closed');
    });

    it('considers cancelled tasks as closed', () => {
      const cancelledTask = {
        ...mockExistingTasks[0],
        status: 'cancelled' as const
      };

      const matchingGap: ComplianceGap = {
        id: 'gap-new',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const result = service.checkForDuplicates(
        matchingGap,
        'sub-1',
        'proj-1',
        'pol-1',
        [cancelledTask]
      );

      expect(result.action).toBe('create');
    });

    it('finds matching task regardless of gap ID', () => {
      const matchingGap: ComplianceGap = {
        id: 'different-gap-id',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const result = service.checkForDuplicates(
        matchingGap,
        'sub-1',
        'proj-1',
        'pol-1',
        mockExistingTasks
      );

      expect(result.action).toBe('update');
    });
  });

  describe('shouldUpdateTask', () => {
    it('returns true for pending tasks', () => {
      const task = mockExistingTasks[0];
      expect(service.shouldUpdateTask(task)).toBe(true);
    });

    it('returns true for in_progress tasks', () => {
      const task = { ...mockExistingTasks[0], status: 'in_progress' as const };
      expect(service.shouldUpdateTask(task)).toBe(true);
    });

    it('returns false for completed tasks', () => {
      const task = { ...mockExistingTasks[0], status: 'completed' as const };
      expect(service.shouldUpdateTask(task)).toBe(false);
    });

    it('returns false for cancelled tasks', () => {
      const task = { ...mockExistingTasks[0], status: 'cancelled' as const };
      expect(service.shouldUpdateTask(task)).toBe(false);
    });
  });

  describe('batch deduplication', () => {
    it('processes multiple gaps efficiently', () => {
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
          endorsement: 'waiver_of_subrogation',
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

      const results = gaps.map(gap =>
        service.checkForDuplicates(gap, 'sub-1', 'proj-1', 'pol-1', mockExistingTasks)
      );

      expect(results).toHaveLength(3);
      expect(results[0].action).toBe('update'); // Matches existing
      expect(results[1].action).toBe('create'); // New endorsement
      expect(results[2].action).toBe('create'); // New insufficient amount
    });
  });
});
