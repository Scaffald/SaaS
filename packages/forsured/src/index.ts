/**
 * @unicornlove/forsured
 *
 * Aggregate package that re-exports all domain-specific components
 * for the Forsured insurance platform.
 *
 * This package provides a single import point for all Forsured-specific
 * UI components across insurance, compliance, and task management domains.
 */

// ============================================================================
// Insurance Domain Components
// ============================================================================

export {
  PolicyCard,
  CoverageTable,
  EndorsementList,
  PolicyStatusBadge,
  GLSubLimitsTable, // REQ-280
} from '@unicornlove/insurance'

export type {
  PolicyCardProps,
  CoverageTableProps,
  Coverage,
  EndorsementListProps,
  Endorsement,
  PolicyStatusBadgeProps,
  PolicyStatus,
  GLSubLimitsTableProps, // REQ-280
  GLSubLimitItem, // REQ-280
} from '@unicornlove/insurance'

// ============================================================================
// Compliance Domain Components
// ============================================================================

export {
  ComplianceScore,
  ParticipantsTable,
  ParticipantsFilter, // REQ-281 TASK-3
  ComplianceChecklist,
  ClientCard, // REQ-288
  GCProfileHeader, // REQ-288
} from '@unicornlove/compliance'

export type {
  ComplianceScoreProps,
  ParticipantsTableProps,
  Participant,
  ParticipantType,
  ComplianceStatus,
  ParticipantsFilterProps, // REQ-281 TASK-3
  FilterOption, // REQ-281 TASK-3
  ComplianceChecklistProps,
  ChecklistItem,
  ChecklistItemStatus,
  ClientCardProps, // REQ-288
  ClientType, // REQ-288
  RiskLevel, // REQ-288
  ClientStatus, // REQ-288
  GCProfileHeaderProps, // REQ-288
  ComplianceLevel, // REQ-288
} from '@unicornlove/compliance'

// ============================================================================
// Task Management Components
// ============================================================================

export {
  TaskCard,
  TasksInbox,
  CommentThread,
  TaskStatusDropdown, // REQ-288
  TaskHistoryTimeline, // REQ-288
} from '@unicornlove/tasks'

export type {
  TaskCardProps,
  TaskStatus,
  TaskPriority,
  TasksInboxProps,
  Task,
  CommentThreadProps,
  Comment,
  TaskStatusDropdownProps, // REQ-288
  TaskHistoryTimelineProps, // REQ-288
  HistoryEvent, // REQ-288
  HistoryEventType, // REQ-288
} from '@unicornlove/tasks'
