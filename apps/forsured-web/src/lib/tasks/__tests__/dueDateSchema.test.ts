/**
 * REQ-267: Due Date Inference & Management
 * TASK-1: Create Database Schema for Due Date Tracking
 *
 * Tests for the due date schema types and MockDatabase support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MockDatabase from '../../../utils/mockDataStore';
import { Task, TaskDueDateHistory, DueDateSource } from '../../../types';

describe('REQ-267: Due Date Schema', () => {
  beforeEach(() => {
    MockDatabase.clearAll();
  });

  describe('DueDateSource type', () => {
    it('should support all required source types', () => {
      const sources: DueDateSource[] = [
        'inferred_policy',
        'inferred_project',
        'inferred_onboarding',
        'manual',
        'gc_set',
        'broker_set',
      ];

      // Type check passes if this compiles
      expect(sources).toHaveLength(6);
    });
  });

  describe('Task with due_date_source', () => {
    it('should create a task with due_date_source field', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        description: 'Test description',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-06-15T00:00:00.000Z',
        due_date_source: 'manual',
        created_by_user_id: 'user-1',
      });

      expect(task.due_date_source).toBe('manual');
      expect(task.due_date).toBe('2024-06-15T00:00:00.000Z');
    });

    it('should create a task with inferred_policy source', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Policy Renewal Task',
        status: 'pending',
        priority: 'high',
        due_date: '2024-05-01T00:00:00.000Z', // 30 days before policy expiration
        due_date_source: 'inferred_policy',
        created_by_user_id: 'user-1',
        policy_id: 'policy-1',
      });

      expect(task.due_date_source).toBe('inferred_policy');
    });

    it('should create a task with inferred_project source', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Project Prep Task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-04-24T00:00:00.000Z', // 7 days before project start
        due_date_source: 'inferred_project',
        created_by_user_id: 'user-1',
        project_id: 'project-1',
      });

      expect(task.due_date_source).toBe('inferred_project');
    });

    it('should allow task without due_date_source (optional field)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Legacy Task',
        status: 'pending',
        priority: 'low',
        created_by_user_id: 'user-1',
      });

      expect(task.due_date_source).toBeUndefined();
    });

    it('should update task due_date_source', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-06-15T00:00:00.000Z',
        due_date_source: 'inferred_policy',
        created_by_user_id: 'user-1',
      });

      const updatedTask = await MockDatabase.update<Task>('tasks', task.id, {
        due_date: '2024-06-20T00:00:00.000Z',
        due_date_source: 'manual',
      });

      expect(updatedTask.due_date_source).toBe('manual');
      expect(updatedTask.due_date).toBe('2024-06-20T00:00:00.000Z');
    });
  });

  describe('TaskDueDateHistory collection', () => {
    it('should create a due date history record', async () => {
      // First create a task
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-06-15T00:00:00.000Z',
        due_date_source: 'manual',
        created_by_user_id: 'user-1',
      });

      // Create history record
      const history = await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: undefined,
        new_due_date: '2024-06-15T00:00:00.000Z',
        source: 'manual',
        changed_by_user_id: 'user-1',
        changed_at: new Date().toISOString(),
      });

      expect(history.task_id).toBe(task.id);
      expect(history.source).toBe('manual');
      expect(history.new_due_date).toBe('2024-06-15T00:00:00.000Z');
      expect(history.old_due_date).toBeUndefined();
    });

    it('should track due date changes in history', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-06-15T00:00:00.000Z',
        due_date_source: 'inferred_policy',
        created_by_user_id: 'user-1',
      });

      // First change
      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: undefined,
        new_due_date: '2024-06-15T00:00:00.000Z',
        source: 'inferred_policy',
        changed_by_user_id: 'system',
        changed_at: new Date().toISOString(),
      });

      // Manual override
      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: '2024-06-15T00:00:00.000Z',
        new_due_date: '2024-06-20T00:00:00.000Z',
        source: 'manual',
        changed_by_user_id: 'user-1',
        changed_at: new Date().toISOString(),
      });

      // Query history for task
      const history = await MockDatabase.query<TaskDueDateHistory>(
        'task_due_date_history',
        { task_id: task.id },
        { column: 'changed_at', ascending: false }
      );

      expect(history).toHaveLength(2);
      expect(history[0].source).toBe('manual');
      expect(history[0].old_due_date).toBe('2024-06-15T00:00:00.000Z');
      expect(history[0].new_due_date).toBe('2024-06-20T00:00:00.000Z');
    });

    it('should store changed_by user information', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const history = await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: undefined,
        new_due_date: '2024-06-15T00:00:00.000Z',
        source: 'broker_set',
        changed_by_user_id: 'broker-1',
        changed_by: {
          id: 'broker-1',
          name: 'John Broker',
          email: 'john@broker.com',
        },
        changed_at: new Date().toISOString(),
      });

      expect(history.changed_by_user_id).toBe('broker-1');
      expect(history.changed_by?.name).toBe('John Broker');
      expect(history.changed_by?.email).toBe('john@broker.com');
    });

    it('should support gc_set source type', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'GC Set Task',
        status: 'pending',
        priority: 'high',
        created_by_user_id: 'user-1',
      });

      const history = await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: '2024-06-15T00:00:00.000Z',
        new_due_date: '2024-06-10T00:00:00.000Z',
        source: 'gc_set',
        changed_by_user_id: 'gc-manager-1',
        changed_at: new Date().toISOString(),
      });

      expect(history.source).toBe('gc_set');
    });

    it('should support inferred_onboarding source type', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Onboarding Task',
        status: 'pending',
        priority: 'medium',
        due_date_source: 'inferred_onboarding',
        created_by_user_id: 'user-1',
      });

      const history = await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task.id,
        old_due_date: undefined,
        new_due_date: '2024-05-01T00:00:00.000Z',
        source: 'inferred_onboarding',
        changed_by_user_id: 'system',
        changed_at: new Date().toISOString(),
      });

      expect(history.source).toBe('inferred_onboarding');
    });
  });

  describe('Query due date history by task', () => {
    it('should retrieve all history for a specific task', async () => {
      const task1 = await MockDatabase.insert<Task>('tasks', {
        title: 'Task 1',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const task2 = await MockDatabase.insert<Task>('tasks', {
        title: 'Task 2',
        status: 'pending',
        priority: 'low',
        created_by_user_id: 'user-1',
      });

      // Add history for task 1
      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task1.id,
        new_due_date: '2024-06-15T00:00:00.000Z',
        source: 'manual',
        changed_by_user_id: 'user-1',
        changed_at: new Date().toISOString(),
      });

      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task1.id,
        old_due_date: '2024-06-15T00:00:00.000Z',
        new_due_date: '2024-06-20T00:00:00.000Z',
        source: 'gc_set',
        changed_by_user_id: 'gc-1',
        changed_at: new Date().toISOString(),
      });

      // Add history for task 2
      await MockDatabase.insert<TaskDueDateHistory>('task_due_date_history', {
        task_id: task2.id,
        new_due_date: '2024-07-01T00:00:00.000Z',
        source: 'inferred_project',
        changed_by_user_id: 'system',
        changed_at: new Date().toISOString(),
      });

      // Query only task 1 history
      const task1History = await MockDatabase.query<TaskDueDateHistory>(
        'task_due_date_history',
        { task_id: task1.id }
      );

      expect(task1History).toHaveLength(2);
      task1History.forEach((h) => {
        expect(h.task_id).toBe(task1.id);
      });
    });
  });
});
