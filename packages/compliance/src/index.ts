/**
 * @frs/compliance
 *
 * Compliance domain components for the Unicorn UI system.
 */

// ComplianceScore
export { ComplianceScore } from './ComplianceScore'
export type { ComplianceScoreProps } from './ComplianceScore'

// ParticipantsTable
export { ParticipantsTable } from './ParticipantsTable'
export type {
  ParticipantsTableProps,
  Participant,
  ParticipantType,
  ComplianceStatus,
} from './ParticipantsTable'

// ParticipantsFilter (REQ-281 TASK-3)
export { ParticipantsFilter } from './ParticipantsFilter'
export type { ParticipantsFilterProps, FilterOption } from './ParticipantsFilter'

// ComplianceChecklist
export { ComplianceChecklist } from './ComplianceChecklist'
export type {
  ComplianceChecklistProps,
  ChecklistItem,
  ChecklistItemStatus,
} from './ComplianceChecklist'

// ClientCard (REQ-288)
export { ClientCard } from './ClientCard'
export type {
  ClientCardProps,
  ClientType,
  RiskLevel,
  ClientStatus,
} from './ClientCard'

// GCProfileHeader (REQ-288)
export { GCProfileHeader } from './GCProfileHeader'
export type {
  GCProfileHeaderProps,
  ComplianceLevel,
} from './GCProfileHeader'
