/**
 * REQ-259: Task Status Auto-Save with Compliance Score Updates
 * TASK-4: Update Compliance Score on Status Changes
 *
 * Service to trigger compliance score recalculation when task status changes
 * affect compliance metrics (e.g., completing a compliance-related task).
 */

import { Task, TaskStatus } from '../../types';
import MockDatabase from '../../utils/mockDataStore';

/**
 * Status transitions that potentially affect compliance
 */
const COMPLIANCE_AFFECTING_STATUSES: TaskStatus[] = [
  'completed',
  'cancelled',
];

/**
 * Task types that are related to compliance
 */
const COMPLIANCE_RELATED_TASK_TYPES: string[] = [
  'coi_upload',
  'endorsement_correction',
  'coverage_increase',
  'policy_renewal',
  'policy_extension',
  'compliance_review',
];

/**
 * Result of compliance score update
 */
export interface ComplianceScoreUpdateResult {
  /** Whether the update was triggered */
  triggered: boolean;
  /** The project ID that was updated */
  projectId?: string;
  /** The new compliance score (if available) */
  newScore?: number;
  /** Reason for not triggering (if not triggered) */
  reason?: string;
}

/**
 * Determine if a task is compliance-related
 *
 * A task is compliance-related if:
 * - It has a compliance-related task_type
 * - It has gap_type in metadata (from compliance gap)
 * - It has compliance_gap_id in metadata
 *
 * @param task - The task to check
 * @returns True if the task affects compliance
 */
export function isComplianceRelatedTask(task: Task): boolean {
  // Check task type
  if (task.task_type && COMPLIANCE_RELATED_TASK_TYPES.includes(task.task_type as string)) {
    return true;
  }

  // Check metadata for compliance-related fields
  if (task.metadata && typeof task.metadata === 'object') {
    const metadata = task.metadata as Record<string, unknown>;

    // Has gap_type from compliance evaluation
    if (metadata.gap_type) {
      return true;
    }

    // Has compliance_gap_id reference
    if (metadata.compliance_gap_id || metadata.gap_id) {
      return true;
    }

    // Has evaluation_run_id (from auto-generated compliance tasks)
    if (metadata.evaluation_run_id) {
      return true;
    }
  }

  return false;
}

/**
 * Determine if a status change should trigger compliance recalculation
 *
 * @param oldStatus - Previous status
 * @param newStatus - New status
 * @returns True if this transition should trigger compliance update
 */
export function shouldUpdateComplianceScore(
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus
): boolean {
  // Only trigger for specific status transitions
  return COMPLIANCE_AFFECTING_STATUSES.includes(newStatus);
}

/**
 * Calculate compliance score for a project based on task completion
 *
 * This is a simplified calculation that:
 * 1. Gets all compliance-related tasks for the project
 * 2. Calculates score based on completed vs total
 * 3. Applies severity-based weighting
 *
 * @param projectId - The project to calculate score for
 * @returns The calculated compliance score (0-100)
 */
export async function calculateProjectComplianceScore(
  projectId: string
): Promise<number> {
  // Get all tasks for the project
  const allTasks = await MockDatabase.query<Task>('tasks', {});
  const projectTasks = allTasks.filter(
    (t) => t.project_id === projectId && isComplianceRelatedTask(t)
  );

  if (projectTasks.length === 0) {
    // No compliance tasks = fully compliant
    return 100;
  }

  // Calculate weighted score based on task completion and severity
  const severityWeights: Record<string, number> = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
    info: 2,
  };

  let totalWeight = 0;
  let completedWeight = 0;

  for (const task of projectTasks) {
    const weight = severityWeights[task.severity || 'info'] || 2;
    totalWeight += weight;

    if (task.status === 'completed') {
      completedWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 100;
  }

  // Calculate percentage and scale to 0-100
  const score = Math.round((completedWeight / totalWeight) * 100);

  return Math.max(0, Math.min(100, score));
}

/**
 * Update stored compliance score for a project
 *
 * @param projectId - The project to update
 * @param score - The new compliance score
 */
async function updateStoredComplianceScore(
  projectId: string,
  score: number
): Promise<void> {
  // Try to update project record if it exists
  try {
    const projects = await MockDatabase.query('projects', {});
    const project = projects.find((p: any) => p.id === projectId);

    if (project) {
      await MockDatabase.update('projects', projectId, {
        compliance_score: score,
        compliance_score_updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Log but don't throw - this is best-effort
    console.warn('Failed to update stored compliance score:', error);
  }
}

/**
 * Update compliance score when task status changes
 *
 * This function is fire-and-forget - it logs errors but doesn't throw.
 * This ensures compliance score failures don't block task status updates.
 *
 * @param task - The task that was updated
 * @param oldStatus - The previous status
 * @param newStatus - The new status
 * @returns Result indicating whether the update was triggered
 */
export async function updateComplianceScoreOnStatusChange(
  task: Task,
  oldStatus: TaskStatus | undefined,
  newStatus: TaskStatus
): Promise<ComplianceScoreUpdateResult> {
  try {
    // Check if this is a compliance-related task
    if (!isComplianceRelatedTask(task)) {
      return {
        triggered: false,
        reason: 'Task is not compliance-related',
      };
    }

    // Check if this status change affects compliance
    if (!shouldUpdateComplianceScore(oldStatus, newStatus)) {
      return {
        triggered: false,
        reason: `Status transition to '${newStatus}' does not affect compliance`,
      };
    }

    // Must have a project to update compliance score
    if (!task.project_id) {
      return {
        triggered: false,
        reason: 'Task has no project_id',
      };
    }

    // Calculate new compliance score for the project
    const newScore = await calculateProjectComplianceScore(task.project_id);

    // Update stored score
    await updateStoredComplianceScore(task.project_id, newScore);

    return {
      triggered: true,
      projectId: task.project_id,
      newScore,
    };
  } catch (error) {
    // Log but don't throw - compliance score failures shouldn't block task updates
    console.error('Failed to update compliance score:', error);
    return {
      triggered: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const complianceScoreService = {
  isComplianceRelatedTask,
  shouldUpdateComplianceScore,
  calculateProjectComplianceScore,
  updateComplianceScoreOnStatusChange,
};
