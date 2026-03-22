/**
 * ContextMenu component types
 * iOS 26 glassmorphic context menu with quick actions and sectioned items
 */

import type { ViewStyle } from 'react-native'

/**
 * Quick action button displayed in the horizontal bar at the top of the menu
 */
export interface ContextMenuQuickAction {
  /** Button label text */
  label: string
  /** Icon element rendered above the label */
  icon: React.ReactNode
  /** Callback when action is pressed */
  onPress: () => void
  /** Renders the action in red destructive color */
  destructive?: boolean
}

/**
 * Individual menu item within a section
 */
export interface ContextMenuAction {
  /** Menu item label */
  label: string
  /** Leading icon element */
  icon?: React.ReactNode
  /** Callback when item is pressed */
  onPress?: () => void
  /** Renders the item in red destructive color */
  destructive?: boolean
  /** Disables the item */
  disabled?: boolean
  /** Secondary description text below the label */
  subtitle?: string
  /** Keyboard shortcut symbols displayed on the trailing side */
  shortcut?: string[]
  /** Nested submenu sections (renders a chevron indicator) */
  submenu?: ContextMenuSection[]
}

/**
 * A group of menu items with an optional section title
 */
export interface ContextMenuSection {
  /** Optional section header text */
  title?: string
  /** Menu items in this section */
  items: ContextMenuAction[]
}

/**
 * ContextMenu props
 */
export interface ContextMenuProps {
  /** Content that triggers the context menu (long-press target) */
  children: React.ReactNode
  /** Controls visibility of the context menu */
  visible: boolean
  /** Called when the context menu should close (backdrop press, action press, etc.) */
  onClose: () => void
  /** Optional horizontal row of quick action buttons at the top */
  quickActions?: ContextMenuQuickAction[]
  /** Sectioned menu items */
  sections: ContextMenuSection[]
  /** Custom style for the menu container */
  style?: ViewStyle
}
