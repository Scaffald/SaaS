/**
 * Merge Notifications Service
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-11: Implement merge completion notifications
 *
 * Sends notifications to both the established user (who created the manual entry)
 * and the newly registered user when a merge completes successfully.
 */

import { forsured } from './supabase';

/**
 * Merge statistics for notification content
 */
export interface MergeStats {
  tasksTransferred: number;
  projectsLinked: number;
  documentsTransferred: number;
  profileFieldsUpdated: number;
}

/**
 * User info for notifications
 */
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  organizationId: string | null;
}

/**
 * Create an in-app notification
 */
async function createInAppNotification(params: {
  userId: string;
  organizationId: string | null;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  triggeredBy: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await forsured('notifications').insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      type: params.type,
      title: params.title,
      message: params.message,
      entity_type: params.entityType,
      entity_id: params.entityId,
      triggered_by: params.triggeredBy,
      is_read: false,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[MergeNotifications] Failed to create notification:', error);
      // Don't throw - notifications should not block the merge
    } else {
      console.log('[MergeNotifications] Created notification for user:', params.userId);
    }
  } catch (error) {
    console.error('[MergeNotifications] Error creating notification:', error);
    // Don't throw - notifications should not block the merge
  }
}

/**
 * Format merge statistics for notification message
 */
function formatMergeStatsSummary(stats: MergeStats): string {
  const parts: string[] = [];

  if (stats.tasksTransferred > 0) {
    parts.push(`${stats.tasksTransferred} task${stats.tasksTransferred === 1 ? '' : 's'}`);
  }
  if (stats.projectsLinked > 0) {
    parts.push(`${stats.projectsLinked} project${stats.projectsLinked === 1 ? '' : 's'}`);
  }
  if (stats.documentsTransferred > 0) {
    parts.push(`${stats.documentsTransferred} document${stats.documentsTransferred === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return 'profile information';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

/**
 * Notify the established user (who created the manual entry) about the merge
 *
 * In-app notification: "[User Name] has registered and accepted your invitation"
 * Includes summary of tasks transferred, projects confirmed, documents accepted
 */
export async function notifyEstablishedUserOfMerge(
  establishedUser: UserInfo,
  newUser: UserInfo,
  manualUserId: string,
  stats: MergeStats
): Promise<void> {
  const statsSummary = formatMergeStatsSummary(stats);

  await createInAppNotification({
    userId: establishedUser.id,
    organizationId: establishedUser.organizationId,
    type: 'user_merge_completed',
    title: `${newUser.name} has registered`,
    message: `${newUser.name} has registered and accepted your invitation. Their account has been linked with ${statsSummary}. You can now collaborate with them directly.`,
    entityType: 'user',
    entityId: newUser.id,
    triggeredBy: newUser.id,
    metadata: {
      newUserName: newUser.name,
      newUserEmail: newUser.email,
      manualUserId,
      stats,
    },
  });

  console.log('[MergeNotifications] Notified established user:', establishedUser.id);
}

/**
 * Notify the new user about the completed merge
 *
 * In-app notification: "Your account has been linked with existing records"
 * Includes summary of active tasks, project associations
 * Message: "You will now receive notifications for future activity"
 */
export async function notifyNewUserOfMerge(
  newUser: UserInfo,
  establishedUser: UserInfo,
  manualUserId: string,
  stats: MergeStats
): Promise<void> {
  const statsSummary = formatMergeStatsSummary(stats);

  await createInAppNotification({
    userId: newUser.id,
    organizationId: newUser.organizationId,
    type: 'account_merge_completed',
    title: 'Account linked successfully',
    message: `Your account has been linked with existing records from ${establishedUser.name}. You now have access to ${statsSummary}. You will receive notifications for all future activity.`,
    entityType: 'user',
    entityId: newUser.id,
    triggeredBy: establishedUser.id,
    metadata: {
      establishedUserName: establishedUser.name,
      establishedUserId: establishedUser.id,
      manualUserId,
      stats,
    },
  });

  console.log('[MergeNotifications] Notified new user:', newUser.id);
}

/**
 * Send merge completion notifications to both users
 *
 * This is a convenience function that sends notifications to both the
 * established user and the new user. It handles errors gracefully -
 * notification failures should not block the merge operation.
 */
export async function sendMergeCompletionNotifications(params: {
  establishedUser: UserInfo;
  newUser: UserInfo;
  manualUserId: string;
  stats: MergeStats;
}): Promise<void> {
  const { establishedUser, newUser, manualUserId, stats } = params;

  console.log('[MergeNotifications] Sending merge completion notifications:', {
    establishedUserId: establishedUser.id,
    newUserId: newUser.id,
    manualUserId,
    stats,
  });

  // Send notifications in parallel - failures should not block each other
  await Promise.allSettled([
    notifyEstablishedUserOfMerge(establishedUser, newUser, manualUserId, stats),
    notifyNewUserOfMerge(newUser, establishedUser, manualUserId, stats),
  ]);

  console.log('[MergeNotifications] Notification sending complete');
}
