import { useMemo, useCallback } from 'react'
import {
  generateCalendarDates,
  dateToSimple,
  simpleToDate,
  isToday,
  isSameDate,
  isRangeStart,
  isRangeEnd,
  isRangeMiddle,
  type DateObject,
} from './DatePickerBase.utils'

export interface UseDatePickerBaseProps {
  month: number
  year: number
  selectedDate?: DateObject | [DateObject, DateObject] | null
  today?: DateObject
  minDate?: DateObject
  maxDate?: DateObject
  showIndicators?: boolean
  indicatorDays?: DateObject[]
  onDateSelect?: (date: DateObject) => void
}

export function useDatePickerBase({
  month,
  year,
  selectedDate,
  today,
  minDate,
  maxDate,
  showIndicators = false,
  indicatorDays = [],
  onDateSelect,
}: UseDatePickerBaseProps) {
  const todayDate = useMemo(() => today || dateToSimple(new globalThis.Date()), [today])
  
  const calendarDates = useMemo(() => generateCalendarDates(year, month), [year, month])

  const getDayState = useCallback((date: DateObject, isCurrentMonth: boolean): string => {
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
    if (selectedDate) {
      if (Array.isArray(selectedDate)) {
        // Date range
        if (isRangeStart(date, selectedDate)) {
          return 'selected-left'
        }
        if (isRangeEnd(date, selectedDate)) {
          return 'selected-right'
        }
        if (isRangeMiddle(date, selectedDate)) {
          return 'middle'
        }
      } else {
        // Single date
        if (isSameDate(date, selectedDate)) {
          return 'selected'
        }
      }
    }

    // Check if date is today
    if (isToday(date, todayDate)) {
      return 'today'
    }

    return 'default'
  }, [minDate, maxDate, selectedDate, todayDate])

  const hasIndicator = useCallback((date: DateObject): boolean => {
    if (!showIndicators) {
      return false
    }
    return indicatorDays.some((indicatorDate) => {
      return isSameDate(date, indicatorDate)
    })
  }, [showIndicators, indicatorDays])

  const handleDatePress = useCallback((date: DateObject) => {
    if (onDateSelect) {
      onDateSelect(date)
    }
  }, [onDateSelect])

  // Group dates into weeks (7 days per week)
  const weeks = useMemo(() => {
    const groupedWeeks: Array<Array<typeof calendarDates[0]>> = []
    for (let i = 0; i < calendarDates.length; i += 7) {
      groupedWeeks.push(calendarDates.slice(i, i + 7))
    }
    return groupedWeeks
  }, [calendarDates])

  return {
    weeks,
    getDayState,
    hasIndicator,
    handleDatePress,
  }
}
