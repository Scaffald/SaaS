/**
 * REQ-267: Due Date Inference & Management
 * TASK-4: Implement Due Date Change Notifications
 *
 * Service for sending notifications when task due dates change.
 * Handles both manual changes and auto-recalculation changes.
 */

import { Task, DueDateSource, Notification } from '../../types';

/**
 * User info for notification purposes
 */
export interface NotificationUser {
  id: string;
  name: string;
  email?: string;
}

/**
 * System user for auto-recalculation notifications
 */
export const SYSTEM_USER: NotificationUser = {
  id: 'system',
  name: 'System',
};

/**
 * Notification for due date change
 */
export interface DueDateChangeNotification {
  type: 'due_date_change';
  taskId: string;
  taskTitle: string;
  oldDueDate?: string;
  newDueDate?: string;
  changedBy: NotificationUser;
  source: DueDateSource;
  message: string;
  timestamp: string;
}

/**
 * Result of notification sending
 */
export interface NotificationResult {
  success: boolean;
  notificationsSent: number;
  recipients: string[];
  errors: string[];
}

/**
 * Get human-readable source description
 *
 * @param source - The due date source
 * @returns Human-readable description
 */
export function getSourceDescription(source: DueDateSource): string {
  switch (source) {
    case 'manual':
      return 'manually updated';
    case 'gc_set':
      return 'set by General Contractor';
    case 'broker_set':
      return 'set by Broker';
    case 'inferred_policy':
      return 'auto-calculated from policy expiration';
    case 'inferred_project':
      return 'auto-calculated from project start date';
    case 'inferred_onboarding':
      return 'auto-calculated from onboarding deadline';
    default:
      return 'updated';
  }
}

/**
 * Format date for display in notification
 *
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDateForDisplay(dateString: string | undefined): string {
  if (!dateString) {
    return 'none';
  }

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Build notification message for due date change
 *
 * @param task - The task that changed
 * @param oldDueDate - Previous due date
 * @param newDueDate - New due date
 * @param changedBy - User who made the change
 * @param source - Source of the change
 * @returns Formatted notification message
 */
export function buildNotificationMessage(
  task: Task,
  oldDueDate: string | undefined,
  newDueDate: string | undefined,
  changedBy: NotificationUser,
  source: DueDateSource
): string {
  const sourceDesc = getSourceDescription(source);
  const oldDateStr = formatDateForDisplay(oldDueDate);
  const newDateStr = formatDateForDisplay(newDueDate);

  if (changedBy.id === 'system') {
    return `Task "${task.title}" due date ${sourceDesc}: changed from ${oldDateStr} to ${newDateStr}`;
  }

  return `Task "${task.title}" due date ${sourceDesc} by ${changedBy.name}: changed from ${oldDateStr} to ${newDateStr}`;
}

/**
 * Identify recipients for due date change notification
 *
 * @param task - The task that changed
 * @param changedBy - User who made the change (excluded from recipients)
 * @returns Array of user IDs to notify
 */
export function getNotificationRecipients(task: Task, changedBy: NotificationUser): string[] {
  const recipients: Set<string> = new Set();

  // Add task assignee
  if (task.assigned_to_user_id && task.assigned_to_user_id !== changedBy.id) {
    recipients.add(task.assigned_to_user_id);
  }

  // Add task creator
  if (task.created_by_user_id && task.created_by_user_id !== changedBy.id) {
    recipients.add(task.created_by_user_id);
  }

  // For system changes, include both assignee and creator
  if (changedBy.id === 'system') {
    if (task.assigned_to_user_id) {
      recipients.add(task.assigned_to_user_id);
    }
    if (task.created_by_user_id) {
      recipients.add(task.created_by_user_id);
    }
  }

  return Array.from(recipients);
}

/**
 * Send notification to a user (async, non-blocking)
 *
 * @param userId - User ID to notify
 * @param notification - Notification data
 * @returns Promise that resolves when notification is sent
 */
export async function sendNotificationToUser(
  userId: string,
  notification: DueDateChangeNotification
): Promise<void> {
  throw new Error('sendNotificationToUser not implemented with Supabase');
}

/**
 * Notify users about due date change
 *
 * This is the main entry point for sending due date change notifications.
 * It handles both manual changes and auto-recalculation changes.
 *
 * @param task - The task that changed
 * @param oldDueDate - Previous due date (undefined if none)
 * @param newDueDate - New due date (undefined if cleared)
 * @param changedBy - User who made the change (or SYSTEM_USER for auto-changes)
 * @param source - Source of the change
 * @returns Result with success status and recipients
 */
export async function notifyDueDateChange(
  task: Task,
  oldDueDate: string | undefined,
  newDueDate: string | undefined,
  changedBy: NotificationUser,
  source: DueDateSource
): Promise<NotificationResult> {
  const errors: string[] = [];
  const recipients = getNotificationRecipients(task, changedBy);

  if (recipients.length === 0) {
    return {
      success: true,
      notificationsSent: 0,
      recipients: [],
      errors: [],
    };
  }

  const message = buildNotificationMessage(task, oldDueDate, newDueDate, changedBy, source);
  const timestamp = new Date().toISOString();

  const notification: DueDateChangeNotification = {
    type: 'due_date_change',
    taskId: task.id,
    taskTitle: task.title,
    oldDueDate,
    newDueDate,
    changedBy,
    source,
    message,
    timestamp,
  };

  const successfulRecipients: string[] = [];

  // Send notifications asynchronously but don't block on failures
  await Promise.all(
    recipients.map(async (userId) => {
      try {
        await sendNotificationToUser(userId, notification);
        successfulRecipients.push(userId);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : `Failed to send notification to ${userId}`;
        errors.push(errorMsg);
        // Log error but don't throw - notifications should be non-blocking
        console.error(`[DueDateNotification] Error sending to ${userId}:`, errorMsg);
      }
    })
  );

  return {
    success: errors.length === 0,
    notificationsSent: successfulRecipients.length,
    recipients: successfulRecipients,
    errors,
  };
}

/**
 * Notify users about auto-recalculated due date
 * Convenience method for system-triggered changes
 *
 * @param task - The task that changed
 * @param oldDueDate - Previous due date
 * @param newDueDate - New due date
 * @param source - Source of the inference
 * @returns Result with success status and recipients
 */
export async function notifyAutoRecalculatedDueDate(
  task: Task,
  oldDueDate: string | undefined,
  newDueDate: string | undefined,
  source: DueDateSource
): Promise<NotificationResult> {
  return notifyDueDateChange(task, oldDueDate, newDueDate, SYSTEM_USER, source);
}

/**
 * Service instance with all methods
 */
export const dueDateNotificationService = {
  getSourceDescription,
  formatDateForDisplay,
  buildNotificationMessage,
  getNotificationRecipients,
  sendNotificationToUser,
  notifyDueDateChange,
  notifyAutoRecalculatedDueDate,
  SYSTEM_USER,
};
