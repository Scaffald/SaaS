import { describe, expect, it } from 'vitest'
import { computeTransparencyStats, formatDays, formatPct, median } from '../transparency-stats'
import type { ApplicationStatus } from '../types'

const NOW = new Date('2026-08-20T12:00:00Z').getTime()
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

const moved = (toStage: ApplicationStatus, at: number) => ({
  fromStage: null,
  toStage,
  changedBy: 'u',
  changedAt: daysAgo(at),
})

describe('responseRatePct', () => {
  it('is null when nothing is old enough to judge', () => {
    // An employer who opened yesterday has no rate. Reporting 0% would be a
    // lie about them, not a measurement.
    const stats = computeTransparencyStats([app({ appliedAt: daysAgo(1) })], NOW)
    expect(stats.responseRatePct).toBeNull()
    expect(stats.eligibleCount).toBe(0)
  })

  it('counts only applications past the first-response promise', () => {
    const stats = computeTransparencyStats(
      [
        app({ appliedAt: daysAgo(1) }), // too recent to count against them
        app({ appliedAt: daysAgo(10), stageHistory: [moved('screen', 9)] }),
      ],
      NOW,
    )
    expect(stats.eligibleCount).toBe(1)
    expect(stats.responseRatePct).toBe(100)
  })

  it('counts an untouched old application as no response', () => {
    const stats = computeTransparencyStats(
      [
        app({ appliedAt: daysAgo(20), stageHistory: [moved('screen', 19)] }),
        app({ appliedAt: daysAgo(20) }),
      ],
      NOW,
    )
    expect(stats.responseRatePct).toBe(50)
  })

  it('does not treat an explicit rejection as no response', () => {
    // Being turned down IS a response. Only silence counts against the rate.
    const stats = computeTransparencyStats(
      [app({ status: 'rejected', appliedAt: daysAgo(20), stageHistory: [moved('rejected', 18)] })],
      NOW,
    )
    expect(stats.responseRatePct).toBe(100)
  })
})

describe('medianFirstResponseDays', () => {
  it('is null when nothing has been responded to', () => {
    expect(computeTransparencyStats([app({ appliedAt: daysAgo(30) })], NOW)
      .medianFirstResponseDays).toBeNull()
  })

  it('measures from applying to the FIRST move, not the latest', () => {
    const stats = computeTransparencyStats(
      [
        app({
          status: 'interview',
          appliedAt: daysAgo(20),
          stageHistory: [moved('screen', 18), moved('interview', 2)],
        }),
      ],
      NOW,
    )
    expect(stats.medianFirstResponseDays).toBeCloseTo(2, 5)
  })

  it('takes the median, not the mean, so one slow reply cannot dominate', () => {
    const stats = computeTransparencyStats(
      [
        app({ appliedAt: daysAgo(10), stageHistory: [moved('screen', 9)] }), // 1d
        app({ appliedAt: daysAgo(10), stageHistory: [moved('screen', 8)] }), // 2d
        app({ appliedAt: daysAgo(100), stageHistory: [moved('screen', 1)] }), // 99d
      ],
      NOW,
    )
    expect(stats.medianFirstResponseDays).toBeCloseTo(2, 5)
  })

  it('ignores a transition recorded before the application existed', () => {
    const stats = computeTransparencyStats(
      [app({ appliedAt: daysAgo(5), stageHistory: [moved('screen', 40)] })],
      NOW,
    )
    expect(stats.medianFirstResponseDays).toBeNull()
  })
})

describe('ghostRatePct', () => {
  it('is null when nothing is open', () => {
    const stats = computeTransparencyStats(
      [app({ status: 'hired', appliedAt: daysAgo(30), stageHistory: [moved('hired', 2)] })],
      NOW,
    )
    expect(stats.ghostRatePct).toBeNull()
    expect(stats.openCount).toBe(0)
  })

  it('counts silence at ANY stage, not only unacknowledged arrivals', () => {
    // A candidate stuck in Interview for three weeks is being ghosted just as
    // much as one never acknowledged — and the response rate says nothing
    // about them, which is why this is not 1 minus that.
    const stats = computeTransparencyStats(
      [app({ status: 'interview', appliedAt: daysAgo(40), stageHistory: [moved('interview', 30)] })],
      NOW,
    )
    expect(stats.ghostRatePct).toBe(100)
    expect(stats.responseRatePct).toBe(100)
  })

  it('does not count a candidate inside their stage promise', () => {
    const stats = computeTransparencyStats(
      [app({ status: 'screen', appliedAt: daysAgo(10), stageHistory: [moved('screen', 1)] })],
      NOW,
    )
    expect(stats.ghostRatePct).toBe(0)
  })

  it('never counts terminal applications as ghosted', () => {
    for (const status of ['hired', 'rejected', 'withdrawn'] as ApplicationStatus[]) {
      const stats = computeTransparencyStats(
        [
          app({ status, appliedAt: daysAgo(400), stageHistory: [moved(status, 300)] }),
          app({ status: 'screen', appliedAt: daysAgo(10), stageHistory: [moved('screen', 1)] }),
        ],
        NOW,
      )
      expect(stats.openCount).toBe(1)
      expect(stats.ghostRatePct).toBe(0)
    }
  })
})

describe('formatting', () => {
  it('renders an em dash rather than a confident zero', () => {
    expect(formatPct(null)).toBe('—')
    expect(formatPct(0)).toBe('0%')
    expect(formatPct(84)).toBe('84%')
  })

  it('renders days to one decimal', () => {
    expect(formatDays(1.83)).toBe('1.8d')
    expect(formatDays(null)).toBeNull()
  })
})

describe('median', () => {
  it('averages the middle pair on an even count', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
  it('is null on an empty set', () => {
    expect(median([])).toBeNull()
  })
})
