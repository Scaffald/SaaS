/**
 * DatePicker component
 * Main date picker component with variants and sizes
 * Maps to Figma "Date Picker" component
 *
 * @example
 * ```tsx
 * import { DatePicker } from '@scaffald/ui'
 *
 * // Basic date picker
 * <DatePicker
 *   value={selectedDate}
 *   onChange={(date) => setSelectedDate(date)}
 * />
 *
 * // Date range picker
 * <DatePicker
 *   type="date-range"
 *   value={[startDate, endDate]}
 *   onChange={(range) => setDateRange(range)}
 * />
 *
 * // Expanded with presets
 * <DatePicker
 *   size="expanded"
 *   presetOptions={[
 *     { label: 'Today', onSelect: () => setToday() },
 *     { label: 'Last 7 Days', onSelect: () => setLast7Days() },
 *   ]}
 * />
 * ```
 */

import { useState, } from 'react'
import { View, StyleSheet } from 'react-native'
import { DatePickerBase } from '../DatePickerBase'
import { Button } from '../Button'
import type { DatePickerProps } from './DatePicker.types'
import {
  getContainerStyles,
  getCalendarsContainerStyles,
  getPresetButtonsContainerStyles,
  getActionsContainerStyles,
} from './DatePicker.styles'
import { useThemeContext } from '../../theme'
import { dateToSimple, simpleToDate, type DateObject } from '../DatePickerBase/DatePickerBase.utils'

