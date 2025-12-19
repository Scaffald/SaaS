/**
 * REQ-267: Due Date Inference & Management
 * TASK-3: Build Due Date Management API with Manual Override
 *
 * API service for due date management with manual override capability
 * and automatic history logging.
 */

import { Task, DueDateSource, TaskDueDateHistory, User } from '../../types';
import {
  recalculateDueDate,
  formatDueDateForStorage,
  TaskDueDateContext,
} from './dueDateService';

/**
 * Valid manual source types that can be set via API
 */
export type ManualDueDateSource = 'manual' | 'gc_set' | 'broker_set';

/**
 * Request to update a task's due date
 */
export interface UpdateDueDateRequest {
  /** New due date (ISO string) or null to revert to auto-calculated */
  due_date: string | null;
  /** Source of the due date change */
  source: ManualDueDateSource;
}

/**
 * Result of a due date update operation
 */
export interface UpdateDueDateResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Updated task if successful */
  task?: Task;
  /** History record created */
  historyRecord?: TaskDueDateHistory;
  /** Error message if failed */
  error?: string;
  /** HTTP status code */
  statusCode: number;
}

/**
 * User context for authorization
 */
export interface UserContext {
  /** User ID */
  id: string;
  /** User's role */
  role: 'broker' | 'gc' | 'subcontractor' | 'admin';
  /** User's name */
  name?: string;
  /** User's email */
  email?: string;
}

/**
 * Validate ISO 8601 date string format
 *
 * @param dateString - The date string to validate
 * @returns True if valid ISO date format
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Check if user is authorized to update due date
 *
 * Rules:
 * - Task creator can always update
 * - GC role can update any task
 * - Broker role can update any task
 * - Admin role can update any task
 *
 * @param task - The task being updated
 * @param user - The user attempting the update
 * @returns True if authorized
 */
export function canUpdateDueDate(task: Task, user: UserContext): boolean {
  // Task creator can always update
  if (task.created_by_user_id === user.id) {
    return true;
  }

  // Task assignee can update
  if (task.assigned_to_user_id === user.id) {
    return true;
  }

  // GC, Broker, and Admin roles can update any task
  if (['gc', 'broker', 'admin'].includes(user.role)) {
    return true;
  }

  return false;
}

/**
 * Create a history record for due date change
 *
 * @param taskId - The task ID
 * @param oldDueDate - Previous due date
 * @param newDueDate - New due date
 * @param source - Source of the change
 * @param user - User making the change
 * @returns Created history record
 */
export async function createDueDateHistoryRecord(
  taskId: string,
  oldDueDate: string | undefined,
  newDueDate: string | undefined,
  source: DueDateSource,
  user: UserContext
): Promise<TaskDueDateHistory> {
  throw new Error('createDueDateHistoryRecord not implemented with Supabase');
}

/**
 * Update task due date with manual override
 *
 * PATCH /api/tasks/:id/due-date
 *
 * @param taskId - Task ID to update
 * @param request - Update request with new due date and source
 * @param user - User making the request
 * @param context - Optional context for auto-recalculation
 * @returns Update result
 */
export async function updateTaskDueDate(
  taskId: string,
  request: UpdateDueDateRequest,
  user: UserContext,
  context?: TaskDueDateContext
): Promise<UpdateDueDateResult> {
  throw new Error('updateTaskDueDate not implemented with Supabase');
}

/**
 * Get due date history for a task
 *
 * GET /api/tasks/:id/due-date-history
 *
 * @param taskId - Task ID to get history for
 * @param user - User making the request
 * @returns Array of history records or error
 */
export async function getTaskDueDateHistory(
  taskId: string,
  user: UserContext
): Promise<{
  success: boolean;
  history?: TaskDueDateHistory[];
  error?: string;
  statusCode: number;
}> {
  throw new Error('getTaskDueDateHistory not implemented with Supabase');
}

/**
 * Batch update due dates for multiple tasks
 * (Deferred feature - placeholder for future implementation)
 */
// export async function batchUpdateDueDates(...) { }

/**
 * Service instance with all methods
 */
export const dueDateApiService = {
  isValidISODate,
  canUpdateDueDate,
  createDueDateHistoryRecord,
  updateTaskDueDate,
  getTaskDueDateHistory,
};
