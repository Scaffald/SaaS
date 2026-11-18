import { format, parseISO } from 'date-fns'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Format a date string to a readable format
 * @param dateStr - ISO date string
 * @returns Formatted date string (MMM yyyy) or 'N/A' if invalid
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    // `new Date('YYYY-MM-DD')` is UTC midnight, which format() reads in local
    // time: the previous month anywhere west of UTC (#1358). parseISO reads a
    // bare date as local midnight; a full timestamp means the same instant
    // either way.
    return format(DATE_ONLY.test(dateStr) ? parseISO(dateStr) : new Date(dateStr), 'MMM yyyy')
  } catch {
    return dateStr
  }
}

/**
 * Format a date range with support for current/ongoing entries
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param isCurrent - Whether the entry is currently ongoing
 * @param expectedGraduationDate - Expected graduation date for current education
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean,
  expectedGraduationDate?: string | null | undefined
): string {
  const start = formatDate(startDate)
  if (isCurrent) {
    const expected = expectedGraduationDate ? formatDate(expectedGraduationDate) : null
    return expected ? `${start} - Present (Expected: ${expected})` : `${start} - Present`
  }
  const end = formatDate(endDate)
  return `${start} - ${end}`
}
