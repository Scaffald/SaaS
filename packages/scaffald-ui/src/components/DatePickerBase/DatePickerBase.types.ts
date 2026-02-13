/**
 * DatePickerBase component type definitions
 */

import type { ViewStyle } from 'react-native'
import type { DateObject } from './DatePickerBase.utils'

/**
 * DatePickerBase component props
 */
export interface DatePickerBaseProps {
  /**
   * Current month to display (0-11, where 0 = January)
   */
  month: number

  /**
   * Current year to display
   */
  year: number

  /**
   * Selected date(s)
   * - Single date: Date object
   * - Date range: [startDate, endDate]
   * - No selection: null
   */
  selectedDate?: DateObject | [DateObject, DateObject] | null

  /**
   * Today's date (for highlighting)
   */
  today?: DateObject

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
   * Handler for date selection
   */
  onDateSelect?: (date: DateObject) => void

  /**
   * Handler for month navigation
   */
  onPreviousMonth?: () => void

  /**
   * Handler for month navigation
   */
  onNextMonth?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Accessibility label
   */
  accessibilityLabel?: string
}
