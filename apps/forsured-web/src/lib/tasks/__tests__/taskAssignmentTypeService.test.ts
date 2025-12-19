/**
 * REQ-260: Task Assignment Workflow Fix
 * TASK-1: Tests for task assignment type service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getTaskAssignmentType,
  getTaskViewForUser,
  isSelfAssigned,
  isDelegated,
  isUnassigned,
  filterTasksForInbox,
  filterTasksForAssignedByMe,
  assignTask,
  reassignTask,
  unassignTask,
} from '../taskAssignmentTypeService';
import { Task } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';

describe('taskAssignmentTypeService', () => {
  // Base task templates
  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: `task-${Math.random().toString(36).substring(7)}`,
    title: 'Test Task',
    description: 'Test description',
    status: 'pending',
    priority: 'medium',
    due_date: '2025-12-31',
    created_by_user_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    MockDatabase.clearTable('tasks');
  });

  afterEach(() => {
    MockDatabase.clearTable('tasks');
  });

  describe('getTaskAssignmentType', () => {
    it('should return "unassigned" when task has no assignee', () => {
      const task = createTask({ assigned_to_user_id: undefined });
      expect(getTaskAssignmentType(task)).toBe('unassigned');
    });

    it('should return "self_assigned" when creator and assignee are the same', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });
      expect(getTaskAssignmentType(task)).toBe('self_assigned');
    });

    it('should return "delegated" when assignee is different from creator', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(getTaskAssignmentType(task)).toBe('delegated');
    });
  });

  describe('getTaskViewForUser', () => {
    it('should return "inbox" for self-assigned task when user is assignee', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });
      expect(getTaskViewForUser(task, 'user-1')).toBe('inbox');
    });

    it('should return "assigned_by_me" for delegated task when user is creator', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(getTaskViewForUser(task, 'user-1')).toBe('assigned_by_me');
    });

    it('should return "inbox" for delegated task when user is assignee', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(getTaskViewForUser(task, 'user-2')).toBe('inbox');
    });

    it('should return "inbox" for unassigned task when user is creator', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      expect(getTaskViewForUser(task, 'user-1')).toBe('inbox');
    });

    it('should return "all" when user is neither creator nor assignee', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(getTaskViewForUser(task, 'user-3')).toBe('all');
    });
  });

  describe('isSelfAssigned', () => {
    it('should return true for self-assigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });
      expect(isSelfAssigned(task)).toBe(true);
    });

    it('should return false for delegated task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(isSelfAssigned(task)).toBe(false);
    });

    it('should return false for unassigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      expect(isSelfAssigned(task)).toBe(false);
    });
  });

  describe('isDelegated', () => {
    it('should return true for delegated task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(isDelegated(task)).toBe(true);
    });

    it('should return false for self-assigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });
      expect(isDelegated(task)).toBe(false);
    });

    it('should return false for unassigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      expect(isDelegated(task)).toBe(false);
    });
  });

  describe('isUnassigned', () => {
    it('should return true for unassigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      expect(isUnassigned(task)).toBe(true);
    });

    it('should return false for self-assigned task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });
      expect(isUnassigned(task)).toBe(false);
    });

    it('should return false for delegated task', () => {
      const task = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      expect(isUnassigned(task)).toBe(false);
    });
  });

  describe('filterTasksForInbox', () => {
    it('should include tasks assigned to the user', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-2', assigned_to_user_id: 'user-1' }),
        createTask({ id: 't2', created_by_user_id: 'user-1', assigned_to_user_id: 'user-1' }),
        createTask({ id: 't3', created_by_user_id: 'user-1', assigned_to_user_id: 'user-2' }),
      ];

      const inbox = filterTasksForInbox(tasks, 'user-1');
      expect(inbox).toHaveLength(2);
      expect(inbox.map(t => t.id)).toContain('t1');
      expect(inbox.map(t => t.id)).toContain('t2');
    });

    it('should include unassigned tasks created by the user', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-1', assigned_to_user_id: undefined }),
        createTask({ id: 't2', created_by_user_id: 'user-2', assigned_to_user_id: undefined }),
      ];

      const inbox = filterTasksForInbox(tasks, 'user-1');
      expect(inbox).toHaveLength(1);
      expect(inbox[0].id).toBe('t1');
    });

    it('should exclude tasks delegated to others by the user', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-1', assigned_to_user_id: 'user-2' }),
      ];

      const inbox = filterTasksForInbox(tasks, 'user-1');
      expect(inbox).toHaveLength(0);
    });

    it('should return empty array when user has no inbox tasks', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-2', assigned_to_user_id: 'user-2' }),
        createTask({ id: 't2', created_by_user_id: 'user-2', assigned_to_user_id: 'user-3' }),
      ];

      const inbox = filterTasksForInbox(tasks, 'user-1');
      expect(inbox).toHaveLength(0);
    });
  });

  describe('filterTasksForAssignedByMe', () => {
    it('should include tasks created by user and assigned to others', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-1', assigned_to_user_id: 'user-2' }),
        createTask({ id: 't2', created_by_user_id: 'user-1', assigned_to_user_id: 'user-3' }),
        createTask({ id: 't3', created_by_user_id: 'user-2', assigned_to_user_id: 'user-1' }),
      ];

      const assignedByMe = filterTasksForAssignedByMe(tasks, 'user-1');
      expect(assignedByMe).toHaveLength(2);
      expect(assignedByMe.map(t => t.id)).toContain('t1');
      expect(assignedByMe.map(t => t.id)).toContain('t2');
    });

    it('should exclude self-assigned tasks', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-1', assigned_to_user_id: 'user-1' }),
      ];

      const assignedByMe = filterTasksForAssignedByMe(tasks, 'user-1');
      expect(assignedByMe).toHaveLength(0);
    });

    it('should exclude unassigned tasks', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-1', assigned_to_user_id: undefined }),
      ];

      const assignedByMe = filterTasksForAssignedByMe(tasks, 'user-1');
      expect(assignedByMe).toHaveLength(0);
    });

    it('should exclude tasks created by others', () => {
      const tasks = [
        createTask({ id: 't1', created_by_user_id: 'user-2', assigned_to_user_id: 'user-3' }),
      ];

      const assignedByMe = filterTasksForAssignedByMe(tasks, 'user-1');
      expect(assignedByMe).toHaveLength(0);
    });
  });

  describe('assignTask', () => {
    it('should assign task and return self_assigned when assignee matches currentUser', async () => {
      const taskData = createTask({ created_by_user_id: 'user-1' });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      const result = await assignTask(insertedTask.id, 'user-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('self_assigned');
      expect(result.viewType).toBe('inbox');
      expect(result.task?.assigned_to_user_id).toBe('user-1');
    });

    it('should assign task and return delegated when assignee differs from currentUser', async () => {
      const taskData = createTask({ created_by_user_id: 'user-1' });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      const result = await assignTask(insertedTask.id, 'user-2', 'user-1');

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('delegated');
      expect(result.viewType).toBe('assigned_by_me');
      expect(result.task?.assigned_to_user_id).toBe('user-2');
    });

    it('should fail when task does not exist', async () => {
      const result = await assignTask('nonexistent-task', 'user-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });

    it('should allow assigning to any user ID (validation at API layer)', async () => {
      const taskData = createTask({ created_by_user_id: 'user-1' });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // User validation should happen at API layer, not service layer
      const result = await assignTask(insertedTask.id, 'any-user-id', 'user-1');

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('delegated');
      expect(result.task?.assigned_to_user_id).toBe('any-user-id');
    });
  });

  describe('reassignTask', () => {
    it('should reassign task and update view routing', async () => {
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // Reassign from user-2 to user-3
      const result = await reassignTask(insertedTask.id, 'user-3', 'user-1');

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('delegated');
      expect(result.viewType).toBe('assigned_by_me');
      expect(result.task?.assigned_to_user_id).toBe('user-3');
    });

    it('should change to self_assigned when reassigning to self', async () => {
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // Reassign back to self
      const result = await reassignTask(insertedTask.id, 'user-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('self_assigned');
      expect(result.viewType).toBe('inbox');
      expect(result.task?.assigned_to_user_id).toBe('user-1');
    });
  });

  describe('unassignTask', () => {
    it('should remove assignee and return unassigned', async () => {
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      const result = await unassignTask(insertedTask.id);

      expect(result.success).toBe(true);
      expect(result.assignmentType).toBe('unassigned');
      expect(result.viewType).toBe('inbox');
      expect(result.task?.assigned_to_user_id).toBeUndefined();
    });

    it('should fail when task does not exist', async () => {
      const result = await unassignTask('nonexistent-task');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task not found');
    });
  });

  describe('integration scenarios', () => {
    it('scenario: self-assignment keeps task in inbox', async () => {
      // Setup: User creates task
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // Action: User assigns to self
      const result = await assignTask(insertedTask.id, 'user-1', 'user-1');

      // Expect: Task remains in inbox
      expect(result.success).toBe(true);
      expect(result.viewType).toBe('inbox');

      // Verify via filter
      const inbox = filterTasksForInbox([result.task!], 'user-1');
      expect(inbox).toHaveLength(1);

      const assignedByMe = filterTasksForAssignedByMe([result.task!], 'user-1');
      expect(assignedByMe).toHaveLength(0);
    });

    it('scenario: delegation moves task to assigned by me view', async () => {
      // Setup: User creates task
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // Action: User assigns to someone else
      const result = await assignTask(insertedTask.id, 'user-2', 'user-1');

      // Expect: Task moves to "assigned by me" for creator
      expect(result.success).toBe(true);
      expect(result.viewType).toBe('assigned_by_me');

      // Verify via filters
      const creatorInbox = filterTasksForInbox([result.task!], 'user-1');
      expect(creatorInbox).toHaveLength(0);

      const creatorAssignedByMe = filterTasksForAssignedByMe([result.task!], 'user-1');
      expect(creatorAssignedByMe).toHaveLength(1);

      // Task appears in assignee's inbox
      const assigneeInbox = filterTasksForInbox([result.task!], 'user-2');
      expect(assigneeInbox).toHaveLength(1);
    });

    it('scenario: reassignment updates view routing', async () => {
      // Setup: Task assigned to user-2
      const taskData = createTask({
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });
      const insertedTask = await MockDatabase.insert<Task>('tasks', taskData);

      // Action: Reassign to user-3
      const result = await reassignTask(insertedTask.id, 'user-3', 'user-1');

      // Expect: Task remains in "assigned by me" view, assignee updated
      expect(result.success).toBe(true);
      expect(result.task?.assigned_to_user_id).toBe('user-3');

      // Verify old assignee no longer sees it in inbox
      const oldAssigneeInbox = filterTasksForInbox([result.task!], 'user-2');
      expect(oldAssigneeInbox).toHaveLength(0);

      // New assignee sees it in inbox
      const newAssigneeInbox = filterTasksForInbox([result.task!], 'user-3');
      expect(newAssigneeInbox).toHaveLength(1);

      // Creator still sees it in assigned by me
      const creatorAssignedByMe = filterTasksForAssignedByMe([result.task!], 'user-1');
      expect(creatorAssignedByMe).toHaveLength(1);
    });
  });
});
