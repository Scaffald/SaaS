/**
 * DatePickerHeader component type definitions
 */

import type { ViewStyle } from 'react-native'

/**
 * Header type variant
 */
export type DatePickerHeaderType = 'current-month' | 'dropdown'

/**
 * Header position variant
 */
export type DatePickerHeaderPosition = 'left' | 'center'

/**
 * DatePickerHeader component props
 */
export interface DatePickerHeaderProps {
  /**
   * Current month to display (0-11, where 0 = January)
   */
  month: number

  /**
   * Current year to display
   */
  year: number

  /**
   * Header type variant
   * @default 'current-month'
   */
  type?: DatePickerHeaderType

  /**
   * Header position
   * @default 'left'
   */
  position?: DatePickerHeaderPosition

  /**
   * Whether header is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Handler for previous month navigation
   */
  onPreviousMonth?: () => void

  /**
   * Handler for next month navigation
   */
  onNextMonth?: () => void

  /**
   * Handler for month/year dropdown selection (when type is 'dropdown')
   */
  onMonthYearChange?: (month: number, year: number) => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}
