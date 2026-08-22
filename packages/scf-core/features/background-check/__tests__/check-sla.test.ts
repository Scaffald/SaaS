import { describe, expect, it } from 'vitest'
import {
  computeQueueMetrics,
  daysInState,
  daysRemaining,
  isTerminal,
  slaLabel,
  slaState,
  type TimedCheck,
} from '../check-sla'

const NOW = new Date('2026-08-20T12:00:00Z').getTime()
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

const check = (over: Partial<TimedCheck> = {}): TimedCheck => ({
  status: 'submitted',
  created_at: daysAgo(10),
  updated_at: daysAgo(1),
  ...over,
})

describe('daysInState', () => {
  it('measures from the last change, not from when the case opened', () => {
    // A case that moved to under_review yesterday has been in review one day,
    // not the twenty since it was opened.
    expect(daysInState(check({ created_at: daysAgo(20), updated_at: daysAgo(1) }), NOW)).toBe(1)
  })

  it('falls back to created_at for a case that has never moved', () => {
    expect(daysInState(check({ created_at: daysAgo(4), updated_at: null }), NOW)).toBe(4)
  })

  it('never reports a negative age', () => {
    const future = new Date(NOW + 3 * 86_400_000).toISOString()
    expect(daysInState(check({ updated_at: future }), NOW)).toBe(0)
  })

  it('returns null rather than 0 on an unreadable timestamp', () => {
    expect(daysInState(check({ created_at: 'nope', updated_at: null }), NOW)).toBeNull()
  })
})

describe('slaState', () => {
  it('flags a case past its promise', () => {
    expect(slaState(check({ status: 'submitted', updated_at: daysAgo(5) }), NOW)).toBe('over')
  })

  it('calls the exact day due today, not over', () => {
    // 3-day promise, 3 days elapsed: the day is not yet lost.
    expect(slaState(check({ status: 'submitted', updated_at: daysAgo(3) }), NOW)).toBe('due-today')
  })

  it('leaves a case inside its promise alone', () => {
    expect(slaState(check({ status: 'submitted', updated_at: daysAgo(1) }), NOW)).toBe('on-time')
  })

  it('gives the applicant longer than the processor', () => {
    // `invited` waits on the applicant's documents; chasing at 3 days would be
    // nagging somebody who is simply gathering paperwork.
    expect(slaState(check({ status: 'invited', updated_at: daysAgo(5) }), NOW)).toBe('on-time')
    expect(slaState(check({ status: 'under_review', updated_at: daysAgo(5) }), NOW)).toBe('over')
  })

  it('never flags a terminal case however old', () => {
    for (const status of ['completed_clear', 'cancelled', 'expired', 'failed', 'refunded']) {
      expect(slaState(check({ status, updated_at: daysAgo(400) }), NOW)).toBe('none')
    }
  })

  it('has no promise for an unrecognised status rather than guessing one', () => {
    expect(slaState(check({ status: 'something_new' }), NOW)).toBe('none')
    expect(slaState(check({ status: null }), NOW)).toBe('none')
  })
})

describe('slaLabel', () => {
  it('says how far over', () => {
    expect(slaLabel(check({ status: 'submitted', updated_at: daysAgo(5) }), NOW)).toBe('2d over')
  })
  it('says due today', () => {
    expect(slaLabel(check({ status: 'submitted', updated_at: daysAgo(3) }), NOW)).toBe('due today')
  })
  it('says how long is left', () => {
    expect(slaLabel(check({ status: 'submitted', updated_at: daysAgo(1) }), NOW)).toBe('2d left')
  })
  it('is null when there is no promise to report', () => {
    expect(slaLabel(check({ status: 'completed_clear' }), NOW)).toBeNull()
  })
})

describe('computeQueueMetrics', () => {
  it('counts only open cases', () => {
    const m = computeQueueMetrics(
      [
        check({ status: 'submitted', updated_at: daysAgo(1) }),
        check({ status: 'completed_clear', updated_at: daysAgo(1) }),
        check({ status: 'cancelled', updated_at: daysAgo(1) }),
      ],
      NOW,
    )
    expect(m.openCount).toBe(1)
  })

  it('separates over-SLA from due-today', () => {
    const m = computeQueueMetrics(
      [
        check({ status: 'submitted', updated_at: daysAgo(9) }), // over
        check({ status: 'submitted', updated_at: daysAgo(3) }), // due today
        check({ status: 'submitted', updated_at: daysAgo(1) }), // on time
      ],
      NOW,
    )
    expect(m.overSlaCount).toBe(1)
    expect(m.dueTodayCount).toBe(1)
  })

  it('takes the median age, not the mean, so one stuck case cannot dominate', () => {
    const m = computeQueueMetrics(
      [
        check({ status: 'submitted', updated_at: daysAgo(1) }),
        check({ status: 'submitted', updated_at: daysAgo(2) }),
        check({ status: 'submitted', updated_at: daysAgo(300) }),
      ],
      NOW,
    )
    expect(m.medianDaysOpen).toBe(2)
  })

  it('reports null rather than 0 when nothing is open', () => {
    const m = computeQueueMetrics([check({ status: 'completed_clear' })], NOW)
    expect(m.openCount).toBe(0)
    expect(m.medianDaysOpen).toBeNull()
  })

  it('handles an empty queue', () => {
    const m = computeQueueMetrics([], NOW)
    expect(m).toEqual({
      openCount: 0,
      overSlaCount: 0,
      dueTodayCount: 0,
      medianDaysOpen: null,
    })
  })
})

describe('isTerminal', () => {
  it('recognises every finished state', () => {
    for (const s of [
      'completed_clear',
      'completed_consider',
      'completed_not_clear',
      'failed',
      'cancelled',
      'expired',
      'refunded',
    ]) {
      expect(isTerminal(s)).toBe(true)
    }
  })

  it('treats work-in-progress and unknowns as open', () => {
    for (const s of ['pending', 'invited', 'submitted', 'in_progress', 'disputed', null, 'weird']) {
      expect(isTerminal(s)).toBe(false)
    }
  })
})

describe('daysRemaining', () => {
  it('is null for terminal and unknown statuses', () => {
    expect(daysRemaining(check({ status: 'completed_clear' }), NOW)).toBeNull()
    expect(daysRemaining(check({ status: 'mystery' }), NOW)).toBeNull()
  })
})
