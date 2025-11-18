import { describe, expect, it } from 'vitest'
import { getScore } from '../score'
import type { IPIPAnswer, IPIPDomain } from '../types'

const createAnswer = (overrides: Partial<IPIPAnswer>): IPIPAnswer => ({
  id: overrides.id ?? 'question-1',
  domain: overrides.domain ?? 'A',
  facet: overrides.facet ?? 1,
  score: overrides.score ?? 3,
})

describe('getScore', () => {
  it('aggregates scores by domain and facet using the default handler', () => {
    const answers: IPIPAnswer[] = [
      createAnswer({ id: 'A-1', domain: 'A', facet: 1, score: 5 }),
      createAnswer({ id: 'A-2', domain: 'A', facet: 2, score: 4 }),
      createAnswer({ id: 'E-1', domain: 'E', facet: 1, score: 2 }),
    ]

    const scores = getScore({ answers })

    expect(scores.A.score).toBe(9)
    expect(scores.A.count).toBe(2)
    expect(scores.A.result).toBe('high')
    expect(scores.A.facet['1']).toMatchObject({ score: 5, count: 1, result: 'high' })
    expect(scores.A.facet['2']).toMatchObject({ score: 4, count: 1, result: 'high' })

    expect(scores.E.score).toBe(2)
    expect(scores.E.count).toBe(1)
    expect(scores.E.result).toBe('low')
  })

  it('supports overriding the classification handler', () => {
    const answers: IPIPAnswer[] = [
      createAnswer({ id: 'N-1', domain: 'N', facet: 1, score: 2 }),
      createAnswer({ id: 'N-2', domain: 'N', facet: 2, score: 3 }),
    ]

    const scores = getScore({
      answers,
      calcHandler: (score, count) => {
        const average = score / count
        if (average >= 2.5) return 'custom-high'
        if (average <= 1.5) return 'custom-low'
        return 'custom-neutral'
      },
    })

    expect(scores.N.result).toBe('custom-high')
    expect(scores.N.score).toBe(5)
    expect(scores.N.count).toBe(2)
  })

  it('aggregates duplicate facet answers into the same bucket', () => {
    const answers: IPIPAnswer[] = [
      createAnswer({ id: 'C-1', domain: 'C', facet: 3, score: 4 }),
      createAnswer({ id: 'C-1', domain: 'C', facet: 3, score: 2 }),
    ]

    const scores = getScore({ answers })

    expect(scores.C.facet['3']).toMatchObject({ score: 6, count: 2, result: 'neutral' })
    expect(scores.C.count).toBe(2)
    expect(scores.C.score).toBe(6)
    expect(scores.C.result).toBe('neutral')
  })
})


