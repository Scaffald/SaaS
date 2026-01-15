/**
 * Status utilities
 * Consolidated status-related helper functions
 */

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_info'

export type ComplianceStatus =
  | 'compliant'
  | 'warning'
  | 'critical'
  | 'pending'
  | 'verified'
  | 'expired'

export type DocumentStatus = 'active' | 'expired' | 'pending' | 'rejected'

export type AckStatus =
  | 'draft'
  | 'pending_broker'
  | 'pending_subcontractor'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'

export type Status = TaskStatus | ComplianceStatus | DocumentStatus | AckStatus

/**
 * Get the color for a status
 * Returns a CSS variable token
 */
export function getStatusColor(status: Status | string): string {
  const normalized = status.toLowerCase()

  // Success states
  if (['compliant', 'verified', 'active', 'approved', 'completed'].includes(normalized)) {
    return 'var(--color-green-9)'
  }

  // Warning states
  if (['warning', 'pending', 'changes_requested', 'needs_info'].includes(normalized)) {
    return 'var(--color-orange-9)'
  }

  // Info/In Progress states
  if (['in_progress', 'submitted', 'in_review', 'under_review'].includes(normalized)) {
    return 'var(--color-blue-9)'
  }

  // Error states
  if (['critical', 'expired', 'rejected', 'cancelled'].includes(normalized)) {
    return 'var(--color-red-9)'
  }

  // Default/Draft states
  if (['draft', 'pending_broker', 'pending_subcontractor'].includes(normalized)) {
    return 'var(--color-gray-9)'
  }

  // Default fallback
  return 'var(--color-gray-9)'
}

/**
 * Get the background color for a status
 */
export function getStatusBackground(status: Status | string): string {
  const normalized = status.toLowerCase()

  // Success states
  if (['compliant', 'verified', 'active', 'approved', 'completed'].includes(normalized)) {
    return 'var(--color-green-3)'
  }

  // Warning states
  if (['warning', 'pending', 'changes_requested', 'needs_info'].includes(normalized)) {
    return 'var(--color-orange-3)'
  }

  // Info/In Progress states
  if (['in_progress', 'submitted', 'in_review', 'under_review'].includes(normalized)) {
    return 'var(--color-blue-3)'
  }

  // Error states
  if (['critical', 'expired', 'rejected', 'cancelled'].includes(normalized)) {
    return 'var(--color-red-3)'
  }

  // Default/Draft states
  if (['draft', 'pending_broker', 'pending_subcontractor'].includes(normalized)) {
    return 'var(--color-gray-3)'
  }

  // Default fallback
  return 'var(--color-gray-3)'
}

/**
 * Get the display label for a status
 */
export function getStatusLabel(status: Status | string): string {
  const normalized = status.toLowerCase()

  const labelMap: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    submitted: 'Submitted',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_info: 'Needs Info',
    compliant: 'Compliant',
    warning: 'Warning',
    critical: 'Critical',
    verified: 'Verified',
    expired: 'Expired',
    active: 'Active',
    draft: 'Draft',
    pending_broker: 'Pending Broker',
    pending_subcontractor: 'Pending Subcontractor',
    under_review: 'Under Review',
    changes_requested: 'Changes Requested',
  }

  return labelMap[normalized] || status
}

/**
 * Get a complete status style object
 */
export function getStatusStyle(status: Status | string) {
  return {
    color: getStatusColor(status),
    backgroundColor: getStatusBackground(status),
    label: getStatusLabel(status),
  }
}

/**
 * Check if a status represents a completed/success state
 */
export function isSuccessStatus(status: Status | string): boolean {
  const normalized = status.toLowerCase()
  return ['compliant', 'verified', 'active', 'approved', 'completed'].includes(normalized)
}

/**
 * Check if a status represents an error/critical state
 */
export function isErrorStatus(status: Status | string): boolean {
  const normalized = status.toLowerCase()
  return ['critical', 'expired', 'rejected', 'cancelled'].includes(normalized)
}

/**
 * Check if a status represents a warning state
 */
export function isWarningStatus(status: Status | string): boolean {
  const normalized = status.toLowerCase()
  return ['warning', 'pending', 'changes_requested', 'needs_info'].includes(normalized)
}