export function DatePicker({
  value,
  onChange,
  type = 'blank',
  size = 'small',
  minDate,
  maxDate,
  showIndicators = false,
  indicatorDays = [],
  onCancel,
  onApply,
  presetOptions,
  style,
  accessibilityLabel,
}: DatePickerProps) {
  const { theme } = useThemeContext()

  // Determine initial month/year from value or use current date
  const getInitialDate = (): DateObject => {
    if (value) {
      if (Array.isArray(value)) {
        return value[0]
      }
      return value
    }
    return dateToSimple(new Date())
  }

  const initialDate = getInitialDate()
  const [currentMonth, setCurrentMonth] = useState(initialDate.month)
  const [currentYear, setCurrentYear] = useState(initialDate.year)
  const [secondMonth, setSecondMonth] = useState(() => {
    const nextMonth = initialDate.month + 1
    return nextMonth > 11 ? 0 : nextMonth
  })
  const [secondYear, setSecondYear] = useState(() => {
    const nextMonth = initialDate.month + 1
    return nextMonth > 11 ? initialDate.year + 1 : initialDate.year
  })

  const handlePreviousMonth = (isSecond = false) => {
    if (isSecond) {
      const newMonth = secondMonth === 0 ? 11 : secondMonth - 1
      const newYear = secondMonth === 0 ? secondYear - 1 : secondYear
      setSecondMonth(newMonth)
      setSecondYear(newYear)
    } else {
      const newMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const newYear = currentMonth === 0 ? currentYear - 1 : currentYear
      setCurrentMonth(newMonth)
      setCurrentYear(newYear)
      // If expanded, update second month too
      if (size === 'expanded') {
        setSecondMonth(newMonth === 11 ? 0 : newMonth + 1)
        setSecondYear(newMonth === 11 ? newYear + 1 : newYear)
      }
    }
  }

  const handleNextMonth = (isSecond = false) => {
    if (isSecond) {
      const newMonth = secondMonth === 11 ? 0 : secondMonth + 1
      const newYear = secondMonth === 11 ? secondYear + 1 : secondYear
      setSecondMonth(newMonth)
      setSecondYear(newYear)
    } else {
      const newMonth = currentMonth === 11 ? 0 : currentMonth + 1
      const newYear = currentMonth === 11 ? currentYear + 1 : currentYear
      setCurrentMonth(newMonth)
      setCurrentYear(newYear)
      // If expanded, update second month too
      if (size === 'expanded') {
        setSecondMonth(newMonth === 11 ? 0 : newMonth + 1)
        setSecondYear(newMonth === 11 ? newYear + 1 : newYear)
      }
    }
  }

  const handleDateSelect = (date: DateObject) => {
    if (!onChange) {
      return
    }

    if (type === 'date-range') {
      // Handle date range selection
      if (!value || !Array.isArray(value)) {
        // Start new range
        onChange([date, date])
      } else {
        const [start, end] = value
        // Compare dates by converting to timestamps
        const startTime = simpleToDate(start).getTime()
        const endTime = simpleToDate(end).getTime()
        const dateTime = simpleToDate(date).getTime()

        if (startTime === endTime) {
          // Start new range
          onChange([date, date])
        } else if (dateTime < startTime) {
          // Select date before start - make it the new start
          onChange([date, end])
        } else {
          // Select date after start - make it the end
          onChange([start, date])
        }
      }
    } else {
      // Single date selection
      onChange(date)
    }
  }

  const containerStyles = getContainerStyles(size, theme)
  const calendarsContainerStyles = getCalendarsContainerStyles()
  const presetButtonsContainerStyles = getPresetButtonsContainerStyles()
  const actionsContainerStyles = getActionsContainerStyles()

  // Render preset buttons for expanded size
  const renderPresetButtons = () => {
    if (size !== 'expanded' || !presetOptions || presetOptions.length === 0) {
      return null
    }

    return (
      <View style={presetButtonsContainerStyles}>
        {presetOptions.map((preset, index) => (
          <Button
            key={preset.label || index}
            variant="outline"
            color="gray"
            onPress={preset.onSelect}
            style={styles.presetButton}
          >
            {preset.label}
          </Button>
        ))}
      </View>
    )
  }

  // Render action buttons
  const renderActions = () => {
    if (!onCancel && !onApply) {
      return null
    }

    return (
      <View style={actionsContainerStyles}>
        {onCancel && (
          <Button variant="outline" color="gray" onPress={onCancel}>
            Cancel
          </Button>
        )}
        {onApply && (
          <Button variant="filled" color="primary" onPress={onApply}>
            Apply
          </Button>
        )}
      </View>
    )
  }

  // Render calendars
  const renderCalendars = () => {
    if (size === 'expanded') {
      return (
        <View style={calendarsContainerStyles}>
          {/* First calendar */}
          <DatePickerBase
            month={currentMonth}
            year={currentYear}
            selectedDate={value}
            minDate={minDate}
            maxDate={maxDate}
            showIndicators={showIndicators}
            indicatorDays={indicatorDays}
            onDateSelect={handleDateSelect}
            onPreviousMonth={() => handlePreviousMonth(false)}
            onNextMonth={() => handleNextMonth(false)}
          />

          {/* Second calendar */}
          <DatePickerBase
            month={secondMonth}
            year={secondYear}
            selectedDate={value}
            minDate={minDate}
            maxDate={maxDate}
            showIndicators={showIndicators}
            indicatorDays={indicatorDays}
            onDateSelect={handleDateSelect}
            onPreviousMonth={() => handlePreviousMonth(true)}
            onNextMonth={() => handleNextMonth(true)}
          />
        </View>
      )
    }

    // Small size - single calendar
    return (
      <DatePickerBase
        month={currentMonth}
        year={currentYear}
        selectedDate={value}
        minDate={minDate}
        maxDate={maxDate}
        showIndicators={showIndicators}
        indicatorDays={indicatorDays}
        onDateSelect={handleDateSelect}
        onPreviousMonth={() => handlePreviousMonth(false)}
        onNextMonth={() => handleNextMonth(false)}
      />
    )
  }

  return (
    <View style={[containerStyles, style]}>
      {size === 'expanded' && renderPresetButtons()}
      {renderCalendars()}
      {renderActions()}
    </View>
  )
}

const styles = StyleSheet.create({
  presetButton: {
    width: '100%',
  },
})
