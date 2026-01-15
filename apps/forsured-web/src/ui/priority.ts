/**
 * Priority utilities
 * Consolidated priority-related helper functions
 */

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

/**
 * Get the color for a priority level
 * Returns a CSS variable token
 */
export function getPriorityColor(priority: TaskPriority | string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'var(--color-red-9)'
    case 'high':
      return 'var(--color-orange-9)'
    case 'medium':
      return 'var(--color-blue-9)'
    case 'low':
      return 'var(--color-gray-9)'
    default:
      return 'var(--color-gray-9)'
  }
}

/**
 * Get the background color for a priority level
 */
export function getPriorityBackground(priority: TaskPriority | string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'var(--color-red-3)'
    case 'high':
      return 'var(--color-orange-3)'
    case 'medium':
      return 'var(--color-blue-3)'
    case 'low':
      return 'var(--color-gray-3)'
    default:
      return 'var(--color-gray-3)'
  }
}

/**
 * Get the display label for a priority level
 */
export function getPriorityLabel(priority: TaskPriority | string): string {
  switch (priority.toLowerCase()) {
    case 'urgent':
      return 'Urgent'
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return priority
  }
}

/**
 * Get a complete priority style object
 */
export function getPriorityStyle(priority: TaskPriority | string) {
  return {
    color: getPriorityColor(priority),
    backgroundColor: getPriorityBackground(priority),
    label: getPriorityLabel(priority),
  }
}
