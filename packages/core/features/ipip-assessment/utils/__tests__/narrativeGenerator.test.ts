import { describe, expect, it } from 'vitest'
import type { IPIPDomain, IPIPScore, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { generateOverallSummary } from '../narrativeGenerator'

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

describe('generateOverallSummary', () => {
  it('stitches together top domain narratives and modifier sentences', () => {
    const scores = createScores({
      A: { score: 118, count: 24, result: 'high' },
      O: { score: 115, count: 24, result: 'high' },
      N: { score: 96, count: 24, result: 'high' },
      C: { score: 108, count: 24, result: 'high' },
    })

    const summary = generateOverallSummary(scores)

    expect(summary).toContain('Your high level of Agreeableness indicates')
    expect(summary).toContain('Your score on Openness to Experience is high')
    expect(summary).toContain('Your elevated neuroticism suggests you may experience stress more intensely')
    expect(summary).toContain('Your high conscientiousness indicates strong reliability')
    expect(summary).toContain('Your openness to experience reflects creativity')
    expect(summary).toContain('Together, these traits shape how you approach challenges')
  })

  it('falls back to the balanced-profile copy when no domains are scored', () => {
    const scores = createScores({
      A: { score: 0, count: 0, result: 'neutral' },
      E: { score: 0, count: 0, result: 'neutral' },
      N: { score: 0, count: 0, result: 'neutral' },
      C: { score: 0, count: 0, result: 'neutral' },
      O: { score: 0, count: 0, result: 'neutral' },
    })

    const summary = generateOverallSummary(scores)

    expect(summary).toBe(
      'Your personality profile shows a balanced approach across all domains, allowing you to adapt flexibly to different situations and challenges.',
    )
  })

  it('generates a meaningful summary when only a single domain has responses', () => {
    const scores = createScores({
      A: { score: 120, count: 24, result: 'high' },
      E: { score: 0, count: 0, result: 'neutral' },
      N: { score: 0, count: 0, result: 'neutral' },
      C: { score: 0, count: 0, result: 'neutral' },
      O: { score: 0, count: 0, result: 'neutral' },
    })

    const summary = generateOverallSummary(scores)

    expect(summary).toContain('Your high level of Agreeableness indicates')
    expect(summary).toContain('Together, these traits shape how you approach challenges')
  })

  it('orders the opening narrative by the highest average scores, not domain order', () => {
    const scores = createScores({
      C: { score: 120, count: 24, result: 'high' }, // average 5.0
      O: { score: 110, count: 24, result: 'high' }, // average ≈ 4.58
      A: { score: 90, count: 24, result: 'high' }, // average 3.75
    })

    const summary = generateOverallSummary(scores)

    expect(summary.startsWith('Your score on Conscientiousness is high.')).toBe(true)
    expect(summary).toContain('Your score on Openness to Experience is high')
  })
})


