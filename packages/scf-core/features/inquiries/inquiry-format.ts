/**
 * How an inquiry's terms are written down (#837).
 *
 * Each of these existed two or three times over — once in the employer's view,
 * once in the candidate's, sometimes again in the form — which is how the two
 * sides came to disagree about what the same term said. One copy, shared by
 * whoever is reading.
 */

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export const NOT_SPECIFIED = 'Not specified'

/**
 * A calendar date, rendered as the day it actually is.
 *
 * `new Date('2026-11-03')` is UTC midnight, and `toLocaleDateString` without a
 * timezone renders that in the reader's own zone — so an employment start date
 * stored as the 3rd showed as "November 2, 2026" to everyone west of UTC. An
 * employment date is a date, not an instant; pin the zone.
 */
export function formatTermDate(value: string | null | undefined): string {
  if (!value) return NOT_SPECIFIED
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return NOT_SPECIFIED
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * An instant — when a section was accepted, when a reply landed. Unlike a
 * calendar date this one *should* follow the reader, so it has no `timeZone`.
 */
export function formatTermTimestamp(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Postgres hands back `time` as "07:00:00"; nobody writes the seconds. */
export function formatTermTime(value: string | null | undefined): string {
  if (!value) return ''
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return value.trim()
  return `${match[1]?.padStart(2, '0')}:${match[2]}`
}

export function formatWorkingHours(
  start: string | null | undefined,
  end: string | null | undefined,
  timezone?: string | null
): string {
  const from = formatTermTime(start)
  const to = formatTermTime(end)
  if (!from || !to) return NOT_SPECIFIED
  return `${from} – ${to}${timezone ? ` (${timezone})` : ''}`
}

export function formatWorkdays(days: unknown): string {
  if (!Array.isArray(days) || days.length === 0) return NOT_SPECIFIED
  return days.map((day) => DAY_LABELS[String(day)] ?? String(day)).join(', ')
}

export function formatRateRange(
  minCents: unknown,
  maxCents: unknown,
  rateType?: string | null
): string {
  const min = Number(minCents)
  if (!min || Number.isNaN(min)) return NOT_SPECIFIED
  const max = Number(maxCents)
  const suffix = rateType === 'hourly' ? ' /hr' : rateType ? ' /yr' : ''
  const low = (min / 100).toFixed(2)
  if (max && !Number.isNaN(max) && max !== min) {
    return `$${low} – $${(max / 100).toFixed(2)}${suffix}`
  }
  return `$${low}${suffix}`
}

export function formatEmploymentType(value: string | null | undefined): string | null {
  if (value === 'permanent') return 'Permanent'
  if (value === 'temporary') return 'Temporary'
  return null
}

export function formatWorkSchedule(value: string | null | undefined): string | null {
  if (value === 'full_time') return 'Full time'
  if (value === 'part_time') return 'Part time'
  if (value === 'day_week') return 'Day-Week'
  return null
}
