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
import {
  generateCalendarDates,
  dateToSimple,
  simpleToDate,
  isToday,
  isSameDate,
  isRangeStart,
  isRangeEnd,
  isRangeMiddle,
  WEEK_DAY_LABELS,
  type DateObject,
} from './DatePickerBase.utils'
import { useThemeContext } from '../../theme'

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

  const todayDate = today ? today : dateToSimple(new globalThis.Date())
  const selectedDateSimple = selectedDate

  const calendarDates = generateCalendarDates(year, month)

  const getDayState = (date: DateObject, isCurrentMonth: boolean): string => {
    if (!isCurrentMonth) {
      return 'empty'
    }

    // Check if date is disabled
    if (minDate || maxDate) {
      const dateObj = simpleToDate(date)
      if (minDate) {
        const minDateObj = simpleToDate(minDate)
        if (dateObj < minDateObj) {
          return 'empty'
        }
      }
      if (maxDate) {
        const maxDateObj = simpleToDate(maxDate)
        if (dateObj > maxDateObj) {
          return 'empty'
        }
      }
    }

    // Check if date is selected
    if (selectedDateSimple) {
      if (Array.isArray(selectedDateSimple)) {
        // Date range
        if (isRangeStart(date, selectedDateSimple as [DateObject, DateObject])) {
          return 'selected-left'
        }
        if (isRangeEnd(date, selectedDateSimple as [DateObject, DateObject])) {
          return 'selected-right'
        }
        if (isRangeMiddle(date, selectedDateSimple as [DateObject, DateObject])) {
          return 'middle'
        }
      } else {
        // Single date
        if (isSameDate(date, selectedDateSimple)) {
          return 'selected'
        }
      }
    }

    // Check if date is today
    if (isToday(date, todayDate)) {
      return 'today'
    }

    return 'default'
  }

  const hasIndicator = (date: DateObject): boolean => {
    if (!showIndicators) {
      return false
    }
    return indicatorDays.some((indicatorDate) => {
      return isSameDate(date, indicatorDate)
    })
  }

  const handleDatePress = (date: DateObject) => {
    if (onDateSelect) {
      onDateSelect(date)
    }
  }

  const containerStyles = getContainerStyles(theme)
  const weekRowStyles = getWeekRowStyles()
  const weekHeaderRowStyles = getWeekHeaderRowStyles()

  // Group dates into weeks (7 days per week)
  const weeks: Array<Array<typeof calendarDates[0]>> = []
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7))
  }

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
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={weekRowStyles}>
            {week.map(({ date, isCurrentMonth }, dayIndex) => {
              const dayState = getDayState(date, isCurrentMonth)
              const showIndicator = hasIndicator(date)

              return (
                <DatePickerDay
                  key={`${date.year}-${date.month}-${date.day}-${dayIndex}`}
                  day={date.day}
                  state={
                    dayState as import('../DatePickerDay/DatePickerDay.types').DatePickerDayState
                  }
                  disabled={!isCurrentMonth || dayState === 'empty'}
                  showIndicator={showIndicator}
                  onPress={() => handleDatePress(date)}
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
