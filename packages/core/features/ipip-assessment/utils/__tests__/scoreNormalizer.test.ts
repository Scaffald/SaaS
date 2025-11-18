import { describe, expect, it } from 'vitest'
import type { IPIPDomain, IPIPScore, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { normalizeScores } from '../scoreNormalizer'

const createFacetScore = (): IPIPScore['facet'] => ({
  1: { score: 0, count: 0, result: 'neutral' },
  2: { score: 0, count: 0, result: 'neutral' },
  3: { score: 0, count: 0, result: 'neutral' },
  4: { score: 0, count: 0, result: 'neutral' },
  5: { score: 0, count: 0, result: 'neutral' },
  6: { score: 0, count: 0, result: 'neutral' },
})

const createScores = (
  overrides: Partial<Record<IPIPDomain, { score: number; count: number; result: IPIPScore['result'] }>>,
): IPIPScores => {
  const domains: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']

  return domains.reduce<Record<IPIPDomain, IPIPScore>>((acc, domain) => {
    const override = overrides[domain]
    acc[domain] = {
      score: override?.score ?? 0,
      count: override?.count ?? 0,
      result: override?.result ?? 'neutral',
      facet: createFacetScore(),
    }
    return acc
  }, {} as Record<IPIPDomain, IPIPScore>) as IPIPScores
}

describe('normalizeScores', () => {
  it('converts raw averages (1-5) into 0-100 percentages', () => {
    const scores = createScores({
      A: { score: 96, count: 24, result: 'high' }, // average = 4 -> 75%
      E: { score: 72, count: 24, result: 'neutral' }, // average = 3 -> 50%
      N: { score: 24, count: 24, result: 'low' }, // average = 1 -> 0%
    })

    const normalized = normalizeScores(scores)

    expect(normalized.A).toMatchObject({ percentage: 75, average: 4, result: 'high' })
    expect(normalized.E).toMatchObject({ percentage: 50, average: 3, result: 'neutral' })
    expect(normalized.N).toMatchObject({ percentage: 0, average: 1, result: 'low' })
  })

  it('clamps averages outside the 1-5 range before converting', () => {
    const scores = createScores({
      C: { score: 200, count: 24, result: 'high' }, // average > 5
      O: { score: 0, count: 24, result: 'low' }, // average < 1
    })

    const normalized = normalizeScores(scores)

    expect(normalized.C.percentage).toBe(100)
    expect(normalized.C.average).toBe(5)
    expect(normalized.O.percentage).toBe(0)
    expect(normalized.O.average).toBe(1)
  })

  it('returns neutral 50% scores when a domain has zero answers', () => {
    const scores = createScores({
      A: { score: 0, count: 0, result: 'neutral' },
    })

    const normalized = normalizeScores(scores)

    expect(normalized.A.percentage).toBe(50)
    expect(normalized.A.average).toBe(3)
    expect(normalized.A.result).toBe('neutral')
  })
})


