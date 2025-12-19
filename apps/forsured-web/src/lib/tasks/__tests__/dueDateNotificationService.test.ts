/**
 * REQ-267: Due Date Inference & Management
 * TASK-4: Implement Due Date Change Notifications
 *
 * Tests for the Due Date Notification service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import MockDatabase from '../../../utils/mockDataStore';
import { Task, Notification } from '../../../types';
import {
  getSourceDescription,
  formatDateForDisplay,
  buildNotificationMessage,
  getNotificationRecipients,
  notifyDueDateChange,
  notifyAutoRecalculatedDueDate,
  SYSTEM_USER,
  NotificationUser,
  dueDateNotificationService,
} from '../dueDateNotificationService';

describe('REQ-267: Due Date Notification Service', () => {
  beforeEach(() => {
    MockDatabase.clearAll();
  });

  describe('getSourceDescription', () => {
    it('should return correct description for manual source', () => {
      expect(getSourceDescription('manual')).toBe('manually updated');
    });

    it('should return correct description for gc_set source', () => {
      expect(getSourceDescription('gc_set')).toBe('set by General Contractor');
    });

    it('should return correct description for broker_set source', () => {
      expect(getSourceDescription('broker_set')).toBe('set by Broker');
    });

    it('should return correct description for inferred_policy source', () => {
      expect(getSourceDescription('inferred_policy')).toBe('auto-calculated from policy expiration');
    });

    it('should return correct description for inferred_project source', () => {
      expect(getSourceDescription('inferred_project')).toBe(
        'auto-calculated from project start date'
      );
    });

    it('should return correct description for inferred_onboarding source', () => {
      expect(getSourceDescription('inferred_onboarding')).toBe(
        'auto-calculated from onboarding deadline'
      );
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date as readable string', () => {
      const formatted = formatDateForDisplay('2024-06-15T12:00:00.000Z');
      // Format varies by locale/timezone, but should contain the year and be a non-empty string
      expect(formatted).toContain('2024');
      expect(formatted.length).toBeGreaterThan(5);
      // Should contain either 14, 15, or 16 depending on timezone
      expect(formatted).toMatch(/1[456]/);
    });

    it('should return "none" for undefined date', () => {
      expect(formatDateForDisplay(undefined)).toBe('none');
    });
  });

  describe('buildNotificationMessage', () => {
    const task: Task = {
      id: 'task-1',
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      created_by_user_id: 'creator-1',
      created_at: '2024-01-01T00:00:00.000Z',
    };

    it('should build message for manual change by user', () => {
      const user: NotificationUser = {
        id: 'user-1',
        name: 'John Doe',
      };

      const message = buildNotificationMessage(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-15T00:00:00.000Z',
        user,
        'manual'
      );

      expect(message).toContain('Test Task');
      expect(message).toContain('manually updated');
      expect(message).toContain('John Doe');
      expect(message).toContain('changed from');
    });

    it('should build message for system auto-recalculation', () => {
      const message = buildNotificationMessage(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-10T00:00:00.000Z',
        SYSTEM_USER,
        'inferred_policy'
      );

      expect(message).toContain('Test Task');
      expect(message).toContain('auto-calculated from policy expiration');
      expect(message).not.toContain('by System');
    });

    it('should handle broker_set source', () => {
      const user: NotificationUser = {
        id: 'broker-1',
        name: 'Jane Broker',
      };

      const message = buildNotificationMessage(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-15T00:00:00.000Z',
        user,
        'broker_set'
      );

      expect(message).toContain('set by Broker');
      expect(message).toContain('Jane Broker');
    });
  });

  describe('getNotificationRecipients', () => {
    it('should include assignee and creator, excluding changer', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const changedBy: NotificationUser = {
        id: 'other-user',
        name: 'Other User',
      };

      const recipients = getNotificationRecipients(task, changedBy);

      expect(recipients).toContain('creator-1');
      expect(recipients).toContain('assignee-1');
      expect(recipients).not.toContain('other-user');
    });

    it('should exclude creator if they made the change', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'assignee-1',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const changedBy: NotificationUser = {
        id: 'user-1',
        name: 'User 1',
      };

      const recipients = getNotificationRecipients(task, changedBy);

      expect(recipients).not.toContain('user-1');
      expect(recipients).toContain('assignee-1');
    });

    it('should include both assignee and creator for system changes', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const recipients = getNotificationRecipients(task, SYSTEM_USER);

      expect(recipients).toContain('creator-1');
      expect(recipients).toContain('assignee-1');
    });

    it('should return empty array if no recipients', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const changedBy: NotificationUser = {
        id: 'user-1',
        name: 'User 1',
      };

      const recipients = getNotificationRecipients(task, changedBy);

      expect(recipients).toHaveLength(0);
    });
  });

  describe('notifyDueDateChange', () => {
    it('should send notification on manual due date change (Test 8)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
      });

      const changedBy: NotificationUser = {
        id: 'broker-1',
        name: 'Test Broker',
      };

      const result = await notifyDueDateChange(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-15T00:00:00.000Z',
        changedBy,
        'broker_set'
      );

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(2); // creator and assignee
      expect(result.recipients).toContain('creator-1');
      expect(result.recipients).toContain('assignee-1');

      // Verify notifications were created in database
      const notifications = await MockDatabase.query<Notification>('notifications', {});
      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe('due_date_change');
      expect(notifications[0].message).toContain('Test Task');
      expect(notifications[0].message).toContain('Test Broker');
    });

    it('should send notification on auto-recalculated due date (Test 9)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Policy Task',
        status: 'pending',
        priority: 'high',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'assignee-1',
      });

      const result = await notifyAutoRecalculatedDueDate(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-10T00:00:00.000Z',
        'inferred_policy'
      );

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(2);

      // Verify notification content
      const notifications = await MockDatabase.query<Notification>('notifications', {});
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].message).toContain('auto-calculated from policy');
    });

    it('should return empty result when no recipients', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Solo Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
      });

      const changedBy: NotificationUser = {
        id: 'user-1',
        name: 'User 1',
      };

      const result = await notifyDueDateChange(
        task,
        undefined,
        '2024-06-15T00:00:00.000Z',
        changedBy,
        'manual'
      );

      expect(result.success).toBe(true);
      expect(result.notificationsSent).toBe(0);
      expect(result.recipients).toHaveLength(0);
    });

    it('should handle notifications gracefully (Test 10 - no failures in test)', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Test Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'creator-1',
        assigned_to_user_id: 'assignee-1',
      });

      const changedBy: NotificationUser = {
        id: 'changer-1',
        name: 'Changer',
      };

      // This should complete successfully without throwing
      const result = await notifyDueDateChange(
        task,
        '2024-06-01T00:00:00.000Z',
        '2024-06-15T00:00:00.000Z',
        changedBy,
        'gc_set'
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('notifyAutoRecalculatedDueDate', () => {
    it('should use SYSTEM_USER as changedBy', async () => {
      const task = await MockDatabase.insert<Task>('tasks', {
        title: 'Project Task',
        status: 'pending',
        priority: 'medium',
        created_by_user_id: 'user-1',
        assigned_to_user_id: 'assignee-1',
      });

      await notifyAutoRecalculatedDueDate(
        task,
        '2024-05-15T00:00:00.000Z',
        '2024-04-24T00:00:00.000Z',
        'inferred_project'
      );

      const notifications = await MockDatabase.query<Notification>('notifications', {});
      expect(notifications.length).toBeGreaterThan(0);
      // Message should not contain "by System" since it's auto-calculated
      expect(notifications[0].message).toContain('auto-calculated from project start date');
    });
  });

  describe('dueDateNotificationService export', () => {
    it('should export all methods', () => {
      expect(dueDateNotificationService.getSourceDescription).toBeDefined();
      expect(dueDateNotificationService.formatDateForDisplay).toBeDefined();
      expect(dueDateNotificationService.buildNotificationMessage).toBeDefined();
      expect(dueDateNotificationService.getNotificationRecipients).toBeDefined();
      expect(dueDateNotificationService.sendNotificationToUser).toBeDefined();
      expect(dueDateNotificationService.notifyDueDateChange).toBeDefined();
      expect(dueDateNotificationService.notifyAutoRecalculatedDueDate).toBeDefined();
      expect(dueDateNotificationService.SYSTEM_USER).toBeDefined();
    });
  });
});
