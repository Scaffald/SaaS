/**
 * ButtonGroup component types
 * Grouped buttons (segmented control) mapped from Figma
 */

import type { ViewStyle } from 'react-native'
import type { IconComponent } from '../types'

/**
 * Button group selection mode
 */
export type ButtonGroupMode = 'single' | 'multiple'

/**
 * Button group size
 */
export type ButtonGroupSize = 'xs' | 'sm' | 'md'

/**
 * Button group orientation
 */
export type ButtonGroupOrientation = 'horizontal' | 'vertical'

/**
 * Button group item
 */
export interface ButtonGroupItem {
  /**
   * Unique identifier
   */
  id: string

  /**
   * Button label
   */
  label?: string

  /**
   * Icon component
   */
  icon?: IconComponent

  /**
   * Icon position
   */
  iconPosition?: 'start' | 'end'

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Custom value (for controlled mode)
   */
  value?: unknown
}

/**
 * ButtonGroup props
 */
export interface ButtonGroupProps {
  /**
   * Group items
   */
  items: ButtonGroupItem[]

  /**
   * Selection mode
   * @default 'single'
   */
  mode?: ButtonGroupMode

  /**
   * Size variant
   * @default 'md'
   */
  size?: ButtonGroupSize

  /**
   * Orientation
   * @default 'horizontal'
   */
  orientation?: ButtonGroupOrientation

  /**
   * Selected item ID(s)
   * For single mode: string
   * For multiple mode: string[]
   */
  value?: string | string[]

  /**
   * Default selected item ID(s)
   * For single mode: string
   * For multiple mode: string[]
   */
  defaultValue?: string | string[]

  /**
   * Change handler
   */
  onChange?: (value: string | string[]) => void

  /**
   * Disabled state for entire group
   */
  disabled?: boolean

  /**
   * Full width
   * @default false
   */
  fullWidth?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle
}
