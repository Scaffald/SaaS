/**
 * Inquiry workflow state machine
 * Defines valid status transitions and application status mapping
 */

export type InquiryStatus =
  | 'draft'
  | 'sent'
  | 'candidate_responded'
  | 'organization_responded'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type ApplicationStatusForInquiry =
  | 'screen'
  | 'inquired'
  | 'offer'

/**
 * Valid status transitions for each inquiry status
 */
export const INQUIRY_STATUS_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  draft: ['sent', 'withdrawn'],
  sent: ['candidate_responded', 'withdrawn'],
  candidate_responded: ['organization_responded', 'accepted', 'rejected', 'withdrawn'],
  organization_responded: ['candidate_responded', 'accepted', 'rejected', 'withdrawn'],
  accepted: [], // Terminal state
  rejected: [], // Terminal state
  withdrawn: [], // Terminal state
}

/**
 * Map inquiry status to application status
 */
export const INQUIRY_TO_APPLICATION_STATUS: Record<InquiryStatus, ApplicationStatusForInquiry | null> = {
  draft: 'screen', // Draft inquiries don't change application status
  sent: 'inquired',
  candidate_responded: 'inquired',
  organization_responded: 'inquired',
  accepted: 'offer',
  rejected: 'screen', // Return to screening after rejection
  withdrawn: 'screen', // Return to screening after withdrawal
}

/**
 * Check if a status transition is valid
 */
export function canTransitionInquiryStatus(
  currentStatus: InquiryStatus,
  newStatus: InquiryStatus
): boolean {
  // Allow same status (no-op)
  if (currentStatus === newStatus) {
    return true
  }

  // Check if transition is in allowed list
  const allowedTransitions = INQUIRY_STATUS_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(newStatus)
}

/**
 * Get the application status for a given inquiry status
 */
export function getApplicationStatusForInquiry(
  inquiryStatus: InquiryStatus
): ApplicationStatusForInquiry | null {
  return INQUIRY_TO_APPLICATION_STATUS[inquiryStatus]
}

/**
 * Check if an inquiry status is terminal (cannot transition further)
 */
export function isTerminalStatus(status: InquiryStatus): boolean {
  return INQUIRY_STATUS_TRANSITIONS[status].length === 0
}

/**
 * Get all possible next statuses for a given inquiry status
 */
export function getNextPossibleStatuses(currentStatus: InquiryStatus): InquiryStatus[] {
  return [...INQUIRY_STATUS_TRANSITIONS[currentStatus]]
}

