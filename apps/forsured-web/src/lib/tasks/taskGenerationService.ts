/**
 * REQ-127: Task Auto-Generation from Compliance Gaps
 * Main service orchestrating task generation from compliance gaps
 */

import { v4 as uuidv4 } from 'uuid';
import { ComplianceGap } from '../compliance/evaluator/types';
import { TaskTemplates } from './taskTemplates';
import { DeduplicationService } from './deduplicationService';
import { TaskAssignmentService } from './taskAssignmentService';
import {
  TaskGenerationRequest,
  TaskGenerationResponse,
  GeneratedTask,
  SYSTEM_USER_ID
} from './types';

/**
 * Task Generation Service
 * Orchestrates automatic task creation from compliance gaps
 */
export class TaskGenerationService {
  private deduplicationService: DeduplicationService;
  private assignmentService: TaskAssignmentService;

  constructor() {
    this.deduplicationService = new DeduplicationService();
    this.assignmentService = new TaskAssignmentService();
  }

  /**
   * Calculate due date based on severity
   */
  private calculateDueDate(gapType: ComplianceGap['type'], severityDays: number): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + severityDays);
    return dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Generate task object from gap
   */
  private generateTaskFromGap(
    gap: ComplianceGap,
    request: TaskGenerationRequest
  ): GeneratedTask {
    const template = TaskTemplates.getTemplate(gap.type);

    // Generate title and description from template
    const title = template.title_template(gap);
    const description = template.description_template(gap);

    // Map severity to priority
    const priority = template.priority_mapping[gap.severity];

    // Calculate due date
    const dueDateDays = template.due_date_days[gap.severity];
    const dueDate = this.calculateDueDate(gap.type, dueDateDays);

    // Get task assignment
    const assignment = this.assignmentService.assignTask(
      gap.type,
      gap.severity,
      template.task_type
    );

    // Generate task ID
    const taskId = uuidv4();
    const now = new Date().toISOString();

    return {
      id: taskId,
      title,
      description,
      status: 'pending',
      priority,
      due_date: dueDate,
      created_by_user_id: SYSTEM_USER_ID,
      assigned_to_user_id: assignment.assigned_to_user_id,
      project_id: request.project_id,
      policy_id: undefined, // Can be enhanced later
      task_type: template.task_type,
      metadata: {
        gap_type: gap.type,
        gap_severity: gap.severity,
        gap_id: gap.id,
        evaluation_run_id: request.evaluation_run_id,
        subcontractor_org_id: request.subcontractor_org_id,
        coverage_type: gap.coverage_type,
        endorsement: gap.endorsement,
        current_value: gap.current_value,
        required_value: gap.required_value,
        remediation: gap.remediation,
        auto_generated: true
      },
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Generate task objects (without persistence)
   * Exposed for testing
   */
  async generateTaskObjects(
    request: TaskGenerationRequest,
    existingTasks: GeneratedTask[]
  ): Promise<GeneratedTask[]> {
    const tasksToCreate: GeneratedTask[] = [];

    for (const gap of request.gaps) {
      // Check for duplicates
      const dedupResult = this.deduplicationService.checkForDuplicates(
        gap,
        request.subcontractor_org_id,
        request.project_id,
        undefined, // policy_id not provided in MVP
        existingTasks
      );

      // Only create new tasks (not updates or skips)
      if (dedupResult.action === 'create') {
        const task = this.generateTaskFromGap(gap, request);
        tasksToCreate.push(task);
      }
    }

    return tasksToCreate;
  }

  /**
   * Generate tasks from compliance gaps
   * Main entry point for task generation
   */
  async generateTasks(
    request: TaskGenerationRequest,
    existingTasks: GeneratedTask[]
  ): Promise<TaskGenerationResponse> {
    const startTime = Date.now();

    const taskIds: string[] = [];
    let tasksCreated = 0;
    let tasksUpdated = 0;
    let tasksSkipped = 0;

    // Process each gap
    for (const gap of request.gaps) {
      // Check for duplicates
      const dedupResult = this.deduplicationService.checkForDuplicates(
        gap,
        request.subcontractor_org_id,
        request.project_id,
        undefined, // policy_id not provided in MVP
        existingTasks
      );

      if (dedupResult.action === 'create') {
        // Generate and "create" new task
        const task = this.generateTaskFromGap(gap, request);
        taskIds.push(task.id);
        tasksCreated++;

        // In real implementation, would persist to database here
        // For now, we just track the creation
      } else if (dedupResult.action === 'update') {
        // Update existing task
        if (dedupResult.existing_task_id) {
          taskIds.push(dedupResult.existing_task_id);
          tasksUpdated++;
        }

        // In real implementation, would update task in database:
        // - Update due_date to new calculated date
        // - Add comment about re-evaluation
        // - Update metadata with new evaluation_run_id
      } else {
        // Skip task creation
        tasksSkipped++;
      }
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      tasks_created: tasksCreated,
      tasks_updated: tasksUpdated,
      tasks_skipped: tasksSkipped,
      processing_time_ms: processingTimeMs,
      task_ids: taskIds
    };
  }

  /**
   * Batch generate tasks for multiple evaluation runs
   * More efficient for bulk processing
   */
  async batchGenerateTasks(
    requests: TaskGenerationRequest[],
    existingTasks: GeneratedTask[]
  ): Promise<TaskGenerationResponse[]> {
    return Promise.all(
      requests.map(request => this.generateTasks(request, existingTasks))
    );
  }
}
