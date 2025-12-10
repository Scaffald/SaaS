/**
 * REQ-166: Task Management Workflow & UI
 * REQ-259: Task Status Auto-Save with Audit Logging
 * Tests for task service API layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { taskService, TaskFilters } from '../taskService';
import { Task } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';
import * as auditService from '../../audit/AuditService';

describe('taskService', () => {
  const mockTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
    title: 'Test Task',
    description: 'Test description',
    status: 'pending',
    priority: 'high',
    due_date: '2025-12-31',
    created_by_user_id: 'user-1',
    assigned_to_user_id: 'user-2',
    project_id: 'project-1',
    task_type: 'coi_upload',
  };

  beforeEach(() => {
    // Clear test data before each test for isolation
    MockDatabase.clearTable('tasks');
    MockDatabase.clearTable('task_comments');
    MockDatabase.clearTable('notifications'); // REQ-259 TASK-3: Clear notifications
  });

  afterEach(() => {
    // Cleanup after each test
    MockDatabase.clearTable('tasks');
    MockDatabase.clearTable('task_comments');
    MockDatabase.clearTable('notifications'); // REQ-259 TASK-3: Clear notifications
  });

  describe('getTasks', () => {
    it('should return all tasks with pagination', async () => {
      // Create test tasks
      await MockDatabase.insert<Task>('tasks', mockTask);
      await MockDatabase.insert<Task>('tasks', { ...mockTask, title: 'Task 2' });

      const response = await taskService.getTasks(undefined, 1, 10);

      expect(response.tasks.length).toBe(2);
      expect(response.total).toBe(2);
      expect(response.page).toBe(1);
      expect(response.page_size).toBe(10);
      expect(response.has_more).toBe(false);
    });

    it('should filter tasks by status', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'pending' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'completed' });

      const filters: TaskFilters = { status: ['pending'] };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].status).toBe('pending');
    });

    it('should filter tasks by priority', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, priority: 'high' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, priority: 'low' });

      const filters: TaskFilters = { priority: ['high'] };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].priority).toBe('high');
    });

    it('should filter tasks by assignee', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, assigned_to_user_id: 'user-1' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, assigned_to_user_id: 'user-2' });

      const filters: TaskFilters = { assignee: ['user-1'] };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].assigned_to_user_id).toBe('user-1');
    });

    it('should search tasks by title', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, title: 'Upload COI' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, title: 'Review policy' });

      const filters: TaskFilters = { search: 'upload' };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toContain('Upload');
    });

    it('should search tasks by description', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, description: 'Needs urgent attention' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, description: 'Regular task' });

      const filters: TaskFilters = { search: 'urgent' };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].description).toContain('urgent');
    });

    it('should paginate results correctly', async () => {
      // Create 25 tasks
      for (let i = 0; i < 25; i++) {
        await MockDatabase.insert<Task>('tasks', { ...mockTask, title: `Task ${i}` });
      }

      const page1 = await taskService.getTasks(undefined, 1, 10);
      expect(page1.tasks.length).toBe(10);
      expect(page1.has_more).toBe(true);

      const page2 = await taskService.getTasks(undefined, 2, 10);
      expect(page2.tasks.length).toBe(10);
      expect(page2.has_more).toBe(true);

      const page3 = await taskService.getTasks(undefined, 3, 10);
      expect(page3.tasks.length).toBe(5);
      expect(page3.has_more).toBe(false);
    });

    it('should filter by date range', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2025-01-15' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2025-02-15' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2025-03-15' });

      const filters: TaskFilters = {
        date_range: { start: '2025-02-01', end: '2025-02-28' },
      };
      const response = await taskService.getTasks(filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].due_date).toBe('2025-02-15');
    });
  });

  describe('getTask', () => {
    it('should return task by ID', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const result = await taskService.getTask(task.id);

      expect(result.id).toBe(task.id);
      expect(result.title).toBe(mockTask.title);
    });

    it('should throw error if task not found', async () => {
      await expect(taskService.getTask('nonexistent')).rejects.toThrow('Task not found');
    });
  });

  describe('updateTask', () => {
    it('should update task status', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const updated = await taskService.updateTask(task.id, { status: 'completed' });

      expect(updated.status).toBe('completed');
    });

    it('should update task assignee', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const updated = await taskService.updateTask(task.id, { assigned_to_user_id: 'user-3' });

      expect(updated.assigned_to_user_id).toBe('user-3');
    });

    it('should update task priority', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const updated = await taskService.updateTask(task.id, { priority: 'urgent' });

      expect(updated.priority).toBe('urgent');
    });

    /**
     * REQ-259: Status change audit logging tests
     */
    describe('Audit Logging (REQ-259)', () => {
      let logAuditEventSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        // Mock the logAuditEvent function
        logAuditEventSpy = vi.spyOn(auditService, 'logAuditEvent').mockResolvedValue();
      });

      afterEach(() => {
        logAuditEventSpy.mockRestore();
      });

      it('should log status change to audit log', async () => {
        const task = await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'pending' });
        await taskService.updateTask(task.id, { status: 'completed' }, 'user-123');

        // Give the async audit log call time to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(logAuditEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'data_modification',
            action: 'update',
            table_name: 'tasks',
            record_id: task.id,
            operation: 'UPDATE',
            changed_fields: ['status'],
            old_data: { status: 'pending' },
            new_data: { status: 'completed' },
            user_id: 'user-123',
            metadata: expect.objectContaining({
              event_type: 'TASK_STATUS_CHANGED',
              old_status: 'pending',
              new_status: 'completed',
            }),
          })
        );
      });

      it('should not log audit event when status is unchanged', async () => {
        const task = await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'pending' });
        await taskService.updateTask(task.id, { status: 'pending' });

        // Give time for potential async call
        await new Promise(resolve => setTimeout(resolve, 10));

        // Audit should not be called when status doesn't change
        expect(logAuditEventSpy).not.toHaveBeenCalled();
      });

      it('should not log audit event when only non-status fields change', async () => {
        const task = await MockDatabase.insert<Task>('tasks', mockTask);
        await taskService.updateTask(task.id, { title: 'Updated Title' });

        // Give time for potential async call
        await new Promise(resolve => setTimeout(resolve, 10));

        // Audit should not be called for non-status updates
        expect(logAuditEventSpy).not.toHaveBeenCalled();
      });

      it('should continue even if audit log fails', async () => {
        // Mock audit to throw error
        logAuditEventSpy.mockRejectedValue(new Error('Audit service unavailable'));

        const task = await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'pending' });

        // Should not throw - update should succeed even if audit fails
        const updated = await taskService.updateTask(task.id, { status: 'completed' });

        expect(updated.status).toBe('completed');
      });

      it('should capture correct old and new status values', async () => {
        const task = await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'in-progress' });
        await taskService.updateTask(task.id, { status: 'review' }, 'user-456');

        // Give the async audit log call time to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(logAuditEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            old_data: { status: 'in-progress' },
            new_data: { status: 'review' },
            metadata: expect.objectContaining({
              old_status: 'in-progress',
              new_status: 'review',
            }),
          })
        );
      });
    });

    /**
     * REQ-259 TASK-3: Status change notification tests
     */
    describe('Status Notifications (REQ-259 TASK-3)', () => {
      beforeEach(() => {
        MockDatabase.clearTable('notifications');
      });

      afterEach(() => {
        MockDatabase.clearTable('notifications');
      });

      it('should create notification when status changes to completed', async () => {
        const task = await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          status: 'in-progress',
          created_by_user_id: 'creator-123',
          assigned_to_user_id: undefined, // Clear assignee to test creator-only notification
        });

        await taskService.updateTask(task.id, { status: 'completed' }, 'other-user');

        // Give time for async notification creation
        await new Promise((resolve) => setTimeout(resolve, 50));

        const allNotifications = await MockDatabase.query('notifications', {});
        // Filter to only notifications for this specific task
        const notifications = allNotifications.filter((n: any) => n.entity_id === task.id);

        expect(notifications.length).toBe(1);
        expect(notifications[0].user_id).toBe('creator-123');
        expect(notifications[0].type).toBe('task_completed');
        expect(notifications[0].entity_id).toBe(task.id);
      });

      it('should create notifications for both creator and assignee when blocked', async () => {
        const task = await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          status: 'in-progress',
          created_by_user_id: 'creator-123',
          assigned_to_user_id: 'assignee-456',
        });

        await taskService.updateTask(task.id, { status: 'blocked' }, 'other-user');

        // Give time for async notification creation
        await new Promise((resolve) => setTimeout(resolve, 50));

        const allNotifications = await MockDatabase.query('notifications', {});
        // Filter to only notifications for this specific task
        const notifications = allNotifications.filter((n: any) => n.entity_id === task.id);

        expect(notifications.length).toBe(2);

        const recipientIds = notifications.map((n: any) => n.user_id);
        expect(recipientIds).toContain('creator-123');
        expect(recipientIds).toContain('assignee-456');
      });

      it('should not create notification when changer is the creator', async () => {
        const task = await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          status: 'in-progress',
          created_by_user_id: 'creator-123',
          assigned_to_user_id: undefined, // Clear assignee
        });

        // Creator completes the task themselves
        await taskService.updateTask(task.id, { status: 'completed' }, 'creator-123');

        // Give time for async notification creation
        await new Promise((resolve) => setTimeout(resolve, 50));

        const allNotifications = await MockDatabase.query('notifications', {});
        // Filter to only notifications for this specific task
        const notifications = allNotifications.filter((n: any) => n.entity_id === task.id);

        // No notifications because changer is the creator
        expect(notifications.length).toBe(0);
      });

      it('should not create notification when status is unchanged', async () => {
        const task = await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          status: 'completed',
          created_by_user_id: 'creator-123',
          assigned_to_user_id: undefined, // Clear assignee
        });

        await taskService.updateTask(task.id, { status: 'completed' }, 'other-user');

        // Give time for async notification creation
        await new Promise((resolve) => setTimeout(resolve, 50));

        const allNotifications = await MockDatabase.query('notifications', {});
        // Filter to only notifications for this specific task
        const notifications = allNotifications.filter((n: any) => n.entity_id === task.id);

        expect(notifications.length).toBe(0);
      });

      it('should not create notification for non-notifiable transitions', async () => {
        const task = await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          status: 'pending',
          created_by_user_id: 'creator-123',
          assigned_to_user_id: undefined, // Clear assignee
        });

        // Transition to in-progress doesn't trigger notifications
        await taskService.updateTask(task.id, { status: 'in-progress' }, 'other-user');

        // Give time for async notification creation
        await new Promise((resolve) => setTimeout(resolve, 50));

        const allNotifications = await MockDatabase.query('notifications', {});
        // Filter to only notifications for this specific task
        const notifications = allNotifications.filter((n: any) => n.entity_id === task.id);

        expect(notifications.length).toBe(0);
      });
    });
  });

  describe('bulkUpdateTasks', () => {
    it('should update multiple tasks at once', async () => {
      const task1 = await MockDatabase.insert<Task>('tasks', mockTask);
      const task2 = await MockDatabase.insert<Task>('tasks', mockTask);

      const updated = await taskService.bulkUpdateTasks([task1.id, task2.id], { status: 'completed' });

      expect(updated.length).toBe(2);
      expect(updated[0].status).toBe('completed');
      expect(updated[1].status).toBe('completed');
    });

    it('should update task priority for multiple tasks', async () => {
      const task1 = await MockDatabase.insert<Task>('tasks', mockTask);
      const task2 = await MockDatabase.insert<Task>('tasks', mockTask);

      const updated = await taskService.bulkUpdateTasks([task1.id, task2.id], { priority: 'urgent' });

      expect(updated.every((t) => t.priority === 'urgent')).toBe(true);
    });
  });

  describe('addComment', () => {
    it('should add comment to task', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const comment = await taskService.addComment(task.id, 'user-1', 'This is a comment');

      expect(comment.task_id).toBe(task.id);
      expect(comment.content).toBe('This is a comment');
      expect(comment.user_id).toBe('user-1');
    });

    it('should support mentions in comments', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const comment = await taskService.addComment(
        task.id,
        'user-1',
        '@user-2 please review',
        ['user-2']
      );

      expect(comment.mentions).toEqual(['user-2']);
    });
  });

  describe('getComments', () => {
    it('should return all comments for a task', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      await taskService.addComment(task.id, 'user-1', 'Comment 1');
      await taskService.addComment(task.id, 'user-2', 'Comment 2');

      const comments = await taskService.getComments(task.id);

      expect(comments.length).toBe(2);
      expect(comments[0].content).toBe('Comment 1');
      expect(comments[1].content).toBe('Comment 2');
    });

    it('should return empty array if no comments', async () => {
      const task = await MockDatabase.insert<Task>('tasks', mockTask);
      const comments = await taskService.getComments(task.id);

      expect(comments.length).toBe(0);
    });
  });

  describe('getOverdueTasks', () => {
    it('should return tasks past their due date', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2020-01-01', status: 'pending' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2030-01-01', status: 'pending' });

      const overdue = await taskService.getOverdueTasks();

      expect(overdue.length).toBe(1);
      expect(overdue[0].due_date).toBe('2020-01-01');
    });

    it('should not include completed tasks in overdue', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, due_date: '2020-01-01', status: 'completed' });

      const overdue = await taskService.getOverdueTasks();

      expect(overdue.length).toBe(0);
    });
  });

  describe('exportTasks', () => {
    it('should export tasks as CSV', async () => {
      await MockDatabase.insert<Task>('tasks', mockTask);

      const csv = await taskService.exportTasks();

      expect(csv).toContain('ID,Title,Status,Priority');
      expect(csv).toContain('Test Task');
    });

    it('should respect filters when exporting', async () => {
      await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'pending' });
      await MockDatabase.insert<Task>('tasks', { ...mockTask, status: 'completed', title: 'Completed Task' });

      const csv = await taskService.exportTasks({ status: ['pending'] });

      expect(csv).toContain('Test Task');
      expect(csv).not.toContain('Completed Task');
    });
  });

  /**
   * REQ-260 TASK-2: Inbox View Filtering Tests
   */
  describe('getTasksForInbox (REQ-260)', () => {
    it('should return tasks assigned to the user', async () => {
      // Task assigned to user-1
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Assigned to me',
        created_by_user_id: 'user-2',
        assigned_to_user_id: 'user-1',
      });

      // Task assigned to someone else
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Assigned to other',
        created_by_user_id: 'user-2',
        assigned_to_user_id: 'user-3',
      });

      const response = await taskService.getTasksForInbox('user-1');

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toBe('Assigned to me');
    });

    it('should return self-assigned tasks', async () => {
      // Self-assigned task
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Self-assigned',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });

      const response = await taskService.getTasksForInbox('user-1');

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toBe('Self-assigned');
    });

    it('should return unassigned tasks created by the user', async () => {
      // Unassigned task created by user-1
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'My unassigned task',
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });

      // Unassigned task created by someone else
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Other unassigned task',
        created_by_user_id: 'user-2',
        assigned_to_user_id: undefined,
      });

      const response = await taskService.getTasksForInbox('user-1');

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toBe('My unassigned task');
    });

    it('should exclude tasks created by user but assigned to others', async () => {
      // Task created by user-1 but delegated to user-2
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Delegated task',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });

      const response = await taskService.getTasksForInbox('user-1');

      // Should not appear in inbox (appears in "assigned by me" instead)
      expect(response.tasks.length).toBe(0);
    });

    it('should return empty array when user has no inbox tasks', async () => {
      // Task created by and assigned to someone else
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        created_by_user_id: 'user-2',
        assigned_to_user_id: 'user-3',
      });

      const response = await taskService.getTasksForInbox('user-1');

      expect(response.tasks.length).toBe(0);
      expect(response.total).toBe(0);
    });

    it('should support additional filters on inbox tasks', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'High priority',
        priority: 'high',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });

      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Low priority',
        priority: 'low',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });

      const filters: TaskFilters = { priority: ['high'] };
      const response = await taskService.getTasksForInbox('user-1', filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toBe('High priority');
    });

    it('should paginate inbox tasks correctly', async () => {
      // Create 15 tasks assigned to user-1
      for (let i = 0; i < 15; i++) {
        await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          title: `Inbox task ${i}`,
          created_by_user_id: 'user-2',
          assigned_to_user_id: 'user-1',
        });
      }

      const page1 = await taskService.getTasksForInbox('user-1', undefined, 1, 10);
      expect(page1.tasks.length).toBe(10);
      expect(page1.has_more).toBe(true);

      const page2 = await taskService.getTasksForInbox('user-1', undefined, 2, 10);
      expect(page2.tasks.length).toBe(5);
      expect(page2.has_more).toBe(false);
    });
  });

  /**
   * REQ-260 TASK-3: Assigned by Me View Filtering Tests
   */
  describe('getTasksAssignedByMe (REQ-260)', () => {
    it('should return tasks created by user and assigned to others', async () => {
      // Task delegated by user-1 to user-2
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Delegated to user-2',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });

      // Task delegated by user-1 to user-3
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Delegated to user-3',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-3',
      });

      const response = await taskService.getTasksAssignedByMe('user-1');

      expect(response.tasks.length).toBe(2);
      const titles = response.tasks.map(t => t.title);
      expect(titles).toContain('Delegated to user-2');
      expect(titles).toContain('Delegated to user-3');
    });

    it('should exclude self-assigned tasks', async () => {
      // Self-assigned task (should not appear)
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Self-assigned',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-1',
      });

      const response = await taskService.getTasksAssignedByMe('user-1');

      expect(response.tasks.length).toBe(0);
    });

    it('should exclude unassigned tasks', async () => {
      // Unassigned task (should not appear)
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Unassigned',
        created_by_user_id: 'user-1',
        assigned_to_user_id: undefined,
      });

      const response = await taskService.getTasksAssignedByMe('user-1');

      expect(response.tasks.length).toBe(0);
    });

    it('should exclude tasks created by others', async () => {
      // Task created by someone else
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Created by other',
        created_by_user_id: 'user-2',
        assigned_to_user_id: 'user-3',
      });

      const response = await taskService.getTasksAssignedByMe('user-1');

      expect(response.tasks.length).toBe(0);
    });

    it('should support additional filters on assigned-by-me tasks', async () => {
      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Pending delegated task',
        status: 'pending',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });

      await MockDatabase.insert<Task>('tasks', {
        ...mockTask,
        title: 'Completed delegated task',
        status: 'completed',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'user-2',
      });

      const filters: TaskFilters = { status: ['pending'] };
      const response = await taskService.getTasksAssignedByMe('user-1', filters);

      expect(response.tasks.length).toBe(1);
      expect(response.tasks[0].title).toBe('Pending delegated task');
    });

    it('should paginate assigned-by-me tasks correctly', async () => {
      // Create 15 delegated tasks
      for (let i = 0; i < 15; i++) {
        await MockDatabase.insert<Task>('tasks', {
          ...mockTask,
          title: `Delegated task ${i}`,
          created_by_user_id: 'user-1',
          assigned_to_user_id: 'user-2',
        });
      }

      const page1 = await taskService.getTasksAssignedByMe('user-1', undefined, 1, 10);
      expect(page1.tasks.length).toBe(10);
      expect(page1.has_more).toBe(true);

      const page2 = await taskService.getTasksAssignedByMe('user-1', undefined, 2, 10);
      expect(page2.tasks.length).toBe(5);
      expect(page2.has_more).toBe(false);
    });
  });
});
