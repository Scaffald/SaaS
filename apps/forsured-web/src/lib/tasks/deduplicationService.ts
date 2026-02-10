/**
 * Task Auto-Generation from Compliance Gaps
 * Deduplication service to prevent duplicate task creation
 */

import { ComplianceGap } from '../compliance/evaluator/types';
import { GeneratedTask, DeduplicationResult } from './types';

/**
 * Deduplication Service
 * Prevents creation of duplicate tasks for the same compliance gap
 */
export class DeduplicationService {
  /**
   * Generate unique key for a gap/task combination
   * Key format: {gap_type}:{subcontractor_org_id}:{project_id}:{policy_id}[:{coverage_type|endorsement}]
   */
  generateKey(
    gap: ComplianceGap,
    subcontractorOrgId: string,
    projectId: string,
    policyId?: string
  ): string {
    const parts = [
      gap.type,
      subcontractorOrgId,
      projectId,
      policyId || 'no-policy'
    ];

    // Add coverage type if present (for coverage-related gaps)
    if (gap.coverage_type) {
      parts.push(gap.coverage_type);
    }

    // Add endorsement if present (for endorsement gaps)
    if (gap.endorsement) {
      parts.push(gap.endorsement);
    }

    return parts.join(':');
  }

  /**
   * Check if task should be updated (is it open?)
   */
  shouldUpdateTask(task: GeneratedTask): boolean {
    return task.status === 'pending' || task.status === 'in_progress';
  }

  /**
   * Check for duplicate tasks
   * Returns action to take: create, update, or skip
   */
  checkForDuplicates(
    gap: ComplianceGap,
    subcontractorOrgId: string,
    projectId: string,
    policyId: string | undefined,
    existingTasks: GeneratedTask[]
  ): DeduplicationResult {
    const key = this.generateKey(gap, subcontractorOrgId, projectId, policyId);

    // Find matching task by generating keys for all existing tasks
    const matchingTask = existingTasks.find(task => {
      // Skip if not auto-generated
      if (!task.metadata.auto_generated) {
        return false;
      }

      // Generate key from existing task metadata
      const taskKey = this.generateKey(
        {
          id: task.metadata.gap_id,
          type: task.metadata.gap_type,
          severity: task.metadata.gap_severity,
          coverage_type: task.metadata.coverage_type,
          endorsement: task.metadata.endorsement,
          current_value: task.metadata.current_value,
          required_value: task.metadata.required_value,
          remediation: task.metadata.remediation,
          points_deducted: 0 // Not used in key generation
        },
        task.metadata.subcontractor_org_id,
        task.project_id,
        task.policy_id
      );

      return taskKey === key;
    });

    if (!matchingTask) {
      return {
        action: 'create',
        reason: 'No matching task found'
      };
    }

    // If matching task is open (pending or in_progress), update it
    if (this.shouldUpdateTask(matchingTask)) {
      return {
        action: 'update',
        existing_task_id: matchingTask.id,
        reason: 'Matching open task exists - will update due date and add comment'
      };
    }

    // If matching task is closed (completed or cancelled), create new task
    return {
      action: 'create',
      existing_task_id: matchingTask.id,
      reason: 'Matching task exists but is closed - creating new task with historical link'
    };
  }

  /**
   * Batch check for duplicates
   * More efficient for multiple gaps
   */
  batchCheckForDuplicates(
    gaps: ComplianceGap[],
    subcontractorOrgId: string,
    projectId: string,
    policyId: string | undefined,
    existingTasks: GeneratedTask[]
  ): Map<string, DeduplicationResult> {
    const results = new Map<string, DeduplicationResult>();

    for (const gap of gaps) {
      const key = this.generateKey(gap, subcontractorOrgId, projectId, policyId);
      const result = this.checkForDuplicates(
        gap,
        subcontractorOrgId,
        projectId,
        policyId,
        existingTasks
      );
      results.set(key, result);
    }

    return results;
  }
}
