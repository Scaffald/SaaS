import { describe, expect, it } from 'vitest'
import { findResumableDraft, unwrapMyReviews } from '../review-drafts'

const review = (id: string, status: string | undefined, subject = 'user-2') => ({
  id,
  subject_id: subject,
  subject_type: 'user',
  metadata: status ? { status } : {},
})

describe('unwrapMyReviews (#1356)', () => {
  it("unwraps the api's { reviews } envelope", () => {
    expect(unwrapMyReviews({ reviews: [review('r1', 'draft')] })).toHaveLength(1)
  })

  it('accepts a bare array', () => {
    expect(unwrapMyReviews([review('r1', 'draft')])).toHaveLength(1)
  })

  it('treats anything else as no reviews', () => {
    expect(unwrapMyReviews(undefined)).toEqual([])
    expect(unwrapMyReviews(null)).toEqual([])
    expect(unwrapMyReviews({})).toEqual([])
    expect(unwrapMyReviews({ reviews: 'nope' })).toEqual([])
  })
})

describe('findResumableDraft (#1356)', () => {
  it("resumes the caller's draft for this person", () => {
    expect(findResumableDraft([review('r1', 'draft')], 'user-2')?.id).toBe('r1')
  })

  it('never resumes a submitted or released review', () => {
    const reviews = [review('r1', 'submitted'), review('r2', 'released'), review('r3', undefined)]
    expect(findResumableDraft(reviews, 'user-2')).toBeUndefined()
  })

  it('picks the draft past a submitted review for the same person', () => {
    const reviews = [review('r1', 'submitted'), review('r2', 'draft')]
    expect(findResumableDraft(reviews, 'user-2')?.id).toBe('r2')
  })

  it('ignores drafts about someone else', () => {
    expect(findResumableDraft([review('r1', 'draft', 'user-9')], 'user-2')).toBeUndefined()
  })
})
