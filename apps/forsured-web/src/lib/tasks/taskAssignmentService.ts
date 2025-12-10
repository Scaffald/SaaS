/**
 * REQ-127: Task Auto-Generation from Compliance Gaps
 * Task assignment service for smart task routing
 */

import { GapType, GapSeverity } from '../compliance/evaluator/types';
import { TaskAssignmentResult, TaskAssignmentStrategy } from './types';

/**
 * Task Assignment Service
 * Determines who should be assigned to auto-generated tasks
 */
export class TaskAssignmentService {
  /**
   * Get default assignment strategy for task type
   * For MVP, all tasks are assigned to subcontractor (unassigned, they will see it in their portal)
   */
  getDefaultStrategy(/* _taskType: string */): TaskAssignmentStrategy {
    // All compliance gap tasks are subcontractor responsibility
    // taskType parameter reserved for future enhancement
    return 'subcontractor';
  }

  /**
   * Format assignment reason string
   */
  formatAssignmentReason(
    gapType: GapType,
    gapSeverity: GapSeverity,
    strategy: TaskAssignmentStrategy
  ): string {
    return `Auto-assigned to ${strategy} for ${gapType} gap (severity: ${gapSeverity})`;
  }

  /**
   * Assign task based on gap type and severity
   * Returns assignment result with user ID (if assigned) and strategy
   */
  assignTask(
    gapType: GapType,
    gapSeverity: GapSeverity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _taskType: string  // Reserved for future enhancement
    /* _projectId: string, _subcontractorOrgId: string */
  ): TaskAssignmentResult {
    // For MVP, we use simple strategy: all tasks go to subcontractor
    // In future versions, this could be enhanced with:
    // - Project manager assignment for critical gaps
    // - Compliance manager assignment for review tasks
    // - Broker assignment for policy-related tasks
    // - User preference-based assignment
    // - Workload-based assignment
    // projectId and subcontractorOrgId parameters reserved for future enhancement

    const strategy = this.getDefaultStrategy(/* taskType */);
    const reason = this.formatAssignmentReason(gapType, gapSeverity, strategy);

    // For subcontractor strategy, we leave task unassigned
    // The subcontractor org will see it in their task list
    return {
      assigned_to_user_id: undefined,
      assignment_strategy: strategy,
      assignment_reason: reason
    };
  }

  /**
   * Batch assign tasks
   * More efficient for multiple task assignments
   */
  batchAssignTasks(
    tasks: Array<{
      gapType: GapType;
      gapSeverity: GapSeverity;
      taskType: string;
    }>
  ): TaskAssignmentResult[] {
    return tasks.map(task =>
      this.assignTask(
        task.gapType,
        task.gapSeverity,
        task.taskType
      )
    );
  }
}
