/**
 * DatePickerBase utility functions
 */

/**
 * Simple DateObject type alias for clarity
 * (renamed from Date to avoid collision with native JavaScript Date)
 */
export type DateObject = {
  year: number
  month: number // 0-11
  day: number // 1-31
}

/**
 * Convert JavaScript Date to simple DateObject
 */
export function dateToSimple(date: globalThis.Date): DateObject {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }
}

/**
 * Convert simple DateObject to JavaScript Date
 */
export function simpleToDate(date: DateObject): globalThis.Date {
  return new globalThis.Date(date.year, date.month, date.day)
}

/**
 * Check if two dates are equal (ignoring time)
 */
export function isSameDate(date1: DateObject, date2: DateObject): boolean {
  return (
    date1.year === date2.year &&
    date1.month === date2.month &&
    date1.day === date2.day
  )
}

/**
 * Check if a date is today
 */
export function isToday(date: DateObject, today?: DateObject): boolean {
  if (!today) {
    const now = new globalThis.Date()
    today = dateToSimple(now)
  }
  return isSameDate(date, today)
}

/**
 * Check if a date is in a range
 */
export function isInRange(
  date: DateObject,
  startDate: DateObject,
  endDate: DateObject
): boolean {
  const dateTime = simpleToDate(date).getTime()
  const startTime = simpleToDate(startDate).getTime()
  const endTime = simpleToDate(endDate).getTime()
  return dateTime >= startTime && dateTime <= endTime
}

/**
 * Check if a date is the start of a range
 */
export function isRangeStart(date: DateObject, range: [DateObject, DateObject]): boolean {
  return isSameDate(date, range[0])
}

/**
 * Check if a date is the end of a range
 */
export function isRangeEnd(date: DateObject, range: [DateObject, DateObject]): boolean {
  return isSameDate(date, range[1])
}

/**
 * Check if a date is in the middle of a range
 */
export function isRangeMiddle(date: DateObject, range: [DateObject, DateObject]): boolean {
  return isInRange(date, range[0], range[1]) && !isRangeStart(date, range) && !isRangeEnd(date, range)
}

/**
 * Get number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new globalThis.Date(year, month + 1, 0).getDate()
}

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  const firstDay = new globalThis.Date(year, month, 1).getDay()
  // Convert to Monday = 0 format (Figma uses Mo, Tu, We, etc.)
  return firstDay === 0 ? 6 : firstDay - 1
}

/**
 * Generate calendar grid dates for a month
 * Returns array of 42 dates (6 weeks × 7 days) including previous/next month overflow
 */
export function generateCalendarDates(
  year: number,
  month: number
): Array<{ date: DateObject; isCurrentMonth: boolean }> {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const dates: Array<{ date: DateObject; isCurrentMonth: boolean }> = []

  // Previous month overflow
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

  for (let i = firstDay - 1; i >= 0; i--) {
    dates.push({
      date: {
        year: prevYear,
        month: prevMonth,
        day: daysInPrevMonth - i,
      },
      isCurrentMonth: false,
    })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push({
      date: {
        year,
        month,
        day,
      },
      isCurrentMonth: true,
    })
  }

  // Next month overflow (fill to 42 cells)
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const remainingCells = 42 - dates.length

  for (let day = 1; day <= remainingCells; day++) {
    dates.push({
      date: {
        year: nextYear,
        month: nextMonth,
        day,
      },
      isCurrentMonth: false,
    })
  }

  return dates
}

/**
 * Week day labels (Monday-first)
 */
export const WEEK_DAY_LABELS = ['Mo', 'Tu', 'We', 'Thu', 'Fr', 'Sa', 'Su'] as const
