/**
 * REQ-260: Task Assignment Workflow Fix
 * TASK-1: Update Task Assignment Logic to Distinguish Self-Assignment vs Delegation
 *
 * Service to handle task assignment type classification and related operations.
 * Determines whether a task is self-assigned (stays in inbox) or delegated
 * (moves to "assigned by me" view).
 */

import { Task } from '../../types';

/**
 * Task assignment type enum
 */
export type TaskAssignmentType = 'self_assigned' | 'delegated' | 'unassigned';

/**
 * Task view classification based on assignment
 */
export type TaskViewType = 'inbox' | 'assigned_by_me' | 'all';

/**
 * Result of task assignment operation
 */
export interface TaskAssignmentTypeResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The type of assignment (self, delegated, or unassigned) */
  assignmentType: TaskAssignmentType;
  /** Which view the task should appear in for the user */
  viewType: TaskViewType;
  /** Updated task if operation succeeded */
  task?: Task;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Determine the assignment type for a task
 *
 * @param task - The task to check
 * @returns The assignment type
 */
export function getTaskAssignmentType(task: Task): TaskAssignmentType {
  // No assignee = unassigned
  if (!task.assigned_to_user_id) {
    return 'unassigned';
  }

  // Assignee is the creator = self-assigned
  if (task.assigned_to_user_id === task.created_by_user_id) {
    return 'self_assigned';
  }

  // Assignee is different from creator = delegated
  return 'delegated';
}

/**
 * Determine which view a task belongs to for a given user
 *
 * @param task - The task to check
 * @param userId - The user viewing the task
 * @returns The view type for this user
 */
export function getTaskViewForUser(task: Task, userId: string): TaskViewType {
  const assignmentType = getTaskAssignmentType(task);

  // Self-assigned tasks: appear in inbox for the creator/assignee
  if (assignmentType === 'self_assigned' && task.assigned_to_user_id === userId) {
    return 'inbox';
  }

  // Delegated tasks: appear in "assigned by me" for the creator
  if (assignmentType === 'delegated' && task.created_by_user_id === userId) {
    return 'assigned_by_me';
  }

  // Delegated tasks: appear in inbox for the assignee
  if (assignmentType === 'delegated' && task.assigned_to_user_id === userId) {
    return 'inbox';
  }

  // Unassigned tasks: appear in inbox for the creator
  if (assignmentType === 'unassigned' && task.created_by_user_id === userId) {
    return 'inbox';
  }

  // Default to 'all' if user is neither creator nor assignee
  return 'all';
}

/**
 * Check if a task is self-assigned
 *
 * @param task - The task to check
 * @returns True if the task is assigned to its creator
 */
export function isSelfAssigned(task: Task): boolean {
  return getTaskAssignmentType(task) === 'self_assigned';
}

/**
 * Check if a task is delegated (assigned to someone other than creator)
 *
 * @param task - The task to check
 * @returns True if the task is assigned to someone other than its creator
 */
export function isDelegated(task: Task): boolean {
  return getTaskAssignmentType(task) === 'delegated';
}

/**
 * Check if a task is unassigned
 *
 * @param task - The task to check
 * @returns True if the task has no assignee
 */
export function isUnassigned(task: Task): boolean {
  return getTaskAssignmentType(task) === 'unassigned';
}

/**
 * Filter tasks for inbox view
 * Returns tasks where:
 * - User is the assignee (self-assigned or delegated to them)
 * - User is the creator and task is unassigned
 *
 * @param tasks - Array of tasks to filter
 * @param userId - The user's ID
 * @returns Tasks that should appear in the user's inbox
 */
export function filterTasksForInbox(tasks: Task[], userId: string): Task[] {
  return tasks.filter((task) => {
    // Tasks assigned to this user
    if (task.assigned_to_user_id === userId) {
      return true;
    }

    // Unassigned tasks created by this user
    if (!task.assigned_to_user_id && task.created_by_user_id === userId) {
      return true;
    }

    return false;
  });
}

/**
 * Filter tasks for "assigned by me" view
 * Returns tasks where:
 * - User is the creator AND
 * - Task is assigned to someone else (not self or unassigned)
 *
 * @param tasks - Array of tasks to filter
 * @param userId - The user's ID
 * @returns Tasks that should appear in the user's "assigned by me" view
 */
export function filterTasksForAssignedByMe(tasks: Task[], userId: string): Task[] {
  return tasks.filter((task) => {
    // User must be the creator
    if (task.created_by_user_id !== userId) {
      return false;
    }

    // Task must be assigned to someone else (delegated)
    if (!task.assigned_to_user_id || task.assigned_to_user_id === userId) {
      return false;
    }

    return true;
  });
}

/**
 * Assign a task to a user
 * Compares assignee with current user to determine assignment type
 *
 * Note: User existence validation should be handled at the API layer.
 * This service focuses on assignment logic and view routing.
 *
 * @param taskId - The task to assign
 * @param assigneeId - The user to assign to
 * @param currentUserId - The user performing the assignment
 * @returns Result with assignment type and updated task
 */
export async function assignTask(
  taskId: string,
  assigneeId: string,
  currentUserId: string
): Promise<TaskAssignmentTypeResult> {
  throw new Error('assignTask not implemented with Supabase');
}

/**
 * Reassign a task to a different user
 * Recalculates view routing based on new assignment
 *
 * @param taskId - The task to reassign
 * @param newAssigneeId - The new user to assign to
 * @param currentUserId - The user performing the reassignment
 * @returns Result with assignment type and updated task
 */
export async function reassignTask(
  taskId: string,
  newAssigneeId: string,
  currentUserId: string
): Promise<TaskAssignmentTypeResult> {
  // Reassignment uses the same logic as assignment
  return assignTask(taskId, newAssigneeId, currentUserId);
}

/**
 * Unassign a task (remove assignee)
 *
 * @param taskId - The task to unassign
 * @returns Result with unassigned status
 */
export async function unassignTask(taskId: string): Promise<TaskAssignmentTypeResult> {
  throw new Error('unassignTask not implemented with Supabase');
}

/**
 * Service instance with all methods
 */
export const taskAssignmentTypeService = {
  getTaskAssignmentType,
  getTaskViewForUser,
  isSelfAssigned,
  isDelegated,
  isUnassigned,
  filterTasksForInbox,
  filterTasksForAssignedByMe,
  assignTask,
  reassignTask,
  unassignTask,
};
