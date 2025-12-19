/**
 * REQ-267: Due Date Inference & Management
 * TASK-3: Build Due Date Management API with Manual Override
 *
 * Tests for the Due Date API service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MockDatabase from '../../../utils/mockDataStore';
import { Task, TaskDueDateHistory } from '../../../types';
import {
  isValidISODate,
  canUpdateDueDate,
  createDueDateHistoryRecord,
  updateTaskDueDate,
  getTaskDueDateHistory,
  UserContext,
  dueDateApiService,
} from '../dueDateApiService';

describe('REQ-267: Due Date API Service', () => {
  beforeEach(() => {
    MockDatabase.clearAll();
  });

  describe('isValidISODate', () => {
    it('should return true for valid ISO date strings', () => {
      expect(isValidISODate('2024-06-15T00:00:00.000Z')).toBe(true);
      expect(isValidISODate('2024-06-15')).toBe(true);
      expect(isValidISODate('2024-06-15T12:30:00Z')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidISODate('invalid-date')).toBe(false);
      expect(isValidISODate('not a date')).toBe(false);
      expect(isValidISODate('')).toBe(false);
    });
  });

  describe('canUpdateDueDate', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'creator-1',
      assigned_to_user_id: 'assignee-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should allow task creator to update', () => {
      const user: UserContext = {
        id: 'creator-1',
        role: 'subcontractor',
      };
      expect(canUpdateDueDate(task, user)).toBe(true);
    });

    it('should allow task assignee to update', () => {
      const user: UserContext = {
        id: 'assignee-1',
        role: 'subcontractor',
      };
      expect(canUpdateDueDate(task, user)).toBe(true);
    });

    it('should allow GC role to update any task', () => {
      const user: UserContext = {
        id: 'gc-1',
        role: 'gc',
      };
      expect(canUpdateDueDate(task, user)).toBe(true);
    });

    it('should allow broker role to update any task', () => {
      const user: UserContext = {
        id: 'broker-1',
        role: 'broker',
      };
      expect(canUpdateDueDate(task, user)).toBe(true);
    });

    it('should allow admin role to update any task', () => {
      const user: UserContext = {
        id: 'admin-1',
        role: 'admin',
      };
      expect(canUpdateDueDate(task, user)).toBe(true);
    });

    it('should deny unauthorized users', () => {
      const user: UserContext = {
        id: 'random-user',
        role: 'subcontractor',
      };
      expect(canUpdateDueDate(task, user)).toBe(false);
    });
  });

  describe('createDueDateHistoryRecord', () => {
    it('should create a history record with all fields', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
        name: 'John Broker',
        email: 'john@broker.com',
      };

      const record = await createDueDateHistoryRecord(
        task.id,
        '2024-06-01T00:00:00.000Z',
        '2024-06-15T00:00:00.000Z',
        'manual',
        user
      );

      expect(record.task_id).toBe(task.id);
      expect(record.old_due_date).toBe('2024-06-01T00:00:00.000Z');
      expect(record.new_due_date).toBe('2024-06-15T00:00:00.000Z');
      expect(record.source).toBe('manual');
      expect(record.changed_by_user_id).toBe('user-1');
      expect(record.changed_by?.name).toBe('John Broker');
      expect(record.changed_by?.email).toBe('john@broker.com');
      expect(record.changed_at).toBeDefined();
    });

    it('should handle undefined old_due_date', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      const record = await createDueDateHistoryRecord(
        task.id,
        undefined,
        '2024-06-15T00:00:00.000Z',
        'manual',
        user
      );

      expect(record.old_due_date).toBeUndefined();
      expect(record.new_due_date).toBe('2024-06-15T00:00:00.000Z');
    });
  });

  describe('updateTaskDueDate', () => {
    it('should update due date with manual override (Test 7)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-06-01T00:00:00.000Z',
        due_date_source: 'inferred_policy',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
        name: 'Test User',
      };

      const result = await updateTaskDueDate(
        task.id,
        { due_date: '2024-06-15T00:00:00.000Z', source: 'manual' },
        user
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.task?.due_date).toBe('2024-06-15T00:00:00.000Z');
      expect(result.task?.due_date_source).toBe('manual');
      expect(result.historyRecord).toBeDefined();
      expect(result.historyRecord?.old_due_date).toBe('2024-06-01T00:00:00.000Z');
      expect(result.historyRecord?.new_due_date).toBe('2024-06-15T00:00:00.000Z');
    });

    it('should reject unauthorized due date change (Test 8)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
      });

      const user: UserContext = {
        id: 'random-user',
        role: 'subcontractor',
      };

      const result = await updateTaskDueDate(
        task.id,
        { due_date: '2024-06-15T00:00:00.000Z', source: 'manual' },
        user
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error).toBe('Unauthorized to modify due date');
    });

    it('should clear manual override to revert to inferred date (Test 9)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Policy Renewal Task',
        status: 'pending',
        priority: 'high',
        due_date: '2024-06-15T00:00:00.000Z',
        due_date_source: 'manual',
        created_by_user_id: 'user-1',
        policy_id: 'policy-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      // Provide policy context for auto-recalculation
      const result = await updateTaskDueDate(
        task.id,
        { due_date: null, source: 'manual' },
        user,
        { policyExpirationDate: '2024-07-30T00:00:00.000Z' }
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      // 30 days before July 30 = June 30
      expect(result.task?.due_date_source).toBe('inferred_policy');
      expect(result.task?.due_date).toBeDefined();
    });

    it('should validate invalid date format (Test 10)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      const result = await updateTaskDueDate(
        task.id,
        { due_date: 'invalid-date', source: 'manual' },
        user
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toBe('Invalid date format');
    });

    it('should return 404 for non-existent task', async () => {
      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      const result = await updateTaskDueDate(
        'non-existent-task',
        { due_date: '2024-06-15T00:00:00.000Z', source: 'manual' },
        user
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toBe('Task not found');
    });

    it('should update with gc_set source', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'gc-manager',
        role: 'gc',
        name: 'GC Manager',
      };

      const result = await updateTaskDueDate(
        task.id,
        { due_date: '2024-06-10T00:00:00.000Z', source: 'gc_set' },
        user
      );

      expect(result.success).toBe(true);
      expect(result.task?.due_date_source).toBe('gc_set');
    });

    it('should update with broker_set source', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'broker-1',
        role: 'broker',
        name: 'Broker User',
      };

      const result = await updateTaskDueDate(
        task.id,
        { due_date: '2024-06-20T00:00:00.000Z', source: 'broker_set' },
        user
      );

      expect(result.success).toBe(true);
      expect(result.task?.due_date_source).toBe('broker_set');
    });
  });

  describe('getTaskDueDateHistory', () => {
    it('should retrieve due date history for task', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
        name: 'Test User',
      };

      // Create some history records
      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        new_due_date: '2024-06-01T00:00:00.000Z',
        source: 'inferred_policy',
        changed_by_user_id: 'system',
        changed_at: '2024-01-01T10:00:00.000Z',
      });

      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: '2024-06-01T00:00:00.000Z',
        new_due_date: '2024-06-15T00:00:00.000Z',
        source: 'manual',
        changed_by_user_id: 'user-1',
        changed_at: '2024-01-02T10:00:00.000Z',
      });

      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: '2024-06-15T00:00:00.000Z',
        new_due_date: '2024-06-10T00:00:00.000Z',
        source: 'gc_set',
        changed_by_user_id: 'gc-1',
        changed_at: '2024-01-03T10:00:00.000Z',
      });

      const result = await getTaskDueDateHistory(task.id, user);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.history).toHaveLength(3);
      // Should be ordered by changed_at DESC
      expect(result.history![0].source).toBe('gc_set');
      expect(result.history![1].source).toBe('manual');
      expect(result.history![2].source).toBe('inferred_policy');
    });

    it('should reject unauthorized history access', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
      });

      const user: UserContext = {
        id: 'random-user',
        role: 'subcontractor',
      };

      const result = await getTaskDueDateHistory(task.id, user);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error).toBe('Unauthorized to view task history');
    });

    it('should return 404 for non-existent task', async () => {
      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      const result = await getTaskDueDateHistory('non-existent', user);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toBe('Task not found');
    });

    it('should return empty array for task with no history', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'New Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const user: UserContext = {
        id: 'user-1',
        role: 'broker',
      };

      const result = await getTaskDueDateHistory(task.id, user);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.history).toHaveLength(0);
    });
  });

  describe('dueDateApiService export', () => {
    it('should export all methods', () => {
      expect(dueDateApiService.isValidISODate).toBeDefined();
      expect(dueDateApiService.canUpdateDueDate).toBeDefined();
      expect(dueDateApiService.createDueDateHistoryRecord).toBeDefined();
      expect(dueDateApiService.updateTaskDueDate).toBeDefined();
      expect(dueDateApiService.getTaskDueDateHistory).toBeDefined();
    });
  });
});
