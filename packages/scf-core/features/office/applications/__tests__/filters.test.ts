import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  clearFilter,
  EMPTY_FILTERS,
  filterChips,
  SCORE_BANDS,
  scoreLabel,
  statusLabel,
  STATUS_FILTER_OPTIONS,
  type ApplicationFilterState,
} from '../filters'
import type { ApplicationStatus } from '../types'

const JOBS = [
  { id: 'j1', title: 'Site Electrical Lead' },
  { id: 'j2', title: 'Night-shift Pipefitter' },
]

describe('STATUS_FILTER_OPTIONS — §12 #4', () => {
  it('covers every stage the board can render', () => {
    // The list was missing `inquired` and `withdrawn`. `inquired` is a full
    // column, so a whole stage of the pipeline could not be filtered to.
    const boardStatuses: ApplicationStatus[] = [
      'new',
      'screen',
      'inquired',
      'interview',
      'offer',
      'hired',
      'rejected',
      'withdrawn',
    ]
    const offered = STATUS_FILTER_OPTIONS.map((o) => o.value)
    for (const status of boardStatuses) {
      expect(offered).toContain(status)
    }
  })

  it('keeps an explicit "all" escape at the top', () => {
    expect(STATUS_FILTER_OPTIONS[0]).toEqual({ value: 'all', label: 'All stages' })
  })

  it('offers no duplicate values', () => {
    const values = STATUS_FILTER_OPTIONS.map((o) => o.value)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('SCORE_BANDS — §12 #5', () => {
  it('starts at an unfiltered band so the control can be turned off', () => {
    expect(SCORE_BANDS[0].value).toBe(0)
  })

  it('ascends', () => {
    const values = SCORE_BANDS.map((b) => b.value)
    expect([...values].sort((a, b) => a - b)).toEqual(values)
  })
})

describe('activeFilterCount', () => {
  it('counts nothing when nothing is set', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
  })

  it('does not count a zero minimum score as a filter', () => {
    // 0 is "any score" — it narrows nothing, so it must not light up the badge.
    expect(activeFilterCount({ ...EMPTY_FILTERS, minScore: 0 })).toBe(0)
  })

  it('counts each dimension that is narrowing', () => {
    expect(activeFilterCount({ jobId: 'j1', status: 'screen', minScore: 80 })).toBe(3)
    expect(activeFilterCount({ ...EMPTY_FILTERS, status: 'screen' })).toBe(1)
  })
})

describe('filterChips', () => {
  it('emits nothing when nothing is applied', () => {
    expect(filterChips(EMPTY_FILTERS, JOBS)).toEqual([])
  })

  it('names the job by title, not by id', () => {
    const chips = filterChips({ ...EMPTY_FILTERS, jobId: 'j1' }, JOBS)
    expect(chips).toHaveLength(1)
    expect(chips[0].value).toBe('Site Electrical Lead')
  })

  it('still shows a chip for a job that has dropped out of the options', () => {
    // Only OPEN jobs are offered, so a job closed after being selected would
    // otherwise filter the pipeline invisibly with no way to clear it.
    const chips = filterChips({ ...EMPTY_FILTERS, jobId: 'gone' }, JOBS)
    expect(chips).toHaveLength(1)
    expect(chips[0].value).toBe('Unknown job')
  })

  it('labels the stage in the board vocabulary', () => {
    const chips = filterChips({ ...EMPTY_FILTERS, status: 'inquired' }, JOBS)
    expect(chips[0]).toEqual({ id: 'status', label: 'Stage', value: 'Inquired' })
  })

  it('labels a score band, not a bare number', () => {
    const chips = filterChips({ ...EMPTY_FILTERS, minScore: 80 }, JOBS)
    expect(chips[0].value).toBe('80 and up')
  })

  it('has no chip for an unfiltered score', () => {
    expect(filterChips({ ...EMPTY_FILTERS, minScore: 0 }, JOBS)).toEqual([])
  })
})

describe('clearFilter', () => {
  const all: ApplicationFilterState = { jobId: 'j1', status: 'screen', minScore: 80 }

  it('clears only the chip that was removed', () => {
    expect(clearFilter(all, 'status')).toEqual({ jobId: 'j1', status: null, minScore: 80 })
    expect(clearFilter(all, 'job')).toEqual({ jobId: null, status: 'screen', minScore: 80 })
    expect(clearFilter(all, 'score')).toEqual({ jobId: 'j1', status: 'screen', minScore: 0 })
  })

  it('does not mutate the filters it was given', () => {
    const before = { ...all }
    clearFilter(all, 'job')
    expect(all).toEqual(before)
  })

  it('reaches EMPTY_FILTERS when every chip is cleared in turn', () => {
    let f = all
    for (const id of ['job', 'status', 'score'] as const) {
      f = clearFilter(f, id)
    }
    expect(f).toEqual(EMPTY_FILTERS)
    expect(activeFilterCount(f)).toBe(0)
  })
})

describe('clear-all', () => {
  // This assertion used to live in ApplicationsFilters.test.tsx, against a
  // "Clear Filters" button inside the filter body. #624 moved the filters into
  // a flyout and the clear-all onto the chip strip, so the button went away —
  // and the test went with it, still asserting a control that no longer exists
  // there. The behaviour it was protecting is real, so it moves here, to the
  // module the screen's onClearAll actually calls.

  it('resets every dimension at once', () => {
    expect(EMPTY_FILTERS).toEqual({ jobId: null, status: null, minScore: 0 })
  })

  it('leaves nothing for the chip strip to show', () => {
    expect(filterChips(EMPTY_FILTERS, JOBS)).toEqual([])
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0)
  })

  it('is offered only when something is actually narrowing', () => {
    // The screen gates onClearAll on activeFilterCount > 0, so a clear-all
    // must never be offered on an already-empty filter set.
    expect(activeFilterCount(EMPTY_FILTERS) > 0).toBe(false)
    expect(activeFilterCount({ jobId: 'j1', status: null, minScore: 0 }) > 0).toBe(true)
  })
})

describe('labels', () => {
  it('renders a stage label for every filterable status', () => {
    for (const option of STATUS_FILTER_OPTIONS) {
      if (option.value === 'all') continue
      expect(statusLabel(option.value as ApplicationStatus)).toBe(option.label)
    }
  })

  it('falls back rather than rendering an empty score label', () => {
    expect(scoreLabel(55)).toBe('55 and up')
  })
})
