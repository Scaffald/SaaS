/**
 * Where the transparency figures read their applications from (#1177).
 *
 * They used to run over the pipeline on screen — one page of 50, after the
 * employer's own job/stage/score filters — so narrowing the board to one job
 * changed a number the band calls the employer's record. The record has to be
 * the employer's whole pipeline: every application to their jobs, unfiltered,
 * over a fixed window, read page by page.
 *
 * This stays a client computation over the employer's own rows until the
 * server aggregate in #632 exists; nothing here is estimated or sampled
 * without saying so (`truncated` is surfaced, not swallowed).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** The prototype's "12-month pipeline". */
export const TRANSPARENCY_WINDOW_DAYS = 365

/** The API's page ceiling for GET /v1/employer/applications. */
export const TRANSPARENCY_PAGE_SIZE = 100

/**
 * A bound on requests, not on honesty: past it the result says `truncated`
 * and the band names how many applications the figures cover.
 */
export const TRANSPARENCY_MAX_PAGES = 10

/**
 * Start of the window as a UTC calendar date. Day granularity on purpose: it
 * is part of a query key, and a millisecond timestamp would refetch on every
 * render.
 */
export function transparencyWindowStart(
  now: number = Date.now(),
  days: number = TRANSPARENCY_WINDOW_DAYS
): string {
  return new Date(now - days * MS_PER_DAY).toISOString().slice(0, 10)
}

export interface Page<T> {
  data: T[]
  total: number
}

export interface AllPages<T> {
  rows: T[]
  /** What the server says matched, which may exceed `rows.length`. */
  total: number
  /** True when the page cap stopped the read before `total` was reached. */
  truncated: boolean
}

/** Read every page of an offset-paged list, up to `maxPages`. */
export async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<Page<T>>,
  pageSize: number = TRANSPARENCY_PAGE_SIZE,
  maxPages: number = TRANSPARENCY_MAX_PAGES
): Promise<AllPages<T>> {
  const rows: T[] = []
  let total = 0

  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(page * pageSize, pageSize)
    total = result.total
    rows.push(...result.data)
    // A short page is the end even if `total` disagrees — rows can be deleted
    // between requests, and looping on a stale total would never finish.
    if (result.data.length < pageSize || rows.length >= total) {
      return { rows, total, truncated: false }
    }
  }

  return { rows, total, truncated: rows.length < total }
}
