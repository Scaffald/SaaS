/**
 * DatePickerDay component type definitions
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Day state variant for date picker day
 */
export type DatePickerDayState =
  | 'default'
  | 'hover'
  | 'selected'
  | 'today'
  | 'empty'
  | 'middle'
  | 'selected-left'
  | 'selected-right'

/**
 * DatePickerDay component props
 */
export interface DatePickerDayProps {
  /**
   * Day number to display (1-31)
   */
  day?: number | string

  /**
   * Day label for week header (Mo, Tu, We, etc.)
   */
  label?: string

  /**
   * State variant
   * @default 'default'
   */
  state?: DatePickerDayState

  /**
   * Whether day is disabled (empty/out of month)
   * @default false
   */
  disabled?: boolean

  /**
   * Whether to show work day indicator (green dot)
   * @default false
   */
  showIndicator?: boolean

  /**
   * Press handler
   */
  onPress?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}
