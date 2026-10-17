import { describe, expect, it } from 'vitest'
import { toOwnActivityMetrics } from '../own-activity-metrics'

describe('toOwnActivityMetrics (#1249)', () => {
  it('names each count for the action the user took', () => {
    expect(
      toOwnActivityMetrics({
        profile_views: 4,
        job_views: 7,
        applications_started: 2,
        applications_completed: 1,
        searches: 12,
        total_events: 26,
      })
    ).toEqual({
      searchesRun: 12,
      profilesViewed: 4,
      jobsViewed: 7,
      applicationsStarted: 2,
      applicationsSubmitted: 1,
      totalOwnEvents: 26,
    })
  })

  it('exposes no field named like an exposure figure', () => {
    const keys = Object.keys(
      toOwnActivityMetrics({
        profile_views: 0,
        job_views: 0,
        applications_started: 0,
        applications_completed: 0,
        searches: 0,
        total_events: 0,
      })
    )
    for (const key of keys) {
      expect(key).not.toMatch(/^(searches|profile_?views|appearances|impressions)$/i)
    }
  })
})
