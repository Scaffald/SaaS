/**
 * DatePickerBase component
 * Calendar grid component with 7-day week layout
 * Maps to Figma "_Date Picker Base" component
 *
 * @example
 * ```tsx
 * import { DatePickerBase } from '@scaffald/ui'
 *
 * <DatePickerBase
 *   month={3}
 *   year={2023}
 *   selectedDate={new Date(2023, 3, 16)}
 *   onDateSelect={(date) => console.log('Selected', date)}
 *   onPreviousMonth={() => console.log('Previous')}
 *   onNextMonth={() => console.log('Next')}
 * />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import { DatePickerDay } from '../DatePickerDay'
import { DatePickerHeader } from '../DatePickerHeader'
import type { DatePickerBaseProps } from './DatePickerBase.types'
import { spacing } from '../../tokens/spacing'
import {
  getContainerStyles,
  getWeekRowStyles,
  getWeekHeaderRowStyles,
} from './DatePickerBase.styles'
import { WEEK_DAY_LABELS } from './DatePickerBase.utils'
import { useThemeContext } from '../../theme'
import { useStyles } from '../../hooks'
import { useDatePickerBase } from './useDatePickerBase'

export function DatePickerBase({
  month,
  year,
  selectedDate,
  today,
  minDate,
  maxDate,
  showIndicators = false,
  indicatorDays = [],
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
  style,
  accessibilityLabel,
}: DatePickerBaseProps) {
  const { theme } = useThemeContext()

  const datePicker = useDatePickerBase({
    month,
    year,
    selectedDate,
    today,
    minDate,
    maxDate,
    showIndicators,
    indicatorDays,
    onDateSelect,
  })

  const containerStyles = useStyles(getContainerStyles, [theme] as const)
  const weekRowStyles = useStyles(getWeekRowStyles, [] as const)
  const weekHeaderRowStyles = useStyles(getWeekHeaderRowStyles, [] as const)

  return (
    <View style={[containerStyles, style]}>
      {/* Header */}
      <DatePickerHeader
        month={month}
        year={year}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
      />

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Week Day Labels */}
        <View style={weekHeaderRowStyles}>
          {WEEK_DAY_LABELS.map((label) => (
            <DatePickerDay
              key={label}
              label={label}
              disabled
              style={styles.weekHeaderCell}
            />
          ))}
        </View>

        {/* Calendar Weeks */}
        {datePicker.weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={weekRowStyles}>
            {week.map(({ date, isCurrentMonth }, dayIndex) => {
              const dayState = datePicker.getDayState(date, isCurrentMonth)
              const showIndicator = datePicker.hasIndicator(date)

              return (
                <DatePickerDay
                  key={`${date.year}-${date.month}-${date.day}-${dayIndex}`}
                  day={date.day}
                  state={
                    dayState as import('../DatePickerDay/DatePickerDay.types').DatePickerDayState
                  }
                  disabled={!isCurrentMonth || dayState === 'empty'}
                  showIndicator={showIndicator}
                  onPress={() => datePicker.handleDatePress(date)}
                  accessibilityLabel={`Select ${date.day} ${new globalThis.Date(date.year, date.month, date.day).toLocaleDateString()}`}
                />
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: 'column',
    flex: 1,
    gap: 0, // No gap between rows - cells fill the space
  },
  weekHeaderCell: {
    paddingHorizontal: spacing[2], // 2px horizontal padding for week headers (from Figma)
  },
})
