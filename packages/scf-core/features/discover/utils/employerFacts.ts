/**
 * The facts a worker reads an employer by, as plain strings (#1185, #1186).
 *
 * The directory printed `address.street` before anything else, so a row said
 * "3390 N State Road, Suite C" and never which town that was in. The profile
 * printed "On Scaffald since 10/5/2026" from toLocaleDateString(). Both read
 * the same record, so the wording lives here once.
 *
 * Only facts the record carries are returned. The prototype also shows a
 * field-staff size and a "verified business" tag; core.organizations has no
 * column for either, so neither is drawn rather than guessed.
 */

export interface EmployerAddress {
  street?: string | null
  city?: string | null
  state?: string | null
  postal?: string | null
  zipCode?: string | null
  country?: string | null
}

/** "Davison, MI" — the city and state, or whichever of them is known. */
export function formatEmployerPlace(address: EmployerAddress | null | undefined): string | null {
  if (!address || typeof address !== 'object') return null
  const city = address.city?.trim()
  const state = address.state?.trim()
  const place = [city, state].filter(Boolean).join(', ')
  return place || null
}

/** The calendar year an ISO timestamp falls in, or null when it doesn't parse. */
export function sinceYear(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return date.getUTCFullYear()
}

/** "3 open roles", "1 open role", "No open roles". */
export function formatOpenRoles(count: number | null | undefined): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null
  if (count <= 0) return 'No open roles'
  return `${count} open ${count === 1 ? 'role' : 'roles'}`
}

interface EmployerFactsInput {
  industryName?: string | null
  address?: EmployerAddress | null
  createdAt?: string | null
}

/**
 * The directory row's second line: industry · City, ST.
 * Empty facts drop out rather than leaving a stray separator.
 */
export function employerRowFacts({ industryName, address }: EmployerFactsInput): string {
  return [industryName?.trim(), formatEmployerPlace(address)].filter(Boolean).join(' · ')
}

/**
 * The profile header's descriptor: industry · City, ST · on Scaffald since
 * 2026. Every organization has a created_at, so the line is never empty even
 * when industry and address are — the old kicker vanished in exactly that case.
 */
export function employerDescriptor({
  industryName,
  address,
  createdAt,
}: EmployerFactsInput): string {
  const year = sinceYear(createdAt)
  return [
    industryName?.trim(),
    formatEmployerPlace(address),
    year ? `on Scaffald since ${year}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}
