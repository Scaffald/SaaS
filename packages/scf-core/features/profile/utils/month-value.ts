/**
 * Month values as plain strings (#1358).
 *
 * Profile dates are month-precision and stored as DATE `YYYY-MM-01`. They used
 * to go through a `Date`: the picker built local midnight, callers stored
 * `toISOString().split('T')[0]` (the *UTC* day — the last day of the previous
 * month anywhere east of UTC), and reading back, `new Date('YYYY-MM-01')` is
 * UTC midnight while `getMonth()` reads local time (the previous month anywhere
 * west of UTC). Each save drifted the date further.
 *
 * Nothing here constructs a `Date`, so the time zone cannot enter into it.
 */

const STORED_MONTH = /^(\d{4})-(\d{2})/
const TYPED_MONTH = /^\s*(\d{4})-(\d{1,2})(?:-\d{1,2})?\s*$/

/**
 * A stored value (`YYYY-MM-DD`, or anything starting `YYYY-MM`) as the
 * picker's `YYYY-MM` text. Empty for anything else.
 */
export function monthInputFromValue(value: string | null | undefined): string {
  if (!value) return ''
  const match = STORED_MONTH.exec(value)
  return match ? `${match[1]}-${match[2]}` : ''
}

/**
 * Typed `YYYY-MM` text as the stored first-of-month `YYYY-MM-01`, or null when
 * it is not (yet) a whole, valid month.
 */
export function monthValueFromInput(text: string | null | undefined): string | null {
  if (!text) return null
  const match = TYPED_MONTH.exec(text)
  if (!match) return null
  const month = Number.parseInt(match[2], 10)
  if (month < 1 || month > 12) return null
  return `${match[1]}-${String(month).padStart(2, '0')}-01`
}
