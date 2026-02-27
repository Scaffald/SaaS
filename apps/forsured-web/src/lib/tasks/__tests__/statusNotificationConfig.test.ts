/**
 * Status Change Notifications
 * TASK-3: Tests for status notification configuration
 */

import { describe, it, expect } from 'vitest';
import {
  STATUS_NOTIFICATION_CONFIG,
  findStatusTransitionConfig,
  formatNotificationMessage,
  getStatusLabel,
} from '../statusNotificationConfig';
import { TaskStatus } from '../../../types';

describe('statusNotificationConfig', () => {
  describe('STATUS_NOTIFICATION_CONFIG', () => {
    it('should have configuration for completed status', () => {
      const completedConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'completed');

      expect(completedConfig).toBeDefined();
      expect(completedConfig?.recipients).toBe('creator');
      expect(completedConfig?.notificationType).toBe('task_completed');
    });

    it('should have configuration for blocked status with high priority', () => {
      const blockedConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'blocked');

      expect(blockedConfig).toBeDefined();
      expect(blockedConfig?.recipients).toBe('both');
      expect(blockedConfig?.notificationType).toBe('task_blocked');
      expect(blockedConfig?.highPriority).toBe(true);
    });

    it('should have configuration for review status', () => {
      const reviewConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'review');

      expect(reviewConfig).toBeDefined();
      expect(reviewConfig?.recipients).toBe('creator');
      expect(reviewConfig?.notificationType).toBe('status_change');
    });

    it('should have configuration for cancelled status', () => {
      const cancelledConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'cancelled');

      expect(cancelledConfig).toBeDefined();
      expect(cancelledConfig?.recipients).toBe('assignee');
      expect(cancelledConfig?.notificationType).toBe('status_change');
    });

    it('should not trigger notifications for pending or in-progress status', () => {
      const pendingConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'pending');
      const inProgressConfig = STATUS_NOTIFICATION_CONFIG.find((c) => c.toStatus === 'in-progress');

      expect(pendingConfig).toBeUndefined();
      expect(inProgressConfig).toBeUndefined();
    });
  });

  describe('findStatusTransitionConfig', () => {
    it('should find config when transitioning to completed', () => {
      const config = findStatusTransitionConfig('in-progress' as TaskStatus, 'completed');

      expect(config).toBeDefined();
      expect(config?.toStatus).toBe('completed');
    });

    it('should find config when transitioning to blocked', () => {
      const config = findStatusTransitionConfig('in-progress' as TaskStatus, 'blocked');

      expect(config).toBeDefined();
      expect(config?.toStatus).toBe('blocked');
    });

    it('should find config when transitioning to review', () => {
      const config = findStatusTransitionConfig('in-progress' as TaskStatus, 'review');

      expect(config).toBeDefined();
      expect(config?.toStatus).toBe('review');
    });

    it('should find config when transitioning to cancelled', () => {
      const config = findStatusTransitionConfig('pending' as TaskStatus, 'cancelled');

      expect(config).toBeDefined();
      expect(config?.toStatus).toBe('cancelled');
    });

    it('should return undefined when transitioning to pending', () => {
      const config = findStatusTransitionConfig('completed' as TaskStatus, 'pending');

      expect(config).toBeUndefined();
    });

    it('should return undefined when transitioning to in-progress', () => {
      const config = findStatusTransitionConfig('pending' as TaskStatus, 'in-progress');

      expect(config).toBeUndefined();
    });

    it('should handle undefined old status', () => {
      const config = findStatusTransitionConfig(undefined, 'completed');

      expect(config).toBeDefined();
      expect(config?.toStatus).toBe('completed');
    });
  });

  describe('formatNotificationMessage', () => {
    it('should replace taskTitle placeholder', () => {
      const message = formatNotificationMessage('Task "{taskTitle}" completed', {
        taskTitle: 'Upload COI',
        newStatus: 'completed',
      });

      expect(message).toBe('Task "Upload COI" completed');
    });

    it('should replace all placeholders', () => {
      const message = formatNotificationMessage(
        'Task "{taskTitle}" changed from {oldStatus} to {newStatus} by {changedBy}',
        {
          taskTitle: 'Review Policy',
          oldStatus: 'in-progress',
          newStatus: 'review',
          changedBy: 'John Doe',
        }
      );

      expect(message).toBe(
        'Task "Review Policy" changed from in-progress to review by John Doe'
      );
    });

    it('should use default values for missing placeholders', () => {
      const message = formatNotificationMessage('{taskTitle} - {oldStatus} - {changedBy}', {
        taskTitle: 'Test',
        newStatus: 'completed',
      });

      expect(message).toBe('Test - unknown - someone');
    });
  });

  describe('getStatusLabel', () => {
    it('should return "Pending" for pending status', () => {
      expect(getStatusLabel('pending')).toBe('Pending');
    });

    it('should return "In Progress" for in-progress status', () => {
      expect(getStatusLabel('in-progress')).toBe('In Progress');
    });

    it('should return "In Review" for review status', () => {
      expect(getStatusLabel('review')).toBe('In Review');
    });

    it('should return "Completed" for completed status', () => {
      expect(getStatusLabel('completed')).toBe('Completed');
    });

    it('should return "Blocked" for blocked status', () => {
      expect(getStatusLabel('blocked')).toBe('Blocked');
    });

    it('should return "Cancelled" for cancelled status', () => {
      expect(getStatusLabel('cancelled')).toBe('Cancelled');
    });

    it('should return "To Do" for todo status', () => {
      expect(getStatusLabel('todo')).toBe('To Do');
    });

    it('should return raw status for unknown status', () => {
      expect(getStatusLabel('unknown-status' as TaskStatus)).toBe('unknown-status');
    });
  });
});
