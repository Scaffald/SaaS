import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STAGES,
  applicationStage,
  daysInStage,
  FILTER_GROUPS,
  isDraft,
  statusesForFilter,
} from '../application-status'

describe('applicationStage', () => {
  it('names each status the way the worker is told it', () => {
    expect(applicationStage('pending').label).toBe('Applied')
    expect(applicationStage('reviewing').label).toBe('Under review')
    expect(applicationStage('rejected').label).toBe('Not selected')
  })

  it('marks the two stages that are waiting on the worker', () => {
    expect(applicationStage('offer').tone).toBe('attention')
    expect(applicationStage('inquired').tone).toBe('attention')
    // Waiting on the employer is not the worker's problem to act on.
    expect(applicationStage('reviewing').tone).toBe('active')
    expect(applicationStage('pending').tone).toBe('neutral')
  })

  it('falls back to the raw status rather than dropping an unknown one', () => {
    const stage = applicationStage('teleported')
    expect(stage.label).toBe('teleported')
    expect(stage.tone).toBe('neutral')
  })
})

describe('the stage list', () => {
  it('leads with what needs the worker', () => {
    expect(APPLICATION_STAGES[0].status).toBe('offer')
    expect(APPLICATION_STAGES[1].status).toBe('inquired')
  })

  it('covers every status the filters can select', () => {
    const known = new Set(APPLICATION_STAGES.map((stage) => stage.status))
    for (const { key } of FILTER_GROUPS) {
      for (const status of statusesForFilter(key) ?? []) {
        expect(known.has(status)).toBe(true)
      }
    }
  })

  it('partitions every status exactly once across the named filters', () => {
    const named = FILTER_GROUPS.filter((group) => group.key !== 'all').flatMap(
      (group) => statusesForFilter(group.key) ?? [],
    )
    expect(named.sort()).toEqual(APPLICATION_STAGES.map((stage) => stage.status).sort())
    expect(new Set(named).size).toBe(named.length)
  })

  it('has no filter for "all"', () => {
    expect(statusesForFilter('all')).toBeNull()
  })
})

describe('daysInStage', () => {
  const now = new Date('2026-09-23T12:00:00Z')

  it('counts whole days since the stage last changed', () => {
    expect(daysInStage('2026-09-20T12:00:00Z', now)).toBe(3)
  })

  it('rounds down rather than up, so "1d" never means four hours', () => {
    expect(daysInStage('2026-09-23T04:00:00Z', now)).toBe(0)
  })

  it('is null when the application has never moved', () => {
    // Not zero: an application that has never changed stage has no
    // days-in-stage figure, and "0d" would read as "moved today".
    expect(daysInStage(null, now)).toBeNull()
    expect(daysInStage(undefined, now)).toBeNull()
  })

  it('is null for an unparseable timestamp', () => {
    expect(daysInStage('the day before yesterday', now)).toBeNull()
  })

  it('is null for a future timestamp rather than a negative count', () => {
    expect(daysInStage('2026-09-30T12:00:00Z', now)).toBeNull()
  })
})

describe('isDraft', () => {
  it('is a pending application that was never submitted', () => {
    expect(isDraft({ status: 'pending', submitted_at: null })).toBe(true)
    expect(isDraft({ status: 'pending' })).toBe(true)
  })

  it('is not a submitted application', () => {
    expect(isDraft({ status: 'pending', submitted_at: '2026-09-25T00:00:00Z' })).toBe(false)
  })

  it('is not a withdrawn draft, which can no longer be continued', () => {
    expect(isDraft({ status: 'withdrawn', submitted_at: null })).toBe(false)
  })
})
