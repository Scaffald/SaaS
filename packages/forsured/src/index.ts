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
  CoverageTable,
  EndorsementList,
  GLSubLimitsTable,
  PolicyCard,
  PolicyStatusBadge,
} from "@unicornlove/insurance";

export type {
  Coverage,
  CoverageTableProps,
  Endorsement,
  EndorsementListProps,
  GLSubLimitItem,
  GLSubLimitsTableProps,
  PolicyCardProps,
  PolicyStatus,
  PolicyStatusBadgeProps,
} from "@unicornlove/insurance";

// ============================================================================
// Compliance Domain Components
// ============================================================================

export {
  ClientCard,
  ComplianceChecklist,
  ComplianceScore,
  GCProfileHeader,
  ParticipantsFilter,
  ParticipantsTable,
} from "@unicornlove/compliance";

export type {
  ChecklistItem,
  ChecklistItemStatus,
  ClientCardProps,
  ClientStatus,
  ClientType,
  ComplianceChecklistProps,
  ComplianceLevel,
  ComplianceScoreProps,
  ComplianceStatus,
  FilterOption,
  GCProfileHeaderProps,
  Participant,
  ParticipantsFilterProps,
  ParticipantsTableProps,
  ParticipantType,
  RiskLevel,
} from "@unicornlove/compliance";

// ============================================================================
// Task Management Components
// ============================================================================

export {
  CommentThread,
  TaskCard,
  TaskHistoryTimeline,
  TasksInbox,
  TaskStatusDropdown,
} from "@unicornlove/tasks";

export type {
  Comment,
  CommentThreadProps,
  HistoryEvent,
  HistoryEventType,
  Task,
  TaskCardProps,
  TaskHistoryTimelineProps,
  TaskPriority,
  TasksInboxProps,
  TaskStatus,
  TaskStatusDropdownProps,
} from "@unicornlove/tasks";
