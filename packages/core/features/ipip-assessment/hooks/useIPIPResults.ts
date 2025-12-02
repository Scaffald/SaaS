import type { IPIPAnswer, IPIPScores } from '@app/core/features/personality-assessment/lib/ipip'
import { getResults, getScore } from '@app/core/features/personality-assessment/lib/ipip'
import { api } from '@app/core/utils/api'
import { useMemo } from 'react'
import { normalizeScores } from '../utils/scoreNormalizer.ts'

const RESULTS_STALE_TIME_MS = 1000 * 60 * 5 // 5 minutes
const RESULTS_CACHE_TIME_MS = 1000 * 60 * 30 // 30 minutes

export interface IPIPResultsData {
  scores: IPIPScores | null
  normalizedScores: ReturnType<typeof normalizeScores> | null
  narratives: ReturnType<typeof getResults> | null
  archetype: {
    name: string
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
  isComplete: boolean
  completedDomains: number
  nextAvailableAt: string | null | undefined
  isLoading: boolean
  error: Error | null
  hasPartialResults: boolean
  scoringError: Error | null
  normalizationError: Error | null
  narrativeError: Error | null
}

/**
 * Hook to fetch and process IPIP assessment results
 */
export function useIPIPResults(): IPIPResultsData {
  const {
    data: assessment,
    isLoading: assessmentLoading,
    error: assessmentError,
  } = api.personalityAssessment.getAssessmentStatus.useQuery(undefined, {
    staleTime: RESULTS_STALE_TIME_MS,
    gcTime: RESULTS_CACHE_TIME_MS,
    refetchOnWindowFocus: false,
  })

  const { data: archetypeData, isLoading: archetypeLoading } =
    api.personalityAssessment.getArchetype.useQuery(undefined, {
      enabled: !!assessment?.ipip_completed_at,
      staleTime: RESULTS_STALE_TIME_MS,
      gcTime: RESULTS_CACHE_TIME_MS,
      refetchOnWindowFocus: false,
    })

  const answers = (assessment?.ipip_answers as IPIPAnswer[]) || []
  const isComplete = answers.length >= 120
  const completedDomains = Math.floor(answers.length / 24)
  const hasPartialResults = answers.length > 0 && answers.length < 120

  // Calculate scores if we have answers
  const scoresResult = useMemo<{ scores: IPIPScores | null; error: Error | null }>(() => {
    if (answers.length === 0) return { scores: null, error: null }
    try {
      const calculatedScores = getScore({ answers })
      return { scores: calculatedScores, error: null }
    } catch (error) {
      console.error('Error calculating IPIP scores:', error)
      const scoringError =
        error instanceof Error ? error : new Error('Failed to calculate personality scores')
      return { scores: null, error: scoringError }
    }
  }, [answers])

  const scores = scoresResult.scores
  const scoringError = scoresResult.error

  // Normalize scores to 0-100 scale
  const normalizedResult = useMemo(() => {
    if (!scores) return { normalizedScores: null, error: null }
    try {
      const normalized = normalizeScores(scores)
      return { normalizedScores: normalized, error: null }
    } catch (error) {
      console.error('Error normalizing scores:', error)
      const normalizationError =
        error instanceof Error ? error : new Error('Failed to normalize scores')
      return { normalizedScores: null, error: normalizationError }
    }
  }, [scores])

  const normalizedScores = normalizedResult.normalizedScores
  const normalizationError = normalizedResult.error

  // Load narrative content
  const narrativeResult = useMemo(() => {
    try {
      const loadedNarratives = getResults()
      return { narratives: loadedNarratives, error: null }
    } catch (error) {
      console.error('Error loading narratives:', error)
      const narrativeError =
        error instanceof Error ? error : new Error('Failed to load narrative content')
      return { narratives: null, error: narrativeError }
    }
  }, [])

  const narratives = narrativeResult.narratives
  const narrativeError = narrativeResult.error

  // Format archetype data
  const archetype = useMemo(() => {
    if (!archetypeData) return null

    return {
      name: archetypeData.archetype || '',
      confidence: archetypeData.confidence || 0,
      details: archetypeData.details,
    }
  }, [archetypeData])

  return {
    scores,
    normalizedScores,
    narratives,
    archetype,
    isComplete,
    completedDomains,
    nextAvailableAt: assessment?.next_available_at,
    isLoading: assessmentLoading || archetypeLoading,
    error: assessmentError as Error | null,
    hasPartialResults,
    scoringError,
    normalizationError,
    narrativeError,
  }
}
