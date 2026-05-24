import type { IPIPAnswer, IPIPDomain } from '@scf/core/features/personality-assessment/lib/ipip'
import * as scoreModule from '@scf/core/features/personality-assessment/lib/ipip/score'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as normalizerModule from '../../utils/scoreNormalizer'
import { useIPIPResults } from '../useIPIPResults'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const assessmentQueryResult: {
  data:
    | {
        ipip_answers: IPIPAnswer[]
        ipip_completed_at?: string | null
        next_available_at?: string | null
      }
    | undefined
  isLoading: boolean
  error: Error | null
} = {
  data: undefined,
  isLoading: false,
  error: null,
}

const archetypeQueryResult: {
  data: {
    archetype: string | null
    confidence: number
    details: {
      name: string
      description: string
      strengths: string[]
      work_styles: string
      team_dynamics: string
      growth_areas: string[]
    } | null
  } | null
  isLoading: boolean
} = {
  data: null,
  isLoading: false,
}

const mockGetAssessmentStatus = vi.fn(() => assessmentQueryResult)
const mockGetArchetype = vi.fn(() => archetypeQueryResult)

// Hook now uses '@scf/core/utils/personality-assessment-sdk-hooks'.
vi.mock('@scf/core/utils/personality-assessment-sdk-hooks', () => ({
  useAssessmentStatus: () => mockGetAssessmentStatus(),
  useGetArchetype: () => mockGetArchetype(),
}))

const DOMAINS: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']

const createDomainAnswers = (domain: IPIPDomain, score = 4, count = 24): IPIPAnswer[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${domain}-${index}`,
    domain,
    facet: (index % 6) + 1,
    score,
  }))

const createFullAssessmentAnswers = (): IPIPAnswer[] =>
  DOMAINS.flatMap((domain, domainIndex) => createDomainAnswers(domain, domainIndex + 2))

const baseResultState = {
  scores: null,
  normalizedScores: null,
  narratives: null,
  archetype: null,
  isComplete: false,
  completedDomains: 0,
  nextAvailableAt: null,
  isLoading: false,
  error: null,
  hasPartialResults: false,
  scoringError: null,
  normalizationError: null,
  narrativeError: null,
}

describe('useIPIPResults', () => {
  beforeEach(() => {
    assessmentQueryResult.data = undefined
    assessmentQueryResult.isLoading = false
    assessmentQueryResult.error = null
    archetypeQueryResult.data = null
    archetypeQueryResult.isLoading = false
    mockGetAssessmentStatus.mockClear()
    mockGetArchetype.mockClear()
  })

  it('returns fallback state when user has no answers yet', () => {
    assessmentQueryResult.data = {
      ipip_answers: [],
      next_available_at: null,
    }

    const { result } = renderHook(() => useIPIPResults(), { wrapper: TestQueryWrapper })

    expect(result.current).toMatchObject({
      ...baseResultState,
      narratives: expect.any(Object),
    })
  })

  it('calculates domain counts and normalized scores for partial progress', () => {
    const answers = createDomainAnswers('A', 4)
    assessmentQueryResult.data = {
      ipip_answers: answers,
      next_available_at: null,
    }

    const { result } = renderHook(() => useIPIPResults(), { wrapper: TestQueryWrapper })

    expect(result.current.completedDomains).toBe(1)
    expect(result.current.hasPartialResults).toBe(true)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.scores?.A.count).toBe(24)
    expect(result.current.scores?.A.result).toBe('high')
    expect(result.current.normalizedScores?.A.percentage).toBeCloseTo(75)
  })

  it('formats archetype data when the assessment is complete', () => {
    assessmentQueryResult.data = {
      ipip_answers: createFullAssessmentAnswers(),
      ipip_completed_at: '2024-01-01T00:00:00.000Z',
      next_available_at: '2024-02-01T00:00:00.000Z',
    }
    archetypeQueryResult.data = {
      archetype: 'Navigator',
      confidence: 68,
      details: {
        name: 'Navigator',
        description: 'Guides teams through change',
        strengths: ['Communication'],
        work_styles: 'Collaborative',
        team_dynamics: 'Brings energy',
        growth_areas: ['Delegation'],
      },
    }

    const { result } = renderHook(() => useIPIPResults(), { wrapper: TestQueryWrapper })

    expect(result.current.isComplete).toBe(true)
    expect(result.current.completedDomains).toBe(5)
    expect(result.current.archetype).toEqual({
      name: 'Navigator',
      confidence: 68,
      details: archetypeQueryResult.data.details,
    })
  })

  it('captures scoring errors without crashing the hook', () => {
    assessmentQueryResult.data = {
      ipip_answers: createDomainAnswers('A', 4),
    }
    const scoreSpy = vi.spyOn(scoreModule, 'getScore').mockImplementation(() => {
      throw new Error('scoring failed')
    })

    const { result } = renderHook(() => useIPIPResults(), { wrapper: TestQueryWrapper })

    expect(result.current.scoringError?.message).toBe('scoring failed')
    expect(result.current.scores).toBeNull()
    expect(result.current.hasPartialResults).toBe(true)

    scoreSpy.mockRestore()
  })

  it('captures normalization errors when score conversion fails', () => {
    assessmentQueryResult.data = {
      ipip_answers: createDomainAnswers('A', 3),
    }
    const normalizeSpy = vi.spyOn(normalizerModule, 'normalizeScores').mockImplementation(() => {
      throw new Error('normalize failed')
    })

    const { result } = renderHook(() => useIPIPResults(), { wrapper: TestQueryWrapper })

    expect(result.current.normalizationError?.message).toBe('normalize failed')
    expect(result.current.normalizedScores).toBeNull()
    expect(result.current.scores?.A.count).toBe(24)

    normalizeSpy.mockRestore()
  })
})
