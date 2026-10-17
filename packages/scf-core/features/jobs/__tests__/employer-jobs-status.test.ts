import { describe, expect, it } from 'vitest'
import {
  daysOpen,
  LISTING_FILTERS,
  listingAgeLabel,
  listingMetaLine,
  listingPayRange,
  listingStatus,
  statusesForListingFilter,
  statusWordInGroup,
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

describe('listingAgeLabel', () => {
  it('does not carry the status, so a closed posting never reads "open"', () => {
    // #1084: the Closed group showed "98d OPEN". The chip carries status.
    expect(listingAgeLabel('2026-07-07T00:00:00Z')).toBe('posted')
  })

  it('says a never-posted draft is in draft', () => {
    expect(listingAgeLabel(null)).toBe('in draft')
    expect(listingAgeLabel(undefined)).toBe('in draft')
  })
})

describe('listingPayRange (#1199)', () => {
  it('formats an hourly range in whole dollars', () => {
    expect(listingPayRange(4_000, 5_800, 'hourly')).toBe('$40 – $58/hr')
  })

  it('formats a salary', () => {
    expect(listingPayRange(6_500_000, 8_000_000, 'salary')).toBe('$65,000 – $80,000/yr')
  })

  it('shows one figure when only one end, or both the same, is set', () => {
    expect(listingPayRange(null, 5_000, 'hourly')).toBe('$50/hr')
    expect(listingPayRange(5_000, 5_000, 'hourly')).toBe('$50/hr')
  })

  it('returns null when the posting states no pay', () => {
    expect(listingPayRange(null, null, 'hourly')).toBeNull()
  })
})

describe('listingMetaLine (#1199)', () => {
  it('joins city, type and pay', () => {
    expect(
      listingMetaLine({
        location: 'Portland, OR',
        employment_type: 'full_time',
        pay_range_min_cents: 4_000,
        pay_range_max_cents: 5_800,
        pay_range_type: 'hourly',
      })
    ).toBe('Portland, OR · Full-time · $40 – $58/hr')
  })

  it('drops the segments a posting does not have', () => {
    expect(listingMetaLine({ location: 'Austin, TX' })).toBe('Austin, TX')
    expect(listingMetaLine({})).toBe('')
  })
})

describe('statusWordInGroup (#1199)', () => {
  it('drops the word its group title already says', () => {
    expect(statusWordInGroup('open', 'Live')).toBeNull()
    expect(statusWordInGroup('closed', 'Closed')).toBeNull()
  })

  it('keeps it where the group holds more than one status', () => {
    expect(statusWordInGroup('draft', 'Not live')).toBe('Draft')
    expect(statusWordInGroup('paused', 'Not live')).toBe('Paused')
    expect(statusWordInGroup('archived', 'Closed')).toBe('Archived')
  })
})
