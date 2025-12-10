/**
 * Data Transformation Utilities
 * REQ-196: Frontend Data Layer Migration
 *
 * Provides utilities to transform data between old JSON structures (mockManagerTasks.json, mockMaster.json)
 * and new MockDatabase schema.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** Old JSON task status values */
export type OldTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

/** New database task status values */
export type NewTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/** Old JSON priority values */
export type OldPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** New database priority values */
export type NewPriority = 'urgent' | 'high' | 'medium' | 'low';

/** Old task structure from mockManagerTasks.json */
export interface OldTaskStructure {
  id: string;
  project_id: string;
  project_name: string;
  company_id: string;
  assignees: string[];
  title: string;
  summary: string;
  related?: {
    coi_id?: string;
    policy_id?: string;
    policy_ids?: string[];
    issue_id?: string;
    document_id?: string;
    broker_company_id?: string;
  };
  status: OldTaskStatus;
  priority: OldPriority;
  due_at: string;
  blockers?: string[];
  quick_actions?: string[];
  tags?: string[];
}

/** New task structure matching MockDatabase schema */
export interface NewTaskStructure {
  id: string;
  project_id: string;
  subcontractor_id: string;
  assigned_to_user_id: string | null;
  title: string;
  description: string;
  status: NewTaskStatus;
  priority: NewPriority;
  due_date: string;
  metadata?: {
    related?: OldTaskStructure['related'];
    blockers?: string[];
    quick_actions?: string[];
    tags?: string[];
    project_name?: string;
    legacy_assignees?: string[];
  };
}

// ============================================================================
// Status Transformations
// ============================================================================

const STATUS_MAP: Record<OldTaskStatus, NewTaskStatus> = {
  OPEN: 'pending',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'in_progress', // BLOCKED maps to in_progress with blocked indicator
  DONE: 'completed',
};

const REVERSE_STATUS_MAP: Record<NewTaskStatus, OldTaskStatus> = {
  pending: 'OPEN',
  in_progress: 'IN_PROGRESS',
  completed: 'DONE',
  cancelled: 'DONE', // No direct mapping, use DONE
};

/**
 * Transform old status value to new database status
 * @param oldStatus - Status from old JSON structure (OPEN, IN_PROGRESS, BLOCKED, DONE)
 * @returns New database status (pending, in_progress, completed, cancelled)
 */
export function transformStatus(oldStatus: string | null | undefined): NewTaskStatus {
  if (!oldStatus) return 'pending';
  const normalized = oldStatus.toUpperCase() as OldTaskStatus;
  return STATUS_MAP[normalized] ?? 'pending';
}

/**
 * Transform new database status to old JSON status (for backward compatibility)
 * @param newStatus - Status from database (pending, in_progress, completed, cancelled)
 * @returns Old JSON status (OPEN, IN_PROGRESS, BLOCKED, DONE)
 */
export function reverseTransformStatus(newStatus: string | null | undefined): OldTaskStatus {
  if (!newStatus) return 'OPEN';
  const normalized = newStatus.toLowerCase() as NewTaskStatus;
  return REVERSE_STATUS_MAP[normalized] ?? 'OPEN';
}

// ============================================================================
// Priority Transformations
// ============================================================================

