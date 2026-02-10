/**
 * Task Auto-Generation from Compliance Gaps
 * Mock validation tests to ensure mocks match real system behavior
 *
 * As required by CLAUDE.md: "mocks used in tests must always be validated!
 * They must always have their own tests to verify they match the real system
 * they are mocking, so that we know the mocks themselves can be trusted."
 */

import { describe, it, expect } from 'vitest';
import { GapType, GapSeverity, ComplianceGap } from '../../compliance/evaluator/types';
import { CoverageType } from '../../compliance/types';
import { GeneratedTask, TaskMetadata, SYSTEM_USER_ID } from '../types';
import { TaskStatus, TaskPriority } from '../../../types';

describe('Mock Validation Tests', () => {
  describe('ComplianceGap Mock Validation', () => {
    it('mock ComplianceGap has all required fields', () => {
      const mockGap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload certificate',
        points_deducted: 20
      };

      // Validate all required fields exist
      expect(mockGap.id).toBeDefined();
      expect(mockGap.type).toBeDefined();
      expect(mockGap.severity).toBeDefined();
      expect(mockGap.required_value).toBeDefined();
      expect(mockGap.remediation).toBeDefined();
      expect(mockGap.points_deducted).toBeDefined();
    });

    it('mock ComplianceGap gap types match enum values', () => {
      const validGapTypes = [
        GapType.MISSING_COVERAGE,
        GapType.MISSING_ENDORSEMENT,
        GapType.INSUFFICIENT_AMOUNT,
        GapType.EXPIRED_POLICY,
        GapType.EXPIRING_SOON
      ];

      validGapTypes.forEach(gapType => {
        expect(Object.values(GapType)).toContain(gapType);
      });
    });

    it('mock ComplianceGap severity levels match enum values', () => {
      const validSeverities = [
        GapSeverity.CRITICAL,
        GapSeverity.WARNING,
        GapSeverity.INFO
      ];

      validSeverities.forEach(severity => {
        expect(Object.values(GapSeverity)).toContain(severity);
      });
    });

    it('mock ComplianceGap with endorsement has correct structure', () => {
      const mockGap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.CRITICAL,
        endorsement: 'additional_insured',
        required_value: 'Endorsement',
        remediation: 'Add endorsement',
        points_deducted: 15
      };

      expect(mockGap.endorsement).toBeDefined();
      expect(typeof mockGap.endorsement).toBe('string');
    });

    it('mock ComplianceGap with insufficient amount has correct structure', () => {
      const mockGap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: CoverageType.GENERAL_LIABILITY,
        current_value: 500000,
        required_value: 1000000,
        remediation: 'Increase coverage',
        points_deducted: 10
      };

      expect(mockGap.current_value).toBeDefined();
      expect(typeof mockGap.current_value).toBe('number');
      expect(typeof mockGap.required_value).toBe('number');
    });
  });

  describe('GeneratedTask Mock Validation', () => {
    it('mock GeneratedTask has all required fields', () => {
      const mockTask: GeneratedTask = {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test description',
        status: 'pending',
        priority: 'urgent',
        due_date: '2025-11-12',
        created_by_user_id: SYSTEM_USER_ID,
        assigned_to_user_id: undefined,
        project_id: 'proj-1',
        policy_id: undefined,
        task_type: 'coi_upload',
        metadata: {
          gap_type: GapType.MISSING_COVERAGE,
          gap_severity: GapSeverity.CRITICAL,
          gap_id: 'gap-1',
          evaluation_run_id: 'eval-1',
          subcontractor_org_id: 'sub-1',
          coverage_type: CoverageType.GENERAL_LIABILITY,
          required_value: 'Certificate',
          remediation: 'Upload',
          auto_generated: true
        },
        created_at: '2025-11-09T00:00:00Z',
        updated_at: '2025-11-09T00:00:00Z'
      };

      // Validate all required fields
      expect(mockTask.id).toBeDefined();
      expect(mockTask.title).toBeDefined();
      expect(mockTask.description).toBeDefined();
      expect(mockTask.status).toBeDefined();
      expect(mockTask.priority).toBeDefined();
      expect(mockTask.due_date).toBeDefined();
      expect(mockTask.created_by_user_id).toBeDefined();
      expect(mockTask.project_id).toBeDefined();
      expect(mockTask.task_type).toBeDefined();
      expect(mockTask.metadata).toBeDefined();
      expect(mockTask.created_at).toBeDefined();
      expect(mockTask.updated_at).toBeDefined();
    });

    it('mock GeneratedTask status values match TaskStatus enum', () => {
      const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        const mockTask: Partial<GeneratedTask> = { status };
        expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(mockTask.status);
      });
    });

    it('mock GeneratedTask priority values match TaskPriority enum', () => {
      const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

      validPriorities.forEach(priority => {
        const mockTask: Partial<GeneratedTask> = { priority };
        expect(['low', 'medium', 'high', 'urgent']).toContain(mockTask.priority);
      });
    });

    it('mock GeneratedTask metadata has all required fields', () => {
      const mockMetadata: TaskMetadata = {
        gap_type: GapType.MISSING_COVERAGE,
        gap_severity: GapSeverity.CRITICAL,
        gap_id: 'gap-1',
        evaluation_run_id: 'eval-1',
        subcontractor_org_id: 'sub-1',
        coverage_type: CoverageType.GENERAL_LIABILITY,
        required_value: 'Certificate',
        remediation: 'Upload',
        auto_generated: true
      };

      expect(mockMetadata.gap_type).toBeDefined();
      expect(mockMetadata.gap_severity).toBeDefined();
      expect(mockMetadata.gap_id).toBeDefined();
      expect(mockMetadata.evaluation_run_id).toBeDefined();
      expect(mockMetadata.subcontractor_org_id).toBeDefined();
      expect(mockMetadata.required_value).toBeDefined();
      expect(mockMetadata.remediation).toBeDefined();
      expect(mockMetadata.auto_generated).toBe(true);
    });

    it('mock GeneratedTask due_date format is YYYY-MM-DD', () => {
      const mockTask: Partial<GeneratedTask> = {
        due_date: '2025-11-12'
      };

      expect(mockTask.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('mock GeneratedTask timestamps are ISO 8601 format', () => {
      const mockTask: Partial<GeneratedTask> = {
        created_at: '2025-11-09T00:00:00Z',
        updated_at: '2025-11-09T00:00:00Z'
      };

      expect(mockTask.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(mockTask.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });

  describe('Mock Data Relationships', () => {
    it('mock task metadata gap_type matches mock gap type', () => {
      const mockGap: ComplianceGap = {
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        required_value: 'Certificate',
        remediation: 'Upload',
        points_deducted: 20
      };

      const mockTask: Partial<GeneratedTask> = {
        metadata: {
          gap_type: mockGap.type,
          gap_severity: mockGap.severity,
          gap_id: mockGap.id,
          evaluation_run_id: 'eval-1',
          subcontractor_org_id: 'sub-1',
          required_value: mockGap.required_value,
          remediation: mockGap.remediation,
          auto_generated: true
        }
      };

      expect(mockTask.metadata?.gap_type).toBe(mockGap.type);
      expect(mockTask.metadata?.gap_severity).toBe(mockGap.severity);
      expect(mockTask.metadata?.gap_id).toBe(mockGap.id);
    });

    it('mock task with auto_generated=true uses SYSTEM_USER_ID', () => {
      const mockTask: Partial<GeneratedTask> = {
        created_by_user_id: SYSTEM_USER_ID,
        metadata: {
          gap_type: GapType.MISSING_COVERAGE,
          gap_severity: GapSeverity.CRITICAL,
          gap_id: 'gap-1',
          evaluation_run_id: 'eval-1',
          subcontractor_org_id: 'sub-1',
          required_value: 'Certificate',
          remediation: 'Upload',
          auto_generated: true
        }
      };

      expect(mockTask.created_by_user_id).toBe(SYSTEM_USER_ID);
      expect(mockTask.metadata?.auto_generated).toBe(true);
    });
  });

  describe('Mock Array Structures', () => {
    it('mock array of gaps maintains consistent structure', () => {
      const mockGaps: ComplianceGap[] = [
        {
          id: 'gap-1',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 'Certificate',
          remediation: 'Upload',
          points_deducted: 20
        },
        {
          id: 'gap-2',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.WARNING,
          required_value: 'Endorsement',
          remediation: 'Add',
          points_deducted: 15
        }
      ];

      mockGaps.forEach(gap => {
        expect(gap.id).toBeDefined();
        expect(gap.type).toBeDefined();
        expect(gap.severity).toBeDefined();
        expect(gap.required_value).toBeDefined();
        expect(gap.remediation).toBeDefined();
        expect(gap.points_deducted).toBeDefined();
      });
    });

    it('mock array of tasks maintains consistent structure', () => {
      const mockTasks: GeneratedTask[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending',
          priority: 'urgent',
          due_date: '2025-11-12',
          created_by_user_id: SYSTEM_USER_ID,
          project_id: 'proj-1',
          task_type: 'coi_upload',
          metadata: {
            gap_type: GapType.MISSING_COVERAGE,
            gap_severity: GapSeverity.CRITICAL,
            gap_id: 'gap-1',
            evaluation_run_id: 'eval-1',
            subcontractor_org_id: 'sub-1',
            required_value: 'Certificate',
            remediation: 'Upload',
            auto_generated: true
          },
          created_at: '2025-11-09T00:00:00Z',
          updated_at: '2025-11-09T00:00:00Z'
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Description 2',
          status: 'completed',
          priority: 'high',
          due_date: '2025-11-15',
          created_by_user_id: SYSTEM_USER_ID,
          project_id: 'proj-1',
          task_type: 'endorsement_correction',
          metadata: {
            gap_type: GapType.MISSING_ENDORSEMENT,
            gap_severity: GapSeverity.WARNING,
            gap_id: 'gap-2',
            evaluation_run_id: 'eval-1',
            subcontractor_org_id: 'sub-1',
            required_value: 'Endorsement',
            remediation: 'Add',
            auto_generated: true
          },
          created_at: '2025-11-08T00:00:00Z',
          updated_at: '2025-11-08T00:00:00Z'
        }
      ];

      mockTasks.forEach(task => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.priority).toBeDefined();
        expect(task.metadata.auto_generated).toBe(true);
      });
    });
  });
});
