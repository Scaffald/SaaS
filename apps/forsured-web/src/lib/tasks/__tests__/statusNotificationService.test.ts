/**
 * REQ-259: Status Change Notifications
 * TASK-3: Tests for status notification service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createStatusChangeNotifications,
  shouldNotifyStatusChange,
  determineRecipients,
} from '../statusNotificationService';
import { Task } from '../../../types';
import MockDatabase from '../../../utils/mockDataStore';
import { STATUS_NOTIFICATION_CONFIG } from '../statusNotificationConfig';

describe('statusNotificationService', () => {
  const mockTask: Task = {
    id: 'task-123',
    title: 'Test Task',
    description: 'Test description',
    status: 'in-progress',
    priority: 'high',
    due_date: '2025-12-31',
    created_by_user_id: 'creator-user',
    assigned_to_user_id: 'assignee-user',
    project_id: 'project-1',
    task_type: 'coi_upload',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    MockDatabase.clearTable('notifications');
  });

  afterEach(() => {
    MockDatabase.clearTable('notifications');
  });

  describe('shouldNotifyStatusChange', () => {
    it('should return true for transition to completed', () => {
      expect(shouldNotifyStatusChange('in-progress', 'completed')).toBe(true);
    });

    it('should return true for transition to blocked', () => {
      expect(shouldNotifyStatusChange('in-progress', 'blocked')).toBe(true);
    });

    it('should return true for transition to review', () => {
      expect(shouldNotifyStatusChange('in-progress', 'review')).toBe(true);
    });

    it('should return true for transition to cancelled', () => {
      expect(shouldNotifyStatusChange('pending', 'cancelled')).toBe(true);
    });

    it('should return false for transition to pending', () => {
      expect(shouldNotifyStatusChange('completed', 'pending')).toBe(false);
    });

    it('should return false for transition to in-progress', () => {
      expect(shouldNotifyStatusChange('pending', 'in-progress')).toBe(false);
    });
  });

  describe('determineRecipients', () => {
    const completedConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'completed')!;
    const blockedConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'blocked')!;
    const cancelledConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'cancelled')!;

    it('should notify creator for completed status', () => {
      const recipients = determineRecipients(completedConfig, mockTask, 'other-user');

      expect(recipients).toContain('creator-user');
      expect(recipients).not.toContain('assignee-user');
    });

    it('should notify both creator and assignee for blocked status', () => {
      const recipients = determineRecipients(blockedConfig, mockTask, 'other-user');

      expect(recipients).toContain('creator-user');
      expect(recipients).toContain('assignee-user');
    });

    it('should notify assignee for cancelled status', () => {
      const recipients = determineRecipients(cancelledConfig, mockTask, 'other-user');

      expect(recipients).not.toContain('creator-user');
      expect(recipients).toContain('assignee-user');
    });

    it('should not notify the changer when they are the creator', () => {
      const recipients = determineRecipients(completedConfig, mockTask, 'creator-user');

      expect(recipients).not.toContain('creator-user');
    });

    it('should not notify the changer when they are the assignee', () => {
      const recipients = determineRecipients(cancelledConfig, mockTask, 'assignee-user');

      expect(recipients).not.toContain('assignee-user');
    });

    it('should return empty array when task has no creator or assignee', () => {
      const taskWithoutUsers: Task = {
        ...mockTask,
        created_by_user_id: '',
        assigned_to_user_id: undefined,
      };

      const recipients = determineRecipients(blockedConfig, taskWithoutUsers, 'some-user');

      expect(recipients).toHaveLength(0);
    });
  });

  describe('createStatusChangeNotifications', () => {
    it('should create notification when transitioning to completed', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'completed' },
        'in-progress',
        'completed',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(1);
      expect(result.recipientIds).toContain('creator-user');
      expect(result.notificationType).toBe('task_completed');
    });

    it('should create notifications for both creator and assignee when blocked', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'blocked' },
        'in-progress',
        'blocked',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(2);
      expect(result.recipientIds).toContain('creator-user');
      expect(result.recipientIds).toContain('assignee-user');
      expect(result.notificationType).toBe('task_blocked');
    });

    it('should not create notification when transitioning to in-progress', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'in-progress' },
        'pending',
        'in-progress',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(0);
      expect(result.recipientIds).toHaveLength(0);
      expect(result.notificationType).toBe('none');
    });

    it('should not create notification when changer is the only recipient', async () => {
      // Assignee completes their own task - creator is the changer
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'completed' },
        'in-progress',
        'completed',
        'creator-user' // Creator is the one completing it
      );

      expect(result.notificationsCreated).toBe(0);
      expect(result.recipientIds).toHaveLength(0);
    });

    it('should store notification in database with correct metadata', async () => {
      await createStatusChangeNotifications(
        { ...mockTask, status: 'completed' },
        'in-progress',
        'completed',
        'other-user'
      );

      // Query the notifications table
      const notifications = await MockDatabase.query('notifications', {});

      expect(notifications.length).toBe(1);
      expect(notifications[0].user_id).toBe('creator-user');
      expect(notifications[0].type).toBe('task_completed');
      expect(notifications[0].entity_type).toBe('task');
      expect(notifications[0].entity_id).toBe('task-123');
      expect(notifications[0].triggered_by).toBe('other-user');
      expect(notifications[0].is_read).toBe(false);
      expect(notifications[0].metadata.old_status).toBe('in-progress');
      expect(notifications[0].metadata.new_status).toBe('completed');
    });

    it('should create notification with correct title and message', async () => {
      await createStatusChangeNotifications(
        { ...mockTask, status: 'completed' },
        'in-progress',
        'completed',
        'other-user'
      );

      const notifications = await MockDatabase.query('notifications', {});

      expect(notifications[0].title).toBe('Task completed');
      expect(notifications[0].message).toContain('Test Task');
      expect(notifications[0].message).toContain('completed');
    });

    it('should handle blocked status with high priority metadata', async () => {
      await createStatusChangeNotifications(
        { ...mockTask, status: 'blocked' },
        'in-progress',
        'blocked',
        'other-user'
      );

      const notifications = await MockDatabase.query('notifications', {});

      // Should have 2 notifications (creator and assignee)
      expect(notifications.length).toBe(2);

      // Both should have high_priority flag
      notifications.forEach((notification: any) => {
        expect(notification.metadata.high_priority).toBe(true);
      });
    });

    it('should handle review status notification', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'review' },
        'in-progress',
        'review',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(1);
      expect(result.notificationType).toBe('status_change');

      const notifications = await MockDatabase.query('notifications', {});
      expect(notifications[0].title).toBe('Task ready for review');
    });

    it('should handle cancelled status notification', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'cancelled' },
        'in-progress',
        'cancelled',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(1);
      expect(result.recipientIds).toContain('assignee-user');
      expect(result.notificationType).toBe('status_change');

      const notifications = await MockDatabase.query('notifications', {});
      expect(notifications[0].title).toBe('Task cancelled');
    });

    it('should handle errors gracefully without throwing', async () => {
      // Mock console.error to verify it's called
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a task with invalid data that might cause issues
      const invalidTask = { ...mockTask, id: null } as unknown as Task;

      // Should not throw
      const result = await createStatusChangeNotifications(
        invalidTask,
        'in-progress',
        'completed',
        'other-user'
      );

      // May or may not create notifications depending on implementation
      // But should not throw
      expect(result).toBeDefined();

      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined oldStatus', async () => {
      const result = await createStatusChangeNotifications(
        { ...mockTask, status: 'completed' },
        undefined,
        'completed',
        'other-user'
      );

      expect(result.notificationsCreated).toBe(1);

      const notifications = await MockDatabase.query('notifications', {});
      expect(notifications[0].metadata.old_status).toBeUndefined();
    });
  });
});
