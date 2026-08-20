import { describe, expect, it } from 'vitest'
import {
  daysInStage,
  formatStageAge,
  isStageOverdue,
  stageEnteredAt,
  stageOverdueReason,
} from '../stage-timing'
import type { ApplicationStatus } from '../types'

const NOW = new Date('2026-08-19T12:00:00Z').getTime()
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

type Timed = {
  status: ApplicationStatus
  appliedAt: string
  stageHistory: Array<{
    fromStage: ApplicationStatus | null
    toStage: ApplicationStatus
    changedBy: string
    changedAt: string
  }>
}

const app = (over: Partial<Timed> = {}): Timed => ({
  status: 'new',
  appliedAt: daysAgo(10),
  stageHistory: [],
  ...over,
})

describe('daysInStage', () => {
  it('measures from entry into the current stage, not from applying', () => {
    // The whole point: applied 30 days ago, moved to interview yesterday.
    const a = app({
      status: 'interview',
      appliedAt: daysAgo(30),
      stageHistory: [
        { fromStage: 'new', toStage: 'screen', changedBy: 'u', changedAt: daysAgo(20) },
        { fromStage: 'screen', toStage: 'interview', changedBy: 'u', changedAt: daysAgo(1) },
      ],
    })
    expect(daysInStage(a, NOW)).toBe(1)
  })

  it('falls back to appliedAt for a candidate who has never moved', () => {
    expect(daysInStage(app({ status: 'new', appliedAt: daysAgo(8) }), NOW)).toBe(8)
  })

  it('uses the most recent entry when a candidate is moved back into a stage', () => {
    const a = app({
      status: 'screen',
      appliedAt: daysAgo(30),
      stageHistory: [
        { fromStage: 'new', toStage: 'screen', changedBy: 'u', changedAt: daysAgo(20) },
        { fromStage: 'screen', toStage: 'interview', changedBy: 'u', changedAt: daysAgo(10) },
        { fromStage: 'interview', toStage: 'screen', changedBy: 'u', changedAt: daysAgo(2) },
      ],
    })
    expect(daysInStage(a, NOW)).toBe(2)
  })

  it('ignores transitions into other stages', () => {
    const a = app({
      status: 'offer',
      appliedAt: daysAgo(30),
      stageHistory: [
        { fromStage: 'new', toStage: 'screen', changedBy: 'u', changedAt: daysAgo(20) },
        { fromStage: 'screen', toStage: 'offer', changedBy: 'u', changedAt: daysAgo(4) },
        { fromStage: 'offer', toStage: 'hired', changedBy: 'u', changedAt: daysAgo(1) },
      ],
    })
    expect(daysInStage(a, NOW)).toBe(4)
  })

  it('never reports a negative age from a future timestamp', () => {
    // Local Supabase has been observed running behind the host clock, which
    // would otherwise render as "-2d in stage".
    const future = new Date(NOW + 2 * 86_400_000).toISOString()
    const a = app({
      status: 'screen',
      appliedAt: daysAgo(5),
      stageHistory: [{ fromStage: 'new', toStage: 'screen', changedBy: 'u', changedAt: future }],
    })
    expect(daysInStage(a, NOW)).toBeGreaterThanOrEqual(0)
  })

  it('returns null rather than 0 when the dates cannot be read', () => {
    expect(daysInStage(app({ appliedAt: 'not-a-date' }), NOW)).toBeNull()
  })

  it('handles a missing stageHistory array', () => {
    const a = { status: 'new' as ApplicationStatus, appliedAt: daysAgo(3) } as Timed
    expect(daysInStage(a, NOW)).toBe(3)
  })
})

describe('stageEnteredAt', () => {
  it('returns the transition time, not the application time', () => {
    const a = app({
      status: 'screen',
      appliedAt: daysAgo(9),
      stageHistory: [{ fromStage: 'new', toStage: 'screen', changedBy: 'u', changedAt: daysAgo(3) }],
    })
    expect(stageEnteredAt(a, NOW)).toBe(NOW - 3 * 86_400_000)
  })
})

describe('formatStageAge', () => {
  it('renders under a day as "<1d"', () => expect(formatStageAge(0)).toBe('<1d'))
  it('renders whole days with a suffix', () => expect(formatStageAge(8)).toBe('8d'))
  it('passes null through so callers can omit the figure', () =>
    expect(formatStageAge(null)).toBeNull())
})

describe('isStageOverdue', () => {
  it('flags a stage past its promise', () => {
    expect(isStageOverdue(app({ status: 'new', appliedAt: daysAgo(8) }), NOW)).toBe(true)
  })

  it('does not flag a stage inside its promise', () => {
    expect(isStageOverdue(app({ status: 'new', appliedAt: daysAgo(2) }), NOW)).toBe(false)
  })

  it('does not flag exactly at the promise', () => {
    // 3 days in `new` is the promise, not a breach of it.
    expect(isStageOverdue(app({ status: 'new', appliedAt: daysAgo(3) }), NOW)).toBe(false)
  })

  it('never flags terminal stages — nobody is waiting on a hired candidate', () => {
    for (const status of ['hired', 'rejected', 'withdrawn'] as ApplicationStatus[]) {
      expect(isStageOverdue(app({ status, appliedAt: daysAgo(400) }), NOW)).toBe(false)
    }
  })
})

describe('stageOverdueReason', () => {
  it('names what is late, not just that something is', () => {
    expect(stageOverdueReason(app({ status: 'screen', appliedAt: daysAgo(30) }), NOW)).toBe(
      'Overdue — screening decision',
    )
  })

  it('is null when nothing is overdue', () => {
    expect(stageOverdueReason(app({ status: 'new', appliedAt: daysAgo(1) }), NOW)).toBeNull()
  })
})
