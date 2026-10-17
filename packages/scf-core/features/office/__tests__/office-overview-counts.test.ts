import { describe, expect, it } from 'vitest'
import {
  boundedCount,
  countOpenReports,
  countPendingIdVerifications,
  formatBoundedCount,
  sumBoundedCounts,
} from '../office-overview-counts'

const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i }))

describe('boundedCount (#1170)', () => {
  it('is unknown until there is a list', () => {
    expect(boundedCount(undefined, 50)).toBeNull()
    expect(formatBoundedCount(null)).toBe('—')
  })

  it('reports the exact number when the list is not full', () => {
    expect(formatBoundedCount(boundedCount(rows(0), 50))).toBe('0')
    expect(formatBoundedCount(boundedCount(rows(50), 50))).toBe('50')
  })

  it('says "50+" when there are more rows than the cap, never a number that stops at 50', () => {
    const count = boundedCount(rows(51), 50)
    expect(count).toEqual({ value: 50, overflow: true })
    expect(formatBoundedCount(count)).toBe('50+')
  })
})

describe('countPendingIdVerifications (#1170)', () => {
  it('counts active rows Persona has not verified yet', () => {
    expect(
      countPendingIdVerifications([
        { badgeStatus: 'active', rawBadgeStatus: 'active', verifiedAt: null },
        { badgeStatus: 'active', rawBadgeStatus: 'active', verifiedAt: '2026-10-01T00:00:00Z' },
        { badgeStatus: 'revoked', rawBadgeStatus: 'revoked', verifiedAt: null },
        // Derived expired from a lapsed active badge: finished, not pending.
        { badgeStatus: 'expired', rawBadgeStatus: 'active', verifiedAt: null },
      ])
    ).toBe(1)
  })
})

describe('sumBoundedCounts (#1201)', () => {
  it('adds the parts', () => {
    expect(
      sumBoundedCounts([
        { value: 2, overflow: false },
        { value: 3, overflow: false },
      ])
    ).toEqual({ value: 5, overflow: false })
    expect(sumBoundedCounts([])).toEqual({ value: 0, overflow: false })
  })

  it('is unknown while any part is, rather than a smaller number', () => {
    expect(sumBoundedCounts([{ value: 2, overflow: false }, null])).toBeNull()
  })

  it('is a floor when any part was', () => {
    const sum = sumBoundedCounts([
      { value: 200, overflow: true },
      { value: 1, overflow: false },
    ])
    expect(formatBoundedCount(sum)).toBe('201+')
  })
})

describe('countOpenReports (#1201)', () => {
  const items = [
    { status: 'pending' },
    { status: 'under_review' },
    { status: 'confirmed' },
    { status: 'resolved' },
    { status: 'dismissed' },
  ]

  it('counts reports still waiting on a decision', () => {
    expect(countOpenReports({ items, totalCount: 5 })).toEqual({ value: 3, overflow: false })
  })

  it('is a floor when the page is not the whole list', () => {
    expect(formatBoundedCount(countOpenReports({ items, totalCount: 80 }))).toBe('3+')
  })

  it('is unknown before the list arrives', () => {
    expect(countOpenReports(undefined)).toBeNull()
  })
})
