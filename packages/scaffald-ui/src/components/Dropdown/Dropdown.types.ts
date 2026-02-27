/**
 * Dropdown component types
 * Mapped from Figma Forsured Design System Dropdown component
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'

/**
 * Dropdown position variants
 */
export type DropdownPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Dropdown props
 */
export interface DropdownProps {
  /**
   * Trigger button text or custom element
   */
  trigger?: React.ReactNode

  /**
   * Position of dropdown menu relative to trigger
   * @default 'bottom-right'
   */
  position?: DropdownPosition

  /**
   * Controlled open state
   */
  open?: boolean

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Disable dropdown
   * @default false
   */
  disabled?: boolean

  /**
   * Menu content (DropdownSection/DropdownItem components)
   */
  children: React.ReactNode

  /**
   * Custom trigger button style
   */
  triggerStyle?: ViewStyle

  /**
   * Custom menu container style
   */
  menuStyle?: ViewStyle
}

/**
 * Dropdown menu props
 */
export interface DropdownMenuProps {
  /**
   * Menu content
   */
  children: React.ReactNode

  /**
   * Position of menu
   */
  position: DropdownPosition

  /**
   * Whether menu is visible
   */
  visible: boolean

  /**
   * Trigger button measurements for positioning
   */
  triggerLayout?: {
    x: number
    y: number
    width: number
    height: number
  }

  /**
   * Callback when clicking outside menu (to close)
   */
  onDismiss?: () => void

  /**
   * Custom menu style
   */
  style?: ViewStyle
}

/**
 * Dropdown section props
 */
export interface DropdownSectionProps {
  /**
   * Section heading text
   */
  heading?: string

  /**
   * Section content (DropdownItem components)
   */
  children: React.ReactNode

  /**
   * Show divider after this section
   * @default false
   */
  divider?: boolean

  /**
   * Custom section container style
   */
  style?: ViewStyle

  /**
   * Custom heading text style
   */
  headingStyle?: TextStyle
}

/**
 * Menu item type variants
 */
export type DropdownItemType = 'menu-item' | 'dropdown-menu-item'

/**
 * Menu item state variants
 */
export type DropdownItemState = 'default' | 'hover' | 'active' | 'disabled'

/**
 * Dropdown item props
 */
export interface DropdownItemProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Item text content
   */
  children: React.ReactNode

  /**
   * Menu item type
   * @default 'menu-item'
   */
  type?: DropdownItemType

  /**
   * Menu item state
   * @default 'default'
   */
  state?: DropdownItemState

  /**
   * Show checkbox indicator
   * @default false
   */
  checked?: boolean

  /**
   * Selected state (synonym for active state)
   * @default false
   */
  selected?: boolean

  /**
   * Disabled state (overrides state prop)
   * @default false
   */
  disabled?: boolean

  /**
   * Leading icon component to display before text
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Avatar component to display before text (overrides icon if both provided)
   */
  avatar?: React.ReactNode

  /**
   * Flag component to display before text (overrides icon and avatar if provided)
   */
  flag?: React.ReactNode

  /**
   * Show toggle switch component (for toggle-style menu items)
   * Pass a Toggle component when available
   * @default false
   */
  showToggle?: boolean
  toggleValue?: boolean
  onToggleChange?: (value: boolean) => void

  /**
   * Badge label to display (text or custom component)
   */
  badge?: React.ReactNode

  /**
   * Keyboard shortcut text to display on the right (e.g., "⌘K")
   */
  shortcut?: string

  /**
   * Show nested dropdown indicator (arrow icon) indicating submenu
   * @default false
   */
  hasSubmenu?: boolean

  /**
   * Press handler
   */
  onPress?: () => void

  /**
   * Custom item container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}

/**
 * Dropdown style configuration
 */
export interface DropdownStyleConfig {
  trigger: ViewStyle
  triggerText: TextStyle
  menu: ViewStyle
  section: ViewStyle
  sectionHeading: TextStyle
  item: ViewStyle
  itemText: TextStyle
  divider: ViewStyle
  checkbox: ViewStyle
  checkboxChecked: ViewStyle
  avatar: ViewStyle
  badge: ViewStyle
  badgeText: TextStyle
  shortcut: TextStyle
  submenuArrow: ViewStyle
  itemHover: ViewStyle
  itemActive: ViewStyle
  iconColor: string
  caretColor: string
}
