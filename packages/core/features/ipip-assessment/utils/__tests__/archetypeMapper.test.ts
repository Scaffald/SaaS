import { describe, expect, it } from 'vitest'
import type { IPIPDomain, IPIPScore, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { getAllArchetypeScores, mapToArchetype } from '../archetypeMapper'

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

describe('archetypeMapper', () => {
  it('selects the archetype with the highest weighted confidence', () => {
    const scores = createScores({
      C: { score: 120, count: 24, result: 'high' },
      O: { score: 120, count: 24, result: 'high' },
      E: { score: 24, count: 24, result: 'low' },
    })

    const result = mapToArchetype(scores)

    expect(result.archetype).toBe('Maker')
    expect(result.confidence).toBe(100)
  })

  it('prefixes the archetype name with "Evolving" when confidence is below 60%', () => {
    const scores = createScores({
      O: { score: 120, count: 24, result: 'high' },
      E: { score: 72, count: 24, result: 'neutral' },
      C: { score: 72, count: 24, result: 'neutral' },
    })

    const result = mapToArchetype(scores)

    expect(result.archetype).toBe('Evolving Innovator')
    expect(result.confidence).toBeLessThan(60)
  })

  it('returns sorted archetype match data for debugging/analysis', () => {
    const scores = createScores({
      A: { score: 120, count: 24, result: 'high' },
      E: { score: 120, count: 24, result: 'high' },
    })

    const archetypeScores = getAllArchetypeScores(scores)

    expect(archetypeScores).toHaveLength(8)
    // Scores should be sorted in descending order
    expect(archetypeScores[0].score).toBeGreaterThanOrEqual(archetypeScores[1].score)
  })
})


