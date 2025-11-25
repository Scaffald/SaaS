/**
 * Base props for all profile widgets
 */
export interface ProfileWidgetProps {
  /** User ID to display profile for. If not provided, uses current user */
  userId?: string
  /** Show edit button and actions (for own profile view) */
  showEdit?: boolean
  /** Display variant */
  variant?: 'compact' | 'full'
  /** Show CTA button for incomplete assessments (dashboard use case) */
  showCTA?: boolean
}

/**
 * Widget data loading state
 */
export interface WidgetState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}
