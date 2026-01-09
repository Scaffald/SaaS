/**
 * Breadcrumb component types
 * Type definitions for navigation breadcrumb component
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Breadcrumb item state
 */
export type BreadcrumbItemState = 'default' | 'active'

/**
 * Individual breadcrumb item data
 */
export interface BreadcrumbItemData {
  /** Unique identifier for the item */
  id?: string | number
  /** Display label for the breadcrumb item */
  label: string
  /** Optional icon (typically home icon for first item) */
  icon?: React.ReactNode
  /** Optional href for navigation (web) */
  href?: string
  /** Click handler for this specific item */
  onPress?: () => void
  /** Disable interaction for this item */
  disabled?: boolean
}

/**
 * Main Breadcrumb component props
 */
export interface BreadcrumbProps {
  // Core
  /** Array of breadcrumb items */
  items: BreadcrumbItemData[]
  /** Index of current/active page (0-based) */
  currentIndex: number

  // Customization
  /** Custom separator component (default: chevron) */
  separator?: React.ReactNode
  /** Show/hide separators (default: true) */
  showSeparator?: boolean
  /** Show home icon on first item (default: true) */
  showHomeIcon?: boolean
  /** Custom home icon component */
  homeIcon?: React.ReactNode

  // Interaction
  /** Make breadcrumbs clickable (default: true) */
  interactive?: boolean
  /** Global click handler for all items */
  onItemPress?: (index: number, item: BreadcrumbItemData) => void

  // Styling
  /** Container style */
  style?: ViewStyle
  /** Individual item style */
  itemStyle?: ViewStyle
  /** Separator style */
  separatorStyle?: ViewStyle

  // Accessibility
  /** Aria label for navigation (default: "Breadcrumb") */
  ariaLabel?: string

  // Advanced (future)
  /** Max visible items with collapse (e.g., "Home > ... > Current") */
  maxItems?: number
}

/**
 * Individual breadcrumb item props
 */
export interface BreadcrumbItemProps {
  /** Display label */
  label: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Visual state (hover handled internally) */
  state: BreadcrumbItemState
  /** Enable interaction */
  interactive?: boolean
  /** Disable interaction */
  disabled?: boolean
  /** Click handler */
  onPress?: () => void
  /** Custom style */
  style?: ViewStyle
  /** Custom label style */
  labelStyle?: TextStyle
}

/**
 * Breadcrumb separator props
 */
export interface BreadcrumbSeparatorProps {
  /** Custom separator content */
  separator?: React.ReactNode
  /** Custom style */
  style?: ViewStyle
}
