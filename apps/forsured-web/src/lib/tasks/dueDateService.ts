/**
 * Due Date Inference & Management
 * TASK-2: Implement Due Date Auto-Calculation Logic
 *
 * Service for automatic due date calculation based on task context.
 * Infers due dates from policy expiration, project start dates, and onboarding deadlines.
 */

import { Task, DueDateSource } from '../../types';

/**
 * Result of due date inference
 */
export interface DueDateInferenceResult {
  /** The calculated due date */
  dueDate: Date;
  /** The source of the inference */
  source: DueDateSource;
}

/**
 * Configuration for due date inference rules
 */
export interface DueDateInferenceConfig {
  /** Days before policy expiration to set due date (default: 30) */
  policyLeadDays: number;
  /** Days before project start to set due date (default: 7) */
  projectLeadDays: number;
}

const DEFAULT_CONFIG: DueDateInferenceConfig = {
  policyLeadDays: 30,
  projectLeadDays: 7,
};

/**
 * Infer due date from policy expiration date
 * Due date is set to 30 days before policy expiration
 *
 * @param policyExpirationDate - The policy expiration date
 * @param config - Optional configuration for lead days
 * @returns Inference result with due date and source
 */
export function inferDueDateFromPolicy(
  policyExpirationDate: Date | string,
  config: Partial<DueDateInferenceConfig> = {}
): DueDateInferenceResult {
  const expDate =
    typeof policyExpirationDate === 'string'
      ? new Date(policyExpirationDate)
      : policyExpirationDate;

  const leadDays = config.policyLeadDays ?? DEFAULT_CONFIG.policyLeadDays;

  const dueDate = new Date(expDate);
  dueDate.setDate(dueDate.getDate() - leadDays);

  return {
    dueDate,
    source: 'inferred_policy',
  };
}

/**
 * Infer due date from project start date
 * Due date is set to 7 days before project start
 *
 * @param projectStartDate - The project start date
 * @param config - Optional configuration for lead days
 * @returns Inference result with due date and source
 */
export function inferDueDateFromProject(
  projectStartDate: Date | string,
  config: Partial<DueDateInferenceConfig> = {}
): DueDateInferenceResult {
  const startDate =
    typeof projectStartDate === 'string' ? new Date(projectStartDate) : projectStartDate;

  const leadDays = config.projectLeadDays ?? DEFAULT_CONFIG.projectLeadDays;

  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() - leadDays);

  return {
    dueDate,
    source: 'inferred_project',
  };
}

/**
 * Infer due date from onboarding deadline
 * Due date is set to the onboarding deadline itself
 *
 * @param onboardingDeadline - The onboarding deadline date
 * @returns Inference result with due date and source
 */
export function inferDueDateFromOnboarding(
  onboardingDeadline: Date | string
): DueDateInferenceResult {
  const deadline =
    typeof onboardingDeadline === 'string' ? new Date(onboardingDeadline) : onboardingDeadline;

  return {
    dueDate: new Date(deadline),
    source: 'inferred_onboarding',
  };
}

/**
 * Context information for due date recalculation
 */
export interface TaskDueDateContext {
  /** Policy expiration date if task is policy-related */
  policyExpirationDate?: Date | string;
  /** Project start date if task is project-related */
  projectStartDate?: Date | string;
  /** Onboarding deadline if task is onboarding-related */
  onboardingDeadline?: Date | string;
}

/**
 * Recalculate due date for a task based on its context
 * Priority: policy > project > onboarding
 *
 * @param task - The task to recalculate due date for
 * @param context - Context information for inference
 * @param config - Optional configuration for lead days
 * @returns Inference result or null if no context available
 */
export function recalculateDueDate(
  task: Task,
  context: TaskDueDateContext,
  config: Partial<DueDateInferenceConfig> = {}
): DueDateInferenceResult | null {
  // Priority 1: Policy-based inference
  if (task.policy_id && context.policyExpirationDate) {
    return inferDueDateFromPolicy(context.policyExpirationDate, config);
  }

  // Priority 2: Project-based inference
  if (task.project_id && context.projectStartDate) {
    return inferDueDateFromProject(context.projectStartDate, config);
  }

  // Priority 3: Onboarding-based inference
  if (context.onboardingDeadline) {
    return inferDueDateFromOnboarding(context.onboardingDeadline);
  }

  // No context available for inference
  return null;
}

/**
 * Check if a due date should be recalculated
 * Returns true if the task has no due date or source indicates it was inferred
 *
 * @param task - The task to check
 * @returns True if due date should be recalculated
 */
export function shouldRecalculateDueDate(task: Task): boolean {
  // No due date set - should calculate
  if (!task.due_date) {
    return true;
  }

  // No source set - legacy task, might need calculation
  if (!task.due_date_source) {
    return false; // Don't override legacy tasks without explicit context
  }

  // Manual or explicitly set - don't override
  if (
    task.due_date_source === 'manual' ||
    task.due_date_source === 'gc_set' ||
    task.due_date_source === 'broker_set'
  ) {
    return false;
  }

  // Inferred sources can be recalculated if context changes
  return true;
}

/**
 * Format a due date for storage (ISO string)
 *
 * @param date - The date to format
 * @returns ISO string representation
 */
export function formatDueDateForStorage(date: Date): string {
  return date.toISOString();
}

/**
 * Calculate days until due date
 *
 * @param dueDate - The due date
 * @returns Number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();

  // Reset time components for day comparison
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = dueDay.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a task is overdue
 *
 * @param task - The task to check
 * @returns True if the task has a due date in the past
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date) {
    return false;
  }

  return getDaysUntilDue(task.due_date) < 0;
}

/**
 * Check if a task is due soon (within specified days)
 *
 * @param task - The task to check
 * @param withinDays - Number of days to consider "soon" (default: 7)
 * @returns True if task is due within the specified days
 */
export function isTaskDueSoon(task: Task, withinDays: number = 7): boolean {
  if (!task.due_date) {
    return false;
  }

  const daysUntil = getDaysUntilDue(task.due_date);
  return daysUntil >= 0 && daysUntil <= withinDays;
}

/**
 * Service instance with all methods
 */
export const dueDateService = {
  inferDueDateFromPolicy,
  inferDueDateFromProject,
  inferDueDateFromOnboarding,
  recalculateDueDate,
  shouldRecalculateDueDate,
  formatDueDateForStorage,
  getDaysUntilDue,
  isTaskOverdue,
  isTaskDueSoon,
};
