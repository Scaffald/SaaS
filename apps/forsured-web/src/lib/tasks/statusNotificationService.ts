/**
 * REQ-259: Status Change Notifications
 * TASK-3: Service to create notifications when task status changes
 *
 * This service:
 * - Checks if a status transition should trigger notifications
 * - Determines recipients based on task and configuration
 * - Creates notifications in the database
 * - Is fire-and-forget (errors are logged but don't block operations)
 */

import { Task, TaskStatus } from '../../types';
import MockDatabase from '../../utils/mockDataStore';
import {
  findStatusTransitionConfig,
  formatNotificationMessage,
  getStatusLabel,
  NotificationRecipient,
  StatusTransitionConfig,
} from './statusNotificationConfig';

/**
 * Notification record structure matching the database schema
 */
export interface NotificationRecord {
  id: string;
  user_id: string;
  organization_id?: string;
  type: string;
  title: string;
  message: string;
  entity_type: 'task' | 'project' | 'document' | 'policy';
  entity_id: string;
  triggered_by?: string;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Result of creating status change notifications
 */
export interface StatusNotificationResult {
  notificationsCreated: number;
  recipientIds: string[];
  notificationType: string;
}

/**
 * Determine notification recipients based on config and task
 *
 * @param config - The notification configuration
 * @param task - The task being updated
 * @param changerId - The user making the change
 * @returns Array of user IDs to notify
 */
export function determineRecipients(
  config: StatusTransitionConfig,
  task: Task,
  changerId?: string
): string[] {
  const recipients = new Set<string>();

  switch (config.recipients) {
    case 'creator':
      if (task.created_by_user_id && task.created_by_user_id !== changerId) {
        recipients.add(task.created_by_user_id);
      }
      break;

    case 'assignee':
      if (task.assigned_to_user_id && task.assigned_to_user_id !== changerId) {
        recipients.add(task.assigned_to_user_id);
      }
      break;

    case 'both':
      if (task.created_by_user_id && task.created_by_user_id !== changerId) {
        recipients.add(task.created_by_user_id);
      }
      if (task.assigned_to_user_id && task.assigned_to_user_id !== changerId) {
        recipients.add(task.assigned_to_user_id);
      }
      break;
  }

  return Array.from(recipients);
}

/**
 * Create a notification record for a recipient
 *
 * @param recipientId - The user ID to notify
 * @param config - The notification configuration
 * @param task - The task that was updated
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 * @param changerId - The user who made the change
 * @returns The created notification record
 */
async function createNotificationRecord(
  recipientId: string,
  config: StatusTransitionConfig,
  task: Task,
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus,
  changerId?: string
): Promise<NotificationRecord> {
  const title = formatNotificationMessage(config.titleTemplate, {
    taskTitle: task.title,
    oldStatus: oldStatus ? getStatusLabel(oldStatus) : undefined,
    newStatus: getStatusLabel(newStatus),
    changedBy: changerId,
  });

  const message = formatNotificationMessage(config.messageTemplate, {
    taskTitle: task.title,
    oldStatus: oldStatus ? getStatusLabel(oldStatus) : undefined,
    newStatus: getStatusLabel(newStatus),
    changedBy: changerId,
  });

  const notification: Omit<NotificationRecord, 'id' | 'created_at'> = {
    user_id: recipientId,
    organization_id: task.project_id, // Use project_id as org context
    type: config.notificationType,
    title,
    message,
    entity_type: 'task',
    entity_id: task.id,
    triggered_by: changerId,
    is_read: false,
    read_at: null,
    metadata: {
      old_status: oldStatus,
      new_status: newStatus,
      task_title: task.title,
      high_priority: config.highPriority || false,
    },
  };

  return MockDatabase.insert<NotificationRecord>('notifications', notification);
}

/**
 * Create status change notifications for a task
 *
 * This function is fire-and-forget - it logs errors but doesn't throw.
 * This ensures notification failures don't block task status updates.
 *
 * @param task - The task (with updated status)
 * @param oldStatus - The previous status before the update
 * @param newStatus - The new status after the update
 * @param changerId - The user who made the change (optional)
 * @returns Result with count of notifications created
 */
export async function createStatusChangeNotifications(
  task: Task,
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus,
  changerId?: string
): Promise<StatusNotificationResult> {
  try {
    // Find the notification config for this transition
    const config = findStatusTransitionConfig(oldStatus, newStatus);

    if (!config) {
      // This transition doesn't require notifications
      return {
        notificationsCreated: 0,
        recipientIds: [],
        notificationType: 'none',
      };
    }

    // Determine who should receive the notification
    const recipientIds = determineRecipients(config, task, changerId);

    if (recipientIds.length === 0) {
      // No recipients to notify (e.g., creator is the one making the change)
      return {
        notificationsCreated: 0,
        recipientIds: [],
        notificationType: config.notificationType,
      };
    }

    // Create notifications for each recipient
    const notificationPromises = recipientIds.map((recipientId) =>
      createNotificationRecord(recipientId, config, task, oldStatus, newStatus, changerId)
    );

    await Promise.all(notificationPromises);

    return {
      notificationsCreated: recipientIds.length,
      recipientIds,
      notificationType: config.notificationType,
    };
  } catch (error) {
    // Log but don't throw - notification failures shouldn't block task updates
    console.error('Failed to create status change notifications:', error);
    return {
      notificationsCreated: 0,
      recipientIds: [],
      notificationType: 'error',
    };
  }
}

/**
 * Check if a status transition should trigger notifications
 *
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 * @returns True if this transition should create notifications
 */
export function shouldNotifyStatusChange(
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus
): boolean {
  return findStatusTransitionConfig(oldStatus, newStatus) !== undefined;
}

export const statusNotificationService = {
  createStatusChangeNotifications,
  shouldNotifyStatusChange,
  determineRecipients,
};
