import { describe, expect, it } from 'vitest'
import { orderReviews } from '../review-order'

const r = (id: string, created_at: string) => ({ id, created_at })

describe('orderReviews', () => {
  it('puts pinned reviews first in pin order, then the rest newest first', () => {
    const reviews = [r('a', '2026-01-01'), r('b', '2026-03-01'), r('c', '2026-02-01'), r('d', '2026-04-01')]
    const pins = new Map([
      ['c', 0],
      ['a', 1],
    ])
    expect(orderReviews(reviews, pins).map((x) => x.id)).toEqual(['c', 'a', 'd', 'b'])
  })

  it('handles no reviews — the loading render calls it with none', () => {
    expect(orderReviews([], new Map())).toEqual([])
  })

  it('does not mutate its input', () => {
    const reviews = [r('a', '2026-01-01'), r('b', '2026-02-01')]
    orderReviews(reviews, new Map())
    expect(reviews.map((x) => x.id)).toEqual(['a', 'b'])
  })
})
