/**
 * CommandMenuItem component types
 * Individual item in the command menu list
 */

import type { ViewStyle, TextStyle, PressableProps } from 'react-native'
import type { AvatarProps } from '../../Avatar/Avatar.types'
import type { IconComponent } from '../../types'

/**
 * Menu item type variant
 */
export type CommandMenuItemType = 'Avatar' | 'Icon' | 'Empty'

/**
 * Text orientation
 */
export type CommandMenuItemOrientation = 'Vertical' | 'Horizontal'

/**
 * Menu item state
 */
export type CommandMenuItemState = 'Default' | 'Hover' | 'Focused'

/**
 * Command menu item data
 */
export interface CommandMenuItemData {
  /**
   * Unique identifier for the item
   */
  id: string

  /**
   * Primary text (title)
   */
  title: string

  /**
   * Secondary text (subtitle/description)
   */
  subtitle?: string

  /**
   * Item type
   */
  type?: CommandMenuItemType

  /**
   * Avatar props (when type="Avatar")
   */
  avatar?: Pick<AvatarProps, 'src' | 'initials' | 'alt' | 'size'>

  /**
   * Icon component (when type="Icon")
   */
  icon?: IconComponent

  /**
   * Keyboard shortcut keys (optional)
   */
  shortcut?: string[]

  /**
   * Custom data for the item
   */
  data?: Record<string, unknown>

  /**
   * Tab value for filtering (optional)
   */
  tab?: string
}

/**
 * CommandMenuItem props
 */
export interface CommandMenuItemProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Item type
   * @default 'Empty'
   */
  type?: CommandMenuItemType

  /**
   * Text orientation
   * @default 'Vertical'
   */
  textOrientation?: CommandMenuItemOrientation

  /**
   * Primary text (title)
   */
  title: string

  /**
   * Secondary text (subtitle)
   */
  subtitle?: string

  /**
   * Avatar props (when type="Avatar")
   */
  avatar?: Pick<AvatarProps, 'src' | 'initials' | 'alt' | 'size'>

  /**
   * Icon component (when type="Icon")
   */
  icon?: IconComponent

  /**
   * Keyboard shortcut keys (optional)
   */
  shortcut?: string[]

  /**
   * Controlled state
   */
  state?: CommandMenuItemState

  /**
   * Show keyboard shortcut
   * @default true
   */
  showShortcut?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}
