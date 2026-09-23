import { describe, expect, it } from 'vitest'
import { buildCheckTimeline, timelineSummary } from '../check-timeline'
import { BACKGROUND_CHECK_STATUSES } from '../status.utils'

describe('buildCheckTimeline', () => {
  it('gives every status the API can return a sensible timeline', () => {
    // The acceptance criterion for #830: no status falls through to an empty
    // or nonsensical timeline.
    for (const status of BACKGROUND_CHECK_STATUSES) {
      const steps = buildCheckTimeline(status)
      expect(steps).toHaveLength(4)
      expect(steps.map((step) => step.id)).toEqual([
        'requested',
        'consent',
        'in_progress',
        'complete',
      ])
      // Exactly one step is the one happening now, and nothing before it is
      // still upcoming.
      expect(steps.filter((step) => step.state === 'current').length).toBeLessThanOrEqual(1)
      const firstUpcoming = steps.findIndex((step) => step.state === 'upcoming')
      if (firstUpcoming !== -1) {
        expect(steps.slice(firstUpcoming).every((step) => step.state === 'upcoming')).toBe(true)
      }
    }
  })

  it('puts a brand new request at the first step', () => {
    const steps = buildCheckTimeline('pending')
    expect(steps[0].state).toBe('current')
    expect(steps[3].state).toBe('upcoming')
  })

  it('puts the wait where the wait actually is', () => {
    for (const status of ['submitted', 'in_progress', 'under_review', 'partially_completed'] as const) {
      const steps = buildCheckTimeline(status)
      expect(steps[2].state).toBe('current')
      expect(steps[1].state).toBe('done')
    }
  })

  it('walks a dispute back to the provider rather than leaving it complete', () => {
    // A dispute is raised against a finished check, but the check is working
    // again until it resolves.
    const steps = buildCheckTimeline('disputed')
    expect(steps[2].state).toBe('current')
    expect(steps[3].state).toBe('upcoming')
  })

  it('completes the sequence for a clear result', () => {
    const steps = buildCheckTimeline('completed_clear')
    expect(steps.every((step) => step.state === 'done')).toBe(true)
  })

  it('does not show a stopped check as a completed one', () => {
    // "Complete" against a cancelled or refunded check would read as a
    // result the worker never got.
    for (const status of ['failed', 'cancelled', 'refunded', 'expired'] as const) {
      const steps = buildCheckTimeline(status)
      expect(steps[3].state).toBe('current')
      expect(steps[3].state).not.toBe('done')
    }
  })
})

describe('timelineSummary', () => {
  it('carries the status vocabulary rather than inventing a second one', () => {
    expect(timelineSummary('completed_clear').label).toBe('Completed – Clear')
    expect(timelineSummary('under_review').detail).toContain('reviewing')
  })

  it('marks the statuses that want the worker to act', () => {
    expect(timelineSummary('completed_not_clear').tone).toBe('attention')
    expect(timelineSummary('disputed').tone).toBe('attention')
    expect(timelineSummary('cancelled').tone).toBe('neutral')
  })

  it('answers for every status', () => {
    for (const status of BACKGROUND_CHECK_STATUSES) {
      expect(timelineSummary(status).label.length).toBeGreaterThan(0)
    }
  })
})
