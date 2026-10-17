import { describe, expect, it } from 'vitest'
import {
  boundedCount,
  countPendingIdVerifications,
  formatBoundedCount,
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
