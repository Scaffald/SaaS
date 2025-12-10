/**
 * REQ-259: Status Change Notifications
 * TASK-3: Configuration defining which status transitions trigger notifications
 *
 * This configuration determines:
 * - Which status transitions should generate notifications
 * - Who should be notified (assignee, creator, both)
 * - The notification message template
 */

import { TaskStatus } from '../../types';

/**
 * Notification recipient type
 */
export type NotificationRecipient = 'assignee' | 'creator' | 'both';

/**
 * Notification type for status changes
 */
export type StatusNotificationType = 'status_change' | 'task_completed' | 'task_blocked';

/**
 * Status transition notification configuration
 */
export interface StatusTransitionConfig {
  /** New status that triggers the notification */
  toStatus: TaskStatus;
  /** Optional: Only trigger if transitioning from specific statuses */
  fromStatuses?: TaskStatus[];
  /** Who should receive the notification */
  recipients: NotificationRecipient;
  /** Notification type to use */
  notificationType: StatusNotificationType;
  /** Title template (supports {taskTitle} placeholder) */
  titleTemplate: string;
  /** Message template (supports {taskTitle}, {oldStatus}, {newStatus}, {changedBy} placeholders) */
  messageTemplate: string;
  /** Whether this notification is high priority */
  highPriority?: boolean;
}

/**
 * Configuration for status transitions that trigger notifications
 *
 * Key transitions that warrant notifications:
 * - completed: Task has been finished - notify creator
 * - blocked: Task is blocked and needs attention - notify creator and assignee
 * - review: Task is ready for review - notify creator
 * - cancelled: Task has been cancelled - notify assignee if different from changer
 */
export const STATUS_NOTIFICATION_CONFIG: StatusTransitionConfig[] = [
  // Task completed - notify the creator
  {
    toStatus: 'completed',
    recipients: 'creator',
    notificationType: 'task_completed',
    titleTemplate: 'Task completed',
    messageTemplate: 'Task "{taskTitle}" has been marked as completed by {changedBy}',
    highPriority: false,
  },
  // Task blocked - notify both creator and assignee (high priority)
  {
    toStatus: 'blocked',
    recipients: 'both',
    notificationType: 'task_blocked',
    titleTemplate: 'Task blocked',
    messageTemplate: 'Task "{taskTitle}" has been marked as blocked. Previous status: {oldStatus}',
    highPriority: true,
  },
  // Task moved to review - notify creator
  {
    toStatus: 'review',
    recipients: 'creator',
    notificationType: 'status_change',
    titleTemplate: 'Task ready for review',
    messageTemplate: 'Task "{taskTitle}" is now ready for review',
    highPriority: false,
  },
  // Task cancelled - notify assignee if there is one
  {
    toStatus: 'cancelled',
    recipients: 'assignee',
    notificationType: 'status_change',
    titleTemplate: 'Task cancelled',
    messageTemplate: 'Task "{taskTitle}" has been cancelled by {changedBy}',
    highPriority: false,
  },
];

/**
 * Find notification config for a status transition
 *
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 * @returns The notification config if this transition should trigger a notification, undefined otherwise
 */
export function findStatusTransitionConfig(
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus
): StatusTransitionConfig | undefined {
  return STATUS_NOTIFICATION_CONFIG.find((config) => {
    // Must match the target status
    if (config.toStatus !== newStatus) {
      return false;
    }

    // If fromStatuses is specified, oldStatus must be in the list
    if (config.fromStatuses && oldStatus) {
      return config.fromStatuses.includes(oldStatus);
    }

    return true;
  });
}

/**
 * Format a notification message using placeholders
 *
 * @param template - The message template with placeholders
 * @param values - The values to substitute
 * @returns The formatted message
 */
export function formatNotificationMessage(
  template: string,
  values: {
    taskTitle: string;
    oldStatus?: string;
    newStatus: string;
    changedBy?: string;
  }
): string {
  let message = template;

  message = message.replace('{taskTitle}', values.taskTitle);
  message = message.replace('{oldStatus}', values.oldStatus || 'unknown');
  message = message.replace('{newStatus}', values.newStatus);
  message = message.replace('{changedBy}', values.changedBy || 'someone');

  return message;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    review: 'In Review',
    completed: 'Completed',
    blocked: 'Blocked',
    cancelled: 'Cancelled',
    todo: 'To Do',
  };

  return labels[status] || status;
}
