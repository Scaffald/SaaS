/**
 * Cell formatting for the CMS lists under /office/cms.
 *
 * Pure, so vitest can reach it — the list components import RN and ui.
 */

const PAY_UNITS: Record<string, string> = {
  hourly: '/hr',
  salary: '/yr',
}

/**
 * One amount, without the currency sign: "52", "52.50", "100k", "1.2M".
 *
 * Four figures and up go compact. "$100000-$150000" was the old cell: no
 * separators, and wide enough to wrap the column at 1440 (#1204).
 */
function amount(dollars: number): string {
  if (Math.abs(dollars) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    })
      .format(dollars)
      .replace('K', 'k')
  }
  const whole = Number.isInteger(dollars)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(dollars)
}

/**
 * A job's pay as the prototype writes it: "$52–58/hr", "$100k–150k/yr".
 *
 * One currency sign, an en dash, the unit hard against the figure. A range
 * with one end missing says which end it has rather than dropping to "-",
 * which is what the old formatter did with half a range. Returns null when
 * there is nothing to show, so the caller picks its own empty mark.
 */
export function formatPayRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  type: string | null | undefined
): string | null {
  const min = typeof minCents === 'number' && minCents > 0 ? minCents / 100 : null
  const max = typeof maxCents === 'number' && maxCents > 0 ? maxCents / 100 : null
  const unit = PAY_UNITS[type ?? 'hourly'] ?? ''
  if (min !== null && max !== null) {
    if (min === max) return `$${amount(min)}${unit}`
    const [low, high] = min < max ? [min, max] : [max, min]
    return `$${amount(low)}–${amount(high)}${unit}`
  }
  if (min !== null) return `From $${amount(min)}${unit}`
  if (max !== null) return `Up to $${amount(max)}${unit}`
  return null
}

const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  temp: 'Temporary',
  intern: 'Internship',
}

/** "full_time" → "Full-time". Unknown values are de-snaked rather than hidden. */
export function employmentTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null
  if (EMPLOYMENT_TYPES[type]) return EMPLOYMENT_TYPES[type]
  const words = type.replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : null
}

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

/**
 * The shared StatusBadge variant for a listing tone, so a CMS row and the
 * employer's own listing read a status the same way: live is green, a pause
 * wants attention, everything else is quiet.
 */
export function badgeVariantForTone(tone: 'neutral' | 'active' | 'attention'): BadgeVariant {
  if (tone === 'active') return 'success'
  if (tone === 'attention') return 'warning'
  return 'default'
}

const PROJECT_STATUSES: Record<string, { label: string; variant: BadgeVariant }> = {
  planning: { label: 'Planning', variant: 'default' },
  active: { label: 'Active', variant: 'success' },
  on_hold: { label: 'On hold', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
}

/** A project's status for the shared StatusBadge. "on_hold" was printed raw. */
export function projectStatus(status: string | null | undefined): {
  label: string
  variant: BadgeVariant
} {
  if (!status) return { label: 'Unknown', variant: 'default' }
  return (
    PROJECT_STATUSES[status] ?? {
      label: status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      variant: 'default',
    }
  )
}

/** A short date for a table cell, or null for a missing or unparseable one. */
export function formatCellDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
