/**
 * Sidebar component type definitions
 */

import type { ViewStyle } from 'react-native'
import type React from 'react'
import type { IconComponent } from '../types'

/**
 * Sidebar theme variant
 */
export type SidebarVariant = 'main' | 'finance' | 'management' | 'banking' | 'crypto'

/**
 * Sidebar menu item type
 */
export type SidebarItemType =
  | 'default'
  | 'child'
  | 'double'
  | 'cta'
  | 'heading'
  | 'divider'
  | 'widget'

/**
 * Sidebar menu item state
 */
export type SidebarItemState = 'default' | 'hover' | 'active' | 'disabled'

/**
 * Sidebar widget type
 */
export type SidebarWidgetType =
  | 'progress-horizontal'
  | 'progress-vertical'
  | 'message-horizontal'
  | 'message-vertical'

/**
 * Sidebar context value
 */
export interface SidebarContextValue {
  collapsed: boolean
  variant: SidebarVariant
  theme: 'light' | 'dark'
  activeColor?: string
}

/**
 * Sidebar style configuration returned by style factory
 */
export interface SidebarStyleConfig {
  container: ViewStyle
  scrollView: ViewStyle
  scrollContent: ViewStyle
  footerContainer: ViewStyle
  activeColor: string
}

/**
 * Sidebar display mode
 */
export type SidebarMode = 'fixed' | 'overlay' | 'auto'

/**
 * Keyboard navigation options
 */
export interface SidebarKeyboardOptions {
  /**
   * Enable keyboard shortcuts
   * @default true
   */
  enabled?: boolean

  /**
   * Keyboard shortcut to toggle sidebar (e.g., 'ctrl+b', 'cmd+b')
   */
  toggleShortcut?: string

  /**
   * Enable arrow key navigation through menu items
   * @default true
   */
  arrowNavigation?: boolean
}

/**
 * Main Sidebar component props
 */
export interface SidebarProps {
  /**
   * Whether sidebar is collapsed (icons only)
   * @default false
   */
  collapsed?: boolean

  /**
   * Default collapsed state for uncontrolled mode
   * @default false
   */
  defaultCollapsed?: boolean

  /**
   * Callback when collapsed state changes
   */
  onCollapseChange?: (collapsed: boolean) => void

  /**
   * Theme variant
   * @default 'main'
   */
  variant?: SidebarVariant

  /**
   * Custom header content (overrides default SidebarHeader)
   */
  header?: React.ReactNode

  /**
   * Custom footer content (overrides default SidebarFooter)
   */
  footer?: React.ReactNode

  /**
   * Sidebar content (menu items, widgets, etc.)
   */
  children?: React.ReactNode

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Width when expanded
   * @default 272
   */
  expandedWidth?: number

  /**
   * Width when collapsed
   * @default 80
   */
  collapsedWidth?: number

  /**
   * Display mode
   * - fixed: Always visible, pushes content
   * - overlay: Appears over content
   * - auto: Overlay on mobile, fixed on desktop
   * @default 'fixed'
   */
  mode?: SidebarMode

  /**
   * Callback when overlay backdrop is pressed (overlay mode only)
   */
  onOverlayPress?: () => void

  /**
   * Show hamburger menu button
   * @default false
   */
  showHamburger?: boolean

  /**
   * Hamburger button position
   * @default 'header'
   */
  hamburgerPosition?: 'header' | 'outside'

  /**
   * Keyboard navigation options
   */
  keyboard?: SidebarKeyboardOptions

  /**
   * Enable smooth collapse/expand animations
   * @default true
   */
  animated?: boolean

  /**
   * Animation duration in milliseconds
   * @default 200
   */
  animationDuration?: number
}

/**
 * Sidebar menu item props
 */
export interface SidebarMenuItemProps {
  /**
   * Menu item type
   * @default 'default'
   */
  type?: SidebarItemType

  /**
   * Item state
   * @default 'default'
   */
  state?: SidebarItemState

  /**
   * Primary label text
   */
  label?: string

  /**
   * Supporting text (for double type)
   */
  supportingText?: string

  /**
   * Leading icon component
   */
  icon?: IconComponent

  /**
   * Badge notification (number or string)
   */
  badge?: string | number

  /**
   * Show toggle switch
   * @default false
   */
  showToggle?: boolean

  /**
   * Toggle switch value
   * @default false
   */
  toggleValue?: boolean

  /**
   * Toggle switch change handler
   */
  onToggleChange?: (value: boolean) => void

  /**
   * Count indicator (e.g., "3K")
   */
  count?: string | number

  /**
   * Avatar component
   */
  avatar?: React.ReactNode

  /**
   * Show expand/collapse arrow (for items with children)
   * @default false
   */
  showExpandIcon?: boolean

  /**
   * Whether submenu is expanded
   * @default false
   */
  expanded?: boolean

  /**
   * Expand/collapse handler
   */
  onExpand?: () => void

  /**
   * CTA button text (for cta type)
   */
  buttonText?: string

  /**
   * Item press handler
   */
  onPress?: () => void

  /**
   * Whether item is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Submenu items (nested menu items)
   */
  children?: React.ReactNode

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom label style
   */
  labelStyle?: ViewStyle

  /**
   * Value for controlled active state
   */
  value?: string

  /**
   * Unique identifier for the item
   */
  id?: string
}

/**
 * Sidebar header props
 */
export interface SidebarHeaderProps {
  /**
   * Logo component
   */
  logo?: React.ReactNode

  /**
   * Brand title text
   */
  title?: string

  /**
   * Whether sidebar is collapsed
   */
  collapsed?: boolean

  /**
   * Collapse toggle button handler
   */
  onCollapse?: () => void

  /**
   * Show collapse toggle button
   * @default true
   */
  showCollapseButton?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Tooltip configuration for footer actions
 */
export type FooterActionTooltip = string | {
  content: string
  position?: 'up-center' | 'up-left' | 'up-right' | 'down-center' | 'down-left' | 'down-right'
  delay?: number
}

/**
 * Sidebar footer props
 */
export interface SidebarFooterProps {
  /**
   * User information
   */
  user?: {
    name: string
    email?: string
    avatar?: React.ReactNode
  }

  /**
   * Action buttons (chat, notifications, settings, etc.)
   */
  actions?: Array<{
    /**
     * Unique identifier for the action (required for proper React keys)
     */
    id: string
    icon: IconComponent
    label?: string
    onPress: () => void
    badge?: number
    tooltip?: FooterActionTooltip
  }>

  /**
   * Whether sidebar is collapsed
   */
  collapsed?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Sidebar widget props
 */
export interface SidebarWidgetProps {
  /**
   * Widget type
   * @default 'progress-horizontal'
   */
  type?: SidebarWidgetType

  /**
   * Widget label
   */
  label?: string

  /**
   * Progress value (0-100)
   */
  value?: number

  /**
   * Maximum value (for progress widgets)
   */
  max?: number

  /**
   * Current value text (e.g., "178MB of 445MB")
   */
  valueText?: string

  /**
   * Message text (for message widgets)
   */
  message?: string

  /**
   * Action button text
   */
  buttonText?: string

  /**
   * Button press handler
   */
  onButtonPress?: () => void

  /**
   * Whether sidebar is collapsed
   */
  collapsed?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Sidebar item group props
 */
export interface SidebarItemGroupProps {
  /**
   * Section heading text
   */
  heading?: string

  /**
   * Show divider above group
   * @default false
   */
  showDivider?: boolean

  /**
   * Group content (menu items)
   */
  children?: React.ReactNode

  /**
   * Whether sidebar is collapsed
   */
  collapsed?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}

