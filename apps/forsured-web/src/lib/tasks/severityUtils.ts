/**
 * REQ-266: Task Correlation with Compliance Score
 * Utility functions for calculating and managing task severity
 */

import {
  Task,
  TaskSeverity,
  ConsequenceType,
  CONSEQUENCE_SEVERITY_MAP,
  TaskSeverityLevel,
} from '../../types';

/**
 * Calculate task severity from consequence type
 * Returns INFO for unknown/missing consequences (safe default)
 *
 * @param consequenceType - The consequence type string from task metadata
 * @returns TaskSeverity level based on consequence mapping
 */
export function calculateTaskSeverity(
  consequenceType: string | ConsequenceType | undefined | null
): TaskSeverity {
  if (!consequenceType) {
    return TaskSeverityLevel.INFO as TaskSeverity;
  }

  // Check if it's a valid consequence type
  if (consequenceType in CONSEQUENCE_SEVERITY_MAP) {
    return CONSEQUENCE_SEVERITY_MAP[consequenceType as ConsequenceType];
  }

  // Default to INFO for unknown consequences
  return TaskSeverityLevel.INFO as TaskSeverity;
}

/**
 * Calculate severity from task metadata
 * Looks for consequence_type in metadata or uses task fields
 *
 * @param task - The task object to calculate severity for
 * @returns TaskSeverity level
 */
export function calculateSeverityFromTask(task: Task): TaskSeverity {
  // First check if task already has a severity set
  if (task.severity) {
    return task.severity;
  }

  // Check for consequence_type at task level
  if (task.consequence_type) {
    return calculateTaskSeverity(task.consequence_type);
  }

  // Check metadata for consequence_type or severity_level
  if (task.metadata && typeof task.metadata === 'object') {
    const metadata = task.metadata as Record<string, unknown>;

    // Check for consequence_type in metadata
    if (metadata.consequence_type) {
      return calculateTaskSeverity(metadata.consequence_type as string);
    }

    // Map existing severity_level field to TaskSeverity
    if (metadata.severity_level) {
      const severityLevel = metadata.severity_level as string;
      if (isValidTaskSeverity(severityLevel)) {
        return severityLevel as TaskSeverity;
      }
      // Map SeverityLevel (critical, high, medium, low) to TaskSeverity
      // SeverityLevel doesn't have 'info', so it maps directly
      return mapSeverityLevelToTaskSeverity(severityLevel);
    }

    // Check for gap_severity from compliance gaps (GapSeverity: critical, warning, info)
    if (metadata.gap_severity) {
      return mapGapSeverityToTaskSeverity(metadata.gap_severity as string);
    }
  }

  // Default: Infer from priority as fallback
  return inferSeverityFromPriority(task.priority);
}

/**
 * Check if a string is a valid TaskSeverity
 */
export function isValidTaskSeverity(value: string): value is TaskSeverity {
  return ['critical', 'high', 'medium', 'low', 'info'].includes(value);
}

/**
 * Map SeverityLevel (from SubcontractorTaskMetadata) to TaskSeverity
 * SeverityLevel: 'critical' | 'high' | 'medium' | 'low'
 */
function mapSeverityLevelToTaskSeverity(severityLevel: string): TaskSeverity {
  const mapping: Record<string, TaskSeverity> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return mapping[severityLevel] || 'info';
}

/**
 * Map GapSeverity (from compliance evaluator) to TaskSeverity
 * GapSeverity: 'critical' | 'warning' | 'info'
 */
function mapGapSeverityToTaskSeverity(gapSeverity: string): TaskSeverity {
  const mapping: Record<string, TaskSeverity> = {
    critical: 'critical',
    warning: 'high', // Warning maps to high severity
    info: 'info',
  };
  return mapping[gapSeverity] || 'info';
}

/**
 * Infer severity from task priority as fallback
 * Maps TaskPriority to a reasonable severity level
 */
