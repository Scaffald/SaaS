/**
 * Theme utilities
 * Common theme-related helper functions
 */

/**
 * Format a due date with appropriate color based on urgency
 */
export function formatDueDate(dueAt: string | Date): {
  text: string
  color: string
} {
  const date = dueAt instanceof Date ? dueAt : new Date(dueAt)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      text: `${Math.abs(diffDays)}d overdue`,
      color: 'var(--color-red-10)',
    }
  }

  if (diffDays === 0) {
    return {
      text: 'Due today',
      color: 'var(--color-orange-10)',
    }
  }

  if (diffDays === 1) {
    return {
      text: 'Due tomorrow',
      color: 'var(--color-orange-10)',
    }
  }

  if (diffDays <= 3) {
    return {
      text: `Due in ${diffDays}d`,
      color: 'var(--color-orange-10)',
    }
  }

  return {
    text: date.toLocaleDateString(),
    color: 'var(--color-gray-11)',
  }
}

/**
 * Get color for compliance score
 */
export function getComplianceScoreColor(score: number): string {
  if (score >= 90) return 'var(--color-green-9)'
  if (score >= 70) return 'var(--color-yellow-9)'
  if (score >= 50) return 'var(--color-orange-9)'
  return 'var(--color-red-9)'
}

/**
 * Get color for risk level
 */
export function getRiskLevelColor(risk: string): string {
  const normalized = risk.toLowerCase()

  switch (normalized) {
    case 'low':
      return 'var(--color-green-9)'
    case 'medium':
      return 'var(--color-yellow-9)'
    case 'high':
      return 'var(--color-orange-9)'
    case 'critical':
      return 'var(--color-red-9)'
    default:
      return 'var(--color-gray-9)'
  }
}

/**
 * Get background color for risk level
 */
export function getRiskLevelBackground(risk: string): string {
  const normalized = risk.toLowerCase()

  switch (normalized) {
    case 'low':
      return 'var(--color-green-3)'
    case 'medium':
      return 'var(--color-yellow-3)'
    case 'high':
      return 'var(--color-orange-3)'
    case 'critical':
      return 'var(--color-red-3)'
    default:
      return 'var(--color-gray-3)'
  }
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format a date relative to now
 */
export function formatRelativeDate(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffTime = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return d.toLocaleDateString()
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const normalized = severity.toLowerCase()

  switch (normalized) {
    case 'low':
      return 'var(--color-blue-9)'
    case 'medium':
      return 'var(--color-yellow-9)'
    case 'high':
      return 'var(--color-orange-9)'
    case 'critical':
      return 'var(--color-red-9)'
    default:
      return 'var(--color-gray-9)'
  }
}

/**
 * Get severity background color
 */
export function getSeverityBackground(severity: string): string {
  const normalized = severity.toLowerCase()

  switch (normalized) {
    case 'low':
      return 'var(--color-blue-3)'
    case 'medium':
      return 'var(--color-yellow-3)'
    case 'high':
      return 'var(--color-orange-3)'
    case 'critical':
      return 'var(--color-red-3)'
    default:
      return 'var(--color-gray-3)'
  }
}