const PRIORITY_MAP: Record<OldPriority, NewPriority> = {
  CRITICAL: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const REVERSE_PRIORITY_MAP: Record<NewPriority, OldPriority> = {
  urgent: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

/**
 * Transform old priority value to new database priority
 * @param oldPriority - Priority from old JSON structure (CRITICAL, HIGH, MEDIUM, LOW)
 * @returns New database priority (urgent, high, medium, low)
 */
export function transformPriority(oldPriority: string | null | undefined): NewPriority {
  if (!oldPriority) return 'medium';
  const normalized = oldPriority.toUpperCase() as OldPriority;
  return PRIORITY_MAP[normalized] ?? 'medium';
}

/**
 * Transform new database priority to old JSON priority (for backward compatibility)
 * @param newPriority - Priority from database (urgent, high, medium, low)
 * @returns Old JSON priority (CRITICAL, HIGH, MEDIUM, LOW)
 */
export function reverseTransformPriority(newPriority: string | null | undefined): OldPriority {
  if (!newPriority) return 'MEDIUM';
  const normalized = newPriority.toLowerCase() as NewPriority;
  return REVERSE_PRIORITY_MAP[normalized] ?? 'MEDIUM';
}

// ============================================================================
// Field Transformations
// ============================================================================

/**
 * Extract primary assignee from assignees array
 * @param assignees - Array of assignee IDs from old JSON structure
 * @returns First assignee ID or null if empty
 */
export function selectPrimaryAssignee(assignees: string[] | null | undefined): string | null {
  if (!assignees || assignees.length === 0) return null;
  return assignees[0];
}

/**
 * Convert single assignee back to array format (for backward compatibility)
 * @param assigneeId - Single assignee ID from database
 * @returns Array containing the assignee ID, or empty array if null
 */
export function expandAssigneeToArray(assigneeId: string | null | undefined): string[] {
  if (!assigneeId) return [];
  return [assigneeId];
}

// ============================================================================
// Full Task Transformation
// ============================================================================

/**
 * Transform old task structure to new database structure
 * Applies all field mappings and value transformations
 * @param oldTask - Task from old JSON structure
 * @returns Task in new database structure
 */
export function transformTaskFields(oldTask: OldTaskStructure): NewTaskStructure {
  return {
    id: oldTask.id,
    project_id: oldTask.project_id,
    subcontractor_id: oldTask.company_id, // Field rename
    assigned_to_user_id: selectPrimaryAssignee(oldTask.assignees),
    title: oldTask.title,
    description: oldTask.summary, // Field rename
    status: transformStatus(oldTask.status),
    priority: transformPriority(oldTask.priority),
    due_date: oldTask.due_at, // Field rename (value format same)
    metadata: {
      related: oldTask.related,
      blockers: oldTask.blockers,
      quick_actions: oldTask.quick_actions,
      tags: oldTask.tags,
      project_name: oldTask.project_name,
      legacy_assignees: oldTask.assignees,
    },
  };
}

/**
 * Transform new database task back to old structure (for backward compatibility)
 * @param newTask - Task from database
 * @returns Task in old JSON structure
 */
export function reverseTransformTaskFields(newTask: NewTaskStructure): OldTaskStructure {
  const metadata = newTask.metadata ?? {};
  return {
    id: newTask.id,
    project_id: newTask.project_id,
    project_name: metadata.project_name ?? '',
    company_id: newTask.subcontractor_id, // Field rename
    assignees: metadata.legacy_assignees ?? expandAssigneeToArray(newTask.assigned_to_user_id),
    title: newTask.title,
    summary: newTask.description, // Field rename
    related: metadata.related,
    status: reverseTransformStatus(newTask.status),
    priority: reverseTransformPriority(newTask.priority),
    due_at: newTask.due_date, // Field rename
    blockers: metadata.blockers,
    quick_actions: metadata.quick_actions,
    tags: metadata.tags,
  };
}

// ============================================================================
// Batch Transformations
// ============================================================================

/**
 * Transform array of old tasks to new structure
 * @param oldTasks - Array of tasks from old JSON structure
 * @returns Array of tasks in new database structure
 */
export function transformTasksArray(oldTasks: OldTaskStructure[]): NewTaskStructure[] {
  return oldTasks.map(transformTaskFields);
}

/**
 * Transform array of new tasks to old structure (for backward compatibility)
 * @param newTasks - Array of tasks from database
 * @returns Array of tasks in old JSON structure
 */
export function reverseTransformTasksArray(newTasks: NewTaskStructure[]): OldTaskStructure[] {
  return newTasks.map(reverseTransformTaskFields);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a status value is from the old schema (exact match, case-sensitive)
 * @param status - Status value to check
 * @returns true if old schema status (OPEN, IN_PROGRESS, BLOCKED, DONE)
 */
export function isOldStatus(status: string): status is OldTaskStatus {
  return ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE'].includes(status);
}

/**
 * Check if a status value is from the new schema (exact match, case-sensitive)
 * @param status - Status value to check
 * @returns true if new schema status (pending, in_progress, completed, cancelled)
 */
export function isNewStatus(status: string): status is NewTaskStatus {
  return ['pending', 'in_progress', 'completed', 'cancelled'].includes(status);
}

/**
 * Check if a priority value is from the old schema (exact match, case-sensitive)
 * @param priority - Priority value to check
 * @returns true if old schema priority (CRITICAL, HIGH, MEDIUM, LOW)
 */
export function isOldPriority(priority: string): priority is OldPriority {
  return ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority);
}

/**
 * Check if a priority value is from the new schema (exact match, case-sensitive)
 * @param priority - Priority value to check
 * @returns true if new schema priority (urgent, high, medium, low)
 */
export function isNewPriority(priority: string): priority is NewPriority {
  return ['urgent', 'high', 'medium', 'low'].includes(priority);
}
