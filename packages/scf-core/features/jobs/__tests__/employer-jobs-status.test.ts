import { describe, expect, it } from 'vitest'
import {
  daysOpen,
  LISTING_FILTERS,
  listingStatus,
  statusesForListingFilter,
} from '../employer-jobs-status'

describe('listingStatus', () => {
  it('says what a status means for the posting', () => {
    expect(listingStatus('draft').label).toBe('Draft')
    expect(listingStatus('closed').label).toBe('Closed')
  })

  it('treats open and published as the same thing', () => {
    // The API has used both spellings since the public listing was built; an
    // employer should not have to know which one their row carries.
    expect(listingStatus('open').label).toBe('Live')
    expect(listingStatus('published').label).toBe('Live')
    expect(listingStatus('open').tone).toBe(listingStatus('published').tone)
  })

  it('marks a paused posting as wanting attention, and a closed one as not', () => {
    expect(listingStatus('paused').tone).toBe('attention')
    expect(listingStatus('closed').tone).toBe('neutral')
  })

  it('falls back to a readable label for an unknown status', () => {
    expect(listingStatus('under_review').label).toBe('Under Review')
    expect(listingStatus('under_review').tone).toBe('neutral')
  })
})

describe('the status filters', () => {
  it('partitions the statuses the tabs offer, without overlap', () => {
    const named = LISTING_FILTERS.filter((f) => f.key !== 'all').flatMap(
      (f) => statusesForListingFilter(f.key) ?? [],
    )
    expect(new Set(named).size).toBe(named.length)
    for (const status of ['open', 'published', 'draft', 'paused', 'closed', 'archived']) {
      expect(named).toContain(status)
    }
  })

  it('has no filter for "all"', () => {
    expect(statusesForListingFilter('all')).toBeNull()
  })

  it('puts both spellings of live in the same tab', () => {
    const live = statusesForListingFilter('live') ?? []
    expect(live).toContain('open')
    expect(live).toContain('published')
  })
})

describe('daysOpen', () => {
  const now = new Date('2026-09-23T12:00:00Z')

  it('counts from the posted date when there is one', () => {
    expect(daysOpen('2026-09-13T12:00:00Z', '2026-09-01T12:00:00Z', now)).toBe(10)
  })

  it('falls back to created_at for a posting that was never posted', () => {
    // A draft's age is how long it has been sitting unfinished, which is the
    // more useful number for a draft anyway.
    expect(daysOpen(null, '2026-09-20T12:00:00Z', now)).toBe(3)
  })

  it('rounds down, so "1d" never means four hours', () => {
    expect(daysOpen('2026-09-23T04:00:00Z', null, now)).toBe(0)
  })

  it('is null with no dates at all', () => {
    expect(daysOpen(null, null, now)).toBeNull()
    expect(daysOpen(undefined, undefined, now)).toBeNull()
  })

  it('is null for a future date rather than a negative count', () => {
    expect(daysOpen('2026-10-01T12:00:00Z', null, now)).toBeNull()
  })

  it('is null for an unparseable date', () => {
    expect(daysOpen('last Tuesday', null, now)).toBeNull()
  })
})
