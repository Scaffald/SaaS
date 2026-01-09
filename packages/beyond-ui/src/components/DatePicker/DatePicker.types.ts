/**
 * DatePicker component type definitions
 */

import type { ViewStyle } from 'react-native'
import type { DateObject } from '../DatePickerBase/DatePickerBase.utils'

/**
 * DatePicker type variant
 */
export type DatePickerType = 'blank' | 'one-day-selected' | 'date-range'

/**
 * DatePicker size variant
 */
export type DatePickerSize = 'small' | 'expanded'

/**
 * Preset date range option
 */
export interface DatePickerPresetOption {
  /**
   * Label for the preset option
   */
  label: string

  /**
   * Handler for preset selection
   */
  onSelect: () => void
}

/**
 * DatePicker component props
 */
export interface DatePickerProps {
  /**
   * Selected date(s)
   * - Single date: Date object
   * - Date range: [startDate, endDate]
   * - No selection: null
   */
  value?: DateObject | [DateObject, DateObject] | null

  /**
   * Handler for date selection
   */
  onChange?: (date: DateObject | [DateObject, DateObject] | null) => void

  /**
   * DatePicker type variant
   * @default 'blank'
   */
  type?: DatePickerType

  /**
   * DatePicker size variant
   * @default 'small'
   */
  size?: DatePickerSize

  /**
   * Minimum selectable date
   */
  minDate?: DateObject

  /**
   * Maximum selectable date
   */
  maxDate?: DateObject

  /**
   * Whether to show work day indicators
   * @default false
   */
  showIndicators?: boolean

  /**
   * Days that should show indicators (work days)
   */
  indicatorDays?: DateObject[]

  /**
   * Handler for cancel action
   */
  onCancel?: () => void

  /**
   * Handler for apply action
   */
  onApply?: () => void

  /**
   * Preset date range options (for expanded size)
   */
  presetOptions?: DatePickerPresetOption[]

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}
