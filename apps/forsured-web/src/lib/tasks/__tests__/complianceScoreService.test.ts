/**
 * REQ-259: Task Status Auto-Save
 * TASK-4: Tests for compliance score service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isComplianceRelatedTask,
  shouldUpdateComplianceScore,
  calculateProjectComplianceScore,
  updateComplianceScoreOnStatusChange,
} from '../complianceScoreService';
import { Task } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';

describe('complianceScoreService', () => {
  const mockComplianceTask: Task = {
    id: 'task-123',
    title: 'Upload COI for Project',
    description: 'Upload certificate of insurance',
    status: 'pending',
    priority: 'high',
    due_date: '2025-12-31',
    created_by_user_id: 'user-1',
    assigned_to_user_id: 'user-2',
    project_id: 'project-1',
    task_type: 'coi_upload', // Compliance-related type
    severity: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockNonComplianceTask: Task = {
    id: 'task-456',
    title: 'Review proposal',
    description: 'Review the proposal document',
    status: 'pending',
    priority: 'medium',
    due_date: '2025-12-31',
    created_by_user_id: 'user-1',
    assigned_to_user_id: 'user-2',
    project_id: 'project-1',
    task_type: 'general', // Not compliance-related
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    MockDatabase.clearTable('tasks');
    MockDatabase.clearTable('projects');
  });

  afterEach(() => {
    MockDatabase.clearTable('tasks');
    MockDatabase.clearTable('projects');
  });

  describe('isComplianceRelatedTask', () => {
    it('should return true for coi_upload task type', () => {
      expect(isComplianceRelatedTask(mockComplianceTask)).toBe(true);
    });

    it('should return true for endorsement_correction task type', () => {
      const task: Task = { ...mockNonComplianceTask, task_type: 'endorsement_correction' };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return true for coverage_increase task type', () => {
      const task: Task = { ...mockNonComplianceTask, task_type: 'coverage_increase' };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return true for policy_renewal task type', () => {
      const task: Task = { ...mockNonComplianceTask, task_type: 'policy_renewal' };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return true for task with gap_type in metadata', () => {
      const task: Task = {
        ...mockNonComplianceTask,
        metadata: { gap_type: 'MISSING_COVERAGE' },
      };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return true for task with gap_id in metadata', () => {
      const task: Task = {
        ...mockNonComplianceTask,
        metadata: { gap_id: 'gap-123' },
      };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return true for task with evaluation_run_id in metadata', () => {
      const task: Task = {
        ...mockNonComplianceTask,
        metadata: { evaluation_run_id: 'eval-123' },
      };
      expect(isComplianceRelatedTask(task)).toBe(true);
    });

    it('should return false for non-compliance task', () => {
      expect(isComplianceRelatedTask(mockNonComplianceTask)).toBe(false);
    });

    it('should return false for task with null task_type', () => {
      const task: Task = { ...mockNonComplianceTask, task_type: null as any };
      expect(isComplianceRelatedTask(task)).toBe(false);
    });
  });

  describe('shouldUpdateComplianceScore', () => {
    it('should return true when transitioning to completed', () => {
      expect(shouldUpdateComplianceScore('in-progress', 'completed')).toBe(true);
    });

    it('should return true when transitioning to cancelled', () => {
      expect(shouldUpdateComplianceScore('pending', 'cancelled')).toBe(true);
    });

    it('should return false when transitioning to pending', () => {
      expect(shouldUpdateComplianceScore('completed', 'pending')).toBe(false);
    });

    it('should return false when transitioning to in-progress', () => {
      expect(shouldUpdateComplianceScore('pending', 'in-progress')).toBe(false);
    });

    it('should return false when transitioning to review', () => {
      expect(shouldUpdateComplianceScore('in-progress', 'review')).toBe(false);
    });

    it('should return false when transitioning to blocked', () => {
      expect(shouldUpdateComplianceScore('in-progress', 'blocked')).toBe(false);
    });
  });

  describe('calculateProjectComplianceScore', () => {
    it('should return 100 when no compliance tasks exist', async () => {
      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(100);
    });

    it('should return 100 when all compliance tasks are completed', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        status: 'completed',
        severity: 'high',
      });

      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(100);
    });

    it('should return 0 when no compliance tasks are completed', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        status: 'pending',
        severity: 'high',
      });

      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(0);
    });

    it('should calculate weighted score based on severity', async () => {
      // Create 2 tasks with different severities
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        id: 'task-1',
        status: 'completed',
        severity: 'critical', // Weight: 30
      });

      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        id: 'task-2',
        status: 'pending',
        severity: 'low', // Weight: 5
      });

      // Total weight: 35, completed weight: 30
      // Score: (30/35) * 100 = 85.7, rounded to 86
      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(86);
    });

    it('should only consider compliance-related tasks', async () => {
      // Add a non-compliance task
      await MockDatabase.insert<Task>('tasks', {
        ...mockNonComplianceTask,
        status: 'pending',
      });

      // No compliance tasks = 100
      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(100);
    });

    it('should only consider tasks for the specified project', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        project_id: 'project-2', // Different project
        status: 'pending',
      });

      // No tasks for project-1 = 100
      const score = await calculateProjectComplianceScore('project-1');
      expect(score).toBe(100);
    });
  });

  describe('updateComplianceScoreOnStatusChange', () => {
    it('should not trigger for non-compliance task', async () => {
      const result = await updateComplianceScoreOnStatusChange(
        { ...mockNonComplianceTask, status: 'completed' },
        'pending',
        'completed'
      );

      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('Task is not compliance-related');
    });

    it('should not trigger for non-affecting status transition', async () => {
      const result = await updateComplianceScoreOnStatusChange(
        { ...mockComplianceTask, status: 'in-progress' },
        'pending',
        'in-progress'
      );

      expect(result.triggered).toBe(false);
      expect(result.reason).toContain('does not affect compliance');
    });

    it('should not trigger for task without project_id', async () => {
      const taskWithoutProject: Task = {
        ...mockComplianceTask,
        project_id: undefined as any,
        status: 'completed',
      };

      const result = await updateComplianceScoreOnStatusChange(
        taskWithoutProject,
        'pending',
        'completed'
      );

      expect(result.triggered).toBe(false);
      expect(result.reason).toBe('Task has no project_id');
    });

    it('should trigger and calculate score for compliance task completed', async () => {
      // Create the task in the database first
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        status: 'completed',
      });

      const result = await updateComplianceScoreOnStatusChange(
        { ...mockComplianceTask, status: 'completed' },
        'in-progress',
        'completed'
      );

      expect(result.triggered).toBe(true);
      expect(result.projectId).toBe('project-1');
      expect(result.newScore).toBeDefined();
      expect(result.newScore).toBe(100); // Only task is completed
    });

    it('should calculate correct score with mixed completed/pending tasks', async () => {
      // Create multiple tasks
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        id: 'task-1',
        status: 'completed',
        severity: 'high', // Weight: 20
      });

      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        id: 'task-2',
        status: 'pending',
        severity: 'high', // Weight: 20
      });

      const result = await updateComplianceScoreOnStatusChange(
        { ...mockComplianceTask, id: 'task-1', status: 'completed' },
        'in-progress',
        'completed'
      );

      expect(result.triggered).toBe(true);
      expect(result.newScore).toBe(50); // 20/40 = 50%
    });

    it('should trigger for cancelled status', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockComplianceTask,
        status: 'cancelled',
      });

      const result = await updateComplianceScoreOnStatusChange(
        { ...mockComplianceTask, status: 'cancelled' },
        'pending',
        'cancelled'
      );

      expect(result.triggered).toBe(true);
      expect(result.projectId).toBe('project-1');
    });
  });
});
