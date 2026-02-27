/**
 * Due Date Inference & Management
 * TASK-2: Implement Due Date Auto-Calculation Logic
 *
 * Tests for the DueDateService inference methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  inferDueDateFromPolicy,
  inferDueDateFromProject,
  inferDueDateFromOnboarding,
  recalculateDueDate,
  shouldRecalculateDueDate,
  formatDueDateForStorage,
  getDaysUntilDue,
  isTaskOverdue,
  isTaskDueSoon,
  dueDateService,
} from '../dueDateService';
import { Task } from '../../../types';

describe('DueDateService', () => {
  describe('inferDueDateFromPolicy', () => {
    it('should calculate due date 30 days before policy expiration', () => {
      const policyExpiration = new Date('2024-06-30T00:00:00.000Z');
      const result = inferDueDateFromPolicy(policyExpiration);

      expect(result.source).toBe('inferred_policy');
      // 30 days before June 30 = May 31 (UTC)
      expect(result.dueDate.getUTCDate()).toBe(31);
      expect(result.dueDate.getUTCMonth()).toBe(4); // May (0-indexed)
    });

    it('should accept string date input', () => {
      const result = inferDueDateFromPolicy('2024-06-30T00:00:00.000Z');

      expect(result.source).toBe('inferred_policy');
      expect(result.dueDate.getUTCMonth()).toBe(4); // May
    });

    it('should use custom lead days when provided', () => {
      const policyExpiration = new Date('2024-06-30T00:00:00.000Z');
      const result = inferDueDateFromPolicy(policyExpiration, { policyLeadDays: 45 });

      expect(result.source).toBe('inferred_policy');
      // 45 days before June 30 = May 16 (UTC)
      expect(result.dueDate.getUTCDate()).toBe(16);
      expect(result.dueDate.getUTCMonth()).toBe(4); // May
    });

    it('should handle month boundary crossing', () => {
      const policyExpiration = new Date('2024-03-15T00:00:00.000Z');
      const result = inferDueDateFromPolicy(policyExpiration);

      expect(result.source).toBe('inferred_policy');
      // 30 days before March 15 = February 14 (2024 is leap year, UTC)
      expect(result.dueDate.getUTCMonth()).toBe(1); // February
      expect(result.dueDate.getUTCDate()).toBe(14);
    });

    it('should handle year boundary crossing', () => {
      const policyExpiration = new Date('2024-01-15T00:00:00.000Z');
      const result = inferDueDateFromPolicy(policyExpiration);

      expect(result.source).toBe('inferred_policy');
      // 30 days before Jan 15 = Dec 16 previous year (UTC)
      expect(result.dueDate.getUTCFullYear()).toBe(2023);
      expect(result.dueDate.getUTCMonth()).toBe(11); // December
    });
  });

  describe('inferDueDateFromProject', () => {
    it('should calculate due date 7 days before project start', () => {
      const projectStart = new Date('2024-05-01T00:00:00.000Z');
      const result = inferDueDateFromProject(projectStart);

      expect(result.source).toBe('inferred_project');
      // 7 days before May 1 = April 24 (UTC)
      expect(result.dueDate.getUTCDate()).toBe(24);
      expect(result.dueDate.getUTCMonth()).toBe(3); // April
    });

    it('should accept string date input', () => {
      const result = inferDueDateFromProject('2024-05-01T00:00:00.000Z');

      expect(result.source).toBe('inferred_project');
      expect(result.dueDate.getUTCMonth()).toBe(3); // April
    });

    it('should use custom lead days when provided', () => {
      const projectStart = new Date('2024-05-15T00:00:00.000Z');
      const result = inferDueDateFromProject(projectStart, { projectLeadDays: 14 });

      expect(result.source).toBe('inferred_project');
      // 14 days before May 15 = May 1 (UTC)
      expect(result.dueDate.getUTCDate()).toBe(1);
      expect(result.dueDate.getUTCMonth()).toBe(4); // May
    });

    it('should handle month boundary crossing', () => {
      const projectStart = new Date('2024-03-03T00:00:00.000Z');
      const result = inferDueDateFromProject(projectStart);

      expect(result.source).toBe('inferred_project');
      // 7 days before March 3 = February 25 (2024 is leap year, UTC)
      expect(result.dueDate.getUTCMonth()).toBe(1); // February
      expect(result.dueDate.getUTCDate()).toBe(25);
    });
  });

  describe('inferDueDateFromOnboarding', () => {
    it('should use onboarding deadline as due date', () => {
      const deadline = new Date('2024-04-30T00:00:00.000Z');
      const result = inferDueDateFromOnboarding(deadline);

      expect(result.source).toBe('inferred_onboarding');
      expect(result.dueDate.getTime()).toBe(deadline.getTime());
    });

    it('should accept string date input', () => {
      const result = inferDueDateFromOnboarding('2024-04-30T00:00:00.000Z');

      expect(result.source).toBe('inferred_onboarding');
      expect(result.dueDate.getUTCMonth()).toBe(3); // April (UTC)
      expect(result.dueDate.getUTCDate()).toBe(30);
    });

    it('should create a new Date instance (not reference)', () => {
      const deadline = new Date('2024-04-30T00:00:00.000Z');
      const result = inferDueDateFromOnboarding(deadline);

      expect(result.dueDate).not.toBe(deadline);
      expect(result.dueDate.getTime()).toBe(deadline.getTime());
    });
  });

  describe('recalculateDueDate', () => {
    const baseTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should return null when no context is available', () => {
      const result = recalculateDueDate(baseTask, {});
      expect(result).toBeNull();
    });

    it('should prioritize policy inference when task has policy_id', () => {
      const taskWithPolicy: Task = {
        ...baseTask,
        policy_id: 'policy-1',
        project_id: 'project-1',
      };

      const result = recalculateDueDate(taskWithPolicy, {
        policyExpirationDate: '2024-06-30T00:00:00.000Z',
        projectStartDate: '2024-05-01T00:00:00.000Z',
      });

      expect(result).not.toBeNull();
      expect(result!.source).toBe('inferred_policy');
    });

    it('should use project inference when no policy context', () => {
      const taskWithProject: Task = {
        ...baseTask,
        project_id: 'project-1',
      };

      const result = recalculateDueDate(taskWithProject, {
        projectStartDate: '2024-05-01T00:00:00.000Z',
        onboardingDeadline: '2024-04-15T00:00:00.000Z',
      });

      expect(result).not.toBeNull();
      expect(result!.source).toBe('inferred_project');
    });

    it('should use onboarding inference as fallback', () => {
      const result = recalculateDueDate(baseTask, {
        onboardingDeadline: '2024-04-15T00:00:00.000Z',
      });

      expect(result).not.toBeNull();
      expect(result!.source).toBe('inferred_onboarding');
    });

    it('should not infer from policy if task has no policy_id', () => {
      const result = recalculateDueDate(baseTask, {
        policyExpirationDate: '2024-06-30T00:00:00.000Z',
      });

      expect(result).toBeNull();
    });

    it('should not infer from project if task has no project_id', () => {
      const result = recalculateDueDate(baseTask, {
        projectStartDate: '2024-05-01T00:00:00.000Z',
      });

      expect(result).toBeNull();
    });

    it('should apply custom config to inference', () => {
      const taskWithPolicy: Task = {
        ...baseTask,
        policy_id: 'policy-1',
      };

      const result = recalculateDueDate(
        taskWithPolicy,
        { policyExpirationDate: '2024-06-30T00:00:00.000Z' },
        { policyLeadDays: 60 }
      );

      expect(result).not.toBeNull();
      // 60 days before June 30 = May 1 (UTC)
      expect(result!.dueDate.getUTCMonth()).toBe(4); // May
      expect(result!.dueDate.getUTCDate()).toBe(1);
    });
  });

  describe('shouldRecalculateDueDate', () => {
    const baseTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should return true when task has no due date', () => {
      expect(shouldRecalculateDueDate(baseTask)).toBe(true);
    });

    it('should return false for manually set due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'manual',
      };
      expect(shouldRecalculateDueDate(task)).toBe(false);
    });

    it('should return false for gc_set due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'gc_set',
      };
      expect(shouldRecalculateDueDate(task)).toBe(false);
    });

    it('should return false for broker_set due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'broker_set',
      };
      expect(shouldRecalculateDueDate(task)).toBe(false);
    });

    it('should return true for inferred_policy due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'inferred_policy',
      };
      expect(shouldRecalculateDueDate(task)).toBe(true);
    });

    it('should return true for inferred_project due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'inferred_project',
      };
      expect(shouldRecalculateDueDate(task)).toBe(true);
    });

    it('should return true for inferred_onboarding due dates', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
        due_date_source: 'inferred_onboarding',
      };
      expect(shouldRecalculateDueDate(task)).toBe(true);
    });

    it('should return false for legacy tasks with due date but no source', () => {
      const task: Task = {
        ...baseTask,
        due_date: '2024-05-01T00:00:00.000Z',
      };
      expect(shouldRecalculateDueDate(task)).toBe(false);
    });
  });

  describe('formatDueDateForStorage', () => {
    it('should format date as ISO string', () => {
      const date = new Date('2024-05-15T12:30:00.000Z');
      const formatted = formatDueDateForStorage(date);

      expect(formatted).toBe('2024-05-15T12:30:00.000Z');
    });
  });

  describe('getDaysUntilDue', () => {
    it('should return positive days for future due dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const days = getDaysUntilDue(futureDate);
      expect(days).toBe(10);
    });

    it('should return negative days for past due dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const days = getDaysUntilDue(pastDate);
      expect(days).toBe(-5);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      const days = getDaysUntilDue(today);

      expect(days).toBe(0);
    });

    it('should accept string date input', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const days = getDaysUntilDue(futureDate.toISOString());
      expect(days).toBe(7);
    });
  });

  describe('isTaskOverdue', () => {
    const baseTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should return false when task has no due date', () => {
      expect(isTaskOverdue(baseTask)).toBe(false);
    });

    it('should return true for past due dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const task: Task = {
        ...baseTask,
        due_date: pastDate.toISOString(),
      };

      expect(isTaskOverdue(task)).toBe(true);
    });

    it('should return false for future due dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const task: Task = {
        ...baseTask,
        due_date: futureDate.toISOString(),
      };

      expect(isTaskOverdue(task)).toBe(false);
    });

    it('should return false for due date today', () => {
      const today = new Date();

      const task: Task = {
        ...baseTask,
        due_date: today.toISOString(),
      };

      expect(isTaskOverdue(task)).toBe(false);
    });
  });

  describe('isTaskDueSoon', () => {
    const baseTask: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'user-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should return false when task has no due date', () => {
      expect(isTaskDueSoon(baseTask)).toBe(false);
    });

    it('should return true for task due within 7 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 3);

      const task: Task = {
        ...baseTask,
        due_date: soonDate.toISOString(),
      };

      expect(isTaskDueSoon(task)).toBe(true);
    });

    it('should return false for task due after 7 days', () => {
      const laterDate = new Date();
      laterDate.setDate(laterDate.getDate() + 10);

      const task: Task = {
        ...baseTask,
        due_date: laterDate.toISOString(),
      };

      expect(isTaskDueSoon(task)).toBe(false);
    });

    it('should return true for task due today', () => {
      const today = new Date();

      const task: Task = {
        ...baseTask,
        due_date: today.toISOString(),
      };

      expect(isTaskDueSoon(task)).toBe(true);
    });

    it('should return false for overdue tasks', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const task: Task = {
        ...baseTask,
        due_date: pastDate.toISOString(),
      };

      expect(isTaskDueSoon(task)).toBe(false);
    });

    it('should use custom days threshold', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 5);

      const task: Task = {
        ...baseTask,
        due_date: soonDate.toISOString(),
      };

      expect(isTaskDueSoon(task, 3)).toBe(false);
      expect(isTaskDueSoon(task, 10)).toBe(true);
    });
  });

  describe('dueDateService export', () => {
    it('should export all methods', () => {
      expect(dueDateService.inferDueDateFromPolicy).toBeDefined();
      expect(dueDateService.inferDueDateFromProject).toBeDefined();
      expect(dueDateService.inferDueDateFromOnboarding).toBeDefined();
      expect(dueDateService.recalculateDueDate).toBeDefined();
      expect(dueDateService.shouldRecalculateDueDate).toBeDefined();
      expect(dueDateService.formatDueDateForStorage).toBeDefined();
      expect(dueDateService.getDaysUntilDue).toBeDefined();
      expect(dueDateService.isTaskOverdue).toBeDefined();
      expect(dueDateService.isTaskDueSoon).toBeDefined();
    });
  });
});