function inferSeverityFromPriority(priority: string): TaskSeverity {
  const mapping: Record<string, TaskSeverity> = {
    urgent: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return mapping[priority] || 'info';
}

/**
 * Enrich a task with calculated severity
 * Returns a new task object with severity field populated
 *
 * @param task - The task to enrich
 * @returns Task with severity field set
 */
export function enrichTaskWithSeverity(task: Task): Task {
  return {
    ...task,
    severity: calculateSeverityFromTask(task),
  };
}

/**
 * Enrich multiple tasks with calculated severity
 * Returns new task objects with severity fields populated
 *
 * @param tasks - Array of tasks to enrich
 * @returns Array of tasks with severity fields set
 */
export function enrichTasksWithSeverity(tasks: Task[]): Task[] {
  return tasks.map(enrichTaskWithSeverity);
}

/**
 * Group tasks by severity level
 * Returns an object with severity levels as keys and task arrays as values
 *
 * @param tasks - Array of tasks (should already have severity populated)
 * @returns Record mapping severity levels to task arrays
 */
export function groupTasksBySeverity(
  tasks: Task[]
): Record<TaskSeverity, Task[]> {
  const enriched = enrichTasksWithSeverity(tasks);

  return {
    critical: enriched.filter((t) => t.severity === 'critical'),
    high: enriched.filter((t) => t.severity === 'high'),
    medium: enriched.filter((t) => t.severity === 'medium'),
    low: enriched.filter((t) => t.severity === 'low'),
    info: enriched.filter((t) => t.severity === 'info'),
  };
}

/**
 * Count tasks by severity level
 * Returns an object with severity levels as keys and counts as values
 *
 * @param tasks - Array of tasks
 * @returns Record mapping severity levels to counts
 */
export function countTasksBySeverity(
  tasks: Task[]
): Record<TaskSeverity, number> {
  const grouped = groupTasksBySeverity(tasks);

  return {
    critical: grouped.critical.length,
    high: grouped.high.length,
    medium: grouped.medium.length,
    low: grouped.low.length,
    info: grouped.info.length,
  };
}

/**
 * Format task severity breakdown for display
 * Returns a string like "21 tasks (5 critical, 8 high, 6 medium, 2 low)"
 *
 * @param tasks - Array of tasks
 * @param includeInfo - Whether to include info-level tasks in breakdown (default: false)
 * @returns Formatted string for display
 */
export function formatSeverityBreakdown(
  tasks: Task[],
  includeInfo: boolean = false
): string {
  const counts = countTasksBySeverity(tasks);
  const total = tasks.length;

  const parts: string[] = [];

  if (counts.critical > 0) {
    parts.push(`${counts.critical} critical`);
  }
  if (counts.high > 0) {
    parts.push(`${counts.high} high`);
  }
  if (counts.medium > 0) {
    parts.push(`${counts.medium} medium`);
  }
  if (counts.low > 0) {
    parts.push(`${counts.low} low`);
  }
  if (includeInfo && counts.info > 0) {
    parts.push(`${counts.info} info`);
  }

  if (parts.length === 0) {
    return `${total} tasks`;
  }

  return `${total} tasks (${parts.join(', ')})`;
}

/**
 * Check if a task is urgent (critical or high severity)
 *
 * @param task - Task to check
 * @returns true if task has critical or high severity
 */
export function isUrgentTask(task: Task): boolean {
  const severity = calculateSeverityFromTask(task);
  return severity === 'critical' || severity === 'high';
}

/**
 * Sort tasks by severity (critical first, info last)
 *
 * @param tasks - Array of tasks to sort
 * @returns New array sorted by severity (critical first)
 */
export function sortTasksBySeverity(tasks: Task[]): Task[] {
  const severityOrder: Record<TaskSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  const enriched = enrichTasksWithSeverity(tasks);

  return [...enriched].sort((a, b) => {
    const aSeverity = a.severity || 'info';
    const bSeverity = b.severity || 'info';
    return severityOrder[aSeverity] - severityOrder[bSeverity];
  });
}
