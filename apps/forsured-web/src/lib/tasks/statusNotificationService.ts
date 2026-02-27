/**
 * Service to create notifications when task status changes
 *
 * This service:
 * - Checks if a status transition should trigger notifications
 * - Determines recipients based on task and configuration
 * - Creates notifications in the database
 * - Is fire-and-forget (errors are logged but don't block operations)
 */

import { Task, TaskStatus } from "../../types";
import {
  findStatusTransitionConfig,
  formatNotificationMessage,
  getStatusLabel,
  NotificationRecipient,
  StatusTransitionConfig,
} from "./statusNotificationConfig";
import {
  filterManualUsers,
  logSkippedManualUserNotification,
} from "../notifications/manualUserFilter";

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
  entity_type: "task" | "project" | "document" | "policy";
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
 * Note: This returns raw recipients. Use determineRecipientsFiltered for
 * production use which excludes manual users.
 *
 * @param config - The notification configuration
 * @param task - The task being updated
 * @param changerId - The user making the change
 * @returns Array of user IDs to notify
 */
export function determineRecipients(
  config: StatusTransitionConfig,
  task: Task,
  changerId?: string,
): string[] {
  const recipients = new Set<string>();

  switch (config.recipients) {
    case "creator":
      if (task.created_by_user_id && task.created_by_user_id !== changerId) {
        recipients.add(task.created_by_user_id);
      }
      break;

    case "assignee":
      if (task.assigned_to_user_id && task.assigned_to_user_id !== changerId) {
        recipients.add(task.assigned_to_user_id);
      }
      break;

    case "both":
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
 * Determine notification recipients with manual user filtering
 * Manual users cannot receive notifications
 *
 * @param config - The notification configuration
 * @param task - The task being updated
 * @param changerId - The user making the change
 * @returns Array of user IDs to notify (excluding manual users)
 */
export async function determineRecipientsFiltered(
  config: StatusTransitionConfig,
  task: Task,
  changerId?: string,
): Promise<string[]> {
  const rawRecipients = determineRecipients(config, task, changerId);

  if (rawRecipients.length === 0) {
    return [];
  }

  // Filter out manual users
  const filteredRecipients = await filterManualUsers(rawRecipients);

  // Log any skipped manual users
  const skippedCount = rawRecipients.length - filteredRecipients.length;
  if (skippedCount > 0) {
    logSkippedManualUserNotification(
      rawRecipients.filter((id) => !filteredRecipients.includes(id)).join(", "),
      "status_change",
      { taskId: task.id, taskTitle: task.title },
    );
  }

  return filteredRecipients;
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
  changerId?: string,
): Promise<NotificationRecord> {
  throw new Error("createNotificationRecord not implemented with Supabase");
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
  changerId?: string,
): Promise<StatusNotificationResult> {
  try {
    // Find the notification config for this transition
    const config = findStatusTransitionConfig(oldStatus, newStatus);

    if (!config) {
      // This transition doesn't require notifications
      return {
        notificationsCreated: 0,
        recipientIds: [],
        notificationType: "none",
      };
    }

    // Determine who should receive the notification (excluding manual users)
    // Manual users cannot receive notifications
    const recipientIds = await determineRecipientsFiltered(
      config,
      task,
      changerId,
    );

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
      createNotificationRecord(
        recipientId,
        config,
        task,
        oldStatus,
        newStatus,
        changerId,
      )
    );

    await Promise.all(notificationPromises);

    return {
      notificationsCreated: recipientIds.length,
      recipientIds,
      notificationType: config.notificationType,
    };
  } catch (error) {
    // Log but don't throw - notification failures shouldn't block task updates
    console.error("Failed to create status change notifications:", error);
    return {
      notificationsCreated: 0,
      recipientIds: [],
      notificationType: "error",
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
  newStatus: TaskStatus,
): boolean {
  return findStatusTransitionConfig(oldStatus, newStatus) !== undefined;
}

export const statusNotificationService = {
  createStatusChangeNotifications,
  shouldNotifyStatusChange,
  determineRecipients,
  determineRecipientsFiltered,
};
