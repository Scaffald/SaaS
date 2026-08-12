export interface ExperienceDurationEntry {
  start_date?: string | null
  end_date?: string | null
  is_current?: boolean
}

export interface ExperienceDuration {
  years: number
  months: number
}

/**
 * Total time spent working across every experience entry.
 *
 * Entries are summed independently, so concurrent roles count twice. That is
 * the behaviour this has always had and changing it is a product decision, not
 * a bug fix — extracted here unchanged so the arithmetic is at least testable.
 *
 * `now` is injectable so tests do not depend on the wall clock: a current role
 * has no end date, and its contribution grows every month in real life.
 */
export function calculateTotalExperience(
  entries: ReadonlyArray<ExperienceDurationEntry> | undefined | null,
  now: Date = new Date()
): ExperienceDuration {
  let totalMonths = 0

  for (const entry of entries ?? []) {
    if (!entry?.start_date || typeof entry.start_date !== 'string') continue

    const start = new Date(entry.start_date)
    if (Number.isNaN(start.getTime())) continue

    const usesNow =
      entry.is_current || !entry.end_date || typeof entry.end_date !== 'string'
    const end = usesNow ? now : new Date(entry.end_date as string)
    if (Number.isNaN(end.getTime())) continue

    // UTC getters, not local ones. These are date-only strings ("2018-06-01"),
    // which Date parses as UTC midnight; reading them back with getMonth() in a
    // negative-offset timezone lands on the previous day and therefore
    // sometimes the previous month. That made the total differ by a month
    // depending on where the user was sitting.
    const months =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (end.getUTCMonth() - start.getUTCMonth())
    totalMonths += Math.max(0, months)
  }

  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
}
