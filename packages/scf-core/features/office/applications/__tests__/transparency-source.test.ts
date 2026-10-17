import { describe, expect, it } from 'vitest'
import { fetchAllPages, transparencyWindowStart } from '../transparency-source'

/** An in-memory offset-paged list, shaped like the employer applications API. */
function pagedList(count: number) {
  const items = Array.from({ length: count }, (_, i) => i)
  const calls: Array<[number, number]> = []
  const fetchPage = async (offset: number, limit: number) => {
    calls.push([offset, limit])
    return { data: items.slice(offset, offset + limit), total: items.length }
  }
  return { fetchPage, calls }
}

describe('fetchAllPages', () => {
  it('reads every page until the total is reached', async () => {
    const { fetchPage, calls } = pagedList(250)
    const result = await fetchAllPages(fetchPage, 100, 10)
    expect(result.rows).toHaveLength(250)
    expect(result.truncated).toBe(false)
    expect(calls).toEqual([
      [0, 100],
      [100, 100],
      [200, 100],
    ])
  })

  it('stops after one request for an exact single page', async () => {
    const { fetchPage, calls } = pagedList(100)
    const result = await fetchAllPages(fetchPage, 100, 10)
    expect(result.rows).toHaveLength(100)
    expect(calls).toHaveLength(1)
  })

  it('handles an empty pipeline', async () => {
    const { fetchPage } = pagedList(0)
    expect(await fetchAllPages(fetchPage, 100, 10)).toEqual({ rows: [], total: 0, truncated: false })
  })

  it('says so when the page cap cuts the read short', async () => {
    const { fetchPage, calls } = pagedList(450)
    const result = await fetchAllPages(fetchPage, 100, 2)
    expect(result.rows).toHaveLength(200)
    expect(result.total).toBe(450)
    expect(result.truncated).toBe(true)
    expect(calls).toHaveLength(2)
  })

  it('ends on a short page even when the total is stale', async () => {
    const fetchPage = async (offset: number) => ({
      data: offset === 0 ? [1, 2, 3] : [],
      total: 10,
    })
    const result = await fetchAllPages(fetchPage, 5, 10)
    expect(result.rows).toEqual([1, 2, 3])
    expect(result.truncated).toBe(false)
  })
})

describe('transparencyWindowStart', () => {
  it('is a UTC calendar date a year back', () => {
    expect(transparencyWindowStart(Date.UTC(2026, 9, 17, 23, 30))).toBe('2025-10-17')
  })

  it('is stable within a day, so the query key does not churn', () => {
    expect(transparencyWindowStart(Date.UTC(2026, 9, 17, 0, 1))).toBe(
      transparencyWindowStart(Date.UTC(2026, 9, 17, 23, 59)),
    )
  })
})
