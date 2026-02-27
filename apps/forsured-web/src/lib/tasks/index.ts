/**
 * Task Auto-Generation from Compliance Gaps
 * Status Change Notifications
 * Main export file for task generation and notification services
 */

export * from './types';
export { TaskTemplates } from './taskTemplates';
export { DeduplicationService } from './deduplicationService';
export { TaskAssignmentService } from './taskAssignmentService';
export { TaskGenerationService } from './taskGenerationService';

// Status notification exports
export * from './statusNotificationConfig';
export { statusNotificationService, createStatusChangeNotifications } from './statusNotificationService';
export type { NotificationRecord, StatusNotificationResult } from './statusNotificationService';

// TASK-4: Compliance score update exports
export {
  complianceScoreService,
  updateComplianceScoreOnStatusChange,
  isComplianceRelatedTask,
  shouldUpdateComplianceScore,
  calculateProjectComplianceScore,
} from './complianceScoreService';
export type { ComplianceScoreUpdateResult } from './complianceScoreService';

// Task Assignment Workflow exports
export {
  taskAssignmentTypeService,
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
} from './taskAssignmentTypeService';
export type {
  TaskAssignmentType,
  TaskViewType,
  TaskAssignmentTypeResult,
} from './taskAssignmentTypeService';
