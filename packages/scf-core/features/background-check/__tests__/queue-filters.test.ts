import { describe, expect, it } from 'vitest'
import {
  clearQueueFilter,
  queueFilterChips,
  queueFilterCount,
  type QueueFilterState,
} from '../queue-filters'

const label = (s: string) => ({ under_review: 'Under review', pending: 'Pending' })[s] ?? s

const EMPTY: QueueFilterState = { status: 'all', search: '' }

describe('queueFilterCount', () => {
  it('counts nothing when the queue is unfiltered', () => {
    expect(queueFilterCount(EMPTY)).toBe(0)
  })

  it('does not count "all" as a status filter', () => {
    expect(queueFilterCount({ status: 'all', search: '' })).toBe(0)
  })

  it('counts a real status and a search', () => {
    expect(queueFilterCount({ status: 'under_review', search: 'wong' })).toBe(2)
  })

  it('ignores whitespace-only search', () => {
    expect(queueFilterCount({ status: 'all', search: '   ' })).toBe(0)
  })
})

describe('queueFilterChips', () => {
  it('is empty for an unfiltered queue', () => {
    expect(queueFilterChips(EMPTY, label)).toEqual([])
  })

  it('announces the default status filter the queue opens on', () => {
    // The whole point: the queue starts on under_review, and a processor
    // should not have to read a dropdown to discover the list is a slice.
    const chips = queueFilterChips({ status: 'under_review', search: '' }, label)
    expect(chips).toEqual([{ id: 'status', label: 'Status', value: 'Under review' }])
  })

  it('trims the search value it shows', () => {
    const chips = queueFilterChips({ status: 'all', search: '  wong  ' }, label)
    expect(chips).toEqual([{ id: 'search', label: 'Search', value: 'wong' }])
  })

  it('falls back to the raw status when there is no label for it', () => {
    const chips = queueFilterChips({ status: 'something_new', search: '' }, label)
    expect(chips[0].value).toBe('something_new')
  })
})

describe('clearQueueFilter', () => {
  it('clears status to "all", not back to the under_review default', () => {
    // Restoring the default would leave the queue filtered by the very thing
    // the user asked to remove, and the chip would reappear as if the tap
    // had failed.
    const cleared = clearQueueFilter({ status: 'under_review', search: 'wong' }, 'status')
    expect(cleared.status).toBe('all')
    expect(queueFilterChips(cleared, label).some((c) => c.id === 'status')).toBe(false)
  })

  it('leaves the other filter alone', () => {
    expect(clearQueueFilter({ status: 'under_review', search: 'wong' }, 'status')).toEqual({
      status: 'all',
      search: 'wong',
    })
    expect(clearQueueFilter({ status: 'under_review', search: 'wong' }, 'search')).toEqual({
      status: 'under_review',
      search: '',
    })
  })

  it('does not mutate the input', () => {
    const before: QueueFilterState = { status: 'under_review', search: 'wong' }
    clearQueueFilter(before, 'status')
    expect(before).toEqual({ status: 'under_review', search: 'wong' })
  })

  it('clearing every chip empties the queue filters', () => {
    let f: QueueFilterState = { status: 'under_review', search: 'wong' }
    for (const chip of queueFilterChips(f, label)) f = clearQueueFilter(f, chip.id)
    expect(queueFilterCount(f)).toBe(0)
    expect(queueFilterChips(f, label)).toEqual([])
  })
})
