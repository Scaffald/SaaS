/**
 * REQ-127: Task Auto-Generation from Compliance Gaps
 * Type definitions for automatic task generation
 */

import { GapType, GapSeverity, ComplianceGap } from '../compliance/evaluator/types';
import { TaskPriority, TaskStatus } from '../../types';

/**
 * Task generation request
 */
export interface TaskGenerationRequest {
  evaluation_run_id: string;
  project_id: string;
  subcontractor_org_id: string;
  gaps: ComplianceGap[];
}

/**
 * Task generation response
 */
export interface TaskGenerationResponse {
  tasks_created: number;
  tasks_updated: number;
  tasks_skipped: number;
  processing_time_ms: number;
  task_ids: string[];
}

/**
 * Generated task data
 */
export interface GeneratedTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_by_user_id: string;
  assigned_to_user_id?: string;
  project_id: string;
  policy_id?: string;
  task_type: string;
  metadata: TaskMetadata;
  created_at: string;
  updated_at: string;
}

/**
 * Task metadata for compliance context
 */
export interface TaskMetadata {
  gap_type: GapType;
  gap_severity: GapSeverity;
  gap_id: string;
  evaluation_run_id: string;
  subcontractor_org_id: string;
  coverage_type?: string;
  endorsement?: string;
  current_value?: string | number | null;
  required_value: string | number;
  remediation: string;
  auto_generated: boolean;
}

/**
 * Task template definition
 */
export interface TaskTemplate {
  gap_type: GapType;
  title_template: (gap: ComplianceGap) => string;
  description_template: (gap: ComplianceGap) => string;
  task_type: string;
  priority_mapping: Record<GapSeverity, TaskPriority>;
  due_date_days: Record<GapSeverity, number>;
}

/**
 * Deduplication key for task uniqueness
 */
export interface DeduplicationKey {
  gap_type: GapType;
  subcontractor_org_id: string;
  project_id: string;
  policy_id?: string;
  coverage_type?: string;
  endorsement?: string;
}

/**
 * Task deduplication result
 */
export interface DeduplicationResult {
  action: 'create' | 'update' | 'skip';
  existing_task_id?: string;
  reason?: string;
}

/**
 * Task assignment strategy
 */
export type TaskAssignmentStrategy = 'project_manager' | 'compliance_manager' | 'subcontractor' | 'unassigned';

/**
 * Task assignment result
 */
export interface TaskAssignmentResult {
  assigned_to_user_id?: string;
  assignment_strategy: TaskAssignmentStrategy;
  assignment_reason: string;
}

/**
 * Severity to priority mapping (default)
 */
export const DEFAULT_PRIORITY_MAPPING: Record<GapSeverity, TaskPriority> = {
  [GapSeverity.CRITICAL]: 'urgent',
  [GapSeverity.WARNING]: 'high',
  [GapSeverity.INFO]: 'medium'
};

/**
 * Severity to due date days mapping (default)
 */
export const DEFAULT_DUE_DATE_DAYS: Record<GapSeverity, number> = {
  [GapSeverity.CRITICAL]: 3,
  [GapSeverity.WARNING]: 7,
  [GapSeverity.INFO]: 14
};

/**
 * Task type constants
 */
export const TASK_TYPES = {
  COI_UPLOAD: 'coi_upload',
  ENDORSEMENT_CORRECTION: 'endorsement_correction',
  COVERAGE_INCREASE: 'coverage_increase',
  POLICY_RENEWAL: 'policy_renewal',
  POLICY_EXTENSION: 'policy_extension'
} as const;

/**
 * System user ID for auto-generated tasks
 */
export const SYSTEM_USER_ID = 'system-task-generator';
