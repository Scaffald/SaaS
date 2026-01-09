/**
 * CommandMenu component types
 * Complete command menu/palette component
 */

import type { ViewStyle } from 'react-native'
import type { CommandMenuItemData } from '../CommandMenuItem/CommandMenuItem.types'

/**
 * Tab configuration
 */
export interface CommandMenuTab {
  /**
   * Tab value (unique identifier)
   */
  value: string

  /**
   * Tab label
   */
  label: string
}

/**
 * CommandMenu props
 */
export interface CommandMenuProps {
  /**
   * Controlled open state
   */
  open?: boolean

  /**
   * Open state change handler
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Default open state (uncontrolled)
   * @default false
   */
  defaultOpen?: boolean

  /**
   * Search input placeholder
   * @default "Search..."
   */
  placeholder?: string

  /**
   * Search input helper text
   */
  helperText?: string

  /**
   * Tab configurations
   */
  tabs?: CommandMenuTab[]

  /**
   * Menu items to display
   */
  items: CommandMenuItemData[]

  /**
   * Item selection handler
   */
  onItemSelect?: (item: CommandMenuItemData) => void

  /**
   * Controlled search value
   */
  searchValue?: string

  /**
   * Search value change handler
   */
  onSearchChange?: (value: string) => void

  /**
   * Default search value (uncontrolled)
   */
  defaultSearchValue?: string

  /**
   * Default active tab (uncontrolled)
   */
  defaultTab?: string

  /**
   * Controlled active tab
   */
  activeTab?: string

  /**
   * Tab change handler
   */
  onTabChange?: (tab: string) => void

  /**
   * Close on item select
   * @default true
   */
  closeOnSelect?: boolean

  /**
   * Close on escape key
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Close on backdrop press (web only)
   * @default true
   */
  closeOnBackdropPress?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Test ID for testing
   */
  testID?: string
}
